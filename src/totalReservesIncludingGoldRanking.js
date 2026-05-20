import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "total reserves including gold",
  staticDataPath: dataSources.worldBankWdi.rankingStaticDataPath,
  indicatorCode: "FI.RES.TOTL.CD",
  startYear: dataSources.worldBankWdi.startYear,
  endYear: dataSources.worldBankWdi.endYear,
  rankingTitleBase: "Total Reserves Including Gold Ranking",
  pagePathSegment: "total-reserves-including-gold",
  linkAriaMetric: "Total Reserves Including Gold",
  displayScaleConfig: {
    valueScaleMode: "usdMagnitude",
  },
});
