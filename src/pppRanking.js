import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "PPP",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "PPPGDP",
  rankingTitleBase: "PPP Ranking",
  pagePathSegment: "ppp",
  linkAriaMetric: "PPP",
  displayScaleConfig: {
    valueScaleMode: "internationalDollarMagnitude",
  },
});
