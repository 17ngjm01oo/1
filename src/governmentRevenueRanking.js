import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "government revenue",
  indicatorCode: "GGR_NGDP",
  rankingTitleBase: "Government Revenue Ranking",
  pagePathSegment: "government-revenue",
  linkAriaMetric: "Government Revenue",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
