from __future__ import annotations

from data_source_notes import CIA_RANKING_NOTES, WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "co2-emissions",
        "title": "CO2 Emissions Rankings by Country",
        "script": "co2EmissionsRanking.js",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "co2-emissions-per-capita",
        "title": "CO2 Emissions per Capita Rankings by Country",
        "script": "co2EmissionsPerCapitaRanking.js",
    },
    {
        **CIA_RANKING_NOTES,
        "directory": "area",
        "title": "Area (km²) Rankings by Country",
        "script": "areaRanking.js",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "forest-area",
        "title": "Forest Area Rankings by Country",
        "script": "forestAreaPercentOfLandAreaRanking.js",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
