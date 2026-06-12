from __future__ import annotations


RANKING_INDICATOR_IDS_BY_DATASET = {
    "IMF.RES:WEO": {
        "BCA",
        "BCA_NGDPD",
        "GGR_NGDP",
        "GGXCNL_NGDP",
        "GGXONLB_NGDP",
        "GGXWDG_NGDP",
        "GGXWDN_NGDP",
        "GGX_NGDP",
        "LUR",
        "NGDPD",
        "NGDPDPC",
        "NGDP_RPCH",
        "PCPIPCH",
        "PPPGDP",
        "PPPPC",
    },
    "SIPRI:MILEX": {
        "MILITARY_SPENDING_USD",
        "MILITARY_SPENDING_PERCENT_GDP",
    },
}


def get_ranking_indicator_ids(result: dict) -> set[str]:
    dataset_id = result.get("source", {}).get("dataset")
    configured_ids = RANKING_INDICATOR_IDS_BY_DATASET.get(dataset_id)

    if configured_ids is None:
        return set(result["indicators"])

    unknown_ids = configured_ids - set(result["indicators"])

    if unknown_ids:
        raise ValueError(f"Unknown ranking indicator IDs for {dataset_id}: {sorted(unknown_ids)}")

    return configured_ids
