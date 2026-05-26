import { getCountryIndicatorLinks, renderRankingLinks } from "./rankingLinks.js";

export const environmentalRankings = [
  {
    directory: "area",
    label: "Area (km²)",
  },
  {
    directory: "forest-area",
    label: "Forest Area",
    countryPageKind: "forest-area",
  },
  {
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
