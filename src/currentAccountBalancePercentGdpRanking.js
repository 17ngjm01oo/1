import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "current account balance percent of GDP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "BCA_NGDPD",
  rankingTitleBase: "Current Account Balance (% of GDP) Ranking",
  pagePathSegment: "current-account-balance-percent-gdp",
  linkAriaMetric: "Current Account Balance (% of GDP)",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
