# Selettore mese a carosello — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire la riga di selezione mese in Home e Movimenti con un carosello orizzontale animato (mese centrale in evidenza, precedente/successivo laterali sfumati, frecce ai bordi, swipe e doppio tap per "Tutti i mesi").

**Architecture:** Nuovo componente presentazionale `MonthCarousel` costruito solo con primitivi React Native (`Animated`, `PanResponder`). Stesso contratto props di `MonthlyNav` (che viene eliminato), così le schermate cambiano solo l'import e il passaggio di `onAll`/`allActive`. La logica di dati (monthRange, prev/next) resta invariata nei chiamanti.

**Tech Stack:** React Native (JavaScript), Expo SDK, `@expo/vector-icons`, `Animated`/`PanResponder` core. Nessuna dipendenza nuova.

## Global Constraints

- Nessuna nuova dipendenza in `package.json` — solo primitivi React Native/core.
- Colori esclusivamente dal tema centralizzato `src/theme/colors.js` (`colors.primary`, `colors.text`). Per lo stile banking si aggiungono al tema i token `trackBg` (pill), `faintText` (mesi laterali), `chipBorder` (bordo chip).
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
import { useEffect, useRef } from 'react';
import { View, Text, Pressable, PanResponder, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatMonthLabel } from '../utils/format';

const DOUBLE_TAP_MS = 300;
const GAP = 24;

const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function MonthCarousel({ month, label, onPrev, onNext, onAll, allActive }) {
  const slotRef = useRef(143.5);
  const prevW = useRef(75);
  const chipW = useRef(164);
  const lastTap = useRef(0);
  const x = useRef(new Animated.Value(0)).current;
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

  const updateSlot = () => {
    slotRef.current = (prevW.current + chipW.current) / 2 + GAP;
  };

  const slide = (dir) => {
    const s = slotRef.current;
    Animated.timing(x, { toValue: dir === 1 ? s : -s, duration: 240, useNativeDriver: false }).start(({ finished }) => {
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
        const thr = Math.max(30, slotRef.current * 0.4);
        if (g.dx > thr || (g.vx > 0.3 && g.dx > 15)) slide(1);
        else if (g.dx < -thr || (g.vx < -0.3 && g.dx < -15)) slide(-1);
        else cancelSwipe();
      },
    })
  ).current;

  const handleCenterPress = () => {
    if (!onAll) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) { lastTap.current = 0; onAll(); } else lastTap.current = now;
  };

  const prevDisabled = !!allActive;
  const nextDisabled = !!allActive;
  const prevLabel = formatMonthLabel(addMonths(month, -1));
  const nextLabel = formatMonthLabel(addMonths(month, 1));

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.arrowBtn} onPress={() => slide(1)} hitSlop={6} accessibilityLabel="Mese precedente">
        <Ionicons name="chevron-back" size={16} color={colors.primary} />
      </Pressable>
      <View style={styles.track} {...pan.panHandlers}>
        <Animated.View style={[styles.group, { transform: [{ translateX: x }] }]}>
          <Pressable disabled={prevDisabled} onPress={prevDisabled ? undefined : () => slide(1)} hitSlop={6} onLayout={(e) => { prevW.current = e.nativeEvent.layout.width; updateSlot(); }}>
            <Text style={[styles.side, prevDisabled && styles.sideDisabled]}>{prevLabel}</Text>
          </Pressable>
          <Animated.View onLayout={(e) => { chipW.current = e.nativeEvent.layout.width; updateSlot(); }} style={[{ opacity: z }]}>
            <Pressable style={styles.chip} onPress={handleCenterPress} hitSlop={4}>
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          </Animated.View>
          <Pressable disabled={nextDisabled} onPress={nextDisabled ? undefined : () => slide(-1)} hitSlop={6}>
            <Text style={[styles.side, nextDisabled && styles.sideDisabled]}>{nextLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
      <Pressable style={styles.arrowBtn} onPress={() => slide(-1)} hitSlop={6} accessibilityLabel="Mese successivo">
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.trackBg,
    borderRadius: 18,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
    marginVertical: 6,
    gap: 8,
    overflow: 'hidden',
  },
  track: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  group: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  chipText: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', textTransform: 'capitalize' },
  side: { fontSize: 14, color: colors.faintText, fontWeight: '500', textTransform: 'capitalize' },
  sideDisabled: { opacity: 0.3 },
});
```

Note: `slide(1)` e `slide(-1)` equivalgono a mese precedente/successivo: il gruppo `[prec, chip, succ]` scorre (dx positivo → affiora il mese precedente) e al termine chiama `onPrev`. Le frecce sinistra/destra e i tap sui lati riusano la stessa `slide`. La distanza `slot` è misurata a runtime dalle larghezze reali (`onLayout` su testo laterale e chip): `slot = (prevW + chipW) / 2 + GAP`. Il gruppo è centrato nel palco (`justifyContent: center`); se più largo del palco i testi laterali vengono tagliati ai bordi palco (`overflow: hidden`), mai sotto le frecce.

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
      <View style={styles.carouselRow}>
        <MonthCarousel month={month} label={formatMonthLabel(month)} onPrev={prev} onNext={next} />
      </View>
```

Nota: niente `onAll`/`allActive` in Home (doppio tap inerte). Aggiungere negli `styles` di `HomeScreen` `carouselRow: { marginHorizontal: 16 }` per incorniciare la pill allineandola alle card.

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