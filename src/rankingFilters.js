import { countryCategories, countryRegions } from "./countries.js";

const worldScope = { type: "world", id: "WORLD", label: "World" };

export function initializeRankingFilters({ onScopeChange }) {
  const regionList = document.querySelector("#rankingRegionList");
  const categoryList = document.querySelector("#rankingCategoryList");
  const regionPanel = document.querySelector("#ranking-region-heading")?.closest(".category-panel");
  const categoryPanel = document.querySelector("#ranking-category-heading")?.closest(".category-panel");

  if (!regionList || !categoryList) {
    return worldScope;
  }

  let activeScope = worldScope;

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
    document.querySelectorAll("[data-ranking-scope-type]").forEach((button) => {
      const isActive =
        button.dataset.rankingScopeType === activeScope.type &&
        button.dataset.rankingScopeId === activeScope.id;
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const selectScope = (scope) => {
    activeScope = scope;
    updateButtons();
    onScopeChange(activeScope);
    closeFilterPanels();
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

  regionList.append(createScopeButton({
    scope: worldScope,
    onSelect: selectScope,
  }));

  countryRegions.forEach((region) => {
    regionList.append(createScopeButton({
      scope: { type: "region", id: region.id, label: region.label },
      onSelect: selectScope,
    }));
  });

  countryCategories.forEach((category) => {
    categoryList.append(createScopeButton({
      scope: { type: "category", id: category.id, label: category.label },
      onSelect: selectScope,
    }));
  });

  updateButtons();
  return activeScope;
}

function createScopeButton({ scope, onSelect }) {
  const button = document.createElement("button");
  button.className = "category-button";
  button.type = "button";
  button.dataset.rankingScopeType = scope.type;
  button.dataset.rankingScopeId = scope.id;
  button.setAttribute("aria-pressed", "false");
  button.textContent = scope.label;
  button.addEventListener("click", () => {
    onSelect(scope);
  });

  return button;
}
