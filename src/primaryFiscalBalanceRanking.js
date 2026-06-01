import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "primary fiscal balance",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXONLB_NGDP",
  rankingTitleBase: "Primary Fiscal Balance Ranking",
  linkAriaMetric: "Primary Fiscal Balance",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
