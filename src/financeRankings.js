export const financeProfileRankings = [
  {
    seriesId: "governmentGrossDebt",
    directory: "government-gross-debt",
    label: "Government Gross Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    profileSection: "Government Debt",
  },
  {
    seriesId: "governmentGrossDebtNational",
    countryPageKind: "government-debt",
    profileSection: "Government Debt",
  },
  {
    seriesId: "governmentNetDebt",
    directory: "government-net-debt",
    label: "Government Net Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    profileSection: "Government Debt",
  },
  {
    seriesId: "governmentNetDebtNational",
    countryPageKind: "government-debt",
    profileSection: "Government Debt",
  },
  {
    seriesId: "fiscalBalance",
    directory: "fiscal-balance",
    label: "Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    profileSection: "Government Finance",
  },
  {
    seriesId: "fiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    profileSection: "Government Finance",
  },
  {
    seriesId: "primaryFiscalBalance",
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    profileSection: "Government Finance",
  },
  {
    seriesId: "primaryFiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    profileSection: "Government Finance",
  },
  {
    seriesId: "governmentRevenue",
    directory: "government-revenue",
    label: "Government Revenue (% of GDP)",
    countryPageKind: "government-revenue-expenditure",
    countryPageLabel: "Government Revenue and Expenditure",
    profileSection: "Government Finance",
  },
  {
    seriesId: "governmentRevenueNational",
    countryPageKind: "government-revenue-expenditure",
    profileSection: "Government Finance",
  },
  {
    seriesId: "governmentExpenditure",
    directory: "government-expenditure",
    label: "Government Expenditure (% of GDP)",
    countryPageKind: "government-revenue-expenditure",
    countryPageLabel: "Government Revenue and Expenditure",
    profileSection: "Government Finance",
  },
  {
    seriesId: "governmentExpenditureNational",
    countryPageKind: "government-revenue-expenditure",
    profileSection: "Government Finance",
  },
  {
    seriesId: "totalReservesIncludingGold",
    directory: "total-reserves",
    label: "Total Reserves",
    countryPageKind: "total-reserves",
    profileSection: "International Reserves",
  },
];

export const financeRankings = financeProfileRankings.filter(({ directory }) => directory);
