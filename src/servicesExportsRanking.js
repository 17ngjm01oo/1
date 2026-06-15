import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "services exports",
  indicatorCode: "SERVICES_EXPORTS",
  staticDataPath: dataSources.unctadServicesTrade.rankingStaticDataPath,
  startYear: 2005,
  endYear: 2024,
  rankingTitleBase: "Services Exports Ranking",
  linkAriaMetric: "Services Exports",
  displayScaleConfig: valueFormats.usdMillionsMagnitude,
});
