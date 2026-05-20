import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "fiscal balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXCNL_NGDP",
  rankingTitleBase: "Fiscal Balance Ranking",
  pagePathSegment: "fiscal-balance",
  linkAriaMetric: "Fiscal Balance",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
