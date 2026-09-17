# Riga categorie "mostra di più" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la griglia categorie della sezione Categoria in Movimenti con una singola riga di caselle sempre visibile: prima casella "Tutte", poi 2 categorie, ultima la freccia che espande mostrando le altre (stile "mostra di più").

**Architecture:** La logica di riordino delle tile (quali categorie mostrare in riga chiusa/aperta, con la categoria selezionata sempre visibile) è una funzione pura testabile `orderedCategoryKeys(selectedKey)` aggiunta a `src/constants/categories.js` e coperta dal harness esistente `scripts/finance.spec.mjs`. Il rendering in `src/screens/TransactionsScreen.js` usa un'unica `catGrid` con `flexWrap`: prima riga = Tutte + centrali + freccia, poi (se aperto) le restanti.

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
- Modify: `src/screens/TransactionsScreen.js` (import riga 2 e 8, stato dopo riga 23, calcolo dopo riga 30, toggle dopo riga 61, JSX righe 113-132, styles riga 174)

**Interfaces:**
- Consumes: `orderedCategoryKeys` dalla Task 1; `CATEGORY_MAP`, `colors`, `tileWidth`, `setCategory`, `category`, `kind` (già nel file).
- Produces: nessuna interfaccia esterna; stati/funzioni locali `categoriesExpanded`, `setCategoriesExpanded`, `toggleCategories`, `central`, `rest` usati solo nel JSX dello stesso componente.

- [ ] **Step 1: Aggiungere `LayoutAnimation` all'import di React Native**

Riga 2 attuale:
```js
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
```
Sostituisci con:
```js
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions, LayoutAnimation } from 'react-native';
```

- [ ] **Step 2: Importare l'helper e togliere `CATEGORIES` non più usato**

Riga 8 attuale:
```js
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
```
Sostituisci con:
```js
import { CATEGORY_MAP, orderedCategoryKeys } from '../constants/categories';
```
(`CATEGORIES` non serve più dopo la rimozione della `CATEGORIES.map` nel JSX; `CATEGORY_MAP` resta usato nel memo di filtro.)

- [ ] **Step 3: Aggiungere lo stato `categoriesExpanded`**

Dopo la riga 23 (`const [category, setCategory] = useState('all');`) aggiungi:
```js
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
```

- [ ] **Step 4: Calcolare riga centrale e resto**

Dopo la riga 30 (`const accountMap = ...`) aggiungi:
```js
  const { central, rest } = orderedCategoryKeys(category);
```

- [ ] **Step 5: Aggiungere la funzione di toggle**

Dopo la riga 61 (`const next = ...`) aggiungi:
```js
  const toggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesExpanded((v) => !v);
  };
```

- [ ] **Step 6: Sostituire il blocco JSX della sezione Categoria**

Il blocco attuale (righe 113-132):
```jsx
              {kind !== 'transfer' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Categoria</Text>
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

- [ ] **Step 7: Aggiungere lo stile della freccia**

Nel `StyleSheet.create`, subito dopo lo stile `catAllActive` (riga 174):
```js
  catAllActive: { backgroundColor: '#111827', borderColor: '#111827' },
```
aggiungi:
```js
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
```

- [ ] **Step 8: Verificare che non ci siano regressioni nella logica pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 9: Verifica manuale su device**

Avvia l'app e nella schermata Movimenti verifica:
1. All'apertura la sezione mostra la riga `[Tutte] [Cibo] [Trasporti] [⌄]` e i movimenti sottostanti non vengono coperti.
2. Tap sulla freccia → si aprono sotto le altre categorie (wrap da 4: `Casa, Bollette, Salute, Svago` / `Sport, Auto, Shopping, Stipendio` / `Altro`), freccia `⌃`.
3. Selezionando una categoria la griglia resta aperta e la tile risulta evidenziata col colore categoria; il filtro funziona.
4. Richiudendo con la freccia, la riga mostra la categoria selezionata subito dopo "Tutte" (es. selezionando "Stipendio": `[Tutte] [Stipendio] [Cibo] [⌄]`).
5. Selezionando "Tutte" e richiudendo: rientra l'ordine `[Tutte] [Cibo] [Trasporti] [⌄]`.
6. Selezionando il tipo "Trasferimenti" la sezione Categoria sparisce.
7. I movimenti restano visibili e filtrabili senza coperture.

- [ ] **Step 10: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "feat: riga categorie mostra-di-piu in Movimenti"
```

---

## Note di implementazione

- Il contenitore `catGrid` è unico (prima riga e resto nella stessa grid): con `flexWrap` e larghezza uniforme `tileWidth` la prima riga è esattamente 4 caselle e le `rest` proseguono sotto in righe da 4, con lo stesso `gap: 8`.
- `tileWidth` resta `Math.floor((width - 56) / 4)`: non cambia nulla rispetto a oggi.
- `orderedCategoryKeys` produce solo chiavi da `CATEGORIES`, quindi `CATEGORY_MAP[key]` è sempre definito.
- Lo stato attuale della sezione (prima di questa modifica) è la griglia piatta `CATEGORIES.map`: non esiste alcun header espandibile da rimuovere.
- Se sul device `LayoutAnimation` non animasse (New Architecture), è cosmetico: il toggle funziona comunque.