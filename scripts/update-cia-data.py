#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from data_update_utils import (
    format_path_for_log,
    get_external_id,
    load_countries,
    print_data_source_summary,
    write_json,
)

ROOT_DIR = Path(__file__).resolve().parents[1]
TREE_URL = "https://api.github.com/repos/factbook/factbook.json/git/trees/master?recursive=1"
RAW_BASE_URL = "https://raw.githubusercontent.com/factbook/factbook.json/master"
SOURCE_URL = "https://www.cia.gov/the-world-factbook/"
DATASET_ID = "The World Factbook"
SNAPSHOT_YEAR = "2025"
AREA_INDICATOR_CODE = "CIA.AREA.K2"

SPECIAL_CIA_PROFILE_IDS = {
    "CIV": "iv",
    "COD": "cg",
    "COG": "cf",
    "FLK": "fk",
    "SHN": "sh",
    "TWN": "tw",
    "VAT": "vt",
    "VIR": "vq",
    "WBG": "we+gz",
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from CIA World Factbook data.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT_DIR / "data" / "cia" / "area.json",
        help="Output JSON path. Defaults to data/cia/area.json.",
    )
    args = parser.parse_args()

    result = build_normalized_cia_area_json()
    write_json(args.output, result)
    print(f"Wrote {format_path_for_log(args.output)}")
    print_summary(result)


def build_normalized_cia_area_json() -> dict:
    countries = load_countries()
    profiles = fetch_factbook_profiles()
    profile_by_id = {profile["sourceCode"]: profile for profile in profiles}
    profile_by_name = build_profile_name_index(profiles)
    economies: dict[str, dict] = {}
    unmatched_countries: list[dict[str, str]] = []
    missing_target_series: list[dict[str, str]] = []

    for country in countries:
        if country["code"] == "G001":
            continue

        profile = get_profile_for_country(country, profile_by_id, profile_by_name)

        if not profile:
            unmatched_countries.append({
                "countryCode": country["code"],
                "countryName": country["name"],
            })
            continue

        area_value = profile.get("areaValue") if "areaValue" in profile else parse_sq_km(profile["areaText"])

        if area_value is None:
            missing_target_series.append({
                "economyCode": country["code"],
                "economyName": country["name"],
                "sourceCode": profile["sourceCode"],
                "indicatorId": AREA_INDICATOR_CODE,
            })
            continue

        economies[country["code"]] = {
            "name": country["name"],
            "sourceCode": profile["sourceCode"],
            "sourceName": profile["sourceName"],
            "series": {
                AREA_INDICATOR_CODE: {
                    "seriesCode": f"{profile['sourceCode']}.{AREA_INDICATOR_CODE}.A",
                    "indicatorId": AREA_INDICATOR_CODE,
                    "indicator": "Area, total, square kilometers",
                    "scale": "Units",
                    "unit": "km²",
                    "latestActualAnnualData": SNAPSHOT_YEAR,
                    "values": {SNAPSHOT_YEAR: area_value},
                },
            },
        }

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "CIA",
            "dataset": DATASET_ID,
            "sourceUrl": SOURCE_URL,
            "apiUrls": {
                "repositoryTree": TREE_URL,
                "profiles": RAW_BASE_URL,
            },
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Snapshot",
            "startYear": int(SNAPSHOT_YEAR),
            "endYear": int(SNAPSHOT_YEAR),
            "years": [SNAPSHOT_YEAR],
        },
        "indicators": {
            AREA_INDICATOR_CODE: {
                "label": "Area",
                "slug": "area",
                "description": "Area, total, square kilometers",
                "scale": "Units",
                "unit": "km²",
            },
        },
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(economies),
            "unmatchedCountries": unmatched_countries,
            "missingTargetSeries": missing_target_series,
        },
    }


def fetch_factbook_profiles() -> list[dict]:
    tree = fetch_json(TREE_URL)["tree"]
    paths = [
        item["path"]
        for item in tree
        if item["path"].endswith(".json")
        and "/" in item["path"]
        and not item["path"].startswith("meta/")
    ]
    profiles: list[dict] = []

    for path in sorted(paths):
        profile = fetch_json(f"{RAW_BASE_URL}/{path}")
        source_code = Path(path).stem
        source_name = get_profile_name(profile) or source_code
        area_text = get_area_total_text(profile)

        profiles.append({
            "sourceCode": source_code,
            "sourceName": source_name,
            "path": path,
            "names": get_profile_names(profile),
            "areaText": area_text,
            "areaValue": get_area_value(profile),
        })

    return profiles


