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
        "directory": "trade-balance",
        "title": "Trade Balance Ranking by Country",
        "script": "tradeBalanceRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "exports",
        "title": "Exports Ranking by Country",
        "script": "exportsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "imports",
        "title": "Imports Ranking by Country",
        "script": "importsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "services-trade-balance",
        "title": "Services Trade Balance Ranking by Country",
        "script": "servicesTradeBalanceRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "services-exports",
        "title": "Services Exports Ranking by Country",
        "script": "servicesExportsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
    {
        "directory": "services-imports",
        "title": "Services Imports Ranking by Country",
        "script": "servicesImportsRanking.js",
        "source_note": UNCTAD_SOURCE_NOTE,
        "data_note": "",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
