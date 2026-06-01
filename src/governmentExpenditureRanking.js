import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government expenditure",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGX_NGDP",
  rankingTitleBase: "Government Expenditure Ranking",
  linkAriaMetric: "Government Expenditure",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
