import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { filterCountries, formatCountryMetaText, initializeCountrySelector } from "./countrySelector.js";
import { getCurrencyCode } from "./currencyCodes.js";
import { createFlagImage } from "./flags.js";
import { getIndicatorDisplayText, renderIndicatorLabel } from "./indicatorLabels.js";
import { countryPageRankings, rankingCategoryById } from "./rankingCategories.js";
import { renderTopNavigationLinks } from "./siteNavigation.js";
import { buildStaticDataRequestUrls, fetchStaticData } from "./staticData.js";
import { transformSeriesData } from "./transform.js";
import { clearLineChart, renderLineChart } from "./chart.js";
import { formatCompactDisplayValue, getDisplayScale } from "./displayFormat.js";

const pageDefinitions = {
  gdp: {
    logPrefix: "GDP page",
    group: "economy",
    documentTitleMetric: "GDP",
  },
  "gdp-per-capita": {
    logPrefix: "GDP per capita page",
    group: "economy",
    documentTitleMetric: "GDP per capita",
  },
  "gdp-growth": {
    logPrefix: "GDP growth page",
    group: "economy",
    documentTitleMetric: "GDP Growth",
  },
  "inflation-rate": {
    logPrefix: "Inflation rate page",
    group: "economy",
    documentTitleMetric: "Inflation Rate",
  },
  population: {
    logPrefix: "Population page",
    group: "population",
    documentTitleMetric: "Population",
  },
  "population-density": {
    logPrefix: "Population density page",
    group: "population",
    documentTitleMetric: "Population Density",
  },
  employment: {
    logPrefix: "Employment page",
    group: "population",
    documentTitleMetric: "Employment",
  },
  "unemployment-rate": {
    logPrefix: "Unemployment rate page",
    group: "population",
    documentTitleMetric: "Unemployment Rate",
  },
  "life-expectancy": {
    logPrefix: "Life expectancy page",
    group: "population",
    documentTitleMetric: "Life Expectancy",
  },
  "fertility-rate": {
    logPrefix: "Fertility rate page",
    group: "population",
    documentTitleMetric: "Fertility Rate",
  },
  "ppp-gdp": {
    logPrefix: "PPP page",
    group: "economy",
    documentTitleMetric: "PPP GDP",
  },
  "ppp-gdp-per-capita": {
    logPrefix: "PPP per capita page",
    group: "economy",
    documentTitleMetric: "PPP GDP per Capita",
  },
  "current-account-balance": {
    logPrefix: "Current account balance page",
    group: "trade",
    documentTitleMetric: "Current Account Balance",
  },
  "goods-trade": {
    logPrefix: "Goods trade page",
    group: "trade",
    documentTitleMetric: "Goods Exports, Imports and Trade Balance",
  },
  "government-debt": {
    logPrefix: "Government debt page",
    group: "finance",
    documentTitleMetric: "Government Debt",
  },
  "fiscal-balance": {
    logPrefix: "Fiscal balance page",
    group: "finance",
    documentTitleMetric: "Fiscal Balance",
  },
  "government-revenue-expenditure": {
    logPrefix: "Government revenue and expenditure page",
    group: "finance",
    documentTitleMetric: "Government Revenue and Expenditure",
  },
  "total-reserves": {
    logPrefix: "Total reserves including gold page",
    group: "finance",
    documentTitleMetric: "Total Reserves",
  },
  "forest-area": {
    logPrefix: "Forest area percent of land area page",
    group: "environment",
    documentTitleMetric: "Forest Area",
  },
  "co2-emissions": {
    logPrefix: "CO2 emissions page",
    group: "environment",
    documentTitleMetric: "CO2 Emissions",
  },
};
const pageKind = pageDefinitions[document.body.dataset.pageKind] ? document.body.dataset.pageKind : "gdp";
const pageDefinition = {
  ...pageDefinitions[pageKind],
  seriesIds: getCountryPageSeriesIds(pageKind, pageDefinitions[pageKind]),
};
const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));
const pageSeriesConfigs = pageDefinition.seriesIds
  .map((seriesId) => seriesConfigById.get(seriesId))
  .filter(Boolean);
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const rankingDirectoryBySeriesId = Object.fromEntries(
  countryPageRankings.map((ranking) => [ranking.seriesId, ranking.directory]),
);
const rankedSeriesIds = new Set(Object.keys(rankingDirectoryBySeriesId));
const comparableSeriesIds = rankedSeriesIds;
const seriesRuntimeState = new Map();

