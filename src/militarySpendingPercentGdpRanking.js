import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "military spending percent GDP",
  staticDataPath: dataSources.sipriMilitarySpending.rankingStaticDataPath,
  indicatorCode: "MILITARY_SPENDING_PERCENT_GDP",
  startYear: dataSources.sipriMilitarySpending.startYear,
  endYear: dataSources.sipriMilitarySpending.endYear,
  rankingTitleBase: "Military Spending (% of GDP) Ranking",
  linkAriaMetric: "Military Spending (% of GDP)",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
