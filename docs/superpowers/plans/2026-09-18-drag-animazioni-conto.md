# Animazioni drag & drop conti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Al long-press il conto segue subito il dito (ghost ancorato al punto di pressione) e durante il trascinamento le righe non trascinate scivolano in modo animato per fare spazio; al rilascio il ghost atterra nella fessura finale.

**Architecture:** Traslazione per-riga con `Animated.Value` (`translateY`) durante il drag — la lista resta nell'ordine originale, si animano solo gli offset. Due helper puri (`dragRowOffsets`, `reorderAt`) in `src/utils/finance.js` testati in `scripts/finance.spec.mjs`. Il ghost viene ancorato al dito al long-press con `event.locationY`/`pageY`; il pan responder non sovrascrive più l'ancora. Al rilascio animazione di atterraggio del ghost poi commit Firestore.

**Tech Stack:** React Native (Expo SDK 57), Firebase/Firestore. Nessuna nuova dipendenza. Solo API native: `PanResponder`, `Animated`, `Easing`, `Vibration`.

## Global Constraints

- **Nessuna nuova dipendenza** — solo API native già in uso (`PanResponder`, `Animated`, `Easing`, `Vibration`).
- **Non modificare**: `firestore.rules`, `src/hooks/useTransactions.js`, `src/constants/categories.js`, `src/components/MonthCarousel.js`, `src/navigation/`.
- **Semantica invariata di `rowHeights`**: le misure `onLayout` registrano SOLO l'altezza della card (senza il separatore), perché `contentRowTop`, `dragInsertIndex` e `dragRowOffsets` assumono `altezza card` + 10px di separatore per riga.
- Verifica obbligatoria: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso "Tutti i controlli di finanza/format/categorie passano.") e `npx expo export --platform android` (atteso "Exported: dist").
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.

---

### Task 1: Helper puri `dragRowOffsets` e `reorderAt` + test

**Files:**
- Modify: `src/utils/finance.js`
- Modify: `scripts/finance.spec.mjs`

**Interfaces:**
- Produces:
  - `dragRowOffsets(list: Array, draggedId: string, heights: Object, targetIndex: number, fallbackHeight?: number) -> Object` — mappa `id → offsetY` per fare spazio alla card trascinata durante il drag. `startIndex = list.findIndex(a => a.id === draggedId)`. Shift = `(heights[draggedId] || fallbackHeight) + 10`. Per ogni riga non trascinata all'indice originale `i`: se `targetIndex < startIndex && targetIndex <= i < startIndex` → `+shift`; se `targetIndex > startIndex && startIndex < i <= targetIndex` → `-shift`; altrimenti `0`. Righe fuori dal blocco → `0`, id trascinato → `0`. Non muta l'input. Se l'id non è nella lista → tutte `0`.
  - `reorderAt(list: Array, from: number, to: number) -> Array` — rimuove l'elemento a `from` e lo inserisce a `to` (indice nella lista senza l'elemento). Non muta l'input.

- [ ] **Step 1: Scrivi i test fallenti**

Aggiorna l'import in testa a `scripts/finance.spec.mjs`:

```js
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder, dragInsertIndex, dragRowOffsets, reorderAt } from '../src/utils/finance.js';
```

In fondo al file (prima di `console.log('Tutti i controlli ...');`) aggiungi:

```js
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
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL con `TypeError: dragRowOffsets is not a function`.

- [ ] **Step 3: Implementa le funzioni**

Aggiungi in `src/utils/finance.js` (in fondo, dopo `dragInsertIndex`):

```js
export function dragRowOffsets(list, draggedId, heights, targetIndex, fallbackHeight = 70) {
  const startIndex = list.findIndex((a) => a.id === draggedId);
  const offsets = {};
  list.forEach((r) => { offsets[r.id] = 0; });
  if (startIndex === -1) return offsets;
  const shift = (heights[draggedId] || fallbackHeight) + 10;
  list.forEach((r, i) => {
    if (r.id === draggedId) return;
    if (targetIndex < startIndex && i >= targetIndex && i < startIndex) offsets[r.id] = shift;
    else if (targetIndex > startIndex && i > startIndex && i <= targetIndex) offsets[r.id] = -shift;
  });
  return offsets;
}

