import { seriesConfigs } from "./config.js";
import { createIndicatorInfoButton } from "./indicatorInfoUi.js";

const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));

export function renderRankingLinks(
  nav,
  rankings,
  {
    rootHref = "./",
    currentPageKind = "",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
    useDisplayUnitLabels = false,
  } = {},
) {
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  rankings.forEach((ranking) => {
    if (useDisplayUnitLabels) {
      nav.append(createRankingHubLink(ranking, {
        rootHref,
        currentScopeSlug,
        currentPageKind,
        currentRankingDirectory,
        highlightCurrent,
      }));
      return;
    }

    const link = document.createElement("a");
    link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = ranking.label;

    if (highlightCurrent && isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory })) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}

function createRankingHubLink(
  ranking,
  { rootHref, currentScopeSlug, currentPageKind, currentRankingDirectory, highlightCurrent },
) {
  const row = document.createElement("span");
  const link = document.createElement("a");
  const seriesConfig = seriesConfigById.get(ranking.seriesId);
  const displayUnit = seriesConfig?.displayUnit ?? "";

  row.className = "rankings-hub-link-row";
  link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
  link.textContent = seriesConfig?.titleTemplate ?? ranking.label;

  if (highlightCurrent && isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory })) {
    link.className = "is-current";
    link.setAttribute("aria-current", "page");
  }

  if (displayUnit) {
    link.append(document.createTextNode(" "));
    const unitElement = document.createElement("span");
    unitElement.className = "indicator-display-unit";
    unitElement.textContent = `(${displayUnit})`;
    link.append(unitElement);
  }

  row.append(link, createIndicatorInfoButton({
    rankingDirectory: ranking.directory,
    label: ranking.label,
  }));
  return row;
}

function isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory }) {
  if (ranking.directory === currentRankingDirectory) {
    return true;
  }

  if (!currentPageKind) {
    return false;
  }

  return ranking.countryPageKind === currentPageKind;
}

export function getCountryIndicatorLinks(rankings) {
  const linksByPageKind = new Map();

  rankings
    .filter((ranking) => ranking.countryPageKind)
    .forEach((ranking) => {
      if (linksByPageKind.has(ranking.countryPageKind)) {
        return;
      }

      linksByPageKind.set(ranking.countryPageKind, {
        pageKind: ranking.countryPageKind,
        href: `../${ranking.countryPageKind}/`,
        label: ranking.countryPageLabel ?? ranking.label,
      });
    });

  return Array.from(linksByPageKind.values());
}
