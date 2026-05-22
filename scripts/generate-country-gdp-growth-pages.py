#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="gdp-growth",
            title_suffix="GDP Growth Rate",
            chart_title="GDP Growth Rate Chart by Country",
            subtitle="Select a country to view historical GDP growth rate trends.",
            generated_label="GDP growth",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="gdpGrowth",
                    title="GDP Growth Rate",
                    canvas_label="GDP Growth Rate line chart",
                    compare_label="GDP Growth Rate",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
