export function transformImfSeries(rawResponse, { indicatorCode, countryCode, startYear, endYear }) {
  console.groupCollapsed("[Static Data] Inspecting series data");
  console.log({
    indicatorCode,
    countryCode,
    startYear,
    endYear,
    availableIndicators: rawResponse?.values ? Object.keys(rawResponse.values) : [],
  });
  console.groupEnd();

  const preferredSeries = getStaticSeries(rawResponse, { indicatorCode, countryCode });

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

function getStaticSeries(rawResponse, { indicatorCode, countryCode }) {
  if (!rawResponse || typeof rawResponse !== "object") {
    throw new Error("Static data file did not contain a JSON object.");
  }

  if (!rawResponse.values || typeof rawResponse.values !== "object") {
    throw new Error("Static data file is missing the values object.");
  }

  const indicatorValues = rawResponse.values[indicatorCode];

  if (!indicatorValues || typeof indicatorValues !== "object") {
    console.info("[Static Data] Indicator is not present in the static data file.", {
      indicatorCode,
      availableIndicators: Object.keys(rawResponse.values),
    });
    return null;
  }

  const series = indicatorValues[countryCode];

  if (!series || typeof series !== "object") {
    console.info("[Static Data] Country is not present for this indicator.", {
      indicatorCode,
      countryCode,
    });
    return null;
  }

  if (Array.isArray(series)) {
    throw new Error("Static data series must be a year-value object, not an array.");
  }

  console.info("[Static Data] Selected static series.", {
    indicatorCode,
    countryCode,
  });

  return series;
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
