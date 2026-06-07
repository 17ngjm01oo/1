import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government gross debt",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXWDG_NGDP",
  rankingTitleBase: "Government Gross Debt (% of GDP) Ranking",
  linkAriaMetric: "Government Gross Debt (% of GDP)",
  countryPageKind: "government-debt",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
