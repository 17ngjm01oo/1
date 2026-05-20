import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "population",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "LP",
  rankingTitleBase: "Population Ranking",
  pagePathSegment: "population",
  linkAriaMetric: "Population",
  displayScaleConfig: {
    valueScaleMode: "populationMagnitude",
  },
});
