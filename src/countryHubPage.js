import { countries } from "./countries.js";
import { initializeCountrySelector } from "./countrySelector.js";
import { getFlagEmoji } from "./flags.js";
import "./rankingTopNav.js";

const rootHref = document.body.dataset.rootHref ?? "../";
const profileCountries = countries.filter((country) => country.slug);

initializeCountrySelector({
  countryPool: profileCountries,
  showAllCountries: true,
  inlineSearchResults: true,
  highlightFirstResult: false,
  sortCountryResults(countryList) {
    return [...countryList].sort((countryA, countryB) => {
      if (countryA.code === "G001") {
        return -1;
      }

      if (countryB.code === "G001") {
        return 1;
      }

      return countryA.name.localeCompare(countryB.name, "en", { sensitivity: "base" });
    });
  },
  getCountryHref(country) {
    return `${rootHref}countries/${country.slug}/`;
  },
  renderCountryResultContent(country) {
    const flag = document.createElement("span");
    flag.className = "country-hub-result-flag";
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
