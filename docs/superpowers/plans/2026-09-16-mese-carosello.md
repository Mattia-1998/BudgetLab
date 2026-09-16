# Selettore mese a carosello — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la riga di selezione mese in Home e Movimenti con un carosello orizzontale animato (mese centrale in evidenza, precedente/successivo laterali sfumati, frecce ai bordi, swipe e doppio tap per "Tutti i mesi").

**Architecture:** Nuovo componente presentazionale `MonthCarousel` costruito solo con primitivi React Native (`Animated`, `PanResponder`). Stesso contratto props di `MonthlyNav` (che viene eliminato), così le schermate cambiano solo l'import e il passaggio di `onAll`/`allActive`. La logica di dati (monthRange, prev/next) resta invariata nei chiamanti.

**Tech Stack:** React Native (JavaScript), Expo SDK, `@expo/vector-icons`, `Animated`/`PanResponder` core. Nessuna dipendenza nuova.

## Global Constraints

- Nessuna nuova dipendenza in `package.json` — solo primitivi React Native/core.
- Colori esclusivamente dal tema centralizzato `src/theme/colors.js` (`colors.primary`, `colors.text`).
- Testo mesi in italiano tramite `formatMonthLabel` (già in `src/utils/format.js`, restituisce es. `"settembre 2026"`); il maiuscolo si ottiene con `textTransform: 'capitalize'` (come il precedente `MonthlyNav`).
- `label` centrale passato dalle schermate: Home → `formatMonthLabel(month)`; Movimenti → `allMonths ? 'Tutti i mesi' : formatMonthLabel(month)` (invariato rispetto a oggi).
- Verifica obbligatoria: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso: "Tutti i controlli ... passano") e `npx expo export --platform android` (atteso: "Exported: dist").
- Commit frequenti, uno per task, sul branch corrente (`main`). Non pushare: il push lo fa l'utente.

---

### Task 1: Componente `MonthCarousel`

**Files:**
- Create: `src/components/MonthCarousel.js`

**Interfaces:**
- Consumes: `formatMonthLabel` da `src/utils/format.js`; `colors` da `src/theme/colors.js`.
- Produces: default export `MonthCarousel({ month, label, onPrev, onNext, onAll, allActive })`.
  - `month: Date` — mese attivo (per calcolare le etichette laterali).
  - `label: string` — testo al centro (attivo o "Tutti i mesi").
  - `onPrev: () => void`, `onNext: () => void` — richiamati al cambio mese (lavorano fuori, sul Date, come `MonthlyNav` oggi).
  - `onAll: (() => void) | undefined` — opzionale; doppio tap sul centro. Assente in Home → doppio tap inerte.
  - `allActive: boolean | undefined` — quando true: il centro mostra `label`, i lati sono sfumati e non tappabili, il swipe è disabilitato, le frecce restano attive.

- [ ] **Step 1: Creare il componente**

Scrivere `src/components/MonthCarousel.js`:

```js
import { useEffect, useRef, useState } from 'react';
import { View, Pressable, PanResponder, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatMonthLabel } from '../utils/format';

const SLOT = 55;
const THRESHOLD = 35;
const DOUBLE_TAP_MS = 300;

const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function MonthCarousel({ month, label, onPrev, onNext, onAll, allActive }) {
  const [lastTap, setLastTap] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const offsets = useRef([-SLOT, 0, SLOT].map((b) => new Animated.Value(b))).current;
  const z = useRef(new Animated.Value(1)).current;
  const prevMonthRef = useRef(month);
  const allActiveRef = useRef(!!allActive);
  allActiveRef.current = !!allActive;

  useEffect(() => {
    if (prevMonthRef.current.getTime() === month.getTime()) return;
    prevMonthRef.current = month;
    z.setValue(0.25);
    Animated.timing(z, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  }, [month]);

  const slide = (dir) => {
    Animated.timing(x, { toValue: dir === 1 ? SLOT : -SLOT, duration: 220, useNativeDriver: false }).start(({ finished }) => {
      if (!finished) { x.setValue(0); return; }
      if (dir === 1) onPrev?.(); else onNext?.();
      x.setValue(0);
    });
  };

  const cancelSwipe = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 8 }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !allActiveRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD || (g.vx > 0.3 && g.dx > 15)) slide(1);
        else if (g.dx < -THRESHOLD || (g.vx < -0.3 && g.dx < -15)) slide(-1);
        else cancelSwipe();
      },
    })
  ).current;

  const handleCenterPress = () => {
    if (!onAll) return;
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_MS) { setLastTap(0); onAll(); } else setLastTap(now);
  };

  const prevDisabled = !!allActive;
  const nextDisabled = !!allActive;
  const prevLabel = formatMonthLabel(addMonths(month, -1));
  const nextLabel = formatMonthLabel(addMonths(month, 1));
  const slotStyle = (i, recessed) => ({
    transform: [{ translateX: Animated.add(x, offsets[i]) }, ...(recessed ? [{ translateY: 3 }] : [])],
  });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => slide(1)} hitSlop={12}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
      </Pressable>
      <View style={styles.stage} {...pan.panHandlers}>
        <Pressable disabled={prevDisabled} onPress={prevDisabled ? undefined : () => slide(1)} style={[styles.band, styles.bandLeft]} hitSlop={8}>
          <Animated.Text style={[styles.side, slotStyle(0, true), prevDisabled && styles.sideDisabled]}>{prevLabel}</Animated.Text>
        </Pressable>
        <Pressable onPress={handleCenterPress} style={[styles.band, styles.bandCenter]} hitSlop={8}>
          <Animated.Text style={[styles.center, slotStyle(1, false), { opacity: z }]}>{label}</Animated.Text>
        </Pressable>
        <Pressable disabled={nextDisabled} onPress={nextDisabled ? undefined : () => slide(-1)} style={[styles.band, styles.bandRight]} hitSlop={8}>
          <Animated.Text style={[styles.side, slotStyle(2, true), nextDisabled && styles.sideDisabled]}>{nextLabel}</Animated.Text>
        </Pressable>
      </View>
      <Pressable onPress={() => slide(-1)} hitSlop={12}>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  stage: { width: 240, height: 34, justifyContent: 'center' },
  band: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  bandLeft: { left: 0, width: 130 },
  bandCenter: { left: 55, width: 130 },
  bandRight: { left: 110, width: 130 },
  center: { fontSize: 17, fontWeight: 'bold', color: colors.text, textAlign: 'center', textTransform: 'capitalize' },
  side: { fontSize: 13, color: colors.text, opacity: 0.45, textAlign: 'center', textTransform: 'capitalize', position: 'absolute', left: 0, right: 0 },
  sideDisabled: { opacity: 0.2 },
});
```

