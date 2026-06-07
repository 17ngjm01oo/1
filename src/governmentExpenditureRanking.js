import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government expenditure",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGX_NGDP",
  rankingTitleBase: "Government Expenditure (% of GDP) Ranking",
  linkAriaMetric: "Government Expenditure (% of GDP)",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
