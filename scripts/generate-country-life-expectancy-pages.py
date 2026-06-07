#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="life-expectancy",
            title_suffix="Life Expectancy",
            chart_title="Life Expectancy Chart by Country",
            subtitle="",
            generated_label="life expectancy",
            source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
            related_nav_label="Population page navigation",
            indicators=(
                IndicatorBlockConfig(
                    series_id="lifeExpectancy",
                    title="Life Expectancy",
                    canvas_label="Life expectancy line chart",
                    compare_label="Life Expectancy",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
