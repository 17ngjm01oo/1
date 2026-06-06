import { formatCompactDisplayValue, getSingleValueDisplayScale } from "./displayFormat.js";
import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { getCountryCurrencyDisplay } from "./currencyCodes.js";
import { createFlagImage } from "./flags.js";
import { rankingCategories } from "./rankingCategories.js";
import { getIndicatorSeriesMap } from "./seriesData.js";
import { renderWorldMap } from "./worldMap.js";
import "./rankingTopNav.js";

const GVA_BY_INDUSTRY_DATA_PATH = "./data/un-national-accounts/gva-by-industry.json";
const ECONOMY_CATEGORY_ID = "economy";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const GVA_INDUSTRY_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#2dd4bf",
  "#fb923c",
];

function buildOverviewIndicators(rankings) {
  return rankings.map(({ seriesId, directory, countryPageKind }) => ({
    seriesId,
    rankingDirectory: directory,
    ...(countryPageKind ? { pagePathSegment: countryPageKind } : {}),
  }));
}

const overviewGroups = rankingCategories.map(({ id, label, rankings }) => ({
  id,
  title: label,
  indicators: buildOverviewIndicators(rankings),
}));

const overviewCategory = { id: "overview", title: "Overview" };
const overviewCategories = [
  overviewCategory,
  ...overviewGroups.map(({ id, title }) => ({ id, title })),
];
const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));
const rankingCountries = countries.filter((country) => country.includeInRankings !== false);
const countryCode = document.body.dataset.countryCode;
const selectedCountry = countries.find((country) => country.code === countryCode);
const requestedCategoryId = document.body.dataset.countryOverviewCategory ?? overviewCategory.id;
const activeCategoryId = overviewCategories.some((category) => category.id === requestedCategoryId)
  ? requestedCategoryId
  : overviewCategory.id;
const rootHref = document.body.dataset.rootHref ?? "../../";
const countryRootHref = document.body.dataset.countryRootHref ?? "./";
let loadedDataByPath = null;
let rankingRowsBySeriesId = new Map();

initializeCountryOverview().catch((error) => {
  console.error("[Country overview] Failed to initialize page.", error);
  showOverviewError();
});

async function initializeCountryOverview() {
  if (!selectedCountry) {
    throw new Error(`Country ${countryCode} was not found.`);
  }

  updateCountryHeading();
  prepareCountryOverviewLayout();
  renderCountryMap();
  renderCategoryControls();

  loadedDataByPath = await loadDataByPath(getRequiredStaticDataPaths());
  rankingRowsBySeriesId = buildRankingRowsBySeriesId(loadedDataByPath);
  renderOverview();
}

function updateCountryHeading() {
  const heading = document.querySelector("#country-overview-title");
  if (!heading) {
    return;
  }

  const headingText = heading.textContent.trim() || selectedCountry.name;
  heading.innerHTML = "";

  const flag = createFlagImage(selectedCountry.code, { className: "country-flag" });

  const name = document.createElement("span");
  name.className = "country-name";
  name.textContent = headingText;

  if (flag) {
    heading.append(flag);
  }

  heading.append(name);
}

function renderCountryMap() {
  const header = document.querySelector(".country-data-header");
  const card = header?.closest(".country-overview-card");

  if (!header || !card || card.querySelector(".country-overview-map")) {
    return;
  }

  const map = document.createElement("div");
  map.className = "world-map country-overview-map";
  map.id = "countryOverviewMap";
  map.setAttribute("aria-label", `${selectedCountry.name} map`);
  map.setAttribute("aria-live", "polite");

  const loading = document.createElement("p");
  loading.className = "world-map-loading";
  loading.textContent = "Loading map...";

  map.append(loading);
  header.after(map);

  renderWorldMap({
    containerSelector: "#countryOverviewMap",
    countryList: countries.filter((country) => country.slug),
    rootHref,
    focusCountryCode: selectedCountry.code,
  });
}