function getCountryPageSeriesIds(targetPageKind, { group }) {
  const category = rankingCategoryById[group];
  return (category?.profileRankings ?? [])
    .filter((ranking) => ranking.countryPageKind === targetPageKind)
    .map((ranking) => ranking.seriesId);
}

initializePage().catch((error) => {
  console.error(`[${pageDefinition.logPrefix}] Failed to initialize page.`, error);
  showPageError();
});

async function initializePage() {
  if (!selectedCountry) {
    throw new Error(`Country code was not found: ${countryCode}`);
  }

  document.title = `${selectedCountry.name} ${pageDefinition.documentTitleMetric}`;
  initializeCountrySelector({
    selectedCountry,
    onSelect(country) {
      navigateToCountry(country);
    },
  });
  updateTopRankingLinks();
  updateCountryHeading(selectedCountry);

  const countrySeriesConfigs = pageSeriesConfigs.map((seriesConfig) =>
    buildCountrySeriesConfig(seriesConfig, selectedCountry),
  );
  const visibleSeriesConfigs = countrySeriesConfigs.filter(shouldShowSeriesConfig);

  updateSeriesVisibility(countrySeriesConfigs);
  updateSeriesHeadings(visibleSeriesConfigs);
  initializeCompareSearches(visibleSeriesConfigs);

  await updateRelatedPageLinks();
  await Promise.all(visibleSeriesConfigs.map((seriesConfig) => loadAndRenderSeries(seriesConfig)));
}

function navigateToCountry(country) {
  window.location.href = `../../../countries/${country.slug}/${pageKind}/`;
}

function updateTopRankingLinks() {
  renderTopNavigationLinks({
    rootHref: "../../../",
    currentPageKind: pageKind,
    highlightCurrent: false,
  });
}

function buildCountrySeriesConfig(seriesConfig, country) {
  const currencyCode = seriesConfig.usesCountryCurrency
    ? getCurrencyCode(country.code)
    : seriesConfig.currencyCode;

  return {
    ...seriesConfig,
    staticDataPath: getCountryPageStaticDataPath(seriesConfig),
    countryCode: country.code,
    countryName: country.name,
    chartTitle: getSeriesChartTitle(seriesConfig, currencyCode),
    chartTitleCurrencyCode: currencyCode,
  };
}

function getCountryPageStaticDataPath(seriesConfig) {
  if (!seriesConfig.staticDataPath) {
    throw new Error(`staticDataPath is required for ${seriesConfig.id}.`);
  }

  return seriesConfig.staticDataPath.replace(/^\.\//, "../../../");
}

function getSeriesChartTitle(seriesConfig, currencyCode) {
  return getIndicatorDisplayText(seriesConfig, { currencyCode });
}

function updateCountryHeading(country) {
  const title = document.querySelector("#country-data-title");
  const relatedPageNav = document.querySelector("#countryRelatedPageNav");

  if (!title) {
    return;
  }

  title.innerHTML = "";
  const flagElement = createFlagImage(country.code, { className: "country-flag", rootHref: "../../../" });

  if (flagElement) {
    title.append(flagElement);
  }

  const nameElement = document.createElement("span");
  nameElement.className = "country-name";
  nameElement.textContent = country.name;

  const profileLink = document.createElement("a");
  profileLink.className = "country-profile-link";
  profileLink.href = "../";
  profileLink.append(document.createTextNode("View Country Profile"));

  title.append(nameElement);

  if (relatedPageNav) {
    relatedPageNav.before(profileLink);
  } else {
    title.append(profileLink);
  }
}

async function updateRelatedPageLinks() {
  const nav = document.querySelector("#countryRelatedPageNav");

  if (!nav) {
    return;
  }

  nav.innerHTML = "";
  const relatedLinks = rankingCategoryById[pageDefinition.group]?.indicatorLinks ?? [];

  for (const linkConfig of relatedLinks) {
    if (linkConfig.pageKind !== pageKind && !(await doesIndicatorPageHaveData(linkConfig.pageKind))) {
      continue;
    }

    const link = document.createElement("a");
    link.href = linkConfig.href;
    link.textContent = linkConfig.label;
    if (linkConfig.pageKind === pageKind) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }
    nav.append(link);
  }
}