Note: `slide(1)` e `slide(-1)` equivalgono a mese precedente/successivo: il gruppo testi scorre (dx positivo → affiora il mese precedente) e al termine chiama `onPrev`. Le frecce sinistra/destra e i tap sui lati riusano la stessa `slide`.

- [ ] **Step 2: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist` (nessun errore di sintassi/import).

- [ ] **Step 3: Commit**

```bash
git add src/components/MonthCarousel.js
git commit -m "feat: componente carosello selezione mese"
```

---

### Task 2: Integrazione in Home e Movimenti

**Files:**
- Modify: `src/screens/HomeScreen.js:8` (import), `src/screens/HomeScreen.js:41` (uso)
- Modify: `src/screens/TransactionsScreen.js:13,81-89,117` (import, uso, rimozione riga "Torna al mese corrente")

**Interfaces:**
- Consumes: `MonthCarousel` di Task 1 con le props `{ month, label, onPrev, onNext, onAll?, allActive? }`.

- [ ] **Step 1: HomeScreen — import**

Sostituire in `src/screens/HomeScreen.js` la riga 8:

```js
import MonthlyNav from '../components/MonthlyNav';
```

con:

```js
import MonthCarousel from '../components/MonthCarousel';
```

- [ ] **Step 2: HomeScreen — uso**

Sostituire la riga 41:

```js
      <MonthlyNav month={month} label={formatMonthLabel(month)} onPrev={prev} onNext={next} />
```

con:

```js
      <MonthCarousel month={month} label={formatMonthLabel(month)} onPrev={prev} onNext={next} />
```

Nota: niente `onAll`/`allActive` in Home (doppio tap inerte).

- [ ] **Step 3: TransactionsScreen — import**

Sostituire in `src/screens/TransactionsScreen.js` la riga 13:

```js
import MonthlyNav from '../components/MonthlyNav';
```

con:

```js
import MonthCarousel from '../components/MonthCarousel';
```

- [ ] **Step 4: TransactionsScreen — uso e rimozione riga "Torna al mese corrente"**

Sostituire le righe 81-89:

```js
        <MonthlyNav
          month={month}
          label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)}
          onPrev={prev}
          onNext={next}
          onAll={() => setAllMonths(true)}
          allActive={allMonths}
        />
        {allMonths ? <Pressable onPress={() => setAllMonths(false)}><Text style={styles.undoAll}>Torna al mese corrente</Text></Pressable> : null}
```

con:

```js
        <MonthCarousel
          month={month}
          label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)}
          onPrev={prev}
          onNext={next}
          onAll={() => setAllMonths(v => !v)}
          allActive={allMonths}
        />
```

Nota: `onAll` ora fa da **toggle** in entrambe le direzioni (doppio tap entr/esce da "Tutti i mesi"); la riga "Torna al mese corrente" sparisce.

- [ ] **Step 5: Rimuovere lo stile inutilizzato**

In `src/screens/TransactionsScreen.js` eliminare la riga 117:

```js
  undoAll: { color: colors.primary, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
```

- [ ] **Step 6: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: output contiene "Tutti i controlli di finanza/format/categorie passano."

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 7: Commit**

```bash
git add src/screens/HomeScreen.js src/screens/TransactionsScreen.js
git commit -m "feat: integra carosello selezione mese in Home e Movimenti"
```

---

### Task 3: Rimozione `MonthlyNav` e verifica finale

**Files:**
- Delete: `src/components/MonthlyNav.js`

- [ ] **Step 1: Verificare che non ci siano altri usi**

Run: `rg "MonthlyNav" src`
Expected: nessun risultato (solo eventuali riferimenti nel file da eliminare, nessuno altrove).

- [ ] **Step 2: Eliminare il file**

```bash
git rm src/components/MonthlyNav.js
```

- [ ] **Step 3: Verifica finale**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: "Tutti i controlli di finanza/format/categorie passano."

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: rimuovi componente MonthlyNav sostituito dal carosello"
```

---

## Files di progetto

| Azione | Percorso |
|--------|----------|
| Create | `src/components/MonthCarousel.js` |
| Modify | `src/screens/HomeScreen.js` |
| Modify | `src/screens/TransactionsScreen.js` |
| Delete | `src/components/MonthlyNav.js` |

## Verifica finale manuale (a carico dell'utente su Expo Go/APK)

- Home: carosello con mese centrale in evidenza e lati sfumati; frecce e tap laterale cambiano mese; swipe cambia mese con animazione a scatto.
- Movimenti: doppio tap sul centro → "Tutti i mesi" (lati non tappabili, swipe disabilitato); doppio tap di nuovo → torna al mese; frecce sempre attive.