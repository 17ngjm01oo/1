#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


ENVIRONMENT_SUBTITLE = "Select a country to view historical environmental indicator trends."
CO2_EMISSIONS_SUBTITLE = "Select a country to view historical trends."

ENVIRONMENT_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="forest-area",
        title_suffix="Forest Area",
        chart_title="Forest Area Chart by Country",
        subtitle=ENVIRONMENT_SUBTITLE,
        generated_label="forest area percent of land area",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environment page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="forestAreaPercentOfLandArea",
                title="Forest Area - % of Land Area",
                canvas_label="Forest area percent of land area line chart",
                compare_label="Forest Area",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="co2-emissions",
        title_suffix="CO2 Emissions",
        chart_title="CO2 Emissions Chart by Country",
        subtitle=CO2_EMISSIONS_SUBTITLE,
        generated_label="CO2 emissions",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Environment page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="co2Emissions",
                title="CO2 Emissions - CO2e",
                canvas_label="CO2 emissions line chart",
                compare_label="CO2 Emissions",
            ),
            IndicatorBlockConfig(
                series_id="co2EmissionsPerCapita",
                title="CO2 Emissions per Capita - CO2e",
                canvas_label="CO2 emissions per capita line chart",
                compare_label="CO2 Emissions per Capita",
            ),
        ),
    ),
)


def main() -> None:
    for config in ENVIRONMENT_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
