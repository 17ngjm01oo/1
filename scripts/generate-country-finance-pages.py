#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import WEO_COUNTRY_DATA_NOTE, WEO_COUNTRY_SOURCE_NOTE, WORLD_BANK_COUNTRY_SOURCE_NOTE
from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


GOVERNMENT_DEBT_SUBTITLE = "Select a country to view historical trends."
FISCAL_BALANCE_SUBTITLE = "Select a country to view historical trends."
GOVERNMENT_REVENUE_EXPENDITURE_SUBTITLE = "Select a country to view historical trends."
PERCENT_GDP_SUBTITLE = (
    "Select a country to view historical trends. "
    "Values are shown as a percentage of nominal GDP in local currency."
)
TOTAL_RESERVES_SUBTITLE = (
    "Select a country to view historical total reserves including gold trends. "
    "Values are shown in current U.S. dollars."
)

FINANCE_PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="government-debt",
        title_suffix="Government Debt",
        chart_title="Government Debt Chart by Country",
        subtitle=GOVERNMENT_DEBT_SUBTITLE,
        generated_label="government debt",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Finance page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentGrossDebt",
                title="Government Gross Debt (% of GDP)",
                canvas_label="Government gross debt line chart",
                compare_label="Government Gross Debt (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="governmentNetDebt",
                title="Government Net Debt (% of GDP)",
                canvas_label="Government net debt line chart",
                compare_label="Government Net Debt (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="governmentGrossDebtNational",
                title="Government Gross Debt - Local currency",
                canvas_label="Government gross debt in national currency line chart",
            ),
            IndicatorBlockConfig(
                series_id="governmentNetDebtNational",
                title="Government Net Debt - Local currency",
                canvas_label="Government net debt in national currency line chart",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="fiscal-balance",
        title_suffix="Fiscal Balance",
        chart_title="Fiscal Balance Chart by Country",
        subtitle=FISCAL_BALANCE_SUBTITLE,
        generated_label="fiscal balance",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Finance page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="fiscalBalance",
                title="Fiscal Balance (% of GDP)",
                canvas_label="Fiscal balance line chart",
                compare_label="Fiscal Balance (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="primaryFiscalBalance",
                title="Primary Fiscal Balance (% of GDP)",
                canvas_label="Primary fiscal balance line chart",
                compare_label="Primary Fiscal Balance (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="fiscalBalanceNational",
                title="Fiscal Balance - Local currency",
                canvas_label="Fiscal balance in national currency line chart",
            ),
            IndicatorBlockConfig(
                series_id="primaryFiscalBalanceNational",
                title="Primary Fiscal Balance - Local currency",
                canvas_label="Primary fiscal balance in national currency line chart",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="government-revenue-expenditure",
        title_suffix="Government Revenue and Expenditure",
        chart_title="Government Revenue and Expenditure Chart by Country",
        subtitle=GOVERNMENT_REVENUE_EXPENDITURE_SUBTITLE,
        generated_label="government revenue and expenditure",
        source_note=WEO_COUNTRY_SOURCE_NOTE,
        data_note=WEO_COUNTRY_DATA_NOTE,
        related_nav_label="Finance page navigation",
        indicators=(
            IndicatorBlockConfig(
                series_id="governmentRevenue",
                title="Government Revenue (% of GDP)",
                canvas_label="Government revenue line chart",
                compare_label="Government Revenue (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="governmentExpenditure",
                title="Government Expenditure (% of GDP)",
                canvas_label="Government expenditure line chart",
                compare_label="Government Expenditure (% of GDP)",
            ),
            IndicatorBlockConfig(
                series_id="governmentRevenueNational",
                title="Government Revenue - Local currency",
                canvas_label="Government revenue in national currency line chart",
            ),
            IndicatorBlockConfig(
                series_id="governmentExpenditureNational",
                title="Government Expenditure - Local currency",
                canvas_label="Government expenditure in national currency line chart",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="total-reserves",
        title_suffix="Total Reserves",
        chart_title="Total Reserves Chart by Country",
        subtitle=TOTAL_RESERVES_SUBTITLE,
        generated_label="total reserves including gold",
        source_note=WORLD_BANK_COUNTRY_SOURCE_NOTE,
        related_nav_label="Finance page navigation",
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
    for config in FINANCE_PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
