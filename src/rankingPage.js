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
import { initializeRankingYear } from "./rankingYear.js";
import "./rankingTopNav.js";

export function initializeRankingPage(config) {
  initializeRankingCountrySearch(config);
  appendTerritoryNote(document.querySelector(".ranking-notes"));

  const state = {
    allRankingRows: [],
    activeScope: null,
    sortOrder: "highest",
    showTerritories: true,
    selectedYear: null,
    rankingManifestUrl: null,
    rankingManifest: null,
    rankingDataByYear: new Map(),
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

  state.rankingManifestUrl = new URL(config.staticDataPath, import.meta.url);
  state.rankingManifest = await fetchJson(state.rankingManifestUrl, config.logName);

  const availableYears = getAvailableYears(state.rankingManifest, config.indicatorCode);
  state.selectedYear = availableYears[0] ?? null;

  if (!state.selectedYear) {
    throw new Error(`Static ${config.logName} ranking manifest has no years for ${config.indicatorCode}.`);
  }

  initializeRankingYear({
    years: availableYears,
    initialValue: state.selectedYear,
    onChange(year) {
      state.selectedYear = year;
      showRankingLoading();
      loadRankingYear(config, state, year).catch((error) => {
        console.error(`[Ranking] Failed to load ${config.logName} ranking for ${year}.`, error);
        if (year === state.selectedYear) {
          showRankingError();
        }
      });
    },
  });

  await loadRankingYear(config, state, state.selectedYear);
}

async function loadRankingYear(config, state, year) {
  const data = await getRankingYearData(config, state, year);

  if (year !== state.selectedYear) {
    return;
  }

  state.allRankingRows = buildRankingRows(data, config, year);
  renderScopedRanking(config, state);
}

async function getRankingYearData(config, state, year) {
  if (!state.rankingDataByYear.has(year)) {
    const yearPathTemplate = state.rankingManifest?.yearPathTemplate;

    if (
      !yearPathTemplate
      || !yearPathTemplate.includes("{indicator}")
      || !yearPathTemplate.includes("{year}")
    ) {
      throw new Error(`Static ${config.logName} ranking manifest has no year path template.`);
    }

    const yearPath = yearPathTemplate
      .replace("{indicator}", encodeURIComponent(config.indicatorCode))
      .replace("{year}", year);
    const yearUrl = new URL(yearPath, state.rankingManifestUrl);
    const request = fetchJson(yearUrl, `${config.logName} ${year}`).catch((error) => {
      state.rankingDataByYear.delete(year);
      throw error;
    });
    state.rankingDataByYear.set(year, request);
  }

  return state.rankingDataByYear.get(year);
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Static ${label} data file request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getAvailableYears(manifest, indicatorCode) {
  const years = manifest?.yearsByIndicator?.[indicatorCode];

  if (!Array.isArray(years)) {
    return [];
  }

  return years.map(String).sort((yearA, yearB) => Number(yearB) - Number(yearA));
}

function buildRankingRows(data, config, selectedYear) {
  const valuesByCountry = data?.indicatorId === config.indicatorCode ? data.valuesByCountry : null;
  const yearsByCountry = data?.yearsByCountry;
  const numericSelectedYear = Number.parseInt(selectedYear, 10);

  if (!valuesByCountry || typeof valuesByCountry !== "object") {
    throw new Error(`Static ${config.logName} data file is missing ${config.indicatorCode} values.`);
  }

  return countries
    .filter((country) => country.includeInRankings !== false)
    .map((country) => {
      const value = normalizeNumericValue(valuesByCountry[country.code]);
      const year = Number.parseInt(yearsByCountry?.[country.code] ?? selectedYear, 10);

      if (!Number.isFinite(value) || !Number.isInteger(year)) {
        return null;
      }

      return {
        ...country,
        value,
        year,
        isCarryForwardYear: year !== numericSelectedYear,
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
    yearCell.classList.toggle("is-carry-forward-year", country.isCarryForwardYear);

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

function showRankingLoading() {
  const summaryElement = document.querySelector("#rankingSummary");
  const countElement = document.querySelector("#rankingCount");

  if (summaryElement) {
    summaryElement.hidden = false;
    summaryElement.textContent = "Loading ranking data...";
    summaryElement.classList.remove("is-error");
  }

  if (countElement) {
    countElement.textContent = "";
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
