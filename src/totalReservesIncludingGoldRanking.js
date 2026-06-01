import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "total reserves including gold",
  staticDataPath: dataSources.worldBankWdi.rankingStaticDataPath,
  indicatorCode: "FI.RES.TOTL.CD",
  startYear: dataSources.worldBankWdi.startYear,
  endYear: dataSources.worldBankWdi.endYear,
  rankingTitleBase: "Total Reserves Ranking",
  linkAriaMetric: "Total Reserves",
  displayScaleConfig: valueFormats.usdMagnitude,
});
