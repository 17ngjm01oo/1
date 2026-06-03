import { getRankingControls } from "./rankingControls.js";

export function initializeTerritoryToggle({
  initialValue = true,
  onChange,
  container = getRankingControls(),
  ariaContext = "ranking",
} = {}) {
  const controls = container;

  if (!controls) {
    return initialValue;
  }

  const button = document.createElement("button");
  button.className = "territory-toggle";
  button.type = "button";

  button.addEventListener("click", () => {
    const nextValue = button.getAttribute("aria-pressed") !== "true";
    updateButton(button, nextValue, ariaContext);
    onChange?.(nextValue);
  });

  updateButton(button, initialValue, ariaContext);
  controls.append(button);
  return initialValue;
}

function updateButton(button, isEnabled, ariaContext) {
  button.setAttribute("aria-pressed", String(isEnabled));
  button.setAttribute("aria-label", `${isEnabled ? "Hide" : "Show"} territories in ${ariaContext}`);
  button.textContent = `Territories: ${isEnabled ? "ON" : "OFF"}`;
}
