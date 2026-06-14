import { createIndicatorInfoButton } from "./indicatorInfoUi.js";

export function getIndicatorDisplayParts(seriesConfig, { label, currencyCode } = {}) {
  const displayLabel = label ?? seriesConfig.titleTemplate ?? "";
  const unit = formatConfiguredDisplayUnit(seriesConfig.displayUnit, currencyCode);

  return {
    label: displayLabel,
    unit,
  };
}

export function getIndicatorDisplayText(seriesConfig, options = {}) {
  const { label, unit } = getIndicatorDisplayParts(seriesConfig, options);
  return unit ? `${label} ${unit}` : label;
}

export function renderIndicatorLabel(target, seriesConfig, options = {}) {
  const { label, unit, tooltipPlacement } = {
    ...getIndicatorDisplayParts(seriesConfig, options),
    tooltipPlacement: options.tooltipPlacement ?? "country-indicator",
  };
  target.textContent = label;

  if (unit) {
    target.append(document.createTextNode(" "));
    const unitElement = document.createElement("span");
    unitElement.className = "indicator-display-unit";
    unitElement.textContent = `(${unit})`;
    target.append(unitElement);
  }

  target.append(document.createTextNode(" "));
  target.append(createIndicatorInfoButton({
    seriesId: seriesConfig.id,
    label,
    tooltipPlacement,
  }));
}

function formatConfiguredDisplayUnit(unit, currencyCode) {
  if (!unit) {
    return "";
  }

  if (unit === "Local currency" && currencyCode) {
    return `${unit} - ${currencyCode}`;
  }

  return unit;
}
