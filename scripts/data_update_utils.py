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
        official_name = extract_string_property(body, "officialName")
        capitals = parse_string_list_property(body, "capitals")
        aliases = parse_string_list_property(body, "aliases")

        if slug:
            country["slug"] = slug

        if official_name:
            country["officialName"] = official_name

        if capitals:
            country["capitals"] = capitals

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


def write_data_bundle(output_path: Path, result: dict) -> Path:
    write_json(output_path, result)
    return write_ranking_data(output_path, result)


def write_ranking_data(output_path: Path, result: dict) -> Path:
    ranking_output_dir = get_ranking_output_dir(output_path)
    manifest, data_by_indicator = build_ranking_data(result)
    remove_legacy_ranking_data(output_path)
    ranking_output_dir.mkdir(parents=True, exist_ok=True)
    expected_json_paths = {ranking_output_dir / "manifest.json"}

    for indicator_id, data_by_year in data_by_indicator.items():
        for year, year_data in data_by_year.items():
            year_path = ranking_output_dir / indicator_id / f"{year}.json"
            write_json(year_path, year_data)
            expected_json_paths.add(year_path)

    write_json(ranking_output_dir / "manifest.json", manifest)
    remove_stale_ranking_data(ranking_output_dir, expected_json_paths)
    return ranking_output_dir / "manifest.json"


def get_ranking_output_dir(output_path: Path) -> Path:
    return output_path.parent / "rankings" / output_path.stem


def build_ranking_data(result: dict) -> tuple[dict, dict[str, dict[str, dict]]]:
    values_by_indicator_and_year: dict[str, dict[str, dict[str, float | int]]] = {}
    years_by_indicator: dict[str, set[int]] = {}

    for country_code, economy in result["economies"].items():
        for indicator_id, series in economy["series"].items():
            for year, value in get_numeric_points(series.get("values", {})):
                years_by_indicator.setdefault(indicator_id, set()).add(int(year))
                year_values = values_by_indicator_and_year.setdefault(indicator_id, {}).setdefault(year, {})
                year_values[country_code] = value

    years = sorted({year for indicator_years in years_by_indicator.values() for year in indicator_years})
    manifest = {
        "schemaVersion": 1,
        "dataKind": "ranking-manifest",
        "source": result.get("source", {}),
        "years": years,
        "yearsByIndicator": {
            indicator_id: sorted(indicator_years)
            for indicator_id, indicator_years in sorted(years_by_indicator.items())
        },
        "yearPathTemplate": "./{indicator}/{year}.json",
    }
    data_by_indicator = {
        indicator_id: {
            year: {
                "schemaVersion": 1,
                "dataKind": "ranking-year",
                "indicatorId": indicator_id,
                "year": int(year),
                "valuesByCountry": dict(sorted(values_by_country.items())),
            }
            for year, values_by_country in sorted(data_by_year.items(), key=lambda item: int(item[0]))
        }
        for indicator_id, data_by_year in sorted(values_by_indicator_and_year.items())
    }
    return manifest, data_by_indicator


def get_numeric_points(values: dict) -> list[tuple[str, float | int]]:
    return sorted(
        (
            (str(year), value)
            for year, value in values.items()
            if str(year).isdigit() and isinstance(value, (float, int)) and not isinstance(value, bool)
        ),
        key=lambda point: int(point[0]),
    )


def remove_legacy_ranking_data(output_path: Path) -> None:
    legacy_output_path = output_path.parent / "rankings" / output_path.name

    if legacy_output_path.exists():
        legacy_output_path.unlink()


def remove_stale_ranking_data(ranking_output_dir: Path, expected_json_paths: set[Path]) -> None:
    for json_path in ranking_output_dir.rglob("*.json"):
        if json_path not in expected_json_paths:
            json_path.unlink()

    for directory in sorted(ranking_output_dir.rglob("*"), reverse=True):
        if directory.is_dir():
            try:
                directory.rmdir()
            except OSError:
                pass


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
