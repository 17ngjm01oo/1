import { countries, countryCategories, countryRegions } from "./countries.js";
import { countryBelongsToRegion } from "./countryFilters.js";

export function initializeCountrySelector({
  selectedCountry = null,
  onSelect,
  searchInputSelector = "#countrySearchInput",
  resultsSelector = "#countrySearchResults",
  regionListSelector = "#regionList",
  categoryListSelector = "#categoryList",
  panelSelector = ".category-panel",
  filterPanelRowSelector = ".filter-panel-row",
  searchPanelSelector = ".country-search-panel",
} = {}) {
  const searchInput = document.querySelector(searchInputSelector);
  const resultsElement = document.querySelector(resultsSelector);
  const regionList = document.querySelector(regionListSelector);
  const categoryList = document.querySelector(categoryListSelector);
  const regionPanel = document.querySelector("#region-heading")?.closest(panelSelector);
  const categoryPanel = document.querySelector("#category-heading")?.closest(panelSelector);
  const state = {
    selectedCountry,
    currentMatches: [],
    highlightedIndex: -1,
    activeCategoryId: null,
    activeRegionId: null,
  };

  if (!searchInput || !resultsElement) {
    return {
      setSelectedCountry(country) {
        state.selectedCountry = country;
      },
      close() {},
    };
  }

  searchInput.addEventListener("input", () => {
    state.activeCategoryId = null;
    state.activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    closeFilterPanels();
    renderCountryResults(searchInput.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    handleCountrySearchKeydown(event);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      closeFilterPanels();
      renderCountryResults(searchInput.value);
    }
  });

  regionPanel?.addEventListener("toggle", () => {
    if (regionPanel.open) {
      closeFilterPanels(regionPanel);
      showFilterOptionList("region");
      return;
    }

    hideFilterOptionList("region");

    if (state.activeRegionId) {
      state.activeRegionId = null;
      updateRegionButtons();
      hideCountryResults();
    }
  });

  categoryPanel?.addEventListener("toggle", () => {
    if (categoryPanel.open) {
      closeFilterPanels(categoryPanel);
      showFilterOptionList("category");
      return;
    }

    hideFilterOptionList("category");

    if (state.activeCategoryId) {
      state.activeCategoryId = null;
      updateCategoryButtons();
      hideCountryResults();
    }
  });

  renderRegions();
  renderCategories();

  function renderRegions() {
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

  function toggleRegion(regionId) {
    if (searchInput.value.trim()) {
      state.activeRegionId = null;
      state.activeCategoryId = null;
      updateRegionButtons();
      updateCategoryButtons();
      renderCountryResults(searchInput.value);
      return;
    }

    state.activeCategoryId = null;
    state.activeRegionId = state.activeRegionId === regionId ? null : regionId;
    updateRegionButtons();
    updateCategoryButtons();

    if (!state.activeRegionId) {
      hideCountryResults();
      return;
    }

    renderRegionCountries(state.activeRegionId);
  }

  function toggleCategory(categoryId) {
    if (searchInput.value.trim()) {
      state.activeCategoryId = null;
      state.activeRegionId = null;
      updateRegionButtons();
      updateCategoryButtons();
      renderCountryResults(searchInput.value);
      return;
    }

    state.activeRegionId = null;
    state.activeCategoryId = state.activeCategoryId === categoryId ? null : categoryId;
    updateRegionButtons();
    updateCategoryButtons();

    if (!state.activeCategoryId) {
      hideCountryResults();
      return;
    }

    renderCategoryCountries(state.activeCategoryId);
  }

  function renderCountryResults(query) {
    const normalizedQuery = query.trim();
    resultsElement.innerHTML = "";

    if (!normalizedQuery) {
      if (state.activeRegionId) {
        renderRegionCountries(state.activeRegionId);
      } else if (state.activeCategoryId) {
        renderCategoryCountries(state.activeCategoryId);
      } else {
        hideCountryResults();
      }
      return;
    }

    state.activeCategoryId = null;
    state.activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    setCountryResultsMode("search");
    renderCountryList(filterCountries(normalizedQuery), "No matching countries.");
  }

  function renderRegionCountries(regionId) {
    const matchingCountries = sortCountriesByName(
      countries.filter((country) => countryBelongsToRegion(country, regionId)),
    );
    setCountryResultsMode("region");
    renderCountryList(matchingCountries, "No countries in this region.");
  }

  function renderCategoryCountries(categoryId) {
    const matchingCountries = sortCountriesByName(
      countries.filter((country) => country.categories?.includes(categoryId)),
    );
    setCountryResultsMode("category");
    renderCountryList(matchingCountries, "No countries in this category.");
  }

  function renderCountryList(matchingCountries, emptyMessage) {
    resultsElement.innerHTML = "";
    resultsElement.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    state.currentMatches = matchingCountries;
    state.highlightedIndex = matchingCountries.length > 0 ? 0 : -1;

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
      resultButton.id = `country-result-${country.code}`;
      resultButton.dataset.countryCode = country.code;
      resultButton.setAttribute("aria-selected", String(index === state.highlightedIndex));
      resultButton.dataset.isActiveCountry = String(country.code === state.selectedCountry?.code);
      resultButton.addEventListener("click", () => {
        selectCountry(country);
      });

      const nameElement = document.createElement("span");
      nameElement.className = "country-result-name";
      nameElement.textContent = country.name;

      const metaElement = document.createElement("span");
      metaElement.className = "country-result-meta";
      metaElement.textContent = formatCountryMetaText(country);

      resultButton.append(nameElement, metaElement);
      resultsElement.append(resultButton);
    });

    syncHighlightedCountry();
  }

  function handleCountrySearchKeydown(event) {
    const hasOpenResults = !resultsElement.hidden && state.currentMatches.length > 0;

    if (event.key === "Escape") {
      state.activeCategoryId = null;
      state.activeRegionId = null;
      updateRegionButtons();
      updateCategoryButtons();
      closeFilterPanels();
      hideCountryResults();
      return;
    }

    if (!hasOpenResults) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      state.highlightedIndex = Math.min(state.highlightedIndex + 1, state.currentMatches.length - 1);
      syncHighlightedCountry();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      state.highlightedIndex = Math.max(state.highlightedIndex - 1, 0);
      syncHighlightedCountry();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const country = state.currentMatches[state.highlightedIndex] ?? state.currentMatches[0];

      if (country) {
        selectCountry(country);
      }
    }
  }

  function selectCountry(country) {
    state.selectedCountry = country;
    searchInput.value = "";
    state.activeCategoryId = null;
    state.activeRegionId = null;
    updateRegionButtons();
    updateCategoryButtons();
    closeFilterPanels();
    hideCountryResults();
    onSelect?.(country);
  }

  function syncHighlightedCountry() {
    const resultButtons = Array.from(resultsElement.querySelectorAll(".country-result"));

    resultButtons.forEach((button, index) => {
      const isHighlighted = index === state.highlightedIndex;
      button.classList.toggle("is-highlighted", isHighlighted);
      button.setAttribute("aria-selected", String(isHighlighted));

      if (isHighlighted) {
        button.scrollIntoView({ block: "nearest" });
      }
    });

    const highlightedButton = resultButtons[state.highlightedIndex];

    if (highlightedButton) {
      searchInput.setAttribute("aria-activedescendant", highlightedButton.id);
    } else {
      searchInput.removeAttribute("aria-activedescendant");
    }
  }

  function hideCountryResults() {
    resultsElement.hidden = true;
    resultsElement.innerHTML = "";
    resultsElement.removeAttribute("data-mode");
    placeCountryResultsElement();
    state.currentMatches = [];
    state.highlightedIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    searchInput.setAttribute("aria-expanded", "false");
  }

  function setCountryResultsMode(mode) {
    resultsElement.dataset.mode = mode;
    placeCountryResultsElement(mode);
  }

  function placeCountryResultsElement(mode) {
    const searchPanel = document.querySelector(searchPanelSelector);

    if (!searchPanel) {
      return;
    }

    const searchInputWrap = searchPanel.querySelector(".search-input-wrap");

    if (mode === "search" && searchInputWrap) {
      searchInputWrap.append(resultsElement);
      return;
    }

    if (mode === "region" || mode === "category") {
      const optionList = document.querySelector(mode === "region" ? regionListSelector : categoryListSelector);
      const filterPanelRow = document.querySelector(filterPanelRowSelector);

      if (optionList && !optionList.hidden) {
        optionList.after(resultsElement);
        return;
      }

      if (filterPanelRow) {
        filterPanelRow.after(resultsElement);
        return;
      }
    }

    searchPanel.append(resultsElement);
  }

  function updateRegionButtons() {
    document.querySelectorAll(".region-button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.regionId === state.activeRegionId));
    });
  }

  function updateCategoryButtons() {
    document.querySelectorAll(".category-button").forEach((button) => {
      if (button.dataset.categoryId) {
        button.setAttribute("aria-pressed", String(button.dataset.categoryId === state.activeCategoryId));
      }
    });
  }

  function showFilterOptionList(type) {
    if (regionList) {
      regionList.hidden = type !== "region";
    }

    if (categoryList) {
      categoryList.hidden = type !== "category";
    }
  }

  function hideFilterOptionList(type) {
    const list = document.querySelector(type === "region" ? regionListSelector : categoryListSelector);

    if (list) {
      list.hidden = true;
    }
  }

  function hideFilterOptionLists() {
    hideFilterOptionList("region");
    hideFilterOptionList("category");
  }

  function closeFilterPanels(exceptPanel = null) {
    document.querySelectorAll(panelSelector).forEach((panel) => {
      if (panel instanceof HTMLDetailsElement && panel !== exceptPanel) {
        panel.open = false;
      }
    });

    if (!exceptPanel) {
      hideFilterOptionLists();
    }
  }

  return {
    setSelectedCountry(country) {
      state.selectedCountry = country;
    },
    close() {
      state.activeCategoryId = null;
      state.activeRegionId = null;
      updateRegionButtons();
      updateCategoryButtons();
      closeFilterPanels();
      hideCountryResults();
    },
  };
}

