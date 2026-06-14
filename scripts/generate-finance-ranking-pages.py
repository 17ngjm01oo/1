from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES, WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "government-gross-debt",
        "title": "Government Gross Debt (% of GDP) Ranking by Country",
        "script": "governmentGrossDebtRanking.js",
    },
    {
        "directory": "government-net-debt",
        "title": "Government Net Debt (% of GDP) Ranking by Country",
        "script": "governmentNetDebtRanking.js",
    },
    {
        "directory": "fiscal-balance",
        "title": "Fiscal Balance (% of GDP) Ranking by Country",
        "script": "fiscalBalanceRanking.js",
    },
    {
        "directory": "primary-fiscal-balance",
        "title": "Primary Fiscal Balance (% of GDP) Ranking by Country",
        "script": "primaryFiscalBalanceRanking.js",
    },
    {
        "directory": "government-revenue",
        "title": "Government Revenue (% of GDP) Ranking by Country",
        "script": "governmentRevenueRanking.js",
    },
    {
        "directory": "government-spending",
        "title": "Government Spending (% of GDP) Ranking by Country",
        "script": "governmentSpendingRanking.js",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "total-reserves",
        "title": "Total Reserves Ranking by Country",
        "script": "totalReservesIncludingGoldRanking.js",
    },
]


def main() -> None:
    generate_ranking_pages([
        ranking_type if "source_note" in ranking_type else ranking_type | WEO_RANKING_NOTES
        for ranking_type in RANKING_TYPES
    ])


if __name__ == "__main__":
    main()
