import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "fiscal balance",
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
