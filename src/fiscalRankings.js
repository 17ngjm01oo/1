import { renderRankingLinks } from "./rankingLinks.js";

export const fiscalRankings = [
  {
    directory: "government-gross-debt",
    label: "Government Gross Debt",
  },
  {
    directory: "government-net-debt",
    label: "Government Net Debt",
  },
  {
    directory: "fiscal-balance",
    label: "Fiscal Balance",
  },
  {
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance",
  },
  {
    directory: "government-revenue",
    label: "Government Revenue",
  },
  {
    directory: "government-expenditure",
    label: "Government Expenditure",
  },
  {
    directory: "total-reserves-including-gold",
    label: "Total Reserves Including Gold",
  },
];

export function renderFiscalRankingLinks(
  nav,
  {
    rootHref = "./",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  renderRankingLinks(nav, fiscalRankings, {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
    replace,
  });
}
