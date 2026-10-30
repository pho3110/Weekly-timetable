import { useRef } from 'react';

// Only the grab handle owns this gesture; inputs and the form keep native scroll.
export function useSheetGesture(dialog, onClose) {
  const gesture = useRef(null);
  const moved = useRef(false);
  function reset() {
    gesture.current = null;
    dialog.current?.removeAttribute('data-dragging');
    dialog.current?.style.removeProperty('--sheet-offset');
  }
  return {
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return;
      moved.current = false;
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, started: performance.now() };
      event.currentTarget.setPointerCapture(event.pointerId);
      dialog.current?.setAttribute('data-dragging', '');
    },
    onPointerMove(event) {
      const start = gesture.current;
      if (!start || start.id !== event.pointerId) return;
      const delta = event.clientY - start.y;
      if (Math.hypot(delta, event.clientX - start.x) > 8) moved.current = true;
      dialog.current?.style.setProperty('--sheet-offset', `${Math.min(260, Math.max(0, delta))}px`);
    },
    onPointerUp(event) {
      const start = gesture.current;
      reset();
      if (!start || start.id !== event.pointerId) return;
      const delta = event.clientY - start.y;
      const duration = Math.max(1, performance.now() - start.started);
      if (delta > Math.abs(event.clientX - start.x) * 1.4 && (delta >= 80 || (delta >= 30 && delta / duration > 0.5))) onClose();
    },
    onPointerCancel: reset,
    onLostPointerCapture: reset,
    onKeyDown(event) { if (event.key === 'Enter' || event.key === ' ') moved.current = false; },
    onClick(event) {
      if (moved.current) { event.preventDefault(); return; }
      onClose();
    },
  };
}
