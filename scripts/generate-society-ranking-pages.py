#!/usr/bin/env python3
from __future__ import annotations

from data_source_notes import SIPRI_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

CURRENT_USD_SUBTITLE = "Values are shown in current U.S. dollars."
PERCENT_GDP_SUBTITLE = "Values are shown as a share of GDP."

RANKING_TYPES = [
    {
        **SIPRI_RANKING_NOTES,
        "directory": "military-spending",
        "title": "Military Spending Ranking by Country",
        "script": "militarySpendingRanking.js",
        "subtitle": CURRENT_USD_SUBTITLE,
    },
    {
        **SIPRI_RANKING_NOTES,
        "directory": "military-spending-percent-gdp",
        "title": "Military Spending (% of GDP) Ranking by Country",
        "script": "militarySpendingPercentGdpRanking.js",
        "subtitle": PERCENT_GDP_SUBTITLE,
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
