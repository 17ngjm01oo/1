const copiedLabel = "Copied";
const resetDelayMs = 1800;

initializeSharePanels();

function initializeSharePanels() {
  const panels = document.querySelectorAll(".share-panel");

  panels.forEach((panel) => {
    updateShareLinks(panel);
    panel.addEventListener("click", handleSharePanelClick);
  });
}

function updateShareLinks(panel) {
  const pageUrl = window.location.href;
  const pageTitle = document.title;

  const shareUrls = {
    x: `https://twitter.com/intent/tweet?${new URLSearchParams({ url: pageUrl, text: pageTitle })}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?${new URLSearchParams({ url: pageUrl })}`,
    whatsapp: `https://api.whatsapp.com/send?${new URLSearchParams({ text: `${pageTitle} ${pageUrl}` })}`,
    line: `https://social-plugins.line.me/lineit/share?${new URLSearchParams({ url: pageUrl })}`,
  };

  Object.entries(shareUrls).forEach(([target, href]) => {
    const link = panel.querySelector(`a[data-share-target="${target}"]`);

    if (link) {
      link.href = href;
    }
  });
}

function handleSharePanelClick(event) {
  const copyButton = event.target.closest('button[data-share-target="copy"]');

  if (!copyButton) {
    return;
  }

  const panel = copyButton.closest(".share-panel");

  if (!navigator.clipboard?.writeText) {
    return;
  }

  navigator.clipboard.writeText(window.location.href).then(() => {
    showCopiedStatus(panel);
  });
}

function showCopiedStatus(panel) {
  const status = panel?.querySelector("[data-share-status]");

  if (!status) {
    return;
  }

  window.clearTimeout(status.resetTimer);
  status.textContent = copiedLabel;
  status.resetTimer = window.setTimeout(() => {
    status.textContent = "";
  }, resetDelayMs);
}
