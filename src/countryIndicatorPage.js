import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { filterCountries, formatCountryMetaText, initializeCountrySelector } from "./countrySelector.js";
import { getCurrencyCode } from "./currencyCodes.js";
import { getCurrencyDisplay } from "./currencyDisplay.js";
import { renderEconomicRankingLinks } from "./economicRankings.js";
import { environmentalIndicatorLinks, renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { getFlagEmoji } from "./flags.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";
import { buildStaticDataRequestUrls, fetchStaticData } from "./staticData.js";
import { transformSeriesData } from "./transform.js";
import { clearLineChart, formatCompactDisplayValue, getDisplayScale, renderLineChart } from "./chart.js";

const pageDefinitions = {
  gdp: {
    logPrefix: "GDP page",
    group: "economic",
    documentTitleMetric: "GDP",
    pathSegment: "gdp",
    seriesIds: ["gdp", "gdpNational", "realGdp"],
  },
  "gdp-per-capita": {
    logPrefix: "GDP per capita page",
    group: "economic",
    documentTitleMetric: "GDP per capita",
    pathSegment: "gdp-per-capita",
    seriesIds: ["gdpPerCapita", "gdpNationalPerCapita", "realGdpPerCapita"],
  },
  "gdp-growth": {
    logPrefix: "GDP growth page",
    group: "economic",
    documentTitleMetric: "GDP Growth Rate",
    pathSegment: "gdp-growth",
    seriesIds: ["gdpGrowth"],
  },
  "inflation-rate": {
    logPrefix: "Inflation rate page",
    group: "economic",
    documentTitleMetric: "Inflation Rate",
    pathSegment: "inflation-rate",
    seriesIds: ["inflationRate"],
  },
  population: {
    logPrefix: "Population page",
    group: "population",
    documentTitleMetric: "Population",
    pathSegment: "population",
    seriesIds: ["population"],
  },
  "population-density": {
    logPrefix: "Population density page",
    group: "population",
    documentTitleMetric: "Population Density",
    pathSegment: "population-density",
    seriesIds: ["populationDensity"],
  },
  employment: {
    logPrefix: "Employment page",
    group: "population",
    documentTitleMetric: "Employment",
    pathSegment: "employment",
    seriesIds: ["employment"],
  },
  "unemployment-rate": {
    logPrefix: "Unemployment rate page",
    group: "population",
    documentTitleMetric: "Unemployment Rate",
    pathSegment: "unemployment-rate",
    seriesIds: ["unemploymentRate"],
  },
  "life-expectancy": {
    logPrefix: "Life expectancy page",
    group: "population",
    documentTitleMetric: "Life Expectancy",
    pathSegment: "life-expectancy",
    seriesIds: ["lifeExpectancy"],
  },
  "fertility-rate": {
    logPrefix: "Fertility rate page",
    group: "population",
    documentTitleMetric: "Fertility Rate",
    pathSegment: "fertility-rate",
    seriesIds: ["fertilityRate"],
  },
  ppp: {
    logPrefix: "PPP page",
    group: "economic",
    documentTitleMetric: "PPP",
    pathSegment: "ppp",
    seriesIds: ["ppp"],
  },
  "ppp-per-capita": {
    logPrefix: "PPP per capita page",
    group: "economic",
    documentTitleMetric: "PPP per capita",
    pathSegment: "ppp-per-capita",
    seriesIds: ["pppPerCapita"],
  },
  "current-account-balance": {
    logPrefix: "Current account balance page",
    group: "trade",
    documentTitleMetric: "Current Account Balance",
    pathSegment: "current-account-balance",
    seriesIds: ["currentAccountBalance"],
  },
  "current-account-balance-percent-gdp": {
    logPrefix: "Current account balance percent of GDP page",
    group: "trade",
    documentTitleMetric: "Current Account Balance (% of GDP)",
    pathSegment: "current-account-balance-percent-gdp",
    seriesIds: ["currentAccountBalancePercentGdp"],
  },
  "goods-exports": {
    logPrefix: "Goods exports page",
    group: "trade",
    documentTitleMetric: "Goods Exports",
    pathSegment: "goods-exports",
    seriesIds: ["goodsExports"],
  },
  "goods-imports": {
    logPrefix: "Goods imports page",
    group: "trade",
    documentTitleMetric: "Goods Imports",
    pathSegment: "goods-imports",
    seriesIds: ["goodsImports"],
  },
  "goods-trade-balance": {
    logPrefix: "Goods trade balance page",
    group: "trade",
    documentTitleMetric: "Goods Trade Balance",
    pathSegment: "goods-trade-balance",
    seriesIds: ["goodsTradeBalance"],
  },
  "government-gross-debt": {
    logPrefix: "Government gross debt page",
    group: "fiscal",
    documentTitleMetric: "Government Gross Debt",
    pathSegment: "government-gross-debt",
    seriesIds: ["governmentGrossDebt"],
  },
  "government-net-debt": {
    logPrefix: "Government net debt page",
    group: "fiscal",
    documentTitleMetric: "Government Net Debt",
    pathSegment: "government-net-debt",
    seriesIds: ["governmentNetDebt"],
  },
  "fiscal-balance": {
    logPrefix: "Fiscal balance page",
    group: "fiscal",
    documentTitleMetric: "Fiscal Balance",
    pathSegment: "fiscal-balance",
    seriesIds: ["fiscalBalance"],
  },
  "primary-fiscal-balance": {
    logPrefix: "Primary fiscal balance page",
    group: "fiscal",
    documentTitleMetric: "Primary Fiscal Balance",
    pathSegment: "primary-fiscal-balance",
    seriesIds: ["primaryFiscalBalance"],
  },
  "government-revenue": {
    logPrefix: "Government revenue page",
    group: "fiscal",
    documentTitleMetric: "Government Revenue",
    pathSegment: "government-revenue",
    seriesIds: ["governmentRevenue"],
  },
  "government-expenditure": {
    logPrefix: "Government expenditure page",
    group: "fiscal",
    documentTitleMetric: "Government Expenditure",
    pathSegment: "government-expenditure",
    seriesIds: ["governmentExpenditure"],
  },
  "total-reserves-including-gold": {
    logPrefix: "Total reserves including gold page",
    group: "fiscal",
    documentTitleMetric: "Total Reserves Including Gold",
    pathSegment: "total-reserves-including-gold",
    seriesIds: ["totalReservesIncludingGold"],
  },
  "agricultural-land-percent-of-land-area": {
    logPrefix: "Agricultural land percent of land area page",
    group: "environmental",
    documentTitleMetric: "Agricultural Land (% of Land Area)",
    pathSegment: "agricultural-land-percent-of-land-area",
    seriesIds: ["agriculturalLandPercentOfLandArea"],
  },
  "forest-area-percent-of-land-area": {
    logPrefix: "Forest area percent of land area page",
    group: "environmental",
    documentTitleMetric: "Forest Area (% of Land Area)",
    pathSegment: "forest-area-percent-of-land-area",
    seriesIds: ["forestAreaPercentOfLandArea"],
  },
};
const countryIndicatorLinks = [
  { pageKind: "gdp", href: "../gdp/", label: "GDP" },
  { pageKind: "gdp-per-capita", href: "../gdp-per-capita/", label: "GDP per capita" },
  { pageKind: "gdp-growth", href: "../gdp-growth/", label: "GDP Growth Rate" },
  { pageKind: "inflation-rate", href: "../inflation-rate/", label: "Inflation Rate" },
  { pageKind: "ppp", href: "../ppp/", label: "PPP" },
  { pageKind: "ppp-per-capita", href: "../ppp-per-capita/", label: "PPP per capita" },
];
const populationIndicatorLinks = [
  { pageKind: "population", href: "../population/", label: "Population" },
  { pageKind: "population-density", href: "../population-density/", label: "Population Density" },
  { pageKind: "life-expectancy", href: "../life-expectancy/", label: "Life Expectancy" },
  { pageKind: "fertility-rate", href: "../fertility-rate/", label: "Fertility Rate" },
  { pageKind: "employment", href: "../employment/", label: "Employment" },
  { pageKind: "unemployment-rate", href: "../unemployment-rate/", label: "Unemployment Rate" },
];
const tradeIndicatorLinks = [
  { pageKind: "current-account-balance", href: "../current-account-balance/", label: "Current Account Balance" },
  {
    pageKind: "current-account-balance-percent-gdp",
    href: "../current-account-balance-percent-gdp/",
    label: "Current Account Balance (% of GDP)",
  },
  { pageKind: "goods-exports", href: "../goods-exports/", label: "Goods Exports" },
  { pageKind: "goods-imports", href: "../goods-imports/", label: "Goods Imports" },
  { pageKind: "goods-trade-balance", href: "../goods-trade-balance/", label: "Goods Trade Balance" },
];
const fiscalIndicatorLinks = [
  { pageKind: "government-gross-debt", href: "../government-gross-debt/", label: "Government Gross Debt" },
  { pageKind: "government-net-debt", href: "../government-net-debt/", label: "Government Net Debt" },
  { pageKind: "fiscal-balance", href: "../fiscal-balance/", label: "Fiscal Balance" },
  { pageKind: "primary-fiscal-balance", href: "../primary-fiscal-balance/", label: "Primary Fiscal Balance" },
  { pageKind: "government-revenue", href: "../government-revenue/", label: "Government Revenue" },
  { pageKind: "government-expenditure", href: "../government-expenditure/", label: "Government Expenditure" },
  {
    pageKind: "total-reserves-including-gold",
    href: "../total-reserves-including-gold/",
    label: "Total Reserves Including Gold",
  },
];
const countryIndicatorLinksByGroup = {
  economic: countryIndicatorLinks,
  population: populationIndicatorLinks,
  trade: tradeIndicatorLinks,
  fiscal: fiscalIndicatorLinks,
  environmental: environmentalIndicatorLinks,
};
const pageKind = pageDefinitions[document.body.dataset.pageKind] ? document.body.dataset.pageKind : "gdp";
const pageDefinition = pageDefinitions[pageKind];
const pageSeriesIds = new Set(pageDefinition.seriesIds);
const pageSeriesConfigs = seriesConfigs.filter((seriesConfig) => pageSeriesIds.has(seriesConfig.id));
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const comparableSeriesIds = new Set([
  "gdp",
  "gdpPerCapita",
  "gdpGrowth",
  "inflationRate",
  "population",
  "populationDensity",
  "employment",
  "unemploymentRate",
  "lifeExpectancy",
  "fertilityRate",
  "ppp",
  "pppPerCapita",
  "currentAccountBalance",
  "currentAccountBalancePercentGdp",
  "goodsExports",
  "goodsImports",
  "goodsTradeBalance",
  "governmentGrossDebt",
  "governmentNetDebt",
  "fiscalBalance",
  "primaryFiscalBalance",
  "governmentRevenue",
  "governmentExpenditure",
  "totalReservesIncludingGold",
  "agriculturalLandPercentOfLandArea",
  "forestAreaPercentOfLandArea",
]);
const rankedSeriesIds = new Set(comparableSeriesIds);
const rankingDirectoryBySeriesId = {
  gdp: "nominal-gdp",
  gdpPerCapita: "nominal-gdp-per-capita",
  gdpGrowth: "real-gdp-growth",
  inflationRate: "inflation-rate",
  population: "population",
  populationDensity: "population-density",
  employment: "employment",
  unemploymentRate: "unemployment-rate",
  lifeExpectancy: "life-expectancy",
  fertilityRate: "fertility-rate",
  ppp: "ppp",
  pppPerCapita: "ppp-per-capita",
  currentAccountBalance: "current-account-balance",
  currentAccountBalancePercentGdp: "current-account-balance-percent-gdp",
  goodsExports: "goods-exports",
  goodsImports: "goods-imports",
  goodsTradeBalance: "goods-trade-balance",
  governmentGrossDebt: "government-gross-debt",
  governmentNetDebt: "government-net-debt",
  fiscalBalance: "fiscal-balance",
  primaryFiscalBalance: "primary-fiscal-balance",
  governmentRevenue: "government-revenue",
  governmentExpenditure: "government-expenditure",
  totalReservesIncludingGold: "total-reserves-including-gold",
  agriculturalLandPercentOfLandArea: "agricultural-land-percent-of-land-area",
  forestAreaPercentOfLandArea: "forest-area-percent-of-land-area",
};
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
  updateTopRankingLinks();
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

function updateTopRankingLinks() {
  renderEconomicRankingLinks(document.querySelector("#economicTopNav"), {
    rootHref: "../../../",
    currentPageKind: pageKind,
    highlightCurrent: false,
  });

  renderPopulationRankingLinks(document.querySelector("#populationTopNav"), {
    rootHref: "../../../",
    highlightCurrent: false,
  });

  renderTradeRankingLinks(document.querySelector("#tradeTopNav"), {
    rootHref: "../../../",
    highlightCurrent: false,
  });

  renderFiscalRankingLinks(document.querySelector("#fiscalTopNav"), {
    rootHref: "../../../",
    highlightCurrent: false,
  });

  renderEnvironmentalRankingLinks(document.querySelector("#environmentalTopNav"), {
    rootHref: "../../../",
    highlightCurrent: false,
  });
}

function buildCountrySeriesConfig(seriesConfig, country) {
  const currencyCode = seriesConfig.usesCountryCurrency
    ? getCurrencyCode(country.code)
    : seriesConfig.currencyCode;
  const currencyDisplay = getCurrencyDisplay({
    ...seriesConfig,
    currencyCode,
  });

  return {
    ...seriesConfig,
    staticDataPath: getCountryPageStaticDataPath(seriesConfig),
    countryCode: country.code,
    countryName: country.name,
    chartTitle: getSeriesChartTitle(seriesConfig, currencyCode),
    currencyCode,
    currencyDisplay,
    tooltipPrefix: currencyDisplay.prefix || seriesConfig.tooltipPrefix,
    tickPrefix: currencyDisplay.prefix || seriesConfig.tickPrefix,
    suffix: seriesConfig.usesCountryCurrency ? currencyDisplay.suffix : seriesConfig.suffix,
  };
}

function getCountryPageStaticDataPath(seriesConfig) {
  if (!seriesConfig.staticDataPath) {
    throw new Error(`staticDataPath is required for ${seriesConfig.id}.`);
  }

  return seriesConfig.staticDataPath.replace(/^\.\//, "../../../");
}

function getSeriesChartTitle(seriesConfig, currencyCode) {
  const title = seriesConfig.titleTemplate;
  const isGdpCurrencySeries =
    title.includes("GDP") &&
    (seriesConfig.usesCountryCurrency || seriesConfig.currencyCode);

  if (!isGdpCurrencySeries || !currencyCode) {
    return title;
  }

  return `${title} - ${formatTitleCurrencyCode(currencyCode)}`;
}

function formatTitleCurrencyCode(currencyCode) {
  return currencyCode;
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
  const relatedLinks = countryIndicatorLinksByGroup[pageDefinition.group] ?? [];

  relatedLinks.forEach((linkConfig) => {
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
    const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

    if (titleElement) {
      titleElement.textContent = seriesConfig.chartTitle;
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

function updateGlobalRankLabel(seriesConfig, rank) {
  const rankElement = getOrCreateGlobalRankElement(seriesConfig);

  if (!rankElement) {
    return;
  }

  rankElement.innerHTML = "";

  if (rank) {
    const rankLink = document.createElement("a");
    rankLink.href = getRankingHref(seriesConfig);
    rankLink.textContent = `Global rank: #${rank} ↗`;
    rankElement.append(rankLink);
  }

  rankElement.hidden = !rank;
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

  return rowIndex >= 0 ? rowIndex + 1 : null;
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
  const splitIndex = Math.ceil(sortedPoints.length / 2);
  const leftPoints = sortedPoints.slice(0, splitIndex);
  const rightPoints = sortedPoints.slice(splitIndex);

  for (let index = 0; index < leftPoints.length; index += 1) {
    const row = document.createElement("tr");
    appendDataTablePointCells(row, leftPoints[index], displayScale);
    appendDataTablePointCells(row, rightPoints[index], displayScale);
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
