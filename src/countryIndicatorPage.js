import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { filterCountries, formatCountryMetaText, initializeCountrySelector } from "./countrySelector.js";
import { getCurrencyCode } from "./currencyCodes.js";
import { getCurrencyDisplay } from "./currencyDisplay.js";
import { getFlagEmoji } from "./flags.js";
import { buildStaticDataRequestUrls, fetchStaticData } from "./staticData.js";
import { transformSeriesData } from "./transform.js";
import { clearLineChart, formatDisplayValue, getDisplayScale, renderLineChart } from "./chart.js";

const pageDefinitions = {
  gdp: {
    logPrefix: "GDP page",
    documentTitleMetric: "GDP",
    pathSegment: "gdp",
    seriesIds: ["gdp", "gdpNational", "realGdp"],
    tableValueHeader: "GDP",
  },
  "gdp-per-capita": {
    logPrefix: "GDP per capita page",
    documentTitleMetric: "GDP per capita",
    pathSegment: "gdp-per-capita",
    seriesIds: ["gdpPerCapita", "gdpNationalPerCapita", "realGdpPerCapita"],
    tableValueHeader: "GDP per capita",
  },
  ppp: {
    logPrefix: "PPP page",
    documentTitleMetric: "PPP",
    pathSegment: "ppp",
    seriesIds: ["ppp"],
    tableValueHeader: "PPP",
  },
  "ppp-per-capita": {
    logPrefix: "PPP per capita page",
    documentTitleMetric: "PPP per capita",
    pathSegment: "ppp-per-capita",
    seriesIds: ["pppPerCapita"],
    tableValueHeader: "PPP per capita",
  },
};
const countryIndicatorLinks = [
  { pageKind: "gdp", href: "../gdp/", label: "View GDP" },
  { pageKind: "gdp-per-capita", href: "../gdp-per-capita/", label: "View GDP per capita" },
  { pageKind: "ppp", href: "../ppp/", label: "View PPP" },
  { pageKind: "ppp-per-capita", href: "../ppp-per-capita/", label: "View PPP per capita" },
];
const pageKind = pageDefinitions[document.body.dataset.pageKind] ? document.body.dataset.pageKind : "gdp";
const pageDefinition = pageDefinitions[pageKind];
const pageSeriesIds = new Set(pageDefinition.seriesIds);
const pageSeriesConfigs = seriesConfigs.filter((seriesConfig) => pageSeriesIds.has(seriesConfig.id));
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const comparableSeriesIds = new Set(["gdp", "gdpPerCapita", "ppp", "pppPerCapita"]);
const seriesRuntimeState = new Map();

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
  updateCountryHeading(selectedCountry);
  updateRelatedPageLinks();

  const countrySeriesConfigs = pageSeriesConfigs.map((seriesConfig) =>
    buildCountrySeriesConfig(seriesConfig, selectedCountry),
  );
  const visibleSeriesConfigs = countrySeriesConfigs.filter(shouldShowSeriesConfig);

  updateSeriesVisibility(countrySeriesConfigs);
  updateSeriesHeadings(visibleSeriesConfigs);
  initializeCompareSearches(visibleSeriesConfigs);

  await Promise.all(visibleSeriesConfigs.map((seriesConfig) => loadAndRenderSeries(seriesConfig)));
}

function navigateToCountry(country) {
  window.location.href = `../../../countries/${country.slug}/${pageDefinition.pathSegment}/`;
}

function buildCountrySeriesConfig(seriesConfig, country) {
  const currencyCode = seriesConfig.usesCountryCurrency
    ? getCurrencyCode(country.code)
    : seriesConfig.currencyCode;
  const currencyLabel = seriesConfig.usesCountryCurrency
    ? formatCountryCurrencyLabel(currencyCode, seriesConfig)
    : seriesConfig.currencyLabel;
  const currencyDisplay = getCurrencyDisplay({
    ...seriesConfig,
    currencyCode,
  });

  return {
    ...seriesConfig,
    staticDataPath: "../../../data/weo/current-prices.json",
    countryCode: country.code,
    countryName: country.name,
    chartTitle: seriesConfig.titleTemplate,
    currencyCode,
    currencyDisplay,
    currencyLabel,
    unitLabel: getSeriesUnitLabel(seriesConfig, currencyCode),
    tooltipPrefix: currencyDisplay.prefix || seriesConfig.tooltipPrefix,
    tickPrefix: currencyDisplay.prefix || seriesConfig.tickPrefix,
    suffix: seriesConfig.usesCountryCurrency ? currencyDisplay.suffix : seriesConfig.suffix,
  };
}

