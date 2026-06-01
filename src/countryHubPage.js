import { countries } from "./countries.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { appendTerritoryNote } from "./countryTypes.js";
import { getFlagEmoji } from "./flags.js";
import { renderWorldMap } from "./worldMap.js";
import "./rankingTopNav.js";

const rootHref = document.body.dataset.rootHref ?? "../";
const profileCountries = countries.filter((country) => country.slug);
const hubCountries = profileCountries.filter((country) => country.code !== "G001");
const countElement = document.querySelector("#countryHubCount");

const worldMap = await renderWorldMap({
  countryList: hubCountries,
  rootHref,
  defaultZoom: 1.11,
});

initializeCountrySelector({
  countryPool: hubCountries,
  showAllCountries: true,
  resultsPresentation: "table",
  resultsSelector: "#countryTableBody",
  closePanelsOnFilterSelect: true,
  sortCountryResults(countryList) {
    return [...countryList].sort((countryA, countryB) => {
      return countryA.name.localeCompare(countryB.name, "en", { sensitivity: "base" });
    });
  },
  getCountryHref(country) {
    return `${rootHref}countries/${country.slug}/`;
  },
  onResultsChange({ rowCount, activeRegionId }) {
    if (countElement) {
      countElement.textContent = `Showing: ${rowCount}`;
    }

    worldMap?.focusRegion(activeRegionId);
  },
  renderCountryResultContent(country) {
    const flag = document.createElement("span");
    flag.className = "ranking-flag country-hub-result-flag";
    flag.textContent = getFlagEmoji(country.code);

    const name = document.createElement("span");
    name.className = "country-hub-result-name";
    name.textContent = country.name;

    const region = document.createElement("span");
    region.className = "country-hub-result-region";
    region.textContent = country.region || "-";

    return [flag, name, region];
  },
});

appendTerritoryNote(document.querySelector(".hub-section"));
