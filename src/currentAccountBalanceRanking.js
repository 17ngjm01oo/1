import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "current account balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "BCA",
  rankingTitleBase: "Current Account Balance Ranking",
  linkAriaMetric: "Current Account Balance",
  displayScaleConfig: valueFormats.gdpMagnitude,
});
