import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "goods exports",
  indicatorCode: "GOODS_EXPORTS",
  staticDataPath: dataSources.unctadGoodsTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Goods Exports Ranking",
  linkAriaMetric: "Goods Exports",
  displayScaleConfig: {
    valueScaleMode: "usdMillionsMagnitude",
  },
});
