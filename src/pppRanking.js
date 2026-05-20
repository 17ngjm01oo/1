import { initializeRankingPage } from "./rankingPage.js";

initializeRankingPage({
  logName: "PPP",
  indicatorCode: "PPPGDP",
  rankingTitleBase: "PPP Ranking",
  pagePathSegment: "ppp",
  linkAriaMetric: "PPP",
  displayScaleConfig: {
    valueScaleMode: "internationalDollarMagnitude",
  },
});
