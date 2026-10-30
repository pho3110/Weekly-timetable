import { useRef } from 'react';

// Preserve vertical scrolling, pinch zoom and Safari's screen-edge gestures.
export function useDaySwipe(onSwipe) {
  const gesture = useRef(null);
  const ignoreClickUntil = useRef(0);

  function onTouchStart(event) {
    ignoreClickUntil.current = 0;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || !touch || touch.clientX < 28 || touch.clientX > window.innerWidth - 28) {
      gesture.current = null;
      return;
    }
    gesture.current = { x: touch.clientX, y: touch.clientY, started: performance.now(), direction: null };
  }

  function onTouchMove(event) {
    const start = gesture.current;
    if (!start) return;
    if (event.touches.length !== 1) { gesture.current = null; ignoreClickUntil.current = performance.now() + 500; return; }
    const dx = Math.abs(event.touches[0].clientX - start.x);
    const dy = Math.abs(event.touches[0].clientY - start.y);
    if (!start.direction && Math.max(dx, dy) > 10) {
      start.direction = dx > dy * 1.4 ? 'horizontal' : 'vertical';
    }
    if (start.direction) ignoreClickUntil.current = performance.now() + 500;
  }

  function onTouchEnd(event) {
    const start = gesture.current;
    gesture.current = null;
    if (!start || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    const duration = Math.max(1, performance.now() - start.started);
    const intentionalSwipe = Math.abs(dx) >= 48 || (Math.abs(dx) >= 30 && Math.abs(dx) / duration >= 0.4);
    if (start.direction !== 'vertical' && intentionalSwipe && Math.abs(dx) > Math.abs(dy) * 1.4 && duration < 1000) {
      ignoreClickUntil.current = performance.now() + 500;
      onSwipe(dx < 0 ? 1 : -1);
    }
  }

  return {
    onTouchStart, onTouchMove, onTouchEnd,
    onTouchCancel: () => { gesture.current = null; ignoreClickUntil.current = performance.now() + 500; },
    onKeyDownCapture: () => { ignoreClickUntil.current = 0; },
    onPointerDownCapture: event => {
      if (event.pointerType === 'mouse') ignoreClickUntil.current = 0;
    },
    onClickCapture: event => {
      if (performance.now() < ignoreClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
