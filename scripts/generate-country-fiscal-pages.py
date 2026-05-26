#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE, WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


PERCENT_GDP_SUBTITLE = (
    "Select a country to view historical trends. "
    "Values are shown as a percentage of nominal GDP in local currency."
)

FISCAL_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="government-gross-debt",
        title_suffix="Government Gross Debt",
        chart_title="Government Gross Debt Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="government gross debt",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentGrossDebt",
                title="Government Gross Debt",
                canvas_label="Government gross debt line chart",
                compare_label="Government Gross Debt",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="government-net-debt",
        title_suffix="Government Net Debt",
        chart_title="Government Net Debt Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="government net debt",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentNetDebt",
                title="Government Net Debt",
                canvas_label="Government net debt line chart",
                compare_label="Government Net Debt",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="fiscal-balance",
        title_suffix="Fiscal Balance",
        chart_title="Fiscal Balance Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="fiscal balance",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="fiscalBalance",
                title="Fiscal Balance",
                canvas_label="Fiscal balance line chart",
                compare_label="Fiscal Balance",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="primary-fiscal-balance",
        title_suffix="Primary Fiscal Balance",
        chart_title="Primary Fiscal Balance Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="primary fiscal balance",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="primaryFiscalBalance",
                title="Primary Fiscal Balance",
                canvas_label="Primary fiscal balance line chart",
                compare_label="Primary Fiscal Balance",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="government-revenue",
        title_suffix="Government Revenue",
        chart_title="Government Revenue Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="government revenue",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentRevenue",
                title="Government Revenue",
                canvas_label="Government revenue line chart",
                compare_label="Government Revenue",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="government-expenditure",
        title_suffix="Government Expenditure",
        chart_title="Government Expenditure Chart by Country",
        subtitle=PERCENT_GDP_SUBTITLE,
        generated_label="government expenditure",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentExpenditure",
                title="Government Expenditure",
                canvas_label="Government expenditure line chart",
                compare_label="Government Expenditure",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="total-reserves",
        title_suffix="Total Reserves",
        chart_title="Total Reserves Chart by Country",
        subtitle="Select a country to view historical total reserves including gold trends. Values are shown in current U.S. dollars.",
        generated_label="total reserves including gold",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Fiscal page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="totalReservesIncludingGold",
                title="Total Reserves",
                canvas_label="Total reserves including gold line chart",
                compare_label="Total Reserves",
            ),
        ),
    ),
)


def main() -> None:
    for config in FISCAL_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
