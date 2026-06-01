import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "PPP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "PPPGDP",
  rankingTitleBase: "PPP GDP Ranking",
  linkAriaMetric: "PPP",
  displayScaleConfig: valueFormats.internationalDollarMagnitude,
});
