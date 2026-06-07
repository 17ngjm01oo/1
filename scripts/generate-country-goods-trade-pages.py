#!/usr/bin/env python3
from __future__ import annotations

from country_page_generator import CountryPageConfig, IndicatorBlockConfig, generate_country_pages


UNCTAD_SOURCE_NOTE = "Source: UNCTADstat."

def main() -> None:
    generate_country_pages(
        CountryPageConfig(
            page_kind="goods-trade",
            title_suffix="Goods Exports, Imports and Trade Balance",
            chart_title="Goods Exports, Imports and Trade Balance by Country",
            subtitle="",
            generated_label="goods trade",
            related_nav_label="Trade page navigation",
            source_note=UNCTAD_SOURCE_NOTE,
            data_note="",
            indicators=(
                IndicatorBlockConfig(
                    series_id="goodsTradeBalance",
                    title="Goods Trade Balance",
                    canvas_label="Goods trade balance line chart",
                    display_unit="USD",
                    compare_label="Goods Trade Balance",
                ),
                IndicatorBlockConfig(
                    series_id="goodsExports",
                    title="Goods Exports",
                    canvas_label="Goods exports line chart",
                    display_unit="USD",
                    compare_label="Goods Exports",
                ),
                IndicatorBlockConfig(
                    series_id="goodsImports",
                    title="Goods Imports",
                    canvas_label="Goods imports line chart",
                    display_unit="USD",
                    compare_label="Goods Imports",
                ),
            ),
        )
    )


if __name__ == "__main__":
    main()
