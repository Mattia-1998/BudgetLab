# Restyle pagina Movimenti (stile banking) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restilizzare la tab Movimenti in stile banking (barra di ricerca, pill tipo, sezione Conto a pill orizzontali, griglia Categoria 4 colonne, stato vuoto tratteggiato) mantenendo icone Ionicons esistenti e logica invariata.

**Architecture:** Unica modifica alla schermata `src/screens/TransactionsScreen.js`: si restilizza la barra di ricerca e i tre filtri (tipo, conto, categoria) sostituendo i `Segmented` con pill/section nel layout della pagina. Alla fine ricerca + filtri vengono spostati in `ListHeaderComponent` della `FlatList` (scroll unico con l'elenco) e lo stato vuoto diventa una card tratteggiata come `ListEmptyComponent`. `TransactionItem`, `MonthCarousel`, FAB e logica dei filtri restano invariati.

**Tech Stack:** React Native (JavaScript), Expo SDK, Ionicons (`@expo/vector-icons`). Nessuna dipendenza nuova.

## Global Constraints

- Colori: usare i token di `src/theme/colors.js` dove esistono (`colors.primary`, `colors.chipBorder`, `colors.faintText`, `colors.text`, `colors.textMuted`, `colors.background`); esadecimali locali solo dove il tema non li copre (grigi della sola schermata: `#F9FAFB`, `#E5E7EB`, `#F1F2F4`, `#4A5568`, `#374151`, `#111827`, `#D1D5DB`, `#F3F4F6`, `#1F2937`).
- Nessuna nuova dipendenza in `package.json`.
- Logica di business invariata: stesso `state` (`query`, `kind`, `accountId`, `category`, `month`, `allMonths`), stessa `filtered` e stessi `onChange`/filtri.
- Testi in italiano. `Segmented` resta usato solo in `TransactionFormModal`; la tab Movimenti non deve importarlo più dalla fine (Task 4).
- Verifica obbligatoria di ogni task: `npx expo export --platform android` (atteso: `Exported: dist`).
- Commit frequenti, uno per task, sul branch `main`. Push solo su richiesta dell'utente.

---

### Task 1: Barra di ricerca e pill tipo (Tutte/Entrate/Uscite)

**Files:**
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: `colors`, `Ionicons`, `MonthCarousel`, stato `query`/`kind` già presenti nella schermata.
- Produces: layout superiore senza wrapper `filters`; placeholder "Cerca per categoria o nota...", pulsante di svuotamento, pill tipo → gestiscono gli stessi `query`/`kind`.

- [ ] **Step 1: Aggiornare il JSX dell'intestazione**

In `src/screens/TransactionsScreen.js` sostituire il blocco dalla `<TextInput ... />` di ricerca (riga ~64) fino alla chiusura del `<View style={styles.filters}>` (riga ~89, che contiene i tre `Segmented` e il `MonthCarousel`) con:

```jsx
<View style={styles.searchWrap}>
  <Ionicons name="search-outline" size={18} color={colors.faintText} style={styles.searchIcon} />
  <TextInput style={styles.search} placeholder="Cerca per categoria o nota..." value={query} onChangeText={setQuery} />
  {query ? (
    <Pressable style={styles.searchClear} onPress={() => setQuery('')} hitSlop={8}>
      <Ionicons name="close-circle" size={18} color={colors.faintText} />
    </Pressable>
  ) : null}
</View>
<View style={styles.filterRow}>
  {[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }].map((opt) => (
    <Pressable key={opt.value} style={[styles.pill, kind === opt.value && styles.pillActive]} onPress={() => setKind(opt.value)}>
      <Text style={[styles.pillText, kind === opt.value && styles.pillTextActive]}>{opt.label}</Text>
    </Pressable>
  ))}
</View>
<View style={styles.monthWrap}>
  <MonthCarousel month={month} label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)} onPrev={prev} onNext={next} onAll={() => setAllMonths((v) => !v)} allActive={allMonths} />
</View>
<View style={styles.filterBlock}>
  <Segmented options={[{ value: 'all', label: 'Conto: tutti' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} value={accountId} onChange={setAccountId} />
  <Segmented options={[{ value: 'all', label: 'Cat: tutte' }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]} value={category} onChange={setCategory} />
</View>
```

- [ ] **Step 2: Aggiornare gli stili**

Nello `StyleSheet`, **rimuovere** `search` (vecchio) e `filters`. Rimpiazzarli con:

```js
searchWrap: { marginHorizontal: 16, marginTop: 12, justifyContent: 'center' },
search: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 14, paddingLeft: 40, paddingRight: 40, fontSize: 14, color: colors.text },
searchIcon: { position: 'absolute', left: 14 },
searchClear: { position: 'absolute', right: 12 },
filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 },
pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 17, backgroundColor: '#F1F2F4', borderWidth: 1, borderColor: colors.chipBorder },
pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
pillText: { fontSize: 13, fontWeight: '500', color: '#4A5568' },
pillTextActive: { color: '#fff', fontWeight: '600' },
monthWrap: { marginHorizontal: 16, marginTop: 10 },
filterBlock: { paddingHorizontal: 16, marginTop: 8 },
```

- [ ] **Step 3: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "style: barra di ricerca e pill del filtro tipo nella pagina movimenti"
```

---

### Task 2: Sezione Conto (pill orizzontali con pallino colore)

**Files:**
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: campo `account.color` e `account.name` sui documenti account (già usati); `ScrollView` da `react-native`.
- Produces: sezione "Conto" con pill "Tutti i conti" + una pill per account con pallino `a.color`; scrive su `accountId` come il `Segmented` precedente.

- [ ] **Step 1: Aggiungere `ScrollView` all'import di `react-native`**

Modificare la riga d'import (riga 2):

```js
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
```

- [ ] **Step 2: Sostituire il segmetato Conto con la sezione a pill**

In `filterBlock`, sostituire la prima voce (il `Segmented` di `accountId`) con:

```jsx
<View style={styles.section}>
  <Text style={styles.sectionLabel}>Conto</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
    <Pressable style={[styles.pill, accountId === 'all' && styles.pillActive]} onPress={() => setAccountId('all')}>
      <Text style={[styles.pillText, accountId === 'all' && styles.pillTextActive]}>Tutti i conti</Text>
    </Pressable>
    {accounts.map((a) => (
      <Pressable key={a.id} style={[styles.pill, accountId === a.id && styles.pillActive]} onPress={() => setAccountId(a.id)}>
        <View style={[styles.dot, { backgroundColor: a.color }]} />
        <Text style={[styles.pillText, accountId === a.id && styles.pillTextActive]}>{a.name}</Text>
      </Pressable>
    ))}
  </ScrollView>
</View>
```

- [ ] **Step 3: Aggiungere gli stili della sezione**

In `StyleSheet`:

```js
section: { marginTop: 16 },
sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 8 },
sectionRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
```

- [ ] **Step 4: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "style: sezione conto a pill orizzontali con pallino del colore"
```

