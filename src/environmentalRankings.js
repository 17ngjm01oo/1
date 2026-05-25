import { getCountryIndicatorLinks, renderRankingLinks } from "./rankingLinks.js";

export const environmentalRankings = [
  {
    directory: "area",
    label: "Area (km²)",
  },
  {
    directory: "forest-area-percent-of-land-area",
    label: "Forest Area (% of Land Area)",
    countryPageKind: "forest-area-percent-of-land-area",
  },
  {
    directory: "agricultural-land-percent-of-land-area",
    label: "Agricultural Land (% of Land Area)",
    countryPageKind: "agricultural-land-percent-of-land-area",
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
