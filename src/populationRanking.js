import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "population",
  indicatorCode: "LP",
  rankingTitleBase: "Population Ranking",
  pagePathSegment: "population",
  linkAriaMetric: "Population",
  displayScaleConfig: {
    valueScaleMode: "populationMagnitude",
  },
});
