#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="gdp-per-capita",
            title_suffix="GDP per capita",
            chart_title="GDP per Capita Chart by Country",
            subtitle="Select a country to view historical GDP per capita trends.",
            generated_label="GDP per capita",
            related_nav_label="Economy page navigation",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            data_note=WEO_COUNTRY_DATA_NOTE,
            indicators=(
                IndicatorBlockConfig(
                    series_id="gdpPerCapita",
                    title="GDP per capita",
                    canvas_label="GDP per capita line chart",
                    display_unit="USD",
                    compare_label="GDP per capita",
                ),
                IndicatorBlockConfig(
                    series_id="gdpNationalPerCapita",
                    title="GDP per capita",
                    canvas_label="GDP per capita in national currency line chart",
                    display_unit="Local currency",
                ),
                IndicatorBlockConfig(
                    series_id="realGdpPerCapita",
                    title="Real GDP per capita",
                    canvas_label="Real GDP per capita in constant national currency line chart",
                    display_unit="Local currency",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
