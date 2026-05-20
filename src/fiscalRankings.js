export const fiscalRankings = [
  {
    directory: "government-gross-debt",
    label: "Government Gross Debt",
  },
  {
    directory: "government-net-debt",
    label: "Government Net Debt",
  },
  {
    directory: "fiscal-balance",
    label: "Fiscal Balance",
  },
  {
    directory: "primary-fiscal-balance",
    label: "Primary Fiscal Balance",
  },
  {
    directory: "government-revenue",
    label: "Government Revenue",
  },
  {
    directory: "government-expenditure",
    label: "Government Expenditure",
  },
  {
    directory: "total-reserves-including-gold",
    label: "Total Reserves Including Gold",
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
