from __future__ import annotations

from data_source_notes import CIA_RANKING_NOTES, WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

PERCENT_LAND_AREA_SUBTITLE = "Values are shown as a percentage of land area."
AREA_SUBTITLE = "Total area includes both land and water area and is shown in km²."

RANKING_TYPES = [
    {
        **CIA_RANKING_NOTES,
        "directory": "area",
        "title": "Area (km²) Ranking by Country",
        "script": "areaRanking.js",
        "subtitle": AREA_SUBTITLE,
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "agricultural-land",
        "title": "Agricultural Land Ranking by Country",
        "script": "agriculturalLandPercentOfLandAreaRanking.js",
        "subtitle": PERCENT_LAND_AREA_SUBTITLE,
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "forest-area",
        "title": "Forest Area Ranking by Country",
        "script": "forestAreaPercentOfLandAreaRanking.js",
        "subtitle": PERCENT_LAND_AREA_SUBTITLE,
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "co2-emissions",
        "title": "CO2 Emissions Ranking by Country",
        "script": "co2EmissionsRanking.js",
        "subtitle": "CO2 emissions excluding LULUCF are measured in Mt CO2e.",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "co2-emissions-per-capita",
        "title": "CO2 Emissions per Capita Ranking by Country",
        "script": "co2EmissionsPerCapitaRanking.js",
        "subtitle": "CO2 emissions excluding LULUCF per capita are measured in t CO2e.",
    },
]


def main() -> None:
    generate_ranking_pages(RANKING_TYPES)


if __name__ == "__main__":
    main()
