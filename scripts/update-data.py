#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT_DIR / "data" / "imf"
IMF_BASE_URL = "https://www.imf.org/external/datamapper/api/v1"
START_YEAR = 1980
END_YEAR = 2026

SERIES = [
    {
        "indicator_code": "NGDPD",
        "output_file": "nominal-gdp.json",
    },
    {
        "indicator_code": "NGDPDPC",
        "output_file": "nominal-gdp-per-capita.json",
    },
]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for series in SERIES:
        indicator_code = series["indicator_code"]
        output_path = OUTPUT_DIR / series["output_file"]
        source_url = build_imf_url(indicator_code)
        print(f"Fetching {indicator_code}: {source_url}")

        data = fetch_json(source_url)
        output_path.write_text(
            json.dumps(data, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        print(f"Wrote {output_path.relative_to(ROOT_DIR)}")


def build_imf_url(indicator_code: str) -> str:
    periods = ",".join(str(year) for year in range(START_YEAR, END_YEAR + 1))
    query_string = urlencode({"periods": periods})
    return f"{IMF_BASE_URL}/{indicator_code}?{query_string}"


def fetch_json(url: str) -> dict:
    request = Request(url, headers={"Accept": "application/json"})

    with urlopen(request, timeout=60) as response:
        body = response.read().decode("utf-8")

    return json.loads(body)


if __name__ == "__main__":
    main()
