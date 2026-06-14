from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."

RANKING_TYPES = [
    {
        **WEO_RANKING_NOTES,
        "directory": "current-account-balance",
        "title": "Current Account Balance Ranking by Country",
        "script": "currentAccountBalanceRanking.js",
    },
    {
        **WEO_RANKING_NOTES,
        "directory": "current-account-balance-percent-gdp",
        "title": "Current Account Balance (% of GDP) Ranking by Country",
        "script": "currentAccountBalancePercentGdpRanking.js",
    },
    {
        "directory": "goods-trade-balance",
        "title": "Goods Trade Balance Ranking by Country",
        "script": "goodsTradeBalanceRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "goods-exports",
        "title": "Goods Exports Ranking by Country",
        "script": "goodsExportsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "goods-imports",
        "title": "Goods Imports Ranking by Country",
        "script": "goodsImportsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
