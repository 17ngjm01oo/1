#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="employment",
            title_suffix="Employment",
            chart_title="Employment Chart by Country",
            subtitle="",
            generated_label="employment",
            source_note=WEO_COUNTRY_SOURCE_NOTE,
            related_nav_label="Population page navigation",
            notes_label="Data notes",
            data_note="Values may include IMF estimates and projections.",
            indicators=(
                IndicatorBlockConfig(
                    series_id="employment",
                    title="Employment",
                    canvas_label="Employment line chart",
                    compare_label="Employment",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