async function doesIndicatorPageHaveData(targetPageKind) {
  const targetBasePageDefinition = pageDefinitions[targetPageKind];
  if (!targetBasePageDefinition) {
    return true;
  }

  const targetSeriesIds = getCountryPageSeriesIds(targetPageKind, targetBasePageDefinition);
  const targetSeriesConfigs = seriesConfigs
    .filter((seriesConfig) => targetSeriesIds.includes(seriesConfig.id))
    .map((seriesConfig) => buildCountrySeriesConfig(seriesConfig, selectedCountry))
    .filter(shouldShowSeriesConfig);

  try {
    for (const seriesConfig of targetSeriesConfigs) {
      const { data } = await fetchStaticData(seriesConfig);
      if (transformSeriesData(data, seriesConfig).length > 0) {
        return true;
      }
    }
  } catch (error) {
    console.error(`[${pageDefinition.logPrefix}] Failed to check related indicator availability.`, {
      targetPageKind,
      error,
    });
    return true;
  }

  return false;
}

function updateSeriesHeadings(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

    if (titleElement) {
      renderIndicatorLabel(titleElement, seriesConfig, {
        currencyCode: seriesConfig.chartTitleCurrencyCode,
      });
    }

    if (canvas) {
      canvas.setAttribute("aria-label", `${seriesConfig.countryName} ${seriesConfig.chartTitle} line chart`);
    }
  });
}

function updateSeriesVisibility(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const indicatorBlock = titleElement?.closest(".indicator-block");

    if (indicatorBlock) {
      indicatorBlock.hidden = !shouldShowSeriesConfig(seriesConfig);
    }
  });
}

function shouldShowSeriesConfig(seriesConfig) {
  return !(isNominalLocalCurrencySeries(seriesConfig) && seriesConfig.currencyCode === "USD");
}

function isNominalLocalCurrencySeries(seriesConfig) {
  return seriesConfig.id === "gdpNational" || seriesConfig.id === "gdpNationalPerCapita";
}

function initializeCompareSearches(countrySeriesConfigs) {
  countrySeriesConfigs
    .filter((seriesConfig) => comparableSeriesIds.has(seriesConfig.id))
    .forEach((seriesConfig) => {
      seriesRuntimeState.set(seriesConfig.id, {
        baseConfig: pageSeriesConfigs.find((pageSeriesConfig) => pageSeriesConfig.id === seriesConfig.id),
        mainConfig: seriesConfig,
        mainPoints: [],
        comparisonCountry: null,
        comparisonPoints: [],
        comparisonRequestId: 0,
        comparisonMatches: [],
        highlightedComparisonIndex: -1,
        hasMainData: false,
      });

      const { input } = getCompareElements(seriesConfig.id);

      if (!input) {
        return;
      }

      input.addEventListener("input", () => {
        renderCompareResults(seriesConfig.id, input.value);
      });

      input.addEventListener("keydown", (event) => {
        handleCompareSearchKeydown(event, seriesConfig.id);
      });

      input.addEventListener("focus", () => {
        if (input.value.trim()) {
          renderCompareResults(seriesConfig.id, input.value);
        }
      });

      updateCompareAvailability(seriesConfig.id);
    });
}

