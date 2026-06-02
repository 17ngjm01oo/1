#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from xml.etree import ElementTree

from data_update_utils import format_path_for_log, normalize_number, write_data_bundle


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_PATH = ROOT_DIR / "data" / "weo" / "current-prices.json"
WEO_EXCEL_URL = (
    "https://data.imf.org/-/media/iData/External-Storage/Documents/"
    "2F78EE59F79143A7921E5E203D3AAA80/en/WEOApr2026all.xlsx"
)
WEO_VINTAGE = "April 2026"
DATASET_ID = "IMF.RES:WEO"
START_YEAR = 1980
END_YEAR = 2026
TARGET_INDICATORS = {
    "NGDP": {
        "label": "GDP, current prices",
        "description": "Gross domestic product (GDP), Current prices, domestic currency",
    },
    "NGDPD": {
        "label": "GDP, current prices",
        "description": "Gross domestic product (GDP), Current prices, US dollar",
    },
    "NGDPPC": {
        "label": "GDP per capita, current prices",
        "description": "Gross domestic product (GDP), Current prices, Per capita, domestic currency",
    },
    "NGDPDPC": {
        "label": "GDP per capita, current prices",
        "description": "Gross domestic product (GDP), Current prices, Per capita, US dollar",
    },
    "NGDP_R": {
        "label": "Real GDP, constant prices",
        "description": "Gross domestic product (GDP), Constant prices, domestic currency",
    },
    "NGDP_RPCH": {
        "label": "GDP Growth",
        "description": "Gross domestic product (GDP), Constant prices, Percent change",
    },
    "PCPIPCH": {
        "label": "Inflation Rate",
        "description": "Inflation, average consumer prices, Percent change",
    },
    "LP": {
        "label": "Population",
        "description": "Population, Persons",
    },
    "LE": {
        "label": "Employment",
        "description": "Employment, Persons",
    },
    "LUR": {
        "label": "Unemployment Rate",
        "description": "Unemployment rate, Percent of total labor force",
    },
    "NGDPRPC": {
        "label": "Real GDP per capita, constant prices",
        "description": "Gross domestic product (GDP), Constant prices, Per capita, domestic currency",
    },
    "PPPGDP": {
        "label": "GDP, current prices, purchasing power parity",
        "description": "Gross domestic product based on purchasing-power-parity (PPP), current international dollar",
    },
    "PPPPC": {
        "label": "GDP per capita, current prices, purchasing power parity",
        "description": "Gross domestic product based on purchasing-power-parity (PPP) per capita GDP, current international dollar",
    },
    "BCA": {
        "label": "Current Account Balance",
        "description": "Current account balance, US dollar",
    },
    "BCA_NGDPD": {
        "label": "Current Account Balance (% of GDP)",
        "description": "Current account balance, Percent of GDP",
    },
    "GGXWDG_NGDP": {
        "label": "Government Gross Debt",
        "description": "General government gross debt, Percent of GDP",
    },
    "GGXWDN_NGDP": {
        "label": "Government Net Debt",
        "description": "General government net debt, Percent of GDP",
    },
    "GGXCNL_NGDP": {
        "label": "Fiscal Balance",
        "description": "General government net lending/borrowing, Percent of GDP",
    },
    "GGXONLB_NGDP": {
        "label": "Primary Fiscal Balance",
        "description": "General government primary net lending/borrowing, Percent of GDP",
    },
    "GGR_NGDP": {
        "label": "Government Revenue",
        "description": "General government revenue, Percent of GDP",
    },
    "GGX_NGDP": {
        "label": "Government Expenditure",
        "description": "General government total expenditure, Percent of GDP",
    },
}
SHEET_NAMES = ("Countries", "Country Groups")
GROUP_CODE_MAP = {}

