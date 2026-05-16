import { seriesConfigs } from "./config.js";
import { countries, countryCategories } from "./countries.js";
import { fetchImfSeries, buildImfRequestUrls } from "./imfApi.js";
import { transformImfSeries } from "./transform.js";
import { clearLineChart, formatDisplayValue, getDisplayScale, renderLineChart } from "./chart.js";
import { getFlagEmoji } from "./flags.js";

let activeCountryCode = null;
let renderRequestId = 0;
let currentCountryMatches = [];
let highlightedCountryIndex = -1;
let activeCategoryId = null;
let activeRegionId = null;
const seriesRuntimeState = new Map(
  seriesConfigs.map((seriesConfig) => [
    seriesConfig.id,
    {
      mainConfig: null,
      mainPoints: [],
      comparisonCountry: null,
      comparisonPoints: null,
      comparisonRequestId: 0,
      comparisonMatches: [],
      highlightedComparisonIndex: -1,
      hasMainData: false,
    },
  ]),
);

const countryRegions = [
  { id: "Asia", label: "Asia" },
  { id: "Europe", label: "Europe" },
  { id: "North America", label: "North America" },
  { id: "South America", label: "South America" },
  { id: "Africa", label: "Africa" },
  { id: "Oceania", label: "Oceania" },
  { id: "Middle East", label: "Middle East" },
];

initializeApp().catch((error) => {
  console.error("[App] Unhandled initialization error.", error);
});

async function initializeApp() {
  document.title = "Nominal GDP and Nominal GDP per capita";
  setCountryContentVisibility(false);
  initializeCountrySearch();
  initializeCountryFilters();
  initializeCompareSearches();
  renderRegions();
  renderCategories();

  const initialCountry = getInitialCountryFromUrl();

  if (initialCountry) {
    await selectCountry(initialCountry.code);
  }
}

function getSelectedCountry(countryCode) {
  if (!countryCode) {
    return null;
  }

  const selectedCountry = countries.find((country) => country.code === countryCode);

  if (!selectedCountry) {
    console.warn("[App] Selected country code was not found.", {
      countryCode,
      countries,
    });
  }

  return selectedCountry ?? null;
}

function getInitialCountryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const countryParam = params.get("country");

  if (!countryParam) {
    return null;
  }

  const normalizedCountryParam = countryParam.trim().toLowerCase();
  const selectedCountry = countries.find((country) => {
    return (
      country.code.toLowerCase() === normalizedCountryParam ||
      country.slug.toLowerCase() === normalizedCountryParam
    );
  });

  if (!selectedCountry) {
    console.warn("[App] Country query parameter did not match a known country.", {
      countryParam,
    });
  }

  return selectedCountry ?? null;
}

async function selectCountry(countryCode) {
  const selectedCountry = getSelectedCountry(countryCode);

  if (!selectedCountry) {
    console.warn("[App] Could not select country because the code was not found.", { countryCode });
    return;
  }

  activeCountryCode = selectedCountry.code;
  updateCountrySelectionUi(selectedCountry);
  await loadCountry(selectedCountry);
}

async function loadCountry(selectedCountry) {
  const currentRequestId = ++renderRequestId;
  const countrySeriesConfigs = buildCountrySeriesConfigs(selectedCountry);

  document.title = `${selectedCountry.name} GDP Charts`;
  setCountryContentVisibility(true);
  updateCountryDataHeading(selectedCountry);
  updateSeriesHeadings(countrySeriesConfigs);
  resetComparisons();

  await Promise.all(
    countrySeriesConfigs.map((seriesConfig) =>
      loadAndRenderSeries(seriesConfig, currentRequestId),
    ),
  );
}

function setCountryContentVisibility(isVisible) {
  const indicatorsSection = document.querySelector(".indicators-section");
  const sharedNotes = document.querySelector(".shared-notes");

  if (indicatorsSection) {
    indicatorsSection.hidden = !isVisible;
  }

  if (sharedNotes) {
    sharedNotes.hidden = !isVisible;
  }
}