async function loadAndRenderSeries(seriesConfig) {
  const chartCard = document.querySelector(`#${seriesConfig.chartCardId}`);
  const overlayElement = document.querySelector(`#${seriesConfig.overlayId}`);
  const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

  try {
    showChartOverlay({
      chartCard,
      overlayElement,
      message: `Loading ${seriesConfig.countryName} data...`,
      state: "loading",
    });
    clearDataTable(seriesConfig);

    const requestUrls = buildStaticDataRequestUrls(seriesConfig);
    console.info(`[${pageDefinition.logPrefix}] ${seriesConfig.indicatorCode} static data file:`, requestUrls.appUrl);

    const { data, url } = await fetchStaticData(seriesConfig);
    updateSeriesSourceOverrideNotes(data, seriesConfig);
    const points = transformSeriesData(data, seriesConfig);
    const state = seriesRuntimeState.get(seriesConfig.id);

    if (points.length === 0) {
      clearLineChart(canvas);
      renderNoDataTable(seriesConfig);
      updateGlobalRankLabel(seriesConfig, null);
      if (state) {
        state.mainPoints = [];
        state.hasMainData = false;
        updateCompareAvailability(seriesConfig.id);
      }
      showChartOverlay({
        chartCard,
        overlayElement,
        message: `No data available for ${seriesConfig.countryName}.`,
        state: "no-data",
      });
      console.info(`[${pageDefinition.logPrefix}] No ${seriesConfig.indicatorCode} data points were found.`, {
        url,
        countryCode: seriesConfig.countryCode,
      });
      return;
    }

    renderLineChart(canvas, {
      points,
      config: seriesConfig,
    });
    updateGlobalRankLabel(seriesConfig, getGlobalRank(data, seriesConfig));
    if (state) {
      state.mainPoints = points;
      state.hasMainData = true;
      updateCompareAvailability(seriesConfig.id);
    }
    renderDataTable(points, seriesConfig);
    hideChartOverlay(chartCard, overlayElement);
  } catch (error) {
    clearLineChart(canvas);
    renderNoDataTable(seriesConfig);
    updateGlobalRankLabel(seriesConfig, null);
    const state = seriesRuntimeState.get(seriesConfig.id);
    if (state) {
      state.mainPoints = [];
      state.hasMainData = false;
      updateCompareAvailability(seriesConfig.id);
    }
    showChartOverlay({
      chartCard,
      overlayElement,
      message: `Failed to load ${seriesConfig.countryName} data.`,
      state: "error",
    });
    console.error(`[${pageDefinition.logPrefix}] Failed to load series.`, {
      seriesConfig,
      error,
    });
  }
}

function renderCompareResults(seriesId, query) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (!state || !results || !state.hasMainData || input?.disabled) {
    hideCompareResults(seriesId);
    return;
  }

  const normalizedQuery = query.trim();
  results.innerHTML = "";

  if (!normalizedQuery) {
    hideCompareResults(seriesId);
    return;
  }

  placeCompareResultsElement(seriesId, "search");

  const matchingCountries = filterCountries(normalizedQuery).filter((country) => {
    return country.code !== selectedCountry.code;
  });

  results.hidden = false;
  input?.setAttribute("aria-expanded", "true");
  state.comparisonMatches = matchingCountries;
  state.highlightedComparisonIndex = matchingCountries.length > 0 ? 0 : -1;

  if (matchingCountries.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "country-result-empty";
    emptyElement.textContent = "No matches found.";
    results.append(emptyElement);
    return;
  }

  matchingCountries.forEach((country, index) => {
    const resultButton = document.createElement("button");
    resultButton.className = "country-result";
    resultButton.type = "button";
    resultButton.setAttribute("role", "option");
    resultButton.id = `${seriesId}-compare-result-${country.code}`;
    resultButton.dataset.countryCode = country.code;
    resultButton.setAttribute("aria-selected", String(index === state.highlightedComparisonIndex));
    resultButton.addEventListener("click", () => {
      selectComparisonCountry(seriesId, country);
    });

    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = country.name;

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = formatCountryMetaText(country);

    resultButton.append(nameElement, metaElement);
    results.append(resultButton);
  });

  syncHighlightedCompareCountry(seriesId);
}

function handleCompareSearchKeydown(event, seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { results } = getCompareElements(seriesId);
  const hasOpenResults = state && results && !results.hidden && state.comparisonMatches.length > 0;

  if (event.key === "Escape") {
    hideCompareResults(seriesId);
    return;
  }

  if (!state || !hasOpenResults) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.highlightedComparisonIndex = Math.min(
      state.highlightedComparisonIndex + 1,
      state.comparisonMatches.length - 1,
    );
    syncHighlightedCompareCountry(seriesId);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.highlightedComparisonIndex = Math.max(state.highlightedComparisonIndex - 1, 0);
    syncHighlightedCompareCountry(seriesId);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const country = state.comparisonMatches[state.highlightedComparisonIndex] ?? state.comparisonMatches[0];

    if (country) {
      selectComparisonCountry(seriesId, country);
    }
  }
}

