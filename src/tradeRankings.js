export const tradeRankings = [
  {
    directory: "current-account-balance",
    label: "Current Account Balance Ranking",
  },
  {
    directory: "current-account-balance-percent-gdp",
    label: "Current Account Balance Percent of GDP Ranking",
  },
];

export function renderTradeRankingLinks(
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

  tradeRankings.forEach((ranking) => {
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
