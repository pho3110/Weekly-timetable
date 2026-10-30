import { useRef } from 'react';

// Preserve vertical scrolling, pinch zoom and Safari's screen-edge gestures.
export function useDaySwipe(onSwipe) {
  const gesture = useRef(null);
  const ignoreClickUntil = useRef(0);

  function onTouchStart(event) {
    const touch = event.touches[0];
    if (event.touches.length !== 1 || touch.clientX < 24 || touch.clientX > window.innerWidth - 24) {
      gesture.current = null;
      return;
    }
    ignoreClickUntil.current = 0;
    gesture.current = { x: touch.clientX, y: touch.clientY, started: Date.now(), direction: null };
  }

  function onTouchMove(event) {
    const start = gesture.current;
    if (!start) return;
    if (event.touches.length !== 1) { gesture.current = null; return; }
    const dx = Math.abs(event.touches[0].clientX - start.x);
    const dy = Math.abs(event.touches[0].clientY - start.y);
    if (!start.direction && Math.max(dx, dy) > 10) {
      start.direction = dx > dy * 1.5 ? 'horizontal' : 'vertical';
    }
    if (start.direction === 'horizontal') ignoreClickUntil.current = Date.now() + 400;
  }

  function onTouchEnd(event) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (start.direction !== 'vertical' && Math.abs(dx) >= 56 && Math.abs(dx) > Math.abs(dy) * 1.5 && Date.now() - start.started < 1000) {
      ignoreClickUntil.current = Date.now() + 400;
      onSwipe(dx < 0 ? 1 : -1);
    }
  }

  return {
    onTouchStart, onTouchMove, onTouchEnd,
    onTouchCancel: () => { gesture.current = null; },
    onClickCapture: event => {
      if (Date.now() < ignoreClickUntil.current && event.detail !== 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
