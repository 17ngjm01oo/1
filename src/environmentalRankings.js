import { getCountryIndicatorLinks, renderRankingLinks } from "./rankingLinks.js";

export const environmentalRankings = [
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

export const environmentalIndicatorLinks = getCountryIndicatorLinks(environmentalRankings);

export function renderEnvironmentalRankingLinks(
  nav,
  {
    rootHref = "./",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  renderRankingLinks(nav, environmentalRankings, {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
    replace,
  });
}
