# Riordino conti con long-press & drag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consentire di ordinare i conti trascinandoli con long-press nella tab Conti, con ordine persistente in Firestore che vale in tutta l'app.

**Architecture:** Un campo `order` numerico su ogni conto Firestore. Due funzioni pure (`sortAccountsByOrder`, `nextAccountOrder`) in `src/utils/finance.js` testate con `scripts/finance.spec.mjs`; `useAccounts` applica l'ordinamento così ogni schermata eredita l'ordine. Il drag&drop usa `PanResponder`/`Animated` nativi in `AccountsScreen` (card fantasma + riordino live), persistenza con `writeBatch` al rilascio.

**Tech Stack:** React Native (Expo SDK 57), Firebase/Firestore, `@expo/vector-icons`. Nessuna nuova dipendenza.

## Global Constraints

- **Nessuna nuova dipendenza** — il drag usa solo API native (`PanResponder`, `Animated`, `Vibration`).
- **Nessuna modifica a**: `firestore.rules`, `useTransactions`, `accountBalance`, `totalBalance`, `deleteDoc`, `categories.js`.
- Verifica obbligatoria: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso "Tutti i controlli di finanza/format/categorie passano.") e `npx expo export --platform android` (atteso "Exported: dist").
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.

---

### Task 1: Funzioni pure di ordinamento + test

**Files:**
- Modify: `src/utils/finance.js`
- Modify: `scripts/finance.spec.mjs`

**Interfaces:**
- Produces:
  - `sortAccountsByOrder(accounts: Array) -> Array` — conti con `order` numerico ordinati per `order` crescente (parità → `createdAt` crescente); conti senza `order` in fondo ordinati per `createdAt`; non muta l'input.
  - `nextAccountOrder(accounts: Array) -> number` — `max(order)` + 1 sui conti esistenti, `-1` di default (lista vuota → `0`).

- [ ] **Step 1: Scrivi i test fallenti**

Aggiungi `sortAccountsByOrder` e `nextAccountOrder` all'import in testa a `scripts/finance.spec.mjs`:

```js
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder } from '../src/utils/finance.js';
```

In fondo al file (prima di `console.log('Tutti i controlli ...');`) aggiungi:

```js
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
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL con `TypeError: sortAccountsByOrder is not a function`.

- [ ] **Step 3: Implementa le funzioni**

Aggiungi in `src/utils/finance.js` (in fondo, dopo `sumByKind`):

```js
export function sortAccountsByOrder(accounts) {
  const withOrder = accounts.filter((a) => typeof a.order === 'number');
  const withoutOrder = accounts.filter((a) => typeof a.order !== 'number');
  withOrder.sort((a, b) => a.order - b.order || (a.createdAt || 0) - (b.createdAt || 0));
  withoutOrder.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  return [...withOrder, ...withoutOrder];
}

export function nextAccountOrder(accounts) {
  return accounts.reduce((m, a) => (typeof a.order === 'number' ? Math.max(m, a.order) : m), -1) + 1;
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS con stampa "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 5: Commit**

```bash
git add src/utils/finance.js scripts/finance.spec.mjs
git commit -m "feat: helper sortAccountsByOrder e nextAccountOrder con test"
```

---

### Task 2: Ordinamento nel hook e order del nuovo conto

**Files:**
- Modify: `src/hooks/useAccounts.js`
- Modify: `src/components/AccountFormModal.js`
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `sortAccountsByOrder(accounts)` e `nextAccountOrder(accounts)` dalla Task 1.
- Produces: `AccountFormModal` accetta anche la prop `accounts` (`array`, default `[]`). Un nuovo conto viene creato con `order = nextAccountOrder(accounts)`; la modifica non tocca il campo `order`.
- L'array restituito da `useAccounts()` è già ordinato (tutti i consumer ne ereditano l'ordine: `AccountsScreen`, `HomeScreen`, `TransactionsScreen`, `AccountCards`).

- [ ] **Step 1: Ordina la lista nel hook**

In `src/hooks/useAccounts.js`:

```js
import { sortAccountsByOrder } from '../utils/finance';
```

E nel callback di `onSnapshot`, sostituisci `setAccounts(...)`:

```js
setAccounts(sortAccountsByOrder(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
```

- [ ] **Step 2: Assegna order alla creazione del conto**

