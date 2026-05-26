import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "goods trade balance",
  indicatorCode: "GOODS_TRADE_BALANCE",
  staticDataPath: dataSources.unctadGoodsTrade.rankingStaticDataPath,
  startYear: 1948,
  endYear: 2025,
  rankingTitleBase: "Goods Trade Balance Ranking",
  linkAriaMetric: "Goods Trade Balance",
  displayScaleConfig: {
    valueScaleMode: "usdMillionsMagnitude",
  },
});