export function reorderAt(list, from, to) {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS con stampa "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 5: Commit**

```bash
git add src/utils/finance.js scripts/finance.spec.mjs
git commit -m "feat: helper dragRowOffsets e reorderAt con test"
```

---

### Task 2: Ghost ancorato al dito al long-press

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `rowHeightOf`, `contentRowTop` (esistenti), `drag` ref con campo `granted`.
- Produces: `startDrag(acc, index, evt)` — il ghost parte centrato sul punto di pressione del dito e segue il dito 1:1 dal primo pixel di movimento. `onPanResponderGrant` non sovrascrive più `grantY` (l'ancora del long-press). Il rilascio senza movimento continua a passare da `onPressOut` (perché `granted` resta `false` fino al grant).

- [ ] **Step 1: Scrivi la modifica a `startDrag`**

In `src/screens/AccountsScreen.js`, sostituisci la funzione `startDrag` (righe ~54-69) con:

```js
  const startDrag = (acc, index, evt) => {
    drag.active = true;
    drag.id = acc.id;
    drag.startIndex = index;
    drag.curIndex = index;
    drag.grantY = evt.nativeEvent.pageY;
    drag.didDrag = false;
    drag.granted = false;
    drag.prevList = [...accounts];
    drag.baseGhostTop = contentRowTop([...accounts], index) + (evt.nativeEvent.locationY - rowHeightOf(acc) / 2);
    ghostY.setValue(drag.baseGhostTop - (scrollOffset.current || 0));
    syncWorking([...accounts]);
    setDragId(acc.id);
    Vibration.vibrate(10);
    Animated.spring(ghostScale, { toValue: 1.03, useNativeDriver: true }).start();
  };
```

- [ ] **Step 2: Non sovrascrivere l'ancora al grant**

Nel `PanResponder.create`, sostituisci:

```js
      onPanResponderGrant: (evt) => { drag.grantY = evt.nativeEvent.pageY; },
```

con:

```js
      onPanResponderGrant: () => { drag.granted = true; },
```

- [ ] **Step 3: Passa l'evento al long-press**

Nel `renderItem` del `FlatList`, sostituisci:

```js
                  onLongPress={() => startDrag(item, index)}
```

con:

```js
                  onLongPress={(e) => startDrag(item, index, e)}
```

- [ ] **Step 4: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs` — atteso PASS.
Run: `npx expo export --platform android` — atteso "Exported: dist".

- [ ] **Step 5: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "fix: ghost ancorato al punto di pressione al long-press, segue subito il dito"
```

---

### Task 3: Righe animate durante il drag + atterraggio del ghost

**Files:**
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `dragRowOffsets`, `reorderAt` (Task 1); `startDrag(acc, index, evt)` ancorato (Task 2).
- Produces:
  - Le righe non trascinate scorrono con `translateY` animato (`Animated.timing` 160ms, `Easing.out(Easing.ease)`, `useNativeDriver: true`) quando il ghost supera la metà di una riga.
  - La riga trascinata resta visibile con `opacity: 0` (mantiene il suo spazio).
  - Il separatore da 10px entra nel wrapper tradotto di ogni riga (si rimuove `ItemSeparatorComponent`).
  - Al rilascio il ghost atterra nella fessura finale (timing 180ms paralleli su `ghostY` e `ghostScale`), poi commit Firestore con `writeBatch` come oggi.

- [ ] **Step 1: Aggiorna import e stato**

Cambia `import { useRef, useState } from 'react';` in:

```js
import { useEffect, useRef, useState } from 'react';
```

Aggiungi `Easing` all'import di react-native:

```js
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Easing, PanResponder, Vibration } from 'react-native';
```

Aggiungi i nuovi helper all'import di finance:

```js
import { accountBalance, totalBalance, dragInsertIndex, dragRowOffsets, reorderAt } from '../utils/finance';
```

Nel ref `drag`, aggiungi il campo `lastOffsets`:

```js
    prevList: null,
    lastOffsets: null,
```

Dopo `const ghostScale = ...` aggiungi:

```js
  const rowOffsets = useRef({});
```

Dopo `const syncWorking = ...` aggiungi il sync di `working` con `accounts` quando non si sta trascinando (evita il "flash" dell'ordine vecchio dopo il commit):

```js
  useEffect(() => {
    if (!drag.active) syncWorking(accounts);
  }, [accounts]);
```

- [ ] **Step 2: Aggiungi helper offset**

Subito dopo `const rowHeightOf = ...` aggiungi:

```js
  const ensureRowOffset = (id) => {
    if (!rowOffsets.current[id]) rowOffsets.current[id] = new Animated.Value(0);
    return rowOffsets.current[id];
  };

  const resetRowOffsets = () => {
    Object.values(rowOffsets.current).forEach((v) => v.setValue(0));
  };

  const applyOffsets = (targetIndex) => {
    const list = workingRef.current;
    const targets = dragRowOffsets(list, drag.id, rowHeights.current, targetIndex);
    list.forEach((r) => ensureRowOffset(r.id));
    list.forEach((r) => {
      if (r.id === drag.id) return;
      const val = rowOffsets.current[r.id];
      if ((drag.lastOffsets && drag.lastOffsets[r.id]) !== targets[r.id]) {
        Animated.timing(val, { toValue: targets[r.id], duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }
    });
    drag.lastOffsets = targets;
  };
```

- [ ] **Step 3: Reset offset all'avvio del drag**

In `startDrag` (funzione aggiornata nella Task 2), subito dopo la riga `drag.prevList = [...accounts];` aggiungi:

```js
    drag.lastOffsets = null;
    resetRowOffsets();
```

- [ ] **Step 4: Il movimento aggiorna solo `curIndex` e gli offset**

Nel `onPanResponderMove`, sostituisci il blocco di riordino dati:

```js
        if (insertAt !== drag.curIndex) {
          const next = [...list];
          const [item] = next.splice(drag.curIndex, 1);
          next.splice(insertAt, 0, item);
          drag.curIndex = insertAt;
          syncWorking(next);
        }
```

con:

```js
        if (insertAt !== drag.curIndex) {
          drag.curIndex = insertAt;
          applyOffsets(insertAt);
        }
```

- [ ] **Step 5: Riscrivi `finishDrag` con atterraggio**

Sostituisci l'intera funzione `finishDrag` con:

```js
  const finishDrag = () => {
    if (!drag.active) return;
    const list = workingRef.current;
    const prevList = drag.prevList;
    drag.active = false;
    drag.id = null;
    if (!drag.didDrag) {
      setDragId(null);
      Animated.spring(ghostScale, { toValue: 1, useNativeDriver: true }).start();
      resetRowOffsets();
      drag.lastOffsets = null;
      syncWorking(prevList || list);
      return;
    }
    const final = reorderAt(list, drag.startIndex, drag.curIndex);
    const targetY = contentRowTop(final, drag.curIndex) - (scrollOffset.current || 0);
    Animated.parallel([
      Animated.timing(ghostY, { toValue: targetY, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(ghostScale, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setDragId(null);
      syncWorking(final);
      resetRowOffsets();
      drag.lastOffsets = null;
      const batch = writeBatch(db);
      final.forEach((a, i) => {
        if ((a.order ?? null) !== i) batch.update(doc(db, 'accounts', a.id), { order: i });
      });
      batch.commit().catch((err) => {
        Alert.alert('Errore', "Impossibile salvare l'ordine: " + err.message);
        syncWorking(prevList || final);
      });
    });
  };
```

- [ ] **Step 6: Riscrivi `renderItem` e la lista**

Sostituisci l'intero blocco `FlatList` con:

```jsx
        <FlatList
          ref={listRef}
          data={working}
          keyExtractor={(a) => a.id}
          renderItem={({ item, index }) => {
            const offset = ensureRowOffset(item.id);
            const isDragged = dragId === item.id;
            return (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  { transform: [{ translateY: offset }], opacity: isDragged ? 0 : 1 },
                ]}
              >
                <View
                  onLayout={(e) => { rowHeights.current[item.id] = e.nativeEvent.layout.height; }}
                >
                  <Pressable
                    style={styles.card}
                    onPress={() => { if (!drag.active) openEdit(item); }}
                    onLongPress={(e) => startDrag(item, index, e)}
                    onPressOut={() => {
                      setTimeout(() => {
                        if (drag.active && !drag.granted) finishDrag();
                      }, 0);
                    }}
                  >
                    {renderCardContent(item, true)}
                  </Pressable>
                </View>
                <View style={styles.rowSpacer} />
              </Animated.View>
            );
          }}
          contentContainerStyle={styles.listContent}
          scrollEnabled={dragId === null}
          removeClippedSubviews={false}
          onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
          ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
        />
```

Nota: si rimuove `ItemSeparatorComponent`. Il blocco ghost sotto la `FlatList` resta invariato.

- [ ] **Step 7: Aggiorna gli stili**

Sostituisci lo stile:

```js
  rowSeparator: { height: 10 },
```

con:

```js
  rowSpacer: { height: 10 },
```

- [ ] **Step 8: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs` — atteso PASS.
Run: `npx expo export --platform android` — atteso "Exported: dist".

Verifica manuale (su device/emulatore via Expo Dev Client):
1. Tab Conti → tieni premuta una card → vibra, si solleva, appare esattamente sotto il dito e lo segue appena ti muovi.
2. Trascinala verso il basso → le card sotto scivolano (animazione secca ~160ms) per fare spazio; verso l'alto → idem.
3. Rilascia a metà spazio → il ghost atterra animato nella fessura, ordine salvato (riapri l'app per conferma).
4. Tieni premuto e rilascia senza muoverti → nulla si sposta, nessun salvataggio.
5. Tap breve → apre ancora il form di modifica; cestino inerte durante il drag.
6. Con rete offline: trascina e rilascia → alert d'errore e ordine ripristinato.

- [ ] **Step 9: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "feat: righe animate durante il drag e atterraggio del ghost (drag & drop conti)"
```