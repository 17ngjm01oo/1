import { renderRankingLinks } from "./rankingLinks.js";

export const populationRankings = [
  {
    directory: "population",
    label: "Population",
  },
  {
    directory: "population-density",
    label: "Population Density",
  },
  {
    directory: "life-expectancy",
    label: "Life Expectancy",
  },
  {
    directory: "fertility-rate",
    label: "Fertility Rate",
  },
  {
    directory: "employment",
    label: "Employment",
  },
  {
    directory: "unemployment-rate",
    label: "Unemployment Rate",
  },
];

export function renderPopulationRankingLinks(
  nav,
  {
    rootHref = "./",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  renderRankingLinks(nav, populationRankings, {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
    replace,
  });
}
