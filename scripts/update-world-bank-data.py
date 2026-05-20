#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parents[1]
COUNTRIES_JS = ROOT_DIR / "src" / "countries.js"
OUTPUT_PATH = ROOT_DIR / "data" / "world-bank" / "total-reserves.json"
API_BASE_URL = "https://api.worldbank.org/v2"
SOURCE_URL = "https://data.worldbank.org/indicator/FI.RES.TOTL.CD"
DATASET_ID = "World Development Indicators"
TARGET_INDICATORS = {
    "FI.RES.TOTL.CD": {
        "label": "Total Reserves Including Gold",
        "slug": "total-reserves-including-gold",
        "description": "Total reserves including gold, current U.S. dollars",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from World Bank World Development Indicators.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    args = parser.parse_args()

    result = build_normalized_world_bank_json()
    write_json(args.output, result)
    print(f"Wrote {format_path_for_log(args.output)}")
    print_summary(result)


def build_normalized_world_bank_json() -> dict:
    countries = parse_countries(COUNTRIES_JS.read_text(encoding="utf-8"))
    source_countries = fetch_world_bank_countries()
    source_country_labels = {country["id"]: country["name"] for country in source_countries}
    indicator_rows = fetch_indicator_rows("FI.RES.TOTL.CD")
    values_by_source_country = build_values_by_source_country(indicator_rows)
    years = collect_years(values_by_source_country)
    country_mapping, unmatched_countries = build_country_mapping(countries, source_country_labels)
    economies: dict[str, dict] = {}
    missing_target_series: list[dict] = []

    for country in countries:
        source_code = country_mapping.get(country["code"])

        if not source_code:
            continue

        values = values_by_source_country.get(source_code, {})
        economy = {
            "name": country["name"],
            "sourceCode": source_code,
            "sourceName": source_country_labels.get(source_code, ""),
            "series": {},
        }

        if values:
            economy["series"]["FI.RES.TOTL.CD"] = {
                "seriesCode": f"{source_code}.FI.RES.TOTL.CD.A",
                "indicatorId": "FI.RES.TOTL.CD",
                "indicator": "Total reserves including gold, current U.S. dollars",
                "scale": "Units",
                "unit": "US dollar",
                "latestActualAnnualData": max(values, key=int),
                "values": values,
            }
        else:
            missing_target_series.append({
                "economyCode": country["code"],
                "economyName": country["name"],
                "sourceCode": source_code,
                "indicatorId": "FI.RES.TOTL.CD",
            })

        if economy["series"]:
            economies[country["code"]] = economy

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "World Bank",
            "dataset": DATASET_ID,
            "sourceUrl": SOURCE_URL,
            "apiUrl": build_api_url("country/all/indicator/FI.RES.TOTL.CD", {"format": "json", "per_page": 20000}),
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": int(years[0]) if years else None,
            "endYear": int(years[-1]) if years else None,
            "years": years,
        },
        "indicators": TARGET_INDICATORS,
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(country_mapping),
            "unmatchedCountries": unmatched_countries,
            "missingTargetSeries": missing_target_series,
        },
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


def collect_years(values_by_source_country: dict[str, dict[str, float | int]]) -> list[str]:
    years = {
        int(year)
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


def parse_countries(source: str) -> list[dict]:
    countries: list[dict] = []

    for match in re.finditer(r"^\s*\{(?P<body>.+)\},?\s*$", source, flags=re.MULTILINE):
        body = match.group("body")
        code = extract_string_property(body, "code")
        name = extract_string_property(body, "name")
        slug = extract_string_property(body, "slug")

        if not code or not name or not slug:
            continue

        countries.append({
            "code": code,
            "name": name,
            "slug": slug,
            "externalIds": parse_external_ids(body),
        })

    return countries


def extract_string_property(source: str, property_name: str) -> str | None:
    match = re.search(rf'{property_name}:\s*"([^"]+)"', source)
    return match.group(1) if match else None


def parse_external_ids(source: str) -> dict[str, dict[str, str]]:
    external_ids: dict[str, dict[str, str]] = {}

    for provider, body in re.findall(r"(\w+):\s*\{\s*([^{}]+?)\s*\}", source):
        pairs = dict(re.findall(r'(\w+):\s*"([^"]+)"', body))

        if pairs:
            external_ids[provider] = pairs

    return external_ids


def get_external_id(country: dict, provider: str, key: str) -> str | None:
    value = country.get("externalIds", {}).get(provider, {}).get(key)
    return value if value else None


def normalize_number(value: object) -> float | int | None:
    if value in (None, ""):
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number.is_integer():
        return int(number)

    return number


def write_json(output_path: Path, result: dict) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )


def print_summary(result: dict) -> None:
    economies = result["economies"]
    print(f"Economies: {len(economies)}")

    for indicator_id in TARGET_INDICATORS:
        count = sum(1 for economy in economies.values() if indicator_id in economy["series"])
        print(f"{indicator_id}: {count} economies")

    diagnostics = result["diagnostics"]
    print(f"Matched countries: {diagnostics['matchedCountries']}")
    print(f"Unmatched countries: {len(diagnostics['unmatchedCountries'])}")
    print(f"Missing target series entries: {len(diagnostics['missingTargetSeries'])}")


def format_path_for_log(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT_DIR))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    main()
