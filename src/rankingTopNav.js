import { renderEconomicRankingLinks } from "./economicRankings.js";

renderEconomicRankingLinks(document.querySelector("#rankingTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});
