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
const AGE_COMPOSITION_DATA_PATH = "./data/world-bank/age-composition.json";
const TRADE_PARTNERS_DATA_PATH = "./data/un-comtrade/trade-partners.json";
const TAX_REVENUE_COMPOSITION_DATA_PATH = "./data/oecd/tax-revenue-composition.json";
const ECONOMY_CATEGORY_ID = "economy";
const POPULATION_CATEGORY_ID = "population";
const TRADE_CATEGORY_ID = "trade";
const FINANCE_CATEGORY_ID = "finance";
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const PIE_LABEL_MIN_SHARE = 7;
const GVA_INDUSTRY_COLORS = [
  "#2563eb",
  "#059669",
  "#b45309",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#c2410c",
];

function buildOverviewIndicators(rankings, { includeProfileSection = false } = {}) {
  return rankings.map((ranking) => buildOverviewIndicator(ranking, { includeProfileSection }));
}

function buildOverviewIndicator(
  { seriesId, directory, countryPageKind, profileLabel, profileSection },
  { includeProfileSection = false } = {},
) {
  return {
    seriesId,
    rankingDirectory: directory,
    ...(countryPageKind ? { pagePathSegment: countryPageKind } : {}),
    ...(profileLabel ? { label: profileLabel } : {}),
    ...(includeProfileSection && profileSection ? { profileSection } : {}),
  };
}

