from __future__ import annotations

import html

from country_page_generator import COUNTRIES_FILE, OUTPUT_DIR, parse_countries
from page_templates import render_rankings_top_nav


def generate_country_overview_pages() -> None:
    countries = parse_countries(COUNTRIES_FILE.read_text(encoding="utf-8"))

    for country in countries:
        page_dir = OUTPUT_DIR / country["slug"]
        page_dir.mkdir(parents=True, exist_ok=True)
        (page_dir / "index.html").write_text(render_country_overview_page(country), encoding="utf-8")

    print(f"Generated {len(countries)} country overview pages.")


def render_country_overview_page(country: dict[str, str]) -> str:
    country_name = html.escape(country["name"])
    country_code = html.escape(country["code"])

    return f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{country_name}</title>
    <link rel="stylesheet" href="../../styles.css" />
    <script type="module" src="../../src/countryOverviewPage.js"></script>
  </head>
  <body data-country-code="{country_code}" data-root-href="../../">
    <header class="site-header">
      <a class="site-home-link" href="../../">HOME</a>
    </header>
    <main class="page-shell">
{render_rankings_top_nav("rankingTopNav", "../../")}

      <section class="indicators-section" aria-labelledby="country-overview-title">
        <div class="indicators-card">
          <header class="page-header country-data-header">
            <h1 id="country-overview-title">{country_name}</h1>
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


if __name__ == "__main__":
    generate_country_overview_pages()
