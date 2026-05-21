export const tradeRankings = [
  {
    directory: "current-account-balance",
    label: "Current Account Balance",
  },
  {
    directory: "current-account-balance-percent-gdp",
    label: "Current Account Balance (% of GDP)",
  },
  {
    directory: "goods-exports",
    label: "Goods Exports",
  },
  {
    directory: "goods-imports",
    label: "Goods Imports",
  },
  {
    directory: "goods-trade-balance",
    label: "Goods Trade Balance",
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
