import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "current account balance",
  indicatorCode: "BCA",
  rankingTitleBase: "Current Account Balance Ranking",
  pagePathSegment: "current-account-balance",
  linkAriaMetric: "Current Account Balance",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
