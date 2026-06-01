import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "population",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "SP.POP.TOTL",
  startYear: dataSources.worldBankPopulation.startYear,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Population Ranking",
  linkAriaMetric: "Population",
  displayScaleConfig: valueFormats.populationUnitsMagnitude,
});
