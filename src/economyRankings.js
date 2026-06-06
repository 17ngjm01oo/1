export const economyProfileRankings = [
  {
    seriesId: "gdp",
    directory: "gdp",
    label: "GDP",
    profileLabel: "GDP - USD",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "ppp",
    directory: "ppp-gdp",
    label: "PPP GDP",
    profileLabel: "PPP GDP - Int$",
    profileSection: "GDP",
    countryPageKind: "ppp-gdp",
  },
  {
    seriesId: "gdpNational",
    profileLabel: "GDP - Local currency",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "realGdp",
    profileLabel: "Real GDP - Local currency",
    profileSection: "GDP",
    countryPageKind: "gdp",
  },
  {
    seriesId: "gdpPerCapita",
    directory: "gdp-per-capita",
    label: "GDP per Capita",
    profileLabel: "GDP per capita - USD",
    profileSection: "GDP",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "pppPerCapita",
    directory: "ppp-gdp-per-capita",
    label: "PPP GDP per Capita",
    profileLabel: "PPP GDP per capita - Int$",
    profileSection: "GDP",
    countryPageKind: "ppp-gdp-per-capita",
  },
  {
    seriesId: "gdpNationalPerCapita",
    profileLabel: "GDP per capita - Local currency",
    profileSection: "GDP",
    countryPageKind: "gdp-per-capita",
  },
  {
    seriesId: "realGdpPerCapita",
    profileLabel: "Real GDP per capita - Local currency",
    profileSection: "GDP",
    countryPageKind: "gdp-per-capita",
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
];

export const economyRankings = economyProfileRankings.filter(({ directory }) => directory);