const overviewGroups = rankingCategories.map(({ id, label, overviewRankings, profileRankings }) => ({
  id,
  title: label,
  overviewIndicators: buildOverviewIndicators(overviewRankings),
  profileIndicators: buildOverviewIndicators(profileRankings, { includeProfileSection: true }),
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

  if (activeCategoryId === POPULATION_CATEGORY_ID) {
    paths.add(AGE_COMPOSITION_DATA_PATH);
  }

  if (activeCategoryId === TRADE_CATEGORY_ID) {
    paths.add(TRADE_PARTNERS_DATA_PATH);
  }

  if (activeCategoryId === FINANCE_CATEGORY_ID) {
    paths.add(TAX_REVENUE_COMPOSITION_DATA_PATH);
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
    return overviewGroups.map((group) => ({
      id: group.id,
      title: group.title,
      indicators: group.overviewIndicators,
    }));
  }

  return overviewGroups
    .filter((group) => group.id === activeCategoryId)
    .map((group) => ({
      id: group.id,
      title: group.title,
      indicators: group.profileIndicators,
    }));
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
    const gvaByIndustryBlock = renderGvaByIndustryBlock(dataByPath);

    if (gvaByIndustryBlock) {
      section.append(gvaByIndustryBlock);
    }
  }

  if (!isOverviewActive() && group.id === POPULATION_CATEGORY_ID) {
    const ageCompositionBlock = renderAgeCompositionBlock(dataByPath);

    if (ageCompositionBlock) {
      section.append(ageCompositionBlock);
    }
  }

  if (!isOverviewActive() && group.id === TRADE_CATEGORY_ID) {
    const tradePartnersBlock = renderTradePartnersBlock(dataByPath);

    if (tradePartnersBlock) {
      section.append(tradePartnersBlock);
    }
  }

  if (!isOverviewActive() && group.id === FINANCE_CATEGORY_ID) {
    const taxRevenueCompositionBlock = renderTaxRevenueCompositionBlock(dataByPath);

    if (taxRevenueCompositionBlock) {
      section.append(taxRevenueCompositionBlock);
    }
  }

  appendProfileIndicatorTables(section, group.indicators, dataByPath);

  return section;
}

function appendProfileIndicatorTables(section, indicators, dataByPath) {
  const sectionedIndicators = new Map();
  const baseIndicators = [];

  for (const indicator of indicators) {
    if (indicator.profileSection) {
      if (!sectionedIndicators.has(indicator.profileSection)) {
        sectionedIndicators.set(indicator.profileSection, []);
      }

      sectionedIndicators.get(indicator.profileSection).push(indicator);
    } else {
      baseIndicators.push(indicator);
    }
  }

  if (baseIndicators.length) {
    section.append(renderIndicatorTable(baseIndicators, dataByPath));
  }

  for (const [title, profileIndicators] of sectionedIndicators) {
    section.append(renderProfileIndicatorSection(title, profileIndicators, dataByPath));
  }
}

function renderProfileIndicatorSection(title, indicators, dataByPath) {
  const block = document.createElement("div");
  block.className = "country-profile-indicator-section";

  const heading = document.createElement("h3");
  heading.className = "country-profile-indicator-heading";
  heading.textContent = title;

  block.append(heading, renderIndicatorTable(indicators, dataByPath));
  return block;
}

function renderIndicatorTable(indicators, dataByPath) {
  const tableWrap = document.createElement("div");
  tableWrap.className = "country-overview-table-wrap";

  const table = document.createElement("table");
  table.className = "country-overview-table";

  const tbody = document.createElement("tbody");
  indicators.forEach((indicator) => {
    tbody.append(renderIndicatorRow(indicator, dataByPath));
  });

  table.append(tbody);
  tableWrap.append(table);
  return tableWrap;
}

function renderAgeCompositionBlock(dataByPath) {
  const ageCompositionData = dataByPath.get(AGE_COMPOSITION_DATA_PATH);
  const countryData = ageCompositionData?.economies?.[selectedCountry.code];

  if (!countryData) {
    return null;
  }

  const block = document.createElement("div");
  block.className = "country-age-composition";

  const heading = document.createElement("h3");
  heading.className = "country-age-composition-heading";
  heading.textContent = "Population by Age Group";

  const chart = renderPieChart(countryData.groups, {
    ariaLabel: `Population by age group chart, ${countryData.year}`,
    className: "country-age-composition-chart",
  });
  const grid = renderDefinitionGrid(
    countryData.groups.map((group) => ({
      label: group.label,
      value: formatPercentShare(group.share),
    })),
    "country-age-composition-grid",
  );
  grid.setAttribute("aria-label", `Population by age group, ${countryData.year}`);
  const tableToggle = renderProfileTableToggle(grid);

  const note = document.createElement("p");
  note.className = "country-age-composition-note";
  note.textContent = "Source: World Bank WDI, based on UN WPP 2024.";

  block.append(heading, chart, tableToggle, note);
  return block;
}

function renderGvaByIndustryBlock(dataByPath) {
  const block = document.createElement("div");
  block.className = "country-gva-industry";

  const gvaData = dataByPath.get(GVA_BY_INDUSTRY_DATA_PATH);
  const countryData = gvaData?.economies?.[selectedCountry.code];

  if (!countryData) {
    return null;
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
    "country-gva-industry-grid",
  );
  grid.setAttribute("aria-label", `Gross value added by industry, ${countryData.year}`);
  const tableToggle = renderProfileTableToggle(grid);

  const note = document.createElement("p");
  note.className = "country-gva-industry-note";
  note.append(
    "Share of total gross value added.",
    document.createElement("br"),
    `Source: UN National Accounts, ${countryData.year}.`,
  );

  block.append(heading, chart, tableToggle, note);
  return block;
}

function renderTradePartnersBlock(dataByPath) {
  const tradePartnersData = dataByPath.get(TRADE_PARTNERS_DATA_PATH);
  const countryData = tradePartnersData?.economies?.[selectedCountry.code];

  if (!countryData) {
    return null;
  }

  const exportPanel = renderTradePartnerPanel("Export partners", countryData.exports);
  const importPanel = renderTradePartnerPanel("Import partners", countryData.imports);

  if (!exportPanel && !importPanel) {
    return null;
  }

  const block = document.createElement("div");
  block.className = "country-trade-partners";

  const body = document.createElement("div");
  body.className = "country-trade-partners-body";

  if (exportPanel) {
    body.append(exportPanel);
  }

  if (importPanel) {
    body.append(importPanel);
  }

  const note = document.createElement("p");
  note.className = "country-trade-partners-note";
  note.textContent = `Source: UN Comtrade, ${countryData.year}.`;

  block.append(body, note);
  return block;
}

function renderTradePartnerPanel(label, flowData) {
  const partners = flowData?.partners ?? [];

  if (!partners.length) {
    return null;
  }

  const panel = document.createElement("div");
  panel.className = "country-trade-partner-panel";

  const heading = document.createElement("h3");
  heading.className = "country-trade-partner-heading";
  heading.textContent = label;

  const chart = renderPieChart(
    partners.map((partner) => ({
      label: partner.name,
      share: partner.share,
    })),
    { ariaLabel: `${label} chart` },
  );
  const grid = renderDefinitionGrid(
    partners.map((partner) => ({
      label: partner.name,
      value: formatPercentShare(partner.share),
    })),
    "country-trade-partner-grid",
  );
  grid.setAttribute("aria-label", `${label}, ${flowData.year}`);
  const tableToggle = renderProfileTableToggle(grid);

  panel.append(heading, chart, tableToggle);
  return panel;
}

function renderTaxRevenueCompositionBlock(dataByPath) {
  const taxRevenueData = dataByPath.get(TAX_REVENUE_COMPOSITION_DATA_PATH);
  const countryData = taxRevenueData?.economies?.[selectedCountry.code];
  const shares = countryData?.shares ?? [];

  if (!shares.length) {
    return null;
  }

  const block = document.createElement("div");
  block.className = "country-gva-industry country-tax-revenue-composition";

  const heading = document.createElement("h3");
  heading.className = "country-gva-industry-heading country-tax-revenue-composition-heading";
  heading.textContent = "Tax Revenue Composition";

  const chart = renderPieChart(shares, {
    ariaLabel: `Tax revenue composition chart, ${countryData.year}`,
    className: "country-tax-revenue-composition-chart",
  });
  const grid = renderDefinitionGrid(
    shares.map((category) => ({
      label: category.label,
      value: formatPercentShare(category.share),
    })),
    "country-gva-industry-grid country-tax-revenue-composition-grid",
  );
  grid.setAttribute("aria-label", `Tax revenue composition, ${countryData.year}`);
  const tableToggle = renderProfileTableToggle(grid);

  const note = document.createElement("p");
  note.className = "country-gva-industry-note country-tax-revenue-composition-note";
  note.textContent = `Source: OECD Global Revenue Statistics Database, ${countryData.year}.`;

  block.append(heading, chart, tableToggle, note);
  return block;
}

function renderProfileTableToggle(table) {
  const details = document.createElement("details");
  details.className = "country-profile-table-toggle";

  const summary = document.createElement("summary");
  summary.textContent = "Show table";

  details.append(summary, table);
  return details;
}

function renderGvaIndustryChart(sectors) {
  return renderPieChart(sectors, { ariaLabel: "GDP composition by industry chart" });
}

function renderPieChart(items, { ariaLabel, className = "" } = {}) {
  const chart = document.createElement("div");
  chart.className = ["country-gva-industry-chart", className].filter(Boolean).join(" ");

  const pieSectors = items
    .map((item, index) => ({
      ...item,
      color: item.color ?? GVA_INDUSTRY_COLORS[index % GVA_INDUSTRY_COLORS.length],
      share: Number(item.share),
    }))
    .filter((item) => Number.isFinite(item.share) && item.share > 0);
  const totalShare = pieSectors.reduce((total, sector) => total + sector.share, 0);

  const svg = document.createElementNS(SVG_NAMESPACE, "svg");
  svg.setAttribute("class", "country-gva-industry-pie");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", ariaLabel ?? "Pie chart");

  const useHoverTooltip = !isTouchTooltipPreferred();
  const tooltip = useHoverTooltip ? document.createElement("div") : null;
  if (tooltip) {
    tooltip.className = "country-gva-industry-tooltip";
    tooltip.setAttribute("role", "tooltip");
    tooltip.hidden = true;
  }

  let startAngle = -90;
  for (const sector of pieSectors) {
    const endAngle = startAngle + (sector.share / totalShare) * 360;
    const path = document.createElementNS(SVG_NAMESPACE, "path");
    path.setAttribute("d", createPieSlicePathData(50, 50, 42, startAngle, endAngle));
    path.setAttribute("fill", sector.color);

    if (tooltip) {
      path.addEventListener("pointerenter", (event) => {
        showPieTooltip(tooltip, chart, formatPieItemLabel(sector), event);
      });
      path.addEventListener("pointermove", (event) => {
        positionPieTooltip(tooltip, chart, event);
      });
      path.addEventListener("pointerleave", () => {
        tooltip.hidden = true;
      });
    }

    svg.append(path);

    if (sector.share >= PIE_LABEL_MIN_SHARE) {
      const labelPosition = getPointOnCircle(50, 50, 31, (startAngle + endAngle) / 2);
      const label = document.createElementNS(SVG_NAMESPACE, "text");
      label.setAttribute("class", "country-pie-share-label");
      label.setAttribute("x", labelPosition.x.toFixed(2));
      label.setAttribute("y", labelPosition.y.toFixed(2));
      label.textContent = formatPercentShare(sector.share);
      svg.append(label);
    }

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
    label.textContent = formatPieItemLabel(sector);

    item.append(marker, label);
    legend.append(item);
  }

  chart.append(svg, legend);
  if (tooltip) {
    chart.append(tooltip);
  }
  return chart;
}

function formatPieItemLabel(item) {
  return `${item.label}: ${formatPercentShare(item.share)}`;
}

function showPieTooltip(tooltip, container, label, event) {
  tooltip.textContent = label;
  tooltip.hidden = false;
  positionPieTooltip(tooltip, container, event);
}

function positionPieTooltip(tooltip, container, event) {
  const containerRect = container.getBoundingClientRect();
  tooltip.style.left = `${event.clientX - containerRect.left}px`;
  tooltip.style.top = `${event.clientY - containerRect.top}px`;
}

function isTouchTooltipPreferred() {
  return window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ?? false;
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
  labelCell.textContent = indicator.label ?? config.titleTemplate;
  valueCell.className = "country-overview-value";
  rankCell.className = "country-overview-rank";
  yearCell.className = "country-overview-year";

  if (countryRow) {
    const displayScale = getSingleValueDisplayScale(countryRow.value, config);
    valueCell.append(buildValueLink(indicator, formatCompactDisplayValue(countryRow.value, displayScale)));
    rankCell.append(buildRankingText(indicator, formatRankPosition(countryRow.rank, rankingRows.length)));
    yearCell.textContent = String(countryRow.year);
  } else {
    valueCell.append(buildMissingValueLink(indicator, "No data"));
    rankCell.append(buildRankingText(indicator, "-"));
    yearCell.textContent = "-";
  }

  row.append(labelCell, valueCell, rankCell, yearCell);
  return row;
}

function formatRankPosition(rank, total) {
  return `#${rank} / ${total}`;
}

function buildRankingRowsBySeriesId(dataByPath) {
  const rankingRows = new Map();

  getActiveGroups().forEach((group) => {
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
  if (indicator.pagePathSegment) {
    return buildValueLink(indicator, text);
  }

  return buildRankingText(indicator, text);
}

function buildRankingText(indicator, text) {
  return indicator.rankingDirectory
    ? buildRankingLink(indicator, text)
    : document.createTextNode("-");
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
