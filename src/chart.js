const chartInstances = new Map();
const actualColor = "#176b87";
const comparisonColor = "#475569";
const projectionColor = "#f97316";
const projectionFillColor = "rgba(249, 115, 22, 0.16)";
const actualFillColor = "rgba(23, 107, 135, 0.14)";

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
  const labels = buildChartLabels(points, comparison?.points);
  const displayScale = getDisplayScale(allPoints, config);
  const isCompactViewport = window.matchMedia("(max-width: 640px)").matches;
  const projectionYear = config.projectionYear ?? 2026;
  const datasets = [
    buildDataset({
      label: config.countryName,
      points,
      labels,
      displayScale,
      baseColor: actualColor,
      fillColor: actualFillColor,
      projectionYear,
      isCompactViewport,
      fill: true,
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
        fillColor: "rgba(71, 85, 105, 0.08)",
        projectionYear,
        isCompactViewport,
        fill: false,
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
        intersect: false,
        mode: "index",
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
              const year = context.label;
              const value = formatNumber(context.parsed.y, displayScale.maximumFractionDigits);
              const prefix = displayScale.tooltipPrefix;
              const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";
              const formattedValue = `${prefix}${value}${unit}`;

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
            display: true,
            text: "Year",
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
            display: true,
            text: displayScale.unitLabel,
          },
          ticks: {
            callback(value) {
              return `${displayScale.tickPrefix}${formatNumber(value, displayScale.maximumFractionDigits)}`;
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

function buildChartLabels(points, comparisonPoints = []) {
  const years = new Set();

  points.forEach((point) => years.add(point.year));
  comparisonPoints?.forEach((point) => years.add(point.year));

  return Array.from(years)
    .sort((yearA, yearB) => yearA - yearB)
    .map((year) => String(year));
}

function buildDataset({
  label,
  points,
  labels,
  displayScale,
  baseColor,
  fillColor,
  projectionYear,
  isCompactViewport,
  fill,
}) {
  const valueByYear = new Map(points.map((point) => [point.year, point.value]));

  return {
    label,
    data: labels.map((labelYear) => {
      const value = valueByYear.get(Number(labelYear));
      return Number.isFinite(value) ? value * displayScale.valueScale : null;
    }),
    borderColor: baseColor,
    backgroundColor: fillColor,
    borderWidth: isCompactViewport ? 2 : 3,
    spanGaps: true,
    pointBackgroundColor(context) {
      return isProjectionPoint(context, labels, projectionYear) ? projectionColor : baseColor;
    },
    pointBorderColor(context) {
      return isProjectionPoint(context, labels, projectionYear) ? projectionColor : baseColor;
    },
    pointRadius(context) {
      if (isProjectionPoint(context, labels, projectionYear)) {
        return isCompactViewport ? 4 : 5;
      }

      return isCompactViewport ? 0 : 2;
    },
    pointHoverRadius(context) {
      return isProjectionPoint(context, labels, projectionYear) ? 7 : 5;
    },
    segment: {
      borderColor(context) {
        const endYear = Number(labels[context.p1DataIndex]);
        return endYear === projectionYear ? projectionColor : baseColor;
      },
      backgroundColor(context) {
        const endYear = Number(labels[context.p1DataIndex]);
        return endYear === projectionYear ? projectionFillColor : fillColor;
      },
    },
    tension: 0.25,
    fill,
  };
}

function isProjectionPoint(context, labels, projectionYear) {
  const year = Number(labels[context.dataIndex]);
  return year === projectionYear;
}

export function getDisplayScale(points, config) {
  if (config.valueScaleMode === "gdpMagnitude") {
    return getGdpDisplayScale(points, config);
  }

  return {
    valueScale: config.valueScale ?? 1,
    unitLabel: config.unitLabel,
    tooltipPrefix: config.tooltipPrefix ?? "",
    tooltipUnit: config.tooltipUnit ?? "",
    tickPrefix: config.tickPrefix ?? "",
    maximumFractionDigits: config.maximumFractionDigits ?? 1,
  };
}

function getGdpDisplayScale(points, config) {
  const maxRawValue = Math.max(...points.map((point) => point.value));

  if (maxRawValue >= 1000) {
    return {
      valueScale: 0.001,
      unitLabel: "Trillions of U.S. dollars",
      tooltipPrefix: "$",
      tooltipUnit: "trillion",
      tickPrefix: "$",
      maximumFractionDigits: 2,
    };
  }

  if (maxRawValue >= 1) {
    return {
      valueScale: 1,
      unitLabel: "Billions of U.S. dollars",
      tooltipPrefix: "$",
      tooltipUnit: "billion",
      tickPrefix: "$",
      maximumFractionDigits: getMagnitudeFractionDigits(maxRawValue),
    };
  }

  return {
    valueScale: 1000,
    unitLabel: "Millions of U.S. dollars",
    tooltipPrefix: "$",
    tooltipUnit: "million",
    tickPrefix: "$",
    maximumFractionDigits: getMagnitudeFractionDigits(maxRawValue * 1000),
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

export function formatDisplayValue(value, displayScale) {
  const formattedValue = formatNumber(value * displayScale.valueScale, displayScale.maximumFractionDigits);
  const unit = displayScale.tooltipUnit ? ` ${displayScale.tooltipUnit}` : "";

  return `${displayScale.tooltipPrefix}${formattedValue}${unit}`;
}
