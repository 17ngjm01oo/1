import { renderRankingLinks } from "./rankingLinks.js";

export const economicRankings = [
  {
    directory: "gdp",
    label: "GDP",
    countryPageKinds: ["gdp"],
  },
  {
    directory: "gdp-per-capita",
    label: "GDP per Capita",
    countryPageKinds: ["gdp-per-capita"],
  },
  {
    directory: "gdp-growth",
    label: "GDP Growth",
    countryPageKinds: ["gdp-growth"],
  },
  {
    directory: "inflation-rate",
    label: "Inflation Rate",
    countryPageKinds: ["inflation-rate"],
  },
  {
    directory: "ppp",
    label: "PPP",
    countryPageKinds: ["ppp"],
  },
  {
    directory: "ppp-per-capita",
    label: "PPP per Capita",
    countryPageKinds: ["ppp-per-capita"],
  },
];

export function renderEconomicRankingLinks(
  nav,
  {
    rootHref = "./",
    currentPageKind = "",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  renderRankingLinks(nav, economicRankings, {
    rootHref,
    currentPageKind,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
    replace,
  });
}
