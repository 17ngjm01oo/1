import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government revenue",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGR_NGDP",
  rankingTitleBase: "Government Revenue (% of GDP) Ranking",
  linkAriaMetric: "Government Revenue (% of GDP)",
  countryPageKind: "government-revenue-expenditure",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
