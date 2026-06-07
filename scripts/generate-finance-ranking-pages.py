from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES, WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

PERCENT_GDP_SUBTITLE = "Measured as a share of nominal GDP in local currency."

RANKING_TYPES = [
    {
        "directory": "government-gross-debt",
        "title": "Government Gross Debt (% of GDP) Ranking by Country",
        "script": "governmentGrossDebtRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-net-debt",
        "title": "Government Net Debt (% of GDP) Ranking by Country",
        "script": "governmentNetDebtRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "fiscal-balance",
        "title": "Fiscal Balance (% of GDP) Ranking by Country",
        "script": "fiscalBalanceRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "primary-fiscal-balance",
        "title": "Primary Fiscal Balance (% of GDP) Ranking by Country",
        "script": "primaryFiscalBalanceRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-revenue",
        "title": "Government Revenue Ranking by Country",
        "script": "governmentRevenueRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        "directory": "government-expenditure",
        "title": "Government Expenditure Ranking by Country",
        "script": "governmentExpenditureRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "total-reserves",
        "title": "Total Reserves Ranking by Country",
        "script": "totalReservesIncludingGoldRanking.js",
        "subtitle": "Total reserves including gold are measured in current U.S. dollars.",
    },
]


def main() -> None:
    generate_ranking_pages([
        ranking_type if "source_note" in ranking_type else ranking_type | WEO_RANKING_NOTES
        for ranking_type in RANKING_TYPES
    ])


if __name__ == "__main__":
    main()
