const basicMagnitudeModes = {
  gdpMagnitude: "billions",
  usdMillionsMagnitude: "millions",
  usdMagnitude: "units",
  internationalDollarMagnitude: "billions",
  nationalCurrencyMagnitude: "billions",
};

export function getDisplayScale(points, config) {
  const basicMagnitudeInput = basicMagnitudeModes[config.valueScaleMode];

  if (basicMagnitudeInput) {
    return getMagnitudeDisplayScale(points, magnitudeInputs[basicMagnitudeInput]);
  }

  if (config.valueScaleMode === "currencyUnitsMagnitude") {
    return getMagnitudeDisplayScale(points, magnitudeInputs.units, {
      maximumFractionDigits: config.maximumFractionDigits ?? 0,
      tooltipUnit: config.tooltipUnit ?? "",
    });
  }

  if (config.valueScaleMode === "populationMagnitude") {
    return getMagnitudeDisplayScale(points, magnitudeInputs.people, {
      valueScale: 1000000,
      maximumFractionDigits: 0,
    });
  }

  if (config.valueScaleMode === "populationUnitsMagnitude") {
    return getMagnitudeDisplayScale(points, magnitudeInputs.units, {
      maximumFractionDigits: config.fallbackMaximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: config.fallbackSmallValueMaximumFractionDigits,
      smallValueThreshold: config.fallbackSmallValueThreshold,
      integerValueThreshold: config.fallbackIntegerValueThreshold,
      suffix: config.suffix,
      suffixSpacing: config.suffixSpacing,
    });
  }

  if (config.valueScaleMode === "areaMagnitude") {
    return getMagnitudeDisplayScale(points, magnitudeInputs.units, {
      maximumFractionDigits: config.fallbackMaximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: config.fallbackSmallValueMaximumFractionDigits ?? 2,
      smallValueThreshold: config.fallbackSmallValueThreshold ?? 10,
    });
  }

  return {
    valueScale: config.valueScale ?? 1,
    tooltipPrefix: config.tooltipPrefix ?? "",
    tooltipUnit: config.tooltipUnit ?? "",
    tickPrefix: config.tickPrefix ?? "",
    suffix: config.suffix ?? "",
    suffixSpacing: config.suffixSpacing ?? " ",
    compactUnit: config.compactUnit ?? "",
    maximumFractionDigits: config.maximumFractionDigits ?? 1,
  };
}

export function getSingleValueDisplayScale(value, config) {
  return getDisplayScale([{ value }], config);
}

const magnitudeInputs = {
  billions: [
    { threshold: 1000000, valueScale: 0.000001, compactUnit: "Q", fixedFractionDigits: 2 },
    { threshold: 1000, valueScale: 0.001, compactUnit: "T", fixedFractionDigits: 2 },
    { threshold: 1, valueScale: 1, compactUnit: "B" },
    { threshold: Number.NEGATIVE_INFINITY, valueScale: 1000, compactUnit: "M" },
  ],
  millions: [
    { threshold: 1000000000, valueScale: 0.000000001, compactUnit: "Q", fixedFractionDigits: 2 },
    { threshold: 1000000, valueScale: 0.000001, compactUnit: "T", fixedFractionDigits: 2 },
    { threshold: 1000, valueScale: 0.001, compactUnit: "B" },
    { threshold: Number.NEGATIVE_INFINITY, valueScale: 1, compactUnit: "M" },
  ],
  units: [
    { threshold: 1000000000000000, valueScale: 0.000000000000001, compactUnit: "Q", fixedFractionDigits: 2 },
    { threshold: 1000000000000, valueScale: 0.000000000001, compactUnit: "T", fixedFractionDigits: 2 },
    { threshold: 1000000000, valueScale: 0.000000001, compactUnit: "B" },
    { threshold: 1000000, valueScale: 0.000001, compactUnit: "M" },
  ],
  people: [
    { threshold: 1000000000, valueScale: 0.000000001, compactUnit: "Q", fixedFractionDigits: 2 },
    { threshold: 1000000, valueScale: 0.000001, compactUnit: "T", fixedFractionDigits: 2 },
    { threshold: 1000, valueScale: 0.001, compactUnit: "B" },
    { threshold: 1, valueScale: 1, compactUnit: "M" },
  ],
};

