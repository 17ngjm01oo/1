import { countries } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { appendTerritoryNote, isTerritory, markTerritoryElement } from "./countryTypes.js";
import { formatCompactDisplayValue, getDisplayScale } from "./chart.js";
import { getFlagEmoji } from "./flags.js";
import { initializeRankingFilters } from "./rankingFilters.js";
import { showRankingLoadError, updateRankingSummaryDisplay } from "./rankingSummary.js";
import { initializeRankingSort } from "./rankingSort.js";
import { initializeRankingTerritoryToggle } from "./rankingTerritoryToggle.js";
import { appendRankingValueCell } from "./rankingValueBar.js";
import "./rankingTopNav.js";
import { getIndicatorSeriesMap } from "./seriesData.js";

export function initializeRankingPage(config) {
  initializeRankingCountrySearch(config);
  appendTerritoryNote(document.querySelector(".ranking-notes"));

  const state = {
    allRankingRows: [],
    activeScope: null,
    sortOrder: "highest",
    showTerritories: true,
  };

  state.showTerritories = initializeRankingTerritoryToggle({
    initialValue: state.showTerritories,
    onChange(showTerritories) {
      state.showTerritories = showTerritories;
      renderScopedRanking(config, state);
    },
  });

  state.sortOrder = initializeRankingSort({
    initialValue: state.sortOrder,
    onChange(sortOrder) {
      state.sortOrder = sortOrder;
      renderScopedRanking(config, state);
    },
  });

  initializeRanking(config, state).catch((error) => {
    console.error(`[Ranking] Failed to initialize ${config.logName} ranking.`, error);
    showRankingError();
  });
}

function initializeRankingCountrySearch(config) {
  const rootHref = document.body.dataset.rootHref ?? "../../";
  const pagePathSegment = getCountryPagePathSegment(config);

  initializeCountrySelector({
    countryPool: countries.filter((country) => country.slug && country.code !== "G001"),
    getCountryHref(country) {
      const indicatorPath = pagePathSegment ? `${pagePathSegment}/` : "";
      return `${rootHref}countries/${country.slug}/${indicatorPath}`;
    },
    searchInputSelector: "#rankingCountrySearchInput",
    resultsSelector: "#rankingCountrySearchResults",
  });
}

function getCountryPagePathSegment(config) {
  return config.hasCountryIndicatorPage === false ? "" : document.body.dataset.rankingDirectory ?? "";
}

