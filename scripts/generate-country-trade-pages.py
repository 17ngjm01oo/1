#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."

def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="trade",
            title_suffix="Exports, Imports and Trade Balance",
            chart_title="Exports, Imports and Trade Balance by Country",
            subtitle="",
            generated_label="trade",
            related_nav_label="Trade page navigation",
            source_note=UNCTAD_SOURCE_NOTE,
            data_note="",
            indicators=(
                IndicatorBlockConfig(
                    series_id="tradeBalance",
                    title="Trade Balance",
                    canvas_label="Trade balance line chart",
                    display_unit="USD",
                    compare_label="Trade Balance",
                ),
                IndicatorBlockConfig(
                    series_id="exports",
                    title="Exports",
                    canvas_label="Exports line chart",
                    display_unit="USD",
                    compare_label="Exports",
                ),
                IndicatorBlockConfig(
                    series_id="imports",
                    title="Imports",
                    canvas_label="Imports line chart",
                    display_unit="USD",
                    compare_label="Imports",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
