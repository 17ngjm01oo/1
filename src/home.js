import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

renderEconomicRankingLinks(document.querySelector("#homeEconomicRankings"), {
  rootHref: "./",
});

renderPopulationRankingLinks(document.querySelector("#homePopulationRankings"), {
  rootHref: "./",
});

renderTradeRankingLinks(document.querySelector("#homeTradeRankings"), {
  rootHref: "./",
});

renderFiscalRankingLinks(document.querySelector("#homeFiscalRankings"), {
  rootHref: "./",
});

renderEnvironmentalRankingLinks(document.querySelector("#homeEnvironmentalRankings"), {
  rootHref: "./",
});