function renderCategoryControls() {
  const content = document.querySelector(".country-overview-content");

  if (!content || content.querySelector(".country-overview-category-panel")) {
    return;
  }

  const panel = document.createElement("div");
  panel.className = "country-overview-category-panel";
  panel.setAttribute("aria-label", "Country profile categories");

  const label = document.createElement("p");
  label.className = "country-overview-category-label";
  label.textContent = "Categories";

  const list = document.createElement("div");
  list.className = "country-overview-category-list";
  list.setAttribute("aria-label", "Country profile categories");

  for (const category of overviewCategories) {
    const link = document.createElement("a");
    link.className = "country-overview-category-button";
    link.href = getCategoryHref(category.id);
    link.dataset.countryOverviewCategory = category.id;
    link.textContent = category.title;

    if (category.id === activeCategoryId) {
      link.setAttribute("aria-current", "page");
    }

    list.append(link);
  }

  panel.append(label, list);
  content.prepend(panel);
}

function prepareCountryOverviewLayout() {
  const header = document.querySelector(".country-data-header");
  const card = header?.closest(".indicators-card");
  const section = card?.closest(".indicators-section");
  const groups = document.querySelector(".country-overview-groups");

  if (!section || !header || !card || !groups || card.querySelector(".country-overview-content")) {
    return;
  }

  const content = document.createElement("div");
  content.className = "country-overview-content";

  section.classList.add("country-overview-layout");
  card.classList.add("country-overview-card");
  header.after(content);
  content.append(groups);
}

function getRequiredStaticDataPaths() {
  const paths = new Set();

  if (activeCategoryId === ECONOMY_CATEGORY_ID) {
    paths.add(GVA_BY_INDUSTRY_DATA_PATH);
  }

  for (const group of getActiveGroups()) {
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
      const dataUrl = new URL(`${rootHref}${staticDataPath.replace(/^\.\//, "")}`, window.location.href);
      const response = await fetch(dataUrl, { headers: { Accept: "application/json" } });

      if (!response.ok) {
        throw new Error(`Static data file request failed: ${response.status} ${response.statusText}`);
      }

      return [staticDataPath, await response.json()];
    }),
  );

  return new Map(entries);
}

function renderOverview() {
  const container = document.querySelector("#countryOverviewGroups");
  if (!container || !loadedDataByPath) {
    return;
  }

  container.innerHTML = "";

  if (isOverviewActive()) {
    container.append(renderBasicInformationSection());
  }

  for (const group of getActiveGroups()) {
    container.append(renderGroup(group, loadedDataByPath, { showHeading: isOverviewActive() }));
  }
}

function getActiveGroups() {
  if (isOverviewActive()) {
    return overviewGroups;
  }

  return overviewGroups.filter((group) => group.id === activeCategoryId);
}

function isOverviewActive() {
  return activeCategoryId === overviewCategory.id;
}

function renderBasicInformationSection() {
  const section = document.createElement("section");
  section.className = "country-overview-section country-basic-information";
  section.setAttribute("aria-label", "Basic Information");

  section.append(renderDefinitionGrid(getBasicInformationItems()));
  return section;
}

function getBasicInformationItems() {
  const capitals = Array.isArray(selectedCountry.capitals) ? selectedCountry.capitals : [];
  const officialLanguages = Array.isArray(selectedCountry.officialLanguages)
    ? selectedCountry.officialLanguages
    : [];

  return [
    { label: "Official name", value: selectedCountry.officialName ?? "" },
    { label: "Region", value: selectedCountry.region ?? "" },
    { label: capitals.length > 1 ? "Capitals" : "Capital", value: capitals.join(", ") },
    { label: officialLanguages.length > 1 ? "Official languages" : "Official language", value: officialLanguages.join(", ") },
    { label: "Currency", value: getCountryCurrencyDisplay(selectedCountry.code) },
  ];
}

function renderGroup(group, dataByPath, { showHeading = true } = {}) {
  const section = document.createElement("section");
  section.className = "country-overview-section";

  if (showHeading) {
    section.setAttribute("aria-labelledby", `${group.id}-overview-title`);

    const heading = document.createElement("h2");
    heading.id = `${group.id}-overview-title`;
    heading.textContent = group.title;
    section.append(heading);
  }

  if (!isOverviewActive() && group.id === ECONOMY_CATEGORY_ID) {
    section.append(renderGvaByIndustryBlock(dataByPath));
  }

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
  section.append(tableWrap);

  return section;
}

