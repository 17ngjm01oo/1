#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from data_update_utils import (
    format_path_for_log,
    get_external_id,
    load_countries,
    normalize_number,
    print_data_source_summary,
    write_data_bundle,
)

ROOT_DIR = Path(__file__).resolve().parents[1]
API_BASE_URL = "https://api.worldbank.org/v2"
DATASET_ID = "World Development Indicators"
IMF_WEO_PATH = ROOT_DIR / "data" / "weo" / "current-prices.json"
DATASETS = {
    "total-reserves": {
        "outputPath": ROOT_DIR / "data" / "world-bank" / "total-reserves.json",
        "sourceUrl": "https://data.worldbank.org/indicator/FI.RES.TOTL.CD",
        "indicators": {
            "FI.RES.TOTL.CD": {
                "label": "Total Reserves",
                "slug": "total-reserves",
                "description": "Total reserves including gold, current U.S. dollars",
                "scale": "Units",
                "unit": "US dollar",
            },
        },
    },
    "population-demographics": {
        "outputPath": ROOT_DIR / "data" / "world-bank" / "population-demographics.json",
        "sourceUrl": "https://databank.worldbank.org/source/world-development-indicators",
        "indicators": {
            "SP.POP.TOTL": {
                "label": "Population",
                "slug": "population",
                "description": "Population, total",
                "scale": "Units",
                "unit": "Persons",
            },
            "SP.DYN.LE00.IN": {
                "label": "Life Expectancy",
                "slug": "life-expectancy",
                "description": "Life expectancy at birth, total",
                "scale": "Units",
                "unit": "",
            },
            "SP.DYN.TFRT.IN": {
                "label": "Fertility Rate",
                "slug": "fertility-rate",
                "description": "Fertility rate, total",
                "scale": "Units",
                "unit": "",
            },
            "SM.POP.TOTL": {
                "label": "Immigrants",
                "slug": "immigrants",
                "description": "International migrant stock, total",
                "scale": "Units",
                "unit": "Persons",
            },
            "SM.POP.TOTL.ZS": {
                "label": "Immigrants (% of Population)",
                "slug": "immigrants-percent-population",
                "description": "International migrant stock, percent of population",
                "scale": "Units",
                "unit": "%",
            },
            "EN.POP.DNST": {
                "label": "Population Density",
                "slug": "population-density",
                "description": "Population density",
                "scale": "Units",
                "unit": "/km²",
            },
        },
        "supplementalSeries": {
            "SP.POP.TOTL": {
                "path": IMF_WEO_PATH,
                "indicatorId": "LP",
                "valueMultiplier": 1_000_000,
                "countries": ["TWN"],
                "source": {
                    "provider": "IMF",
                    "dataset": "World Economic Outlook",
                    "notes": [
                        "Source: Taiwan population from IMF World Economic Outlook.",
                    ],
                },
            },
        },
    },
    "environment": {
        "outputPath": ROOT_DIR / "data" / "world-bank" / "environment.json",
        "sourceUrl": "https://databank.worldbank.org/source/world-development-indicators",
        "indicators": {
            "AG.LND.FRST.ZS": {
                "label": "Forest Area",
                "slug": "forest-area",
                "description": "Forest area, percent of land area",
                "scale": "Units",
                "unit": "%",
            },
            "EN.GHG.CO2.MT.CE.AR5": {
                "label": "CO2 Emissions",
                "slug": "co2-emissions",
                "description": "Carbon dioxide emissions excluding LULUCF, Mt CO2e",
                "scale": "Units",
                "unit": "Mt CO2e",
            },
            "EN.GHG.CO2.PC.CE.AR5": {
                "label": "CO2 Emissions per Capita",
                "slug": "co2-emissions-per-capita",
                "description": "Carbon dioxide emissions excluding LULUCF per capita, t CO2e/capita",
                "scale": "Units",
                "unit": "t CO2e/capita",
            },
        },
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from World Bank World Development Indicators.",
    )
    parser.add_argument(
        "--dataset",
        choices=sorted(DATASETS),
        default="total-reserves",
        help="World Bank dataset bundle to build. Default: total-reserves.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Output JSON path. Defaults to the selected dataset bundle path.",
    )
    args = parser.parse_args()

    dataset_config = DATASETS[args.dataset]
    output_path = args.output or dataset_config["outputPath"]
    result = build_normalized_world_bank_json(dataset_config)
    ranking_output_path = write_data_bundle(output_path, result)
    print(f"Wrote {format_path_for_log(output_path)}")
    print(f"Wrote {format_path_for_log(ranking_output_path)}")
    print_summary(result)


def build_normalized_world_bank_json(dataset_config: dict) -> dict:
    countries = load_countries()
    source_countries = fetch_world_bank_countries()
    source_country_labels = {country["id"]: country["name"] for country in source_countries}
    values_by_indicator = {
        indicator_code: build_values_by_source_country(fetch_indicator_rows(indicator_code))
        for indicator_code in dataset_config["indicators"]
    }
    years = collect_years(values_by_indicator)
    country_mapping, unmatched_countries = build_country_mapping(countries, source_country_labels)
    economies: dict[str, dict] = {}
    missing_target_series: list[dict] = []

    for country in countries:
        source_code = country_mapping.get(country["code"])

        if not source_code:
            continue

        economy = {
            "name": country["name"],
            "sourceCode": source_code,
            "sourceName": source_country_labels.get(source_code, ""),
            "series": {},
        }

        for indicator_code, indicator in dataset_config["indicators"].items():
            values = values_by_indicator[indicator_code].get(source_code, {})

            if values:
                economy["series"][indicator_code] = {
                    "seriesCode": f"{source_code}.{indicator_code}.A",
                    "indicatorId": indicator_code,
                    "indicator": indicator["description"],
                    "scale": indicator["scale"],
                    "unit": indicator["unit"],
                    "latestActualAnnualData": max(values, key=int),
                    "values": values,
                }
            else:
                missing_target_series.append({
                    "economyCode": country["code"],
                    "economyName": country["name"],
                    "sourceCode": source_code,
                    "indicatorId": indicator_code,
                })

        if economy["series"]:
            economies[country["code"]] = economy

    add_supplemental_series(economies, countries, dataset_config, set(years))

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "World Bank",
            "dataset": DATASET_ID,
            "sourceUrl": dataset_config["sourceUrl"],
            "apiUrls": {
                indicator_code: build_api_url(f"country/all/indicator/{indicator_code}", {"format": "json", "per_page": 20000})
                for indicator_code in dataset_config["indicators"]
            },
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": int(years[0]) if years else None,
            "endYear": int(years[-1]) if years else None,
            "years": years,
        },
        "indicators": dataset_config["indicators"],
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(country_mapping),
            "unmatchedCountries": unmatched_countries,
            "missingTargetSeries": missing_target_series,
        },
    }


