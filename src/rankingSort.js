const sortOptions = [
  { value: "highest", label: "Highest" },
  { value: "lowest", label: "Lowest" },
];

export function initializeRankingSort({ initialValue = "highest", onChange }) {
  const rankingCardHeader = document.querySelector(".ranking-card-header");

  if (!rankingCardHeader) {
    return initialValue;
  }

  const sortControl = document.createElement("details");
  sortControl.className = "ranking-sort";

  const sortToggle = document.createElement("summary");
  sortToggle.className = "ranking-sort-toggle";
  sortToggle.textContent = "Sort by";
  sortToggle.setAttribute("aria-label", "Choose ranking sort order");

  const sortMenu = document.createElement("div");
  sortMenu.className = "ranking-sort-menu";
  sortMenu.setAttribute("role", "group");
  sortMenu.setAttribute("aria-label", "Ranking sort order");

  sortOptions.forEach((option) => {
    const button = document.createElement("button");
    button.className = "ranking-sort-option";
    button.type = "button";
    button.dataset.rankingSort = option.value;
    button.setAttribute("aria-pressed", String(option.value === initialValue));
    button.textContent = option.label;

    button.addEventListener("click", () => {
      sortMenu.querySelectorAll("[data-ranking-sort]").forEach((sortButton) => {
        sortButton.setAttribute("aria-pressed", String(sortButton === button));
      });
      sortControl.open = false;
      onChange?.(option.value);
    });

    sortMenu.append(button);
  });

  sortControl.append(sortToggle, sortMenu);
  rankingCardHeader.append(sortControl);

  document.addEventListener("click", (event) => {
    if (!sortControl.contains(event.target)) {
      sortControl.open = false;
    }
  });

  sortControl.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      sortControl.open = false;
      sortToggle.focus();
    }
  });

  return initialValue;
}
