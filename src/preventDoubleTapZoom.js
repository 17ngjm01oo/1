const DOUBLE_TAP_MAX_DELAY_MS = 300;
const interactiveInputSelector = "input, textarea, select, [contenteditable='true']";

let lastSingleTouchEnd = 0;
let isMultiTouchGesture = false;

document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length > 1) {
      isMultiTouchGesture = true;
    }
  },
  { passive: true, capture: true },
);

document.addEventListener(
  "touchend",
  (event) => {
    if (isMultiTouchGesture) {
      if (event.touches.length === 0) {
        isMultiTouchGesture = false;
      }

      lastSingleTouchEnd = 0;
      return;
    }

    if (event.changedTouches.length !== 1 || isEditableTarget(event.target)) {
      lastSingleTouchEnd = 0;
      return;
    }

    const now = Date.now();

    if (now - lastSingleTouchEnd <= DOUBLE_TAP_MAX_DELAY_MS) {
      event.preventDefault();
    }

    lastSingleTouchEnd = now;
  },
  { passive: false, capture: true },
);

function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest(interactiveInputSelector));
}
