# Categoria "Trasferimento" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere una categoria filtro `Trasferimento` nella schermata Movimenti, in OR con le altre categorie, senza renderla selezionabile nei movimenti di uscita/entrata.

**Architecture:** Si aggiunge `trasferimento` a `CATEGORIES` (unica fonte per la griglia filtri) e si esporta `SPENDING_CATEGORIES` (senza `trasferimento`) per il form. Il matching di filtro passa dal vecchio `matchesCategoryFilter(selected, category)` al nuovo `matchesCategorySelection(selected, transaction)`, che gestisce separatamente i trasferimenti. Home e grafici restano invariati.

**Tech Stack:** React Native / Expo SDK 57, RN 0.86.3, React 19.2.3, test puri con `node:assert`.

## Global Constraints

- Nessuna nuova dipendenza: usare solo API già presenti nel progetto.
- Niente commenti aggiunti al codice.
- Test puri in `scripts/finance.spec.mjs`, eseguiti con `node --experimental-detect-module scripts/finance.spec.mjs` → output atteso `Tutti i controlli di finanza/format/categorie passano.`
- Verifica bundle: `npx expo export --platform android` → output atteso `Exported: dist`.
- Commit stile conventional in italiano (`feat:`, `fix:`, `refactor:`, `test:`).
- Messaggi utente in italiano.
- La riga fissa dei filtri categoria deve restare di 4 posizioni `[Tutte] [Cibo] [Trasporti] [⌄]`: la nuova tile va nella griglia espandibile.

---

### Task 1: Categoria `trasferimento`, `SPENDING_CATEGORIES` e helper di filtro

**Files:**
- Modify: `src/constants/categories.js`
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: niente.
- Produces:
  - `CATEGORIES` con 12 voci; l'ultima è `{ key:'trasferimento', label:'Trasferimento', icon:'swap-horizontal-outline', color:'#9CA3AF' }`.
  - `SPENDING_CATEGORIES` (array) = `CATEGORIES` senza `trasferimento`, per il form.
  - `matchesCategorySelection(selectedKeys, transaction) -> boolean`. Ritorna `true` se `selectedKeys` è vuoto; se `transaction.kind === 'transfer'` ritorna `selectedKeys.includes('trasferimento')`; altrimenti `selectedKeys.includes(transaction.category)`.
  - `matchesCategoryFilter` viene rimossa (unico consumatore: `TransactionsScreen.js`, aggiornato in Task 2).

- [ ] **Step 1: Write the failing test**

In `scripts/finance.spec.mjs`, riga 3, sostituisci `matchesCategoryFilter` con `matchesCategorySelection`:

```js
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategorySelection } from '../src/constants/categories.js';
```

Riga 56, sostituisci:

```js
assert.equal(CATEGORIES.length, 11);
```

con:

```js
assert.equal(CATEGORIES.length, 12);
```

Righe 63-66, sostituisci l'atteso di `orderedCategoryKeys()`:

```js
assert.deepEqual(orderedCategoryKeys(), {
  central: ['cibo', 'trasporti'],
  rest: ['casa', 'bollette', 'salute', 'svago', 'sport', 'auto', 'shopping', 'stipendio', 'altro', 'trasferimento'],
});
```

Righe 77-80, sostituisci i test di `matchesCategoryFilter` con:

```js
assert.equal(matchesCategorySelection([], txs[1]), true);                                  // set vuoto = nessun filtro
const transferForCat = { id: 'tc1', kind: 'transfer', accountId: 'c1', transferTo: 'c2', amount: 10 };
assert.equal(matchesCategorySelection(['trasferimento'], transferForCat), true);           // trasferimento con tile Trasferimento
assert.equal(matchesCategorySelection(['cibo'], transferForCat), false);                   // trasferimento senza tile Trasferimento
assert.equal(matchesCategorySelection(['cibo'], txs[1]), true);                            // uscita Cibo con categoria Cibo
assert.equal(matchesCategorySelection(['trasporti'], txs[1]), false);                      // uscita Cibo con altra categoria
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], transferForCat), true);   // OR
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], txs[1]), true);           // OR
assert.equal(matchesCategorySelection(['cibo', 'trasferimento'], txs[3]), false);          // OR, categoria non selezionata
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL con `SyntaxError: The requested module '../src/constants/categories.js' does not provide an export named 'matchesCategorySelection'`.

- [ ] **Step 3: Update `src/constants/categories.js`**

Aggiungi la nuova categoria in coda a `CATEGORIES`, dopo la riga di `altro`:

```js
  { key: 'trasferimento', label: 'Trasferimento', icon: 'swap-horizontal-outline', color: '#9CA3AF' },
