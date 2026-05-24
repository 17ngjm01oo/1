import { countries } from "./countries.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { getFlagEmoji } from "./flags.js";
import { renderWorldMap } from "./worldMap.js";
import "./rankingTopNav.js";

const rootHref = document.body.dataset.rootHref ?? "../";
const profileCountries = countries.filter((country) => country.slug);
const hubCountries = profileCountries.filter((country) => country.code !== "G001");
const countElement = document.querySelector("#countryHubCount");

const worldMap = await renderWorldMap({
  dataUrl: `${rootHref}data/geo/countries-110m.json`,
  countryList: hubCountries,
  rootHref,
});

initializeCountrySelector({
  countryPool: hubCountries,
  showAllCountries: true,
  inlineSearchResults: true,
  highlightFirstResult: false,
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
      countElement.textContent = `Countries shown: ${rowCount}`;
    }

    worldMap?.focusRegion(activeRegionId);
  },
  renderCountryResultContent(country, { activateRegion }) {
    const flag = document.createElement("span");
    flag.className = "country-hub-result-flag";
    flag.textContent = getFlagEmoji(country.code);

    const name = document.createElement("span");
    name.className = "country-hub-result-name";
    name.textContent = country.name;

    const region = document.createElement("span");
    region.className = "country-hub-result-region";
    region.textContent = country.region || "-";
    const regionId = country.region?.trim();

    if (regionId) {
      region.setAttribute("role", "button");
      region.setAttribute("tabindex", "0");
      region.setAttribute("aria-label", `Show ${regionId} countries`);
      region.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        activateRegion(regionId);
      });
      region.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        activateRegion(regionId);
      });
    }

    return [flag, name, region];
  },
});
