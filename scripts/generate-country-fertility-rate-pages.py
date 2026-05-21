#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="fertility-rate",
            title_suffix="Fertility Rate",
            chart_title="Fertility Rate Chart by Country",
            subtitle="Select a country to view historical fertility rate trends.",
            generated_label="fertility rate",
            source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
            related_nav_label="Population page navigation",
            indicators=(
                IndicatorBlockConfig(
                    series_id="fertilityRate",
                    title="Fertility Rate",
                    canvas_label="Fertility rate line chart",
                    compare_label="Fertility Rate",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
