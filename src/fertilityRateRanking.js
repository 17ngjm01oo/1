import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "fertility rate",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "SP.DYN.TFRT.IN",
  startYear: dataSources.worldBankPopulation.startYear,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Fertility Rate Ranking",
  linkAriaMetric: "Fertility Rate",
  displayScaleConfig: {
    maximumFractionDigits: 2,
  },
});
