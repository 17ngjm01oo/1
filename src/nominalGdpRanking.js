import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "nominal GDP",
  indicatorCode: "NGDPD",
  rankingTitleBase: "GDP Ranking",
  pagePathSegment: "gdp",
  linkAriaMetric: "GDP",
  displayScaleConfig: {
    valueScaleMode: "gdpMagnitude",
  },
});
