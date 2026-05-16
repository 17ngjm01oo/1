export const selectedCountryCode = "USA";

export const seriesConfigs = [
  {
    id: "gdp",
    canvasId: "gdpChart",
    chartCardId: "gdpChartCard",
    overlayId: "gdpOverlay",
    statusId: "gdpStatus",
    dataSource: "IMF DataMapper API",
    dataset: "WEO",
    indicatorCode: "NGDPD",
    startYear: 1980,
    endYear: 2026,
    projectionYear: 2026,
    titleTemplate: "GDP, current prices",
    subtitle: "IMF World Economic Outlook, 1980-2026",
    unitLabel: "Billions of U.S. dollars",
    tooltipPrefix: "$",
    valueScaleMode: "gdpMagnitude",
    maximumFractionDigits: 2,
  },
  {
    id: "gdpPerCapita",
    canvasId: "gdpPerCapitaChart",
    chartCardId: "gdpPerCapitaChartCard",
    overlayId: "gdpPerCapitaOverlay",
    statusId: "gdpPerCapitaStatus",
    dataSource: "IMF DataMapper API",
    dataset: "WEO",
    indicatorCode: "NGDPDPC",
    startYear: 1980,
    endYear: 2026,
    projectionYear: 2026,
    titleTemplate: "GDP per capita, current prices",
    subtitle: "IMF World Economic Outlook, 1980-2026",
    unitLabel: "U.S. dollars per person",
    tickPrefix: "$",
    tooltipPrefix: "$",
    tooltipUnit: "",
    maximumFractionDigits: 0,
  },
];

export const dataSources = {
  imfDataMapper: {
    // Keep this centralized for future SDMX or alternate DataMapper version migration.
    baseUrl: "https://www.imf.org/external/datamapper/api/v1",
    proxyPath: "/api/imf",
    useLocalProxy: "localOnly",
  },
};
