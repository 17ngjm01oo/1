#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="inflation-rate",
            title_suffix="Inflation Rate",
            chart_title="Inflation Rate Chart by Country",
            subtitle=(
                "Select a country to view historical inflation rate trends. "
                "Inflation rate is the annual percentage change in the consumer price index."
            ),
            generated_label="inflation rate",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="inflationRate",
                    title="Inflation Rate",
                    canvas_label="Inflation Rate line chart",
                    compare_label="Inflation Rate",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
