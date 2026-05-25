from __future__ import annotations


def render_rankings_top_nav(economic_nav_id: str, root_href: str) -> str:
    return f"""      <section class="top-nav-card" aria-label="Site navigation">
        <a class="country-hub-nav-link" href="{root_href}countries/">Countries</a>
        <a class="country-hub-nav-link" href="{root_href}rankings/">Rankings</a>
      </section>"""
