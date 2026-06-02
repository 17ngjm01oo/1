#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
UPDATE_SCRIPT_PATH = SCRIPT_DIR / "update-weo-data.py"
spec = importlib.util.spec_from_file_location("update_weo_data", UPDATE_SCRIPT_PATH)

if spec is None or spec.loader is None:
    raise RuntimeError(f"Could not load {UPDATE_SCRIPT_PATH}")

update_weo_data = importlib.util.module_from_spec(spec)
spec.loader.exec_module(update_weo_data)

OUTPUT_PATH = update_weo_data.OUTPUT_PATH
ROOT_DIR = update_weo_data.ROOT_DIR
build_normalized_weo_json = update_weo_data.build_normalized_weo_json
format_path_for_log = update_weo_data.format_path_for_log
print_summary = update_weo_data.print_summary
write_data_bundle = update_weo_data.write_data_bundle


DEFAULT_INPUT_PATH = ROOT_DIR / "data" / "weo" / "source" / "WEOApr2026all.xlsx"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build normalized static JSON from a manually downloaded IMF WEO Excel file.",
    )
    parser.add_argument(
        "input",
        nargs="?",
        type=Path,
        default=DEFAULT_INPUT_PATH,
        help=f"Local WEO Excel path. Default: {DEFAULT_INPUT_PATH.relative_to(ROOT_DIR)}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH.relative_to(ROOT_DIR)}",
    )
    args = parser.parse_args()

    if not args.input.exists():
        raise FileNotFoundError(
            f"Local WEO Excel file was not found: {format_path_for_log(args.input)}"
        )

    print(f"Reading local WEO Excel: {format_path_for_log(args.input)}")
    result = build_normalized_weo_json(args.input)
    ranking_output_path = write_data_bundle(args.output, result)
    print(f"Wrote {format_path_for_log(args.output)}")
    print(f"Wrote {format_path_for_log(ranking_output_path)}")
    print_summary(result)


if __name__ == "__main__":
    main()
