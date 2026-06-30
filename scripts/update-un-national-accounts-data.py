#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path

from country_page_generator import COUNTRIES_FILE, ROOT_DIR


SOURCE_URL = (
    "https://data.un.org/Handlers/DownloadHandler.ashx?"
    "DataFilter=grID:201;currID:NCU;pcFlag:0&DataMartId=SNAAMA&Format=CSV"
)
OUTPUT_PATH = ROOT_DIR / "data" / "un-national-accounts" / "gva-by-industry.json"
TOTAL_ITEM = "Total Value Added"
EXCLUDED_ITEMS = {
    # Manufacturing is included in Mining, Manufacturing, Utilities.
    "Manufacturing (ISIC D)",
    TOTAL_ITEM,
}
SECTORS = (
    {
        "id": "agriculture",
        "label": "Agriculture, forestry & fishing",
        "sourceItem": "Agriculture, hunting, forestry, fishing (ISIC A-B)",
    },
    {
        "id": "industry",
        "label": "Mining, manufacturing & utilities",
        "sourceItem": "Mining, Manufacturing, Utilities (ISIC C-E)",
    },
    {
        "id": "construction",
        "label": "Construction",
        "sourceItem": "Construction (ISIC F)",
    },
    {
        "id": "tradeHotels",
        "label": "Trade, restaurants & hotels",
        "sourceItem": "Wholesale, retail trade, restaurants and hotels (ISIC G-H)",
    },
    {
        "id": "transportCommunication",
        "label": "Transport & communication",
        "sourceItem": "Transport, storage and communication (ISIC I)",
    },
    {
        "id": "other",
        "label": "Finance, real estate & other services",
        "sourceItem": "Other Activities (ISIC J-P)",
    },
)
UN_COUNTRY_ALIASES = {
    "Bolivia (Plurinational State of)": "Bolivia",
    "Brunei Darussalam": "Brunei",
    "China (mainland)": "China",
    "China, Hong Kong SAR": "Hong Kong",
    "China, Macao Special Administrative Region": "Macao",
    "Congo": "Republic of the Congo",
    "Côte d'Ivoire": "Côte d’Ivoire",
    "Democratic People's Republic of Korea": "North Korea",
    "Iran, Islamic Republic of": "Iran",
    "Kingdom of Eswatini": "Eswatini",
    "Lao People's Democratic Republic": "Laos",
    "Micronesia (Federated States of)": "Federated States of Micronesia",
    "Republic of Korea": "South Korea",
    "Republic of Moldova": "Moldova",
    "Republic of North Macedonia": "North Macedonia",
    "Russian Federation": "Russia",
    "Sao Tome and Principe": "São Tomé and Príncipe",
    "Sint Maarten (Dutch part)": "Sint Maarten",
    "State of Palestine": "Palestine",
    "Syrian Arab Republic": "Syria",
    "Türkiye": "Türkiye",
    "United Kingdom of Great Britain and Northern Ireland": "United Kingdom",
    "United Republic of Tanzania: Mainland": "Tanzania",
    "United States": "United States",
    "Venezuela (Bolivarian Republic of)": "Venezuela",
    "Viet Nam": "Vietnam",
}


def main() -> None:
    args = parse_args()
    csv_text = read_source_csv(args.source_zip)
    countries = parse_country_names(COUNTRIES_FILE.read_text(encoding="utf-8"))
    result = build_result(csv_text, countries)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print_summary(result)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Update UN National Accounts GVA by industry shares.")
    parser.add_argument(
        "--source-zip",
        type=Path,
        help="Use a previously downloaded UNdata ZIP instead of downloading it.",
    )
    return parser.parse_args()


def read_source_csv(source_zip: Path | None) -> str:
    if source_zip:
        zip_bytes = source_zip.read_bytes()
    else:
        with urllib.request.urlopen(SOURCE_URL) as response:
            zip_bytes = response.read()

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as archive:
        csv_names = [name for name in archive.namelist() if name.lower().endswith(".csv")]
        if len(csv_names) != 1:
            raise RuntimeError(f"Expected exactly one CSV in UNdata ZIP, found {len(csv_names)}.")
        return archive.read(csv_names[0]).decode("utf-8-sig")


def parse_country_names(source: str) -> dict[str, str]:
    countries: dict[str, str] = {}
    for match in re.finditer(
        r'\{\s*code:\s*"(?P<code>[^"]+)",\s*name:\s*"(?P<name>[^"]+)",\s*slug:\s*"(?P<slug>[^"]+)"',
        source,
    ):
        countries[match.group("name")] = match.group("code")
    return countries


def build_result(csv_text: str, countries: dict[str, str]) -> dict:
    sector_by_source_item = {sector["sourceItem"]: sector for sector in SECTORS}
    values_by_country_and_year: dict[str, dict[int, dict[str, float]]] = {}
    unmatched_countries: set[str] = set()

    for row in csv.DictReader(io.StringIO(csv_text)):
        country_code = get_country_code(row["Country or Area"], countries)
        if not country_code:
            unmatched_countries.add(row["Country or Area"])
            continue

        year = int(row["Year"])
        item = row["Item"]
        if item in EXCLUDED_ITEMS:
            if item == TOTAL_ITEM:
                values_by_country_and_year.setdefault(country_code, {}).setdefault(year, {})[TOTAL_ITEM] = parse_value(row["Value"])
            continue
        if item not in sector_by_source_item:
            continue

        values_by_country_and_year.setdefault(country_code, {}).setdefault(year, {})[item] = parse_value(row["Value"])

    economies = {}
    for country_code, values_by_year in sorted(values_by_country_and_year.items()):
        latest = get_latest_complete_year(values_by_year)
        if not latest:
            continue
        year, values = latest
        total_value = values[TOTAL_ITEM]
        economies[country_code] = {
            "year": year,
            "totalValue": total_value,
            "shares": [
                {
                    "id": sector["id"],
                    "label": sector["label"],
                    "sourceItem": sector["sourceItem"],
                    "value": values[sector["sourceItem"]],
                    "share": values[sector["sourceItem"]] / total_value * 100,
                }
                for sector in SECTORS
            ],
        }

    return {
        "schemaVersion": 1,
        "dataKind": "un-national-accounts-gva-by-industry",
        "source": "UNdata National Accounts Estimates of Main Aggregates",
        "sourceUrl": SOURCE_URL,
        "measure": "Gross Value Added by Kind of Economic Activity at current prices - National currency",
        "currency": "National currency",
        "sectors": list(SECTORS),
        "economies": economies,
        "matchedCountries": len(economies),
        "unmatchedSourceCountries": sorted(unmatched_countries),
    }


def get_country_code(source_name: str, countries: dict[str, str]) -> str | None:
    country_name = UN_COUNTRY_ALIASES.get(source_name, source_name)
    return countries.get(country_name)


def parse_value(value: str) -> float:
    return float(value.replace(",", ""))


def get_latest_complete_year(values_by_year: dict[int, dict[str, float]]) -> tuple[int, dict[str, float]] | None:
    required_items = {sector["sourceItem"] for sector in SECTORS} | {TOTAL_ITEM}
    for year, values in sorted(values_by_year.items(), reverse=True):
        if required_items.issubset(values) and values[TOTAL_ITEM] > 0:
            return year, values
    return None


def print_summary(result: dict) -> None:
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT_DIR)}")
    print(f"Matched countries: {result['matchedCountries']}")
    print(f"Unmatched source countries: {len(result['unmatchedSourceCountries'])}")


if __name__ == "__main__":
    main()
