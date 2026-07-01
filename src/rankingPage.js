import { countries } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { appendNote, appendTerritoryNote, isTerritory, markTerritoryElement } from "./countryTypes.js";
import { formatCompactDisplayValue, getSingleValueDisplayScale } from "./displayFormat.js";
import { createFlagImage } from "./flags.js";
import { initializeRankingFilters } from "./rankingFilters.js";
import { showRankingCount, showRankingLoading, showRankingLoadError } from "./rankingStatus.js";
import { initializeRankingSort } from "./rankingSort.js";
import { initializeTerritoryToggle } from "./territoryToggle.js";
import { appendRankingValueCells } from "./rankingValueBar.js";
import { initializeRankingYear } from "./rankingYear.js";
import { countryPageKindByRankingDirectory } from "./rankingCategories.js";
import { initializeIndicatorInfoTooltips } from "./indicatorInfoUi.js";
import "./rankingTopNav.js";

const worldShareHiddenIndicatorCodes = new Set([
  "NGDPDPC",
  "PPPPC",
  "NGDP_RPCH",
  "PCPIPCH",
  "LUR",
  "EN.POP.DNST",
  "SP.DYN.LE00.IN",
  "SP.DYN.TFRT.IN",
  "SM.POP.TOTL.ZS",
  "TRADE_BALANCE",
  "SERVICES_TRADE_BALANCE",
  "BCA_NGDPD",
  "GGXWDG_NGDP",
  "GGXWDN_NGDP",
  "GGXCNL_NGDP",
  "GGXONLB_NGDP",
  "GGR_NGDP",
  "GGX_NGDP",
  "MILITARY_SPENDING_PERCENT_GDP",
  "EN.GHG.CO2.PC.CE.AR5",
  "AG.LND.FRST.ZS",
]);

