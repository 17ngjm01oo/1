import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "government expenditure",
  indicatorCode: "GGX_NGDP",
  rankingTitleBase: "Government Expenditure Ranking",
  pagePathSegment: "government-expenditure",
  linkAriaMetric: "Government Expenditure",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
