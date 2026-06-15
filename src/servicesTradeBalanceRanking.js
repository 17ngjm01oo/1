import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "services trade balance",
  indicatorCode: "SERVICES_TRADE_BALANCE",
  staticDataPath: dataSources.unctadServicesTrade.rankingStaticDataPath,
  startYear: 2005,
  endYear: 2024,
  rankingTitleBase: "Services Trade Balance Ranking",
  linkAriaMetric: "Services Trade Balance",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
