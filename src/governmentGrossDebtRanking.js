import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "government gross debt",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXWDG_NGDP",
  rankingTitleBase: "Government Gross Debt Ranking",
  pagePathSegment: "government-gross-debt",
  linkAriaMetric: "Government Gross Debt",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