```

Dopo `CATEGORY_MAP`, aggiungi:

```js
export const SPENDING_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'trasferimento');
```

Sostituisci la funzione `matchesCategoryFilter` con:

```js
export function matchesCategorySelection(selectedKeys, transaction) {
  if (selectedKeys.length === 0) return true;
  if (transaction.kind === 'transfer') return selectedKeys.includes('trasferimento');
  return selectedKeys.includes(transaction.category);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS con output `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/constants/categories.js scripts/finance.spec.mjs
git commit -m "feat: categoria Trasferimento e filtro per transazione"
```

---

### Task 2: Collegamento UI (Movimenti e form)

**Files:**
- Modify: `src/screens/TransactionsScreen.js`
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: `matchesCategorySelection(selectedKeys, transaction)` e `SPENDING_CATEGORIES` da Task 1.
- Produces: nessuna nuova interfaccia.

- [ ] **Step 1: Aggiorna il filtro in `TransactionsScreen.js`**

Riga 8, sostituisci:

```js
import { CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategoryFilter } from '../constants/categories';
```

con:

```js
import { CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategorySelection } from '../constants/categories';
```

Riga 41, sostituisci:

```js
        if (!matchesCategoryFilter(selectedCategories, t.category)) return false;
```

con:

```js
        if (!matchesCategorySelection(selectedCategories, t)) return false;
```

- [ ] **Step 2: Aggiorna la griglia del form in `TransactionFormModal.js`**

Riga 7, sostituisci:

```js
import { CATEGORIES } from '../constants/categories';
```

con:

```js
import { SPENDING_CATEGORIES } from '../constants/categories';
```

Riga 28, sostituisci:

```js
  const [category, setCategory] = useState(CATEGORIES[0].key);
```

con:

```js
  const [category, setCategory] = useState(SPENDING_CATEGORIES[0].key);
```

Riga 38, sostituisci:

```js
    setCategory(initial ? initial.category : CATEGORIES[0].key);
```

con:

```js
    setCategory(initial ? initial.category : SPENDING_CATEGORIES[0].key);
```

Riga 128, sostituisci:

```js
                {CATEGORIES.map((c) => {
```

con:

```js
                {SPENDING_CATEGORIES.map((c) => {
```

- [ ] **Step 3: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

Run: `npx expo export --platform android`
Expected: `Exported: dist`

Verifica manuale su device/emulatore:
- nella schermata Movimenti, aprendo la griglia categorie, la tile `Trasferimento` compare in fondo;
- selezionando solo `Trasferimento` (con filtro tipo `Tutte`) compaiono solo i trasferimenti;
- `Cibo` + `Trasferimento` mostra uscite Cibo e trasferimenti;
- con filtro tipo `Entrate` o `Uscite` la tile `Trasferimento` non mostra nulla;
- nel form di uscita/entrata la griglia categorie NON contiene `Trasferimento`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/TransactionsScreen.js src/components/TransactionFormModal.js
git commit -m "feat: collega la categoria Trasferimento a Movimenti e form"
```

---

## Note di self-review

- Copertura spec: nuova tile (Task 1 + griglia esistente in Task 2), OR con le altre categorie (helper Task 1), filtro tipo separato (Task 2 invariato), non selezionabile nel form (Task 2 `SPENDING_CATEGORIES`), Home invariata, test aggiornati (Task 1).
- Nessun placeholder; nomi coerenti (`SPENDING_CATEGORIES`, `matchesCategorySelection`, `trasferimento`).
- Le verifiche manuali restano a carico dell'umano su device; test ed export coprono la parte statica.
