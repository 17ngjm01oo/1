from __future__ import annotations


def render_rankings_top_nav(economic_nav_id: str) -> str:
    return f"""      <section class="top-nav-card" aria-label="Site navigation">
        <details class="top-nav-disclosure">
          <summary class="top-nav-label">Country Rankings</summary>
          <div class="top-nav-group">
            <details class="top-nav-disclosure">
              <summary class="top-nav-label">Economic Rankings</summary>
              <nav class="site-nav" id="{economic_nav_id}"></nav>
            </details>
            <details class="top-nav-disclosure">
              <summary class="top-nav-label">Population Rankings</summary>
              <nav class="site-nav" id="populationTopNav"></nav>
            </details>
            <details class="top-nav-disclosure">
              <summary class="top-nav-label">Trade Rankings</summary>
              <nav class="site-nav" id="tradeTopNav"></nav>
            </details>
          </div>
        </details>
      </section>"""
