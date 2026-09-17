import assert from 'node:assert';
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder } from '../src/utils/finance.js';
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategoryFilter } from '../src/constants/categories.js';
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

const prelievo = [
  { id: 'p1', accountId: 'c1', transferTo: 'c2', amount: 50, kind: 'transfer', direction: 'prelievo', date: d(2026, 9, 8) },
];
assert.equal(accountBalance([...txs, ...prelievo], 'c1'), 10);   // 60 - 50
assert.equal(accountBalance([...txs, ...prelievo], 'c2'), 30);   // -20 + 50
assert.equal(totalBalance(accounts, [...txs, ...prelievo]), 40); // totale invariato

const deposito = [
  { id: 'd1', accountId: 'c2', transferTo: 'c1', amount: 25, kind: 'transfer', direction: 'deposito', date: d(2026, 9, 8) },
];
assert.equal(accountBalance([...txs, ...deposito], 'c1'), 85);   // 60 + 25
assert.equal(accountBalance([...txs, ...deposito], 'c2'), -45);  // -20 - 25
assert.equal(totalBalance(accounts, [...txs, ...deposito]), 40); // totale invariato

const all = [...txs, ...prelievo, ...deposito];
const catsAll = expensesByCategory(all, startMs, endMs).reduce((s, i) => s + i.total, 0);
assert.equal(catsAll, 60); // i trasferimenti non compaiono come spese
assert.equal(sumByKind(all, 'income', startMs, endMs), 100);
assert.equal(sumByKind(all, 'expense', startMs, endMs), 60);

assert.equal(CATEGORIES.length, 11);
assert.equal(CATEGORY_MAP.stipendio.label, 'Stipendio');
assert.equal(CATEGORY_MAP.stipendio.icon, 'cash-outline');
assert.equal(CATEGORY_MAP.stipendio.color, '#00838F');
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
assert.equal(formatCurrency(12.5), '12,50\u00a0€');

assert.deepEqual(orderedCategoryKeys(), {
  central: ['cibo', 'trasporti'],
  rest: ['casa', 'bollette', 'salute', 'svago', 'sport', 'auto', 'shopping', 'stipendio', 'altro'],
});

assert.deepEqual(toggleCategory([], 'cibo'), ['cibo']);
assert.deepEqual(toggleCategory(['cibo'], 'cibo'), []);
assert.deepEqual(toggleCategory(['cibo', 'trasporti'], 'svago'), ['cibo', 'trasporti', 'svago']);
assert.deepEqual(toggleCategory(['cibo'], 'cibo'), []);
assert.deepEqual(toggleCategory(['cibo', 'trasporti'], 'cibo'), ['trasporti']);

assert.equal(hasSelectedCategories([]), false);
assert.equal(hasSelectedCategories(['cibo']), true);

assert.equal(matchesCategoryFilter([], 'cibo'), true);        // set vuoto = nessun filtro
assert.equal(matchesCategoryFilter(['cibo'], 'cibo'), true);
assert.equal(matchesCategoryFilter(['cibo'], 'trasporti'), false);
assert.equal(matchesCategoryFilter(['cibo', 'trasporti'], 'trasporti'), true);

assert.deepEqual(
  sortAccountsByOrder([
    { id: 'b', name: 'B', order: 2 },
    { id: 'c', name: 'C', order: 0 },
    { id: 'a', name: 'A', order: 1 },
  ]).map((a) => a.id),
  ['c', 'a', 'b']
);

assert.deepEqual(
  sortAccountsByOrder([
    { id: 'old1', name: 'Old1', createdAt: 200 },
    { id: 'a', name: 'A', order: 5, createdAt: 50 },
    { id: 'old2', name: 'Old2', createdAt: 100 },
    { id: 'b', name: 'B', order: 3, createdAt: 60 },
  ]).map((a) => a.id),
  ['b', 'a', 'old2', 'old1']
);

assert.deepEqual(
  sortAccountsByOrder([
    { id: 'x', name: 'X', order: 1, createdAt: 200 },
    { id: 'y', name: 'Y', order: 1, createdAt: 100 },
  ]).map((a) => a.id),
  ['y', 'x']
);

const inputOrder = [{ id: 'b', order: 2 }, { id: 'a', order: 1 }];
const inputSnapshot = inputOrder.map((a) => ({ ...a, order: a.order }));
sortAccountsByOrder(inputOrder);
assert.deepEqual(inputOrder, inputSnapshot);

assert.equal(nextAccountOrder([]), 0);
assert.equal(nextAccountOrder([{ id: 'a', order: 0 }, { id: 'b' }]), 1);
assert.equal(nextAccountOrder([{ id: 'a', order: 4 }, { id: 'b', order: 0 }]), 5);

console.log('Tutti i controlli di finanza/format/categorie passano.');