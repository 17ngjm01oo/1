import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

const footerLinks = [
  { path: "about/", label: "About & Sources" },
  { path: "disclaimer-privacy-policy/", label: "Disclaimer & Privacy Policy" },
];

export function renderSiteHubLinks({ rootHref = "./" } = {}) {
  const navCards = document.querySelectorAll(".top-nav-card");

  navCards.forEach((navCard) => {
    navCard.replaceChildren(
      createSiteHubLink(`${rootHref}countries/`, "Countries", isCountryHubPage()),
      createSiteHubSeparator(),
      createSiteHubLink(`${rootHref}rankings/`, "Rankings", isRankingsPage()),
    );
  });
}

export function renderSiteFooter({ rootHref = "./" } = {}) {
  const pageShell = document.querySelector("main.page-shell");

  if (!pageShell) {
    return;
  }

  let footer = pageShell.querySelector(".site-footer-card");
  if (!footer) {
    footer = document.createElement("footer");
    footer.className = "site-footer-card";
    footer.setAttribute("aria-label", "Site information");
    pageShell.append(footer);
  }

  const nav = document.createElement("nav");
  nav.className = "site-footer-nav";
  nav.setAttribute("aria-label", "Site information links");

  footerLinks.forEach(({ path, label }) => {
    const link = document.createElement("a");
    link.className = "site-footer-link";
    link.href = `${rootHref}${path}`;
    link.textContent = label;
    nav.append(link);
  });

  footer.replaceChildren(nav);
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
  renderSiteFooter({ rootHref });

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

function createSiteHubSeparator() {
  const separator = document.createElement("span");
  separator.className = "country-hub-nav-separator";
  separator.setAttribute("aria-hidden", "true");
  separator.textContent = "|";
  return separator;
}