export function initializeRankingPage(config) {
  initializeRankingCountrySearch(config);
  initializeIndicatorInfoTooltips();
  const initialScope = getRankingScopeFromBody();
  const showWorldShare = shouldShowWorldShare(config, initialScope);
  const rankingNotes = document.querySelector(".ranking-notes");
  appendTerritoryNote(rankingNotes);
  appendRankingSummaryNote(rankingNotes, showWorldShare);
  removeLegacyRankingScopeTitle();

  const state = {
    allRankingRows: [],
    activeScope: null,
    sortOrder: "highest",
    showTerritories: true,
    selectedYear: null,
    rankingManifestUrl: null,
    rankingManifest: null,
    rankingDataByYear: new Map(),
    elements: {
      count: document.querySelector("#rankingCount"),
      summary: null,
      worldShareItem: null,
      pageTitle: document.querySelector("#ranking-title"),
      tableBody: document.querySelector("#rankingTableBody"),
      worldShareValue: null,
      averageValue: null,
    },
  };
  state.basePageTitle = state.elements.pageTitle?.textContent?.trim() ?? "";

  state.sortOrder = initializeRankingSort({
    initialValue: state.sortOrder,
    onChange(sortOrder) {
      state.sortOrder = sortOrder;
      renderScopedRanking(config, state);
    },
  });

  initializeRanking(config, state).catch((error) => {
    console.error(`[Ranking] Failed to initialize ${config.logName} ranking.`, error);
    showRankingError(state);
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

function shouldShowWorldShare(config, scope = null) {
  return !isWorldScope(scope) && !worldShareHiddenIndicatorCodes.has(config.indicatorCode);
}

function getRankingScopeFromBody() {
  const type = document.body.dataset.rankingScopeType;
  const id = document.body.dataset.rankingScopeId;

  if (!type || !id) {
    return null;
  }

  return { type, id };
}

function isWorldScope(scope) {
  return scope?.type === "world" || scope?.id === "WORLD";
}

function appendRankingSummaryNote(container, showWorldShare) {
  appendNote(container, {
    className: "ranking-summary-note",
    text: showWorldShare
      ? "Average is an unweighted mean calculated from the table; World Share is also calculated from the table. Territories are excluded from both."
      : "Average is an unweighted mean calculated from the table and excludes territories.",
  });
}

function removeLegacyRankingScopeTitle() {
  const rankingTableTitle = document.querySelector("#ranking-table-title");
  const rankingCard = rankingTableTitle?.closest(".ranking-card");

  rankingCard?.removeAttribute("aria-labelledby");
  rankingCard?.setAttribute("aria-label", "Ranking table");
  rankingTableTitle?.remove();
}

function getCountryPagePathSegment(config) {
  if (config.hasCountryIndicatorPage === false) {
    return "";
  }

  const rankingDirectory = document.body.dataset.rankingDirectory ?? "";
  return config.countryPageKind ?? countryPageKindByRankingDirectory[rankingDirectory] ?? rankingDirectory;
}

async function initializeRanking(config, state) {
  state.activeScope = initializeRankingFilters();
  ensureRankingSummary(config, state);

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

  updateRankingPageTitle(state, state.activeScope);

  initializeRankingYear({
    years: availableYears,
    initialValue: state.selectedYear,
    onChange(year) {
      state.selectedYear = year;
      updateRankingPageTitle(state, state.activeScope);
      showRankingLoading({
        countElement: state.elements.count,
      });
      showRankingSummaryLoading(state);
      loadRankingYear(config, state, year).catch((error) => {
        console.error(`[Ranking] Failed to load ${config.logName} ranking for ${year}.`, error);
        if (year === state.selectedYear) {
          showRankingError(state);
        }
      });
    },
  });

  state.showTerritories = initializeTerritoryToggle({
    initialValue: state.showTerritories,
    onChange(showTerritories) {
      state.showTerritories = showTerritories;
      renderScopedRanking(config, state);
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

  if (!valuesByCountry || typeof valuesByCountry !== "object") {
    throw new Error(`Static ${config.logName} data file is missing ${config.indicatorCode} values.`);
  }

  return countries
    .filter((country) => country.includeInRankings !== false)
    .map((country) => {
      const value = normalizeNumericValue(valuesByCountry[country.code]);

      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        ...country,
        value,
        year: Number.parseInt(selectedYear, 10),
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
  updateRankingPageTitle(state, state.activeScope);
  renderRankingTable(config, state, rankingRows);
  renderRankingSummary(config, state, rankingRows);
  updateRankingCount(state, rankingRows);
}

function sortRankingRows(rankingRows, sortOrder) {
  const direction = sortOrder === "lowest" ? 1 : -1;
  return [...rankingRows].sort((countryA, countryB) => direction * (countryA.value - countryB.value));
}

function updateRankingPageTitle(state, scope) {
  if (!state.basePageTitle) {
    return;
  }

  const title = getRankingPageTitle(state, scope);

  if (state.elements.pageTitle) {
    state.elements.pageTitle.textContent = title;
  }

  document.title = title;
}

function getRankingPageTitle(state, scope) {
  const scopeLabel = scope?.label ?? "World";
  const yearSegment = state.selectedYear ? `, ${state.selectedYear}` : "";
  return `${state.basePageTitle}: ${scopeLabel}${yearSegment}`;
}

function filterRankingRows(rankingRows, scope, showTerritories) {
  return filterCountriesByScope(rankingRows, scope).filter((country) => showTerritories || !isTerritory(country));
}

function renderRankingTable(config, state, rankingRows) {
  const rankingTableBody = state.elements.tableBody;
  const rootHref = document.body.dataset.rootHref ?? "../../";
  const valueBarScale = getValueBarScale(rankingRows);
  const pagePathSegment = getCountryPagePathSegment(config);

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

  const fragment = document.createDocumentFragment();

  rankingRows.forEach((country, index) => {
    const row = document.createElement("tr");
    markTerritoryElement(row, country);
    const rankCell = document.createElement("td");
    const flagCell = document.createElement("td");
    const countryCell = document.createElement("td");
    const valueCell = document.createElement("td");
    const barCell = document.createElement("td");
    const displayScale = getSingleValueDisplayScale(country.value, config.displayScaleConfig);

    rankCell.textContent = String(index + 1);
    flagCell.className = "ranking-flag";
    const flagImage = createFlagImage(country.code, { rootHref });
    if (flagImage) {
      flagCell.append(flagImage);
    }
    countryCell.className = "ranking-country";

    const countryLink = document.createElement("a");
    countryLink.href = `${rootHref}countries/${country.slug}/`;
    countryLink.setAttribute("aria-label", `Open ${country.name} country page`);

    const countryLinkText = document.createElement("span");
    countryLinkText.textContent = country.name;

    countryLink.append(countryLinkText);
    countryCell.append(countryLink);

    appendRankingValueCells(valueCell, barCell, {
      href: pagePathSegment ? `${rootHref}countries/${country.slug}/${pagePathSegment}/` : "",
      text: formatCompactDisplayValue(country.value, displayScale),
      ariaLabel: `Open ${country.name} ${config.linkAriaMetric} page`,
      value: country.value,
      valueBarScale,
    });

    row.append(rankCell, flagCell, countryCell, valueCell, barCell);
    fragment.append(row);
  });

  rankingTableBody.append(fragment);
}

function ensureRankingSummary(config, state) {
  const rankingCard = document.querySelector(".ranking-card");
  const rankingCardHeader = rankingCard?.querySelector(".ranking-card-header");

  if (!rankingCardHeader || state.elements.summary) {
    return;
  }

  const summary = document.createElement("p");
  const showWorldShare = shouldShowWorldShare(config, state.activeScope);
  summary.className = "ranking-summary ranking-count";
  summary.innerHTML = `
    <span>Average: <span data-summary-key="average">-</span></span>
    ${showWorldShare ? `
      <span data-summary-key="world-share-item">World Share: <span data-summary-key="world-share">-</span></span>
    ` : ""}
  `;

  if (state.elements.count) {
    state.elements.count.after(summary);
  } else {
    rankingCardHeader.prepend(summary);
  }

  state.elements.summary = summary;
  state.elements.worldShareItem = summary.querySelector('[data-summary-key="world-share-item"]');
  state.elements.worldShareValue = summary.querySelector('[data-summary-key="world-share"]');
  state.elements.averageValue = summary.querySelector('[data-summary-key="average"]');
}

function renderRankingSummary(config, state, rankingRows) {
  const worldShareElement = state.elements.worldShareValue;
  const averageElement = state.elements.averageValue;

  if (!averageElement) {
    return;
  }

  const visibleRows = rankingRows.filter((row) => !isTerritory(row));
  const average = visibleRows.length > 0 ? sumRankingValues(visibleRows) / visibleRows.length : null;

  averageElement.textContent = formatRankingAverage(average, config);

  if (shouldShowWorldShare(config, state.activeScope) && worldShareElement) {
    const worldRows = state.allRankingRows.filter((row) => !isTerritory(row));
    const visibleTotal = sumRankingValues(visibleRows, true);
    const worldTotal = sumRankingValues(worldRows, true);
    const worldShare = worldTotal > 0 ? (visibleTotal / worldTotal) * 100 : null;
    worldShareElement.textContent = formatRankingPercent(worldShare);
  }
}

function showRankingSummaryLoading(state) {
  if (state.elements.worldShareValue) {
    state.elements.worldShareValue.textContent = "Loading...";
  }

  if (state.elements.averageValue) {
    state.elements.averageValue.textContent = "Loading...";
  }
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

function updateRankingCount(state, rankingRows) {
  showRankingCount({
    countElement: state.elements.count,
    rankingRows,
  });
}

function showRankingError(state) {
  showRankingLoadError({
    countElement: state?.elements?.count ?? document.querySelector("#rankingCount"),
  });
  clearRankingSummary(state);

  const rankingTableBody = state?.elements?.tableBody ?? document.querySelector("#rankingTableBody");

  if (rankingTableBody) {
    rankingTableBody.innerHTML = "";
  }
}

function clearRankingSummary(state) {
  if (state?.elements?.worldShareValue) {
    state.elements.worldShareValue.textContent = "—";
  }

  if (state?.elements?.averageValue) {
    state.elements.averageValue.textContent = "—";
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

function sumRankingValues(rankingRows, useAbsoluteValues = false) {
  return rankingRows.reduce((total, row) => {
    if (!Number.isFinite(row.value)) {
      return total;
    }

    return total + (useAbsoluteValues ? Math.abs(row.value) : row.value);
  }, 0);
}

function formatRankingPercent(value) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

function formatRankingAverage(value, config) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  const displayScale = getSingleValueDisplayScale(value, config.displayScaleConfig);
  return formatCompactDisplayValue(value, displayScale);
}
