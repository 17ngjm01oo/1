export function countryBelongsToRegion(country, regionId) {
  if (!country.region) {
    return false;
  }

  return country.region
    .split("/")
    .map((region) => region.trim())
    .includes(regionId);
}

export function filterCountriesByScope(countryList, scope) {
  if (!scope || scope.type === "world") {
    return countryList;
  }

  if (scope.type === "region") {
    return countryList.filter((country) => countryBelongsToRegion(country, scope.id));
  }

  if (scope.type === "category") {
    return countryList.filter((country) => country.categories?.includes(scope.id));
  }

  return countryList;
}
