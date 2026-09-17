# Riga categorie "mostra di più" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il menu espandibile della sezione Categoria in Movimenti con una singola riga di caselle sempre visibile: prima casella "Tutte", poi 2 categorie, ultima la freccia che espande mostrando le altre (stile "mostra di più").

**Architecture:** La logica di riordino delle tile (quali categorie mostrare in riga chiusa/aperta, con la categoria selezionata sempre visibile) è una funzione pura testabile `orderedCategoryKeys(selectedKey)` aggiunta a `src/constants/categories.js` e coperta dal harness esistente `scripts/finance.spec.mjs`. Il rendering in `src/screens/TransactionsScreen.js` usa un'unica `catGrid` con `flexWrap`: prima riga = Tutte + centrali + freccia, poi (se aperto) le restanti; si rimuovono le tile/header del vecchio menu espandibile.

**Tech Stack:** React Native 0.86 (Expo 57, New Architecture), React 19, `@expo/vector-icons` (Ionicons), `LayoutAnimation` di React Native, Node test runner (`node --experimental-detect-module`) per i test puri.

## Global Constraints

- Data flow di filtro (`filtered`, `useMemo`, stati esistenti) invariato.
- Nessun nuovo componente o dipendenza: si toccano solo `src/constants/categories.js`, `src/screens/TransactionsScreen.js`, `scripts/finance.spec.mjs`.
- Con filtro tipo "Trasferimenti" la sezione Categoria resta nascosta; il reset categoria a `'all'` al cambio tipo è invariato.
- La selezione di una categoria lascia la griglia aperta; `LayoutAnimation.configureNext` anima l'apertura/chiusura.
- I test UI non esistono nel progetto: verifica manuale su device + test puri.

---

### Task 1: Helper `orderedCategoryKeys` con test TDD

**Files:**
- Modify: `src/constants/categories.js` (fine file)
- Modify: `scripts/finance.spec.mjs` (righe 1-4 import, fine file)

**Interfaces:**
- Consumes: `CATEGORIES` (array esistente di 11 categorie con chiavi `cibo, trasporti, casa, bollette, salute, svago, sport, auto, shopping, stipendio, altro`).
- Produces: `orderedCategoryKeys(selectedKey)` → `{ central: string[], rest: string[] }`. `central` = le 2 caselle tra "Tutte" e la freccia (prima riga); `rest` = le rimanenti categorie da mostrare sotto quando espanso. La somma di `central` + `rest` contiene tutte le 11 chiavi, senza duplicati.

- [ ] **Step 1: Scrivere i test che falliscono**

In `scripts/finance.spec.mjs`, riga 3, estendi l'import:
```js
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys } from '../src/constants/categories.js';
```

Alla fine del file aggiungi:
```js
assert.deepEqual(orderedCategoryKeys('all'), {
  central: ['cibo', 'trasporti'],
  rest: ['casa', 'bollette', 'salute', 'svago', 'sport', 'auto', 'shopping', 'stipendio', 'altro'],
});

const o = orderedCategoryKeys('stipendio');
assert.deepEqual(o.central, ['stipendio', 'cibo']);
assert.deepEqual(o.rest, ['trasporti', 'casa', 'bollette', 'salute', 'svago', 'sport', 'auto', 'shopping', 'altro']);
assert.equal(new Set([...o.central, ...o.rest]).size, 11); // nessun duplicato, tutte presenti

assert.deepEqual(orderedCategoryKeys('cibo').central, ['cibo', 'trasporti']);
assert.deepEqual(orderedCategoryKeys(undefined).central, ['cibo', 'trasporti']);
assert.deepEqual(orderedCategoryKeys('trasporti').central, ['cibo', 'trasporti']);
```

- [ ] **Step 2: Eseguire i test per verificare che falliscano**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL con `SyntaxError: The requested module '../src/constants/categories.js' does not provide an export named 'orderedCategoryKeys'`.

- [ ] **Step 3: Implementare `orderedCategoryKeys`**

In `src/constants/categories.js`, alla fine del file (dopo `CATEGORY_MAP`), aggiungi:
```js
export function orderedCategoryKeys(selectedKey) {
  const standard = CATEGORIES.map((c) => c.key);
  const firstTwo = standard.slice(0, 2);
  let central;
  if (!selectedKey || selectedKey === 'all' || firstTwo.includes(selectedKey)) {
    central = firstTwo;
  } else {
    central = [selectedKey, ...standard.filter((k) => k !== selectedKey)].slice(0, 2);
  }
  const rest = standard.filter((k) => !central.includes(k));
  return { central, rest };
}
```

- [ ] **Step 4: Eseguire i test per verificare che passino**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/constants/categories.js scripts/finance.spec.mjs
git commit -m "feat: helper orderedCategoryKeys per la riga categorie"
```

---

### Task 2: Riga categorie in TransactionsScreen

**Files:**
- Modify: `src/screens/TransactionsScreen.js` (import riga 8, riga dopo 31, JSX righe 119-148, styles righe 186-196)

**Interfaces:**
- Consumes: `orderedCategoryKeys` dalla Task 1; `CATEGORIES`, `CATEGORY_MAP`, `colors`, `tileWidth`, `categoriesExpanded`, `setCategoriesExpanded`, `toggleCategories`, `setCategory`, `category`, `kind` (tutti già nel file).
- Produces: nessuna interfaccia esterna; modifica locale al componente `TransactionsScreen`.

- [ ] **Step 1: Importare l'helper**

Riga 8 attuale:
```js
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
```
Sostituisci con:
```js
import { CATEGORIES, CATEGORY_MAP, orderedCategoryKeys } from '../constants/categories';
```

- [ ] **Step 2: Calcolare riga centrale e resto**

Dopo la riga 31 (`const accountMap = ...`), aggiungi:
```js
  const { central, rest } = orderedCategoryKeys(category);
