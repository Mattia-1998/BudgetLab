export function monthRange(date) {
  const startMs = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const endMs = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { startMs, endMs };
}

export function isInRange(tsMs, startMs, endMs) {
  return tsMs >= startMs && tsMs <= endMs;
}

export function signedAmount(t) {
  return t.kind === 'income' ? t.amount : -t.amount;
}

export function accountTransactionsTotal(transactions, accountId) {
  return transactions.reduce((sum, t) => {
    if (t.accountId === accountId) return sum + signedAmount(t);
    if (t.kind === 'transfer' && t.transferTo === accountId) return sum + t.amount;
    return sum;
  }, 0);
}

export function accountBalance(transactions, accountId, initialBalance = 0) {
  return accountTransactionsTotal(transactions, accountId) + (initialBalance || 0);
}

export function totalBalance(accounts, transactions) {
  return accounts.reduce((sum, a) => sum + accountBalance(transactions, a.id, a.initialBalance), 0);
}

export function expensesByCategory(transactions, startMs, endMs) {
  const totals = {};
  transactions.forEach((t) => {
    if (t.kind === 'expense' && isInRange(t.date, startMs, endMs)) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  });
  const entries = Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const all = entries.reduce((s, i) => s + i.total, 0);
  return entries.map((i) => ({ ...i, percent: all ? Math.round((i.total / all) * 100) : 0 }));
}

export function sumByKind(transactions, kind, startMs, endMs) {
  return transactions.reduce(
    (s, t) => (t.kind === kind && isInRange(t.date, startMs, endMs) ? s + t.amount : s),
    0
  );
}

export function sortAccountsByOrder(accounts) {
  const withOrder = accounts.filter((a) => typeof a.order === 'number');
  const withoutOrder = accounts.filter((a) => typeof a.order !== 'number');
  withOrder.sort((a, b) => a.order - b.order || (a.createdAt || 0) - (b.createdAt || 0));
  withoutOrder.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return [...withOrder, ...withoutOrder];
}

export function nextAccountOrder(accounts) {
  return accounts.reduce((m, a) => (typeof a.order === 'number' ? Math.max(m, a.order) : m), -1) + 1;
}

export function dragInsertIndex(rows, heights, ghostMid, fallbackHeight = 70) {
  let top = 10;
  let insertAt = 0;
  for (const r of rows) {
    const h = heights[r.id] || fallbackHeight;
    if (ghostMid > top + h / 2) insertAt++;
    else break;
    top += h + 10;
  }
  return insertAt;
}

export function dragRowOffsets(list, draggedId, heights, targetIndex, fallbackHeight = 70) {
  const startIndex = list.findIndex((a) => a.id === draggedId);
  const offsets = {};
  list.forEach((r) => { offsets[r.id] = 0; });
  if (startIndex === -1) return offsets;
  const shift = (heights[draggedId] || fallbackHeight) + 10;
  list.forEach((r, i) => {
    if (r.id === draggedId) return;
    if (targetIndex < startIndex && i >= targetIndex && i < startIndex) offsets[r.id] = shift;
    else if (targetIndex > startIndex && i > startIndex && i <= targetIndex) offsets[r.id] = -shift;
  });
  return offsets;
}

export function reorderAt(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function matchesAccountFilter(transaction, accountId) {
  if (accountId === 'all') return true;
  return transaction.accountId === accountId || transaction.transferTo === accountId;
}

export function startOfMonth(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const BLOCK_MONTHS = { month: 1, bimester: 2, quarter: 3, semester: 6 };
const SHIFT_MONTHS = { month: 1, bimester: 2, quarter: 3, semester: 6, year: 12 };

const monthEnd = (year, month) => new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

export function periodRange(period) {
  const { mode, anchor, customStart, customEnd } = period;
  if (mode === 'all') return null;
  if (mode === 'custom') {
    const end = new Date(startOfMonth(customEnd));
    return { startMs: startOfMonth(customStart), endMs: monthEnd(end.getFullYear(), end.getMonth()) };
  }
  const a = new Date(anchor);
  if (mode === 'month') return monthRange(a);
  if (mode === 'year') return { startMs: new Date(a.getFullYear(), 0, 1).getTime(), endMs: monthEnd(a.getFullYear(), 11) };
  const span = BLOCK_MONTHS[mode];
  const startMonth = a.getMonth() - (a.getMonth() % span);
  return { startMs: new Date(a.getFullYear(), startMonth, 1).getTime(), endMs: monthEnd(a.getFullYear(), startMonth + span - 1) };
}

export function shiftAnchor(anchorMs, mode, dir) {
  const step = SHIFT_MONTHS[mode];
  if (!step) return anchorMs;
  const d = new Date(anchorMs);
  return new Date(d.getFullYear(), d.getMonth() + dir * step, 1).getTime();
}