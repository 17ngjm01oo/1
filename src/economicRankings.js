export const economicRankings = [
  {
    directory: "nominal-gdp",
    label: "GDP",
    countryPageKinds: ["gdp"],
  },
  {
    directory: "nominal-gdp-per-capita",
    label: "GDP per Capita",
    countryPageKinds: ["gdp-per-capita"],
  },
  {
    directory: "real-gdp-growth",
    label: "Real GDP Growth",
    countryPageKinds: ["gdp-growth"],
  },
  {
    directory: "inflation-rate",
    label: "Inflation Rate",
    countryPageKinds: ["inflation-rate"],
  },
  {
    directory: "ppp",
    label: "PPP",
    countryPageKinds: ["ppp"],
  },
  {
    directory: "ppp-per-capita",
    label: "PPP per Capita",
    countryPageKinds: ["ppp-per-capita"],
  },
];

export function renderEconomicRankingLinks(
  nav,
  {
    rootHref = "./",
    currentPageKind = "",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  economicRankings.forEach((ranking) => {
    const link = document.createElement("a");
    link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = ranking.label;

    if (
      highlightCurrent &&
      (ranking.countryPageKinds.includes(currentPageKind) || ranking.directory === currentRankingDirectory)
    ) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}
