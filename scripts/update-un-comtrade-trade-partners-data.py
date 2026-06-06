#!/usr/bin/env python3
from __future__ import annotations

import os
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
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
OUTPUT_PATH = ROOT_DIR / "data" / "un-comtrade" / "trade-partners.json"
PUBLIC_API_URL = "https://comtradeapi.un.org/public/v1/preview/C/A/HS"
FULL_API_URL = "https://comtradeapi.un.org/data/v1/get/C/A/HS"
REPORTERS_REFERENCE_URL = "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json"
PARTNERS_REFERENCE_URL = "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json"
SOURCE_URL = "https://comtrade.un.org/"
COMTRADE_KEY_ENV = "UN_COMTRADE_API_KEY"
FLOW_DEFINITIONS = {
    "X": {"id": "exports", "label": "Exports"},
    "M": {"id": "imports", "label": "Imports"},
}
TOP_PARTNER_COUNT = 5
DEFAULT_PERIODS = ("2024", "2023", "2022")
REQUEST_DELAY_SECONDS = 0.15
MAX_RECORDS = 500
REQUEST_TIMEOUT_SECONDS = 25


def main() -> None:
    result = build_trade_partners_json()
    write_json(OUTPUT_PATH, result)
    print(f"Wrote {format_path_for_log(OUTPUT_PATH)}")
    print(f"Economies: {len(result['economies'])}")
    print(f"Missing countries: {len(result['diagnostics']['missingCountries'])}")
    print(f"Truncated countries: {len(result['diagnostics']['truncatedCountries'])}")


def build_trade_partners_json() -> dict:
    countries = load_countries()
    reporter_code_by_country_code = build_reporter_code_by_country_code(countries)
    country_by_partner_code = build_country_by_partner_code(countries)
    country_by_code = {country["code"]: country for country in countries}
    reporter_countries = [
        country
        for country in countries
        if country.get("slug") and get_reporter_code(country, reporter_code_by_country_code)
    ]
    periods = get_periods()
    economies: dict[str, dict] = {}
    missing_countries: list[dict] = []
    truncated_countries: list[dict] = []

    for index, country in enumerate(reporter_countries, start=1):
        reporter_code = get_reporter_code(country, reporter_code_by_country_code)
        print(f"[{index}/{len(reporter_countries)}] {country['name']}", flush=True)

        try:
            country_result = fetch_latest_country_trade_partners(
                reporter_code,
                country_by_partner_code,
                country_by_code,
                periods,
            )
        except (HTTPError, URLError, TimeoutError) as error:
            missing_countries.append({
                "countryCode": country["code"],
                "countryName": country["name"],
                "sourceCode": reporter_code,
                "error": str(error),
            })
            country_result = None

        if country_result:
            economies[country["code"]] = {
                "name": country["name"],
                "sourceCode": reporter_code,
                **country_result["data"],
            }

            if country_result["truncated"]:
                truncated_countries.append({
                    "countryCode": country["code"],
                    "countryName": country["name"],
                    "sourceCode": reporter_code,
                    "year": country_result["data"]["year"],
                    "count": country_result["count"],
                })
        elif not any(item["countryCode"] == country["code"] for item in missing_countries):
            missing_countries.append({
                "countryCode": country["code"],
                "countryName": country["name"],
                "sourceCode": reporter_code,
            })

        if index < len(reporter_countries):
            time.sleep(REQUEST_DELAY_SECONDS)

    years = sorted({economy["year"] for economy in economies.values()})

    return {
        "schemaVersion": 1,
        "dataKind": "un-comtrade-trade-partners",
        "source": {
            "provider": "UN Comtrade",
            "dataset": "UN Comtrade Database",
            "sourceUrl": SOURCE_URL,
            "notes": [
                "Annual goods trade partner data for all commodities.",
                "Top five site-mapped partner countries are shown by trade value; all remaining partners are grouped as Other.",
            ],
            "api": {
                "url": FULL_API_URL if get_subscription_key() else PUBLIC_API_URL,
                "reportersReferenceUrl": REPORTERS_REFERENCE_URL,
                "partnersReferenceUrl": PARTNERS_REFERENCE_URL,
                "usesSubscriptionKey": bool(get_subscription_key()),
                "maxRecords": None if get_subscription_key() else MAX_RECORDS,
            },
            "retrievedAt": datetime.now(timezone.utc).isoformat(),
        },
        "coverage": {
            "frequency": "Annual",
            "startYear": years[0] if years else None,
            "endYear": years[-1] if years else None,
            "candidateYears": [int(period) for period in periods],
        },
        "economies": dict(sorted(economies.items())),
        "diagnostics": {
            "matchedCountries": len(economies),
            "missingCountries": missing_countries,
            "truncatedCountries": truncated_countries,
        },
    }


def build_reporter_code_by_country_code(countries: list[dict]) -> dict[str, str]:
    reporter_rows = fetch_reference_rows(REPORTERS_REFERENCE_URL)
    country_codes = {country["code"] for country in countries}
    reporter_code_by_country_code: dict[str, str] = {}

    for row in reporter_rows:
        country_code = row.get("reporterCodeIsoAlpha3")

        if country_code not in country_codes or row.get("isGroup") or row.get("entryExpiredDate"):
            continue

        reporter_code = normalize_number(row.get("reporterCode"))

        if isinstance(reporter_code, (int, float)):
            reporter_code_by_country_code[country_code] = str(int(reporter_code))

    return reporter_code_by_country_code


