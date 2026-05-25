import { geoEqualEarth, geoPath } from "https://cdn.jsdelivr.net/npm/d3-geo@3/+esm";
import { feature } from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";
import { getFlagEmoji } from "./flags.js";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 420;
const MAP_PADDING = -18;
const MAP_DATA_PATH = "data/geo/countries-50m.json";
const hoverTooltipMedia = window.matchMedia("(hover: hover) and (pointer: fine)");
const REGION_COLORS = {
  Asia: "#C2A947",
  Europe: "#857CB8",
  Africa: "#C18458",
  "North America": "#5A91C9",
  "South America": "#6E9F74",
  Oceania: "#C97874",
};
const REGION_FOCUS_BOUNDS = {
  Asia: [40, -8, 155, 58],
  Europe: [-25, 34, 60, 72],
  Africa: [-17, -34, 53, 35],
  "North America": [-172, 7, -52, 72],
  "South America": [-82, -39, -34, 14],
  Oceania: [112, -45, 180, -2],
};
const COUNTRY_FOCUS_BOUNDS = {
  USA: [-172, 7, -52, 72],
  FRA: [-6, 41, 10, 52],
  ESP: [-10, 35, 5, 44],
  PRT: [-10, 36, -6, 43],
  NLD: [3, 50, 8, 54],
  RUS: [18, 40, 106, 72],
  FJI: [175, -22, 180, -12],
  KIR: [170, 0, 177, 5],
  TUV: [176, -11, 180, -5],
  GUF: [-55, 2, -51, 6],
  NZL: [165, -48, 180, -33],
};

export async function renderWorldMap({
  containerSelector = "#worldMap",
  countryList = [],
  rootHref = "../",
  dataUrl = `${rootHref}${MAP_DATA_PATH}`,
  focusCountryCode = "",
} = {}) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    return;
  }

  try {
    const topology = await fetchTopology(dataUrl);
    const mapCountries = feature(topology, topology.objects.countries);
    const countryLookup = buildCountryLookup(countryList, rootHref);
    const svg = createSvg();
    const tooltip = createMapTooltip();

    container.replaceChildren(svg, tooltip);
    renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, focusCountryCode });

    return {
      focusRegion(regionId) {
        hideMapTooltip(tooltip);
        renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, regionId });
      },
      focusCountry(countryCode) {
        hideMapTooltip(tooltip);
        renderMapPaths({ svg, tooltip, container, mapCountries, countryLookup, focusCountryCode: countryCode });
      },
    };
  } catch (error) {
    console.error("[World map] Failed to render map.", error);
    container.replaceChildren(createMapError());
  }
}

