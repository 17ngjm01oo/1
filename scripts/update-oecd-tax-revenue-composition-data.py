#!/usr/bin/env python3
from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from data_update_utils import format_path_for_log, load_countries, normalize_number, write_json


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT_DIR / "data" / "oecd" / "tax-revenue-composition.json"
SOURCE_URL = "https://data-explorer.oecd.org/vis?lc=en&pg=0&fs[0]=Topic%2C1%7CTaxation%23TAX%23%7CTax%20revenue%23TAX_REV%23&bp=true&snb=117&df[ds]=dsDisseminateFinalDMZ&df[id]=DSD_REV_COMP_GLOBAL%40DF_RSGLOBAL&df[ag]=OECD.CTP.TPS&df[vs]=2.1&dq=..S13._T._T.PT_OTR_SECTOR.A&pd=2010%2C&to[TIME_PERIOD]=false"
API_URL = (
    "https://sdmx.oecd.org/public/rest/data/"
    "OECD.CTP.TPS,DSD_REV_COMP_GLOBAL@DF_RSGLOBAL/"
    ".TAX_REV.S13."
    "_T%2BT_1100%2BT_1200%2BT_2000%2BT_3000%2BT_4000%2BT_5000%2BT_6000."
    "_T.PT_OTR_SECTOR.A"
    "?dimensionAtObservation=AllDimensions&format=csvfilewithlabels"
)
REQUEST_TIMEOUT_SECONDS = 60
MIN_DISPLAY_SHARE = 0.05
REVENUE_CATEGORIES = (
    {
        "id": "personalIncomeTaxes",
        "sourceCode": "T_1100",
        "label": "Personal income taxes",
    },
    {
        "id": "corporateIncomeTaxes",
        "sourceCode": "T_1200",
        "label": "Corporate income taxes",
    },
    {
        "id": "socialSecurityContributions",
        "sourceCode": "T_2000",
        "label": "Social security contributions",
    },
    {
        "id": "payrollTaxes",
        "sourceCode": "T_3000",
        "label": "Payroll taxes",
    },
    {
        "id": "propertyTaxes",
        "sourceCode": "T_4000",
        "label": "Property taxes",
    },
    {
        "id": "goodsAndServicesTaxes",
        "sourceCode": "T_5000",
        "label": "Goods and services taxes",
    },
    {
        "id": "otherTaxes",
        "sourceCode": "T_6000",
        "label": "Other taxes",
    },
)


def main() -> None:
    result = build_tax_revenue_composition_json()
    write_json(OUTPUT_PATH, result)
    print(f"Wrote {format_path_for_log(OUTPUT_PATH)}")
    print(f"Economies: {len(result['economies'])}")
    print(f"Unmatched source areas: {len(result['diagnostics']['unmatchedSourceAreas'])}")


def build_tax_revenue_composition_json() -> dict:
    countries = load_countries()
    country_by_code = {country["code"]: country for country in countries if country.get("slug")}
    rows = fetch_oecd_rows()
    values_by_country_and_year: dict[str, dict[int, dict[str, float]]] = {}
    source_name_by_code: dict[str, str] = {}
    unmatched_source_areas: dict[str, str] = {}

    for row in rows:
        source_code = row.get("REF_AREA", "")
        country = country_by_code.get(source_code)

        if not country:
            if source_code:
                unmatched_source_areas[source_code] = row.get("Reference area", "")
            continue

        revenue_code = row.get("STANDARD_REVENUE", "")
        if revenue_code not in {category["sourceCode"] for category in REVENUE_CATEGORIES}:
            continue

        year = normalize_number(row.get("TIME_PERIOD"))
        value = normalize_number(row.get("OBS_VALUE"))
        if not isinstance(year, int) or not isinstance(value, (int, float)):
            continue

        source_name_by_code[source_code] = row.get("Reference area", "")
        values_by_country_and_year.setdefault(source_code, {}).setdefault(year, {})[revenue_code] = float(value)

    economies = {}
    missing_countries: list[dict] = []
    for country_code, country in sorted(country_by_code.items()):
        latest = get_latest_country_composition(values_by_country_and_year.get(country_code, {}))

        if not latest:
            missing_countries.append({
                "countryCode": country_code,
                "countryName": country["name"],
            })
            continue

        year, values = latest
        economies[country_code] = {
            "name": country["name"],
            "sourceCode": country_code,
            "sourceName": source_name_by_code.get(country_code, ""),
            "year": year,
            "shares": [
                {
                    "id": category["id"],
                    "label": category["label"],
                    "sourceCode": category["sourceCode"],
                    "share": round(values[category["sourceCode"]], 6),
                }
                for category in REVENUE_CATEGORIES
                if values.get(category["sourceCode"], 0) >= MIN_DISPLAY_SHARE
            ],
        }

    years = sorted({
        year
        for values_by_year in values_by_country_and_year.values()
        for year in values_by_year
    })

    return {
        "schemaVersion": 1,
        "dataKind": "oecd-tax-revenue-composition",
        "source": {
            "provider": "OECD",
            "dataset": "Global Revenue Statistics Database",
            "sourceUrl": SOURCE_URL,
            "apiUrl": API_URL,
            "measure": "Tax revenue by category, percentage of revenues in the same institutional sector",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": years[0] if years else None,
            "endYear": years[-1] if years else None,
        },
        "categories": list(REVENUE_CATEGORIES),
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(economies),
            "missingCountries": missing_countries,
            "unmatchedSourceAreas": [
                {"sourceCode": source_code, "sourceName": source_name}
                for source_code, source_name in sorted(unmatched_source_areas.items())
            ],
        },
    }


def fetch_oecd_rows() -> list[dict]:
    request = Request(API_URL, headers={"Accept": "text/csv", "User-Agent": "Codex country profile data updater"})

    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        csv_text = response.read().decode("utf-8-sig")

    return list(csv.DictReader(io.StringIO(csv_text)))


def get_latest_country_composition(values_by_year: dict[int, dict[str, float]]) -> tuple[int, dict[str, float]] | None:
    category_codes = tuple(category["sourceCode"] for category in REVENUE_CATEGORIES)

    for year, values in sorted(values_by_year.items(), reverse=True):
        available_values = {
            category_code: values[category_code]
            for category_code in category_codes
            if category_code in values and values[category_code] > 0
        }

        if available_values and sum(available_values.values()) > 90:
            return year, available_values

    return None


if __name__ == "__main__":
    main()
