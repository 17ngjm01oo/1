import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "area",
  staticDataPath: dataSources.ciaWorldFactbook.rankingStaticDataPath,
  indicatorCode: "CIA.AREA.K2",
  startYear: dataSources.ciaWorldFactbook.startYear,
  endYear: dataSources.ciaWorldFactbook.endYear,
  rankingTitleBase: "Area (km²) Ranking",
  hasCountryIndicatorPage: false,
  linkAriaMetric: "Area (km²)",
  displayScaleConfig: valueFormats.areaMagnitude,
});
