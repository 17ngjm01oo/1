import { renderRankingLinks } from "./rankingLinks.js";

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
  renderRankingLinks(nav, tradeRankings, {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
    replace,
  });
}
