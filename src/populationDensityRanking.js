import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "population density",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "EN.POP.DNST",
  startYear: dataSources.worldBankPopulation.startYear,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Population Density Ranking",
  linkAriaMetric: "Population Density",
  displayScaleConfig: valueFormats.decimalOne,
});
