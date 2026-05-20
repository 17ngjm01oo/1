#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="unemployment-rate",
            title_suffix="Unemployment Rate",
            chart_title="Unemployment Rate Chart by Country",
            subtitle="Select a country to view historical unemployment rate trends.",
            generated_label="unemployment rate",
            related_nav_label="Population page navigation",
            notes_label="Data notes",
            data_note="Values may include IMF estimates and projections.",
            indicators=(
                IndicatorBlockConfig(
                    series_id="unemploymentRate",
                    title="Unemployment Rate",
                    canvas_label="Unemployment rate line chart",
                    compare_label="Unemployment Rate",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
