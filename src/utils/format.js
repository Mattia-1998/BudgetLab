export function formatCurrency(amount) {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

export function formatDate(tsMs) {
  return new Date(tsMs).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}