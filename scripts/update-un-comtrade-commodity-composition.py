#!/usr/bin/env python3
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import time
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
OUTPUT_PATH = ROOT_DIR / "data" / "un-comtrade" / "commodity-composition.json"
API_BASE_URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
REPORTERS_URL = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json"
SOURCE_URL = "https://comtradeplus.un.org/"
DEFAULT_START_YEAR = 2024
DEFAULT_END_YEAR = 2019
TOP_ITEM_COUNT = 7
PARTNER_CODE_WORLD = "0"
COMMAND_CODE_HS2 = "AG2"
FLOW_CONFIGS = {
    "exports": {
        "flowCode": "X",
        "label": "Exports",
    },
    "imports": {
        "flowCode": "M",
        "label": "Imports",
    },
}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build country trade commodity composition JSON from UN Comtrade HS 2-digit data.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    parser.add_argument(
        "--start-year",
        type=int,
        default=DEFAULT_START_YEAR,
        help=f"Newest year to try first. Default: {DEFAULT_START_YEAR}.",
    )
    parser.add_argument(
        "--end-year",
        type=int,
        default=DEFAULT_END_YEAR,
        help=f"Oldest year to fall back to. Default: {DEFAULT_END_YEAR}.",
    )
    parser.add_argument(
        "--countries",
        help="Comma-separated site country codes to update, for testing or partial refreshes.",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=2,
        help="Delay in seconds between Comtrade requests. Default: 2.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=90,
        help="Request timeout in seconds. Default: 90.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Number of countries to fetch in parallel. Default: 1.",
    )
    args = parser.parse_args()

    countries = load_countries()
    if args.countries:
        requested_codes = {code.strip().upper() for code in args.countries.split(",") if code.strip()}
        countries = [country for country in countries if country["code"] in requested_codes]

    reporter_by_iso3 = fetch_reporters_by_iso3()
    result = build_comtrade_commodity_composition(
        countries,
        reporter_by_iso3,
        args.start_year,
        args.end_year,
        args.delay,
        args.timeout,
        args.workers,
    )
    write_json(args.output, result)
    print(f"Wrote {format_path_for_log(args.output)}")
    print_summary(result)


def build_comtrade_commodity_composition(
    countries: list[dict],
    reporter_by_iso3: dict[str, dict],
    start_year: int,
    end_year: int,
    delay_seconds: float,
    timeout_seconds: float,
    workers: int,
) -> dict:
    years = list(range(start_year, end_year - 1, -1))
    economies: dict[str, dict] = {}
    diagnostics = {
        "missingComtradeReporter": [],
        "missingFlows": [],
        "reporterIsoMismatches": [],
        "reporterCodeFallbacks": [],
        "requestErrors": [],
    }
    total_countries = len(countries)
    completed_countries = 0

    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = [
            executor.submit(
                process_country,
                country,
                reporter_by_iso3,
                years,
                delay_seconds,
                timeout_seconds,
            )
            for country in countries
        ]

        for future in as_completed(futures):
            country_code, economy, country_diagnostics = future.result()
            completed_countries += 1

            if economy:
                economies[country_code] = economy

            merge_diagnostics(diagnostics, country_diagnostics)

            if completed_countries == 1 or completed_countries % 10 == 0 or completed_countries == total_countries:
                print(f"Processed {completed_countries}/{total_countries} countries...", flush=True)

    coverage_years = sorted({
        int(flow["year"])
        for economy in economies.values()
        for flow in economy["flows"].values()
    })

    return {
        "schemaVersion": 1,
        "source": {
            "provider": "UN Comtrade",
            "dataset": "Comtrade Plus public preview API",
            "sourceUrl": SOURCE_URL,
            "apiUrlTemplate": build_api_url("{reporterCode}", "{period}", "{flowCode}"),
            "reportersUrl": REPORTERS_URL,
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
            "classification": "HS 2-digit commodity chapters",
            "partner": "World",
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": coverage_years[0] if coverage_years else None,
            "endYear": coverage_years[-1] if coverage_years else None,
            "years": [str(year) for year in coverage_years],
        },
        "economies": dict(sorted(economies.items())),
        "diagnostics": diagnostics,
    }


