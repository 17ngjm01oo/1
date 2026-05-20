#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="current-account-balance",
            title_suffix="Current Account Balance",
            chart_title="Current Account Balance Chart by Country",
            subtitle="Select a country to view historical current account balance trends.",
            generated_label="current account balance",
            related_nav_label="Trade page navigation",
            indicators=(
                IndicatorBlockConfig(
                    series_id="currentAccountBalance",
                    title="Current Account Balance - USD",
                    canvas_label="Current account balance line chart",
                    compare_label="Current Account Balance",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
