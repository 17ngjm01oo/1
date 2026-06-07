import { initializeRankingPage } from "./rankingPage.js";
import { dataSources } from "./dataSources.js";
import { valueFormats } from "./valueFormats.js";

initializeRankingPage({
  logName: "government net debt",
  staticDataPath: dataSources.weoCurrentPrices.rankingStaticDataPath,
  indicatorCode: "GGXWDN_NGDP",
  rankingTitleBase: "Government Net Debt (% of GDP) Ranking",
  linkAriaMetric: "Government Net Debt (% of GDP)",
  countryPageKind: "government-debt",
  displayScaleConfig: valueFormats.percentOneDecimal,
});
