function defineDataSource(config) {
  return {
    ...config,
    rankingStaticDataPath: config.rankingStaticDataPath ?? config.staticDataPath.replace(/^\.\//, "../"),
  };
}

export const dataSources = {
  weoCurrentPrices: defineDataSource({
    dataSource: "IMF World Economic Outlook",
    dataset: "WEO",
    staticDataPath: "./data/weo/current-prices.json",
    sourceUrl: "https://data.imf.org/-/media/iData/External-Storage/Documents/2F78EE59F79143A7921E5E203D3AAA80/en/WEOApr2026all.xlsx",
    startYear: 1980,
    endYear: 2026,
    subtitle: "IMF World Economic Outlook, 1980-2026",
  }),
  unctadGoodsTrade: defineDataSource({
    dataSource: "UNCTADstat",
    dataset: "UNCTAD Goods Trade",
    staticDataPath: "./data/unctad/goods-trade.json",
    sourceUrl: "https://unctadstat.unctad.org/datacentre/",
    startYear: 1948,
    endYear: 2025,
    subtitle: "UNCTADstat, 1948-2025",
  }),
  worldBankWdi: defineDataSource({
    dataSource: "World Bank",
    dataset: "World Development Indicators",
    staticDataPath: "./data/world-bank/total-reserves.json",
    sourceUrl: "https://data.worldbank.org/indicator/FI.RES.TOTL.CD",
    startYear: 1960,
    endYear: 2024,
    subtitle: "World Bank World Development Indicators, 1960-2024",
  }),
  worldBankPopulation: defineDataSource({
    dataSource: "World Bank",
    dataset: "World Development Indicators",
    staticDataPath: "./data/world-bank/population-demographics.json",
    sourceUrl: "https://databank.worldbank.org/source/world-development-indicators",
    startYear: 1960,
    endYear: 2024,
    subtitle: "World Bank World Development Indicators, 1960-2024",
  }),
  worldBankEnvironment: defineDataSource({
    dataSource: "World Bank",
    dataset: "World Development Indicators",
    staticDataPath: "./data/world-bank/environment.json",
    sourceUrl: "https://databank.worldbank.org/source/world-development-indicators",
    startYear: 1961,
    endYear: 2023,
    subtitle: "World Bank World Development Indicators, 1961-2023",
  }),
  ciaWorldFactbook: defineDataSource({
    dataSource: "CIA",
    dataset: "The World Factbook",
    staticDataPath: "./data/cia/area.json",
    sourceUrl: "https://www.cia.gov/the-world-factbook/",
    startYear: 2025,
    endYear: 2025,
    subtitle: "CIA World Factbook, 2025",
  }),
};
