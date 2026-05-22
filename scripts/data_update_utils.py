from __future__ import annotations

import json
import re
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
COUNTRIES_JS = ROOT_DIR / "src" / "countries.js"


def load_countries() -> list[dict]:
    return parse_countries(COUNTRIES_JS.read_text(encoding="utf-8"))


def parse_countries(source: str) -> list[dict]:
    countries: list[dict] = []

    for match in re.finditer(r"^\s*\{(?P<body>.+)\},?\s*$", source, flags=re.MULTILINE):
        body = match.group("body")
        code = extract_string_property(body, "code")
        name = extract_string_property(body, "name")

        if not code or not name:
            continue

        country = {
            "code": code,
            "name": name,
            "externalIds": parse_external_ids(body),
        }
        slug = extract_string_property(body, "slug")
        aliases = parse_string_list_property(body, "aliases")

        if slug:
            country["slug"] = slug

        if aliases:
            country["aliases"] = aliases

        countries.append(country)

    return countries


def extract_string_property(source: str, property_name: str) -> str | None:
    match = re.search(rf'{property_name}:\s*"([^"]+)"', source)
    return match.group(1) if match else None


def parse_string_list_property(source: str, property_name: str) -> list[str]:
    match = re.search(rf"{property_name}:\s*\[([^\]]*)\]", source)
    return re.findall(r'"([^"]+)"', match.group(1)) if match else []


def parse_external_ids(source: str) -> dict[str, dict[str, str]]:
    external_ids_body = extract_object_property_body(source, "externalIds")

    if not external_ids_body:
        return {}

    external_ids: dict[str, dict[str, str]] = {}

    for provider, provider_body in re.findall(r"(\w+):\s*\{([^{}]*)\}", external_ids_body):
        pairs = dict(re.findall(r'(\w+):\s*"([^"]+)"', provider_body))

        if pairs:
            external_ids[provider] = pairs

    return external_ids


def extract_object_property_body(source: str, property_name: str) -> str:
    match = re.search(rf"{property_name}:\s*\{{", source)

    if not match:
        return ""

    start = match.end() - 1
    depth = 0

    for index in range(start, len(source)):
        if source[index] == "{":
            depth += 1
        elif source[index] == "}":
            depth -= 1

            if depth == 0:
                return source[start + 1:index]

    return ""


def get_external_id(country: dict, provider: str, key: str) -> str | None:
    value = country.get("externalIds", {}).get(provider, {}).get(key)
    return value if value else None


def normalize_number(value: object) -> float | int | None:
    if value in (None, ""):
        return None

    try:
        number = float(str(value).replace(",", ""))
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


def print_data_source_summary(result: dict, indicator_ids: list[str] | tuple[str, ...] | None = None) -> None:
    economies = result["economies"]
    print(f"Economies: {len(economies)}")

    for indicator_id in indicator_ids or result["indicators"]:
        count = sum(1 for economy in economies.values() if indicator_id in economy["series"])
        print(f"{indicator_id}: {count} economies")

    diagnostics = result.get("diagnostics", {})

    if "matchedCountries" in diagnostics:
        print(f"Matched countries: {diagnostics['matchedCountries']}")

    if "unmatchedCountries" in diagnostics:
        print(f"Unmatched countries: {len(diagnostics['unmatchedCountries'])}")

    if "missingTargetSeries" in diagnostics:
        print(f"Missing target series entries: {len(diagnostics['missingTargetSeries'])}")


def format_path_for_log(path: Path, root_dir: Path = ROOT_DIR) -> str:
    try:
        return str(path.resolve().relative_to(root_dir.resolve()))
    except ValueError:
        return str(path)
