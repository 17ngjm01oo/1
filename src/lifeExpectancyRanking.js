import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "life expectancy",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "SP.DYN.LE00.IN",
  startYear: dataSources.worldBankPopulation.startYear,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Life Expectancy Ranking",
  linkAriaMetric: "Life Expectancy",
  displayScaleConfig: valueFormats.decimalOne,
});
