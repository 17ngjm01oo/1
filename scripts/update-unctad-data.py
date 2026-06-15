#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import io
import subprocess
import tempfile
from datetime import datetime, timezone
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
OUTPUT_PATH = ROOT_DIR / "data" / "unctad" / "trade.json"
UNCTAD_API_BASE_URL = "https://unctadstat-api.unctad.org"
DATASET_ID = "UNCTADSTAT:TRADE"
VALUE_COLUMN = "US$ at current prices in millions"

TARGET_INDICATORS = {
    "EXPORTS": {
        "label": "Exports",
        "slug": "exports",
        "description": "Goods exports in current USD, excluding services.",
        "report": "US.TradeMerchTotal",
        "flowCode": "02",
        "flowLabel": "Exports",
    },
    "IMPORTS": {
        "label": "Imports",
        "slug": "imports",
        "description": "Goods imports in current USD, excluding services.",
        "report": "US.TradeMerchTotal",
        "flowCode": "01",
        "flowLabel": "Imports",
    },
    "TRADE_BALANCE": {
        "label": "Trade Balance",
        "slug": "trade-balance",
        "description": "Goods trade balance in current USD, calculated as goods exports minus goods imports. Services are excluded.",
        "report": "US.TradeMerchBalance",
        "flowCode": "14",
        "flowLabel": "Balance",
    },
}

REPORTS = {
    "US.TradeMerchTotal": {
        "title": "Merchandise: Total trade and share, annual",
        "fileBlobName": "US_TradeMerchTotal",
        "csvName": "US_TradeMerchTotal.csv",
        "version": 2205,
    },
    "US.TradeMerchBalance": {
        "title": "Merchandise: Trade balance, annual",
        "fileBlobName": "US_TradeMerchBalance",
        "csvName": "US_TradeMerchBalance.csv",
        "version": 2203,
    },
}

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from UNCTAD merchandise trade bulk files.",
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
        help="Use local UNCTAD 7z bulk files from this directory instead of downloading them.",
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
    report_rows = {
        report_name: read_report_rows(report_name, input_dir, tar_bin)
        for report_name in REPORTS
    }
    years = collect_years(report_rows)
    economy_labels = build_economy_label_map(report_rows)
    country_mapping, unmatched_countries = build_country_mapping(countries, economy_labels)
    economies: dict[str, dict] = {}
    missing_target_series: list[dict] = []

    for country in countries:
        economy_code = country_mapping.get(country["code"])

        if not economy_code:
            continue

        economy = {
            "name": country["name"],
            "sourceCode": economy_code,
            "sourceName": economy_labels.get(economy_code, ""),
            "series": {},
        }

        for indicator_id, indicator in TARGET_INDICATORS.items():
            values = extract_indicator_values(
                rows=report_rows[indicator["report"]],
                economy_code=economy_code,
                flow_code=indicator["flowCode"],
            )

            if values:
                economy["series"][indicator_id] = {
                    "seriesCode": f"{economy_code}.{indicator_id}.A",
                    "indicatorId": indicator_id,
                    "indicator": f"{indicator['label']}, {VALUE_COLUMN}",
                    "scale": "Millions",
                    "unit": "US dollar",
                    "flowCode": indicator["flowCode"],
                    "flow": indicator["flowLabel"],
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
            "vintage": "2026-03-19",
            "sourceUrl": "https://unctadstat.unctad.org/datacentre/",
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "reports": {
                report_name: {
                    "title": report["title"],
                    "version": report["version"],
                    "bulkDownloadUrl": get_bulk_download_url(report_name),
                }
                for report_name, report in REPORTS.items()
            },
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": int(years[0]) if years else None,
            "endYear": int(years[-1]) if years else None,
            "years": years,
        },
        "indicators": {
            indicator_id: {
                key: value
                for key, value in indicator.items()
                if key not in {"report", "flowCode", "flowLabel"}
            }
            for indicator_id, indicator in TARGET_INDICATORS.items()
        },
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(country_mapping),
            "unmatchedCountries": unmatched_countries,
            "missingTargetSeries": missing_target_series,
        },
    }


def read_report_rows(report_name: str, input_dir: Path | None, tar_bin: str) -> list[dict[str, str]]:
    report = REPORTS[report_name]

    if input_dir:
        archive_path = find_local_archive(input_dir, report["fileBlobName"])
        if not archive_path.exists():
            raise FileNotFoundError(f"UNCTAD bulk file was not found: {archive_path}")
        archive_bytes = archive_path.read_bytes()
    else:
        archive_bytes = download_bulk_file(report_name)

    csv_bytes = extract_csv_from_7z(archive_bytes, report["csvName"], tar_bin)
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


def download_bulk_file(report_name: str) -> bytes:
    url = get_bulk_download_url(report_name)
    request = Request(url, headers={"User-Agent": "Codex UNCTAD data updater"})
    print(f"Fetching {url}")

    with urlopen(request, timeout=120) as response:
        return response.read()


def get_bulk_download_url(report_name: str) -> str:
    report = REPORTS[report_name]
    return f"{UNCTAD_API_BASE_URL}/bulkdownload/{report_name}/{report['fileBlobName']}"


def extract_csv_from_7z(archive_bytes: bytes, csv_name: str, tar_bin: str) -> bytes:
    with tempfile.NamedTemporaryFile(prefix="unctad-bulk-", suffix=".7z") as archive_file:
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


def build_economy_label_map(report_rows: dict[str, list[dict[str, str]]]) -> dict[str, str]:
    economy_labels: dict[str, str] = {}

    for rows in report_rows.values():
        for row in rows:
            economy_labels[row["Economy"]] = row["Economy Label"]

    return economy_labels


def collect_years(report_rows: dict[str, list[dict[str, str]]]) -> list[str]:
    years = {
        int(row["Year"])
        for rows in report_rows.values()
        for row in rows
        if row.get("Year", "").isdigit()
    }
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
        if row["Economy"] != economy_code or row["Flow"] != flow_code:
            continue

        value = normalize_number(row[VALUE_COLUMN])

        if value is not None:
            values[row["Year"]] = value

    return dict(sorted(values.items(), key=lambda item: int(item[0])))


def print_summary(result: dict) -> None:
    print_data_source_summary(result, tuple(TARGET_INDICATORS))


if __name__ == "__main__":
    main()
