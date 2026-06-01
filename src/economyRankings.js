import { getCountryIndicatorLinks } from "./rankingLinks.js";

export const economyRankings = [
  {
    seriesId: "gdp",
    directory: "gdp",
    label: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "gdpPerCapita",
    directory: "gdp-per-capita",
    label: "GDP per Capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "gdpGrowth",
    directory: "gdp-growth",
    label: "GDP Growth",
    countryPageKind: "gdp-growth",
  },
  {
    seriesId: "inflationRate",
    directory: "inflation-rate",
    label: "Inflation Rate",
    countryPageKind: "inflation-rate",
  },
  {
    seriesId: "ppp",
    directory: "ppp-gdp",
    label: "PPP GDP",
    countryPageKind: "ppp-gdp",
  },
  {
    seriesId: "pppPerCapita",
    directory: "ppp-gdp-per-capita",
    label: "PPP GDP per Capita",
    countryPageKind: "ppp-gdp-per-capita",
  },
];

export const economyIndicatorLinks = getCountryIndicatorLinks(economyRankings);