function getMagnitudeDisplayScale(points, magnitudeSteps, fallback = {}) {
  const maxRawValue = Math.max(...points.map((point) => Math.abs(point.value)));
  const magnitudeStep = magnitudeSteps.find((step) => maxRawValue >= step.threshold);

  if (!magnitudeStep) {
    return {
      valueScale: fallback.valueScale ?? 1,
      tooltipPrefix: "",
      tooltipUnit: fallback.tooltipUnit ?? "",
      tickPrefix: "",
      suffix: fallback.suffix ?? "",
      suffixSpacing: fallback.suffixSpacing ?? " ",
      compactUnit: "",
      adaptiveCompactSteps: magnitudeSteps,
      adaptiveFallbackValueScale: fallback.valueScale ?? 1,
      adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? 0,
      smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
      smallValueThreshold: fallback.smallValueThreshold,
      integerValueThreshold: fallback.integerValueThreshold,
      maximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    };
  }

  const displayValue = maxRawValue * magnitudeStep.valueScale;

  return {
    valueScale: magnitudeStep.valueScale,
    tooltipPrefix: "",
    tickPrefix: "",
    suffix: fallback.suffix ?? "",
    suffixSpacing: fallback.suffixSpacing ?? " ",
    compactUnit: magnitudeStep.compactUnit,
    adaptiveCompactSteps: magnitudeSteps,
    adaptiveFallbackValueScale: fallback.valueScale ?? 1,
    adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
    smallValueThreshold: fallback.smallValueThreshold,
    integerValueThreshold: fallback.integerValueThreshold,
    maximumFractionDigits: magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(displayValue),
  };
}

function getMagnitudeFractionDigits(maxDisplayValue) {
  if (maxDisplayValue >= 100) {
    return 0;
  }

  if (maxDisplayValue >= 10) {
    return 1;
  }

  return 2;
}

function formatNumber(value, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatAxisTickValue(value, displayScale) {
  if (displayScale.adaptiveCompactSteps) {
    return formatAdaptiveCompactValue(value / displayScale.valueScale, displayScale);
  }

  const formattedValue = formatNumber(value, displayScale.maximumFractionDigits);
  const compactUnit = displayScale.compactUnit ?? "";
  const suffixSpacing = displayScale.suffixSpacing ?? (displayScale.suffix ? " " : "");
  const suffix = displayScale.suffix ? `${suffixSpacing}${displayScale.suffix}` : "";

  return `${displayScale.tickPrefix}${formattedValue}${compactUnit}${suffix}`;
}

export function formatDisplayValue(value, displayScale) {
  const formattedValue = formatNumber(value * displayScale.valueScale, displayScale.maximumFractionDigits);
  const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
  const suffixSpacing = displayScale.suffixSpacing ?? (displayScale.suffix ? " " : "");
  const suffix = displayScale.suffix ? `${suffixSpacing}${displayScale.suffix}` : "";

  return `${displayScale.tooltipPrefix}${formattedValue}${unit}${suffix}`;
}

export function formatCompactDisplayValue(value, displayScale) {
  if (displayScale.adaptiveCompactSteps) {
    return formatAdaptiveCompactValue(value, displayScale);
  }

  if (!displayScale.compactUnit) {
    return formatDisplayValue(value, displayScale);
  }

  const formattedValue = formatNumber(value * displayScale.valueScale, displayScale.maximumFractionDigits);

  return `${displayScale.tooltipPrefix}${formattedValue}${displayScale.compactUnit}`;
}

function formatAdaptiveCompactValue(value, displayScale) {
  const magnitudeStep = displayScale.adaptiveCompactSteps.find((step) => Math.abs(value) >= step.threshold);

  if (!magnitudeStep) {
    const fallbackValue = value * (displayScale.adaptiveFallbackValueScale ?? 1);
    const formattedValue = formatNumber(fallbackValue, getAdaptiveFallbackFractionDigits(fallbackValue, displayScale));
    const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
    const suffixValue = displayScale.suffix;
    const suffixSpacing = displayScale.suffixSpacing ?? (suffixValue ? " " : "");
    const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";

    return `${displayScale.tooltipPrefix}${formattedValue}${unit}${suffix}`;
  }

  const displayValue = value * magnitudeStep.valueScale;
  const maximumFractionDigits = magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(Math.abs(displayValue));
  const formattedValue = formatNumber(displayValue, maximumFractionDigits);
  const suffixValue = displayScale.suffix;
  const suffixSpacing = displayScale.suffixSpacing ?? (suffixValue ? " " : "");
  const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";
  return `${displayScale.tooltipPrefix}${formattedValue}${magnitudeStep.compactUnit}${suffix}`;
}

function getAdaptiveFallbackFractionDigits(value, displayScale) {
  const defaultFractionDigits = displayScale.adaptiveFallbackMaximumFractionDigits;
  const smallValueMaximumFractionDigits = displayScale.smallValueMaximumFractionDigits;

  if (Math.abs(value) >= (displayScale.integerValueThreshold ?? Number.POSITIVE_INFINITY)) {
    return 0;
  }

  if (
    smallValueMaximumFractionDigits != null
    && value !== 0
    && Math.abs(value) < (displayScale.smallValueThreshold ?? 10)
  ) {
    return smallValueMaximumFractionDigits;
  }

  return defaultFractionDigits;
}