function resetComparisons() {
  seriesRuntimeState.forEach((state, seriesId) => {
    state.comparisonCountry = null;
    state.comparisonPoints = null;
    state.comparisonRequestId += 1;
    state.hasMainData = false;

    updateCompareSelectionUi(seriesId);
    updateCompareAvailability(seriesId);
    hideCompareResults(seriesId);
  });
}

function buildCountrySeriesConfigs(selectedCountry) {
  return seriesConfigs.map((seriesConfig) => {
    const chartTitle = seriesConfig.titleTemplate.replace("{countryName}", selectedCountry.name);

    return {
      ...seriesConfig,
      countryCode: selectedCountry.code,
      countryName: selectedCountry.name,
      chartTitle,
    };
  });
}

function updateCountryDataHeading(selectedCountry) {
  const countryDataTitle = document.querySelector("#country-data-title");

  if (!countryDataTitle) {
    return;
  }

  const flagEmoji = getFlagEmoji(selectedCountry.code);
  countryDataTitle.innerHTML = "";

  if (flagEmoji) {
    const flagElement = document.createElement("span");
    flagElement.className = "country-flag";
    flagElement.setAttribute("aria-hidden", "true");
    flagElement.textContent = flagEmoji;
    countryDataTitle.append(flagElement);
  }

  const nameElement = document.createElement("span");
  nameElement.className = "country-name";
  nameElement.textContent = selectedCountry.name;
  countryDataTitle.append(nameElement);
}

function initializeCountrySearch() {
  const searchInput = document.querySelector("#countrySearchInput");
  const resultsElement = document.querySelector("#countrySearchResults");

  if (!searchInput || !resultsElement) {
    return;
  }

  searchInput.addEventListener("input", () => {
    activeCategoryId = null;
    activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    renderCountryResults(searchInput.value, getSelectedCountry(activeCountryCode));
  });

  searchInput.addEventListener("keydown", (event) => {
    handleCountrySearchKeydown(event);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderCountryResults(searchInput.value, getSelectedCountry(activeCountryCode));
    }
  });

  updateCountrySelectionUi(null);
}

function initializeCountryFilters() {
  const regionPanel = document.querySelector("#region-heading")?.closest(".category-panel");
  const categoryPanel = document.querySelector("#category-heading")?.closest(".category-panel");

  regionPanel?.addEventListener("toggle", () => {
    if (regionPanel.open || !activeRegionId) {
      return;
    }

    activeRegionId = null;
    updateRegionButtons();
    hideCountryResults();
  });

  categoryPanel?.addEventListener("toggle", () => {
    if (categoryPanel.open || !activeCategoryId) {
      return;
    }

    activeCategoryId = null;
    updateCategoryButtons();
    hideCountryResults();
  });
}

function initializeCompareSearches() {
  seriesConfigs.forEach((seriesConfig) => {
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
  });
}

function renderRegions() {
  const regionList = document.querySelector("#regionList");

  if (!regionList) {
    return;
  }

  regionList.innerHTML = "";

  countryRegions.forEach((region) => {
    const regionButton = document.createElement("button");
    regionButton.className = "category-button region-button";
    regionButton.type = "button";
    regionButton.dataset.regionId = region.id;
    regionButton.setAttribute("aria-pressed", "false");
    regionButton.textContent = region.label;
    regionButton.addEventListener("click", () => {
      toggleRegion(region.id);
    });

    regionList.append(regionButton);
  });
}

function renderCategories() {
  const categoryList = document.querySelector("#categoryList");

  if (!categoryList) {
    return;
  }

  categoryList.innerHTML = "";

  countryCategories.forEach((category) => {
    const categoryButton = document.createElement("button");
    categoryButton.className = "category-button";
    categoryButton.type = "button";
    categoryButton.dataset.categoryId = category.id;
    categoryButton.setAttribute("aria-pressed", "false");
    categoryButton.textContent = category.label;
    categoryButton.addEventListener("click", () => {
      toggleCategory(category.id);
    });

    categoryList.append(categoryButton);
  });
}

