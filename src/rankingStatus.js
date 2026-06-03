import { renderEntityCountSummary } from "./entityCountSummary.js";

export function showRankingCount({
  countElement,
  rankingRows,
}) {
  if (countElement) {
    renderEntityCountSummary(countElement, rankingRows);
    countElement.classList.remove("is-error");
  }
}

export function showRankingLoading({ countElement }) {
  if (countElement) {
    countElement.textContent = "Loading ranking data...";
    countElement.classList.remove("is-error");
  }
}

export function showRankingLoadError({ countElement }) {
  if (countElement) {
    countElement.textContent = "Failed to load ranking data.";
    countElement.classList.add("is-error");
  }
}
