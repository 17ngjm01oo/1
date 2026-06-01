import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "GDP growth",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDP_RPCH",
  rankingTitleBase: "GDP Growth Ranking",
  linkAriaMetric: "GDP Growth",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
