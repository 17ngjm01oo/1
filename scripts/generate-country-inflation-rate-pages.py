#!/usr/bin/env python3
from __future__ import annotations

import html
import re
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
COUNTRIES_FILE = ROOT_DIR / "src" / "countries.js"
OUTPUT_DIR = ROOT_DIR / "countries"


def main() -> None:
    countries = parse_countries(COUNTRIES_FILE.read_text(encoding="utf-8"))

    for country in countries:
        page_dir = OUTPUT_DIR / country["slug"] / "inflation-rate"
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(render_page(country), encoding="utf-8")

    print(f"Generated {len(countries)} inflation rate country pages.")


def parse_countries(source: str) -> list[dict[str, str]]:
    countries: list[dict[str, str]] = []

    for match in re.finditer(
        r'\{\s*code:\s*"(?P<code>[^"]+)",\s*name:\s*"(?P<name>[^"]+)",\s*slug:\s*"(?P<slug>[^"]+)"',
        source,
    ):
        countries.append(match.groupdict())

    return countries


def render_page(country: dict[str, str]) -> str:
    country_name = html.escape(country["name"])
    country_code = html.escape(country["code"])

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{country_name} Inflation Rate</title>
    <link rel="stylesheet" href="../../../styles.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js" defer></script>
    <script type="module" src="../../../src/countryIndicatorPage.js"></script>
  </head>
  <body data-country-code="{country_code}" data-page-kind="inflation-rate">
    <header class="site-header">
      <a class="site-home-link" href="../../../">HOME</a>
    </header>
    <main class="page-shell">
      <section class="top-nav-card" aria-label="Site navigation">
        <p class="top-nav-label">Economic Rankings:</p>
        <nav class="site-nav"></nav>
      </section>

      <section class="hub-section" aria-labelledby="country-hub-title">
        <header class="page-header">
          <h1 id="country-hub-title" class="page-title">Inflation Rate by Country</h1>
          <p class="subtitle">Choose a country to view inflation rate indicators. Inflation rate is the annual percentage change in the consumer price index.</p>
          <p class="source-label">Source: IMF World Economic Outlook.</p>
        </header>

        <div class="country-search-panel">
          <div class="search-input-wrap">
            <input
              id="countrySearchInput"
              class="country-search-input"
              type="search"
              autocomplete="off"
              placeholder="Search country or code&hellip;"
              aria-controls="countrySearchResults"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="false"
            />
          </div>
          <div class="filter-panel-row">
            <details class="category-panel" aria-labelledby="region-heading">
              <summary class="category-heading" id="region-heading">Regions</summary>
            </details>
            <details class="category-panel" aria-labelledby="category-heading">
              <summary class="category-heading" id="category-heading">Categories</summary>
            </details>
          </div>
          <div class="category-list filter-option-list" id="regionList" hidden></div>
          <div class="category-list filter-option-list" id="categoryList" hidden></div>
          <div class="country-results" id="countrySearchResults" role="listbox" aria-label="Country search results" hidden></div>
        </div>
      </section>

      <section class="indicators-section" aria-labelledby="country-data-title">
        <div class="indicators-card">
          <header class="page-header country-data-header">
            <h1 id="country-data-title">{country_name}</h1>
            <nav class="site-nav" id="countryRelatedPageNav" aria-label="Country page navigation"></nav>
          </header>

          <section class="indicator-block" aria-labelledby="inflationRate-title">
            <header class="indicator-header">
              <div class="indicator-title-group">
                <h2 id="inflationRate-title">Inflation Rate</h2>
                <p class="indicator-currency" id="inflationRateCurrency">Unit: %</p>
              </div>
              <div class="compare-control" data-series-id="inflationRate">
                <div class="compare-input-wrap">
                  <input
                    id="inflationRateCompareInput"
                    class="compare-search-input"
                    type="search"
                    autocomplete="off"
                    placeholder="Compare with..."
                    aria-controls="inflationRateCompareResults"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="false"
                  />
                  <button class="compare-remove" id="inflationRateCompareRemove" type="button" hidden aria-label="Remove Inflation Rate comparison">
                    &times;
                  </button>
                </div>
                <p class="compare-selected" id="inflationRateCompareSelected"></p>
                <div class="country-results compare-results" id="inflationRateCompareResults" role="listbox" aria-label="Inflation Rate comparison country results" hidden></div>
              </div>
            </header>

            <div class="chart-card" id="inflationRateChartCard">
              <canvas id="inflationRateChart" aria-label="Inflation Rate line chart" role="img"></canvas>
              <div class="chart-overlay" id="inflationRateOverlay" aria-hidden="true"></div>
            </div>

            <details class="data-table-toggle" id="inflationRateTableToggle">
              <summary>Show data table</summary>
              <div class="data-table-wrap" id="inflationRateTableWrap"></div>
            </details>
          </section>

          <footer class="shared-notes" aria-label="Chart notes">
            <p>Source: IMF World Economic Outlook.</p>
            <p>Data may include IMF estimates and projections.</p>
          </footer>
        </div>
      </section>
    </main>
  </body>
</html>
"""


if __name__ == "__main__":
    main()
