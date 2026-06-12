import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "military spending",
  staticDataPath: dataSources.sipriMilitarySpending.rankingStaticDataPath,
  indicatorCode: "MILITARY_SPENDING_USD",
  startYear: dataSources.sipriMilitarySpending.startYear,
  endYear: dataSources.sipriMilitarySpending.endYear,
  rankingTitleBase: "Military Spending Ranking",
  linkAriaMetric: "Military Spending",
  displayScaleConfig: valueFormats.usdMagnitude,
});
