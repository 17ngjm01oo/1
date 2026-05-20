import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "PPP per capita",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "PPPPC",
  rankingTitleBase: "PPP per Capita Ranking",
  pagePathSegment: "ppp-per-capita",
  linkAriaMetric: "PPP per capita",
  displayScaleConfig: {
    valueScale: 1,
    tooltipPrefix: "$",
    tooltipUnit: "",
    maximumFractionDigits: 0,
  },
});
