import { countries, countryCategories, countryRegions } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { initializeCountrySelector, sortCountriesByName } from "./countrySelector.js";
import { appendTerritoryNote, markTerritoryElement } from "./countryTypes.js";
import { initializeFilterPanels } from "./filterPanels.js";
import { getFlagEmoji } from "./flags.js";
import { renderWorldMap } from "./worldMap.js";
import "./rankingTopNav.js";

const rootHref = document.body.dataset.rootHref ?? "../";
const profileCountries = countries.filter((country) => country.slug);
const hubCountries = profileCountries.filter((country) => country.code !== "G001");
const countElement = document.querySelector("#countryHubCount");
const tableBody = document.querySelector("#countryTableBody");
const regionList = document.querySelector("#regionList");
const categoryList = document.querySelector("#categoryList");
const regionPanel = document.querySelector("#region-heading")?.closest(".category-panel");
const categoryPanel = document.querySelector("#category-heading")?.closest(".category-panel");
let activeScope = null;

const worldMap = await renderWorldMap({
  countryList: hubCountries,
  rootHref,
  defaultZoom: 1.11,
});

const countrySearch = initializeCountrySelector({
  countryPool: hubCountries,
  getCountryHref(country) {
    return `${rootHref}countries/${country.slug}/`;
  },
});
const filterPanels = initializeFilterPanels({
  regionPanel,
  categoryPanel,
  regionList,
  categoryList,
  onOpen() {
    countrySearch.close();
  },
});

initializeHubFilters();
renderCountryTable();
appendTerritoryNote(document.querySelector(".hub-section"));

function initializeHubFilters() {
  renderRegionButtons();
  renderCategoryButtons();
}

function renderRegionButtons() {
  appendFilterButton(regionList, "World", null, "WORLD");

  countryRegions.forEach((region) => {
    appendFilterButton(regionList, region.label, { type: "region", id: region.id }, region.id);
  });
}

function renderCategoryButtons() {
  countryCategories.forEach((category) => {
    appendFilterButton(categoryList, category.label, { type: "category", id: category.id });
  });
}

function appendFilterButton(list, label, scope, regionId = null) {
  const button = document.createElement("button");
  button.className = `category-button${regionId ? " region-button" : ""}`;
  button.type = "button";
  button.textContent = label;

  if (regionId) {
    button.dataset.regionId = regionId;
  } else {
    button.dataset.categoryId = scope.id;
  }

  button.addEventListener("click", () => {
    countrySearch.close();
    activeScope = isSameScope(activeScope, scope) ? null : scope;
    filterPanels.close();
    renderCountryTable();
  });
  list.append(button);
}

function renderCountryTable() {
  const matchingCountries = sortCountriesByName(filterCountriesByScope(hubCountries, activeScope));
  tableBody.replaceChildren(...matchingCountries.map(createCountryTableRow));
  countElement.textContent = `Showing: ${matchingCountries.length}`;
  worldMap?.focusRegion(activeScope?.type === "region" ? activeScope.id : null);
  updateFilterButtons();
}

function createCountryTableRow(country) {
  const row = document.createElement("tr");
  row.className = "country-table-row";
  markTerritoryElement(row, country);

  const flag = document.createElement("span");
  flag.className = "ranking-flag country-hub-result-flag";
  flag.textContent = getFlagEmoji(country.code);

  const name = document.createElement("a");
  name.className = "country-hub-result-name";
  name.href = `${rootHref}countries/${country.slug}/`;
  name.textContent = country.name;

  const region = document.createElement("span");
  region.className = "country-hub-result-region";
  region.textContent = country.region || "-";

  [flag, name, region].forEach((content) => {
    const cell = document.createElement("td");
    cell.append(content);
    row.append(cell);
  });

  return row;
}

function updateFilterButtons() {
  document.querySelectorAll(".region-button").forEach((button) => {
    const isWorld = button.dataset.regionId === "WORLD";
    const isActive = isWorld ? !activeScope : activeScope?.type === "region" && activeScope.id === button.dataset.regionId;
    button.setAttribute("aria-pressed", String(isActive));
  });

  document.querySelectorAll(".category-button[data-category-id]").forEach((button) => {
    const isActive = activeScope?.type === "category" && activeScope.id === button.dataset.categoryId;
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function isSameScope(scopeA, scopeB) {
  return scopeA?.type === scopeB?.type && scopeA?.id === scopeB?.id;
}