def add_supplemental_series(
    economies: dict[str, dict],
    countries: list[dict],
    dataset_config: dict,
    dataset_years: set[str],
) -> None:
    country_names = {country["code"]: country["name"] for country in countries}

    for indicator_code, supplemental_config in dataset_config.get("supplementalSeries", {}).items():
        source_data = json.loads(supplemental_config["path"].read_text(encoding="utf-8"))
        source_indicator_id = supplemental_config["indicatorId"]
        value_multiplier = supplemental_config.get("valueMultiplier", 1)

        for country_code in supplemental_config["countries"]:
            source_series = source_data.get("economies", {}).get(country_code, {}).get("series", {}).get(source_indicator_id)
            if not source_series or not source_series.get("values"):
                raise RuntimeError(f"Supplemental series {source_indicator_id} was not found for {country_code}.")

            values = {}
            for year, value in source_series["values"].items():
                normalized_value = normalize_number(value)
                if year in dataset_years and normalized_value is not None:
                    values[year] = normalize_number(normalized_value * value_multiplier)
            indicator = dataset_config["indicators"][indicator_code]
            economy = economies.setdefault(country_code, {
                "name": country_names.get(country_code, country_code),
                "sourceCode": country_code,
                "sourceName": country_names.get(country_code, country_code),
                "series": {},
            })
            economy["series"][indicator_code] = {
                "seriesCode": f"{country_code}.{indicator_code}.A",
                "indicatorId": indicator_code,
                "indicator": indicator["description"],
                "scale": indicator["scale"],
                "unit": indicator["unit"],
                "latestActualAnnualData": max(values, key=int),
                "values": values,
                "sourceOverride": supplemental_config["source"],
            }