function toggleCategory(categoryId) {
  const searchInput = document.querySelector("#countrySearchInput");

  if (searchInput?.value.trim()) {
    activeCategoryId = null;
    activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    renderCountryResults(searchInput.value, getSelectedCountry(activeCountryCode));
    return;
  }

  activeRegionId = null;
  activeCategoryId = activeCategoryId === categoryId ? null : categoryId;
  updateRegionButtons();
  updateCategoryButtons();

  if (!activeCategoryId) {
    hideCountryResults();
    return;
  }

  renderCategoryCountries(activeCategoryId, getSelectedCountry(activeCountryCode));
}

function toggleRegion(regionId) {
  const searchInput = document.querySelector("#countrySearchInput");

  if (searchInput?.value.trim()) {
    activeRegionId = null;
    activeCategoryId = null;
    updateRegionButtons();
    updateCategoryButtons();
    renderCountryResults(searchInput.value, getSelectedCountry(activeCountryCode));
    return;
  }

  activeCategoryId = null;
  activeRegionId = activeRegionId === regionId ? null : regionId;
  updateRegionButtons();
  updateCategoryButtons();

  if (!activeRegionId) {
    hideCountryResults();
    return;
  }

  renderRegionCountries(activeRegionId, getSelectedCountry(activeCountryCode));
}

function updateRegionButtons() {
  document.querySelectorAll(".region-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.regionId === activeRegionId));
  });
}

function updateCategoryButtons() {
  document.querySelectorAll(".category-button").forEach((button) => {
    if (button.dataset.categoryId) {
      button.setAttribute("aria-pressed", String(button.dataset.categoryId === activeCategoryId));
    }
  });
}

function updateCountrySelectionUi(selectedCountry) {
  const searchInput = document.querySelector("#countrySearchInput");

  if (searchInput) {
    searchInput.value = "";
  }

  if (selectedCountry) {
    updateCountryDataHeading(selectedCountry);
  }

  activeCategoryId = null;
  activeRegionId = null;
  updateRegionButtons();
  updateCategoryButtons();
  closeCountryFilterPanels();
  hideCountryResults();
}

function closeCountryFilterPanels() {
  document.querySelectorAll(".category-panel").forEach((panel) => {
    if (panel instanceof HTMLDetailsElement) {
      panel.open = false;
    }
  });
}

function renderCountryResults(query, selectedCountry) {
  const resultsElement = document.querySelector("#countrySearchResults");
  const searchInput = document.querySelector("#countrySearchInput");

  if (!resultsElement) {
    return;
  }

  const normalizedQuery = query.trim();
  resultsElement.innerHTML = "";

  if (!normalizedQuery) {
    if (activeRegionId) {
      renderRegionCountries(activeRegionId, selectedCountry);
    } else if (activeCategoryId) {
      renderCategoryCountries(activeCategoryId, selectedCountry);
    } else {
      hideCountryResults();
    }
    return;
  }

  activeCategoryId = null;
  activeRegionId = null;
  updateRegionButtons();
  updateCategoryButtons();
  resultsElement.hidden = false;
  resultsElement.dataset.mode = "search";
  searchInput?.setAttribute("aria-expanded", "true");

  const matchingCountries = filterCountries(normalizedQuery);
  renderCountryList(matchingCountries, selectedCountry, "No matching countries.");
}

function renderCategoryCountries(categoryId, selectedCountry) {
  const matchingCountries = sortCountriesByName(
    countries.filter((country) => country.categories?.includes(categoryId)),
  );
  setCountryResultsMode("category");
  renderCountryList(matchingCountries, selectedCountry, "No countries in this category.");
}

function renderRegionCountries(regionId, selectedCountry) {
  const matchingCountries = sortCountriesByName(
    countries.filter((country) => countryBelongsToRegion(country, regionId)),
  );
  setCountryResultsMode("region");
  renderCountryList(matchingCountries, selectedCountry, "No countries in this region.");
}

function countryBelongsToRegion(country, regionId) {
  return country.region
    .split("/")
    .map((region) => region.trim())
    .includes(regionId);
}

