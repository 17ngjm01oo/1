import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "CO2 emissions",
  staticDataPath: dataSources.worldBankEnvironment.rankingStaticDataPath,
  indicatorCode: "EN.GHG.CO2.MT.CE.AR5",
  startYear: dataSources.worldBankEnvironment.startYear,
  endYear: dataSources.worldBankEnvironment.endYear,
  rankingTitleBase: "CO2 Emissions Ranking",
  linkAriaMetric: "CO2 Emissions",
  displayScaleConfig: valueFormats.co2Emissions,
});
