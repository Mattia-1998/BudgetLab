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
  const sum = transactions.reduce((sum, t) => (t.accountId === accountId ? sum + signedAmount(t) : sum), 0);
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