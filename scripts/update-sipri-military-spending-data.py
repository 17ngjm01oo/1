#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
import unicodedata
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from data_update_utils import (
    format_path_for_log,
    load_countries,
    normalize_number,
    print_data_source_summary,
    write_data_bundle,
)


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT_DIR / "data" / "sipri" / "military-spending.json"
SIPRI_EXCEL_URL = "https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025_v1.2.xlsx"
SIPRI_DATABASE_URL = "https://www.sipri.org/databases/milex"
DATASET_ID = "SIPRI:MILEX"
DATASET_VINTAGE = "2026 v1.2"
START_YEAR = 1949
END_YEAR = 2025
CURRENT_USD_SCALE = 1_000_000
PERCENT_GDP_SCALE = 100

TARGET_INDICATORS = {
    "MILITARY_SPENDING_USD": {
        "label": "Military Spending",
        "description": "Military spending, current U.S. dollars",
    },
    "MILITARY_SPENDING_PERCENT_GDP": {
        "label": "Military Spending (% of GDP)",
        "description": "Military spending as a share of GDP",
    },
}

SHEETS = (
    {
        "name": "Current US$",
        "indicatorId": "MILITARY_SPENDING_USD",
        "indicator": "Military spending, current U.S. dollars",
        "unit": "US dollar",
        "scale": "Units",
        "valueMultiplier": CURRENT_USD_SCALE,
    },
    {
        "name": "Share of GDP",
        "indicatorId": "MILITARY_SPENDING_PERCENT_GDP",
        "indicator": "Military spending, percent of GDP",
        "unit": "%",
        "scale": "Units",
        "valueMultiplier": PERCENT_GDP_SCALE,
    },
)

SOURCE_NAME_OVERRIDES = {
    "Cape Verde": "CPV",
    "Congo, DR": "COD",
    "Congo, Republic": "COG",
    "Cote d'Ivoire": "CIV",
    "Gambia, The": "GMB",
    "United States of America": "USA",
    "Bolivia": "BOL",
    "Venezuela": "VEN",
    "Korea, North": "PRK",
    "Korea, South": "KOR",
    "Taiwan": "TWN",
    "Laos": "LAO",
    "Timor Leste": "TLS",
    "Viet Nam": "VNM",
    "Kyrgyz Republic": "KGZ",
    "Russia": "RUS",
    "Iran": "IRN",
    "Syria": "SYR",
    "Türkiye": "TUR",
}

IGNORED_SOURCE_NAMES = {
    "Czechoslovakia",
    "European Union",
    "USSR",
    "Yugoslavia",
}

SPREADSHEET_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PACKAGE_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from the SIPRI Military Expenditure Database.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="Use a local SIPRI Excel file instead of downloading it.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    args = parser.parse_args()

    excel_path = args.input or download_sipri_excel()
    result = build_normalized_sipri_json(excel_path)
    ranking_output_path = write_data_bundle(args.output, result)

    print(f"Wrote {format_path_for_log(args.output)}")
    print(f"Wrote {format_path_for_log(ranking_output_path)}")
    print_data_source_summary(result, tuple(TARGET_INDICATORS))


def download_sipri_excel() -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="sipri-milex-"))
    output_path = temp_dir / "sipri-milex.xlsx"
    request = Request(SIPRI_EXCEL_URL, headers={"User-Agent": "Codex SIPRI data updater"})

    print(f"Fetching {SIPRI_EXCEL_URL}")
    try:
        with urlopen(request, timeout=120) as response:
            output_path.write_bytes(response.read())
    except Exception:
        download_sipri_excel_with_curl(output_path)

    return output_path


def download_sipri_excel_with_curl(output_path: Path) -> None:
    subprocess.run(
        [
            "curl",
            "--fail",
            "--location",
            "--silent",
            "--show-error",
            "--output",
            str(output_path),
            SIPRI_EXCEL_URL,
        ],
        check=True,
    )


