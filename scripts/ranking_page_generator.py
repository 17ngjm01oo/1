from __future__ import annotations

import html
import json
import re
from pathlib import Path

from page_templates import render_rankings_top_nav


ROOT = Path(__file__).resolve().parents[1]
COUNTRIES_JS = ROOT / "src" / "countries.js"
INDICATOR_INFO_JSON = ROOT / "data" / "indicator-info.json"
_indicator_info_data: dict[str, dict[str, str]] | None = None


def generate_ranking_pages(ranking_types: list[dict[str, str]]) -> None:
    scopes = build_scopes()

    for ranking_type in ranking_types:
        write_ranking_page(ranking_type, scopes[0], is_base_page=True)
        for scope in scopes:
            write_ranking_page(ranking_type, scope, is_base_page=False)


def build_scopes() -> list[dict[str, str]]:
    return [
        {"type": "world", "id": "WORLD", "label": "World", "slug": "world"},
        *[
            {"type": "region", "id": item["id"], "label": item["label"], "slug": slugify(item["label"])}
            for item in parse_exported_list("countryRegions")
        ],
        *[
            {"type": "category", "id": item["id"], "label": item["label"], "slug": slugify(item["label"])}
            for item in parse_exported_list("countryCategories")
        ],
    ]


def parse_exported_list(export_name: str) -> list[dict[str, str]]:
    source = COUNTRIES_JS.read_text()
    match = re.search(rf"export const {export_name} = \[(.*?)\];", source, re.DOTALL)
    if not match:
        raise ValueError(f"Could not find {export_name} in {COUNTRIES_JS}")

    return [
        {"id": id_value, "label": label_value}
        for id_value, label_value in re.findall(
            r'\{\s*id:\s*"([^"]+)",\s*label:\s*"([^"]+)"\s*\}',
            match.group(1),
        )
    ]


def write_ranking_page(ranking_type: dict[str, str], scope: dict[str, str], is_base_page: bool) -> None:
    directory = ROOT / "rankings" / ranking_type["directory"]
    if not is_base_page:
        directory = directory / scope["slug"]

    directory.mkdir(parents=True, exist_ok=True)
    (directory / "index.html").write_text(
        render_ranking_page(ranking_type, scope, is_base_page),
        encoding="utf-8",
    )


def render_ranking_page(ranking_type: dict[str, str], scope: dict[str, str], is_base_page: bool) -> str:
    root_href = "../../" if is_base_page else "../../../"
    ranking_base_href = "./" if is_base_page else "../"
    page_title = f"{ranking_type['title']} - {scope['label']}"
    subtitle_markup = render_subtitle(ranking_type["directory"])
    source_note = ranking_type.get("source_note", "")
    data_note = ranking_type.get("data_note", "")
    notes_markup = "\n".join(
        f"          <p>{escape(note)}</p>"
        for note in (source_note, data_note)
        if note
    )

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{escape(page_title)}</title>
    <link rel="stylesheet" href="{root_href}styles.css" />
    <script type="module" src="{root_href}src/{ranking_type["script"]}"></script>
  </head>
  <body
    data-root-href="{root_href}"
    data-ranking-directory="{escape(ranking_type["directory"])}"
    data-ranking-base-href="{ranking_base_href}"
    data-ranking-scope-type="{escape(scope["type"])}"
    data-ranking-scope-id="{escape(scope["id"])}"
    data-ranking-scope-label="{escape(scope["label"])}"
    data-ranking-scope-slug="{escape(scope["slug"])}"
  >
    <header class="site-header">
      <a class="site-home-link" href="{root_href}">HOME</a>
    </header>
    <main class="page-shell ranking-page">
{render_rankings_top_nav()}

      <section class="hub-section" aria-labelledby="ranking-title">
        <header class="page-header">
          <h1 id="ranking-title" class="page-title ranking-page-title">{escape(ranking_type["title"])}</h1>
{subtitle_markup}
        </header>

        <div class="ranking-filter-panel">
          <div class="country-search-panel ranking-country-search-panel">
            <div class="search-input-wrap">
              <input
                id="rankingCountrySearchInput"
                class="country-search-input"
                type="search"
                autocomplete="off"
                aria-controls="rankingCountrySearchResults"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="false"
              />
              <div
                class="country-results"
                id="rankingCountrySearchResults"
                role="listbox"
                aria-label="Country search results"
                hidden
              ></div>
            </div>
          </div>
          <p class="filter-label">Filter by:</p>
          <div class="filter-panel-row">
            <details class="category-panel" aria-labelledby="ranking-region-heading">
              <summary class="category-heading" id="ranking-region-heading">Regions</summary>
            </details>
            <details class="category-panel" aria-labelledby="ranking-category-heading">
              <summary class="category-heading" id="ranking-category-heading">Categories</summary>
            </details>
          </div>
          <div class="category-list filter-option-list" id="rankingRegionList" hidden></div>
          <div class="category-list filter-option-list" id="rankingCategoryList" hidden></div>
        </div>
      </section>

      <section class="ranking-card" aria-labelledby="ranking-table-title">
        <header class="ranking-card-header">
          <h2 id="ranking-table-title">Scope: {escape(scope["label"])}</h2>
          <p id="rankingCount" class="ranking-count" aria-live="polite">Loading ranking data...</p>
        </header>

        <div class="ranking-table-wrap">
          <table class="ranking-table">
            <tbody id="rankingTableBody"></tbody>
          </table>
        </div>

        <footer class="shared-notes ranking-notes" aria-label="Ranking notes">
{notes_markup}
        </footer>
      </section>
    </main>
  </body>
</html>
"""


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def escape(value: str) -> str:
    return html.escape(value, quote=True)


def render_subtitle(ranking_directory: str) -> str:
    subtitle = get_ranking_info(ranking_directory)
    if not subtitle:
        return ""

    return f'          <p class="subtitle">{escape(subtitle)}</p>'


def get_ranking_info(ranking_directory: str) -> str:
    return load_indicator_info().get("rankings", {}).get(ranking_directory, "")


def load_indicator_info() -> dict[str, dict[str, str]]:
    global _indicator_info_data

    if _indicator_info_data is None:
        _indicator_info_data = json.loads(INDICATOR_INFO_JSON.read_text(encoding="utf-8"))

    return _indicator_info_data
