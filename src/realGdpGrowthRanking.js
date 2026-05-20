import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "real GDP growth",
  indicatorCode: "NGDP_RPCH",
  rankingTitleBase: "Real GDP Growth Ranking",
  pagePathSegment: "gdp-growth",
  linkAriaMetric: "Real GDP Growth Rate",
  displayScaleConfig: {
    valueScale: 1,
    tooltipPrefix: "",
    tooltipUnit: "",
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
