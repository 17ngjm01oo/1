import { getCountryIndicatorLinks } from "./rankingLinks.js";

export const environmentRankings = [
  {
    seriesId: "area",
    directory: "area",
    label: "Area (km²)",
  },
  {
    seriesId: "co2Emissions",
    directory: "co2-emissions",
    label: "CO2 Emissions",
    countryPageKind: "co2-emissions",
  },
  {
    seriesId: "co2EmissionsPerCapita",
    directory: "co2-emissions-per-capita",
    label: "CO2 Emissions per Capita",
    countryPageKind: "co2-emissions-per-capita",
  },
  {
    seriesId: "forestAreaPercentOfLandArea",
    directory: "forest-area",
    label: "Forest Area",
    countryPageKind: "forest-area",
  },
];

export const environmentIndicatorLinks = getCountryIndicatorLinks(environmentRankings);
