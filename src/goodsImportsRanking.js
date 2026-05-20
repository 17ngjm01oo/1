import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "goods imports",
  indicatorCode: "GOODS_IMPORTS",
  staticDataPath: dataSources.unctadGoodsTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Goods Imports Ranking",
  pagePathSegment: "goods-imports",
  linkAriaMetric: "Goods Imports",
  displayScaleConfig: {
    valueScaleMode: "usdMillionsMagnitude",
  },
});
