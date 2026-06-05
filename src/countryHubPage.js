import { countries, countryCategories, countryRegions } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { initializeCountrySelector, sortCountriesByName } from "./countrySelector.js";
import { renderEntityCountSummary } from "./entityCountSummary.js";
import { appendTerritoryNote, isTerritory, markTerritoryElement } from "./countryTypes.js";
import { initializeFilterPanels } from "./filterPanels.js";
import { createFlagImage } from "./flags.js";
import { initializeTerritoryToggle } from "./territoryToggle.js";
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
const countryHubControls = document.querySelector("#countryHubControls");
const mapToggle = document.querySelector(".country-hub-map-toggle");
const mobileMapToggleMedia = window.matchMedia("(max-width: 640px)");
let activeScope = null;
let showTerritories = true;
let worldMap = null;
let worldMapRequest = null;

initializeMapToggle();
initializeWorldMapWhenVisible();

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
showTerritories = initializeTerritoryToggle({
  initialValue: showTerritories,
  container: countryHubControls,
  ariaContext: "country list",
  onChange(nextShowTerritories) {
    countrySearch.close();
    filterPanels.close();
    showTerritories = nextShowTerritories;
    renderCountryTable();
  },
});
renderCountryTable();
appendTerritoryNote(document.querySelector(".hub-section"));

function initializeMapToggle() {
  if (!mapToggle) {
    return;
  }

  syncMapToggleState(mobileMapToggleMedia);
  mobileMapToggleMedia.addEventListener("change", syncMapToggleState);
  mapToggle.addEventListener("toggle", initializeWorldMapWhenVisible);
}

function syncMapToggleState(event) {
  if (!mapToggle) {
    return;
  }

  mapToggle.open = !event.matches;
  initializeWorldMapWhenVisible();
}

function initializeWorldMapWhenVisible() {
  if ((mapToggle && !mapToggle.open) || worldMap || worldMapRequest) {
    return;
  }

  worldMapRequest = renderWorldMap({
    countryList: hubCountries,
    rootHref,
    defaultZoom: 1.11,
  }).then((map) => {
    worldMap = map;
    updateMapScope();
  }).catch((error) => {
    worldMapRequest = null;
    console.error("[Country hub] Failed to initialize map.", error);
  });
}

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
  const matchingCountries = getMatchingCountries();
  const fragment = document.createDocumentFragment();

  matchingCountries.forEach((country) => {
    fragment.append(createCountryTableRow(country));
  });

  tableBody.replaceChildren(fragment);
  renderEntityCountSummary(countElement, matchingCountries);
  updateMapScope(matchingCountries);
  updateFilterButtons();
}

function getMatchingCountries() {
  return sortCountriesByName(
    filterCountriesByScope(hubCountries, activeScope).filter((country) => showTerritories || !isTerritory(country)),
  );
}

function updateMapScope(matchingCountries = getMatchingCountries()) {
  if (!worldMap) {
    return;
  }

  if (activeScope?.type === "category") {
    worldMap.setScope({
      highlightedCountryCodes: new Set(matchingCountries.map((country) => country.code)),
    });
    return;
  }

  worldMap.setScope({
    regionId: activeScope?.type === "region" ? activeScope.id : "",
  });
}

function createCountryTableRow(country) {
  const row = document.createElement("tr");
  row.className = "country-table-row";
  markTerritoryElement(row, country);

  const flag = document.createElement("span");
  flag.className = "ranking-flag country-hub-result-flag";
  const flagImage = createFlagImage(country.code, { rootHref });
  if (flagImage) {
    flag.append(flagImage);
  }

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
