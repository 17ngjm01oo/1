#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="ppp-gdp",
            title_suffix="PPP GDP",
            chart_title="PPP GDP Chart by Country",
            subtitle="Select a country to view historical PPP trends.",
            generated_label="PPP",
            related_nav_label="Economy page navigation",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="ppp",
                    title="PPP GDP",
                    canvas_label="PPP line chart",
                    display_unit="Int$",
                    compare_label="PPP",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
