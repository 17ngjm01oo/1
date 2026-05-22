import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "area",
  staticDataPath: dataSources.ciaWorldFactbook.rankingStaticDataPath,
  indicatorCode: "CIA.AREA.K2",
  startYear: dataSources.ciaWorldFactbook.startYear,
  endYear: dataSources.ciaWorldFactbook.endYear,
  rankingTitleBase: "Area Ranking",
  pagePathSegment: null,
  linkAriaMetric: "Area",
  displayScaleConfig: {
    valueScaleMode: "areaMagnitude",
    maximumFractionDigits: 2,
    fallbackMaximumFractionDigits: 0,
    fallbackSmallValueMaximumFractionDigits: 2,
  },
});
