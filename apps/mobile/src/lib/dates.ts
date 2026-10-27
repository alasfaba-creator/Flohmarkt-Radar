import { toDbDate } from './time';

export const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function parseDbDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayHeading(iso: string) {
  const date = parseDbDate(iso);
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const label = date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  if (iso === toDbDate(today)) return `Heute, ${label}`;
  if (iso === toDbDate(tomorrow)) return `Morgen, ${label}`;
  return label;
}

export function formatShortDay(iso: string) {
  const d = parseDbDate(iso);
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`;
}
