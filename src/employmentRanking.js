import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "employment",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "LE",
  rankingTitleBase: "Employment Ranking",
  linkAriaMetric: "Employment",
  displayScaleConfig: valueFormats.populationMagnitude,
});
