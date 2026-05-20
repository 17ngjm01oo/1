from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."
UNCTAD_EXCLUSION_NOTE = "Countries with no available UNCTAD data are excluded from the ranking."

RANKING_TYPES = [
    {
        **WEO_RANKING_NOTES,
        "directory": "current-account-balance",
        "title": "Current Account Balance Ranking by Country",
        "script": "currentAccountBalanceRanking.js",
        "table_title": "Current Account Balance Ranking",
        "subtitle": "Current account balance is measured in U.S. dollars.",
    },
    {
        **WEO_RANKING_NOTES,
        "directory": "current-account-balance-percent-gdp",
        "title": "Current Account Balance Percent of GDP Ranking by Country",
        "script": "currentAccountBalancePercentGdpRanking.js",
        "table_title": "Current Account Balance Percent of GDP Ranking",
        "subtitle": "Current account balance percent of GDP is current account balance divided by GDP.",
    },
    {
        "directory": "goods-exports",
        "title": "Goods Exports Ranking by Country",
        "script": "goodsExportsRanking.js",
        "table_title": "Goods Exports Ranking",
        "subtitle": "Goods exports are measured in current U.S. dollars.",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
        "exclusion_note": UNCTAD_EXCLUSION_NOTE,
    },
    {
        "directory": "goods-imports",
        "title": "Goods Imports Ranking by Country",
        "script": "goodsImportsRanking.js",
        "table_title": "Goods Imports Ranking",
        "subtitle": "Goods imports are measured in current U.S. dollars.",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
        "exclusion_note": UNCTAD_EXCLUSION_NOTE,
    },
    {
        "directory": "goods-trade-balance",
        "title": "Goods Trade Balance Ranking by Country",
        "script": "goodsTradeBalanceRanking.js",
        "table_title": "Goods Trade Balance Ranking",
        "subtitle": "Goods trade balance is exports minus imports, measured in current U.S. dollars.",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
        "exclusion_note": UNCTAD_EXCLUSION_NOTE,
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