```

- [ ] **Step 3: Sostituire il blocco JSX della sezione Categoria**

Il blocco attuale (righe 119-148):
```jsx
              {kind !== 'transfer' ? (
                <View style={styles.section}>
                  <Pressable style={styles.sectionHeader} onPress={toggleCategories}>
                    <Text style={[styles.sectionLabel, styles.sectionLabelInHeader]}>Categoria</Text>
                    <View style={styles.sectionHeaderRight}>
                      {!categoriesExpanded && category !== 'all' ? (
                        <Text style={styles.sectionValue}>{(CATEGORY_MAP[category] || CATEGORY_MAP.altro).label}</Text>
                      ) : null}
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                    </View>
                  </Pressable>
                  {categoriesExpanded ? (
                    <View style={styles.catGrid}>
                      <Pressable style={[styles.catTileBase, { width: tileWidth }, category === 'all' && styles.catAllActive]} onPress={() => setCategory('all')}>
                        <Ionicons name="apps-outline" size={22} color={category === 'all' ? '#fff' : colors.textMuted} />
                        <Text style={[styles.catText, category === 'all' && styles.catTextActive]}>Tutte</Text>
                      </Pressable>
                      {CATEGORIES.map((c) => {
                        const active = category === c.key;
                        return (
                          <Pressable key={c.key} style={[styles.catTileBase, { width: tileWidth }, active && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategory(c.key)}>
                            <Ionicons name={c.icon} size={22} color={active ? '#fff' : c.color} />
                            <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              ) : null}
```

Sostituisci con:
```jsx
              {kind !== 'transfer' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Categoria</Text>
                  <View style={styles.catGrid}>
                    <Pressable style={[styles.catTileBase, { width: tileWidth }, category === 'all' && styles.catAllActive]} onPress={() => setCategory('all')}>
                      <Ionicons name="apps-outline" size={22} color={category === 'all' ? '#fff' : colors.textMuted} />
                      <Text style={[styles.catText, category === 'all' && styles.catTextActive]}>Tutte</Text>
                    </Pressable>
                    {central.map((key) => {
                      const c = CATEGORY_MAP[key];
                      const active = category === key;
                      return (
                        <Pressable key={key} style={[styles.catTileBase, { width: tileWidth }, active && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategory(key)}>
                          <Ionicons name={c.icon} size={22} color={active ? '#fff' : c.color} />
                          <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                    <Pressable style={[styles.catTileArrow, { width: tileWidth }]} onPress={toggleCategories}>
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={colors.textMuted} />
                    </Pressable>
                    {categoriesExpanded
                      ? rest.map((key) => {
                          const c = CATEGORY_MAP[key];
                          const active = category === key;
                          return (
                            <Pressable key={key} style={[styles.catTileBase, { width: tileWidth }, active && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategory(key)}>
                              <Ionicons name={c.icon} size={22} color={active ? '#fff' : c.color} />
                              <Text style={[styles.catText, active && styles.catTextActive]}>{c.label}</Text>
                            </Pressable>
                          );
                        })
                      : null}
                  </View>
                </View>
              ) : null}
```

- [ ] **Step 4: Aggiornare gli stili**

Nel `StyleSheet.create`, rimuovi gli stili ormai inutilizzati (righe 187-190):
```js
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabelInHeader: { marginBottom: 0 },
  sectionValue: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
```

Aggiungi al posto della riga `catAllActive` il nuovo stile della freccia:
```js
  catAllActive: { backgroundColor: '#111827', borderColor: '#111827' },
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
```

- [ ] **Step 5: Verificare che non ci siano regressioni nella logica pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 6: Verifica manuale su device**

Avvia l'app e nella schermata Movimenti verifica:
1. All'apertura la sezione mostra la riga `[Tutte] [Cibo] [Trasporti] [⌄]` e la griglia sottostante non copre i movimenti.
2. Tap sulla freccia → si aprono sotto le altre categorie (wrap da 4: `Casa, Bollette, Salute, Svago` / `Sport, Auto, Shopping, Stipendio` / `Altro`), freccia `⌃`.
3. Selezionando una categoria la griglia resta aperta e la tile risulta evidenziata col colore categoria; il filtro funziona.
4. Richiudendo con la freccia, la riga mostra la categoria selezionata subito dopo "Tutte" (es. selezionando "Stipendio": `[Tutte] [Stipendio] [Cibo] [⌄]`).
5. Selezionando "Tutte" e richiudendo: rientra l'ordine `[Tutte] [Cibo] [Trasporti] [⌄]`.
6. Selezionando il tipo "Trasferimenti" la sezione Categoria sparisce.
7. I movimenti restano visibili e filtrabili senza coperture.

- [ ] **Step 7: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "feat: riga categorie mostra-di-piu in Movimenti"
```

---

## Note di implementazione

- Il contenitore `catGrid` è unico (prima riga e resto nella stessa grid): con `flexWrap` e larghezza uniforme `tileWidth` la prima riga è esattamente  4 caselle e le `rest` proseguono sotto in righe da 4, con lo stesso `gap: 8`.
- `tileWidth` resta `Math.floor((width - 56) / 4)`: non cambia nulla rispetto a oggi.
- Il fallback `CATEGORY_MAP[key]` per le chiavi della griglia è sempre valido perché `orderedCategoryKeys` produce solo chiavi da `CATEGORIES`.
- `CATEGORY_MAP` resta importato e usato nel memo di filtro (riga 43): non rimuoverlo.
- Se sul device `LayoutAnimation` non animasse (New Architecture), è cosmetico: il toggle funziona comunque.