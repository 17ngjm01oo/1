from __future__ import annotations

from data_source_notes import WEO_RANKING_NOTES
from ranking_page_generator import generate_ranking_pages

RANKING_TYPES = [
    {
        "directory": "nominal-gdp",
        "title": "GDP Ranking by Country",
        "script": "nominalGdpRanking.js",
        "subtitle": "GDP is nominal GDP measured in U.S. dollars.",
    },
    {
        "directory": "nominal-gdp-per-capita",
        "title": "GDP per Capita Ranking by Country",
        "script": "gdpPerCapitaRanking.js",
        "subtitle": "GDP per capita is nominal GDP in U.S. dollars divided by population.",
    },
    {
        "directory": "real-gdp-growth",
        "title": "Real GDP Growth Ranking by Country",
        "script": "realGdpGrowthRanking.js",
        "subtitle": "Real GDP growth rate is the annual percentage change in real GDP in national currency.",
    },
    {
        "directory": "inflation-rate",
        "title": "Inflation Rate Ranking by Country",
        "script": "inflationRateRanking.js",
        "subtitle": "Inflation rate is the annual percentage change in the consumer price index.",
    },
    {
        "directory": "ppp",
        "title": "PPP Ranking by Country",
        "script": "pppRanking.js",
        "subtitle": "PPP GDP is GDP measured in international dollars.",
    },
    {
        "directory": "ppp-per-capita",
        "title": "PPP per Capita Ranking by Country",
        "script": "pppPerCapitaRanking.js",
        "subtitle": "PPP per capita is PPP GDP in international dollars divided by population.",
    },
]


def main() -> None:
    generate_ranking_pages([ranking_type | WEO_RANKING_NOTES for ranking_type in RANKING_TYPES])


if __name__ == "__main__":
    main()