def build_normalized_sipri_json(excel_path: Path) -> dict:
    years = [str(year) for year in range(START_YEAR, END_YEAR + 1)]
    countries = load_countries()
    country_by_code = {country["code"]: country for country in countries}
    country_code_by_name = build_country_code_by_name(countries)
    economies: dict[str, dict] = {}
    unmatched_source_names: set[str] = set()
    ignored_source_names: set[str] = set()

    with zipfile.ZipFile(excel_path) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet_paths = get_sheet_paths(workbook)

        for sheet_config in SHEETS:
            sheet_path = sheet_paths.get(sheet_config["name"])

            if not sheet_path:
                raise RuntimeError(f"Sheet not found in SIPRI workbook: {sheet_config['name']}")

            parsed_count = parse_sheet(
                workbook=workbook,
                sheet_path=sheet_path,
                shared_strings=shared_strings,
                sheet_config=sheet_config,
                years=years,
                country_by_code=country_by_code,
                country_code_by_name=country_code_by_name,
                economies=economies,
                unmatched_source_names=unmatched_source_names,
                ignored_source_names=ignored_source_names,
            )
            print(f"Parsed {parsed_count} country rows from {sheet_config['name']}")

    missing_target_series = []
    for country_code, economy in sorted(economies.items()):
        for indicator_id in TARGET_INDICATORS:
            if indicator_id not in economy["series"]:
                missing_target_series.append({
                    "economyCode": country_code,
                    "economyName": economy["name"],
                    "indicatorId": indicator_id,
                })

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "SIPRI",
            "dataset": DATASET_ID,
            "vintage": DATASET_VINTAGE,
            "sourceUrl": SIPRI_DATABASE_URL,
            "downloadUrl": SIPRI_EXCEL_URL,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": START_YEAR,
            "endYear": END_YEAR,
            "years": years,
        },
        "indicators": TARGET_INDICATORS,
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(economies),
            "ignoredSourceNames": sorted(ignored_source_names),
            "unmatchedCountries": sorted(unmatched_source_names),
            "missingTargetSeries": missing_target_series,
        },
    }


def parse_sheet(
    *,
    workbook: zipfile.ZipFile,
    sheet_path: str,
    shared_strings: list[str],
    sheet_config: dict,
    years: list[str],
    country_by_code: dict[str, dict],
    country_code_by_name: dict[str, str],
    economies: dict[str, dict],
    unmatched_source_names: set[str],
    ignored_source_names: set[str],
) -> int:
    header: list[str] | None = None
    parsed_count = 0

    for _, row in ElementTree.iterparse(workbook.open(sheet_path), events=("end",)):
        if row.tag != f"{SPREADSHEET_NS}row":
            continue

        cells = row_to_values(row, shared_strings)

        if cells and cells[0] == "Country":
            header = cells
            row.clear()
            continue

        if header and is_country_data_row(cells):
            source_name = cells[0]
            country_code = get_country_code(source_name, country_code_by_name)

            if country_code:
                add_series(
                    economies=economies,
                    country=country_by_code[country_code],
                    source_name=source_name,
                    header=header,
                    cells=cells,
                    years=years,
                    sheet_config=sheet_config,
                )
                parsed_count += 1
            elif source_name in IGNORED_SOURCE_NAMES:
                ignored_source_names.add(source_name)
            else:
                unmatched_source_names.add(source_name)

        row.clear()

    return parsed_count


def is_country_data_row(cells: list[str]) -> bool:
    return bool(
        cells
        and cells[0]
        and cells[0] != "Country"
        and any(normalize_number(value) is not None for value in cells[2:])
    )


