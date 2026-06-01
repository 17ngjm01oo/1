import { getCountryIndicatorLinks } from "./rankingLinks.js";

export const environmentRankings = [
  {
    seriesId: "area",
    directory: "area",
    label: "Area (km²)",
  },
  {
    seriesId: "forestAreaPercentOfLandArea",
    directory: "forest-area",
    label: "Forest Area",
    countryPageKind: "forest-area",
  },
  {
    seriesId: "agriculturalLandPercentOfLandArea",
    directory: "agricultural-land",
    label: "Agricultural Land",
    countryPageKind: "agricultural-land",
  },
];

export const environmentIndicatorLinks = getCountryIndicatorLinks(environmentRankings);
