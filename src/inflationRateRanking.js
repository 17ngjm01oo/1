import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "inflation rate",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "PCPIPCH",
  rankingTitleBase: "Inflation Rate Ranking",
  linkAriaMetric: "Inflation Rate",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
