import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "government expenditure",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGX_NGDP",
  rankingTitleBase: "Government Expenditure Ranking",
  pagePathSegment: "government-expenditure",
  linkAriaMetric: "Government Expenditure",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
