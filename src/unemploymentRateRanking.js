import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "unemployment rate",
  indicatorCode: "LUR",
  rankingTitleBase: "Unemployment Rate Ranking",
  pagePathSegment: "unemployment-rate",
  linkAriaMetric: "Unemployment Rate",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