function renderGvaByIndustryBlock(dataByPath) {
  const block = document.createElement("div");
  block.className = "country-gva-industry";

  const gvaData = dataByPath.get(GVA_BY_INDUSTRY_DATA_PATH);
  const countryData = gvaData?.economies?.[selectedCountry.code];

  if (!countryData) {
    block.append(renderEmptyMessage("No industry value added data available."));
    return block;
  }

  const sectors = countryData.shares ?? [];
  const heading = document.createElement("h3");
  heading.className = "country-gva-industry-heading";
  heading.textContent = "GDP Composition by Industry";

  const chart = renderGvaIndustryChart(sectors);
  const grid = renderDefinitionGrid(
    sectors.map((sector) => ({
      label: sector.label,
      value: formatPercentShare(sector.share),
    })),
  );
  grid.setAttribute("aria-label", `Gross value added by industry, ${countryData.year}`);

  const note = document.createElement("p");
  note.className = "country-gva-industry-note";
  note.append(
    `Share of total gross value added, ${countryData.year}.`,
    document.createElement("br"),
    "Source: UN National Accounts.",
  );

  block.append(heading, chart, grid, note);
  return block;
}

function renderGvaIndustryChart(sectors) {
  const chart = document.createElement("div");
  chart.className = "country-gva-industry-chart";

  const pieSectors = sectors
    .map((sector, index) => ({
      ...sector,
      color: GVA_INDUSTRY_COLORS[index % GVA_INDUSTRY_COLORS.length],
      share: Number(sector.share),
    }))
    .filter((sector) => Number.isFinite(sector.share) && sector.share > 0);
  const totalShare = pieSectors.reduce((total, sector) => total + sector.share, 0);

  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("class", "country-gva-industry-pie");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "GDP composition by industry chart");

  const tooltip = document.createElement("div");
  tooltip.className = "country-gva-industry-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;

  let startAngle = -90;
  for (const sector of pieSectors) {
    const endAngle = startAngle + (sector.share / totalShare) * 360;
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", createPieSlicePathData(50, 50, 42, startAngle, endAngle));
    path.setAttribute("fill", sector.color);
    path.addEventListener("pointerenter", (event) => {
      showGvaIndustryTooltip(tooltip, chart, formatGvaIndustryLabel(sector), event);
    });
    path.addEventListener("pointermove", (event) => {
      positionGvaIndustryTooltip(tooltip, chart, event);
    });
    path.addEventListener("pointerleave", () => {
      tooltip.hidden = true;
    });

    svg.append(path);
    startAngle = endAngle;
  }

  const legend = document.createElement("ul");
  legend.className = "country-gva-industry-legend";

  for (const sector of pieSectors) {
    const item = document.createElement("li");
    const marker = document.createElement("span");
    marker.className = "country-gva-industry-legend-marker";
    marker.style.backgroundColor = sector.color;

    const label = document.createElement("span");
    label.textContent = formatGvaIndustryLabel(sector);

    item.append(marker, label);
    legend.append(item);
  }

  chart.append(svg, legend, tooltip);
  return chart;
}

function formatGvaIndustryLabel(sector) {
  return `${sector.label}: ${formatPercentShare(sector.share)}`;
}

function showGvaIndustryTooltip(tooltip, container, label, event) {
  tooltip.textContent = label;
  tooltip.hidden = false;
  positionGvaIndustryTooltip(tooltip, container, event);
}

function positionGvaIndustryTooltip(tooltip, container, event) {
  const containerRect = container.getBoundingClientRect();
  tooltip.style.left = `${event.clientX - containerRect.left}px`;
  tooltip.style.top = `${event.clientY - containerRect.top}px`;
}

