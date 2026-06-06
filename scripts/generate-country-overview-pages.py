from __future__ import annotations

import html
from pathlib import Path

from country_page_generator import COUNTRIES_FILE, OUTPUT_DIR, parse_countries
from page_templates import render_rankings_top_nav


OVERVIEW_CATEGORY = {"id": "overview", "title": "Overview"}
PROFILE_CATEGORIES = (
    OVERVIEW_CATEGORY,
    {"id": "economy", "title": "Economy"},
    {"id": "population", "title": "Population"},
    {"id": "trade", "title": "Trade"},
    {"id": "finance", "title": "Finance"},
    {"id": "environment", "title": "Environment"},
)


def generate_country_overview_pages() -> None:
    countries = parse_countries(COUNTRIES_FILE.read_text(encoding="utf-8"))
    generated_pages = 0

    for country in countries:
        for category in PROFILE_CATEGORIES:
            page_dir = get_country_profile_page_dir(country, category["id"])
            page_dir.mkdir(parents=True, exist_ok=True)
            (page_dir / "index.html").write_text(
                render_country_overview_page(country, category),
                encoding="utf-8",
            )
            generated_pages += 1

    print(f"Generated {generated_pages} country profile pages for {len(countries)} countries.")


def get_country_profile_page_dir(country: dict[str, str], category_id: str) -> Path:
    page_dir = OUTPUT_DIR / country["slug"]
    return page_dir if category_id == OVERVIEW_CATEGORY["id"] else page_dir / "categories" / category_id


def render_country_overview_page(country: dict[str, str], category: dict[str, str]) -> str:
    country_name = html.escape(country["name"])
    country_code = html.escape(country["code"])
    category_id = html.escape(category["id"])
    page_title = get_country_profile_page_title(country_name, category)
    root_href = "../../" if category["id"] == OVERVIEW_CATEGORY["id"] else "../../../../"
    country_root_href = "./" if category["id"] == OVERVIEW_CATEGORY["id"] else "../../"

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{page_title}</title>
    <link rel="stylesheet" href="{root_href}styles.css" />
    <script type="module" src="{root_href}src/countryOverviewPage.js"></script>
  </head>
  <body data-country-code="{country_code}" data-root-href="{root_href}" data-country-root-href="{country_root_href}" data-country-overview-category="{category_id}">
    <header class="site-header">
      <a class="site-home-link" href="{root_href}">HOME</a>
    </header>
    <main class="page-shell">
{render_rankings_top_nav()}

      <section class="indicators-section" aria-labelledby="country-overview-title">
        <div class="indicators-card">
          <header class="page-header country-data-header">
            <h1 id="country-overview-title">{page_title}</h1>
          </header>

          <div class="country-overview-groups" id="countryOverviewGroups" aria-live="polite">
            <p class="ranking-empty">Loading country data...</p>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>
"""


def get_country_profile_page_title(country_name: str, category: dict[str, str]) -> str:
    if category["id"] == OVERVIEW_CATEGORY["id"]:
        return country_name

    return f"{html.escape(category['title'])} of {country_name}"


if __name__ == "__main__":
    generate_country_overview_pages()
