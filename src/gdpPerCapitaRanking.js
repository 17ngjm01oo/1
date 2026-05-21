import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "GDP per capita",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDPDPC",
  rankingTitleBase: "GDP per Capita Ranking",
  pagePathSegment: "gdp-per-capita",
  linkAriaMetric: "GDP per capita",
  displayScaleConfig: {
    currencyCode: "USD",
    valueScaleMode: "currencyUnitsMagnitude",
    maximumFractionDigits: 0,
  },
});
