import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

export function renderCountryHubLink({ rootHref = "./" } = {}) {
  const navCards = document.querySelectorAll(".top-nav-card");

  navCards.forEach((navCard) => {
    if (navCard.querySelector(".country-hub-nav-link")) {
      return;
    }

    const link = document.createElement("a");
    link.className = "country-hub-nav-link";
    link.href = `${rootHref}countries/`;
    link.textContent = "Countries";

    if (isCountryHubPage()) {
      link.setAttribute("aria-current", "page");
    }

    navCard.prepend(link);
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
  renderCountryHubLink({ rootHref });

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