SPREADSHEET_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PACKAGE_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
_CURRENCY_CODES_BY_COUNTRY: dict[str, str] | None = None


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from the IMF WEO entire dataset.",
    )
    parser.add_argument(
        "--input",
        type=Path,
        help="Use a local WEO Excel file instead of downloading it.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    args = parser.parse_args()

    excel_path = args.input or download_weo_excel()
    result = build_normalized_weo_json(excel_path)

    ranking_output_path = write_data_bundle(args.output, result)

    print(f"Wrote {format_path_for_log(args.output)}")
    print(f"Wrote {format_path_for_log(ranking_output_path)}")
    print_summary(result)


def download_weo_excel() -> Path:
    temp_dir = Path(tempfile.mkdtemp(prefix="weo-data-"))
    output_path = temp_dir / "weo.xlsx"
    request = Request(WEO_EXCEL_URL, headers={"User-Agent": "Codex WEO data updater"})

    print(f"Fetching {WEO_EXCEL_URL}")
    try:
        with urlopen(request, timeout=120) as response:
            output_path.write_bytes(response.read())
    except HTTPError as error:
        if error.code != 403:
            raise

        print("urllib received HTTP 403. Retrying with curl.")
        download_weo_excel_with_curl(output_path)

    return output_path


def download_weo_excel_with_curl(output_path: Path) -> None:
    subprocess.run(
        [
            "curl",
            "--fail",
            "--location",
            "--silent",
            "--show-error",
            "--output",
            str(output_path),
            WEO_EXCEL_URL,
        ],
        check=True,
    )


def build_normalized_weo_json(excel_path: Path) -> dict:
    years = [str(year) for year in range(START_YEAR, END_YEAR + 1)]
    economies: dict[str, dict] = {}
    missing_target_series: list[dict] = []

    with zipfile.ZipFile(excel_path) as workbook:
        shared_strings = read_shared_strings(workbook)
        sheet_paths = get_sheet_paths(workbook)

        for sheet_name in SHEET_NAMES:
            sheet_path = sheet_paths.get(sheet_name)

            if not sheet_path:
                raise RuntimeError(f"Sheet not found in WEO workbook: {sheet_name}")

            parsed_count = parse_sheet(
                workbook=workbook,
                sheet_path=sheet_path,
                shared_strings=shared_strings,
                years=years,
                economies=economies,
            )
            print(f"Parsed {parsed_count} target rows from {sheet_name}")

    for economy_code, economy in sorted(economies.items()):
        for indicator_id in TARGET_INDICATORS:
            if indicator_id not in economy["series"]:
                missing_target_series.append({
                    "economyCode": economy_code,
                    "economyName": economy["name"],
                    "indicatorId": indicator_id,
                })

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "International Monetary Fund",
            "dataset": DATASET_ID,
            "vintage": WEO_VINTAGE,
            "sourceUrl": WEO_EXCEL_URL,
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
            "missingTargetSeries": missing_target_series,
        },
    }


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


def parse_sheet(
    *,
    workbook: zipfile.ZipFile,
    sheet_path: str,
    shared_strings: list[str],
    years: list[str],
    economies: dict[str, dict],
) -> int:
    header: list[str] | None = None
    parsed_count = 0

    for _, row in ElementTree.iterparse(workbook.open(sheet_path), events=("end",)):
        if row.tag != f"{SPREADSHEET_NS}row":
            continue

        cells = row_to_values(row, shared_strings)

        if header is None:
            header = cells
            row.clear()
            continue

        if row_matches_target(cells):
            add_series_row(economies, header, cells, years)
            parsed_count += 1

        row.clear()

    return parsed_count


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
        return ""

    raw_value = value_node.text

    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)]

    return raw_value


def row_matches_target(cells: list[str]) -> bool:
    return len(cells) > 5 and cells[4] in TARGET_INDICATORS


def add_series_row(
    economies: dict[str, dict],
    header: list[str],
    cells: list[str],
    years: list[str],
) -> None:
    raw_economy_code = get_column_value(header, cells, "COUNTRY.ID")
    economy_code = GROUP_CODE_MAP.get(raw_economy_code, raw_economy_code)
    indicator_id = get_column_value(header, cells, "INDICATOR.ID")
    values = {
        year: number
        for year in years
        if (number := normalize_number(get_column_value(header, cells, year))) is not None
    }

    economy = economies.setdefault(economy_code, {
        "name": get_column_value(header, cells, "COUNTRY"),
        "sourceCode": raw_economy_code,
        "series": {},
    })

    series = {
        "seriesCode": get_column_value(header, cells, "SERIES_CODE"),
        "indicatorId": indicator_id,
        "indicator": get_column_value(header, cells, "INDICATOR"),
        "scale": get_column_value(header, cells, "SCALE"),
        "unit": get_column_value(header, cells, "UNIT"),
        "latestActualAnnualData": get_column_value(header, cells, "LATEST_ACTUAL_ANNUAL_DATA"),
        "values": values,
    }

    if indicator_id in ("NGDP", "NGDPPC", "NGDP_R", "NGDPRPC"):
        currency_code = get_currency_code(economy_code)

        if currency_code:
            series["currencyCode"] = currency_code

    economy["series"][indicator_id] = series


def get_currency_code(economy_code: str) -> str:
    global _CURRENCY_CODES_BY_COUNTRY

    if _CURRENCY_CODES_BY_COUNTRY is None:
        currency_file = ROOT_DIR / "src" / "currencyCodes.js"
        currency_source = currency_file.read_text(encoding="utf-8")
        _CURRENCY_CODES_BY_COUNTRY = {
            code: currency_code
            for code, currency_code in re.findall(
                r'^\s*([A-Z0-9]+):\s*"([A-Z]{3})",',
                currency_source,
                flags=re.MULTILINE,
            )
        }

    return _CURRENCY_CODES_BY_COUNTRY.get(economy_code, "")


def get_column_value(header: list[str], cells: list[str], column_name: str) -> str:
    try:
        index = header.index(column_name)
    except ValueError:
        return ""

    return cells[index] if index < len(cells) else ""


def print_summary(result: dict) -> None:
    economies = result["economies"]
    print(f"Economies: {len(economies)}")

    for indicator_id in TARGET_INDICATORS:
        count = sum(1 for economy in economies.values() if indicator_id in economy["series"])
        print(f"{indicator_id}: {count} economies")

    missing = result["diagnostics"]["missingTargetSeries"]
    print(f"Missing target series entries: {len(missing)}")

    world = economies.get("G001")
    if world:
        print(f"World series present: {sorted(world['series'])}")


if __name__ == "__main__":
    main()
