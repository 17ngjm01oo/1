from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "gdp",
        "title": "GDP Rankings by Country",
        "script": "nominalGdpRanking.js",
    },
    {
        "directory": "gdp-per-capita",
        "title": "GDP per Capita Rankings by Country",
        "script": "gdpPerCapitaRanking.js",
    },
    {
        "directory": "gdp-growth",
        "title": "GDP Growth Rankings by Country",
        "script": "realGdpGrowthRanking.js",
    },
    {
        "directory": "inflation-rate",
        "title": "Inflation Rate Rankings by Country",
        "script": "inflationRateRanking.js",
    },
    {
        "directory": "unemployment-rate",
        "title": "Unemployment Rate Rankings by Country",
        "script": "unemploymentRateRanking.js",
    },
    {
        "directory": "ppp-gdp",
        "title": "PPP GDP Rankings by Country",
        "script": "pppRanking.js",
    },
    {
        "directory": "ppp-gdp-per-capita",
        "title": "PPP GDP per Capita Rankings by Country",
        "script": "pppPerCapitaRanking.js",
    },
]


def main() -> None:
    generate_ranking_pages([ranking_type | WEO_RANKING_NOTES for ranking_type in RANKING_TYPES])


if __name__ == "__main__":
    main()
