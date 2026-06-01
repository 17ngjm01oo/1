import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "nominal GDP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDPD",
  rankingTitleBase: "GDP Ranking",
  linkAriaMetric: "GDP",
  displayScaleConfig: valueFormats.gdpMagnitude,
});
