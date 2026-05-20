import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "current account balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "BCA",
  rankingTitleBase: "Current Account Balance Ranking",
  pagePathSegment: "current-account-balance",
  linkAriaMetric: "Current Account Balance",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
