from __future__ import annotations

from data_source_notes import WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

PERCENT_LAND_AREA_SUBTITLE = "Values are shown as a percentage of land area."

RANKING_TYPES = [
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "agricultural-land-percent-of-land-area",
        "title": "Agricultural Land Percent of Land Area Ranking by Country",
        "script": "agriculturalLandPercentOfLandAreaRanking.js",
        "table_title": "Agricultural Land Percent of Land Area Ranking",
        "subtitle": PERCENT_LAND_AREA_SUBTITLE,
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "forest-area-percent-of-land-area",
        "title": "Forest Area Percent of Land Area Ranking by Country",
        "script": "forestAreaPercentOfLandAreaRanking.js",
        "table_title": "Forest Area Percent of Land Area Ranking",
        "subtitle": PERCENT_LAND_AREA_SUBTITLE,
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
