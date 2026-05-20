import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "nominal GDP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDPD",
  rankingTitleBase: "GDP Ranking",
  pagePathSegment: "gdp",
  linkAriaMetric: "GDP",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
