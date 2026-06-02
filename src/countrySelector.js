import { countries } from "./countries.js";

const countrySearchPlaceholder = "Search a country or territory...";

export function initializeCountrySelector({
  selectedCountry = null,
  onSelect,
  countryPool = countries,
  getCountryHref = null,
  highlightFirstResult = true,
  searchInputSelector = "#countrySearchInput",
  resultsSelector = "#countrySearchResults",
} = {}) {
  const searchInput = document.querySelector(searchInputSelector);
  const resultsElement = document.querySelector(resultsSelector);
  const state = {
    selectedCountry,
    currentMatches: [],
    highlightedIndex: -1,
  };

  if (!searchInput || !resultsElement) {
    return {
      setSelectedCountry(country) {
        state.selectedCountry = country;
      },
      close() {},
    };
  }

  searchInput.placeholder = countrySearchPlaceholder;

  searchInput.addEventListener("input", () => {
    renderCountryResults(searchInput.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    handleCountrySearchKeydown(event);
  });

  searchInput.addEventListener("focus", () => {
    if (searchInput.value.trim()) {
      renderCountryResults(searchInput.value);
    }
  });

  function renderCountryResults(query) {
    const normalizedQuery = query.trim();
    resultsElement.innerHTML = "";

    if (!normalizedQuery) {
      hideCountryResults();
      return;
    }

    resultsElement.dataset.mode = "search";
    renderCountryList(filterCountryList(countryPool, normalizedQuery), "No matches found.");
  }

  function renderCountryList(matchingCountries, emptyMessage) {
    resultsElement.innerHTML = "";
    resultsElement.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
    state.currentMatches = matchingCountries;
    state.highlightedIndex = highlightFirstResult && matchingCountries.length > 0 ? 0 : -1;

    if (matchingCountries.length === 0) {
      searchInput.removeAttribute("aria-activedescendant");
      const emptyElement = document.createElement("div");
      emptyElement.className = "country-result-empty";
      emptyElement.textContent = emptyMessage;
      resultsElement.append(emptyElement);
      return;
    }

    matchingCountries.forEach((country, index) => {
      const resultElement = getCountryHref ? document.createElement("a") : document.createElement("button");
      resultElement.className = "country-result";
      if (getCountryHref) {
        resultElement.href = getCountryHref(country);
      } else {
        resultElement.type = "button";
      }
      resultElement.dataset.countryCode = country.code;
      resultElement.setAttribute("role", "option");
      resultElement.id = `country-result-${country.code}`;
      resultElement.setAttribute("aria-selected", String(index === state.highlightedIndex));
      resultElement.dataset.isActiveCountry = String(country.code === state.selectedCountry?.code);
      resultElement.addEventListener("click", (event) => {
        if (getCountryHref && !onSelect) {
          return;
        }

        event.preventDefault();
        selectCountry(country);
      });

      resultElement.append(...createDefaultCountryResultContent(country));
      resultsElement.append(resultElement);
    });

    syncHighlightedCountry();
  }

  function createDefaultCountryResultContent(country) {
    const nameElement = document.createElement("span");
    nameElement.className = "country-result-name";
    nameElement.textContent = country.name;

    const metaElement = document.createElement("span");
    metaElement.className = "country-result-meta";
    metaElement.textContent = formatCountryMetaText(country);

    return [nameElement, metaElement];
  }

  function handleCountrySearchKeydown(event) {
    const hasOpenResults = !resultsElement.hidden && state.currentMatches.length > 0;

    if (event.key === "Escape") {
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
    hideCountryResults();

    if (onSelect) {
      onSelect(country);
    } else if (getCountryHref) {
      window.location.href = getCountryHref(country);
    }
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
    state.currentMatches = [];
    state.highlightedIndex = -1;
    searchInput.removeAttribute("aria-activedescendant");
    searchInput.setAttribute("aria-expanded", "false");
  }

  return {
    setSelectedCountry(country) {
      state.selectedCountry = country;
    },
    close() {
      hideCountryResults();
    },
  };
}

export function filterCountries(query) {
  return filterCountryList(countries, query);
}

export function filterCountryList(countryList, query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const queryVariants = getSearchVariants(normalizedQuery);

  return countryList.filter((country) => {
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
