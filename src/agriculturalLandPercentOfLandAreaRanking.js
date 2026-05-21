import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "agricultural land percent of land area",
  staticDataPath: dataSources.worldBankEnvironment.rankingStaticDataPath,
  indicatorCode: "AG.LND.AGRI.ZS",
  startYear: dataSources.worldBankEnvironment.startYear,
  endYear: dataSources.worldBankEnvironment.endYear,
  rankingTitleBase: "Agricultural Land Percent of Land Area Ranking",
  pagePathSegment: "agricultural-land-percent-of-land-area",
  linkAriaMetric: "Agricultural Land Percent of Land Area",
  displayScaleConfig: {
    suffix: "%",
    suffixSpacing: "",
    maximumFractionDigits: 1,
  },
});
