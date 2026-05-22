import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "GDP growth",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDP_RPCH",
  rankingTitleBase: "GDP Growth Rate Ranking",
  pagePathSegment: "gdp-growth",
  linkAriaMetric: "GDP Growth Rate",
  displayScaleConfig: {
    valueScale: 1,
    tooltipPrefix: "",
    tooltipUnit: "",
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
