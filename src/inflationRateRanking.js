import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "inflation rate",
  indicatorCode: "PCPIPCH",
  rankingTitleBase: "Inflation Rate Ranking",
  pagePathSegment: "inflation-rate",
  linkAriaMetric: "Inflation Rate",
  displayScaleConfig: {
    valueScale: 1,
    tooltipPrefix: "",
    tooltipUnit: "",
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
