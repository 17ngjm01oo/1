import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "GDP per capita",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "NGDPDPC",
  rankingTitleBase: "GDP per Capita Ranking",
  linkAriaMetric: "GDP per capita",
  displayScaleConfig: valueFormats.currencyUnitsWhole,
});
