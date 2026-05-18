from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COUNTRIES_JS = ROOT / "src" / "countries.js"

RANKING_TYPE = {
    "directory": "population",
    "title": "Population Ranking by Country",
    "script": "populationRanking.js",
    "table_title": "Population Ranking",
}


def main() -> None:
    scopes = build_scopes()
    write_ranking_page(RANKING_TYPE, scopes[0], is_base_page=True)

    for scope in scopes:
        write_ranking_page(RANKING_TYPE, scope, is_base_page=False)


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
        render_page(ranking_type, scope, is_base_page),
        encoding="utf-8",
    )


def render_page(ranking_type: dict[str, str], scope: dict[str, str], is_base_page: bool) -> str:
    root_href = "../../" if is_base_page else "../../../"
    ranking_base_href = "./" if is_base_page else "../"
    page_title = f"{ranking_type['title']} - {scope['label']}"

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
      <section class="top-nav-card" aria-label="Site navigation">
        <details class="top-nav-disclosure">
          <summary class="top-nav-label">Economic Rankings</summary>
          <nav class="site-nav" id="rankingTopNav"></nav>
        </details>
        <details class="top-nav-disclosure">
          <summary class="top-nav-label">Population Rankings</summary>
          <nav class="site-nav" id="populationTopNav"></nav>
        </details>
      </section>

      <section class="hub-section" aria-labelledby="ranking-title">
        <header class="page-header">
          <h1 id="ranking-title" class="page-title">{escape(page_title)}</h1>
        </header>

        <div class="ranking-filter-panel">
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
          <h2 id="ranking-table-title">{escape(ranking_type["table_title"])}</h2>
          <p id="rankingSummary" class="ranking-summary" aria-live="polite">Loading ranking data...</p>
          <p id="rankingCount" class="ranking-count" aria-live="polite"></p>
        </header>

        <div class="ranking-table-wrap">
          <table class="ranking-table">
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Flag</th>
                <th scope="col">Country</th>
                <th scope="col">Value</th>
                <th scope="col">Year</th>
              </tr>
            </thead>
            <tbody id="rankingTableBody"></tbody>
          </table>
        </div>

        <footer class="shared-notes ranking-notes" aria-label="Ranking notes">
          <p>Source: IMF World Economic Outlook.</p>
          <p>Data may include IMF estimates and projections.</p>
          <p>Countries with no available IMF data are excluded from the ranking.</p>
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


if __name__ == "__main__":
    main()