export function filterCountries(query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryVariants = getSearchVariants(normalizedQuery);

  return countries.filter((country) => {
    return getCountrySearchTerms(country).some((term) => {
      return queryVariants.some((queryVariant) => matchesSearchTerm(term, queryVariant));
    });
  });
}

function getCountrySearchTerms(country) {
  const terms = [
    country.name,
    country.officialName,
    country.slug,
    country.code,
    ...(Array.isArray(country.aliases) ? country.aliases : []),
  ];

  return [...new Set(terms.flatMap(getSearchVariants).filter(Boolean))];
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripLeadingThe(value) {
  return value.replace(/^the\s+/, "").trim();
}

function matchesSearchTerm(term, query) {
  const comparisons = [
    [term, query],
    [term, stripLeadingThe(query)],
    [stripLeadingThe(term), query],
    [stripLeadingThe(term), stripLeadingThe(query)],
  ];

  return comparisons.some(([searchTerm, searchQuery]) => {
    if (!searchTerm || !searchQuery) {
      return false;
    }

    const compactTerm = compactSearchText(searchTerm);
    const compactQuery = compactSearchText(searchQuery);
    return searchTerm.includes(searchQuery) || compactTerm.includes(compactQuery);
  });
}

function getSearchVariants(value) {
  const normalizedValue = normalizeSearchText(value);
  const compactValue = compactSearchText(normalizedValue);

  return normalizedValue === compactValue ? [normalizedValue] : [normalizedValue, compactValue];
}

function compactSearchText(value) {
  return value.replace(/\s+/g, "");
}

export function sortCountriesByName(countryList) {
  return [...countryList].sort((countryA, countryB) => {
    return countryA.name.localeCompare(countryB.name, "en", { sensitivity: "base" });
  });
}

export function formatCountryMetaText(country) {
  return country.region ?? "";
}
