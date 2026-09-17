# Sezione Categorie espandibile — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendi la sezione "Categoria" della schermata Movimenti un menu espandibile chiuso di default, così non occupa spazio né nasconde i movimenti.

**Architecture:** Tutta la modifica è locale a `src/screens/TransactionsScreen.js`. Si aggiunge uno stato `categoriesExpanded`, si trasforma l'header della sezione in un `Pressable` con chevron che alterna la visibilità della griglia esistente, e si mostra il nome della categoria attiva quando la griglia è chiusa. Nessun nuovo componente, nessuna modifica al data flow di filtro.

**Tech Stack:** React Native 0.86 (Expo 57, New Architecture), React 19, `@expo/vector-icons` (Ionicons), `LayoutAnimation` di React Native.

## Global Constraints

- Nessun nuovo componente o dipendenza: solo `src/screens/TransactionsScreen.js`.
- Il data flow di filtro (`filtered`, `useMemo`, stati esistenti) resta invariato.
- La sezione "Conto" resta sempre visibile.
- Stato iniziale: `categoriesExpanded === false`.
- Con filtro tipo "Trasferimenti" la sezione resta nascosta; il reset categoria a `'all'` al cambio tipo è invariato.
- Non ci sono test UI automatizzati nel progetto: la verifica è manuale su device + esecuzione dei test di logica pura esistenti.

---

### Task 1: Sezione Categoria espandibile

**Files:**
- Modify: `src/screens/TransactionsScreen.js` (import riga ~2, stato ~riga 25, JSX ~righe 113-132, styles ~righe 169-173)

**Interfaces:**
- Consumes: `CATEGORIES` e `CATEGORY_MAP` (già importati da `../constants/categories`), `colors` (già importato).
- Produces: nessuna interfaccia esterna; modifica puramente locale al componente `TransactionsScreen`.

- [ ] **Step 1: Aggiungere `LayoutAnimation` all'import di React Native**

Riga 2 attuale:
```js
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions } from 'react-native';
```

Sostituisci con:
```js
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions, LayoutAnimation } from 'react-native';
```

- [ ] **Step 2: Aggiungere lo stato `categoriesExpanded`**

Dopo la riga dello stato `category` (attorno alla riga 23):
```js
  const [category, setCategory] = useState('all');
```

aggiungi:
```js
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
```

- [ ] **Step 3: Aggiungere la funzione di toggle**

Dopo la funzione `next` (attorno alla riga 61):
```js
  const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
```

aggiungi:
```js
  const toggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesExpanded((v) => !v);
  };
```

- [ ] **Step 4: Sostituire l'header della sezione Categoria e rendere condizionale la griglia**

Nel blocco `{kind !== 'transfer' ? ( ... ) : null}` attorno alle righe 113-132, sostituisci l'intero blocco attuale:
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

con:
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

- [ ] **Step 5: Aggiungere gli stili**

Nel `StyleSheet.create` alla riga dello stile `sectionLabel` (attorno alla riga 170):
```js
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 8 },
```

aggiungi subito dopo:
```js
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabelInHeader: { marginBottom: 0 },
  sectionValue: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
```

- [ ] **Step 6: Verificare che non ci siano regressioni nella logica pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 7: Verifica manuale su device**

Avvia l'app (script di build/dev dell'utente) e nella schermata Movimenti verifica:
1. All'apertura, la griglia categorie è **chiusa** e si vede solo la riga "Categoria" con chevron verso il basso.
2. Tap sull'header → la griglia si apre (chevron verso l'alto).
3. Selezionando una categoria, la griglia **resta aperta** e la tile diventa attiva.
4. Chiudendo l'header, accanto a "Categoria" compare il **nome della categoria** selezionata; il filtro continua a funzionare.
5. Con "Tutte" selezionata e griglia chiusa, non compare nessun valore accanto all'header.
6. Selezionando il tipo "Trasferimenti", la sezione Categoria sparisce.
7. I movimenti sottostanti sono visibili e non vengono più coperti.

- [ ] **Step 8: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "feat: sezione categorie espandibile in Movimenti"
```

---

## Note di implementazione

- `LayoutAnimation` su React Native New Architecture (Fabric, RN 0.86) funziona senza il flag `UIManager.setLayoutAnimationEnabledExperimental`. Se sul device l'animazione non partisse, è cosmetico: la funzionalità di apertura/chiusura resta corretta.
- `CATEGORY_MAP` è già importato nella riga 8; il fallback `CATEGORY_MAP.altro` evita crash se una chiave categoria non esiste.
- Il margine inferiore della griglia aperta è gestito da `catGrid` (`gap: 8`); il vecchio margine della label è azzerato da `sectionLabelInHeader` solo nell'header, quindi la sezione "Conto" resta invariata.
