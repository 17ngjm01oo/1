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
  const { label, unit } = getIndicatorDisplayParts(seriesConfig, options);
  target.textContent = label;

  if (!unit) {
    return;
  }

  target.append(document.createTextNode(" "));
  const unitElement = document.createElement("span");
  unitElement.className = "indicator-display-unit";
  unitElement.textContent = `(${unit})`;
  target.append(unitElement);
}

function formatConfiguredDisplayUnit(unit, currencyCode) {
  if (!unit) {
    return "";
  }

  if (unit === "Local currency" && currencyCode) {
    return `${unit} (${currencyCode})`;
  }

  return unit;
}
