import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "primary fiscal balance",
  indicatorCode: "GGXONLB_NGDP",
  rankingTitleBase: "Primary Fiscal Balance Ranking",
  pagePathSegment: "primary-fiscal-balance",
  linkAriaMetric: "Primary Fiscal Balance",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
