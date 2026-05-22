import { formatCompactDisplayValue, getDisplayScale } from "./chart.js";
import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { renderEconomicRankingLinks } from "./economicRankings.js";
import { renderEnvironmentalRankingLinks } from "./environmentalRankings.js";
import { renderFiscalRankingLinks } from "./fiscalRankings.js";
import { getFlagEmoji } from "./flags.js";
import { renderPopulationRankingLinks } from "./populationRankings.js";
import { getIndicatorSeriesMap } from "./seriesData.js";
import { renderTradeRankingLinks } from "./tradeRankings.js";

const overviewGroups = [
  {
    id: "economy",
    title: "Economy",
    indicators: [
      { seriesId: "gdp", rankingDirectory: "nominal-gdp", pagePathSegment: "gdp" },
      { seriesId: "gdpPerCapita", rankingDirectory: "nominal-gdp-per-capita", pagePathSegment: "gdp-per-capita" },
      { seriesId: "gdpGrowth", rankingDirectory: "real-gdp-growth", pagePathSegment: "gdp-growth" },
      { seriesId: "inflationRate", rankingDirectory: "inflation-rate", pagePathSegment: "inflation-rate" },
      { seriesId: "ppp", rankingDirectory: "ppp", pagePathSegment: "ppp" },
      { seriesId: "pppPerCapita", rankingDirectory: "ppp-per-capita", pagePathSegment: "ppp-per-capita" },
    ],
  },
  {
    id: "population",
    title: "Population",
    indicators: [
      { seriesId: "population", rankingDirectory: "population", pagePathSegment: "population" },
      { seriesId: "populationDensity", rankingDirectory: "population-density", pagePathSegment: "population-density" },
      { seriesId: "lifeExpectancy", rankingDirectory: "life-expectancy", pagePathSegment: "life-expectancy" },
      { seriesId: "fertilityRate", rankingDirectory: "fertility-rate", pagePathSegment: "fertility-rate" },
      { seriesId: "employment", rankingDirectory: "employment", pagePathSegment: "employment" },
      { seriesId: "unemploymentRate", rankingDirectory: "unemployment-rate", pagePathSegment: "unemployment-rate" },
    ],
  },
  {
    id: "environment",
    title: "Environment",
    indicators: [
      { seriesId: "area", rankingDirectory: "area" },
      {
        seriesId: "forestAreaPercentOfLandArea",
        rankingDirectory: "forest-area-percent-of-land-area",
        pagePathSegment: "forest-area-percent-of-land-area",
      },
      {
        seriesId: "agriculturalLandPercentOfLandArea",
        rankingDirectory: "agricultural-land-percent-of-land-area",
        pagePathSegment: "agricultural-land-percent-of-land-area",
      },
    ],
  },
  {
    id: "trade",
    title: "Trade",
    indicators: [
      {
        seriesId: "currentAccountBalance",
        rankingDirectory: "current-account-balance",
        pagePathSegment: "current-account-balance",
      },
      {
        seriesId: "currentAccountBalancePercentGdp",
        rankingDirectory: "current-account-balance-percent-gdp",
        pagePathSegment: "current-account-balance-percent-gdp",
      },
      { seriesId: "goodsExports", rankingDirectory: "goods-exports", pagePathSegment: "goods-exports" },
      { seriesId: "goodsImports", rankingDirectory: "goods-imports", pagePathSegment: "goods-imports" },
      {
        seriesId: "goodsTradeBalance",
        rankingDirectory: "goods-trade-balance",
        pagePathSegment: "goods-trade-balance",
      },
    ],
  },
  {
    id: "finance",
    title: "Finance",
    indicators: [
      {
        seriesId: "governmentGrossDebt",
        rankingDirectory: "government-gross-debt",
        pagePathSegment: "government-gross-debt",
      },
      {
        seriesId: "governmentNetDebt",
        rankingDirectory: "government-net-debt",
        pagePathSegment: "government-net-debt",
      },
      { seriesId: "fiscalBalance", rankingDirectory: "fiscal-balance", pagePathSegment: "fiscal-balance" },
      {
        seriesId: "primaryFiscalBalance",
        rankingDirectory: "primary-fiscal-balance",
        pagePathSegment: "primary-fiscal-balance",
      },
      { seriesId: "governmentRevenue", rankingDirectory: "government-revenue", pagePathSegment: "government-revenue" },
      {
        seriesId: "governmentExpenditure",
        rankingDirectory: "government-expenditure",
        pagePathSegment: "government-expenditure",
      },
      {
        seriesId: "totalReservesIncludingGold",
        rankingDirectory: "total-reserves-including-gold",
        pagePathSegment: "total-reserves-including-gold",
      },
    ],
  },
];

const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));
const rankingCountries = countries.filter((country) => country.includeInRankings !== false);
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);

initializeCountryOverview().catch((error) => {
  console.error("[Country overview] Failed to initialize page.", error);
  showOverviewError();
});

async function initializeCountryOverview() {
  if (!selectedCountry) {
    throw new Error(`Country ${countryCode} was not found.`);
  }

  updateTopRankingLinks();
  updateCountryHeading();

  const dataByPath = await loadDataByPath(getRequiredStaticDataPaths());
  renderOverview(dataByPath);
}

function updateTopRankingLinks() {
  renderEconomicRankingLinks(document.querySelector("#economicTopNav"), {
    rootHref: "../../",
    highlightCurrent: false,
  });

  renderPopulationRankingLinks(document.querySelector("#populationTopNav"), {
    rootHref: "../../",
    highlightCurrent: false,
  });

  renderEnvironmentalRankingLinks(document.querySelector("#environmentalTopNav"), {
    rootHref: "../../",
    highlightCurrent: false,
  });

  renderTradeRankingLinks(document.querySelector("#tradeTopNav"), {
    rootHref: "../../",
    highlightCurrent: false,
  });

  renderFiscalRankingLinks(document.querySelector("#fiscalTopNav"), {
    rootHref: "../../",
    highlightCurrent: false,
  });
}

