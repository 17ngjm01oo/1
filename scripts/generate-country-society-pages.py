#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import SIPRI_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


MILITARY_SPENDING_SUBTITLE = "Values are based on the SIPRI Military Expenditure Database."

SOCIETY_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="military-spending",
        title_suffix="Military Spending",
        chart_title="Military Spending Chart by Country",
        subtitle=MILITARY_SPENDING_SUBTITLE,
        generated_label="military spending",
        source_note=SIPRI_COUNTRY_SOURCE_NOTE,
        related_nav_label="Society page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="militarySpending",
                title="Military Spending",
                canvas_label="Military spending line chart",
                display_unit="USD",
                compare_label="Military Spending",
            ),
            IndicatorBlockConfig(
                series_id="militarySpendingPercentGdp",
                title="Military Spending",
                canvas_label="Military spending percent of GDP line chart",
                display_unit="% of GDP",
                compare_label="Military Spending (% of GDP)",
            ),
        ),
    ),
)


def main() -> None:
    for config in SOCIETY_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
