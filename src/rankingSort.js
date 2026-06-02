import { getRankingControls } from "./rankingControls.js";
import { createRankingDropdown } from "./rankingDropdown.js";

const sortOptions = [
  { value: "highest", label: "Highest" },
  { value: "lowest", label: "Lowest" },
];

export function initializeRankingSort({ initialValue = "highest", onChange }) {
  const controls = getRankingControls();

  if (!controls) {
    return initialValue;
  }

  const sortControl = createRankingDropdown({
    className: "ranking-sort-order",
    toggleText: () => "Sort by",
    toggleAriaLabel: "Choose ranking sort order",
    menuAriaLabel: "Ranking sort order",
    options: sortOptions,
    initialValue,
    onChange,
  });
  controls.append(sortControl);

  return initialValue;
}
