#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="population-density",
            title_suffix="Population Density",
            chart_title="Population Density Chart by Country",
            subtitle="",
            generated_label="population density",
            source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
            related_nav_label="Population page navigation",
            notes_label="Data notes",
            data_note="",
            indicators=(
                IndicatorBlockConfig(
                    series_id="populationDensity",
                    title="Population Density",
                    canvas_label="Population density line chart",
                    display_unit="/km²",
                    compare_label="Population Density",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
