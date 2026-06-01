import { getRankingControls } from "./rankingControls.js";

export function initializeRankingTerritoryToggle({ initialValue = true, onChange }) {
  const controls = getRankingControls();

  if (!controls) {
    return initialValue;
  }

  const button = document.createElement("button");
  button.className = "ranking-territory-toggle";
  button.type = "button";
  updateButton(button, initialValue);

  button.addEventListener("click", () => {
    const nextValue = button.getAttribute("aria-pressed") !== "true";
    updateButton(button, nextValue);
    onChange?.(nextValue);
  });

  controls.append(button);
  return initialValue;
}

function updateButton(button, isEnabled) {
  button.setAttribute("aria-pressed", String(isEnabled));
  button.setAttribute("aria-label", `${isEnabled ? "Hide" : "Show"} territories in ranking`);
  button.textContent = `Territories: ${isEnabled ? "ON" : "OFF"}`;
}
