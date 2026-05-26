import { getCurrencyDisplay } from "./currencyDisplay.js";

const chartInstances = new Map();
const actualColor = "#176b87";
const comparisonColor = "#475569";

export function renderLineChart(canvas, { points, config, comparison = null }) {
  if (!canvas) {
    throw new Error("Chart canvas element was not found.");
  }

  if (!window.Chart) {
    throw new Error("Chart.js was not loaded.");
  }

  if (chartInstances.has(canvas.id)) {
    chartInstances.get(canvas.id).destroy();
  }

  const allPoints = comparison?.points?.length ? [...points, ...comparison.points] : points;
  const labels = buildChartLabels(config);
  const displayScale = getDisplayScale(allPoints, config);
  const isCompactViewport = window.matchMedia("(max-width: 640px)").matches;
  const datasets = [
    buildDataset({
      label: config.countryName,
      points,
      labels,
      displayScale,
      baseColor: actualColor,
      isCompactViewport,
    }),
  ];

  if (comparison?.points?.length) {
    datasets.push(
      buildDataset({
        label: comparison.countryName,
        points: comparison.points,
        labels,
        displayScale,
        baseColor: comparisonColor,
        isCompactViewport,
      }),
    );
  }

  const chartInstance = new window.Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: true,
        mode: "nearest",
      },
      plugins: {
        legend: {
          display: Boolean(comparison?.points?.length),
          labels: {
            boxWidth: 14,
            boxHeight: 3,
            usePointStyle: false,
          },
        },
        title: {
          display: false,
        },
        tooltip: {
          displayColors: false,
          callbacks: {
            label(context) {
              const rawValue = context.dataset.rawValues?.[context.dataIndex];
              const formattedValue = Number.isFinite(rawValue)
                ? formatCompactDisplayValue(rawValue, displayScale)
                : formatAxisTickValue(context.parsed.y, displayScale);

              if (comparison?.points?.length) {
                return `${context.dataset.label}: ${formattedValue}`;
              }

              return formattedValue;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: false,
          },
          grid: {
            display: false,
          },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: isCompactViewport ? 6 : 12,
          },
        },
        y: {
          title: {
            display: false,
          },
          ticks: {
            callback(value) {
              return formatAxisTickValue(value, displayScale);
            },
            maxTicksLimit: isCompactViewport ? 5 : 8,
          },
        },
      },
    },
  });

  chartInstances.set(canvas.id, chartInstance);

  return chartInstance;
}

export function clearLineChart(canvas) {
  if (!canvas) {
    return;
  }

  if (chartInstances.has(canvas.id)) {
    chartInstances.get(canvas.id).destroy();
    chartInstances.delete(canvas.id);
  }
}

function buildChartLabels(config) {
  const startYear = Number.isInteger(config.startYear) ? config.startYear : 1980;
  const endYear = Number.isInteger(config.endYear) ? config.endYear : startYear;

  return Array.from(
    { length: endYear - startYear + 1 },
    (_, index) => String(startYear + index),
  );
}

function buildDataset({
  label,
  points,
  labels,
  displayScale,
  baseColor,
  isCompactViewport,
}) {
  const valueByYear = new Map(points.map((point) => [point.year, point.value]));

  return {
    label,
    data: labels.map((labelYear) => {
      const value = valueByYear.get(Number(labelYear));
      return Number.isFinite(value) ? value * displayScale.valueScale : null;
    }),
    rawValues: labels.map((labelYear) => {
      const value = valueByYear.get(Number(labelYear));
      return Number.isFinite(value) ? value : null;
    }),
    borderColor: baseColor,
    backgroundColor: baseColor,
    borderWidth: isCompactViewport ? 2 : 3,
    spanGaps: true,
    pointBackgroundColor: baseColor,
    pointBorderColor: baseColor,
    pointRadius: isCompactViewport ? 0 : 2,
    pointHoverRadius: 5,
    pointHitRadius: isCompactViewport ? 20 : 16,
    tension: 0.25,
    fill: false,
  };
}

