import assert from 'node:assert';
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind } from '../src/utils/finance.js';
import { CATEGORIES, CATEGORY_MAP } from '../src/constants/categories.js';
import { formatCurrency } from '../src/utils/format.js';

const d = (y, m, day) => new Date(y, m - 1, day, 12, 0, 0).getTime();
const txs = [
  { id: 'a', accountId: 'c1', amount: 100, kind: 'income', category: 'altro', date: d(2026, 9, 5) },
  { id: 'b', accountId: 'c1', amount: 30, kind: 'expense', category: 'cibo', date: d(2026, 9, 10) },
  { id: 'c', accountId: 'c2', amount: 20, kind: 'expense', category: 'cibo', date: d(2026, 9, 12) },
  { id: 'd', accountId: 'c1', amount: 10, kind: 'expense', category: 'trasporti', date: d(2026, 9, 20) },
];
const accounts = [{ id: 'c1', name: 'Conto' }, { id: 'c2', name: 'Contanti' }];

const { startMs, endMs } = monthRange(new Date(2026, 8, 15));
assert.equal(isInRange(d(2026, 9, 1), startMs, endMs), true);
assert.equal(isInRange(d(2026, 8, 31), startMs, endMs), false);

assert.equal(accountBalance(txs, 'c1'), 60); // 100 - 30 - 10
assert.equal(accountBalance(txs, 'c2'), -20);
assert.equal(totalBalance(accounts, txs), 40);

const accsIB = [{ id: 'c1', name: 'Conto', initialBalance: 50 }, { id: 'c2', name: 'Contanti' }];
assert.equal(accountBalance(txs, 'c1', 50), 110);
assert.equal(totalBalance(accsIB, txs), 90); // (60+50) + (-20)

const cats = expensesByCategory(txs, startMs, endMs);
assert.deepEqual(cats, [
  { category: 'cibo', total: 50, percent: 83 },
  { category: 'trasporti', total: 10, percent: 17 },
]);

assert.equal(sumByKind(txs, 'income', startMs, endMs), 100);
assert.equal(sumByKind(txs, 'expense', startMs, endMs), 60);

assert.equal(CATEGORIES.length, 10);
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
assert.equal(formatCurrency(12.5), '12,50\u00a0€');

console.log('Tutti i controlli di finanza/format/categorie passano.');