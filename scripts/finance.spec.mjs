import assert from 'node:assert';
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder, dragInsertIndex, dragRowOffsets, reorderAt, matchesAccountFilter, startOfMonth, periodRange, shiftAnchor } from '../src/utils/finance.js';
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategorySelection } from '../src/constants/categories.js';
import { formatCurrency, formatPeriodLabel } from '../src/utils/format.js';

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

assert.equal(CATEGORIES.length, 12);
assert.equal(CATEGORY_MAP.stipendio.label, 'Stipendio');
assert.equal(CATEGORY_MAP.stipendio.icon, 'cash-outline');
assert.equal(CATEGORY_MAP.stipendio.color, '#00838F');
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
assert.equal(formatCurrency(12.5), '12,50\u00a0€');

assert.deepEqual(orderedCategoryKeys(), {
  central: ['cibo', 'trasporti'],
  rest: ['casa', 'bollette', 'salute', 'svago', 'sport', 'auto', 'shopping', 'stipendio', 'altro', 'trasferimento'],
});

assert.deepEqual(toggleCategory([], 'cibo'), ['cibo']);
assert.deepEqual(toggleCategory(['cibo'], 'cibo'), []);
assert.deepEqual(toggleCategory(['cibo', 'trasporti'], 'svago'), ['cibo', 'trasporti', 'svago']);
assert.deepEqual(toggleCategory(['cibo'], 'cibo'), []);
assert.deepEqual(toggleCategory(['cibo', 'trasporti'], 'cibo'), ['trasporti']);

assert.equal(hasSelectedCategories([]), false);
assert.equal(hasSelectedCategories(['cibo']), true);

assert.equal(matchesCategorySelection([], txs[1]), true);                                  // set vuoto = nessun filtro
const transferForCat = { id: 'tc1', kind: 'transfer', accountId: 'c1', transferTo: 'c2', amount: 10 };
assert.equal(matchesCategorySelection(['trasferimento'], transferForCat), true);           // trasferimento con tile Trasferimento
assert.equal(matchesCategorySelection(['cibo'], transferForCat), false);                   // trasferimento senza tile Trasferimento
assert.equal(matchesCategorySelection(['cibo'], txs[1]), true);                            // uscita Cibo con categoria Cibo
assert.equal(matchesCategorySelection(['trasporti'], txs[1]), false);                      // uscita Cibo con altra categoria
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], transferForCat), true);   // OR
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], txs[1]), true);           // OR
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], txs[3]), false);          // OR, categoria non selezionata

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

assert.equal(dragInsertIndex([], {}, 100), 0);
assert.equal(dragInsertIndex([{ id: 'a' }], { a: 100 }, 10), 0);
assert.equal(dragInsertIndex([{ id: 'a' }, { id: 'b' }], { a: 100, b: 80 }, 500), 2);
assert.equal(dragInsertIndex([{ id: 'a' }, { id: 'b' }, { id: 'c' }], { a: 100, b: 50, c: 80 }, 100), 1);
assert.equal(dragInsertIndex([{ id: 'a' }], {}, 45), 0);
assert.equal(dragInsertIndex([{ id: 'a' }], {}, 46), 1);
assert.equal(dragInsertIndex([{ id: 'a' }, { id: 'b' }], { a: 100 }, 155), 1);
assert.equal(dragInsertIndex([{ id: 'a' }, { id: 'b' }], { a: 100 }, 156), 2);

const H = { a: 100, b: 80, c: 90, d: 110, e: 100 };
const list5 = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

assert.deepEqual(dragRowOffsets(list5, 'b', H, 3), { a: 0, b: 0, c: -90, d: -90, e: 0 }); // b (start 1) giù a 3, shift 80+10=90
assert.deepEqual(dragRowOffsets(list5, 'c', H, 0), { a: 100, b: 100, c: 0, d: 0, e: 0 }); // c (start 2) su a 0, shift 90+10=100
assert.deepEqual(dragRowOffsets(list5, 'b', H, 1), { a: 0, b: 0, c: 0, d: 0, e: 0 });      // indice invariato
assert.deepEqual(dragRowOffsets(list5, 'a', H, 2), { a: 0, b: -110, c: -110, d: 0, e: 0 }); // primo a (start 0) giù, shift 100+10=110
assert.deepEqual(dragRowOffsets(list5, 'e', H, 1), { a: 0, b: 110, c: 110, d: 110, e: 0 }); // ultimo e (start 4) su, shift 100+10=110
assert.deepEqual(dragRowOffsets(list5, 'zz', H, 1), { a: 0, b: 0, c: 0, d: 0, e: 0 });      // id assente
assert.deepEqual(dragRowOffsets(list5, 'b', {}, 3), { a: 0, b: 0, c: -80, d: -80, e: 0 }); // fallback 70 → shift 80

const list5Before = list5.map((r) => ({ id: r.id }));
dragRowOffsets(list5, 'b', H, 3);
assert.deepEqual(list5, list5Before);

