#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import subprocess
import tempfile
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
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
OUTPUT_PATH = ROOT_DIR / "data" / "unctad" / "services-trade.json"
UNCTAD_API_BASE_URL = "https://unctadstat-api.unctad.org"
DATASET_ID = "UNCTADSTAT:SERVICES_TRADE"
REPORT_NAME = "US.TradeServCatTotal"
VALUE_COLUMN = "US$ at current prices in millions"
TOTAL_SERVICES_CATEGORY = "S"

TARGET_INDICATORS = {
    "SERVICES_EXPORTS": {
        "label": "Services Exports",
        "slug": "services-exports",
        "description": "Services exports in current USD.",
        "flowCode": "02",
        "flowLabel": "Exports",
    },
    "SERVICES_IMPORTS": {
        "label": "Services Imports",
        "slug": "services-imports",
        "description": "Services imports in current USD.",
        "flowCode": "01",
        "flowLabel": "Imports",
    },
    "SERVICES_TRADE_BALANCE": {
        "label": "Services Trade Balance",
        "slug": "services-trade-balance",
        "description": "Services trade balance in current USD, calculated as services exports minus services imports.",
        "flowCode": "BALANCE",
        "flowLabel": "Balance",
    },
}

REPORT = {
    "title": "Services (BPM6): Exports and imports by service category, trading partner world, annual",
    "fileBlobName": "US_TradeServCatTotal",
    "csvName": "US_TradeServCatTotal.csv",
    "version": 1863,
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from UNCTAD services trade bulk files.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        help="Use a local UNCTAD 7z bulk file from this directory instead of downloading it.",
    )
    parser.add_argument(
        "--tar-bin",
        default="tar",
        help="Archive reader command used to extract UNCTAD 7z bulk files. Default: tar.",
    )
    args = parser.parse_args()

    result = build_normalized_unctad_json(args.input_dir, args.tar_bin)
    ranking_output_path = write_data_bundle(args.output, result)
    print(f"Wrote {format_path_for_log(args.output)}")
    print(f"Wrote {format_path_for_log(ranking_output_path)}")
    print_summary(result)


def build_normalized_unctad_json(input_dir: Path | None = None, tar_bin: str = "tar") -> dict:
    countries = load_countries()
    rows = read_report_rows(input_dir, tar_bin)
    years = collect_years(rows)
    economy_labels = build_economy_label_map(rows)
    country_mapping, unmatched_countries = build_country_mapping(countries, economy_labels)
    economies: dict[str, dict] = {}
    missing_target_series: list[dict] = []

    for country in countries:
        economy_code = country_mapping.get(country["code"])

        if not economy_code:
            continue

        exports = extract_indicator_values(rows=rows, economy_code=economy_code, flow_code="02")
        imports = extract_indicator_values(rows=rows, economy_code=economy_code, flow_code="01")
        balance = calculate_balance_values(exports, imports)
        values_by_indicator = {
            "SERVICES_EXPORTS": exports,
            "SERVICES_IMPORTS": imports,
            "SERVICES_TRADE_BALANCE": balance,
        }

        economy = {
            "name": country["name"],
            "sourceCode": economy_code,
            "sourceName": economy_labels.get(economy_code, ""),
            "series": {},
        }

        for indicator_id, indicator in TARGET_INDICATORS.items():
            values = values_by_indicator[indicator_id]

            if values:
                economy["series"][indicator_id] = {
                    "seriesCode": f"{economy_code}.{indicator_id}.A",
                    "indicatorId": indicator_id,
                    "indicator": f"{indicator['label']}, {VALUE_COLUMN}",
                    "scale": "Millions",
                    "unit": "US dollar",
                    "flowCode": indicator["flowCode"],
                    "flow": indicator["flowLabel"],
                    "categoryCode": TOTAL_SERVICES_CATEGORY,
                    "category": "Services",
                    "latestActualAnnualData": max(values, key=int),
                    "values": values,
                }
            else:
                missing_target_series.append({
                    "economyCode": country["code"],
                    "economyName": country["name"],
                    "sourceCode": economy_code,
                    "indicatorId": indicator_id,
                })

        if economy["series"]:
            economies[country["code"]] = economy

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "UNCTAD",
            "dataset": DATASET_ID,
            "vintage": "2025-07-23",
            "sourceUrl": "https://unctadstat.unctad.org/datacentre/",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "reports": {
                REPORT_NAME: {
                    "title": REPORT["title"],
                    "version": REPORT["version"],
                    "bulkDownloadUrl": get_bulk_download_url(),
                },
            },
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


