import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

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

renderTradeRankingLinks(document.querySelector("#tradeTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderFiscalRankingLinks(document.querySelector("#fiscalTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderEnvironmentalRankingLinks(document.querySelector("#environmentalTopNav"), {
  rootHref: document.body.dataset.rootHref ?? "../../",
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});
