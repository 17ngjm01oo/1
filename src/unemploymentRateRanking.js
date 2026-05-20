import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "unemployment rate",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
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
