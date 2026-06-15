import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "exports",
  indicatorCode: "EXPORTS",
  staticDataPath: dataSources.unctadTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Exports Ranking",
  linkAriaMetric: "Exports",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
