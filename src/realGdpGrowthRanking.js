import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "real GDP growth",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
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
