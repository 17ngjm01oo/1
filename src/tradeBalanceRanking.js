import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "trade balance",
  indicatorCode: "TRADE_BALANCE",
  staticDataPath: dataSources.unctadTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Trade Balance Ranking",
  linkAriaMetric: "Trade Balance",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
