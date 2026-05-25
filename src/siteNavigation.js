import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

export function renderSiteHubLinks({ rootHref = "./" } = {}) {
  const navCards = document.querySelectorAll(".top-nav-card");

  navCards.forEach((navCard) => {
    navCard.replaceChildren(
      createSiteHubLink(`${rootHref}countries/`, "Countries", isCountryHubPage()),
      createSiteHubLink(`${rootHref}rankings/`, "Rankings", isRankingsPage()),
    );
  });
}

export function renderTopNavigationLinks({
  rootHref = "./",
  economicNavSelector = "#rankingTopNav",
  currentRankingDirectory = "",
  currentScopeSlug = "world",
  currentPageKind = "",
  highlightCurrent = true,
} = {}) {
  renderSiteHubLinks({ rootHref });

  renderEconomicRankingLinks(document.querySelector(economicNavSelector), {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    currentPageKind,
    highlightCurrent,
  });

  renderPopulationRankingLinks(document.querySelector("#populationTopNav"), {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
  });

  renderTradeRankingLinks(document.querySelector("#tradeTopNav"), {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
  });

  renderFiscalRankingLinks(document.querySelector("#fiscalTopNav"), {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
  });

  renderEnvironmentalRankingLinks(document.querySelector("#environmentalTopNav"), {
    rootHref,
    currentRankingDirectory,
    currentScopeSlug,
    highlightCurrent,
  });
}

function isCountryHubPage() {
  return document.body.dataset.pageKind === "country-hub";
}

function isRankingsPage() {
  return document.body.dataset.pageKind === "rankings-hub" || Boolean(document.body.dataset.rankingDirectory);
}

function createSiteHubLink(href, label, isCurrentPage) {
  const link = document.createElement("a");
  link.className = "country-hub-nav-link";
  link.href = href;
  link.textContent = label;

  if (isCurrentPage) {
    link.setAttribute("aria-current", "page");
  }

  return link;
}
