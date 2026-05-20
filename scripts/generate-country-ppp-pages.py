#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="ppp",
            title_suffix="PPP",
            chart_title="PPP Chart by Country",
            subtitle="Select a country to view historical PPP trends.",
            generated_label="PPP",
            indicators=(
                IndicatorBlockConfig(
                    series_id="ppp",
                    title="PPP GDP - Int. $",
                    canvas_label="PPP line chart",
                    compare_label="PPP",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