const ABCD = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
assert.deepEqual(reorderAt(ABCD, 1, 3).map((a) => a.id), ['a', 'c', 'd', 'b']);
assert.deepEqual(reorderAt(ABCD, 2, 0).map((a) => a.id), ['c', 'a', 'b', 'd']);
assert.deepEqual(reorderAt(ABCD, 1, 1).map((a) => a.id), ['a', 'b', 'c', 'd']);
assert.deepEqual(reorderAt(ABCD, 0, 3).map((a) => a.id), ['b', 'c', 'd', 'a']);
assert.deepEqual(reorderAt(ABCD, 3, 0).map((a) => a.id), ['d', 'a', 'b', 'c']);

const ABCDsnap = ABCD.map((r) => ({ id: r.id }));
reorderAt(ABCD, 1, 3);
assert.deepEqual(ABCD, ABCDsnap);

const freeTransfer = [{ id: 'f1', accountId: 'c2', transferTo: 'c1', amount: 15, kind: 'transfer', date: d(2026, 9, 8) }];
assert.equal(accountBalance(freeTransfer, 'c1'), 15);
assert.equal(accountBalance(freeTransfer, 'c2'), -15);
assert.equal(totalBalance(accounts, freeTransfer), 0);

const transferTx = { id: 't1', kind: 'transfer', accountId: 'c1', transferTo: 'c2', amount: 50 };
assert.equal(matchesAccountFilter(transferTx, 'all'), true);
assert.equal(matchesAccountFilter(transferTx, 'c1'), true);  // match sorgente
assert.equal(matchesAccountFilter(transferTx, 'c2'), true);  // match destinazione
assert.equal(matchesAccountFilter(transferTx, 'c3'), false); // conto non coinvolto
assert.equal(matchesAccountFilter(txs[0], 'all'), true);
assert.equal(matchesAccountFilter(txs[0], 'c1'), true);
assert.equal(matchesAccountFilter(txs[0], 'c2'), false);

assert.equal(startOfMonth(d(2026, 9, 20)), new Date(2026, 8, 1).getTime());

assert.deepEqual(periodRange({ mode: 'month', anchor: d(2026, 9, 3) }), {
  startMs: new Date(2026, 8, 1).getTime(),
  endMs: new Date(2026, 9, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'bimester', anchor: d(2026, 7, 20) }), {
  startMs: new Date(2026, 6, 1).getTime(),
  endMs: new Date(2026, 8, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'bimester', anchor: d(2026, 4, 10) }), {
  startMs: new Date(2026, 2, 1).getTime(),
  endMs: new Date(2026, 4, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'quarter', anchor: d(2026, 4, 10) }), {
  startMs: new Date(2026, 3, 1).getTime(),
  endMs: new Date(2026, 6, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'semester', anchor: d(2026, 9, 3) }), {
  startMs: new Date(2026, 6, 1).getTime(),
  endMs: new Date(2026, 11, 31, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'year', anchor: d(2026, 2, 5) }), {
  startMs: new Date(2026, 0, 1).getTime(),
  endMs: new Date(2026, 11, 31, 23, 59, 59, 999).getTime(),
});
assert.equal(periodRange({ mode: 'all' }), null);
assert.deepEqual(periodRange({ mode: 'custom', customStart: d(2025, 7, 1), customEnd: d(2026, 9, 1) }), {
  startMs: new Date(2025, 6, 1).getTime(),
  endMs: new Date(2026, 9, 0, 23, 59, 59, 999).getTime(),
});

assert.equal(shiftAnchor(d(2026, 1, 15), 'month', -1), new Date(2025, 11, 1).getTime());
assert.equal(shiftAnchor(d(2026, 7, 20), 'quarter', 1), new Date(2026, 9, 1).getTime());
assert.equal(shiftAnchor(d(2026, 2, 5), 'year', 1), new Date(2027, 1, 1).getTime());
assert.equal(shiftAnchor(d(2026, 7, 20), 'all', 1), d(2026, 7, 20));
assert.equal(shiftAnchor(d(2026, 7, 20), 'custom', -1), d(2026, 7, 20));

assert.equal(formatPeriodLabel({ mode: 'month', anchor: d(2026, 7, 1) }), 'Luglio 2026');
assert.equal(formatPeriodLabel({ mode: 'bimester', anchor: d(2026, 7, 1) }), 'Bim. Lug\u2013Ago 2026');
assert.equal(formatPeriodLabel({ mode: 'quarter', anchor: d(2026, 7, 1) }), 'Trim. Lug\u2013Set 2026');
assert.equal(formatPeriodLabel({ mode: 'semester', anchor: d(2026, 9, 1) }), 'Sem. Lug\u2013Dic 2026');
assert.equal(formatPeriodLabel({ mode: 'year', anchor: d(2026, 2, 1) }), '2026');
assert.equal(formatPeriodLabel({ mode: 'all' }), 'Tutti i mesi');
assert.equal(formatPeriodLabel({ mode: 'custom', customStart: d(2026, 7, 1), customEnd: d(2026, 9, 1) }), 'Lug \u2013 Set 2026');
assert.equal(formatPeriodLabel({ mode: 'custom', customStart: d(2025, 11, 1), customEnd: d(2026, 2, 1) }), 'Nov 2025 \u2013 Feb 2026');

console.log('Tutti i controlli di finanza/format/categorie passano.');