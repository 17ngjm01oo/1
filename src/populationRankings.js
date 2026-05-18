export const populationRankings = [
  {
    directory: "population",
    label: "Population Ranking",
    countryPageKinds: ["population"],
  },
];

export function renderPopulationRankingLinks(
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

    if (
      highlightCurrent &&
      (ranking.countryPageKinds.includes(currentPageKind) || ranking.directory === currentRankingDirectory)
    ) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}