function syncHighlightedCompareCountry(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (!state || !results) {
    return;
  }

  const resultButtons = Array.from(results.querySelectorAll(".country-result"));

  resultButtons.forEach((button, index) => {
    const isHighlighted = index === state.highlightedComparisonIndex;
    button.classList.toggle("is-highlighted", isHighlighted);
    button.setAttribute("aria-selected", String(isHighlighted));

    if (isHighlighted) {
      button.scrollIntoView({ block: "nearest" });
    }
  });

  const highlightedButton = resultButtons[state.highlightedComparisonIndex];

  if (input && highlightedButton) {
    input.setAttribute("aria-activedescendant", highlightedButton.id);
  } else if (input) {
    input.removeAttribute("aria-activedescendant");
  }
}

function selectComparisonCountry(seriesId, country) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!state) {
    return;
  }

  state.comparisonCountry = country;
  state.comparisonRequestId += 1;
  state.comparisonPoints = [];

  if (input) {
    input.value = "";
  }

  hideCompareResults(seriesId);
  updateCompareSelectionUi(seriesId);
  loadComparisonSeries(seriesId, state.comparisonRequestId).catch((error) => {
    updateCompareSelectionUi(seriesId, `Failed to load ${country.name} comparison.`);
    renderMainSeriesOnly(seriesId);
    console.error(`[${pageDefinition.logPrefix}] Failed to load comparison series.`, {
      seriesId,
      country,
      error,
    });
  });
}

async function loadComparisonSeries(seriesId, requestId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.comparisonCountry || !state.baseConfig || !state.mainConfig) {
    return;
  }

  const comparisonConfig = buildCountrySeriesConfig(state.baseConfig, state.comparisonCountry);
  const { data } = await fetchStaticData(comparisonConfig);
  const comparisonPoints = transformSeriesData(data, comparisonConfig);

  if (requestId !== state.comparisonRequestId) {
    return;
  }

  state.comparisonPoints = comparisonPoints;

  if (comparisonPoints.length === 0) {
    updateCompareSelectionUi(seriesId, `No data available for ${state.comparisonCountry.name}.`);
    renderMainSeriesOnly(seriesId);
    return;
  }

  const canvas = document.querySelector(`#${state.mainConfig.canvasId}`);
  renderLineChart(canvas, {
    points: state.mainPoints,
    config: state.mainConfig,
    comparison: {
      countryName: state.comparisonCountry.name,
      points: comparisonPoints,
    },
  });
  updateCompareSelectionUi(seriesId);
}

function clearComparison(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!state) {
    return;
  }

  state.comparisonCountry = null;
  state.comparisonPoints = [];
  state.comparisonRequestId += 1;

  if (input) {
    input.value = "";
  }

  hideCompareResults(seriesId);
  updateCompareSelectionUi(seriesId);
  renderMainSeriesOnly(seriesId);
}

function renderMainSeriesOnly(seriesId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.mainConfig || !state.mainPoints.length) {
    return;
  }

  const canvas = document.querySelector(`#${state.mainConfig.canvasId}`);
  renderLineChart(canvas, {
    points: state.mainPoints,
    config: state.mainConfig,
  });
}

function updateGlobalRankLabel(seriesConfig, rankingPosition) {
  const rankElement = getOrCreateGlobalRankElement(seriesConfig);

  if (!rankElement) {
    return;
  }

  rankElement.innerHTML = "";

  if (rankingPosition) {
    const rankLink = document.createElement("a");
    rankLink.href = getRankingHref(seriesConfig);
    rankLink.textContent = `Global rank: ${formatRankPosition(rankingPosition.rank, rankingPosition.total)}`;
    rankElement.append(rankLink);
  }

  rankElement.hidden = !rankingPosition;
}

function getOrCreateGlobalRankElement(seriesConfig) {
  if (!rankedSeriesIds.has(seriesConfig.id)) {
    return null;
  }

  const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
  const titleGroup = titleElement?.closest(".indicator-title-group");

  if (!titleElement || !titleGroup) {
    return null;
  }

  const rankElementId = `${seriesConfig.id}GlobalRank`;
  let rankElement = document.querySelector(`#${rankElementId}`);

  if (!rankElement) {
    rankElement = document.createElement("p");
    rankElement.id = rankElementId;
    rankElement.className = "indicator-rank";
    rankElement.hidden = true;
    titleElement.after(rankElement);
  }

  return rankElement;
}

