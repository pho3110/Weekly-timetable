export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}
export function addDays(date, count) {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
}
export function weekStart(date) {
  return dateKey(addDays(date, -((date.getDay() + 6) % 7)));
}
export function formatDate(date, year = false) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}${year ? `/${date.getFullYear()}` : ''}`;
}
export function weekLabel(key) {
  const start = parseDate(key);
  const end = addDays(start, 6);
  return `${formatDate(start, start.getFullYear() !== end.getFullYear())} – ${formatDate(end, true)}`;
}
