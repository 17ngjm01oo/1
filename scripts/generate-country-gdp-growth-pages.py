#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="gdp-growth",
            title_suffix="Real GDP Growth Rate",
            chart_title="GDP Growth Rate Chart by Country",
            subtitle="Select a country to view historical GDP growth rate trends.",
            generated_label="GDP growth",
            indicators=(
                IndicatorBlockConfig(
                    series_id="gdpGrowth",
                    title="Real GDP Growth Rate",
                    canvas_label="Real GDP Growth Rate line chart",
                    compare_label="Real GDP Growth Rate",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