async function initializeRanking(config, state) {
  state.activeScope = initializeRankingFilters();

  if (!config.staticDataPath) {
    throw new Error(`staticDataPath is required for ${config.logName} ranking.`);
  }

  const dataUrl = new URL(config.staticDataPath, import.meta.url);
  const response = await fetch(dataUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Static ${config.logName} data file request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  state.allRankingRows = buildRankingRows(data, config);
  renderScopedRanking(config, state);
}

function buildRankingRows(data, config) {
  const valuesByCountry = getIndicatorSeriesMap(data, config.indicatorCode);

  if (!valuesByCountry || typeof valuesByCountry !== "object") {
    throw new Error(`Static ${config.logName} data file is missing ${config.indicatorCode} series.`);
  }

  return countries
    .filter((country) => country.includeInRankings !== false)
    .map((country) => {
      const latestPoint = getLatestNumericPoint(valuesByCountry[country.code], config);

      if (!latestPoint) {
        return null;
      }

      return {
        ...country,
        value: latestPoint.value,
        year: latestPoint.year,
      };
    })
    .filter(Boolean)
    .sort((countryA, countryB) => countryB.value - countryA.value);
}

function renderScopedRanking(config, state) {
  const rankingRows = sortRankingRows(
    filterRankingRows(state.allRankingRows, state.activeScope, state.showTerritories),
    state.sortOrder,
  );
  updateRankingTitle(config, state.activeScope);
  renderRankingTable(config, rankingRows);
  updateRankingSummary(rankingRows);
}

function sortRankingRows(rankingRows, sortOrder) {
  const direction = sortOrder === "lowest" ? 1 : -1;
  return [...rankingRows].sort((countryA, countryB) => direction * (countryA.value - countryB.value));
}

function updateRankingTitle(config, scope) {
  const rankingTableTitle = document.querySelector("#ranking-table-title");

  if (!rankingTableTitle) {
    return;
  }

  const scopeLabel = scope?.label ?? "World";
  rankingTableTitle.textContent = `Scope: ${scopeLabel}`;
}

function filterRankingRows(rankingRows, scope, showTerritories) {
  const rankingCountries = countries.filter((country) => country.includeInRankings !== false);
  const scopedCountryCodes = new Set(filterCountriesByScope(rankingCountries, scope).map((country) => country.code));
  return rankingRows.filter((country) => {
    return scopedCountryCodes.has(country.code) && (showTerritories || !isTerritory(country));
  });
}

function getLatestNumericPoint(series, config) {
  if (!series || typeof series !== "object" || Array.isArray(series)) {
    return null;
  }

  const points = Object.entries(series)
    .map(([yearKey, value]) => ({
      year: Number.parseInt(yearKey, 10),
      value: normalizeNumericValue(value),
    }))
    .filter(({ year, value }) => {
      return (
        Number.isInteger(year) &&
        year <= (config.endYear ?? Number.POSITIVE_INFINITY) &&
        year >= (config.startYear ?? Number.NEGATIVE_INFINITY) &&
        Number.isFinite(value)
      );
    })
    .sort((pointA, pointB) => pointB.year - pointA.year);

  return points[0] ?? null;
}

function renderRankingTable(config, rankingRows) {
  const rankingTableBody = document.querySelector("#rankingTableBody");
  const rootHref = document.body.dataset.rootHref ?? "../../";
  const valueBarScale = getValueBarScale(rankingRows);

  if (!rankingTableBody) {
    return;
  }

  rankingTableBody.innerHTML = "";

  if (rankingRows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "ranking-empty";
    cell.textContent = "No ranking data available.";
    row.append(cell);
    rankingTableBody.append(row);
    return;
  }

  rankingRows.forEach((country, index) => {
    const row = document.createElement("tr");
    markTerritoryElement(row, country);
    const rankCell = document.createElement("td");
    const flagCell = document.createElement("td");
    const countryCell = document.createElement("td");
    const valueCell = document.createElement("td");
    const yearCell = document.createElement("td");
    const displayScale = getDisplayScale([{ year: country.year, value: country.value }], config.displayScaleConfig);

    rankCell.textContent = String(index + 1);
    flagCell.className = "ranking-flag";
    flagCell.textContent = getFlagEmoji(country.code);
    countryCell.className = "ranking-country";

    const countryLink = document.createElement("a");
    countryLink.href = `${rootHref}countries/${country.slug}/`;
    countryLink.setAttribute("aria-label", `Open ${country.name} country page`);

    const countryLinkText = document.createElement("span");
    countryLinkText.textContent = country.name;

    const countryLinkArrow = document.createElement("span");
    countryLinkArrow.className = "ranking-value-link-arrow";
    countryLinkArrow.setAttribute("aria-hidden", "true");
    countryLinkArrow.textContent = "↗";

    countryLink.append(countryLinkText, countryLinkArrow);
    countryCell.append(countryLink);

    const pagePathSegment = getCountryPagePathSegment(config);
    appendRankingValueCell(valueCell, {
      href: pagePathSegment ? `${rootHref}countries/${country.slug}/${pagePathSegment}/` : "",
      text: formatCompactDisplayValue(country.value, displayScale),
      ariaLabel: `Open ${country.name} ${config.linkAriaMetric} page`,
      value: country.value,
      valueBarScale,
    });
    yearCell.textContent = String(country.year);

    row.append(rankCell, flagCell, countryCell, valueCell, yearCell);
    rankingTableBody.append(row);
  });
}

function getValueBarScale(rankingRows) {
  return rankingRows.reduce(
    (scale, row) => {
      if (!Number.isFinite(row.value)) {
        return scale;
      }

      if (row.value < 0) {
        scale.negativeMagnitude = Math.max(scale.negativeMagnitude, Math.abs(row.value));
      } else {
        scale.positiveMagnitude = Math.max(scale.positiveMagnitude, row.value);
      }

      return scale;
    },
    { negativeMagnitude: 0, positiveMagnitude: 0 },
  );
}

function updateRankingSummary(rankingRows) {
  updateRankingSummaryDisplay({
    summaryElement: document.querySelector("#rankingSummary"),
    countElement: document.querySelector("#rankingCount"),
    rowCount: rankingRows.length,
  });
}

function showRankingError() {
  showRankingLoadError({
    summaryElement: document.querySelector("#rankingSummary"),
    countElement: document.querySelector("#rankingCount"),
  });

  const rankingTableBody = document.querySelector("#rankingTableBody");

  if (rankingTableBody) {
    rankingTableBody.innerHTML = "";
  }
}

function normalizeNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replaceAll(",", ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}
