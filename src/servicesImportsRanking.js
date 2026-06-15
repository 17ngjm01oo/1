import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "services imports",
  indicatorCode: "SERVICES_IMPORTS",
  staticDataPath: dataSources.unctadServicesTrade.rankingStaticDataPath,
  startYear: 2005,
  endYear: 2024,
  rankingTitleBase: "Services Imports Ranking",
  linkAriaMetric: "Services Imports",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
