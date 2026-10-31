import { useEffect, useState } from 'react';
import { SLOTS } from './storage.js';
import { dateKey } from './calendar.js';

export function getCurrentLesson(now = new Date()) {
  const day = now.getDay() - 1;
  if (day < 0 || day > 4) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const slot = SLOTS.findIndex(({ start, end }) => minutes >= start && minutes < end);
  return slot < 0 ? null : `${day}-${slot}`;
}

export function useCurrentLesson() {
  const readClock = () => { const now = new Date(); return { key: getCurrentLesson(now), date: dateKey(now) }; };
  const [current, setCurrent] = useState(readClock);
  useEffect(() => {
    let timer;
    function update() {
      window.clearTimeout(timer);
      const next = readClock();
      setCurrent(previous => previous.key === next.key && previous.date === next.date ? previous : next);
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