function formatCountryCurrencyLabel(currencyCode, seriesConfig) {
  const baseCurrency = currencyCode || "N/A";

  if (seriesConfig.currencyBasisLabel) {
    return `Currency: ${baseCurrency}, ${seriesConfig.currencyBasisLabel}`;
  }

  return `Currency: ${baseCurrency}`;
}

function getSeriesUnitLabel(seriesConfig, currencyCode) {
  if (!seriesConfig.usesCountryCurrency || !currencyCode) {
    return seriesConfig.unitLabel;
  }

  if (seriesConfig.id === "gdpNationalPerCapita" || seriesConfig.id === "realGdpPerCapita") {
    return `${currencyCode} per person`;
  }

  return seriesConfig.unitLabel;
}

function updateCountryHeading(country) {
  const title = document.querySelector("#country-data-title");

  if (!title) {
    return;
  }

  title.innerHTML = "";
  const flagEmoji = getFlagEmoji(country.code);

  if (flagEmoji) {
    const flagElement = document.createElement("span");
    flagElement.className = "country-flag";
    flagElement.setAttribute("aria-hidden", "true");
    flagElement.textContent = flagEmoji;
    title.append(flagElement);
  }

  const nameElement = document.createElement("span");
  nameElement.className = "country-name";
  nameElement.textContent = country.name;
  title.append(nameElement);
}

function updateRelatedPageLinks() {
  const nav = document.querySelector("#countryRelatedPageNav");

  if (!nav) {
    return;
  }

  nav.innerHTML = "";
  countryIndicatorLinks.forEach((linkConfig) => {
    const link = document.createElement("a");
    link.href = linkConfig.href;
    link.textContent = linkConfig.label;
    if (linkConfig.pageKind === pageKind) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }
    nav.append(link);
  });
}

function updateSeriesHeadings(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const currencyElement = document.querySelector(`#${seriesConfig.id}Currency`);
    const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

    if (titleElement) {
      titleElement.textContent = seriesConfig.chartTitle;
    }

    if (currencyElement) {
      currencyElement.textContent = seriesConfig.currencyLabel ?? "";
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

      const { input, removeButton } = getCompareElements(seriesConfig.id);

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

      removeButton?.addEventListener("click", () => {
        clearComparison(seriesConfig.id);
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
    const points = transformSeriesData(data, seriesConfig);
    const state = seriesRuntimeState.get(seriesConfig.id);

    if (points.length === 0) {
      clearLineChart(canvas);
      renderNoDataTable(seriesConfig);
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
    emptyElement.textContent = "No matching countries.";
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
  const { selected, removeButton } = getCompareElements(seriesId);

  if (!state || !selected) {
    return;
  }

  selected.classList.toggle("is-error", Boolean(errorMessage));

  if (errorMessage) {
    selected.textContent = errorMessage;
  } else if (state.comparisonCountry) {
    selected.textContent = `Comparing with ${state.comparisonCountry.name}`;
  } else {
    selected.textContent = "";
  }

  if (removeButton) {
    removeButton.hidden = !state.comparisonCountry;
  }
}

function hideCompareResults(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (results) {
    results.hidden = true;
    results.innerHTML = "";
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
    removeButton: document.querySelector(`#${seriesId}CompareRemove`),
  };
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

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  appendDataTableHeaders(headerRow);
  appendDataTableHeaders(headerRow);
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  const splitIndex = Math.ceil(sortedPoints.length / 2);
  const leftPoints = sortedPoints.slice(0, splitIndex);
  const rightPoints = sortedPoints.slice(splitIndex);

  for (let index = 0; index < leftPoints.length; index += 1) {
    const row = document.createElement("tr");
    appendDataTablePointCells(row, leftPoints[index], displayScale);
    appendDataTablePointCells(row, rightPoints[index], displayScale);
    tbody.append(row);
  }

  table.append(thead, tbody);
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

function appendDataTableHeaders(row) {
  const yearHeader = document.createElement("th");
  yearHeader.scope = "col";
  yearHeader.textContent = "Year";

  const valueHeader = document.createElement("th");
  valueHeader.scope = "col";
  valueHeader.textContent = pageDefinition.tableValueHeader;
  row.append(yearHeader, valueHeader);
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
  if (displayScale.compactUnit) {
    const formattedValue = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: displayScale.maximumFractionDigits,
    }).format(value * displayScale.valueScale);

    return `${displayScale.tooltipPrefix}${formattedValue}${displayScale.compactUnit}`;
  }

  return formatDisplayValue(value, displayScale);
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