function getRankingHref(seriesConfig) {
  const rankingDirectory = rankingDirectoryBySeriesId[seriesConfig.id];
  return rankingDirectory ? `../../../rankings/${rankingDirectory}/world/` : "../../../";
}

function formatRankPosition(rank, total) {
  return `#${rank} / ${total}`;
}

function getGlobalRank(data, seriesConfig) {
  if (!rankedSeriesIds.has(seriesConfig.id) || selectedCountry.includeInRankings === false) {
    return null;
  }

  const rankingRows = countries
    .filter((country) => country.includeInRankings !== false)
    .map((country) => {
      const latestPoint = getLatestNumericPoint(
        data?.economies?.[country.code]?.series?.[seriesConfig.indicatorCode]?.values,
        seriesConfig,
      );

      return latestPoint ? { countryCode: country.code, value: latestPoint.value } : null;
    })
    .filter(Boolean)
    .sort((rowA, rowB) => rowB.value - rowA.value);

  const rowIndex = rankingRows.findIndex((row) => row.countryCode === selectedCountry.code);

  return rowIndex >= 0
    ? {
        rank: rowIndex + 1,
        total: rankingRows.length,
      }
    : null;
}

function getLatestNumericPoint(series, seriesConfig) {
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
        year >= seriesConfig.startYear &&
        year <= seriesConfig.endYear &&
        Number.isFinite(value)
      );
    })
    .sort((pointA, pointB) => pointB.year - pointA.year);

  return points[0] ?? null;
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

function updateCompareAvailability(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input } = getCompareElements(seriesId);

  if (!input || !state) {
    return;
  }

  input.disabled = !state.hasMainData;
  input.placeholder = state.hasMainData ? "Compare with..." : "No data to compare";
}

function updateCompareSelectionUi(seriesId, errorMessage = "") {
  const state = seriesRuntimeState.get(seriesId);
  const { selected } = getCompareElements(seriesId);

  if (!state || !selected) {
    return;
  }

  selected.classList.toggle("is-error", Boolean(errorMessage));
  selected.innerHTML = "";

  if (errorMessage) {
    selected.append(createCompareSelectionText(errorMessage));
  } else if (state.comparisonCountry) {
    selected.append(createCompareSelectionText(`Comparing with ${state.comparisonCountry.name}`));
  } else {
    return;
  }

  if (state.comparisonCountry) {
    selected.append(createCompareClearButton(seriesId, state.comparisonCountry.name));
  }
}

function createCompareSelectionText(text) {
  const textElement = document.createElement("span");
  textElement.className = "compare-selected-text";
  textElement.textContent = text;
  return textElement;
}

function createCompareClearButton(seriesId, countryName) {
  const button = document.createElement("button");
  button.className = "compare-clear-button";
  button.type = "button";
  button.textContent = "x";
  button.setAttribute("aria-label", `Remove ${countryName} comparison`);
  button.addEventListener("click", () => {
    clearComparison(seriesId);
  });
  return button;
}

function hideCompareResults(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (results) {
    results.hidden = true;
    results.innerHTML = "";
    placeCompareResultsElement(seriesId);
  }

  if (state) {
    state.comparisonMatches = [];
    state.highlightedComparisonIndex = -1;
  }

  if (input) {
    input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", "false");
  }
}

function getCompareElements(seriesId) {
  return {
    input: document.querySelector(`#${seriesId}CompareInput`),
    results: document.querySelector(`#${seriesId}CompareResults`),
    selected: document.querySelector(`#${seriesId}CompareSelected`),
  };
}

function placeCompareResultsElement(seriesId, mode) {
  const { input, results } = getCompareElements(seriesId);
  const inputWrap = input?.closest(".compare-input-wrap");
  const control = input?.closest(".compare-control");

  if (!results || !control) {
    return;
  }

  if (mode === "search" && inputWrap) {
    inputWrap.append(results);
    return;
  }

  const selected = control.querySelector(".compare-selected");
  if (selected) {
    selected.after(results);
    return;
  }

  control.append(results);
}

