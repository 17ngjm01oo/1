import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "current account balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "BCA",
  rankingTitleBase: "Current Account Balance Ranking",
  linkAriaMetric: "Current Account Balance",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
