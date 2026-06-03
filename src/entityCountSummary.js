import { isTerritory } from "./countryTypes.js";

export function renderEntityCountSummary(element, items = []) {
  if (!element) {
    return;
  }

  const { totalCount, countryCount, territoryCount } = getEntityCounts(items);
  element.textContent = `Showing: ${totalCount} (${formatCount(
    countryCount,
    "country",
    "countries",
  )}, ${formatCount(territoryCount, "territory", "territories")})`;
}

function getEntityCounts(items) {
  const totalCount = items.length;
  const territoryCount = items.filter(isTerritory).length;
  const countryCount = totalCount - territoryCount;

  return { totalCount, countryCount, territoryCount };
}

function formatCount(count, singularLabel, pluralLabel) {
  return `${count} ${count === 1 ? singularLabel : pluralLabel}`;
}
