import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "population density",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "EN.POP.DNST",
  startYear: dataSources.worldBankPopulation.startYear,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Population Density Ranking",
  pagePathSegment: "population-density",
  linkAriaMetric: "Population Density",
  displayScaleConfig: {
    maximumFractionDigits: 1,
  },
});
