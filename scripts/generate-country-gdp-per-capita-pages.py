#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="gdp-per-capita",
            title_suffix="GDP per capita",
            chart_title="GDP per Capita Chart by Country",
            subtitle="Select a country to view historical GDP per capita trends.",
            generated_label="GDP per capita",
            indicators=(
                IndicatorBlockConfig(
                    series_id="gdpPerCapita",
                    title="Nominal GDP per capita - USD",
                    canvas_label="GDP per capita line chart",
                    compare_label="GDP per capita",
                ),
                IndicatorBlockConfig(
                    series_id="gdpNationalPerCapita",
                    title="Nominal GDP per capita",
                    canvas_label="GDP per capita in national currency line chart",
                ),
                IndicatorBlockConfig(
                    series_id="realGdpPerCapita",
                    title="Real GDP per capita",
                    canvas_label="Real GDP per capita in constant national currency line chart",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
