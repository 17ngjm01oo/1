import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "PPP per capita",
  indicatorCode: "PPPPC",
  rankingTitleBase: "PPP per Capita Ranking",
  pagePathSegment: "ppp-per-capita",
  linkAriaMetric: "PPP per capita",
  displayScaleConfig: {
    valueScale: 1,
    tooltipPrefix: "$",
    tooltipUnit: "",
    maximumFractionDigits: 0,
  },
});
