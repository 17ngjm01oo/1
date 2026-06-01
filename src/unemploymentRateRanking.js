import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "unemployment rate",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "LUR",
  rankingTitleBase: "Unemployment Rate Ranking",
  linkAriaMetric: "Unemployment Rate",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
