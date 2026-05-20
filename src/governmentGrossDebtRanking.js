import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "government gross debt",
  indicatorCode: "GGXWDG_NGDP",
  rankingTitleBase: "Government Gross Debt Ranking",
  pagePathSegment: "government-gross-debt",
  linkAriaMetric: "Government Gross Debt",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
