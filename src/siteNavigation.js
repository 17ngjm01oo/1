export function renderCountryHubLink({ rootHref = "./" } = {}) {
  const navCards = document.querySelectorAll(".top-nav-card");

  navCards.forEach((navCard) => {
    if (navCard.querySelector(".country-hub-nav-link")) {
      return;
    }

    const link = document.createElement("a");
    link.className = "country-hub-nav-link";
    link.href = `${rootHref}countries/`;
    link.textContent = "Countries";

    if (isCountryHubPage()) {
      link.setAttribute("aria-current", "page");
    }

    navCard.prepend(link);
  });
}

function isCountryHubPage() {
  return document.body.dataset.pageKind === "country-hub";
}
