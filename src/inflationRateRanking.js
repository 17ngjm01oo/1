import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "inflation rate",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
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
