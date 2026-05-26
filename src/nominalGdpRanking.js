import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "nominal GDP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDPD",
  rankingTitleBase: "GDP Ranking",
  linkAriaMetric: "GDP",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
