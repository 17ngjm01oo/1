#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from data_update_utils import format_path_for_log, write_ranking_data


ROOT_DIR = Path(__file__).resolve().parents[1]
SOURCE_PATHS = (
    ROOT_DIR / "data" / "weo" / "current-prices.json",
    ROOT_DIR / "data" / "unctad" / "goods-trade.json",
    ROOT_DIR / "data" / "world-bank" / "total-reserves.json",
    ROOT_DIR / "data" / "world-bank" / "population-demographics.json",
    ROOT_DIR / "data" / "world-bank" / "environment.json",
    ROOT_DIR / "data" / "cia" / "area.json",
    ROOT_DIR / "data" / "sipri" / "military-spending.json",
)


def main() -> None:
    for source_path in SOURCE_PATHS:
        result = json.loads(source_path.read_text(encoding="utf-8"))
        manifest_path = write_ranking_data(source_path, result)
        print(f"Wrote {format_path_for_log(manifest_path)}")


if __name__ == "__main__":
    main()
