const LEGACY_DISPLAY_UNIT_PATTERNS = [
  { pattern: /\s+-\s+Local currency(?:\s+\([^)]+\))?$/u, unit: "Local currency" },
  { pattern: /\s+-\s+USD$/u, unit: "USD" },
  { pattern: /\s+-\s+Int\$$/u, unit: "Int$" },
  { pattern: /\s+-\s+\/km²$/u, unit: "/km²" },
  { pattern: /\s+-\s+CO2e$/u, unit: "CO2e" },
  { pattern: /\s+-\s+% of Land Area$/u, unit: "% of Land Area" },
  { pattern: /\s+\(% of GDP\)$/u, unit: "% of GDP" },
  { pattern: /\s+\(km²\)$/u, unit: "km²" },
];

export function getIndicatorDisplayParts(seriesConfig, { label, currencyCode } = {}) {
  const rawLabel = label ?? seriesConfig.titleTemplate ?? "";
  const legacyUnit = getLegacyDisplayUnit(rawLabel);
  const unit = formatConfiguredDisplayUnit(seriesConfig.displayUnit ?? legacyUnit, currencyCode);

  return {
    label: stripLegacyDisplayUnit(rawLabel),
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
  unitElement.textContent = unit;
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

function stripLegacyDisplayUnit(label) {
  for (const { pattern } of LEGACY_DISPLAY_UNIT_PATTERNS) {
    if (pattern.test(label)) {
      return label.replace(pattern, "");
    }
  }

  return label;
}

function getLegacyDisplayUnit(label) {
  return LEGACY_DISPLAY_UNIT_PATTERNS.find(({ pattern }) => pattern.test(label))?.unit ?? "";
}
