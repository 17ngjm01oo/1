#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="current-account-balance-percent-gdp",
            title_suffix="Current Account Balance Percent of GDP",
            chart_title="Current Account Balance Percent of GDP Chart by Country",
            subtitle="Select a country to view historical current account balance percent of GDP trends.",
            generated_label="current account balance percent of GDP",
            related_nav_label="Trade page navigation",
            indicators=(
                IndicatorBlockConfig(
                    series_id="currentAccountBalancePercentGdp",
                    title="Current Account Balance Percent of GDP",
                    canvas_label="Current account balance percent of GDP line chart",
                    compare_label="Current Account Balance Percent of GDP",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
