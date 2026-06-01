import { getCountryIndicatorLinks } from "./rankingLinks.js";

export const tradeRankings = [
  {
    seriesId: "currentAccountBalance",
    directory: "current-account-balance",
    label: "Current Account Balance",
    countryPageKind: "current-account-balance",
  },
  {
    seriesId: "currentAccountBalancePercentGdp",
    directory: "current-account-balance-percent-gdp",
    label: "Current Account Balance (% of GDP)",
    countryPageKind: "current-account-balance-percent-gdp",
  },
  {
    seriesId: "goodsExports",
    directory: "goods-exports",
    label: "Goods Exports",
    countryPageKind: "goods-exports",
  },
  {
    seriesId: "goodsImports",
    directory: "goods-imports",
    label: "Goods Imports",
    countryPageKind: "goods-imports",
  },
  {
    seriesId: "goodsTradeBalance",
    directory: "goods-trade-balance",
    label: "Goods Trade Balance",
    countryPageKind: "goods-trade-balance",
  },
];

export const tradeIndicatorLinks = getCountryIndicatorLinks(tradeRankings);
