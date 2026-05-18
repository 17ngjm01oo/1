import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";

renderEconomicRankingLinks(document.querySelector("#rankingTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderPopulationRankingLinks(document.querySelector("#populationTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});