def fetch_world_bank_countries() -> list[dict]:
    return fetch_world_bank_page("country/all", {"format": "json", "per_page": 400})


def fetch_indicator_rows(indicator_code: str) -> list[dict]:
    return fetch_world_bank_page(
        f"country/all/indicator/{indicator_code}",
        {"format": "json", "per_page": 20000},
    )


def fetch_world_bank_page(path: str, query: dict[str, str | int]) -> list[dict]:
    rows: list[dict] = []
    page = 1
    pages = 1

    while page <= pages:
        page_query = query | {"page": page}
        url = build_api_url(path, page_query)
        request = Request(url, headers={"User-Agent": "Codex World Bank data updater"})
        print(f"Fetching {url}")

        with urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))

        if not isinstance(payload, list) or len(payload) < 2:
            raise RuntimeError(f"Unexpected World Bank API response for {url}")

        metadata = payload[0] or {}
        pages = int(metadata.get("pages") or pages)
        rows.extend(payload[1] or [])
        page += 1

    return rows


def build_api_url(path: str, query: dict[str, str | int]) -> str:
    return f"{API_BASE_URL}/{path}?{urlencode(query)}"


def build_values_by_source_country(rows: list[dict]) -> dict[str, dict[str, float | int]]:
    values_by_country: dict[str, dict[str, float | int]] = {}

    for row in rows:
        country_id = row.get("countryiso3code") or row.get("country", {}).get("id")
        year = row.get("date")
        value = normalize_number(row.get("value"))

        if not country_id or not year or value is None:
            continue

        values_by_country.setdefault(country_id, {})[year] = value

    return {
        country_id: dict(sorted(values.items(), key=lambda item: int(item[0])))
        for country_id, values in values_by_country.items()
    }


def collect_years(values_by_indicator: dict[str, dict[str, dict[str, float | int]]]) -> list[str]:
    years = {
        int(year)
        for values_by_source_country in values_by_indicator.values()
        for values in values_by_source_country.values()
        for year in values
        if year.isdigit()
    }
    return [str(year) for year in sorted(years)]


def build_country_mapping(
    countries: list[dict],
    source_country_labels: dict[str, str],
) -> tuple[dict[str, str], list[dict[str, str]]]:
    labels_to_codes = {label: code for code, label in source_country_labels.items()}
    mapping: dict[str, str] = {}
    unmatched: list[dict[str, str]] = []

    for country in countries:
        country_code = country["code"]
        source_code = get_external_id(country, "worldBank", "countryId")

        if source_code and source_code not in source_country_labels:
            unmatched.append({
                "countryCode": country_code,
                "countryName": country["name"],
                "sourceCode": source_code,
                "reason": "World Bank external ID was not found in source data",
            })
            continue

        if source_code is None:
            if country_code in source_country_labels:
                source_code = country_code
            else:
                source_code = labels_to_codes.get(country["name"])

        if source_code:
            mapping[country_code] = source_code
        else:
            unmatched.append({
                "countryCode": country_code,
                "countryName": country["name"],
            })

    return mapping, unmatched


def print_summary(result: dict) -> None:
    print_data_source_summary(result)


if __name__ == "__main__":
    main()
