import { seriesConfigs } from "./config.js";
import { rankingCategories } from "./rankingCategories.js";

const seriesConfigById = new Map(seriesConfigs.map((config) => [config.id, config]));

export function getCountryOverviewChartLinks({ currentPageKind = "" } = {}) {
  const linksByPageKind = new Map();

  for (const category of rankingCategories) {
    for (const ranking of category.overviewRankings) {
      const pageKind = ranking.countryPageKind;

      if (!pageKind || pageKind === currentPageKind || linksByPageKind.has(pageKind)) {
        continue;
      }

      linksByPageKind.set(pageKind, {
        pageKind,
        label: getCountryPageLinkLabel(ranking),
      });
    }
  }

  return Array.from(linksByPageKind.values());
}

function getCountryPageLinkLabel(ranking) {
  const seriesConfig = seriesConfigById.get(ranking.seriesId);
  return ranking.countryPageLabel ?? seriesConfig?.titleTemplate ?? ranking.label ?? "";
}
