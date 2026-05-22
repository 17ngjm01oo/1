import { initializeCountrySelector } from "./countrySelector.js";

initializeHomePage();

function initializeHomePage() {
  document.title = "Home";

  initializeCountrySelector({
    onSelect(country) {
      window.location.href = `./countries/${country.slug}/`;
    },
  });
}
