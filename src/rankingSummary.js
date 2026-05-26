export function updateRankingSummaryDisplay({
  summaryElement,
  countElement,
  rowCount,
}) {
  if (summaryElement) {
    summaryElement.textContent = "";
    summaryElement.classList.remove("is-error");
    summaryElement.hidden = true;
  }

  if (countElement) {
    countElement.textContent = `Showing: ${rowCount}`;
  }
}

export function showRankingLoadError({ summaryElement, countElement }) {
  if (summaryElement) {
    summaryElement.hidden = false;
    summaryElement.textContent = "Failed to load ranking data.";
    summaryElement.classList.add("is-error");
  }

  if (countElement) {
    countElement.textContent = "";
  }
}
