import { useEffect, useState } from 'react';
import { SLOTS } from './storage.js';

export function getCurrentLesson(now = new Date()) {
  const day = now.getDay() - 1;
  if (day < 0 || day > 4) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const slot = SLOTS.findIndex(({ start, end }) => minutes >= start && minutes < end);
  return slot < 0 ? null : `${day}-${slot}`;
}

export function useCurrentLesson() {
  const [current, setCurrent] = useState(getCurrentLesson);
  useEffect(() => {
    let timer;
    function update() {
      window.clearTimeout(timer);
      setCurrent(getCurrentLesson());
      // Align with actual clock minutes rather than time since the app opened.
      timer = window.setTimeout(update, 60000 - Date.now() % 60000);
    }
    update();
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return current;
}
