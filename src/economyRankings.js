export const economyProfileRankings = [
  {
    seriesId: "gdp",
    directory: "gdp",
    label: "GDP",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "gdpNational",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "realGdp",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "ppp",
    directory: "ppp-gdp",
    label: "PPP GDP",
    profileSection: "GDP",
    countryPageKind: "ppp-gdp",
  },
  {
    seriesId: "gdpPerCapita",
    directory: "gdp-per-capita",
    label: "GDP per Capita",
    profileSection: "GDP per capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "gdpNationalPerCapita",
    profileSection: "GDP per capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "realGdpPerCapita",
    profileSection: "GDP per capita",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "pppPerCapita",
    directory: "ppp-gdp-per-capita",
    label: "PPP GDP per Capita",
    profileSection: "GDP per capita",
    countryPageKind: "ppp-gdp-per-capita",
  },
  {
    seriesId: "gdpGrowth",
    directory: "gdp-growth",
    label: "GDP Growth",
    profileSection: "Economic Growth",
    countryPageKind: "gdp-growth",
  },
  {
    seriesId: "inflationRate",
    directory: "inflation-rate",
    label: "Inflation Rate",
    profileSection: "Inflation",
    countryPageKind: "inflation-rate",
  },
  {
    seriesId: "unemploymentRate",
    directory: "unemployment-rate",
    label: "Unemployment Rate",
    profileSection: "Labor Market",
    countryPageKind: "unemployment-rate",
  },
];

export const economyRankings = economyProfileRankings.filter(({ directory }) => directory);
