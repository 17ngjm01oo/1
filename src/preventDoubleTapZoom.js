const DOUBLE_TAP_MAX_DELAY_MS = 300;
const TAP_MOVE_TOLERANCE_PX = 10;
const interactiveInputSelector = "input, textarea, select, [contenteditable='true']";

let lastSingleTouchEnd = 0;
let isMultiTouchGesture = false;
let singleTouchStart = null;

document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length > 1) {
      isMultiTouchGesture = true;
      singleTouchStart = null;
      return;
    }

    const touch = event.touches[0];
    if (!touch) {
      singleTouchStart = null;
      return;
    }

    singleTouchStart = {
      x: touch.clientX,
      y: touch.clientY,
    };
  },
  { passive: true, capture: true },
);

document.addEventListener(
  "touchmove",
  (event) => {
    if (!singleTouchStart || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const movedX = Math.abs(touch.clientX - singleTouchStart.x);
    const movedY = Math.abs(touch.clientY - singleTouchStart.y);

    if (movedX > TAP_MOVE_TOLERANCE_PX || movedY > TAP_MOVE_TOLERANCE_PX) {
      singleTouchStart = null;
      lastSingleTouchEnd = 0;
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
      singleTouchStart = null;
      return;
    }

    if (event.changedTouches.length !== 1 || isEditableTarget(event.target) || !isTapGesture(event)) {
      lastSingleTouchEnd = 0;
      singleTouchStart = null;
      return;
    }

    const now = Date.now();

    if (now - lastSingleTouchEnd <= DOUBLE_TAP_MAX_DELAY_MS) {
      event.preventDefault();
    }

    lastSingleTouchEnd = now;
    singleTouchStart = null;
  },
  { passive: false, capture: true },
);

function isTapGesture(event) {
  const touch = event.changedTouches[0];

  if (!singleTouchStart || !touch) {
    return false;
  }

  return (
    Math.abs(touch.clientX - singleTouchStart.x) <= TAP_MOVE_TOLERANCE_PX
    && Math.abs(touch.clientY - singleTouchStart.y) <= TAP_MOVE_TOLERANCE_PX
  );
}

function isEditableTarget(target) {
  return target instanceof Element && Boolean(target.closest(interactiveInputSelector));
}
