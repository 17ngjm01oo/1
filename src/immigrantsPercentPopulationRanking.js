import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "immigrants percent population",
  staticDataPath: dataSources.worldBankPopulation.rankingStaticDataPath,
  indicatorCode: "SM.POP.TOTL.ZS",
  startYear: 1990,
  endYear: dataSources.worldBankPopulation.endYear,
  rankingTitleBase: "Immigrants (% of Population) Ranking",
  linkAriaMetric: "Immigrants (% of Population)",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
