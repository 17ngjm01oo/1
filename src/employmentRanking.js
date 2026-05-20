import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "employment",
  indicatorCode: "LE",
  rankingTitleBase: "Employment Ranking",
  pagePathSegment: "employment",
  linkAriaMetric: "Employment",
  displayScaleConfig: {
    valueScaleMode: "populationMagnitude",
  },
});
