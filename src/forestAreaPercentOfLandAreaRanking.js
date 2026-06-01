import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "forest area percent of land area",
  staticDataPath: dataSources.worldBankEnvironment.rankingStaticDataPath,
  indicatorCode: "AG.LND.FRST.ZS",
  startYear: dataSources.worldBankEnvironment.startYear,
  endYear: dataSources.worldBankEnvironment.endYear,
  rankingTitleBase: "Forest Area Ranking",
  linkAriaMetric: "Forest Area",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
