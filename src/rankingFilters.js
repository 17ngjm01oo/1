import { countryCategories, countryRegions } from "./countries.js";

const worldScope = { type: "world", id: "WORLD", label: "World", slug: "world" };

export function initializeRankingFilters() {
  const regionList = document.querySelector("#rankingRegionList");
  const categoryList = document.querySelector("#rankingCategoryList");
  const regionPanel = document.querySelector("#ranking-region-heading")?.closest(".category-panel");
  const categoryPanel = document.querySelector("#ranking-category-heading")?.closest(".category-panel");

  if (!regionList || !categoryList) {
    return worldScope;
  }

  const activeScope = getScopeFromPage();
  const rankingBaseHref = document.body.dataset.rankingBaseHref ?? "./";

  const showOptionList = (type) => {
    regionList.hidden = type !== "region";
    categoryList.hidden = type !== "category";
  };

  const hideOptionLists = () => {
    regionList.hidden = true;
    categoryList.hidden = true;
  };

  const closeFilterPanels = (exceptPanel = null) => {
    [regionPanel, categoryPanel].forEach((panel) => {
      if (panel instanceof HTMLDetailsElement && panel !== exceptPanel) {
        panel.open = false;
      }
    });

    if (!exceptPanel) {
      hideOptionLists();
    }
  };

  const updateButtons = () => {
    document.querySelectorAll("[data-ranking-scope-type]").forEach((link) => {
      const isActive =
        link.dataset.rankingScopeType === activeScope.type &&
        link.dataset.rankingScopeId === activeScope.id;
      link.setAttribute("aria-pressed", String(isActive));
    });
  };

  regionPanel?.addEventListener("toggle", () => {
    if (regionPanel.open) {
      closeFilterPanels(regionPanel);
      showOptionList("region");
      return;
    }

    regionList.hidden = true;
  });

  categoryPanel?.addEventListener("toggle", () => {
    if (categoryPanel.open) {
      closeFilterPanels(categoryPanel);
      showOptionList("category");
      return;
    }

    categoryList.hidden = true;
  });

  regionList.innerHTML = "";
  categoryList.innerHTML = "";

  regionList.append(createScopeLink({
    scope: worldScope,
    rankingBaseHref,
  }));

  countryRegions.forEach((region) => {
    regionList.append(createScopeLink({
      scope: { type: "region", id: region.id, label: region.label, slug: slugify(region.label) },
      rankingBaseHref,
    }));
  });

  countryCategories.forEach((category) => {
    categoryList.append(createScopeLink({
      scope: { type: "category", id: category.id, label: category.label, slug: slugify(category.label) },
      rankingBaseHref,
    }));
  });

  updateButtons();
  return activeScope;
}

function createScopeLink({ scope, rankingBaseHref }) {
  const link = document.createElement("a");
  link.className = "category-button";
  link.href = `${rankingBaseHref}${scope.slug}/`;
  link.dataset.rankingScopeType = scope.type;
  link.dataset.rankingScopeId = scope.id;
  link.setAttribute("aria-pressed", "false");
  link.textContent = scope.label;

  return link;
}

function getScopeFromPage() {
  const type = document.body.dataset.rankingScopeType;
  const id = document.body.dataset.rankingScopeId;
  const label = document.body.dataset.rankingScopeLabel;
  const slug = document.body.dataset.rankingScopeSlug;

  if (!type || !id || !label || !slug) {
    return worldScope;
  }

  return { type, id, label, slug };
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
