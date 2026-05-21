export const environmentalRankings = [
  {
    directory: "agricultural-land-percent-of-land-area",
    label: "Agricultural Land Percent of Land Area",
  },
  {
    directory: "forest-area-percent-of-land-area",
    label: "Forest Area Percent of Land Area",
  },
];

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
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  environmentalRankings.forEach((ranking) => {
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
