import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government revenue",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGR_NGDP",
  rankingTitleBase: "Government Revenue Ranking",
  linkAriaMetric: "Government Revenue",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
