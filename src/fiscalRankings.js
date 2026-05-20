export const fiscalRankings = [
  {
    directory: "government-gross-debt",
    label: "Government Gross Debt Ranking",
  },
  {
    directory: "government-net-debt",
    label: "Government Net Debt Ranking",
  },
  {
    directory: "fiscal-balance",
    label: "Fiscal Balance Ranking",
  },
  {
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance Ranking",
  },
  {
    directory: "government-revenue",
    label: "Government Revenue Ranking",
  },
  {
    directory: "government-expenditure",
    label: "Government Expenditure Ranking",
  },
];

export function renderFiscalRankingLinks(
  nav,
  {
    rootHref = "./",
    currentRankingDirectory = "",
    currentScopeSlug = "world",
    highlightCurrent = true,
    replace = true,
  } = {},
) {
  if (!nav) {
    return;
  }

  if (replace) {
    nav.innerHTML = "";
  }

  fiscalRankings.forEach((ranking) => {
    const link = document.createElement("a");
    link.href = `${rootHref}rankings/${ranking.directory}/${currentScopeSlug}/`;
    link.textContent = ranking.label;

    if (highlightCurrent && ranking.directory === currentRankingDirectory) {
      link.className = "is-current";
      link.setAttribute("aria-current", "page");
    }

    nav.append(link);
  });
}
