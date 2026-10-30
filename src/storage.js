export const STORAGE_KEY = 'lich-hoc-v1';
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
