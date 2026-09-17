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

export function accountBalance(transactions, accountId, initialBalance = 0) {
  const sum = transactions.reduce((sum, t) => {
    if (t.accountId === accountId) return sum + signedAmount(t);
    if (t.kind === 'transfer' && t.transferTo === accountId) return sum + t.amount;
    return sum;
  }, 0);
  return sum + (initialBalance || 0);
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