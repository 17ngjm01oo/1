#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="immigrants",
            title_suffix="Immigrants",
            chart_title="Immigrants Chart by Country",
            subtitle="Values are based on World Bank World Development Indicators.",
            generated_label="immigrants",
            source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
            related_nav_label="Population page navigation",
            indicators=(
                IndicatorBlockConfig(
                    series_id="immigrants",
                    title="Immigrants",
                    canvas_label="Immigrants line chart",
                    compare_label="Immigrants",
                ),
                IndicatorBlockConfig(
                    series_id="immigrantsPercentPopulation",
                    title="Immigrants",
                    canvas_label="Immigrants percent of population line chart",
                    display_unit="% of Population",
                    compare_label="Immigrants (% of Population)",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
