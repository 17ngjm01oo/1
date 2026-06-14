#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import SIPRI_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        **SIPRI_RANKING_NOTES,
        "directory": "military-spending",
        "title": "Military Spending Ranking by Country",
        "script": "militarySpendingRanking.js",
    },
    {
        **SIPRI_RANKING_NOTES,
        "directory": "military-spending-percent-gdp",
        "title": "Military Spending (% of GDP) Ranking by Country",
        "script": "militarySpendingPercentGdpRanking.js",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
