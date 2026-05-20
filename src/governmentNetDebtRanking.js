import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "government net debt",
  indicatorCode: "GGXWDN_NGDP",
  rankingTitleBase: "Government Net Debt Ranking",
  pagePathSegment: "government-net-debt",
  linkAriaMetric: "Government Net Debt",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