function createPieSlicePathData(centerX, centerY, radius, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    return [
      `M ${centerX} ${centerY - radius}`,
      `A ${radius} ${radius} 0 1 1 ${centerX - 0.01} ${centerY - radius}`,
      `A ${radius} ${radius} 0 1 1 ${centerX} ${centerY - radius}`,
      "Z",
    ].join(" ");
  }

  const start = getPointOnCircle(centerX, centerY, radius, endAngle);
  const end = getPointOnCircle(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function getPointOnCircle(centerX, centerY, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function renderDefinitionGrid(items, extraClassName = "") {
  const grid = document.createElement("dl");
  grid.className = ["country-basic-information-grid", extraClassName].filter(Boolean).join(" ");

  for (const item of items) {
    const term = document.createElement("dt");
    term.textContent = item.label;

    const description = document.createElement("dd");
    description.textContent = item.value;

    grid.append(term, description);
  }

  return grid;
}

function renderEmptyMessage(message) {
  const empty = document.createElement("p");
  empty.className = "ranking-empty";
  empty.textContent = message;
  return empty;
}

function renderIndicatorRow(indicator, dataByPath) {
  const config = getSeriesConfig(indicator);
  const rankingRows = getCachedRankingRows(indicator, dataByPath);
  const countryRow = rankingRows.find((row) => row.code === selectedCountry.code);
  const row = document.createElement("tr");
  const labelCell = document.createElement("th");
  const valueCell = document.createElement("td");
  const rankCell = document.createElement("td");
  const yearCell = document.createElement("td");

  labelCell.scope = "row";
  labelCell.textContent = config.titleTemplate;
  valueCell.className = "country-overview-value";
  rankCell.className = "country-overview-rank";
  yearCell.className = "country-overview-year";

  if (countryRow) {
    const displayScale = getSingleValueDisplayScale(countryRow.value, config);
    valueCell.append(buildValueLink(indicator, formatCompactDisplayValue(countryRow.value, displayScale)));
    rankCell.append(buildRankingLink(indicator, `${countryRow.rank} / ${rankingRows.length}`));
    yearCell.textContent = String(countryRow.year);
  } else {
    valueCell.append(buildMissingValueLink(indicator, "No data"));
    rankCell.append(buildRankingLink(indicator, "-"));
    yearCell.textContent = "-";
  }

  row.append(labelCell, valueCell, rankCell, yearCell);
  return row;
}

function buildRankingRowsBySeriesId(dataByPath) {
  const rankingRows = new Map();

  overviewGroups.forEach((group) => {
    group.indicators.forEach((indicator) => {
      const config = getSeriesConfig(indicator);
      const data = dataByPath.get(config.staticDataPath);
      rankingRows.set(indicator.seriesId, buildRankingRows(data, config));
    });
  });

  return rankingRows;
}

function getCachedRankingRows(indicator, dataByPath) {
  if (!rankingRowsBySeriesId.has(indicator.seriesId)) {
    const config = getSeriesConfig(indicator);
    const data = dataByPath.get(config.staticDataPath);
    rankingRowsBySeriesId.set(indicator.seriesId, buildRankingRows(data, config));
  }

  return rankingRowsBySeriesId.get(indicator.seriesId) ?? [];
}

function buildValueLink(indicator, text) {
  if (!indicator.pagePathSegment) {
    return document.createTextNode(text);
  }

  const link = document.createElement("a");
  link.href = `${countryRootHref}${indicator.pagePathSegment}/`;
  appendLinkContent(link, text);
  return link;
}

function buildMissingValueLink(indicator, text) {
  return indicator.pagePathSegment
    ? buildValueLink(indicator, text)
    : buildRankingLink(indicator, text);
}

function buildRankingLink(indicator, text) {
  const link = document.createElement("a");
  link.href = `${rootHref}rankings/${indicator.rankingDirectory}/world/`;
  appendLinkContent(link, text);
  return link;
}

function getCategoryHref(categoryId) {
  return categoryId === overviewCategory.id
    ? countryRootHref
    : `${countryRootHref}categories/${categoryId}/`;
}

function appendLinkContent(link, text) {
  const linkText = document.createElement("span");
  linkText.textContent = text;
  link.append(linkText);
}

function formatPercentShare(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(1)}%` : "-";
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
