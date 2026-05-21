export const populationRankings = [
  {
    directory: "population",
    label: "Population",
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
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  populationRankings.forEach((ranking) => {
    const link = document.createElement("a");
    link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = ranking.label;

    if (highlightCurrent && ranking.directory === currentRankingDirectory) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}
