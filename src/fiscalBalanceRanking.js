import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "fiscal balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXCNL_NGDP",
  rankingTitleBase: "Fiscal Balance (% of GDP) Ranking",
  linkAriaMetric: "Fiscal Balance (% of GDP)",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
