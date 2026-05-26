#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


ENVIRONMENTAL_SUBTITLE = "Select a country to view historical environmental indicator trends."

ENVIRONMENTAL_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="agricultural-land",
        title_suffix="Agricultural Land",
        chart_title="Agricultural Land Chart by Country",
        subtitle=ENVIRONMENTAL_SUBTITLE,
        generated_label="agricultural land percent of land area",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environmental page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="agriculturalLandPercentOfLandArea",
                title="Agricultural Land - % of Land Area",
                canvas_label="Agricultural land percent of land area line chart",
                compare_label="Agricultural Land",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="forest-area",
        title_suffix="Forest Area",
        chart_title="Forest Area Chart by Country",
        subtitle=ENVIRONMENTAL_SUBTITLE,
        generated_label="forest area percent of land area",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environmental page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="forestAreaPercentOfLandArea",
                title="Forest Area - % of Land Area",
                canvas_label="Forest area percent of land area line chart",
                compare_label="Forest Area",
            ),
        ),
    ),
)


def main() -> None:
    for config in ENVIRONMENTAL_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