function renderMapPaths({
  svg,
  tooltip,
  container,
  mapCountries,
  countryLookup,
  regionId = "",
  focusCountryCode = "",
}) {
  const projection = geoEqualEarth().fitExtent(
    [
      [MAP_PADDING, MAP_PADDING],
      [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
    ],
    getCountryFocusGeometry(focusCountryCode, mapCountries, countryLookup) ?? getFocusGeometry(regionId) ?? mapCountries,
  );
  const path = geoPath(projection);

  svg.replaceChildren();
  appendPath(svg, path({ type: "Sphere" }), "world-map-sphere");

  for (const country of mapCountries.features) {
    const mapName = country.properties?.name ?? "";
    const countryRecord = findCountryRecord(country, countryLookup);
    const countryPath = appendPath(svg, path(country), "world-map-country");

    if (countryPath && countryRecord) {
      colorCountryPath(countryPath, countryRecord.country);
      makeCountryPathClickable(countryPath, countryRecord, mapName, container, tooltip);
    }
  }
}

function getCountryFocusGeometry(countryCode, mapCountries, countryLookup) {
  if (!countryCode) {
    return null;
  }

  const bounds = COUNTRY_FOCUS_BOUNDS[countryCode];

  if (bounds) {
    return createBoundsPoints(bounds);
  }

  return mapCountries.features.find((country) => {
    const countryRecord = findCountryRecord(country, countryLookup);
    return countryRecord?.country.code === countryCode;
  }) ?? null;
}

function getFocusGeometry(regionId) {
  const bounds = REGION_FOCUS_BOUNDS[regionId];

  if (!bounds) {
    return null;
  }

  return createBoundsPoints(bounds);
}

function createBoundsPoints([west, south, east, north]) {
  return {
    type: "MultiPoint",
    coordinates: [
      [west, south],
      [east, south],
      [east, north],
      [west, north],
    ],
  };
}

async function fetchTopology(dataUrl) {
  const response = await fetch(dataUrl, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Map data request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function createSvg() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "world-map-svg");
  svg.setAttribute("viewBox", `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "World map");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  return svg;
}

function appendPath(svg, pathData, className) {
  if (!pathData) {
    return null;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", className);
  path.setAttribute("d", pathData);
  svg.append(path);
  return path;
}

function buildCountryLookup(countryList, rootHref) {
  return countryList.reduce((lookup, country) => {
    const mapId = normalizeMapId(country.externalIds?.unctad?.m49);

    if (!country.slug) {
      return lookup;
    }

    const href = `${rootHref}countries/${country.slug}/`;
    const record = { country, href };

    if (mapId) {
      lookup.byId.set(mapId, record);
    }

    [country.name, country.officialName, ...(country.aliases ?? [])].forEach((name) => {
      const normalizedName = normalizeName(name);

      if (normalizedName) {
        lookup.byName.set(normalizedName, record);
      }
    });

    return lookup;
  }, { byId: new Map(), byName: new Map() });
}

function findCountryRecord(mapCountry, countryLookup) {
  return countryLookup.byId.get(normalizeMapId(mapCountry.id))
    ?? countryLookup.byName.get(normalizeName(mapCountry.properties?.name));
}

function colorCountryPath(path, country) {
  const color = REGION_COLORS[country.region?.trim()];

  if (color) {
    path.style.setProperty("--world-map-country-fill", color);
  }
}

function normalizeMapId(mapId) {
  return mapId === undefined || mapId === null
    ? ""
    : String(mapId).padStart(3, "0");
}

function normalizeName(name) {
  return typeof name === "string"
    ? name.trim().toLowerCase()
    : "";
}

function makeCountryPathClickable(path, countryRecord, mapName = "country", container, tooltip) {
  const { country, href } = countryRecord;
  const countryName = country.name || mapName;

  path.classList.add("is-clickable");
  path.setAttribute("role", "link");
  path.setAttribute("tabindex", "0");
  path.setAttribute("aria-label", `Open ${countryName} country page`);
  path.addEventListener("mouseenter", (event) => {
    if (!canShowMapTooltip()) {
      return;
    }

    showMapTooltip(tooltip, container, country, event);
  });
  path.addEventListener("mousemove", (event) => {
    if (!canShowMapTooltip() || tooltip.hidden) {
      return;
    }

    positionMapTooltip(tooltip, container, event);
  });
  path.addEventListener("mouseleave", () => {
    hideMapTooltip(tooltip);
  });
  path.addEventListener("focus", () => {
    if (!canShowMapTooltip()) {
      hideMapTooltip(tooltip);
      return;
    }

    showMapTooltip(tooltip, container, country, null, path);
  });
  path.addEventListener("blur", () => {
    hideMapTooltip(tooltip);
  });
  path.addEventListener("click", () => {
    window.location.href = href;
  });
  path.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    window.location.href = href;
  });
}

function canShowMapTooltip() {
  return hoverTooltipMedia.matches;
}

function createMapTooltip() {
  const tooltip = document.createElement("div");
  tooltip.className = "world-map-tooltip";
  tooltip.hidden = true;

  const flag = document.createElement("span");
  flag.className = "world-map-tooltip-flag";

  const name = document.createElement("span");
  name.className = "world-map-tooltip-name";

  tooltip.append(flag, name);
  return tooltip;
}

function showMapTooltip(tooltip, container, country, event = null, path = null) {
  tooltip.querySelector(".world-map-tooltip-flag").textContent = getFlagEmoji(country.code);
  tooltip.querySelector(".world-map-tooltip-name").textContent = country.name;
  tooltip.hidden = false;

  if (event) {
    positionMapTooltip(tooltip, container, event);
    return;
  }

  if (path) {
    positionMapTooltipAtElement(tooltip, container, path);
  }
}

function hideMapTooltip(tooltip) {
  tooltip.hidden = true;
}

function positionMapTooltip(tooltip, container, event) {
  const containerRect = container.getBoundingClientRect();
  setMapTooltipPosition(
    tooltip,
    container,
    event.clientX - containerRect.left,
    event.clientY - containerRect.top,
  );
}

function positionMapTooltipAtElement(tooltip, container, element) {
  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  setMapTooltipPosition(
    tooltip,
    container,
    elementRect.left + elementRect.width / 2 - containerRect.left,
    elementRect.top + elementRect.height / 2 - containerRect.top,
  );
}

function setMapTooltipPosition(tooltip, container, x, y) {
  const offset = 14;
  const maxLeft = container.clientWidth - tooltip.offsetWidth - offset;
  const maxTop = container.clientHeight - tooltip.offsetHeight - offset;
  const left = Math.min(Math.max(x + offset, offset), Math.max(maxLeft, offset));
  const top = Math.min(Math.max(y + offset, offset), Math.max(maxTop, offset));

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function createMapError() {
  const message = document.createElement("p");
  message.className = "world-map-error";
  message.textContent = "Map data could not be loaded.";
  return message;
}
