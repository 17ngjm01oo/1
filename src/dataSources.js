export const dataSources = {
  weoCurrentPrices: {
    dataSource: "IMF World Economic Outlook",
    dataset: "WEO",
    staticDataPath: "./data/weo/current-prices.json",
    rankingStaticDataPath: "../data/weo/current-prices.json",
    sourceUrl: "https://data.imf.org/-/media/iData/External-Storage/Documents/2F78EE59F79143A7921E5E203D3AAA80/en/WEOApr2026all.xlsx",
    startYear: 1980,
    endYear: 2026,
    subtitle: "IMF World Economic Outlook, 1980-2026",
  },
  unctadGoodsTrade: {
    dataSource: "UNCTADstat",
    dataset: "UNCTAD Goods Trade",
    staticDataPath: "./data/unctad/goods-trade.json",
    rankingStaticDataPath: "../data/unctad/goods-trade.json",
    sourceUrl: "https://unctadstat.unctad.org/datacentre/",
    startYear: 1948,
    endYear: 2025,
    subtitle: "UNCTADstat, 1948-2025",
  },
};