function setCountryResultsMode(mode) {
  const resultsElement = document.querySelector("#countrySearchResults");

  if (resultsElement) {
    resultsElement.dataset.mode = mode;
    placeCountryResultsElement(mode, resultsElement);
  }
}

function placeCountryResultsElement(mode, resultsElement) {
  const searchPanel = document.querySelector(".country-search-panel");

  if (!searchPanel) {
    return;
  }

  if (mode === "region") {
    const regionPanel = document.querySelector("#region-heading")?.closest(".category-panel");
    if (regionPanel) {
      regionPanel.after(resultsElement);
      return;
    }
  }

  searchPanel.append(resultsElement);
}

function sortCountriesByName(countryList) {
  return [...countryList].sort((countryA, countryB) => {
    return countryA.name.localeCompare(countryB.name, "en", { sensitivity: "base" });
  });
}

function renderCountryList(matchingCountries, selectedCountry, emptyMessage) {
  const resultsElement = document.querySelector("#countrySearchResults");
  const searchInput = document.querySelector("#countrySearchInput");

  if (!resultsElement) {
    return;
  }

  resultsElement.innerHTML = "";
  resultsElement.hidden = false;
  searchInput?.setAttribute("aria-expanded", "true");
  currentCountryMatches = matchingCountries;
  highlightedCountryIndex = matchingCountries.length > 0 ? 0 : -1;

  if (matchingCountries.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "country-result-empty";
    emptyElement.textContent = emptyMessage;
    resultsElement.append(emptyElement);
    return;
  }

  matchingCountries.forEach((country, index) => {
    const resultButton = document.createElement("button");
    resultButton.className = "country-result";
    resultButton.type = "button";
    resultButton.setAttribute("role", "option");
    resultButton.dataset.countryCode = country.code;
    resultButton.dataset.countrySlug = country.slug;
    resultButton.id = `country-result-${country.code}`;
    resultButton.setAttribute("aria-selected", String(index === highlightedCountryIndex));
    resultButton.dataset.isActiveCountry = String(country.code === selectedCountry?.code);
    resultButton.addEventListener("click", () => {
      chooseCountry(country);
    });

    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = country.name;

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = `${country.region} - ${country.code}`;

    resultButton.append(nameElement, metaElement);
    resultsElement.append(resultButton);
  });

  syncHighlightedCountry();
}

function handleCountrySearchKeydown(event) {
  const resultsElement = document.querySelector("#countrySearchResults");
  const hasOpenResults = resultsElement && !resultsElement.hidden && currentCountryMatches.length > 0;

  if (event.key === "Escape") {
    activeCategoryId = null;
    activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    hideCountryResults();
    return;
  }

  if (!hasOpenResults) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    highlightedCountryIndex = Math.min(highlightedCountryIndex + 1, currentCountryMatches.length - 1);
    syncHighlightedCountry();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    highlightedCountryIndex = Math.max(highlightedCountryIndex - 1, 0);
    syncHighlightedCountry();
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const country = currentCountryMatches[highlightedCountryIndex] ?? currentCountryMatches[0];

    if (country) {
      chooseCountry(country);
    }
  }
}

function syncHighlightedCountry() {
  const searchInput = document.querySelector("#countrySearchInput");
  const resultButtons = Array.from(document.querySelectorAll("#countrySearchResults .country-result"));

  resultButtons.forEach((button, index) => {
    const isHighlighted = index === highlightedCountryIndex;
    button.classList.toggle("is-highlighted", isHighlighted);
    button.setAttribute("aria-selected", String(isHighlighted));

    if (isHighlighted) {
      button.scrollIntoView({ block: "nearest" });
    }
  });

  const highlightedButton = resultButtons[highlightedCountryIndex];

  if (searchInput && highlightedButton) {
    searchInput.setAttribute("aria-activedescendant", highlightedButton.id);
  } else if (searchInput) {
    searchInput.removeAttribute("aria-activedescendant");
  }
}

