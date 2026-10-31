export const STORAGE_KEY = 'lich-hoc-v1';
export const WEEKLY_STORAGE_KEY = 'lich-hoc-weekly-v2';
export const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu'];
export const SLOTS = [
  { label: 'Ca 1', time: '07:00 – 09:25', period: 'Sáng', start: 420, end: 565 },
  { label: 'Ca 2', time: '09:35 – 12:00', period: 'Sáng', start: 575, end: 720 },
  { label: 'Ca 3', time: '13:00 – 15:25', period: 'Chiều', start: 780, end: 925 },
  { label: 'Ca 4', time: '15:35 – 18:00', period: 'Chiều', start: 935, end: 1080 },
];
export const COLORS = ['sage', 'blue', 'peach', 'purple', 'yellow'];
export function isValidSchedule(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.entries(value).every(([key, item]) => /^[0-4]-[0-3]$/.test(key) && item && typeof item.subject === 'string' && item.subject.trim().length > 0 && item.subject.length <= 100 && typeof item.room === 'string' && item.room.length <= 60 && COLORS.includes(item.color));
}
export function loadSchedule() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return isValidSchedule(value) ? value : {}; }
  catch { return {}; }
}

export function loadTimetable() {
  try {
    const value = JSON.parse(localStorage.getItem(WEEKLY_STORAGE_KEY) || 'null');
    if (value && isValidSchedule(value.base) && value.weeks && typeof value.weeks === 'object' && !Array.isArray(value.weeks)
      && Object.entries(value.weeks).every(([week, changes]) => /^\d{4}-\d{2}-\d{2}$/.test(week) && changes && !Array.isArray(changes) && typeof changes === 'object'
        && Object.entries(changes).every(([key, item]) => /^[0-4]-[0-3]$/.test(key) && (item === null || isValidSchedule({ [key]: item }))))) return value;
  } catch { /* Existing v1 schedules become the repeating base without data loss. */ }
  return { base: loadSchedule(), weeks: {} };
}

export function scheduleForWeek(timetable, week) {
  const result = { ...timetable.base };
  for (const [key, value] of Object.entries(timetable.weeks[week] || {})) {
    if (value === null) delete result[key];
    else result[key] = value;
  }
  return result;
}

export function changeLesson(timetable, week, key, value, scope) {
  const base = { ...timetable.base };
  const weeks = { ...timetable.weeks };
  const changes = { ...weeks[week] };
  if (scope === 'repeat') {
    if (value === null) delete base[key];
    else base[key] = value;
    delete changes[key];
  } else changes[key] = value;
  if (Object.keys(changes).length) weeks[week] = changes;
  else delete weeks[week];
  return { base, weeks };
}
