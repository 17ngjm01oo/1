from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES, WORLD_BANK_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "population",
        "title": "Population Ranking by Country",
        "script": "populationRanking.js",
        "source_note": "Source: World Bank; IMF World Economic Outlook for Taiwan only.",
        "data_note": "",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "population-density",
        "title": "Population Density Ranking by Country",
        "script": "populationDensityRanking.js",
        "subtitle": "Population density is shown per km².",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "life-expectancy",
        "title": "Life Expectancy Ranking by Country",
        "script": "lifeExpectancyRanking.js",
        "subtitle": "Life expectancy at birth.",
    },
    {
        **WORLD_BANK_RANKING_NOTES,
        "directory": "fertility-rate",
        "title": "Fertility Rate Ranking by Country",
        "script": "fertilityRateRanking.js",
        "subtitle": "Total fertility rate estimates the average number of children a woman would have over her lifetime, based on age-specific birth rates for ages 15-49.",
    },
    {
        "directory": "employment",
        "title": "Employment Ranking by Country",
        "script": "employmentRanking.js",
    },
    {
        "directory": "unemployment-rate",
        "title": "Unemployment Rate Ranking by Country",
        "script": "unemploymentRateRanking.js",
    },
]


def main() -> None:
    generate_ranking_pages([
        ranking_type if "source_note" in ranking_type else ranking_type | WEO_RANKING_NOTES
        for ranking_type in RANKING_TYPES
    ])


if __name__ == "__main__":
    main()
