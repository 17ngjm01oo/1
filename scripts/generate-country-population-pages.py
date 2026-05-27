#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="population",
            title_suffix="Population",
            chart_title="Population Chart by Country",
            subtitle="Select a country to view historical population trends.",
            generated_label="population",
            source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
            source_note_overridable=True,
            related_nav_label="Population page navigation",
            notes_label="Data notes",
            indicators=(
                IndicatorBlockConfig(
                    series_id="population",
                    title="Population",
                    canvas_label="Population line chart",
                    compare_label="Population",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
