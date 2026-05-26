import { renderTopNavigationLinks } from "./siteNavigation.js";

const rootHref = document.body.dataset.rootHref ?? "../../";

renderTopNavigationLinks({
  rootHref,
  currentRankingDirectory: document.body.dataset.rankingDirectory ?? "",
  currentScopeSlug: document.body.dataset.rankingScopeSlug ?? "world",
});

initializeRankingsHubCategoryFilter();

function initializeRankingsHubCategoryFilter() {
  const buttons = Array.from(document.querySelectorAll("[data-rankings-hub-category]"));
  const groups = Array.from(document.querySelectorAll("[data-rankings-hub-group]"));
  if (buttons.length === 0 || groups.length === 0) {
    return;
  }

  updateRankingsHubCategoryFilter(buttons, groups, "");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const categoryId = button.getAttribute("aria-pressed") === "true"
        ? ""
        : button.dataset.rankingsHubCategory ?? "";
      updateRankingsHubCategoryFilter(buttons, groups, categoryId);
    });
  });
}

function updateRankingsHubCategoryFilter(buttons, groups, categoryId) {
  buttons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.rankingsHubCategory === categoryId),
    );
  });

  groups.forEach((group) => {
    group.hidden = Boolean(categoryId) && group.dataset.rankingsHubGroup !== categoryId;
  });
}
