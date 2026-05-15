export function transformImfSeries(rawResponse, { indicatorCode, countryCode, startYear, endYear }) {
  console.groupCollapsed("[Transform] Inspecting IMF response");
  console.log({
    indicatorCode,
    countryCode,
    startYear,
    endYear,
    rawResponse,
  });
  console.groupEnd();

  const seriesCandidates = collectSeriesCandidates(rawResponse);
  const preferredSeries = selectPreferredSeries(seriesCandidates, { indicatorCode, countryCode });

  if (!preferredSeries) {
    console.error("[Transform] No usable series found in IMF response.", {
      availableCandidateCount: seriesCandidates.length,
      rawResponse,
    });
    throw new Error("No usable IMF time series found in the API response.");
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
    throw new Error("IMF response was loaded, but no numeric points matched the requested period.");
  }

  return points;
}

function collectSeriesCandidates(value, path = "root", candidates = []) {
  if (!value || typeof value !== "object") {
    return candidates;
  }

  if (looksLikeYearValueMap(value)) {
    candidates.push({
      path,
      series: value,
    });
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectSeriesCandidates(item, `${path}[${index}]`, candidates));
    return candidates;
  }

  Object.entries(value).forEach(([key, childValue]) => {
    collectSeriesCandidates(childValue, `${path}.${key}`, candidates);
  });

  return candidates;
}

function selectPreferredSeries(candidates, { indicatorCode, countryCode }) {
  if (candidates.length === 0) {
    return null;
  }

  const matchingCandidate = candidates.find(({ path }) => {
    const upperPath = path.toUpperCase();
    return upperPath.includes(indicatorCode.toUpperCase()) && upperPath.includes(countryCode.toUpperCase());
  });

  const selected = matchingCandidate ?? candidates[0];
  console.info("[Transform] Selected IMF series candidate:", selected.path);
  return selected.series;
}

function looksLikeYearValueMap(value) {
  const entries = Object.entries(value);

  if (entries.length === 0) {
    return false;
  }

  const yearLikeEntries = entries.filter(([key, entryValue]) => {
    return /^\d{4}$/.test(key) && normalizeNumericValue(entryValue) !== null;
  });

  return yearLikeEntries.length > 0;
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