def process_country(
    country: dict,
    reporter_by_iso3: dict[str, dict],
    years: list[int],
    delay_seconds: float,
    timeout_seconds: float,
) -> tuple[str, dict | None, dict]:
    diagnostics = {
        "missingComtradeReporter": [],
        "missingFlows": [],
        "reporterIsoMismatches": [],
        "reporterCodeFallbacks": [],
        "requestErrors": [],
    }
    country_code = country["code"]
    reporter = get_reporter_for_country(country, reporter_by_iso3, diagnostics)

    if not reporter:
        diagnostics["missingComtradeReporter"].append({
            "countryCode": country_code,
            "countryName": country["name"],
        })
        return country_code, None, diagnostics

    reporter_code = str(reporter["reporterCode"])
    flows = {}
    source_names = set()
    reporter_isos = set()

    for flow_id, flow_config in FLOW_CONFIGS.items():
        composition = fetch_latest_flow_composition(
            reporter_code=reporter_code,
            flow_id=flow_id,
            flow_config=flow_config,
            years=years,
            delay_seconds=delay_seconds,
            timeout_seconds=timeout_seconds,
            diagnostics=diagnostics,
            country=country,
        )

        if composition:
            flows[flow_id] = composition
            source_names.add(composition["sourceName"])
            reporter_isos.add(composition["reporterISO"])
        else:
            diagnostics["missingFlows"].append({
                "countryCode": country_code,
                "countryName": country["name"],
                "sourceCode": reporter_code,
                "flow": flow_id,
            })

    if not flows:
        return country_code, None, diagnostics

    acceptable_iso3s = set(get_candidate_iso3s(country))
    for reporter_iso in reporter_isos:
        if reporter_iso and reporter_iso not in acceptable_iso3s:
            diagnostics["reporterIsoMismatches"].append({
                "countryCode": country_code,
                "countryName": country["name"],
                "sourceCode": reporter_code,
                "reporterISO": reporter_iso,
            })

    return country_code, {
        "name": country["name"],
        "sourceCode": reporter_code,
        "sourceISO": reporter.get("reporterCodeIsoAlpha3", ""),
        "sourceName": sorted(source_names)[0] if source_names else "",
        "flows": flows,
    }, diagnostics


def merge_diagnostics(target: dict, source: dict) -> None:
    for key, entries in source.items():
        target.setdefault(key, []).extend(entries)


def fetch_reporters_by_iso3() -> dict[str, dict]:
    request = Request(
        REPORTERS_URL,
        headers={
            "Accept": "application/json",
            "User-Agent": "Codex country profile data updater",
        },
    )

    with urlopen(request, timeout=120) as response:
        payload = json.loads(response.read().decode("utf-8"))

    reporters_by_iso3: dict[str, dict] = {}
    for reporter in payload.get("results", []):
        iso3 = str(reporter.get("reporterCodeIsoAlpha3", "")).strip().upper()

        if not iso3 or reporter.get("isGroup") or reporter.get("entryExpiredDate"):
            continue

        reporters_by_iso3.setdefault(iso3, reporter)

    return reporters_by_iso3


def get_reporter_for_country(country: dict, reporter_by_iso3: dict[str, dict], diagnostics: dict) -> dict | None:
    for iso3 in get_candidate_iso3s(country):
        reporter = reporter_by_iso3.get(iso3)

        if reporter:
            if iso3 != country["code"]:
                diagnostics["reporterCodeFallbacks"].append({
                    "countryCode": country["code"],
                    "countryName": country["name"],
                    "fallbackISO": iso3,
                    "reporterCode": reporter["reporterCode"],
                    "reporterDesc": reporter["reporterDesc"],
                })
            return reporter

    return None


def get_candidate_iso3s(country: dict) -> list[str]:
    candidate_iso3s = [country["code"]]
    world_bank_id = get_external_id(country, "worldBank", "countryId")

    if world_bank_id and len(world_bank_id) == 3 and world_bank_id not in candidate_iso3s:
        candidate_iso3s.append(world_bank_id)

    return candidate_iso3s