---

### Task 3: Sezione Categoria (griglia 4 colonne)

**Files:**
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: `CATEGORIES` da `src/constants/categories.js` (icona + colore + label), `useWindowDimensions` da `react-native`.
- Produces: griglia 4 colonne con tile "Tutte" (scura) + 8 categorie; scrive su `category` come il `Segmented` precedente.

- [ ] **Step 1: Import `useWindowDimensions` e calcolo larghezza tile**

In `src/screens/TransactionsScreen.js`, aggiungere `useWindowDimensions` all'import di `react-native` (riga 2) e, dentro il componente (in cima, accanto agli `useState`), aggiungere:

```js
const { width } = useWindowDimensions();
const tileWidth = Math.floor((width - 56) / 4); // 32 di padding laterali di filterBlock + 24 di gap (3×8)
```

- [ ] **Step 2: Sostituire il segmentato Categoria con la griglia**

In `filterBlock`, sostituire il secondo `Segmented` (quello di `category`) con:

```jsx
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
```

Nota: `tileWidth` vive nello scope del componente, quindi la `width` va passata inline; `StyleSheet` è fuori dal componente e NON può leggere `tileWidth`.

- [ ] **Step 3: Stili della griglia**

In `StyleSheet`:

```js
catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
catTileBase: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 },
catAllActive: { backgroundColor: '#111827', borderColor: '#111827' },
catText: { fontSize: 11, fontWeight: '500', color: '#374151' },
catTextActive: { color: '#fff', fontWeight: '600' },
```