In `src/components/AccountFormModal.js`:
1. Importa `nextAccountOrder`:
```js
import { nextAccountOrder } from '../utils/finance';
```
2. Firma della funzione (aggiungi prop `accounts` con default):
```js
export default function AccountFormModal({ visible, onClose, initial, accounts = [] }) {
```
3. Nel ramo creazione di `save()` (lasciando il ramo modifica invariato), sostituisci:
```js
        await addDoc(collection(db, 'accounts'), data);
```
con:
```js
        await addDoc(collection(db, 'accounts'), { ...data, order: nextAccountOrder(accounts) });
```
(Il ramo `if (isEdit) { await updateDoc(...); }` resta com'è: `updateDoc` aggiorna solo i campi passati, quindi `order` resta intatto.)

- [ ] **Step 3: Passa la lista conti al modal**

In `src/screens/AccountsScreen.js`, riga del modal:

```jsx
      <AccountFormModal visible={modalVisible} onClose={() => setModalVisible(false)} initial={editing} accounts={accounts} />
```

- [ ] **Step 4: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs` — atteso PASS.
Run: `npx expo export --platform android` — atteso "Exported: dist" (verifica che `AccountFormModal` importi senza errori).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAccounts.js src/components/AccountFormModal.js src/screens/AccountsScreen.js
git commit -m "feat: ordinamento conti globale e order auto per nuovi conti"
```

---

### Task 3: Drag & drop in AccountsScreen

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `useAccounts()` (già ordinato), `accountBalance`, `formatCurrency`, `AccountFormModal`, `colors`.
- Produces: nell'`AccountsScreen`:
  - long-press su una card → vibrazione + card fantasma che segue il dito (stato `dragId`),
  - riordino live della lista mentre il dito supera metà riga,
  - rilasciando si scrive `order: 0..n-1` sull'intera lista con `writeBatch` (ottimistico; su errore `Alert` + ripristino),
  - il tap breve continua ad aprire il form di modifica (il drag non fa scattare `onPress`).

- [ ] **Step 1: Aggiorna import e stato**

In `src/screens/AccountsScreen.js`, primo blocco import:

```js
import { useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, PanResponder, Vibration } from 'react-native';
```

E l'import Firestore:

```js
import { deleteDoc, doc, writeBatch } from 'firebase/firestore';
```

Dentro il componente, dopo `const [editing, setEditing] = useState(null);` aggiungi:

```js
  const listRef = useRef(null);
  const rowHeights = useRef({});
  const scrollOffset = useRef(0);
  const workingRef = useRef(accounts);
  const drag = useRef({
    active: false,
    id: null,
    startIndex: 0,
    curIndex: 0,
    grantY: 0,
    baseGhostTop: 0,
    didDrag: false,
    prevList: null,
  }).current;

  const [dragId, setDragId] = useState(null);
  const [working, setWorking] = useState(accounts);
  const ghostY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
```

- [ ] **Step 2: Blocca il cestino durante il drag**

Modifica `confirmDelete` in modo che sia inerte mentre un drag è attivo (il cestino resta visibile ma non eliminabile a metà trascinamento):

```js
  const confirmDelete = (acc) => {
    if (drag.active) return;
    Alert.alert('Elimina conto', `Eliminare "${acc.name}"? I movimenti collegati resteranno ma senza conto.`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'accounts', acc.id)).catch((e) => Alert.alert('Errore', 'Impossibile eliminare il conto: ' + e.message)) },
    ]);
  };
```

- [ ] **Step 3: Aggiungi helper e PanResponder**

Subito dopo lo stato (dopo `const ghostScale = ...`), aggiungi:

```js
  const syncWorking = (next) => { workingRef.current = next; setWorking(next); };

  const rowHeightOf = (a) => rowHeights.current[a.id] || 70;

  // top in coordinate "contenuto" della riga index (paddingTop 10 + righe precedenti + separatori da 10)
  const contentRowTop = (list, index) => {
    let top = 10;
    for (let i = 0; i < index; i++) top += rowHeightOf(list[i]) + 10;
    return top;
  };

  const startDrag = (acc, index) => {
    drag.active = true;
    drag.id = acc.id;
    drag.startIndex = index;
    drag.curIndex = index;
    drag.grantY = 0;
    drag.didDrag = false;
    drag.prevList = [...accounts];
    drag.baseGhostTop = contentRowTop([...accounts], index);
    syncWorking([...accounts]);
    setDragId(acc.id);
    Vibration.vibrate(10);
    Animated.spring(ghostScale, { toValue: 1.03, useNativeDriver: true }).start();
  };

  const finishDrag = () => {
    if (!drag.active) return;
    const list = workingRef.current;
    const prevList = drag.prevList;
    drag.active = false;
    drag.id = null;
    setDragId(null);
    Animated.spring(ghostScale, { toValue: 1, useNativeDriver: true }).start();
    if (!drag.didDrag) {
      syncWorking(prevList || list);
      return;
    }
    const batch = writeBatch(db);
    list.forEach((a, i) => {
      if ((a.order ?? null) !== i) batch.update(doc(db, 'accounts', a.id), { order: i });
    });
    batch.commit().catch((err) => {
      Alert.alert('Errore', "Impossibile salvare l'ordine: " + err.message);
      syncWorking(prevList || list);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => drag.active,
      onPanResponderGrant: (evt) => { drag.grantY = evt.nativeEvent.pageY; },
      onPanResponderMove: (_, gs) => {
        if (!drag.active) return;
        const dy = gs.moveY - drag.grantY;
        if (Math.abs(dy) > 5) drag.didDrag = true;
        const list = workingRef.current;
        const dragged = list.find((a) => a.id === drag.id);
        if (!dragged) return;
        const ghostTop = drag.baseGhostTop + dy;
        const ghostMid = ghostTop + rowHeightOf(dragged) / 2;
        const rows = list.filter((a) => a.id !== drag.id);
        let top = 10;
        let insertAt = 0;
        for (const r of rows) {
          const h = rowHeightOf(r);
          if (ghostMid > top + h / 2) insertAt++;
          else break;
          top += h + 10;
        }
        if (insertAt !== drag.curIndex) {
          const next = [...list];
          const [item] = next.splice(drag.curIndex, 1);
          next.splice(insertAt, 0, item);
          drag.curIndex = insertAt;
          syncWorking(next);
        }
        ghostY.setValue(Math.max(0, ghostTop) - (scrollOffset.current || 0));
      },
      onPanResponderRelease: finishDrag,
      onPanResponderTerminate: finishDrag,
      onPanResponderTerminationRequest: () => false,
    })
  ).current;
```

- [ ] **Step 4: Restituisci il contenuto della card come funzione riutilizzabile**

Dopo i helper, aggiungi la funzione che disegna il contenuto della card (usata sia nelle righe sia nella card fantasma):

```js
  const renderCardContent = (item, withTrash) => {
    const bal = accountBalance(transactions, item.id, item.initialBalance);
    const balColor = bal >= 0 ? '#111827' : colors.negative;
    return (
      <>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
          {item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
        </View>
        <Text style={[styles.cardBalance, { color: balColor }]}>{formatCurrency(bal)}</Text>
        {withTrash ? (
          <Pressable onPress={() => confirmDelete(item)} hitSlop={12} style={styles.cardDelete}>
            <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </>
    );
  };
```

(Nota: con `dragId` attivo la card trascinata è nascosta e sostituita da un placeholder; il cestino resta presente solo sulle righe statiche, ma `confirmDelete` lo rende inerte durante il drag.)

- [ ] **Step 5: Riscrivi renderItem e la lista**

Sostituisci l'intero blocco `FlatList` (righe 44-66 circa) con:

```jsx
      <View style={styles.listWrap}>
        <FlatList
          ref={listRef}
          data={dragId ? working : accounts}
          keyExtractor={(a) => a.id}
          renderItem={({ item, index }) => {
            if (dragId && item.id === dragId) {
              return (
                <View
                  onLayout={(e) => { rowHeights.current[item.id] = e.nativeEvent.layout.height; }}
                />
              );
            }
            return (
              <View
                {...panResponder.panHandlers}
                onLayout={(e) => { rowHeights.current[item.id] = e.nativeEvent.layout.height; }}
              >
                <Pressable
                  style={styles.card}
                  onPress={() => { if (!drag.active) openEdit(item); }}
                  onLongPress={() => startDrag(item, index)}
                >
                  {renderCardContent(item, true)}
                </Pressable>
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={dragId === null}
          removeClippedSubviews={false}
          onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
          ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
        />
        {dragId ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.ghost, { transform: [{ translateY: ghostY }, { scale: ghostScale }] }]}
          >
            <View style={styles.card}>
              {renderCardContent(working.find((a) => a.id === dragId) || accounts.find((a) => a.id === dragId), false)}
            </View>
          </Animated.View>
        ) : null}
      </View>
```

- [ ] **Step 6: Aggiorna gli stili**

Sostituisci lo stile `card` (rimuove `marginTop: 10`, tenendo `marginHorizontal: 16`) e aggiungi gli stili nuovi:

```js
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
```

Dopo lo stile `card`, aggiungi:

```js
  listWrap: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingTop: 10, paddingBottom: 20 },
  rowSeparator: { height: 10 },
  ghost: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10, elevation: 8 },
```

- [ ] **Step 7: Verifica export**

Run: `npx expo export --platform android`
Expected: "Exported: dist", nessun errore di sintassi/import.

- [ ] **Step 8: Verifica manuale (su device/emulatore via Expo Dev Client)**

1. Tab Conti → tieni premuta una card → vibra, la card si "solleva" (scala) e segue il dito.
2. Trascina sotto/sopra altre card → la lista si riordina live; rilasciare lascia la card nella nuova posizione.
3. Riapri l'app (o cambia tab e torna) → l'ordine è persistito e vale anche nella striscia Home e nel filtro "Conto" di Movimenti.
4. Tap breve su una card → apre ancora il form di modifica (non parte il drag).
5. Tap sul cestino → conferma eliminazione invariata.
6. Disattiva la rete, trascina un conto, rilascia → in caso di errore compare l'Alert e l'ordine torna a prima.

- [ ] **Step 9: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "feat: drag & drop conti con long-press in tab Conti"
```