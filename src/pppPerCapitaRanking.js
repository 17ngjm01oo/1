import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";

initializeRankingPage({
  logName: "PPP per capita",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "PPPPC",
  rankingTitleBase: "PPP GDP per Capita Ranking",
  linkAriaMetric: "PPP per capita",
  displayScaleConfig: {
    currencyCode: "Int$",
    valueScaleMode: "currencyUnitsMagnitude",
    maximumFractionDigits: 0,
  },
});
