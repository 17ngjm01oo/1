import { formatAxisTickValue, formatCompactDisplayValue, getDisplayScale } from "./displayFormat.js";

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
          onClick() {},
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
    borderCapStyle: "round",
    borderJoinStyle: "round",
    spanGaps: true,
    pointBackgroundColor: baseColor,
    pointBorderColor: baseColor,
    pointRadius: isCompactViewport ? 0 : 2,
    pointHoverRadius: 5,
    pointHitRadius: isCompactViewport ? 20 : 16,
    tension: 0,
    fill: false,
  };
}
