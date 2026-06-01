import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government gross debt",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXWDG_NGDP",
  rankingTitleBase: "Government Gross Debt Ranking",
  linkAriaMetric: "Government Gross Debt",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
