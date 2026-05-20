from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

PERCENT_GDP_SUBTITLE = "Values are shown as a percentage of nominal GDP in local currency."

RANKING_TYPES = [
    {
        "directory": "government-gross-debt",
        "title": "Government Gross Debt Ranking by Country",
        "script": "governmentGrossDebtRanking.js",
        "table_title": "Government Gross Debt Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-net-debt",
        "title": "Government Net Debt Ranking by Country",
        "script": "governmentNetDebtRanking.js",
        "table_title": "Government Net Debt Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "fiscal-balance",
        "title": "Fiscal Balance Ranking by Country",
        "script": "fiscalBalanceRanking.js",
        "table_title": "Fiscal Balance Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "primary-fiscal-balance",
        "title": "Primary Fiscal Balance Ranking by Country",
        "script": "primaryFiscalBalanceRanking.js",
        "table_title": "Primary Fiscal Balance Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-revenue",
        "title": "Government Revenue Ranking by Country",
        "script": "governmentRevenueRanking.js",
        "table_title": "Government Revenue Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-expenditure",
        "title": "Government Expenditure Ranking by Country",
        "script": "governmentExpenditureRanking.js",
        "table_title": "Government Expenditure Ranking",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
]


def main() -> None:
    generate_ranking_pages([ranking_type | WEO_RANKING_NOTES for ranking_type in RANKING_TYPES])


if __name__ == "__main__":
    main()
