#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="ppp-per-capita",
            title_suffix="PPP per capita",
            chart_title="PPP per Capita Chart by Country",
            subtitle="Select a country to view historical PPP per capita trends.",
            generated_label="PPP per capita",
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
