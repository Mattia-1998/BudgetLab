# Multi-selezione categorie (ordine fisso) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** La selezione categoria della schermata Movimenti diventa multi-selezione con icone a posizione fissa: le tile non si riordinano più alla selezione, si possono selezionare più categorie insieme (filtro OR), e la freccia si illumina quando c'è un filtro attivo a menu chiuso.

**Architecture:** La logica pura (toggle del set, predicato di filtro, ordine fisso, stato della freccia) vive in `src/constants/categories.js` ed è testata in `scripts/finance.spec.mjs`. `src/screens/TransactionsScreen.js` sostituisce lo stato `category` (`'all'` | chiave) con `selectedCategories` (array, vuoto = nessun filtro) e usa le funzioni pure nei punti giusti. Nessuna nuova dipendenza.

**Tech Stack:** React Native 0.86 (Expo 57, New Architecture), React 19, `@expo/vector-icons` (Ionicons), `LayoutAnimation` di React Native, Node test runner (`node --experimental-detect-module`).

## Global Constraints

- Data flow degli altri filtri (`query`, `kind`, `accountId`, `month`, `allMonths`) invariato.
- Solo questi file: `src/constants/categories.js`, `src/screens/TransactionsScreen.js`, `scripts/finance.spec.mjs`.
- La sezione Categoria resta nascosta per `kind === 'transfer'`; il passaggio a `transfer` azzera la selezione.
- Selezione = OR (almeno una categoria); set vuoto = nessun filtro.
- Niente riordino delle icone: riga sempre `[Tutte] [Cibo] [Trasporti] [⌄]`; espandendo appaiono le restanti 9 sotto (wrap da 4).
- Test UI assenti: verifica manuale su device + test puri.

---

### Task 1: Logica pura multi-selezione (TDD)

**Files:**
- Modify: `src/constants/categories.js:17-28`
- Modify: `scripts/finance.spec.mjs:3,63-75`

**Interfaces:**
- Consumes: `CATEGORIES`, `CATEGORY_MAP` (esistenti).
- Produces:
  - `orderedCategoryKeys()` → `{ central: ['cibo','trasporti'], rest: string[] }` (le altre 9, ordine standard). **Niente parametro.**
  - `toggleCategory(selectedKeys: string[], key: string)` → nuova array con `key` aggiunta o rimossa, senza duplicati, ordine di inserimento.
  - `hasSelectedCategories(selectedKeys: string[])` → `boolean` (true se non vuoto).
  - `matchesCategoryFilter(selectedKeys: string[], category: string)` → `boolean` (true se `selectedKeys` vuoto oppure `category` incluso nel set).

- [ ] **Step 1: Aggiornare i test (RED)**

Riga 3 di `scripts/finance.spec.mjs`, estendi l'import:
```js
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategoryFilter } from '../src/constants/categories.js';
```

Sostituisci il blocco finale (righe 63-75) con:
```js
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
```

- [ ] **Step 2: Eseguire i test per verificare che falliscano**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL — `SyntaxError: ... does not provide an export named 'toggleCategory'` (o primo assert che fallisce sul vecchio comportamento di `orderedCategoryKeys(selectedKey)`).

- [ ] **Step 3: Aggiornare `src/constants/categories.js`**

Sostituisci la funzione `orderedCategoryKeys` (righe 17-28) con:
```js
export function orderedCategoryKeys() {
  const standard = CATEGORIES.map((c) => c.key);
  return { central: standard.slice(0, 2), rest: standard.slice(2) };
}

export function toggleCategory(selectedKeys, key) {
  return selectedKeys.includes(key)
    ? selectedKeys.filter((k) => k !== key)
    : [...selectedKeys, key];
}

export function hasSelectedCategories(selectedKeys) {
  return selectedKeys.length > 0;
}

export function matchesCategoryFilter(selectedKeys, category) {
  return selectedKeys.length === 0 || selectedKeys.includes(category);
}
```

- [ ] **Step 4: Eseguire i test per verificare che passino**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/constants/categories.js scripts/finance.spec.mjs
git commit -m "feat: multi-selezione categorie - logica pura (toggle, filtro OR, ordine fisso)"
```

---

### Task 2: Multi-selezione nella schermata Movimenti

**Files:**
- Modify: `src/screens/TransactionsScreen.js` (import riga 8, stato riga 23, calcolo riga 32, filtro riga 41 e 51, pill tipo riga 97, JSX righe 124-152, styles riga 198)

**Interfaces:**
- Consumes: `orderedCategoryKeys()` senza parametro, `toggleCategory`, `hasSelectedCategories`, `matchesCategoryFilter`, `CATEGORY_MAP` dalla Task 1.
- Produces: nessuna interfaccia esterna; il componente usa lo stato locale `selectedCategories` (array, default `[]`).

- [ ] **Step 1: Aggiornare gli import**

Riga 8 attuale:
```js
import { CATEGORY_MAP, orderedCategoryKeys } from '../constants/categories';
```
Sostituisci con:
```js
import { CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategoryFilter } from '../constants/categories';
```

- [ ] **Step 2: Sostituire lo stato `category`**

Riga 23 attuale:
```js
  const [category, setCategory] = useState('all');
```
Sostituisci con:
```js
  const [selectedCategories, setSelectedCategories] = useState([]);
```

- [ ] **Step 3: Aggiornare il calcolo della riga**

Riga 32 attuale:
```js
  const { central, rest } = orderedCategoryKeys(category);
