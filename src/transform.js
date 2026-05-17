import { getSeriesValues } from "./seriesData.js";

export function transformSeriesData(rawResponse, { indicatorCode, countryCode, startYear, endYear }) {
  console.groupCollapsed("[Static Data] Inspecting series data");
  console.log({
    indicatorCode,
    countryCode,
    startYear,
    endYear,
    availableIndicators: getAvailableIndicators(rawResponse),
  });
  console.groupEnd();

  const preferredSeries = getSeriesValues(rawResponse, { indicatorCode, countryCode });

  if (!preferredSeries) {
    console.info("[Static Data] No series data found for the requested country and indicator.", {
      indicatorCode,
      countryCode,
    });
    return [];
  }

  const points = Object.entries(preferredSeries)
    .map(([yearKey, value]) => ({
      year: Number.parseInt(yearKey, 10),
      value: normalizeNumericValue(value),
    }))
    .filter(({ year, value }) => {
      return (
        Number.isInteger(year) &&
        year >= startYear &&
        year <= endYear &&
        Number.isFinite(value)
      );
    })
    .sort((a, b) => a.year - b.year);

  console.table(points);

  if (points.length === 0) {
    console.info("[Static Data] Series exists, but no numeric points matched the requested period.", {
      indicatorCode,
      countryCode,
      startYear,
      endYear,
    });
  }

  return points;
}

function getAvailableIndicators(rawResponse) {
  if (rawResponse?.indicators && typeof rawResponse.indicators === "object") {
    return Object.keys(rawResponse.indicators);
  }

  if (rawResponse?.values && typeof rawResponse.values === "object") {
    return Object.keys(rawResponse.values);
  }

  return [];
}

function normalizeNumericValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const normalized = Number.parseFloat(value.replaceAll(",", ""));
    return Number.isFinite(normalized) ? normalized : null;
  }

  return null;
}