def add_series(
    *,
    economies: dict[str, dict],
    country: dict,
    source_name: str,
    header: list[str],
    cells: list[str],
    years: list[str],
    sheet_config: dict,
) -> None:
    indicator_id = sheet_config["indicatorId"]
    multiplier = sheet_config["valueMultiplier"]
    values = {}

    for year in years:
        number = normalize_number(get_column_value(header, cells, year))

        if number is not None:
            values[year] = round(number * multiplier, 6)

    if not values:
        return

    latest_year = max(values, key=int)
    economy = economies.setdefault(country["code"], {
        "name": country["name"],
        "sourceCode": source_name,
        "sourceName": source_name,
        "series": {},
    })

    economy["series"][indicator_id] = {
        "seriesCode": f"{source_name}.{indicator_id}.A",
        "indicatorId": indicator_id,
        "indicator": sheet_config["indicator"],
        "scale": sheet_config["scale"],
        "unit": sheet_config["unit"],
        "latestActualAnnualData": latest_year,
        "values": values,
    }


def build_country_code_by_name(countries: list[dict]) -> dict[str, str]:
    country_code_by_name = {}

    for country in countries:
        candidate_names = [
            country["name"],
            country.get("officialName", ""),
            *country.get("aliases", []),
        ]

        for name in candidate_names:
            if name:
                country_code_by_name.setdefault(normalize_name(name), country["code"])

    for source_name, country_code in SOURCE_NAME_OVERRIDES.items():
        country_code_by_name[normalize_name(source_name)] = country_code

    return country_code_by_name


def get_country_code(source_name: str, country_code_by_name: dict[str, str]) -> str | None:
    return country_code_by_name.get(normalize_name(source_name))


def normalize_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_value = ascii_value.replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", " ", ascii_value.lower()).strip()


def read_shared_strings(workbook: zipfile.ZipFile) -> list[str]:
    try:
        root = ElementTree.fromstring(workbook.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    shared_strings: list[str] = []
    for item in root.findall(f"{SPREADSHEET_NS}si"):
        text_parts = [
            text_node.text or ""
            for text_node in item.iter(f"{SPREADSHEET_NS}t")
        ]
        shared_strings.append("".join(text_parts))

    return shared_strings


def get_sheet_paths(workbook: zipfile.ZipFile) -> dict[str, str]:
    workbook_root = ElementTree.fromstring(workbook.read("xl/workbook.xml"))
    rels_root = ElementTree.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    rels = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels_root.findall(f"{PACKAGE_REL_NS}Relationship")
    }
    sheet_paths: dict[str, str] = {}

    for sheet in workbook_root.find(f"{SPREADSHEET_NS}sheets"):
        relationship_id = sheet.attrib[f"{REL_NS}id"]
        target = rels[relationship_id]
        sheet_paths[sheet.attrib["name"]] = f"xl/{target}"

    return sheet_paths


def row_to_values(row: ElementTree.Element, shared_strings: list[str]) -> list[str]:
    values_by_index: dict[int, str] = {}
    max_index = -1

    for cell in row.findall(f"{SPREADSHEET_NS}c"):
        cell_reference = cell.attrib.get("r", "")
        column_index = column_reference_to_index(cell_reference)

        if column_index is None:
            column_index = max_index + 1

        max_index = max(max_index, column_index)
        values_by_index[column_index] = get_cell_value(cell, shared_strings)

    return [values_by_index.get(index, "") for index in range(max_index + 1)]


def column_reference_to_index(cell_reference: str) -> int | None:
    match = re.match(r"([A-Z]+)", cell_reference)

    if not match:
        return None

    index = 0
    for char in match.group(1):
        index = index * 26 + (ord(char) - ord("A") + 1)

    return index - 1


def get_cell_value(cell: ElementTree.Element, shared_strings: list[str]) -> str:
    value_node = cell.find(f"{SPREADSHEET_NS}v")

    if value_node is None or value_node.text is None:
        inline_string = cell.find(f"{SPREADSHEET_NS}is")

        if inline_string is not None:
            return "".join(text.text or "" for text in inline_string.iter(f"{SPREADSHEET_NS}t"))

        return ""

    raw_value = value_node.text

    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)]

    return raw_value


def get_column_value(header: list[str], cells: list[str], column_name: str) -> str:
    try:
        index = header.index(column_name)
    except ValueError:
        return ""

    return cells[index] if index < len(cells) else ""


if __name__ == "__main__":
    main()
