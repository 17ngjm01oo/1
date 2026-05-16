import { countries } from "./countries.js";
import { filterCountriesByScope } from "./countryFilters.js";
import { formatDisplayValue } from "./chart.js";
import { getFlagEmoji } from "./flags.js";
import { initializeRankingFilters } from "./rankingFilters.js";

const gdpPerCapitaDataUrl = new URL("../data/imf/nominal-gdp-per-capita.json", import.meta.url);
const rankingEndYear = 2026;
const rankingTableBody = document.querySelector("#rankingTableBody");
const rankingSummary = document.querySelector("#rankingSummary");
let allRankingRows = [];
let activeScope = null;
const displayScale = {
  valueScale: 1,
  tooltipPrefix: "$",
  tooltipUnit: "",
  maximumFractionDigits: 0,
};

initializeRanking().catch((error) => {
  console.error("[Ranking] Failed to initialize GDP per capita ranking.", error);
  showRankingError();
});

async function initializeRanking() {
  activeScope = initializeRankingFilters({
    onScopeChange(scope) {
      activeScope = scope;
      renderScopedRanking();
    },
  });

  const response = await fetch(gdpPerCapitaDataUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Static GDP per capita data file request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  allRankingRows = buildGdpPerCapitaRanking(data);
  renderScopedRanking();
}

function buildGdpPerCapitaRanking(data) {
  const gdpPerCapitaByCountry = data?.values?.NGDPDPC;

  if (!gdpPerCapitaByCountry || typeof gdpPerCapitaByCountry !== "object") {
    throw new Error("Static GDP per capita data file is missing values.NGDPDPC.");
  }

  return countries
    .filter((country) => country.includeInRankings !== false)
    .map((country) => {
      const latestPoint = getLatestNumericPoint(gdpPerCapitaByCountry[country.code]);

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
    .sort((countryA, countryB) => countryB.value - countryA.value);
}

function renderScopedRanking() {
  const rankingRows = filterRankingRows(allRankingRows, activeScope);
  renderRankingTable(rankingRows);
  updateRankingSummary(rankingRows, activeScope);
}

function filterRankingRows(rankingRows, scope) {
  const rankingCountries = countries.filter((country) => country.includeInRankings !== false);
  const scopedCountryCodes = new Set(filterCountriesByScope(rankingCountries, scope).map((country) => country.code));
  return rankingRows.filter((country) => scopedCountryCodes.has(country.code));
}

function getLatestNumericPoint(series) {
  if (!series || typeof series !== "object" || Array.isArray(series)) {
    return null;
  }

  const points = Object.entries(series)
    .map(([yearKey, value]) => ({
      year: Number.parseInt(yearKey, 10),
      value: normalizeNumericValue(value),
    }))
    .filter(({ year, value }) => {
      return Number.isInteger(year) && year <= rankingEndYear && Number.isFinite(value);
    })
    .sort((pointA, pointB) => pointB.year - pointA.year);

  return points[0] ?? null;
}

function renderRankingTable(rankingRows) {
  if (!rankingTableBody) {
    return;
  }

  rankingTableBody.innerHTML = "";

  if (rankingRows.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "ranking-empty";
    cell.textContent = "No ranking data available.";
    row.append(cell);
    rankingTableBody.append(row);
    return;
  }

  rankingRows.forEach((country, index) => {
    const row = document.createElement("tr");
    const rankCell = document.createElement("td");
    const flagCell = document.createElement("td");
    const countryCell = document.createElement("td");
    const valueCell = document.createElement("td");
    const yearCell = document.createElement("td");

    rankCell.textContent = String(index + 1);
    flagCell.className = "ranking-flag";
    flagCell.textContent = getFlagEmoji(country.code);

    const countryLink = document.createElement("a");
    countryLink.href = `../../?country=${encodeURIComponent(country.code)}`;
    countryLink.textContent = country.name;
    countryCell.append(countryLink);

    valueCell.textContent = formatDisplayValue(country.value, displayScale);
    yearCell.textContent = String(country.year);

    row.append(rankCell, flagCell, countryCell, valueCell, yearCell);
    rankingTableBody.append(row);
  });
}

function updateRankingSummary(rankingRows, scope) {
  if (!rankingSummary) {
    return;
  }

  const scopeLabel = scope?.label ?? "World";
  rankingSummary.textContent =
    `Showing ${rankingRows.length} countries with available GDP per capita data for ${scopeLabel}.`;
}

function showRankingError() {
  if (rankingSummary) {
    rankingSummary.textContent = "Failed to load ranking data.";
    rankingSummary.classList.add("is-error");
  }

  if (rankingTableBody) {
    rankingTableBody.innerHTML = "";
  }
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
