const staticDataCache = new Map();

export function buildStaticDataRequestUrls({ staticDataPath, sourceUrl, indicatorCode }) {
  if (!staticDataPath) {
    throw new Error(`staticDataPath is required for ${indicatorCode}.`);
  }

  return {
    appUrl: new URL(staticDataPath, window.location.href).toString(),
    sourceUrl: sourceUrl ?? "",
  };
}

export async function fetchStaticData(options) {
  const { appUrl, sourceUrl } = buildStaticDataRequestUrls(options);

  console.info("[Static Data] Data file URL:", appUrl);

  if (sourceUrl) {
    console.info("[Static Data] Source URL for updates:", sourceUrl);
  }

  try {
    if (staticDataCache.has(appUrl)) {
      return {
        data: staticDataCache.get(appUrl),
        url: sourceUrl,
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
      url: sourceUrl,
      requestUrl: appUrl,
    };
  } catch (error) {
    console.error("[Static Data] Failed to load static data file.", {
      requestUrl: appUrl,
      sourceUrl,
      indicatorCode: options.indicatorCode,
      error,
    });
    throw error;
  }
}
