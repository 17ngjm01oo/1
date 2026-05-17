import { initializeCountrySelector } from "./countrySelector.js";

initializeHomePage();

function initializeHomePage() {
  document.title = "Nominal GDP and Nominal GDP per capita";

  initializeCountrySelector({
    onSelect(country) {
      window.location.href = `./countries/${country.slug}/gdp/`;
    },
  });
}
