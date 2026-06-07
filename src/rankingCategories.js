import { economyProfileRankings, economyRankings } from "./economyRankings.js";
import { environmentRankings } from "./environmentRankings.js";
import { financeProfileRankings, financeRankings } from "./financeRankings.js";
import { populationRankings } from "./populationRankings.js";
import { getCountryIndicatorLinks } from "./rankingLinks.js";
import { tradeRankings } from "./tradeRankings.js";

function pickRankings(rankings, seriesIds) {
  const rankingBySeriesId = new Map(rankings.map((ranking) => [ranking.seriesId, ranking]));
  return seriesIds.map((seriesId) => rankingBySeriesId.get(seriesId)).filter(Boolean);
}

const categoryDefinitions = [
  {
    id: "economy",
    label: "Economy",
    navSelector: "#economyTopNav, #rankingTopNav",
    rankings: economyRankings,
    overviewRankings: pickRankings(economyRankings, ["gdp", "gdpPerCapita"]),
    profileRankings: economyProfileRankings,
  },
  {
    id: "population",
    label: "Population",
    navSelector: "#populationTopNav",
    rankings: populationRankings,
    overviewRankings: pickRankings(populationRankings, [
      "population",
      "fertilityRate",
      "unemploymentRate",
    ]),
  },
  {
    id: "trade",
    label: "Trade",
    navSelector: "#tradeTopNav",
    rankings: tradeRankings,
    overviewRankings: pickRankings(tradeRankings, [
      "goodsTradeBalance",
      "goodsExports",
      "goodsImports",
    ]),
  },
  {
    id: "finance",
    label: "Finance",
    navSelector: "#financeTopNav",
    rankings: financeRankings,
    overviewRankings: pickRankings(financeRankings, [
      "governmentGrossDebt",
      "totalReservesIncludingGold",
    ]),
    profileRankings: financeProfileRankings,
  },
  {
    id: "environment",
    label: "Environment",
    navSelector: "#environmentTopNav",
    rankings: environmentRankings,
    overviewRankings: pickRankings(environmentRankings, ["area"]),
  },
];

export const rankingCategories = categoryDefinitions.map((category) => ({
  ...category,
  overviewRankings: category.overviewRankings ?? category.rankings,
  profileRankings: category.profileRankings ?? category.rankings,
  indicatorLinks: getCountryIndicatorLinks(category.rankings),
}));

export const rankingCategoryById = Object.fromEntries(
  rankingCategories.map((category) => [category.id, category]),
);

export const countryPageRankings = rankingCategories
  .flatMap((category) => category.rankings)
  .filter((ranking) => ranking.countryPageKind);
