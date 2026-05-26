import { getCountryIndicatorLinks, renderRankingLinks } from "./rankingLinks.js";

export const fiscalRankings = [
  {
    seriesId: "governmentGrossDebt",
    directory: "government-gross-debt",
    label: "Government Gross Debt",
    countryPageKind: "government-gross-debt",
  },
  {
    seriesId: "governmentNetDebt",
    directory: "government-net-debt",
    label: "Government Net Debt",
    countryPageKind: "government-net-debt",
  },
  {
    seriesId: "fiscalBalance",
    directory: "fiscal-balance",
    label: "Fiscal Balance",
    countryPageKind: "fiscal-balance",
  },
  {
    seriesId: "primaryFiscalBalance",
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance",
    countryPageKind: "primary-fiscal-balance",
  },
  {
    seriesId: "governmentRevenue",
    directory: "government-revenue",
    label: "Government Revenue",
    countryPageKind: "government-revenue",
  },
  {
    seriesId: "governmentExpenditure",
    directory: "government-expenditure",
    label: "Government Expenditure",
    countryPageKind: "government-expenditure",
  },
  {
    seriesId: "totalReservesIncludingGold",
    directory: "total-reserves",
    label: "Total Reserves",
    countryPageKind: "total-reserves",
  },
];

export const fiscalIndicatorLinks = getCountryIndicatorLinks(fiscalRankings);

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
