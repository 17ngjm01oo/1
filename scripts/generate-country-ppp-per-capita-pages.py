#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="ppp-per-capita",
            title_suffix="PPP per capita",
            chart_title="PPP per Capita Chart by Country",
            subtitle="Select a country to view historical PPP per capita trends.",
            generated_label="PPP per capita",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="pppPerCapita",
                    title="PPP GDP per capita - Int. $",
                    canvas_label="PPP per capita line chart",
                    compare_label="PPP per capita",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
