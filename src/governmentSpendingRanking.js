import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government spending",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGX_NGDP",
  rankingTitleBase: "Government Spending (% of GDP) Ranking",
  linkAriaMetric: "Government Spending (% of GDP)",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