def fetch_json(url: str) -> dict:
    request = Request(url, headers={"User-Agent": "Codex CIA Factbook data updater"})
    print(f"Fetching {url}")

    with urlopen(request, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def build_profile_name_index(profiles: list[dict]) -> dict[str, list[dict]]:
    index: dict[str, list[dict]] = {}

    for profile in profiles:
        for name in profile["names"]:
            normalized_name = normalize_name(name)

            if normalized_name:
                index.setdefault(normalized_name, []).append(profile)

    return index


def get_profile_for_country(country: dict, profile_by_id: dict[str, dict], profile_by_name: dict[str, list[dict]]) -> dict | None:
    source_code = get_external_id(country, "cia", "countryId") or SPECIAL_CIA_PROFILE_IDS.get(country["code"])

    if source_code:
        if "+" in source_code:
            return combine_profiles(source_code, profile_by_id)

        return profile_by_id.get(source_code)

    matches: dict[str, dict] = {}

    for name in [country["name"], country.get("officialName", ""), *country.get("aliases", [])]:
        for profile in profile_by_name.get(normalize_name(name), []):
            matches[profile["sourceCode"]] = profile

    if len(matches) == 1:
        return next(iter(matches.values()))

    return None


def combine_profiles(source_code: str, profile_by_id: dict[str, dict]) -> dict | None:
    profile_ids = source_code.split("+")
    profiles = [profile_by_id.get(profile_id) for profile_id in profile_ids]

    if any(profile is None for profile in profiles):
        return None

    area_values = [profile.get("areaValue") if "areaValue" in profile else parse_sq_km(profile["areaText"]) for profile in profiles]

    if any(value is None for value in area_values):
        return None

    return {
        "sourceCode": source_code,
        "sourceName": " + ".join(profile["sourceName"] for profile in profiles),
        "path": " + ".join(profile["path"] for profile in profiles),
        "names": [name for profile in profiles for name in profile["names"]],
        "areaText": " + ".join(profile["areaText"] for profile in profiles),
        "areaValue": sum(area_values),
    }


def get_profile_name(profile: dict) -> str | None:
    names = get_profile_names(profile)
    return names[0] if names else None


def get_profile_names(profile: dict) -> list[str]:
    country_name = profile.get("Government", {}).get("Country name", {})
    names: list[str] = []

    for key in (
        "conventional short form",
        "conventional long form",
        "local short form",
        "local long form",
        "abbreviation",
    ):
        value = country_name.get(key)

        if isinstance(value, dict) and value.get("text"):
            name = html.unescape(value["text"]).strip()

            if name.lower() != "none":
                names.append(name)

    return names


def get_area_total_text(profile: dict) -> str:
    return get_area_entry_text(profile, "total")


def get_area_value(profile: dict) -> float | int | None:
    total_value = parse_sq_km(get_area_entry_text(profile, "total"))

    if total_value != 0:
        return total_value

    land_value = parse_sq_km(get_area_entry_text(profile, "land"))
    water_value = parse_sq_km(get_area_entry_text(profile, "water"))

    if land_value is None and water_value is None:
        return total_value

    component_total = (land_value or 0) + (water_value or 0)

    if component_total > 0:
        return int(component_total) if float(component_total).is_integer() else component_total

    return total_value


def get_area_entry_text(profile: dict, entry_name: str) -> str:
    area = profile.get("Geography", {}).get("Area", {})

    for key, value in area.items():
        if key.strip().lower() == entry_name and isinstance(value, dict):
            return value.get("text", "")

    return ""


def parse_sq_km(value: str) -> float | int | None:
    match = re.search(r"([0-9][0-9,]*(?:\.[0-9]+)?)\s*(million\s+)?sq\s*km", value)

    if not match:
        return None

    number = float(match.group(1).replace(",", ""))
    if match.group(2):
        number *= 1_000_000

    return int(number) if number.is_integer() else number


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower().replace("&", " and ")
    value = re.sub(
        r"\b(the|republic of|democratic republic of|federated states of|state of|islamic republic of|kingdom of|commonwealth of|federal republic of)\b",
        " ",
        value,
    )
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def print_summary(result: dict) -> None:
    print_data_source_summary(result, (AREA_INDICATOR_CODE,))


if __name__ == "__main__":
    main()
