import { economyIndicatorLinks, economyRankings } from "./economyRankings.js";
import { environmentIndicatorLinks, environmentRankings } from "./environmentRankings.js";
import { financeIndicatorLinks, financeRankings } from "./financeRankings.js";
import { populationIndicatorLinks, populationRankings } from "./populationRankings.js";
import { tradeIndicatorLinks, tradeRankings } from "./tradeRankings.js";

export const rankingCategories = [
  {
    id: "economy",
    label: "Economy",
    navSelector: "#economyTopNav, #rankingTopNav",
    rankings: economyRankings,
    indicatorLinks: economyIndicatorLinks,
  },
  {
    id: "population",
    label: "Population",
    navSelector: "#populationTopNav",
    rankings: populationRankings,
    indicatorLinks: populationIndicatorLinks,
  },
  {
    id: "environment",
    label: "Environment",
    navSelector: "#environmentTopNav",
    rankings: environmentRankings,
    indicatorLinks: environmentIndicatorLinks,
  },
  {
    id: "trade",
    label: "Trade",
    navSelector: "#tradeTopNav",
    rankings: tradeRankings,
    indicatorLinks: tradeIndicatorLinks,
  },
  {
    id: "finance",
    label: "Finance",
    navSelector: "#financeTopNav",
    rankings: financeRankings,
    indicatorLinks: financeIndicatorLinks,
  },
];

export const rankingCategoryById = Object.fromEntries(
  rankingCategories.map((category) => [category.id, category]),
);

export const countryPageRankings = rankingCategories
  .flatMap((category) => category.rankings)
  .filter((ranking) => ranking.countryPageKind);