export function getDisplayScale(points, config) {
  if (config.valueScaleMode === "gdpMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, { currencyCode: "USD", ...config }, magnitudeInputs.billions);
  }

  if (config.valueScaleMode === "usdMillionsMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, { currencyCode: "USD", ...config }, magnitudeInputs.millions);
  }

  if (config.valueScaleMode === "usdMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, { currencyCode: "USD", ...config }, magnitudeInputs.units);
  }

  if (config.valueScaleMode === "currencyUnitsMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, config, magnitudeInputs.units, {
      maximumFractionDigits: config.maximumFractionDigits ?? 0,
      tooltipUnit: config.tooltipUnit ?? "",
    });
  }

  if (config.valueScaleMode === "internationalDollarMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, { currencyCode: "Int$", ...config }, magnitudeInputs.billions);
  }

  if (config.valueScaleMode === "nationalCurrencyMagnitude") {
    return getCurrencyMagnitudeDisplayScale(points, config, magnitudeInputs.billions);
  }

  if (config.valueScaleMode === "populationMagnitude") {
    return getMagnitudeDisplayScale(points, magnitudeInputs.people, {
      valueScale: 1000000,
      maximumFractionDigits: 0,
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

function getCurrencyMagnitudeDisplayScale(points, config, magnitudeSteps, fallback = {}) {
  const currencyDisplay = getCurrencyDisplay(config);
  const maxRawValue = Math.max(...points.map((point) => Math.abs(point.value)));
  const magnitudeStep = magnitudeSteps.find((step) => maxRawValue >= step.threshold);

  if (!magnitudeStep) {
    return {
      valueScale: config.valueScale ?? 1,
      tooltipPrefix: currencyDisplay.prefix,
      tooltipUnit: fallback.tooltipUnit ?? config.tooltipUnit ?? "",
      tickPrefix: currencyDisplay.prefix,
      suffix: currencyDisplay.suffix,
      suffixSpacing: config.suffixSpacing ?? " ",
      compactUnit: "",
      compactUnitSuffix: currencyDisplay.compactUnitSuffix,
      adaptiveCompactSteps: magnitudeSteps,
      adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? config.maximumFractionDigits ?? 0,
      maximumFractionDigits: fallback.maximumFractionDigits ?? config.maximumFractionDigits ?? 0,
    };
  }

  const displayValue = maxRawValue * magnitudeStep.valueScale;

  return {
    valueScale: magnitudeStep.valueScale,
    tooltipPrefix: currencyDisplay.prefix,
    tickPrefix: currencyDisplay.prefix,
    suffix: "",
    compactUnit: `${magnitudeStep.compactUnit}${currencyDisplay.compactUnitSuffix}`,
    compactUnitSuffix: currencyDisplay.compactUnitSuffix,
    adaptiveCompactSteps: magnitudeSteps,
    adaptiveFallbackSuffix: currencyDisplay.suffix,
    adaptiveFallbackSuffixSpacing: config.suffixSpacing ?? " ",
    adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? config.maximumFractionDigits ?? 0,
    maximumFractionDigits: magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(displayValue),
  };
}

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
      maximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    };
  }

  const displayValue = maxRawValue * magnitudeStep.valueScale;

  return {
    valueScale: magnitudeStep.valueScale,
    tooltipPrefix: "",
    tickPrefix: "",
    suffix: "",
    compactUnit: `${magnitudeStep.compactUnit}${fallback.tooltipUnitSuffix ?? ""}`,
    compactUnitSuffix: fallback.tooltipUnitSuffix ?? "",
    adaptiveCompactSteps: magnitudeSteps,
    adaptiveFallbackValueScale: fallback.valueScale ?? 1,
    adaptiveFallbackMaximumFractionDigits: fallback.maximumFractionDigits ?? 0,
    smallValueMaximumFractionDigits: fallback.smallValueMaximumFractionDigits,
    smallValueThreshold: fallback.smallValueThreshold,
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

function formatAxisTickValue(value, displayScale) {
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
    const suffixValue = displayScale.adaptiveFallbackSuffix ?? displayScale.suffix;
    const suffixSpacing =
      displayScale.adaptiveFallbackSuffixSpacing ?? displayScale.suffixSpacing ?? (suffixValue ? " " : "");
    const suffix = suffixValue ? `${suffixSpacing}${suffixValue}` : "";

    return `${displayScale.tooltipPrefix}${formattedValue}${unit}${suffix}`;
  }

  const displayValue = value * magnitudeStep.valueScale;
  const maximumFractionDigits = magnitudeStep.fixedFractionDigits ?? getMagnitudeFractionDigits(Math.abs(displayValue));
  const formattedValue = formatNumber(displayValue, maximumFractionDigits);
  const compactUnit = `${magnitudeStep.compactUnit}${displayScale.compactUnitSuffix ?? ""}`;

  return `${displayScale.tooltipPrefix}${formattedValue}${compactUnit}`;
}

function getAdaptiveFallbackFractionDigits(value, displayScale) {
  const defaultFractionDigits = displayScale.adaptiveFallbackMaximumFractionDigits;
  const smallValueMaximumFractionDigits = displayScale.smallValueMaximumFractionDigits;

  if (
    smallValueMaximumFractionDigits != null
    && value !== 0
    && Math.abs(value) < (displayScale.smallValueThreshold ?? 10)
  ) {
    return smallValueMaximumFractionDigits;
  }

  return defaultFractionDigits;
}
