# Restyle pagina Conti (stile banking) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restilizzare la tab Conti in stile banking (riquadro "Totale saldi", card conto con bordo/ombra e tipo mappato, barra full-width "Aggiungi conto") mantenendo logica invariata.

**Architecture:** Unica modifica alla schermata `src/screens/AccountsScreen.js`: layout in tre blocchi (riquadro totale, card conto, barra aggiungi). La logica (accounts, transactions, accountBalance, totalBalance, deleteDoc, AccountFormModal) resta intatta.

**Tech Stack:** React Native (JavaScript), Expo SDK, Ionicons (`@expo/vector-icons`). Nessuna dipendenza nuova.

## Global Constraints

- Colori: token da `src/theme/colors.js` dove esistono (`colors.primary`, `colors.negative`, `colors.background`); grigi della schermata: `#F9FAFB`, `#E5E7EB`, `#6B7280`, `#111827`, `#9CA3AF`, `#fff`.
- Nessuna nuova dipendenza in `package.json`.
- Logica di business invariata: stessi `useAccounts`, `useTransactions`, `accountBalance`, `totalBalance`, `openCreate`, `openEdit`, `confirmDelete`.
- Etichette tipo: `carta` → "Carta", `banca` → "Conto Corrente", `contanti` → "Contanti".
- Testi in italiano. `onLongPress` sulla card rimosso (la pressa apre il form; il cestino elimina).
- Verifica obbligatoria di ogni task: `npx expo export --platform android` (atteso: `Exported: dist`).
- Commit frequenti, uno per task, sul branch `main`. Push solo su richiesta dell'utente.

---

### Task 1: Riquadro "Totale saldi" e mappa etichette tipo

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `total` (da `totalBalance`), `formatCurrency`, `colors` — già presenti nella schermata.
- Produces: costante `TYPE_LABELS` a livello modulo e riga "Totale saldi" restilizzata. `TYPE_LABELS` è usata dal Task 2.

- [ ] **Step 1: Aggiungere la mappa delle etichette tipo**

In `src/screens/AccountsScreen.js`, dopo gli import (prima di `export default function`), aggiungere:

```js
const TYPE_LABELS = { carta: 'Carta', banca: 'Conto Corrente', contanti: 'Contanti' };
```

- [ ] **Step 2: Sostituire la riga del totale**

Sostituire il blocco `totalRow` (righe 38-41) con:

```jsx
<View style={styles.totalRow}>
  <Text style={styles.totalLabel}>Totale saldi</Text>
  <Text style={[styles.totalValue, { color: total >= 0 ? '#111827' : colors.negative }]}>{formatCurrency(total)}</Text>
</View>
```

- [ ] **Step 3: Aggiornare gli stili del totale**

In `StyleSheet`, sostituire `totalRow`, `totalLabel` e `totalValue` con:

```js
totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
totalLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
totalValue: { fontSize: 18, fontWeight: '700' },
```

- [ ] **Step 4: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 5: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "style: riquadro totale saldi e etichette tipo pulite nella pagina conti"
```

---

### Task 2: Card conto (nuovo layout con cestino a destra)

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `TYPE_LABELS` (Task 1), `accountBalance`, `item.type`, `item.code`, `confirmDelete`, `openEdit`, `openCreate` (non usato qui).
- Produces: card con pallino + nome/tipo/code a sinistra, saldo + cestino a destra. Rimozione `onLongPress`.

- [ ] **Step 1: Riscrivere il `renderItem`**

Sostituire il `renderItem` della FlatList (righe 46-60) con:

```jsx
renderItem={({ item }) => {
  const bal = accountBalance(transactions, item.id, item.initialBalance);
  const balColor = bal >= 0 ? '#111827' : colors.negative;
  return (
    <Pressable style={styles.card} onPress={() => openEdit(item)}>
      <View style={[styles.dot, { backgroundColor: item.color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
        {item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
      </View>
      <Text style={[styles.cardBalance, { color: balColor }]}>{formatCurrency(bal)}</Text>
      <Pressable onPress={() => confirmDelete(item)} hitSlop={12} style={styles.cardDelete}>
        <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
      </Pressable>
    </Pressable>
  );
}}
```

- [ ] **Step 2: Aggiornare gli stili delle card**

In `StyleSheet`, sostituire `card`, `dot`, `cardBody`, `cardName`, `cardType`, `cardCode`, `cardBalance` con:

```js
card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
dot: { width: 12, height: 12, borderRadius: 6 },
cardBody: { flex: 1, marginLeft: 10 },
cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
cardType: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
cardCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
cardBalance: { fontSize: 14, fontWeight: '700', marginRight: 12 },
cardDelete: { paddingLeft: 4 },
```

Nota: `textTransform: 'capitalize'` eliminato — il tipo usa `TYPE_LABELS`.

- [ ] **Step 3: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "style: card conto con pallino, etichette tipo e cestino a destra"
```

---

### Task 3: Barra "Aggiungi conto" full-width

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `openCreate`, `Ionicons`, `colors.primary`.
- Produces: pulsante full-width ancorato in basso che apre il form di creazione.

- [ ] **Step 1: Sostituire il pulsante**

Sostituire il blocco `add` (righe 64-67) con:

```jsx
<Pressable style={styles.add} onPress={openCreate}>
  <Ionicons name="add" size={24} color="#fff" />
  <Text style={styles.addText}>Aggiungi conto</Text>
</Pressable>
```

- [ ] **Step 2: Aggiornare gli stili del pulsante**

In `StyleSheet`, sostituire `add` e `addText` con:

```js
add: { position: 'absolute', left: 16, right: 16, bottom: 20, backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4 },
addText: { color: '#fff', fontSize: 14, fontWeight: '600' },
```

- [ ] **Step 3: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "style: barra aggiungi conto full-width in fondo alla pagina conti"
```

---

### Task 4: Verifica finale

- [ ] **Step 1: Suite di logica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 2: Build**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Riepilogo diffs**

Run: `git log --oneline -4` per confermare i tre commit `style:` dei task precedenti. Nessun push: lo fa l'utente su richiesta.