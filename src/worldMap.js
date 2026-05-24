import { geoEqualEarth, geoGraticule10, geoPath } from "https://cdn.jsdelivr.net/npm/d3-geo@3/+esm";
import { feature } from "https://cdn.jsdelivr.net/npm/topojson-client@3/+esm";

const MAP_WIDTH = 960;
const MAP_HEIGHT = 420;
const MAP_PADDING = 18;

export async function renderWorldMap({
  containerSelector = "#worldMap",
  dataUrl = "../data/geo/countries-110m.json",
} = {}) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    return;
  }

  try {
    const topology = await fetchTopology(dataUrl);
    const countries = feature(topology, topology.objects.countries);
    const projection = geoEqualEarth().fitExtent(
      [
        [MAP_PADDING, MAP_PADDING],
        [MAP_WIDTH - MAP_PADDING, MAP_HEIGHT - MAP_PADDING],
      ],
      countries,
    );
    const path = geoPath(projection);
    const svg = createSvg();

    appendPath(svg, path({ type: "Sphere" }), "world-map-sphere");
    appendPath(svg, path(geoGraticule10()), "world-map-graticule");

    for (const country of countries.features) {
      appendPath(svg, path(country), "world-map-country");
    }

    container.replaceChildren(svg);
  } catch (error) {
    console.error("[World map] Failed to render map.", error);
    container.replaceChildren(createMapError());
  }
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
    return;
  }

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", className);
  path.setAttribute("d", pathData);
  svg.append(path);
}

function createMapError() {
  const message = document.createElement("p");
  message.className = "world-map-error";
  message.textContent = "Map data could not be loaded.";
  return message;
}