def read_report_rows(input_dir: Path | None, tar_bin: str) -> list[dict[str, str]]:
    if input_dir:
        archive_path = find_local_archive(input_dir, REPORT["fileBlobName"])
        if not archive_path.exists():
            raise FileNotFoundError(f"UNCTAD bulk file was not found: {archive_path}")
        archive_bytes = archive_path.read_bytes()
    else:
        archive_bytes = download_bulk_file()

    csv_bytes = extract_csv_from_7z(archive_bytes, REPORT["csvName"], tar_bin)
    return list(csv.DictReader(io.StringIO(csv_bytes.decode("utf-8-sig"))))


def find_local_archive(input_dir: Path, file_blob_name: str) -> Path:
    candidates = (
        input_dir / file_blob_name,
        input_dir / f"{file_blob_name}.7z",
        input_dir / f"{file_blob_name}.csv.gz",
    )

    for candidate in candidates:
        if candidate.exists():
            return candidate

    return candidates[0]


def download_bulk_file() -> bytes:
    url = get_bulk_download_url()
    request = Request(url, headers={"User-Agent": "Codex UNCTAD data updater"})
    print(f"Fetching {url}")

    with urlopen(request, timeout=120) as response:
        return response.read()


def get_bulk_download_url() -> str:
    return f"{UNCTAD_API_BASE_URL}/bulkdownload/{REPORT_NAME}/{REPORT['fileBlobName']}"


def extract_csv_from_7z(archive_bytes: bytes, csv_name: str, tar_bin: str) -> bytes:
    with tempfile.NamedTemporaryFile(prefix="unctad-services-bulk-", suffix=".7z") as archive_file:
        archive_file.write(archive_bytes)
        archive_file.flush()

        try:
            completed = subprocess.run(
                [tar_bin, "-xOf", archive_file.name, csv_name],
                check=True,
                capture_output=True,
            )
        except FileNotFoundError as error:
            raise RuntimeError(
                f"Archive reader was not found: {tar_bin}. Install bsdtar/libarchive or pass --tar-bin."
            ) from error
        except subprocess.CalledProcessError as error:
            stderr = error.stderr.decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Failed to extract {csv_name} from UNCTAD 7z bulk file with {tar_bin}: {stderr}"
            ) from error

    return completed.stdout


def build_economy_label_map(rows: list[dict[str, str]]) -> dict[str, str]:
    return {row["Economy"]: row["Economy Label"] for row in rows}


def collect_years(rows: list[dict[str, str]]) -> list[str]:
    years = {int(row["Year"]) for row in rows if row.get("Year", "").isdigit()}
    return [str(year) for year in sorted(years)]


def build_country_mapping(
    countries: list[dict],
    economy_labels: dict[str, str],
) -> tuple[dict[str, str], list[dict[str, str]]]:
    labels_to_codes = {label: code for code, label in economy_labels.items()}
    mapping: dict[str, str] = {}
    unmatched: list[dict[str, str]] = []

    for country in countries:
        country_code = country["code"]
        economy_code = get_external_id(country, "unctad", "m49")

        if economy_code and economy_code not in economy_labels:
            unmatched.append({
                "countryCode": country_code,
                "countryName": country["name"],
                "sourceCode": economy_code,
                "reason": "UNCTAD M49 external ID was not found in source data",
            })
            continue

        if economy_code is None:
            economy_code = labels_to_codes.get(country["name"])

        if economy_code:
            mapping[country_code] = economy_code
        else:
            unmatched.append({
                "countryCode": country_code,
                "countryName": country["name"],
            })

    return mapping, unmatched


def extract_indicator_values(
    *,
    rows: list[dict[str, str]],
    economy_code: str,
    flow_code: str,
) -> dict[str, float | int]:
    values: dict[str, float | int] = {}

    for row in rows:
        if (
            row["Economy"] != economy_code
            or row["Flow"] != flow_code
            or row["Category"] != TOTAL_SERVICES_CATEGORY
        ):
            continue

        value = normalize_number(row[VALUE_COLUMN])

        if value is not None:
            values[row["Year"]] = value

    return dict(sorted(values.items(), key=lambda item: int(item[0])))


def calculate_balance_values(
    exports: dict[str, float | int],
    imports: dict[str, float | int],
) -> dict[str, float | int]:
    values: dict[str, float | int] = {}

    for year in sorted(set(exports) & set(imports), key=int):
        value = Decimal(str(exports[year])) - Decimal(str(imports[year]))
        values[year] = decimal_to_json_number(value)

    return values


def decimal_to_json_number(value: Decimal) -> float | int:
    if value == value.to_integral_value():
        return int(value)

    return float(value)


def print_summary(result: dict) -> None:
    print_data_source_summary(result, tuple(TARGET_INDICATORS))


if __name__ == "__main__":
    main()