- [ ] **Step 4: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "style: griglia categorie 4 colonne con tile tutte e categoria attiva"
```

---

### Task 4: Scroll unico e stato vuoto

**Files:**
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: layout costruito nei Task 1-3 (searchWrap, filterRow, monthWrap, filterBlock+sezioni), `filtered`, flag `editing`.
- Produces: `FlatList` con `ListHeaderComponent` (tutta l'intestazione) e `ListEmptyComponent` (card tratteggiata). Rimozione dell'import `Segmented` (non più usato in questa schermata).

- [ ] **Step 1: Spostare l'intestazione in `ListHeaderComponent`**

Nel `return`, racchiudere `searchWrap`, `filterRow`, `monthWrap` e `filterBlock` in un `<View>` passato come `ListHeaderComponent` della `FlatList`. La `FlatList` diventa:

```jsx
<FlatList
  data={filtered}
  keyExtractor={(t) => t.id}
  renderItem={({ item }) => (
    <TransactionItem
      transaction={item}
      onPress={() => { setEditing(item); setModalVisible(true); }}
      onDelete={() => confirmDelete(item)}
    />
  )}
  ListHeaderComponent={
    <View>
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.faintText} style={styles.searchIcon} />
        <TextInput style={styles.search} placeholder="Cerca per categoria o nota..." value={query} onChangeText={setQuery} />
        {query ? (
          <Pressable style={styles.searchClear} onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.faintText} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.filterRow}>
        {[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }].map((opt) => (
          <Pressable key={opt.value} style={[styles.pill, kind === opt.value && styles.pillActive]} onPress={() => setKind(opt.value)}>
            <Text style={[styles.pillText, kind === opt.value && styles.pillTextActive]}>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.monthWrap}>
        <MonthCarousel month={month} label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)} onPrev={prev} onNext={next} onAll={() => setAllMonths((v) => !v)} allActive={allMonths} />
      </View>
      <View style={styles.filterBlock}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Conto</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
            <Pressable style={[styles.pill, accountId === 'all' && styles.pillActive]} onPress={() => setAccountId('all')}>
              <Text style={[styles.pillText, accountId === 'all' && styles.pillTextActive]}>Tutti i conti</Text>
            </Pressable>
            {accounts.map((a) => (
              <Pressable key={a.id} style={[styles.pill, accountId === a.id && styles.pillActive]} onPress={() => setAccountId(a.id)}>
                <View style={[styles.dot, { backgroundColor: a.color }]} />
                <Text style={[styles.pillText, accountId === a.id && styles.pillTextActive]}>{a.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
      </View>
    </View>
  }
  ListEmptyComponent={
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <Ionicons name="clipboard-outline" size={26} color={colors.faintText} />
      </View>
      <Text style={styles.emptyTitle}>Nessun movimento trovato</Text>
      <Text style={styles.emptySub}>Prova a cambiare i filtri di ricerca o il mese.</Text>
    </View>
  }
/>
```

- [ ] **Step 2: Rimuovere l'import `Segmented`**

Rimuovere la riga `import Segmented from '../components/Segmented';` (non più usata in questa schermata).

- [ ] **Step 3: Aggiornare gli stili (stato vuoto)**

In `StyleSheet`, **rimuovere** lo stile `empty` e aggiungere:

```js
emptyCard: { marginTop: 24, marginHorizontal: 16, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', paddingVertical: 40, alignItems: 'center', backgroundColor: '#fff' },
emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
emptyTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginTop: 12 },
emptySub: { fontSize: 12, color: colors.faintText, textAlign: 'center', marginTop: 4 },
```

- [ ] **Step 4: Ripulire gli stili rimasti**

Verificare che nello `StyleSheet` restino solo: `container`, `center`, `errorText`, `searchWrap`, `search`, `searchIcon`, `searchClear`, `filterRow`, `pill`, `pillActive`, `pillText`, `pillTextActive`, `monthWrap`, `filterBlock`, `section`, `sectionLabel`, `sectionRow`, `dot`, `catGrid`, `catTileBase`, `catAllActive`, `catText`, `catTextActive`, `emptyCard`, `emptyIcon`, `emptyTitle`, `emptySub`, `fab`. Nessun riferimento a `Segmented`, `filters` o `empty` residuo.

- [ ] **Step 5: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 6: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "style: scroll unico con filtri in ListHeaderComponent e stato vuoto a card tratteggiata"
```

---

### Task 5: Verifica finale

- [ ] **Step 1: Suite di logica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 2: Build**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Riepilogo diffs**

Run: `git log --oneline -5` per confermare i quattro commit `style:` dei task precedenti. Nessun push: lo fa l'utente su richiesta.