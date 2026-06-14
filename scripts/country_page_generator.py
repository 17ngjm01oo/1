from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path

from page_templates import render_rankings_top_nav


ROOT_DIR = Path(__file__).resolve().parents[1]
COUNTRIES_FILE = ROOT_DIR / "src" / "countries.js"
OUTPUT_DIR = ROOT_DIR / "countries"


@dataclass(frozen=True)
class IndicatorBlockConfig:
    series_id: str
    title: str
    canvas_label: str
    display_unit: str = ""
    compare_label: str | None = None


@dataclass(frozen=True)
class CountryPageConfig:
    page_kind: str
    title_suffix: str
    chart_title: str
    subtitle: str
    generated_label: str
    indicators: tuple[IndicatorBlockConfig, ...]
    related_nav_label: str = "Country page navigation"
    notes_label: str = "Chart notes"
    source_note: str | None = None
    source_note_overridable: bool = False
    data_note: str = ""


def generate_country_pages(config: CountryPageConfig) -> None:
    countries = parse_countries(COUNTRIES_FILE.read_text(encoding="utf-8"))

    for country in countries:
        page_dir = OUTPUT_DIR / country["slug"] / config.page_kind
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(render_country_page(country, config), encoding="utf-8")

    print(f"Generated {len(countries)} {config.generated_label} country pages.")


def parse_countries(source: str) -> list[dict[str, str]]:
    countries: list[dict[str, str]] = []

    for match in re.finditer(
        r'\{\s*code:\s*"(?P<code>[^"]+)",\s*name:\s*"(?P<name>[^"]+)",\s*slug:\s*"(?P<slug>[^"]+)"',
        source,
    ):
        countries.append(match.groupdict())

    return countries


def render_country_page(country: dict[str, str], config: CountryPageConfig) -> str:
    country_name = html.escape(country["name"])
    country_code = html.escape(country["code"])
    indicator_blocks = "\n\n".join(render_indicator_block(indicator) for indicator in config.indicators)
    notes_markup = render_notes(config)

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{country_name} {html.escape(config.title_suffix)}</title>
    <link rel="stylesheet" href="../../../styles.css" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js" defer></script>
    <script type="module" src="../../../src/countryIndicatorPage.js"></script>
  </head>
  <body data-country-code="{country_code}" data-page-kind="{html.escape(config.page_kind)}">
    <header class="site-header">
      <a class="site-home-link" href="../../../">HOME</a>
    </header>
    <main class="page-shell">
{render_rankings_top_nav()}

      <section class="hub-section" aria-labelledby="country-hub-title">
        <header class="page-header">
          <h1 id="country-hub-title" class="page-title">{html.escape(config.chart_title)}</h1>
        </header>

        <div class="country-search-panel">
          <div class="search-input-wrap">
            <input
              id="countrySearchInput"
              class="country-search-input"
              type="search"
              autocomplete="off"
              aria-controls="countrySearchResults"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded="false"
            />
            <div class="country-results" id="countrySearchResults" role="listbox" aria-label="Country search results" hidden></div>
          </div>
        </div>
      </section>

      <section class="indicators-section" aria-labelledby="country-data-title">
        <div class="indicators-card">
          <header class="page-header country-data-header">
            <h1 id="country-data-title">{country_name}</h1>
            <nav class="site-nav" id="countryRelatedPageNav" aria-label="{html.escape(config.related_nav_label)}"></nav>
          </header>

{indicator_blocks}

{notes_markup}
        </div>
      </section>
    </main>
  </body>
</html>
"""


def render_notes(config: CountryPageConfig) -> str:
    notes_markup = []
    if config.source_note:
        source_note_attribute = " data-primary-source-note" if config.source_note_overridable else ""
        notes_markup.append(f"            <p{source_note_attribute}>{html.escape(config.source_note)}</p>")
    if config.data_note:
        notes_markup.append(f"            <p>{html.escape(config.data_note)}</p>")

    return f"""          <footer class="shared-notes" aria-label="{html.escape(config.notes_label)}">
{chr(10).join(notes_markup)}
          </footer>"""


def render_indicator_block(indicator: IndicatorBlockConfig) -> str:
    compare_control = render_compare_control(indicator) if indicator.compare_label else ""
    title_markup = render_indicator_title(indicator)

    return f"""          <section class="indicator-block" aria-labelledby="{indicator.series_id}-title">
            <header class="indicator-header">
              <div class="indicator-title-group">
                <h2 id="{indicator.series_id}-title">{title_markup}</h2>
              </div>{compare_control}
            </header>

            <div class="chart-card" id="{indicator.series_id}ChartCard">
              <canvas id="{indicator.series_id}Chart" aria-label="{html.escape(indicator.canvas_label)}" role="img"></canvas>
              <div class="chart-overlay" id="{indicator.series_id}Overlay" aria-hidden="true"></div>
            </div>

            <details class="data-table-toggle" id="{indicator.series_id}TableToggle">
              <summary>Show data table</summary>
              <div class="data-table-wrap" id="{indicator.series_id}TableWrap"></div>
            </details>
          </section>"""


def render_indicator_title(indicator: IndicatorBlockConfig) -> str:
    label_markup = html.escape(indicator.title)

    info_button = render_indicator_info_button(indicator.series_id, indicator.title)

    if not indicator.display_unit:
        return f"{label_markup} {info_button}"

    return f'{label_markup} <span class="indicator-display-unit">({html.escape(indicator.display_unit)})</span> {info_button}'


def render_indicator_info_button(series_id: str, label: str) -> str:
    return (
        f'<button class="indicator-info-button" type="button" '
        f'data-indicator-info-series-id="{html.escape(series_id)}" '
        f'aria-label="{html.escape(label)} information">i</button>'
    )


def render_compare_control(indicator: IndicatorBlockConfig) -> str:
    compare_label = html.escape(indicator.compare_label or "")

    return f"""
              <div class="compare-control" data-series-id="{indicator.series_id}">
                <div class="compare-input-wrap">
                  <input
                    id="{indicator.series_id}CompareInput"
                    class="compare-search-input"
                    type="search"
                    autocomplete="off"
                    placeholder="Compare with..."
                    aria-controls="{indicator.series_id}CompareResults"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="false"
                  />
                </div>
                <p class="compare-selected" id="{indicator.series_id}CompareSelected"></p>
                <div class="country-results compare-results" id="{indicator.series_id}CompareResults" role="listbox" aria-label="{compare_label} comparison country results" hidden></div>
              </div>"""
