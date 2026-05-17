import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { getCurrencyCode } from "./currencyCodes.js";
import { getFlagEmoji } from "./flags.js";
import { buildStaticDataRequestUrls, fetchStaticData } from "./staticData.js";
import { transformSeriesData } from "./transform.js";
import { clearLineChart, formatDisplayValue, getDisplayScale, renderLineChart } from "./chart.js";

const pageKind = document.body.dataset.pageKind === "gdp" ? "gdp" : "gdp-per-capita";
const pageDefinitions = {
  gdp: {
    logPrefix: "GDP page",
    documentTitleMetric: "GDP",
    pathSegment: "gdp",
    relatedPathSegment: "gdp-per-capita",
    seriesIds: ["gdp", "gdpNational"],
    tableValueHeader: "GDP",
  },
  "gdp-per-capita": {
    logPrefix: "GDP per capita page",
    documentTitleMetric: "GDP per capita",
    pathSegment: "gdp-per-capita",
    relatedPathSegment: "gdp",
    seriesIds: ["gdpPerCapita", "gdpNationalPerCapita"],
    tableValueHeader: "GDP per capita",
  },
};
const pageDefinition = pageDefinitions[pageKind];
const pageSeriesIds = new Set(pageDefinition.seriesIds);
const pageSeriesConfigs = seriesConfigs.filter((seriesConfig) => pageSeriesIds.has(seriesConfig.id));
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);

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
  updateRelatedPageLink(selectedCountry);

  const countrySeriesConfigs = pageSeriesConfigs.map((seriesConfig) =>
    buildCountrySeriesConfig(seriesConfig, selectedCountry),
  );

  updateSeriesHeadings(countrySeriesConfigs);

  await Promise.all(countrySeriesConfigs.map((seriesConfig) => loadAndRenderSeries(seriesConfig)));
}

function navigateToCountry(country) {
  window.location.href = `../../../countries/${country.slug}/${pageDefinition.pathSegment}/`;
}

function buildCountrySeriesConfig(seriesConfig, country) {
  const currencyCode = seriesConfig.usesCountryCurrency
    ? getCurrencyCode(country.code)
    : seriesConfig.currencyCode;
  const currencyLabel = seriesConfig.usesCountryCurrency
    ? `Currency: ${currencyCode || "N/A"}`
    : seriesConfig.currencyLabel;

  return {
    ...seriesConfig,
    staticDataPath: "../../../data/weo/current-prices.json",
    countryCode: country.code,
    countryName: country.name,
    chartTitle: seriesConfig.titleTemplate,
    currencyCode,
    currencyLabel,
    unitLabel: getSeriesUnitLabel(seriesConfig, currencyCode),
    suffix: seriesConfig.usesCountryCurrency && currencyCode ? currencyCode : seriesConfig.suffix,
  };
}

function getSeriesUnitLabel(seriesConfig, currencyCode) {
  if (!seriesConfig.usesCountryCurrency || !currencyCode) {
    return seriesConfig.unitLabel;
  }

  if (seriesConfig.id === "gdpNationalPerCapita") {
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

function updateRelatedPageLink(country) {
  const backLink = document.querySelector("#countryRelatedPageLink") ?? document.querySelector("#countryGdpPageLink");

  if (backLink) {
    backLink.href = `../../../countries/${country.slug}/${pageDefinition.relatedPathSegment}/`;
  }
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

    if (points.length === 0) {
      clearLineChart(canvas);
      renderNoDataTable(seriesConfig);
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
    renderDataTable(points, seriesConfig);
    hideChartOverlay(chartCard, overlayElement);
  } catch (error) {
    clearLineChart(canvas);
    renderNoDataTable(seriesConfig);
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
