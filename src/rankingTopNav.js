import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";
import { renderCountryHubLink } from "./siteNavigation.js";

const rootHref = document.body.dataset.rootHref ?? "../../";

renderCountryHubLink({ rootHref });

renderEconomicRankingLinks(document.querySelector("#rankingTopNav"), {
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderPopulationRankingLinks(document.querySelector("#populationTopNav"), {
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderTradeRankingLinks(document.querySelector("#tradeTopNav"), {
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderFiscalRankingLinks(document.querySelector("#fiscalTopNav"), {
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

renderEnvironmentalRankingLinks(document.querySelector("#environmentalTopNav"), {
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});
