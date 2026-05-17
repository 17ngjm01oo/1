export function getSeriesValues(rawData, { indicatorCode, countryCode }) {
  return rawData?.economies?.[countryCode]?.series?.[indicatorCode]?.values ?? null;
}

export function getIndicatorSeriesMap(rawData, indicatorCode) {
  if (!rawData?.economies || typeof rawData.economies !== "object") {
    return null;
  }

  return Object.fromEntries(
    Object.entries(rawData.economies)
      .map(([countryCode, economy]) => {
        const values = economy?.series?.[indicatorCode]?.values;
        return values && typeof values === "object" ? [countryCode, values] : null;
      })
      .filter(Boolean),
  );
}
