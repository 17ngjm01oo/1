import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "immigrants",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "SM.POP.TOTL",
  startYear: 1990,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Immigrants Ranking",
  linkAriaMetric: "Immigrants",
  displayScaleConfig: valueFormats.populationUnitsMagnitude,
});
