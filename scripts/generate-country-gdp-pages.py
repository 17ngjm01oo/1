#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="gdp",
            title_suffix="GDP",
            chart_title="GDP Chart by Country",
            subtitle="Select a country to view historical GDP trends.",
            generated_label="GDP",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="gdp",
                    title="Nominal GDP - USD",
                    canvas_label="GDP line chart",
                    compare_label="GDP",
                ),
                IndicatorBlockConfig(
                    series_id="gdpNational",
                    title="Nominal GDP",
                    canvas_label="GDP in national currency line chart",
                ),
                IndicatorBlockConfig(
                    series_id="realGdp",
                    title="Real GDP",
                    canvas_label="Real GDP in constant national currency line chart",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