def build_country_by_partner_code(countries: list[dict]) -> dict[str, dict]:
    partner_rows = fetch_reference_rows(PARTNERS_REFERENCE_URL)
    country_by_code = {country["code"]: country for country in countries}
    country_by_partner_code: dict[str, dict] = {}

    for row in partner_rows:
        country_code = row.get("PartnerCodeIsoAlpha3")
        country = country_by_code.get(country_code)

        if not country or row.get("isGroup"):
            continue

        partner_code = normalize_number(row.get("PartnerCode"))

        if isinstance(partner_code, (int, float)):
            country_by_partner_code[str(int(partner_code))] = country

    for country in countries:
        m49 = get_external_id(country, "unctad", "m49")

        if m49 and m49 != "0000" and str(int(m49)) not in country_by_partner_code:
            country_by_partner_code[str(int(m49))] = country

    return country_by_partner_code


def fetch_reference_rows(url: str) -> list[dict]:
    request = Request(url, headers={"Accept": "application/json", "User-Agent": "Codex country profile data updater"})

    with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if isinstance(payload, dict):
        rows = payload.get("results") or payload.get("data") or []
        return rows if isinstance(rows, list) else []

    return payload if isinstance(payload, list) else []


def get_reporter_code(country: dict, reporter_code_by_country_code: dict[str, str]) -> str | None:
    if country["code"] in reporter_code_by_country_code:
        return reporter_code_by_country_code[country["code"]]

    m49 = get_external_id(country, "unctad", "m49")
    return str(int(m49)) if m49 and m49 != "0000" else None


def get_periods() -> tuple[str, ...]:
    raw_periods = os.environ.get("UN_COMTRADE_PERIODS")

    if not raw_periods:
        return DEFAULT_PERIODS

    periods = tuple(period.strip() for period in raw_periods.split(",") if period.strip())
    return periods or DEFAULT_PERIODS


def get_subscription_key() -> str | None:
    value = os.environ.get(COMTRADE_KEY_ENV)
    return value.strip() if value and value.strip() else None


def fetch_latest_country_trade_partners(
    reporter_code: str,
    country_by_partner_code: dict[str, dict],
    country_by_code: dict[str, dict],
    periods: tuple[str, ...],
) -> dict | None:
    for period in periods:
        response = fetch_comtrade_rows(reporter_code, period)
        rows = response.get("data", [])
        flow_data = build_country_flow_data(rows, country_by_partner_code, country_by_code)

        if flow_data:
            return {
                "data": {
                    "year": int(period),
                    **flow_data,
                },
                "count": response.get("count"),
                "truncated": is_response_truncated(response),
            }

    return None


def fetch_comtrade_rows(reporter_code: str, period: str) -> dict:
    subscription_key = get_subscription_key()
    query = {
        "reportercode": reporter_code,
        "period": period,
        "cmdCode": "TOTAL",
        "flowCode": ",".join(FLOW_DEFINITIONS),
        "format": "JSON",
        "breakdownMode": "classic",
        "includeDesc": "true",
    }

    if subscription_key:
        url = FULL_API_URL
        query["subscription-key"] = subscription_key
    else:
        url = PUBLIC_API_URL
        query["maxRecords"] = str(MAX_RECORDS)

    request = Request(
        f"{url}?{urlencode(query)}",
        headers={"Accept": "application/json", "User-Agent": "Codex country profile data updater"},
    )

    for attempt in range(3):
        try:
            with urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 2:
                raise
        except URLError:
            if attempt == 2:
                raise

        time.sleep(2 * (attempt + 1))

    return {}


def build_country_flow_data(
    rows: list[dict],
    country_by_partner_code: dict[str, dict],
    country_by_code: dict[str, dict],
) -> dict:
    result = {}

    for flow_code, flow_config in FLOW_DEFINITIONS.items():
        partners = build_top_partners(rows, flow_code, country_by_partner_code, country_by_code)

        if partners:
            result[flow_config["id"]] = {
                "year": get_flow_year(rows, flow_code),
                "partners": partners,
            }

    return result


def build_top_partners(
    rows: list[dict],
    flow_code: str,
    country_by_partner_code: dict[str, dict],
    country_by_code: dict[str, dict],
) -> list[dict]:
    values_by_country_code: dict[str, float] = {}
    other_value = 0.0

    for row in rows:
        if row.get("flowCode") != flow_code or str(row.get("partnerCode")) == "0":
            continue

        value = normalize_number(row.get("primaryValue"))

        if not isinstance(value, (int, float)) or value <= 0:
            continue

        partner_code = str(row.get("partnerCode"))
        partner = country_by_partner_code.get(partner_code)

        if partner:
            values_by_country_code[partner["code"]] = values_by_country_code.get(partner["code"], 0) + float(value)
        else:
            other_value += float(value)

    sorted_partners = sorted(values_by_country_code.items(), key=lambda item: item[1], reverse=True)
    top_partners = sorted_partners[:TOP_PARTNER_COUNT]
    other_value += sum(value for _, value in sorted_partners[TOP_PARTNER_COUNT:])
    total_value = sum(value for _, value in top_partners) + other_value

    if total_value <= 0:
        return []

    partners = [
        {
            "countryCode": country_code,
            "name": country_by_code[country_code]["name"],
            "value": round(value, 2),
            "share": value / total_value * 100,
        }
        for country_code, value in top_partners
    ]

    if other_value > 0:
        partners.append({
            "name": "Other",
            "value": round(other_value, 2),
            "share": other_value / total_value * 100,
            "isOther": True,
        })

    return partners


def get_flow_year(rows: list[dict], flow_code: str) -> int | None:
    for row in rows:
        if row.get("flowCode") == flow_code:
            year = normalize_number(row.get("period") or row.get("refYear"))
            return int(year) if isinstance(year, (int, float)) else None

    return None


def is_response_truncated(response: dict) -> bool:
    count = response.get("count")
    return not get_subscription_key() and isinstance(count, int) and count > MAX_RECORDS


if __name__ == "__main__":
    main()
