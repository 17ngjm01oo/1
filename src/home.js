import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";

renderEconomicRankingLinks(document.querySelector("#homeEconomicRankings"), {
  rootHref: "./",
});

renderPopulationRankingLinks(document.querySelector("#homePopulationRankings"), {
  rootHref: "./",
});
