export const societyProfileRankings = [
  {
    seriesId: "militarySpending",
    directory: "military-spending",
    label: "Military Spending",
    countryPageKind: "military-spending",
    countryPageLabel: "Military Spending",
    profileSection: "Defence",
  },
  {
    seriesId: "militarySpendingPercentGdp",
    directory: "military-spending-percent-gdp",
    label: "Military Spending (% of GDP)",
    countryPageKind: "military-spending",
    countryPageLabel: "Military Spending",
    profileSection: "Defence",
  },
];

export const societyRankings = societyProfileRankings.filter(({ directory }) => directory);
