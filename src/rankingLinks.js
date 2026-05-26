export function renderRankingLinks(
  nav,
  rankings,
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

  rankings.forEach((ranking) => {
    const link = document.createElement("a");
    link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = ranking.label;

    if (highlightCurrent && isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory })) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}

function isCurrentRankingLink(ranking, { currentPageKind, currentRankingDirectory }) {
  if (ranking.directory === currentRankingDirectory) {
    return true;
  }

  if (!currentPageKind) {
    return false;
  }

  return ranking.countryPageKind === currentPageKind;
}

export function getCountryIndicatorLinks(rankings) {
  return rankings
    .filter((ranking) => ranking.countryPageKind)
    .map((ranking) => ({
      pageKind: ranking.countryPageKind,
      href: `../${ranking.countryPageKind}/`,
      label: ranking.label,
    }));
}
