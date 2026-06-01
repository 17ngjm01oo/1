import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "CO2 emissions per capita",
  staticDataPath: dataSources.worldBankEnvironment.rankingStaticDataPath,
  indicatorCode: "EN.GHG.CO2.PC.CE.AR5",
  startYear: dataSources.worldBankEnvironment.startYear,
  endYear: dataSources.worldBankEnvironment.endYear,
  rankingTitleBase: "CO2 Emissions per Capita Ranking",
  linkAriaMetric: "CO2 Emissions per Capita",
  displayScaleConfig: valueFormats.co2EmissionsPerCapita,
});
