#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parents[1]
COUNTRIES_JS = ROOT_DIR / "src" / "countries.js"
COUNTRY_API_URL = "https://api.worldbank.org/v2/country/all?format=json&per_page=400"
SPECIAL_COUNTRY_IDS = {
    "G001": "WLD",
    "KOS": "XKX",
}


def main() -> None:
    source_countries = fetch_world_bank_countries()
    source_ids = {country["id"] for country in source_countries}
    source_ids_by_name = {country["name"]: country["id"] for country in source_countries}
    source = COUNTRIES_JS.read_text(encoding="utf-8")
    updated_lines: list[str] = []
    updated_count = 0

    for line in source.splitlines():
        country = parse_country_line(line)

        if not country or "worldBank:" in line:
            updated_lines.append(line)
            continue

        world_bank_id = resolve_world_bank_id(country, source_ids, source_ids_by_name)

        if not world_bank_id:
            updated_lines.append(line)
            continue

        updated_lines.append(add_world_bank_id(line, world_bank_id))
        updated_count += 1

    COUNTRIES_JS.write_text("\n".join(updated_lines) + "\n", encoding="utf-8")
    print(f"Added World Bank country IDs to {updated_count} country entries.")


def fetch_world_bank_countries() -> list[dict]:
    request = Request(COUNTRY_API_URL, headers={"User-Agent": "Codex World Bank country ID updater"})

    with urlopen(request, timeout=120) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if not isinstance(payload, list) or len(payload) < 2:
        raise RuntimeError("Unexpected World Bank country API response.")

    return payload[1] or []


def parse_country_line(line: str) -> dict[str, str] | None:
    code = extract_string_property(line, "code")
    name = extract_string_property(line, "name")

    if not code or not name:
        return None

    return {"code": code, "name": name}


def extract_string_property(source: str, property_name: str) -> str | None:
    match = re.search(rf'{property_name}:\s*"([^"]+)"', source)
    return match.group(1) if match else None


def resolve_world_bank_id(
    country: dict[str, str],
    source_ids: set[str],
    source_ids_by_name: dict[str, str],
) -> str | None:
    country_code = country["code"]

    if country_code in SPECIAL_COUNTRY_IDS:
        return SPECIAL_COUNTRY_IDS[country_code]

    if country_code in source_ids:
        return country_code

    return source_ids_by_name.get(country["name"])


def add_world_bank_id(line: str, world_bank_id: str) -> str:
    external_ids_start = line.find("externalIds: {")

    if external_ids_start < 0:
        return line.replace(
            " region:",
            f' externalIds: {{ worldBank: {{ countryId: "{world_bank_id}" }} }}, region:',
            1,
        )

    close_index = find_matching_brace(line, line.find("{", external_ids_start))
    return (
        line[:close_index]
        + f', worldBank: {{ countryId: "{world_bank_id}" }}'
        + line[close_index:]
    )


def find_matching_brace(source: str, open_index: int) -> int:
    depth = 0

    for index in range(open_index, len(source)):
        character = source[index]

        if character == "{":
            depth += 1
        elif character == "}":
            depth -= 1

            if depth == 0:
                return index

    raise ValueError(f"Could not find matching brace in: {source}")


if __name__ == "__main__":
    main()
