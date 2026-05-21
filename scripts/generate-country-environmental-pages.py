#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


PERCENT_LAND_AREA_SUBTITLE = (
    "Select a country to view historical environmental indicator trends. "
    "Values are shown as a percentage of land area."
)

ENVIRONMENTAL_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="agricultural-land-percent-of-land-area",
        title_suffix="Agricultural Land Percent of Land Area",
        chart_title="Agricultural Land Percent of Land Area Chart by Country",
        subtitle=PERCENT_LAND_AREA_SUBTITLE,
        generated_label="agricultural land percent of land area",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environmental page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="agriculturalLandPercentOfLandArea",
                title="Agricultural Land Percent of Land Area",
                canvas_label="Agricultural land percent of land area line chart",
                compare_label="Agricultural Land Percent of Land Area",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="forest-area-percent-of-land-area",
        title_suffix="Forest Area Percent of Land Area",
        chart_title="Forest Area Percent of Land Area Chart by Country",
        subtitle=PERCENT_LAND_AREA_SUBTITLE,
        generated_label="forest area percent of land area",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environmental page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="forestAreaPercentOfLandArea",
                title="Forest Area Percent of Land Area",
                canvas_label="Forest area percent of land area line chart",
                compare_label="Forest Area Percent of Land Area",
            ),
        ),
    ),
)


def main() -> None:
    for config in ENVIRONMENTAL_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
