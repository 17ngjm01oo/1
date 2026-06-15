import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "imports",
  indicatorCode: "IMPORTS",
  staticDataPath: dataSources.unctadTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Imports Ranking",
  linkAriaMetric: "Imports",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