function clearDataTable(seriesConfig) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);
  const tableToggle = document.querySelector(`#${seriesConfig.id}TableToggle`);

  if (tableWrap) {
    tableWrap.innerHTML = "";
  }

  if (tableToggle) {
    tableToggle.open = false;
  }
}

function renderDataTable(points, seriesConfig) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);

  if (!tableWrap) {
    return;
  }

  const displayScale = getDisplayScale(points, seriesConfig);
  const sortedPoints = [...points].sort((pointA, pointB) => pointA.year - pointB.year);

  tableWrap.innerHTML = "";

  const table = document.createElement("table");
  table.className = "data-table";

  const tbody = document.createElement("tbody");
  const columnCount = 3;
  const rowCount = Math.ceil(sortedPoints.length / columnCount);

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = document.createElement("tr");

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      appendDataTablePointCells(row, sortedPoints[rowIndex + columnIndex * rowCount], displayScale);
    }

    tbody.append(row);
  }

  table.append(tbody);
  tableWrap.append(table);
}

function renderNoDataTable(seriesConfig) {
  const tableWrap = document.querySelector(`#${seriesConfig.id}TableWrap`);

  if (!tableWrap) {
    return;
  }

  tableWrap.innerHTML = "";

  const noDataElement = document.createElement("div");
  noDataElement.className = "data-table-empty";
  noDataElement.textContent = "No data available";
  tableWrap.append(noDataElement);
}

function appendDataTablePointCells(row, point, displayScale) {
  const yearCell = document.createElement("td");
  const valueCell = document.createElement("td");

  if (point) {
    yearCell.textContent = String(point.year);
    valueCell.textContent = formatDataTableValue(point.value, displayScale);
  }

  row.append(yearCell, valueCell);
}

function formatDataTableValue(value, displayScale) {
  return formatCompactDisplayValue(value, displayScale);
}

function updateSeriesSourceOverrideNotes(data, seriesConfig) {
  const notesContainer = document.querySelector(".indicators-card > .shared-notes");
  if (!notesContainer) {
    return;
  }

  const overrideNotes =
    data?.economies?.[seriesConfig.countryCode]?.series?.[seriesConfig.indicatorCode]?.sourceOverride?.notes ?? [];
  const primarySourceNote = notesContainer.querySelector("[data-primary-source-note]");

  primarySourceNote?.toggleAttribute("hidden", overrideNotes.length > 0);
  notesContainer
    .querySelectorAll(`[data-source-override-series="${seriesConfig.id}"]`)
    .forEach((element) => element.remove());

  overrideNotes.forEach((noteText) => {
    const noteElement = document.createElement("p");
    noteElement.dataset.sourceOverrideSeries = seriesConfig.id;
    noteElement.textContent = noteText;
    notesContainer.append(noteElement);
  });
}

function showChartOverlay({ chartCard, overlayElement, message, state }) {
  if (chartCard) {
    chartCard.classList.toggle("is-loading", state === "loading");
    chartCard.classList.toggle("is-error", state === "error");
    chartCard.classList.toggle("is-no-data", state === "no-data");
  }

  if (!overlayElement) {
    return;
  }

  overlayElement.hidden = false;
  overlayElement.setAttribute("aria-hidden", "false");
  overlayElement.innerHTML = "";

  if (state === "loading") {
    const spinner = document.createElement("span");
    spinner.className = "loading-spinner";
    spinner.setAttribute("aria-hidden", "true");
    overlayElement.append(spinner);
  }

  const messageElement = document.createElement("span");
  messageElement.className = "overlay-message";
  messageElement.textContent = message;
  overlayElement.append(messageElement);
}

function hideChartOverlay(chartCard, overlayElement) {
  if (chartCard) {
    chartCard.classList.remove("is-loading", "is-error", "is-no-data");
  }

  if (!overlayElement) {
    return;
  }

  overlayElement.hidden = true;
  overlayElement.setAttribute("aria-hidden", "true");
  overlayElement.innerHTML = "";
}

function showPageError() {
  document.querySelectorAll(".chart-card").forEach((chartCard) => {
    chartCard.classList.add("is-error");
  });
}
