import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "current account balance percent of GDP",
  indicatorCode: "BCA_NGDPD",
  rankingTitleBase: "Current Account Balance Percent of GDP Ranking",
  pagePathSegment: "current-account-balance-percent-gdp",
  linkAriaMetric: "Current Account Balance Percent of GDP",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
