from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "population",
        "title": "Population Ranking by Country",
        "script": "populationRanking.js",
        "table_title": "Population Ranking",
    },
    {
        "directory": "employment",
        "title": "Employment Ranking by Country",
        "script": "employmentRanking.js",
        "table_title": "Employment Ranking",
    },
    {
        "directory": "unemployment-rate",
        "title": "Unemployment Rate Ranking by Country",
        "script": "unemploymentRateRanking.js",
        "table_title": "Unemployment Rate Ranking",
    },
]


def main() -> None:
    generate_ranking_pages([ranking_type | WEO_RANKING_NOTES for ranking_type in RANKING_TYPES])


if __name__ == "__main__":
    main()
