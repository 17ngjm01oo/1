#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."

PAGE_CONFIGS = (
    CountryPageConfig(
        page_kind="goods-exports",
        title_suffix="Goods Exports",
        chart_title="Goods Exports Chart by Country",
        subtitle="Select a country to view historical goods exports trends.",
        generated_label="goods exports",
        related_nav_label="Trade page navigation",
        source_note=UNCTAD_SOURCE_NOTE,
        data_note="",
        indicators=(
            IndicatorBlockConfig(
                series_id="goodsExports",
                title="Goods Exports - USD",
                canvas_label="Goods exports line chart",
                compare_label="Goods Exports",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="goods-imports",
        title_suffix="Goods Imports",
        chart_title="Goods Imports Chart by Country",
        subtitle="Select a country to view historical goods imports trends.",
        generated_label="goods imports",
        related_nav_label="Trade page navigation",
        source_note=UNCTAD_SOURCE_NOTE,
        data_note="",
        indicators=(
            IndicatorBlockConfig(
                series_id="goodsImports",
                title="Goods Imports - USD",
                canvas_label="Goods imports line chart",
                compare_label="Goods Imports",
            ),
        ),
    ),
    CountryPageConfig(
        page_kind="goods-trade-balance",
        title_suffix="Goods Trade Balance",
        chart_title="Goods Trade Balance Chart by Country",
        subtitle="Select a country to view historical goods trade balance trends.",
        generated_label="goods trade balance",
        related_nav_label="Trade page navigation",
        source_note=UNCTAD_SOURCE_NOTE,
        data_note="",
        indicators=(
            IndicatorBlockConfig(
                series_id="goodsTradeBalance",
                title="Goods Trade Balance - USD",
                canvas_label="Goods trade balance line chart",
                compare_label="Goods Trade Balance",
            ),
        ),
    ),
)


def main() -> None:
    for config in PAGE_CONFIGS:
        generate_country_pages(config)


if __name__ == "__main__":
    main()
