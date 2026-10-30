import { useEffect, useRef } from 'react';

// Only the grab handle owns this gesture; inputs and the form keep native scroll.
export function useSheetGesture(dialog, onClose, isOpen) {
  const gesture = useRef(null);
  const moved = useRef(false);
  const closing = useRef(null);
  function reset() {
    gesture.current = null;
    dialog.current?.removeAttribute('data-dragging');
    dialog.current?.style.removeProperty('--sheet-offset');
  }
  useEffect(() => {
    if (!isOpen) {
      closing.current?.cancel();
      closing.current = null;
      reset();
    }
    return () => { closing.current?.cancel(); closing.current = null; };
  }, [isOpen]);

  function close() {
    const element = dialog.current;
    if (!element || closing.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { onClose(); return; }
    const offset = parseFloat(element.style.getPropertyValue('--sheet-offset')) || 0;
    const destination = window.innerHeight - element.getBoundingClientRect().top + offset + 16;
    const animation = element.animate([
      { transform: `translateY(${offset}px)` },
      { transform: `translateY(${destination}px)` },
    ], { duration: 220, easing: 'cubic-bezier(.3,0,.8,.2)', fill: 'forwards' });
    closing.current = animation;
    animation.finished.then(onClose).catch(() => {});
  }
  return {
    onPointerDown(event) {
      if (!event.isPrimary || event.button !== 0 || closing.current) return;
      // Dismiss the keyboard before dragging the sheet toward the home edge.
      if (dialog.current?.contains(document.activeElement)) document.activeElement.blur();
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
      dialog.current?.style.setProperty('--sheet-offset', `${Math.max(0, delta)}px`);
    },
    onPointerUp(event) {
      const start = gesture.current;
      gesture.current = null;
      if (!start || start.id !== event.pointerId) return;
      const delta = event.clientY - start.y;
      const duration = Math.max(1, performance.now() - start.started);
      if (delta > Math.abs(event.clientX - start.x) * 1.4 && (delta >= 80 || (delta >= 30 && delta / duration > 0.5))) close();
      else reset();
    },
    onPointerCancel: reset,
    onLostPointerCapture: () => { if (!closing.current) reset(); },
    onKeyDown(event) { if (event.key === 'Enter' || event.key === ' ') moved.current = false; },
    onClick(event) {
      if (moved.current) { event.preventDefault(); return; }
      close();
    },
  };
}