function chooseCountry(country) {
  if (country.code !== activeCountryCode) {
    selectCountry(country.code).catch((error) => {
      console.error("[App] Failed to switch country.", {
        country,
        error,
      });
    });
  } else {
    updateCountrySelectionUi(country);
  }

  activeCategoryId = null;
  activeRegionId = null;
  updateRegionButtons();
  updateCategoryButtons();
  hideCountryResults();
}

function filterCountries(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return countries.filter((country) => {
    return [country.name, country.code].some((value) => {
      return value.toLowerCase().includes(normalizedQuery);
    });
  });
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
    return country.code !== activeCountryCode;
  });

  results.hidden = false;
  input?.setAttribute("aria-expanded", "true");
  state.comparisonMatches = matchingCountries;
  state.highlightedComparisonIndex = matchingCountries.length > 0 ? 0 : -1;

  if (matchingCountries.length === 0) {
    const emptyElement = document.createElement("div");
    emptyElement.className = "country-result-empty";
    emptyElement.textContent = "No matching comparison countries.";
    results.append(emptyElement);
    return;
  }

  matchingCountries.forEach((country, index) => {
    const resultButton = document.createElement("button");
    resultButton.className = "country-result";
    resultButton.type = "button";
    resultButton.setAttribute("role", "option");
    resultButton.dataset.countryCode = country.code;
    resultButton.id = `${seriesId}-compare-result-${country.code}`;
    resultButton.setAttribute("aria-selected", String(index === state.highlightedComparisonIndex));
    resultButton.addEventListener("click", () => {
      chooseComparisonCountry(seriesId, country);
    });

    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = country.name;

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = `${country.region} - ${country.code}`;

    resultButton.append(nameElement, metaElement);
    results.append(resultButton);
  });

  syncHighlightedComparison(seriesId);
}

function handleCompareSearchKeydown(event, seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { results } = getCompareElements(seriesId);

  if (!state?.hasMainData) {
    return;
  }

  const hasOpenResults = state && results && !results.hidden && state.comparisonMatches.length > 0;

  if (event.key === "Escape") {
    hideCompareResults(seriesId);
    return;
  }

  if (!hasOpenResults) {
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.highlightedComparisonIndex = Math.min(
      state.highlightedComparisonIndex + 1,
      state.comparisonMatches.length - 1,
    );
    syncHighlightedComparison(seriesId);
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.highlightedComparisonIndex = Math.max(state.highlightedComparisonIndex - 1, 0);
    syncHighlightedComparison(seriesId);
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    const country = state.comparisonMatches[state.highlightedComparisonIndex] ?? state.comparisonMatches[0];

    if (country) {
      chooseComparisonCountry(seriesId, country);
    }
  }
}

function syncHighlightedComparison(seriesId) {
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

function chooseComparisonCountry(seriesId, country) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.hasMainData) {
    hideCompareResults(seriesId);
    return;
  }

  if (country.code === activeCountryCode) {
    hideCompareResults(seriesId);
    return;
  }

  state.comparisonCountry = country;
  state.comparisonPoints = null;
  state.comparisonRequestId += 1;
  updateCompareSelectionUi(seriesId, "loading");
  hideCompareResults(seriesId);
  loadAndRenderComparison(seriesId).catch((error) => {
    console.error("[App] Failed to load comparison country.", {
      seriesId,
      country,
      error,
    });
  });
}

function clearComparison(seriesId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state) {
    return;
  }

  state.comparisonCountry = null;
  state.comparisonPoints = null;
  state.comparisonRequestId += 1;
  hideCompareResults(seriesId);
  updateCompareSelectionUi(seriesId);
  renderCurrentSeriesChart(seriesId);
}

function hideCompareResults(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, results } = getCompareElements(seriesId);

  if (!results) {
    return;
  }

  results.hidden = true;
  results.innerHTML = "";

  if (state) {
    state.comparisonMatches = [];
    state.highlightedComparisonIndex = -1;
  }

  if (input) {
    input.value = "";
    input.removeAttribute("aria-activedescendant");
    input.setAttribute("aria-expanded", "false");
  }
}

