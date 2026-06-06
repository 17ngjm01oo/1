#!/usr/bin/env python3
from __future__ import annotations

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
    write_json,
)

ROOT_DIR = Path(__file__).resolve().parents[1]
API_BASE_URL = "https://api.worldbank.org/v2"
OUTPUT_PATH = ROOT_DIR / "data" / "world-bank" / "age-composition.json"
DATASET_ID = "World Development Indicators"
SOURCE_URL = "https://databank.worldbank.org/source/world-development-indicators"
AGE_GROUPS = (
    {
        "id": "0-14",
        "label": "0–14",
        "seriesIds": ("SP.POP.0014.TO",),
    },
    {
        "id": "15-24",
        "label": "15–24",
        "seriesIds": ("SP.POP.1519.FE", "SP.POP.1519.MA", "SP.POP.2024.FE", "SP.POP.2024.MA"),
    },
    {
        "id": "25-64",
        "label": "25–64",
        "seriesIds": (
            "SP.POP.2529.FE",
            "SP.POP.2529.MA",
            "SP.POP.3034.FE",
            "SP.POP.3034.MA",
            "SP.POP.3539.FE",
            "SP.POP.3539.MA",
            "SP.POP.4044.FE",
            "SP.POP.4044.MA",
            "SP.POP.4549.FE",
            "SP.POP.4549.MA",
            "SP.POP.5054.FE",
            "SP.POP.5054.MA",
            "SP.POP.5559.FE",
            "SP.POP.5559.MA",
            "SP.POP.6064.FE",
            "SP.POP.6064.MA",
        ),
    },
    {
        "id": "65+",
        "label": "65+",
        "seriesIds": ("SP.POP.65UP.TO",),
    },
)
INDICATOR_IDS = tuple(
    dict.fromkeys(series_id for group in AGE_GROUPS for series_id in group["seriesIds"])
)


def main() -> None:
    result = build_age_composition_json()
    write_json(OUTPUT_PATH, result)
    print(f"Wrote {format_path_for_log(OUTPUT_PATH)}")
    print(f"Economies: {len(result['economies'])}")
    print(f"Unmatched countries: {len(result['diagnostics']['unmatchedCountries'])}")


def build_age_composition_json() -> dict:
    countries = load_countries()
    source_countries = fetch_world_bank_countries()
    source_country_labels = {country["id"]: country["name"] for country in source_countries}
    country_mapping, unmatched_countries = build_country_mapping(countries, source_country_labels)
    values_by_indicator = {
        indicator_id: build_values_by_source_country(fetch_indicator_rows(indicator_id))
        for indicator_id in INDICATOR_IDS
    }
    economies: dict[str, dict] = {}
    missing_countries: list[dict] = []

    for country in countries:
        source_code = country_mapping.get(country["code"])

        if not source_code:
            continue

        latest = get_latest_complete_age_composition(source_code, values_by_indicator)

        if not latest:
            missing_countries.append({
                "countryCode": country["code"],
                "countryName": country["name"],
                "sourceCode": source_code,
            })
            continue

        year, groups = latest
        total_population = sum(group["value"] for group in groups)
        economies[country["code"]] = {
            "name": country["name"],
            "sourceCode": source_code,
            "sourceName": source_country_labels.get(source_code, ""),
            "year": year,
            "totalPopulation": total_population,
            "groups": [
                {
                    "id": group["id"],
                    "label": group["label"],
                    "value": group["value"],
                    "share": group["value"] / total_population * 100,
                }
                for group in groups
            ],
        }

    years = sorted(
        {
            int(year)
            for values_by_source_country in values_by_indicator.values()
            for values in values_by_source_country.values()
            for year in values
            if year.isdigit()
        }
    )

    return {
        "schemaVersion": 1,
        "dataKind": "world-bank-age-composition",
        "source": {
            "provider": "World Bank",
            "dataset": DATASET_ID,
            "sourceUrl": SOURCE_URL,
            "notes": [
                "World Bank WDI population age and sex distributions are based on United Nations Population Division World Population Prospects: 2024 Revision.",
            ],
            "apiUrls": {
                indicator_id: build_api_url(f"country/all/indicator/{indicator_id}", {"format": "json", "per_page": 20000})
                for indicator_id in INDICATOR_IDS
            },
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": years[0] if years else None,
            "endYear": years[-1] if years else None,
        },
        "ageGroups": [
            {
                "id": group["id"],
                "label": group["label"],
                "seriesIds": list(group["seriesIds"]),
            }
            for group in AGE_GROUPS
        ],
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(country_mapping),
            "unmatchedCountries": unmatched_countries,
            "missingCountries": missing_countries,
        },
    }


def get_latest_complete_age_composition(
    source_code: str,
    values_by_indicator: dict[str, dict[str, dict[str, float | int]]],
) -> tuple[int, list[dict]] | None:
    candidate_years = {
        int(year)
        for indicator_id in INDICATOR_IDS
        for year in values_by_indicator[indicator_id].get(source_code, {})
        if year.isdigit()
    }

    for year in sorted(candidate_years, reverse=True):
        year_key = str(year)
        groups = []

        for age_group in AGE_GROUPS:
            value = sum(
                values_by_indicator[series_id].get(source_code, {}).get(year_key, 0)
                for series_id in age_group["seriesIds"]
            )

            if value <= 0:
                break

            groups.append({
                "id": age_group["id"],
                "label": age_group["label"],
                "value": value,
            })
        else:
            return year, groups

    return None


def fetch_world_bank_countries() -> list[dict]:
    return fetch_world_bank_page("country/all", {"format": "json", "per_page": 400})


def fetch_indicator_rows(indicator_id: str) -> list[dict]:
    return fetch_world_bank_page(
        f"country/all/indicator/{indicator_id}",
        {"format": "json", "per_page": 20000},
    )


def fetch_world_bank_page(path: str, query: dict[str, str | int]) -> list[dict]:
    rows: list[dict] = []
    page = 1
    pages = 1

    while page <= pages:
        url = build_api_url(path, query | {"page": page})
        request = Request(url, headers={"User-Agent": "Codex World Bank age composition data updater"})
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


def build_country_mapping(
    countries: list[dict],
    source_country_labels: dict[str, str],
) -> tuple[dict[str, str], list[dict[str, str]]]:
    labels_to_codes = {label: code for code, label in source_country_labels.items()}
    mapping: dict[str, str] = {}
    unmatched: list[dict[str, str]] = []

    for country in countries:
        source_code = get_external_id(country, "worldBank", "countryId")

        if source_code and source_code not in source_country_labels:
            unmatched.append({
                "countryCode": country["code"],
                "countryName": country["name"],
                "sourceCode": source_code,
                "reason": "World Bank external ID was not found in source data",
            })
            continue

        if source_code is None:
            if country["code"] in source_country_labels:
                source_code = country["code"]
            else:
                source_code = labels_to_codes.get(country["name"])

        if source_code:
            mapping[country["code"]] = source_code
        else:
            unmatched.append({
                "countryCode": country["code"],
                "countryName": country["name"],
            })

    return mapping, unmatched


if __name__ == "__main__":
    main()
