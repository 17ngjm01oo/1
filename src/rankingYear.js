import { getRankingControls } from "./rankingControls.js";
import { createRankingDropdown } from "./rankingDropdown.js";

export function initializeRankingYear({ years, initialValue, onChange }) {
  const controls = getRankingControls();

  if (!controls || years.length === 0) {
    return initialValue;
  }

  const yearControl = createRankingDropdown({
    menuClassName: "ranking-year-menu",
    toggleText: (year) => `Year: ${year}`,
    toggleAriaLabel: "Choose ranking year",
    menuAriaLabel: "Ranking year",
    options: years.map((year) => ({ value: String(year), label: String(year) })),
    initialValue: String(initialValue),
    onChange,
  });

  controls.append(yearControl);
  return String(initialValue);
}
