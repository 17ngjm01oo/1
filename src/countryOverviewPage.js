import { formatCompactDisplayValue, getSingleValueDisplayScale } from "./displayFormat.js";
import { seriesConfigs } from "./config.js";
import { countries } from "./countries.js";
import { getCountryCurrencyDisplay } from "./currencyCodes.js";
import { getFlagEmoji } from "./flags.js";
import { rankingCategories } from "./rankingCategories.js";
import { getIndicatorSeriesMap } from "./seriesData.js";
import { renderWorldMap } from "./worldMap.js";
import "./rankingTopNav.js";

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
let activeCategoryId = overviewCategory.id;
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
    rootHref: document.body.dataset.rootHref ?? "../../",
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
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Country profile categories");

  for (const category of overviewCategories) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "country-overview-category-button";
    button.dataset.countryOverviewCategory = category.id;
    button.setAttribute("role", "tab");
    button.textContent = category.title;
    button.addEventListener("click", () => {
      activeCategoryId = category.id;
      updateCategorySelection();
      renderOverview();
    });

    list.append(button);
  }

  panel.append(label, list);
  content.prepend(panel);
  updateCategorySelection();
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

function updateCategorySelection() {
  document.querySelectorAll("[data-country-overview-category]").forEach((button) => {
    const isActive = button.dataset.countryOverviewCategory === activeCategoryId;
    button.setAttribute("aria-selected", String(isActive));
  });
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

function renderOverview() {
  const container = document.querySelector("#countryOverviewGroups");
  if (!container || !loadedDataByPath) {
    return;
  }

  container.innerHTML = "";

  if (isOverviewActive()) {
    container.append(renderBasicInformationSection());
  } else {
    container.append(renderActiveCategoryHeading());
  }

  for (const group of getActiveGroups()) {
    container.append(renderGroup(group, loadedDataByPath, { showHeading: isOverviewActive() }));
  }
}

function renderActiveCategoryHeading() {
  const heading = document.createElement("h2");
  heading.className = "country-overview-active-title";
  heading.textContent = getActiveCategory().title;
  return heading;
}

function getActiveCategory() {
  return overviewCategories.find((category) => category.id === activeCategoryId) ?? overviewCategory;
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

  const grid = document.createElement("dl");
  grid.className = "country-basic-information-grid";

  getBasicInformationItems().forEach((item) => {
    const term = document.createElement("dt");
    term.textContent = item.label;

    const description = document.createElement("dd");
    description.textContent = item.value;

    grid.append(term, description);
  });

  section.append(grid);
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
  link.href = `./${indicator.pagePathSegment}/`;
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
  link.href = `../../rankings/${indicator.rankingDirectory}/world/`;
  appendLinkContent(link, text);
  return link;
}

function appendLinkContent(link, text) {
  const linkText = document.createElement("span");
  linkText.textContent = text;
  link.append(linkText);
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