```
Sostituisci con:
```js
  const { central, rest } = orderedCategoryKeys();
```

- [ ] **Step 4: Aggiornare il memo di filtro**

Riga 41 attuale:
```js
        if (category !== 'all' && t.category !== category) return false;
```
Sostituisci con:
```js
        if (!matchesCategoryFilter(selectedCategories, t.category)) return false;
```

Riga 51 (array delle dipendenze) attuale:
```js
  }, [transactions, query, kind, accountId, category, month, allMonths]);
```
Sostituisci con:
```js
  }, [transactions, query, kind, accountId, selectedCategories, month, allMonths]);
```

- [ ] **Step 5: Azzerare la selezione al filtro tipo Trasferimenti**

Riga 97 attuale:
```js
                <Pressable key={opt.value} style={[styles.pill, kind === opt.value && styles.pillActive]} onPress={() => { setKind(opt.value); if (opt.value === 'transfer') setCategory('all'); }}>
```
Sostituisci con:
```js
                <Pressable key={opt.value} style={[styles.pill, kind === opt.value && styles.pillActive]} onPress={() => { setKind(opt.value); if (opt.value === 'transfer') setSelectedCategories([]); }}>
```

- [ ] **Step 6: Aggiornare il JSX della sezione Categoria**

Il blocco attuale (righe 123-152, dentro `{kind !== 'transfer' ? ...}`) usa `category === 'all'`, `category === key` e `setCategory(...)`. Sostituisci l'intero `catGrid` (contenitore `styles.catGrid`) con:
```jsx
                  <View style={styles.catGrid}>
                    <Pressable style={[styles.catTileBase, { width: tileWidth }, selectedCategories.length === 0 && styles.catAllActive]} onPress={() => setSelectedCategories([])}>
                      <Ionicons name="apps-outline" size={22} color={selectedCategories.length === 0 ? '#fff' : colors.textMuted} />
                      <Text style={[styles.catText, selectedCategories.length === 0 && styles.catTextActive]}>Tutte</Text>
                    </Pressable>
                    {central.map((key) => {
                      const c = CATEGORY_MAP[key];
                      const active = selectedCategories.includes(key);
                      return (
                        <Pressable key={key} style={[styles.catTileBase, { width: tileWidth }, active && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}>
                          <Ionicons name={c.icon} size={22} color={active ? '#fff' : c.color} />
                          <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable style={[styles.catTileArrow, { width: tileWidth }, !categoriesExpanded && hasSelectedCategories(selectedCategories) && styles.catTileArrowActive]} onPress={toggleCategories}>
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={!categoriesExpanded && hasSelectedCategories(selectedCategories) ? '#fff' : colors.textMuted} />
                    </Pressable>
                    {categoriesExpanded
                      ? rest.map((key) => {
                          const c = CATEGORY_MAP[key];
                          const active = selectedCategories.includes(key);
                          return (
                            <Pressable key={key} style={[styles.catTileBase, { width: tileWidth }, active && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}>
                              <Ionicons name={c.icon} size={22} color={active ? '#fff' : c.color} />
                              <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                            </Pressable>
                          );
                        })
                      : null}
                  </View>
```

- [ ] **Step 7: Aggiungere lo stile della freccia attiva**

Nel `StyleSheet.create`, subito dopo `catTileArrow` (riga 198):
```js
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
```
aggiungi:
```js
  catTileArrowActive: { backgroundColor: '#111827', borderColor: '#111827' },
```

- [ ] **Step 8: Verificare che non ci siano regressioni nella logica pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 9: Verifica manuale su device**

Avvia l'app e nella schermata Movimenti verifica:
1. Le icone **non si spostano**: selezionando "Stipendio" (dopo l'espansione), la riga chiusa resta `[Tutte] [Cibo] [Trasporti] [⌄]`.
2. Multi-selezione: seleziona Cibo e Trasporti → la lista mostra i movimenti di entrambe (OR). Le due tile accese contemporaneamente.
3. Deselezione: ri-tap su una categoria la spegne e toglie i relativi movimenti.
4. "Tutte" accesa quando selezione vuota; tap su "Tutte" azzera tutto e spegne le tile.
5. Freccia: con selezione attiva e menu chiuso la freccia è **illuminata** (sfondo scuro, chevron bianco); senza selezione o a menu aperto resta neutra.
6. Filtro tipo "Trasferimenti" → sezione Categoria nascosta e selezione azzerata.
7. I movimenti filtrano correttamente con ricerca, mese e conto combinati.

- [ ] **Step 10: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "feat: multi-selezione categorie con ordine fisso in Movimenti"
```

---

## Note di implementazione

- `orderedCategoryKeys()` non riceve più argomenti: ogni altro call site esistente che passava `category` va aggiornato (qui dentro `src/screens/TransactionsScreen.js:32`; nessun altro file usa la funzione — verificato al momento del piano).
- Il predicato `matchesCategoryFilter` non cambia il comportamento sui trasferimenti: senza `category`, se la selezione non è vuota i trasferimenti restano esclusi (come con la vecchia singola selezione diversa da `'all'`).
- Il passaggio a `transfer` azzera la selezione cercando fuori dal set; tornando a un tipo non-transfer la selezione resta vuota (nessun filtro) finché non si seleziona di nuovo qualcosa.
- Se sul device `LayoutAnimation` non animasse, è cosmetico: il toggle funziona comunque.