#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="services-trade",
            title_suffix="Services Exports, Imports and Trade Balance",
            chart_title="Services Exports, Imports and Trade Balance by Country",
            subtitle="",
            generated_label="services trade",
            related_nav_label="Services trade page navigation",
            source_note=UNCTAD_SOURCE_NOTE,
            data_note="",
            indicators=(
                IndicatorBlockConfig(
                    series_id="servicesTradeBalance",
                    title="Services Trade Balance",
                    canvas_label="Services trade balance line chart",
                    display_unit="USD",
                    compare_label="Services Trade Balance",
                ),
                IndicatorBlockConfig(
                    series_id="servicesExports",
                    title="Services Exports",
                    canvas_label="Services exports line chart",
                    display_unit="USD",
                    compare_label="Services Exports",
                ),
                IndicatorBlockConfig(
                    series_id="servicesImports",
                    title="Services Imports",
                    canvas_label="Services imports line chart",
                    display_unit="USD",
                    compare_label="Services Imports",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