def fetch_latest_flow_composition(
    reporter_code: str,
    flow_id: str,
    flow_config: dict,
    years: list[int],
    delay_seconds: float,
    timeout_seconds: float,
    diagnostics: dict,
    country: dict,
) -> dict | None:
    for year in years:
        try:
            rows = fetch_comtrade_rows(reporter_code, str(year), flow_config["flowCode"], timeout_seconds)
        except Exception as error:  # noqa: BLE001
            diagnostics["requestErrors"].append({
                "countryCode": country["code"],
                "countryName": country["name"],
                "sourceCode": reporter_code,
                "year": year,
                "flow": flow_id,
                "error": str(error),
            })
            rows = []

        if delay_seconds > 0:
            time.sleep(delay_seconds)

        composition = build_flow_composition(rows, flow_id, flow_config["label"])
        if composition:
            return composition

    return None


def fetch_comtrade_rows(reporter_code: str, period: str, flow_code: str, timeout_seconds: float) -> list[dict]:
    request = Request(
        build_api_url(reporter_code, period, flow_code),
        headers={
            "Accept": "application/json",
            "User-Agent": "Codex country profile data updater",
        },
    )

    with urlopen(request, timeout=timeout_seconds) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if payload.get("error"):
        raise RuntimeError(payload["error"])

    return payload.get("data", [])


def build_api_url(reporter_code: str, period: str, flow_code: str) -> str:
    query = urlencode({
        "reporterCode": reporter_code,
        "period": period,
        "partnerCode": PARTNER_CODE_WORLD,
        "cmdCode": COMMAND_CODE_HS2,
        "flowCode": flow_code,
        "includeDesc": "true",
    })
    return f"{API_BASE_URL}?{query}"


def build_flow_composition(rows: list[dict], flow_id: str, flow_label: str) -> dict | None:
    chapter_rows = []

    for row in rows:
        command_code = str(row.get("cmdCode", ""))
        value = normalize_number(row.get("primaryValue"))

        if len(command_code) != 2 or value is None or value <= 0:
            continue

        chapter_rows.append({
            "code": command_code,
            "label": build_chapter_label(command_code, str(row.get("cmdDesc", "")).strip()),
            "value": value,
        })

    if not chapter_rows:
        return None

    chapter_rows.sort(key=lambda item: item["value"], reverse=True)
    total_value = sum(item["value"] for item in chapter_rows)
    top_items = chapter_rows[:TOP_ITEM_COUNT]
    other_value = sum(item["value"] for item in chapter_rows[TOP_ITEM_COUNT:])
    items = [build_share_item(item, total_value) for item in top_items]

    if other_value > 0:
        items.append(build_share_item({
            "code": "OTHER",
            "label": "Other",
            "value": other_value,
        }, total_value))

    first_row = chapter_rows[0]
    source_row = next((row for row in rows if str(row.get("cmdCode", "")) == first_row["code"]), rows[0])

    return {
        "flow": flow_label,
        "year": int(source_row.get("refYear") or source_row.get("period")),
        "reporterISO": source_row.get("reporterISO", ""),
        "sourceName": source_row.get("reporterDesc", ""),
        "totalValue": round(total_value, 3),
        "unit": "US dollar",
        "items": items,
    }


def build_chapter_label(code: str, description: str) -> str:
    if not description:
        return "Unspecified commodity"

    first_clause = description.split(";")[0].strip()
    return first_clause


def build_share_item(item: dict, total_value: float | int) -> dict:
    share = (item["value"] / total_value) * 100 if total_value else 0
    return {
        "code": item["code"],
        "label": item["label"],
        "value": round(item["value"], 3),
        "share": round(share, 4),
    }


def print_summary(result: dict) -> None:
    economies = result["economies"]
    print(f"Economies: {len(economies)}")
    for flow_id in FLOW_CONFIGS:
        count = sum(1 for economy in economies.values() if flow_id in economy["flows"])
        print(f"{flow_id}: {count} economies")
    for key, entries in result["diagnostics"].items():
        print(f"{key}: {len(entries)}")


if __name__ == "__main__":
    main()
