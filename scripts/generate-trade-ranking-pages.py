from __future__ import annotations

from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "current-account-balance",
        "title": "Current Account Balance Ranking by Country",
        "script": "currentAccountBalanceRanking.js",
        "table_title": "Current Account Balance Ranking",
        "subtitle": "Current account balance is measured in U.S. dollars.",
    },
    {
        "directory": "current-account-balance-percent-gdp",
        "title": "Current Account Balance Percent of GDP Ranking by Country",
        "script": "currentAccountBalancePercentGdpRanking.js",
        "table_title": "Current Account Balance Percent of GDP Ranking",
        "subtitle": "Current account balance percent of GDP is current account balance divided by GDP.",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
