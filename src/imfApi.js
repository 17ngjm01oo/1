import { dataSources } from "./config.js";

export function buildImfRequestUrls(options) {
  const remoteUrl = buildImfDataMapperUrl(options);
  const appUrl = dataSources.imfDataMapper.useLocalProxy
    ? buildLocalProxyUrl(options, remoteUrl)
    : remoteUrl;

  return {
    appUrl,
    remoteUrl,
  };
}

export function buildImfDataMapperUrl({
  indicatorCode,
  countryCode,
  dataset = "WEO",
  startYear,
  endYear,
}) {
  if (!indicatorCode || !countryCode) {
    throw new Error("indicatorCode and countryCode are required to build the IMF API URL.");
  }

  // DataMapper v2 identifies the WEO dataset through indicator metadata.
  // The visible DataMapper page uses NGDPD@WEO, but the API endpoint returns series data with NGDPD.
  // If IMF changes this path convention, update this function first.
  const url = new URL(
    `${dataSources.imfDataMapper.baseUrl}/${encodeURIComponent(indicatorCode)}/${encodeURIComponent(countryCode)}`,
  );

  if (Number.isInteger(startYear) && Number.isInteger(endYear)) {
    url.searchParams.set("periods", buildPeriodList(startYear, endYear).join(","));
  }

  return url.toString();
}

export function buildLocalProxyUrl(
  { indicatorCode, countryCode, dataset = "WEO", startYear, endYear },
  remoteUrl,
) {
  const url = new URL(dataSources.imfDataMapper.proxyPath, window.location.origin);

  url.searchParams.set("indicatorCode", indicatorCode);
  url.searchParams.set("countryCode", countryCode);
  url.searchParams.set("dataset", dataset);

  if (Number.isInteger(startYear)) {
    url.searchParams.set("startYear", String(startYear));
  }

  if (Number.isInteger(endYear)) {
    url.searchParams.set("endYear", String(endYear));
  }

  url.searchParams.set("remoteUrl", remoteUrl);

  return url.toString();
}

export async function fetchImfSeries({
  indicatorCode,
  countryCode,
  dataset,
  startYear,
  endYear,
}) {
  const { appUrl, remoteUrl } = buildImfRequestUrls({
    indicatorCode,
    countryCode,
    dataset,
    startYear,
    endYear,
  });

  console.info("[IMF API] Browser request URL:", appUrl);
  console.info("[IMF API] Remote IMF URL:", remoteUrl);

  try {
    const response = await fetch(appUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    console.info("[IMF API] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[IMF API] Error response body:", errorBody);
      throw new Error(`IMF API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Keep the raw response visible while confirming or changing IMF response shapes.
    console.groupCollapsed("[IMF API] Raw response");
    console.log(data);
    console.groupEnd();

    return {
      data,
      url: remoteUrl,
      requestUrl: appUrl,
    };
  } catch (error) {
    console.error("[IMF API] Failed to fetch series.", {
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
