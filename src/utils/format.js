import { periodRange } from './finance.js';

export function formatCurrency(amount) {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

export function formatDate(tsMs) {
  return new Date(tsMs).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const monthShort = (ms) => capitalize(new Date(ms).toLocaleDateString('it-IT', { month: 'short' }));

const yearOf = (ms) => new Date(ms).getFullYear();

const RANGE_PREFIX = { bimester: 'Bim.', quarter: 'Trim.', semester: 'Sem.' };

export function formatPeriodLabel(period) {
  const { mode, anchor, customStart, customEnd } = period;
  if (mode === 'all') return 'Tutti i mesi';
  if (mode === 'month') return capitalize(formatMonthLabel(new Date(anchor)));
  if (mode === 'year') return String(yearOf(anchor));
  if (RANGE_PREFIX[mode]) {
    const { startMs, endMs } = periodRange(period);
    return `${RANGE_PREFIX[mode]} ${monthShort(startMs)}\u2013${monthShort(endMs)} ${yearOf(startMs)}`;
  }
  return yearOf(customStart) === yearOf(customEnd)
    ? `${monthShort(customStart)} \u2013 ${monthShort(customEnd)} ${yearOf(customEnd)}`
    : `${monthShort(customStart)} ${yearOf(customStart)} \u2013 ${monthShort(customEnd)} ${yearOf(customEnd)}`;
}