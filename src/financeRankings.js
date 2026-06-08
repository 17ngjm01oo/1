export const financeProfileRankings = [
  {
    seriesId: "governmentGrossDebt",
    directory: "government-gross-debt",
    label: "Government Gross Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    profileSection: "Public Debt",
  },
  {
    seriesId: "governmentGrossDebtNational",
    countryPageKind: "government-debt",
    profileSection: "Public Debt",
  },
  {
    seriesId: "governmentNetDebt",
    directory: "government-net-debt",
    label: "Government Net Debt (% of GDP)",
    countryPageKind: "government-debt",
    countryPageLabel: "Government Debt",
    profileSection: "Public Debt",
  },
  {
    seriesId: "governmentNetDebtNational",
    countryPageKind: "government-debt",
    profileSection: "Public Debt",
  },
  {
    seriesId: "fiscalBalance",
    directory: "fiscal-balance",
    label: "Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    profileSection: "Fiscal Balance",
  },
  {
    seriesId: "fiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    profileSection: "Fiscal Balance",
  },
  {
    seriesId: "primaryFiscalBalance",
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance (% of GDP)",
    countryPageKind: "fiscal-balance",
    countryPageLabel: "Fiscal Balance",
    profileSection: "Fiscal Balance",
  },
  {
    seriesId: "primaryFiscalBalanceNational",
    countryPageKind: "fiscal-balance",
    profileSection: "Fiscal Balance",
  },
  {
    seriesId: "governmentRevenue",
    directory: "government-revenue",
    label: "Government Revenue (% of GDP)",
    countryPageKind: "government-revenue-expenditure",
    countryPageLabel: "Government Revenue and Expenditure",
    profileSection: "Revenue and Expenditure",
  },
  {
    seriesId: "governmentRevenueNational",
    countryPageKind: "government-revenue-expenditure",
    profileSection: "Revenue and Expenditure",
  },
  {
    seriesId: "governmentExpenditure",
    directory: "government-expenditure",
    label: "Government Expenditure (% of GDP)",
    countryPageKind: "government-revenue-expenditure",
    countryPageLabel: "Government Revenue and Expenditure",
    profileSection: "Revenue and Expenditure",
  },
  {
    seriesId: "governmentExpenditureNational",
    countryPageKind: "government-revenue-expenditure",
    profileSection: "Revenue and Expenditure",
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