function updateCountryHeading() {
  document.title = selectedCountry.name;

  const heading = document.querySelector("#country-overview-title");
  if (!heading) {
    return;
  }

  heading.innerHTML = "";

  const flag = document.createElement("span");
  flag.className = "country-flag";
  flag.textContent = getFlagEmoji(selectedCountry.code);

  const name = document.createElement("span");
  name.className = "country-name";
  name.textContent = selectedCountry.name;

  heading.append(flag, name);
}

function getRequiredStaticDataPaths() {
  const paths = new Set();

  for (const group of overviewGroups) {
    for (const indicator of group.indicators) {
      const config = getSeriesConfig(indicator);
      paths.add(config.staticDataPath);
    }
  }

  return [...paths];
}

async function loadDataByPath(staticDataPaths) {
  const entries = await Promise.all(
    staticDataPaths.map(async (staticDataPath) => {
      const dataUrl = new URL(staticDataPath.replace(/^\.\//, "../../"), window.location.href);
      const response = await fetch(dataUrl, { headers: { Accept: "application/json" } });

      if (!response.ok) {
        throw new Error(`Static data file request failed: ${response.status} ${response.statusText}`);
      }

      return [staticDataPath, await response.json()];
    }),
  );

  return new Map(entries);
}

function renderOverview(dataByPath) {
  const container = document.querySelector("#countryOverviewGroups");
  if (!container) {
    return;
  }

  container.innerHTML = "";

  for (const group of overviewGroups) {
    container.append(renderGroup(group, dataByPath));
  }
}

function renderGroup(group, dataByPath) {
  const section = document.createElement("section");
  section.className = "country-overview-section";
  section.setAttribute("aria-labelledby", `${group.id}-overview-title`);

  const heading = document.createElement("h2");
  heading.id = `${group.id}-overview-title`;
  heading.textContent = group.title;

  const tableWrap = document.createElement("div");
  tableWrap.className = "country-overview-table-wrap";

  const table = document.createElement("table");
  table.className = "country-overview-table";

  const tbody = document.createElement("tbody");
  group.indicators.forEach((indicator) => {
    tbody.append(renderIndicatorRow(indicator, dataByPath));
  });

  table.append(tbody);
  tableWrap.append(table);
  section.append(heading, tableWrap);

  return section;
}

function renderIndicatorRow(indicator, dataByPath) {
  const config = getSeriesConfig(indicator);
  const data = dataByPath.get(config.staticDataPath);
  const rankingRows = buildRankingRows(data, config);
  const countryRow = rankingRows.find((row) => row.code === selectedCountry.code);
  const row = document.createElement("tr");
  const labelCell = document.createElement("th");
  const valueCell = document.createElement("td");
  const rankCell = document.createElement("td");

  labelCell.scope = "row";
  labelCell.append(buildIndicatorLink(indicator, config));
  valueCell.className = "country-overview-value";
  rankCell.className = "country-overview-rank";

  if (countryRow) {
    const displayScale = getDisplayScale([{ year: countryRow.year, value: countryRow.value }], config);
    valueCell.append(
      document.createTextNode(formatCompactDisplayValue(countryRow.value, displayScale)),
      buildMutedText(` (${countryRow.year})`),
    );
    rankCell.append(
      document.createTextNode(String(countryRow.rank)),
      buildMutedText(` / ${rankingRows.length}`),
    );
  } else {
    valueCell.textContent = "No data";
    rankCell.textContent = "-";
  }

  row.append(labelCell, valueCell, rankCell);
  return row;
}

function buildMutedText(text) {
  const element = document.createElement("span");
  element.className = "country-overview-muted";
  element.textContent = text;
  return element;
}

function buildIndicatorLink(indicator, config) {
  const link = document.createElement("a");
  const href = indicator.pagePathSegment
    ? `./${indicator.pagePathSegment}/`
    : `../../rankings/${indicator.rankingDirectory}/world/`;

  link.href = href;
  const linkText = document.createElement("span");
  linkText.textContent = config.titleTemplate;

  const linkArrow = document.createElement("span");
  linkArrow.className = "ranking-value-link-arrow";
  linkArrow.setAttribute("aria-hidden", "true");
  linkArrow.textContent = "↗";

  link.append(linkText, linkArrow);
  return link;
}

function buildRankingRows(data, config) {
  const valuesByCountry = getIndicatorSeriesMap(data, config.indicatorCode);

  if (!valuesByCountry || typeof valuesByCountry !== "object") {
    return [];
  }

  return rankingCountries
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
    .sort((countryA, countryB) => countryB.value - countryA.value)
    .map((country, index) => ({
      ...country,
      rank: index + 1,
    }));
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
    .filter(({ year, value }) => (
      Number.isInteger(year)
      && year <= (config.endYear ?? Number.POSITIVE_INFINITY)
      && year >= (config.startYear ?? Number.NEGATIVE_INFINITY)
      && Number.isFinite(value)
    ))
    .sort((pointA, pointB) => pointB.year - pointA.year);

  return points[0] ?? null;
}

function getSeriesConfig(indicator) {
  const config = seriesConfigById.get(indicator.seriesId);

  if (!config) {
    throw new Error(`Series config ${indicator.seriesId} was not found.`);
  }

  return config;
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

function showOverviewError() {
  const container = document.querySelector("#countryOverviewGroups");

  if (container) {
    container.innerHTML = '<p class="ranking-empty">Failed to load country data.</p>';
  }
}
