import { economyProfileRankings, economyRankings } from "./economyRankings.js";
import { environmentRankings } from "./environmentRankings.js";
import { financeRankings } from "./financeRankings.js";
import { populationRankings } from "./populationRankings.js";
import { getCountryIndicatorLinks } from "./rankingLinks.js";
import { tradeRankings } from "./tradeRankings.js";

const categoryDefinitions = [
  {
    id: "economy",
    label: "Economy",
    navSelector: "#economyTopNav, #rankingTopNav",
    rankings: economyRankings,
    profileRankings: economyProfileRankings,
  },
  {
    id: "population",
    label: "Population",
    navSelector: "#populationTopNav",
    rankings: populationRankings,
  },
  {
    id: "environment",
    label: "Environment",
    navSelector: "#environmentTopNav",
    rankings: environmentRankings,
  },
  {
    id: "trade",
    label: "Trade",
    navSelector: "#tradeTopNav",
    rankings: tradeRankings,
  },
  {
    id: "finance",
    label: "Finance",
    navSelector: "#financeTopNav",
    rankings: financeRankings,
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
