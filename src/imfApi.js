import { dataSources } from "./config.js";

const staticDataCache = new Map();

export function buildImfRequestUrls(options) {
  const remoteUrl = buildImfDataMapperUrl({
    ...options,
    countryCode: null,
  });
  const appUrl = buildStaticDataUrl(options);

  return {
    appUrl,
    remoteUrl,
  };
}

function buildStaticDataUrl({ staticDataPath, indicatorCode }) {
  if (!dataSources.imfDataMapper.useStaticData) {
    throw new Error("Static data mode is required for this site.");
  }

  if (!staticDataPath) {
    throw new Error(`staticDataPath is required for ${indicatorCode}.`);
  }

  return new URL(staticDataPath, window.location.href).toString();
}

export function buildImfDataMapperUrl({
  indicatorCode,
  countryCode,
  dataset = "WEO",
  startYear,
  endYear,
}) {
  if (!indicatorCode) {
    throw new Error("indicatorCode is required to build the IMF source URL.");
  }

  // DataMapper v2 identifies the WEO dataset through indicator metadata.
  // The visible DataMapper page uses NGDPD@WEO, but the API endpoint returns series data with NGDPD.
  // If IMF changes this path convention, update this function first.
  const path = countryCode
    ? `${dataSources.imfDataMapper.baseUrl}/${encodeURIComponent(indicatorCode)}/${encodeURIComponent(countryCode)}`
    : `${dataSources.imfDataMapper.baseUrl}/${encodeURIComponent(indicatorCode)}`;
  const url = new URL(path);

  if (Number.isInteger(startYear) && Number.isInteger(endYear)) {
    url.searchParams.set("periods", buildPeriodList(startYear, endYear).join(","));
  }

  return url.toString();
}

export async function fetchImfSeries({
  indicatorCode,
  countryCode,
  dataset,
  startYear,
  endYear,
  staticDataPath,
}) {
  const { appUrl, remoteUrl } = buildImfRequestUrls({
    indicatorCode,
    countryCode,
    dataset,
    startYear,
    endYear,
    staticDataPath,
  });

  console.info("[Static Data] Data file URL:", appUrl);
  console.info("[Static Data] Source IMF URL for updates:", remoteUrl);

  try {
    if (staticDataCache.has(appUrl)) {
      return {
        data: staticDataCache.get(appUrl),
        url: remoteUrl,
        requestUrl: appUrl,
      };
    }

    const response = await fetch(appUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    console.info("[Static Data] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Static Data] Error response body:", errorBody);
      throw new Error(`Static data file request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    staticDataCache.set(appUrl, data);

    console.groupCollapsed("[Static Data] Raw response");
    console.log(data);
    console.groupEnd();

    return {
      data,
      url: remoteUrl,
      requestUrl: appUrl,
    };
  } catch (error) {
    console.error("[Static Data] Failed to load static data file.", {
      requestUrl: appUrl,
      remoteUrl,
      indicatorCode,
      countryCode,
      dataset,
      error,
    });
    throw error;
  }
}

function buildPeriodList(startYear, endYear) {
  if (startYear > endYear) {
    throw new Error("startYear must be less than or equal to endYear.");
  }

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index);
}