function updateCompareSelectionUi(seriesId, stateName = "ready") {
  const state = seriesRuntimeState.get(seriesId);
  const { selected, removeButton } = getCompareElements(seriesId);

  if (!state || !selected) {
    return;
  }

  if (!state.comparisonCountry) {
    selected.textContent = "";
    selected.classList.remove("is-error");

    if (removeButton) {
      removeButton.hidden = true;
    }

    return;
  }

  if (stateName === "loading") {
    selected.textContent = `Comparing with ${state.comparisonCountry.name}...`;
    selected.classList.remove("is-error");
  } else if (stateName === "error") {
    selected.textContent = `Failed to load ${state.comparisonCountry.name}.`;
    selected.classList.add("is-error");
  } else if (stateName === "no-data") {
    selected.textContent = `No data for ${state.comparisonCountry.name}.`;
    selected.classList.add("is-error");
  } else {
    selected.textContent = `Comparing with ${state.comparisonCountry.name}`;
    selected.classList.remove("is-error");
  }

  if (removeButton) {
    removeButton.hidden = false;
  }
}

function updateCompareAvailability(seriesId) {
  const state = seriesRuntimeState.get(seriesId);
  const { input, removeButton } = getCompareElements(seriesId);
  const isDisabled = !state?.hasMainData;

  if (input) {
    input.disabled = isDisabled;
    input.setAttribute("aria-disabled", String(isDisabled));
  }

  if (isDisabled) {
    hideCompareResults(seriesId);
    if (removeButton) {
      removeButton.hidden = true;
    }
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

function hideCountryResults() {
  const resultsElement = document.querySelector("#countrySearchResults");

  if (!resultsElement) {
    return;
  }

  resultsElement.hidden = true;
  resultsElement.innerHTML = "";
  resultsElement.removeAttribute("data-mode");
  currentCountryMatches = [];
  highlightedCountryIndex = -1;

  const searchInput = document.querySelector("#countrySearchInput");

  if (searchInput) {
    searchInput.removeAttribute("aria-activedescendant");
    searchInput.setAttribute("aria-expanded", "false");
  }
}

function updateSeriesHeadings(countrySeriesConfigs) {
  countrySeriesConfigs.forEach((seriesConfig) => {
    const titleElement = document.querySelector(`#${seriesConfig.id}-title`);
    const subtitleElement = document.querySelector(`#${seriesConfig.id}-subtitle`);

    if (titleElement) {
      titleElement.textContent = seriesConfig.chartTitle;
    }

    if (subtitleElement) {
      subtitleElement.textContent = seriesConfig.subtitle;
    }

    const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

    if (canvas) {
      canvas.setAttribute("aria-label", `${seriesConfig.chartTitle} line chart`);
    }
  });
}

async function loadAndRenderSeries(seriesConfig, requestId) {
  const statusElement = document.querySelector(`#${seriesConfig.statusId}`);
  const chartCard = document.querySelector(`#${seriesConfig.chartCardId}`);
  const overlayElement = document.querySelector(`#${seriesConfig.overlayId}`);
  const canvas = document.querySelector(`#${seriesConfig.canvasId}`);

  try {
    showLoadingState({
      statusElement,
      chartCard,
      overlayElement,
      countryName: seriesConfig.countryName,
    });
    clearDataTable(seriesConfig);

    const requestUrls = buildImfRequestUrls(seriesConfig);
    console.info(`[App] ${seriesConfig.indicatorCode} static data file:`, requestUrls.appUrl);
    console.info(`[App] ${seriesConfig.indicatorCode} source IMF URL for data updates:`, requestUrls.remoteUrl);

    const { data, url } = await fetchImfSeries(seriesConfig);
    const points = transformImfSeries(data, seriesConfig);

    if (requestId !== renderRequestId) {
      console.info("[App] Ignored stale static data response.", {
        indicatorCode: seriesConfig.indicatorCode,
        countryCode: seriesConfig.countryCode,
      });
      return;
    }

    const state = seriesRuntimeState.get(seriesConfig.id);

    if (state) {
      state.mainConfig = seriesConfig;
      state.mainPoints = points;
      state.comparisonPoints = null;
      state.hasMainData = points.length > 0;
    }

    if (points.length === 0) {
      updateCompareAvailability(seriesConfig.id);
      clearLineChart(canvas);
      renderNoDataTable(seriesConfig);
      hideStatus(statusElement);
      showNoDataState({
        chartCard,
        overlayElement,
        countryName: seriesConfig.countryName,
      });

      console.info(`[App] No ${seriesConfig.indicatorCode} data points were found in the static data file.`, {
        url,
        countryCode: seriesConfig.countryCode,
      });
      return;
    }

    updateCompareAvailability(seriesConfig.id);
    warnIfExpectedEndYearIsMissing(points, seriesConfig);

    renderCurrentSeriesChart(seriesConfig.id);
    renderDataTable(points, seriesConfig);

    console.info(`[App] Loaded ${points.length} ${seriesConfig.indicatorCode} data points from static data.`, {
      url,
    });
    hideStatus(statusElement);
    hideChartOverlay(chartCard, overlayElement);

    if (state?.comparisonCountry) {
      loadAndRenderComparison(seriesConfig.id).catch((error) => {
        console.error("[App] Failed to refresh comparison country.", {
          seriesId: seriesConfig.id,
          comparisonCountry: state.comparisonCountry,
          error,
        });
      });
    }
  } catch (error) {
    if (requestId !== renderRequestId) {
      console.info("[App] Ignored stale static data error.", {
        indicatorCode: seriesConfig.indicatorCode,
        countryCode: seriesConfig.countryCode,
        error,
      });
      return;
    }

    showErrorState({
      statusElement,
      chartCard,
      overlayElement,
      countryName: seriesConfig.countryName,
    });
    console.error(`[App] Failed to load ${seriesConfig.indicatorCode}.`, {
      seriesConfig,
      error,
    });
  }
}

async function loadAndRenderComparison(seriesId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.mainConfig || !state.comparisonCountry) {
    return;
  }

  const comparisonRequestId = state.comparisonRequestId;
  const comparisonCountry = state.comparisonCountry;
  const comparisonConfig = {
    ...state.mainConfig,
    countryCode: comparisonCountry.code,
    countryName: comparisonCountry.name,
  };

  updateCompareSelectionUi(seriesId, "loading");

  try {
    const requestUrls = buildImfRequestUrls(comparisonConfig);
    console.info(`[App] ${comparisonConfig.indicatorCode} comparison static data file:`, requestUrls.appUrl);
    console.info(
      `[App] ${comparisonConfig.indicatorCode} comparison source IMF URL for data updates:`,
      requestUrls.remoteUrl,
    );

    const { data, url } = await fetchImfSeries(comparisonConfig);
    const points = transformImfSeries(data, comparisonConfig);

    if (
      comparisonRequestId !== state.comparisonRequestId ||
      comparisonCountry.code !== state.comparisonCountry?.code ||
      activeCountryCode !== state.mainConfig.countryCode
    ) {
      console.info("[App] Ignored stale comparison static data response.", {
        indicatorCode: comparisonConfig.indicatorCode,
        comparisonCountryCode: comparisonConfig.countryCode,
      });
      return;
    }

    if (points.length === 0) {
      state.comparisonPoints = null;
      renderCurrentSeriesChart(seriesId);
      updateCompareSelectionUi(seriesId, "no-data");
      console.info("[App] No comparison data points were found in the static data file.", {
        url,
        seriesId,
        countryCode: comparisonConfig.countryCode,
      });
      return;
    }

    warnIfExpectedEndYearIsMissing(points, comparisonConfig);
    state.comparisonPoints = points;
    renderCurrentSeriesChart(seriesId);
    updateCompareSelectionUi(seriesId);

    console.info(`[App] Loaded ${points.length} comparison data points from static data.`, {
      url,
      seriesId,
      countryCode: comparisonConfig.countryCode,
    });
  } catch (error) {
    if (comparisonRequestId !== state.comparisonRequestId) {
      console.info("[App] Ignored stale comparison static data error.", {
        seriesId,
        comparisonCountryCode: comparisonCountry.code,
        error,
      });
      return;
    }

    state.comparisonPoints = null;
    updateCompareSelectionUi(seriesId, "error");
    renderCurrentSeriesChart(seriesId);
    console.error("[App] Failed to load comparison series.", {
      comparisonConfig,
      error,
    });
  }
}

function renderCurrentSeriesChart(seriesId) {
  const state = seriesRuntimeState.get(seriesId);

  if (!state?.mainConfig || state.mainPoints.length === 0) {
    return;
  }

  const canvas = document.querySelector(`#${state.mainConfig.canvasId}`);
  const comparison =
    state.comparisonCountry && state.comparisonPoints?.length
      ? {
          countryName: state.comparisonCountry.name,
          points: state.comparisonPoints,
        }
      : null;

  renderLineChart(canvas, {
    points: state.mainPoints,
    config: state.mainConfig,
    comparison,
  });
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
  const valueHeading = getDataTableValueHeading(seriesConfig);
  const sortedPoints = [...points].sort((pointA, pointB) => pointA.year - pointB.year);

  tableWrap.innerHTML = "";

  const table = document.createElement("table");
  table.className = "data-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  appendDataTableHeaders(headerRow, valueHeading);
  appendDataTableHeaders(headerRow, valueHeading);
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
  noDataElement.textContent = "No data";
  tableWrap.append(noDataElement);
}

function appendDataTableHeaders(row, valueHeading) {
  const yearHeader = document.createElement("th");
  yearHeader.scope = "col";
  yearHeader.textContent = "Year";
  const valueHeader = document.createElement("th");
  valueHeader.scope = "col";
  valueHeader.textContent = valueHeading;
  row.append(yearHeader, valueHeader);
}

function appendDataTablePointCells(row, point, displayScale) {
  const yearCell = document.createElement("td");
  const valueCell = document.createElement("td");

  if (point) {
    yearCell.textContent = String(point.year);
    valueCell.textContent = formatDisplayValue(point.value, displayScale);
  }

  row.append(yearCell, valueCell);
}

function getDataTableValueHeading(seriesConfig) {
  if (seriesConfig.id === "gdp") {
    return "GDP";
  }

  if (seriesConfig.id === "gdpPerCapita") {
    return "GDP per capita";
  }

  return "Value";
}

function showLoadingState({ statusElement, chartCard, overlayElement, countryName }) {
  hideStatus(statusElement);
  showChartOverlay({
    chartCard,
    overlayElement,
    message: `Loading ${countryName} data...`,
    state: "loading",
  });
}

function showErrorState({ statusElement, chartCard, overlayElement, countryName }) {
  const message = `Failed to load ${countryName} data.`;
  hideStatus(statusElement);
  showChartOverlay({
    chartCard,
    overlayElement,
    message,
    state: "error",
  });
}

function showNoDataState({ chartCard, overlayElement, countryName }) {
  showChartOverlay({
    chartCard,
    overlayElement,
    message: `No data available for ${countryName}.`,
    state: "no-data",
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

function warnIfExpectedEndYearIsMissing(points, seriesConfig) {
  const latestYear = points.at(-1)?.year;

  if (latestYear !== seriesConfig.endYear) {
    console.warn(`[App] ${seriesConfig.indicatorCode} did not include the requested end year.`, {
      requestedEndYear: seriesConfig.endYear,
      latestAvailableYear: latestYear,
      displayedPointCount: points.length,
    });
  }
}

function hideStatus(statusElement) {
  if (!statusElement) {
    return;
  }

  statusElement.hidden = true;
  statusElement.textContent = "";
  statusElement.classList.remove("is-loading", "is-ready", "is-error");
}

function showStatus(statusElement, message, state) {
  if (!statusElement) {
    return;
  }

  statusElement.hidden = false;
  statusElement.textContent = message;
  statusElement.classList.toggle("is-loading", state === "loading");
  statusElement.classList.toggle("is-ready", state === "ready");
  statusElement.classList.toggle("is-error", state === "error");
}
