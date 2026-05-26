import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "total reserves including gold",
  staticDataPath: dataSources.worldBankWdi.rankingStaticDataPath,
  indicatorCode: "FI.RES.TOTL.CD",
  startYear: dataSources.worldBankWdi.startYear,
  endYear: dataSources.worldBankWdi.endYear,
  rankingTitleBase: "Total Reserves Ranking",
  pagePathSegment: "total-reserves",
  linkAriaMetric: "Total Reserves",
  displayScaleConfig: {
    valueScaleMode: "usdMagnitude",
  },
});
