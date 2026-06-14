const indicatorInfoUrl = new URL("../data/indicator-info.json", import.meta.url);

let indicatorInfoDataPromise = null;

export function getIndicatorInfoData() {
  if (!indicatorInfoDataPromise) {
    indicatorInfoDataPromise = fetch(indicatorInfoUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load indicator info: ${response.status}`);
        }
        return response.json();
      })
      .catch(() => ({ rankings: {}, series: {} }));
  }

  return indicatorInfoDataPromise;
}

export function getIndicatorInfoBySeriesId(indicatorInfoData, seriesId) {
  return indicatorInfoData?.series?.[seriesId] ?? "";
}

export function getIndicatorInfoByRankingDirectory(indicatorInfoData, directory) {
  return indicatorInfoData?.rankings?.[directory] ?? "";
}
