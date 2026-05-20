import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "government net debt",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXWDN_NGDP",
  rankingTitleBase: "Government Net Debt Ranking",
  pagePathSegment: "government-net-debt",
  linkAriaMetric: "Government Net Debt",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
