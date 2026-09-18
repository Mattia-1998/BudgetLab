# Selettore di periodo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire il semplice mese/tutti-mesi di Home e Movimenti con un selettore di periodo a granularità Mese · Bimestre · Trimestre · Semestre · Anno · Tutti · Personalizzato.

**Architecture:** La logica di calcolo dei confini diventa pura in `src/utils/finance.js` (`periodRange`, `shiftAnchor`, `startOfMonth`) e l'etichetta in `src/utils/format.js` (`formatPeriodLabel`). Un hook per-schermata `usePeriod` tiene lo stato e un nuovo componente `PeriodSheet` sceglie il periodo; `MonthCarousel` viene esteso con tap singolo (apre la sheet) e doppio tap ("Tutti"). Le due schermate consumano lo stesso hook in modo indipendente.

**Tech Stack:** React Native 0.86, Expo 57, React 19, test puri con `node:assert` in `scripts/finance.spec.mjs`.

## Global Constraints

- Nessuna nuova dipendenza.
- Niente commenti aggiunti al codice.
- Commit conventional in italiano (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Messaggi utente in italiano.
- Test: `node --experimental-detect-module scripts/finance.spec.mjs` → `Tutti i controlli di finanza/format/categorie passano.`
- Bundle: `npx expo export --platform android` → `Exported: dist`.
- Blocchi allineati al calendario (Gen–Feb, Mar–Apr, …; trimestri Gen–Mar, …; semestri Gen–Giu, Lug–Dic).
- Il doppio tap sul chip conserva la scorciatoia "Tutti i mesi"; il tap singolo apre la sheet dopo ~300 ms.
- Periodo indipendente per schermata (Home e Movimenti separati).

---

### Task 1: Funzioni pure del periodo (`finance.js`)

**Files:**
- Modify: `src/utils/finance.js` (aggiungere in fondo al file)
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: `monthRange(date)` già presente in `finance.js`.
- Produces:
  - `startOfMonth(ms) => number`
  - `periodRange(period) => { startMs, endMs } | null`, con `period = { mode, anchor, customStart, customEnd }` e `mode ∈ { 'month','bimester','quarter','semester','year','all','custom' }`
  - `shiftAnchor(anchorMs, mode, dir) => number`

- [ ] **Step 1: Write the failing test**

In `scripts/finance.spec.mjs`, estendere la riga di import di `finance.js`:

```js
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder, dragInsertIndex, dragRowOffsets, reorderAt, matchesAccountFilter, startOfMonth, periodRange, shiftAnchor } from '../src/utils/finance.js';
```

E aggiungere in fondo al file, prima del `console.log`:

```js
assert.equal(startOfMonth(d(2026, 9, 20)), new Date(2026, 8, 1).getTime());

assert.deepEqual(periodRange({ mode: 'month', anchor: d(2026, 9, 3) }), {
  startMs: new Date(2026, 8, 1).getTime(),
  endMs: new Date(2026, 9, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'bimester', anchor: d(2026, 7, 20) }), {
  startMs: new Date(2026, 6, 1).getTime(),
  endMs: new Date(2026, 8, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'bimester', anchor: d(2026, 4, 10) }), {
  startMs: new Date(2026, 2, 1).getTime(),
  endMs: new Date(2026, 4, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'quarter', anchor: d(2026, 4, 10) }), {
  startMs: new Date(2026, 3, 1).getTime(),
  endMs: new Date(2026, 6, 0, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'semester', anchor: d(2026, 9, 3) }), {
  startMs: new Date(2026, 6, 1).getTime(),
  endMs: new Date(2026, 11, 31, 23, 59, 59, 999).getTime(),
});
assert.deepEqual(periodRange({ mode: 'year', anchor: d(2026, 2, 5) }), {
  startMs: new Date(2026, 0, 1).getTime(),
  endMs: new Date(2026, 11, 31, 23, 59, 59, 999).getTime(),
});
assert.equal(periodRange({ mode: 'all' }), null);
assert.deepEqual(periodRange({ mode: 'custom', customStart: d(2025, 7, 1), customEnd: d(2026, 9, 1) }), {
  startMs: new Date(2025, 6, 1).getTime(),
  endMs: new Date(2026, 9, 0, 23, 59, 59, 999).getTime(),
});

assert.equal(shiftAnchor(d(2026, 1, 15), 'month', -1), new Date(2025, 11, 1).getTime());
assert.equal(shiftAnchor(d(2026, 7, 20), 'quarter', 1), new Date(2026, 9, 1).getTime());
assert.equal(shiftAnchor(d(2026, 2, 5), 'year', 1), new Date(2027, 1, 1).getTime());
assert.equal(shiftAnchor(d(2026, 7, 20), 'all', 1), d(2026, 7, 20));
assert.equal(shiftAnchor(d(2026, 7, 20), 'custom', -1), d(2026, 7, 20));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL — `SyntaxError: The requested module '../src/utils/finance.js' does not provide an export named 'startOfMonth'`.

- [ ] **Step 3: Write minimal implementation**

In fondo a `src/utils/finance.js`:

```js
export function startOfMonth(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

const BLOCK_MONTHS = { month: 1, bimester: 2, quarter: 3, semester: 6 };
const SHIFT_MONTHS = { month: 1, bimester: 2, quarter: 3, semester: 6, year: 12 };

const monthEnd = (year, month) => new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

export function periodRange(period) {
  const { mode, anchor, customStart, customEnd } = period;
  if (mode === 'all') return null;
  if (mode === 'custom') {
    const end = new Date(startOfMonth(customEnd));
    return { startMs: startOfMonth(customStart), endMs: monthEnd(end.getFullYear(), end.getMonth()) };
  }
  const a = new Date(anchor);
  if (mode === 'month') return monthRange(a);
  if (mode === 'year') return { startMs: new Date(a.getFullYear(), 0, 1).getTime(), endMs: monthEnd(a.getFullYear(), 11) };
  const span = BLOCK_MONTHS[mode];
  const startMonth = a.getMonth() - (a.getMonth() % span);
  return { startMs: new Date(a.getFullYear(), startMonth, 1).getTime(), endMs: monthEnd(a.getFullYear(), startMonth + span - 1) };
}

export function shiftAnchor(anchorMs, mode, dir) {
  const step = SHIFT_MONTHS[mode];
  if (!step) return anchorMs;
  const d = new Date(anchorMs);
  return new Date(d.getFullYear(), d.getMonth() + dir * step, 1).getTime();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS — `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/utils/finance.js scripts/finance.spec.mjs
git commit -m "feat: funzioni pure del periodo (periodRange, shiftAnchor, startOfMonth)"
```

---

### Task 2: Etichetta del periodo (`format.js`)

**Files:**
- Modify: `src/utils/format.js`
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: `periodRange` da `./finance` (Task 1).
- Produces: `formatPeriodLabel(period) => string`.

- [ ] **Step 1: Write the failing test**

In `scripts/finance.spec.mjs`, estendere l'import di format:

```js
import { formatCurrency, formatPeriodLabel } from '../src/utils/format.js';
```

E aggiungere prima del `console.log`:

```js
assert.equal(formatPeriodLabel({ mode: 'month', anchor: d(2026, 7, 1) }), 'Luglio 2026');
assert.equal(formatPeriodLabel({ mode: 'bimester', anchor: d(2026, 7, 1) }), 'Bim. Lug\u2013Ago 2026');
assert.equal(formatPeriodLabel({ mode: 'quarter', anchor: d(2026, 7, 1) }), 'Trim. Lug\u2013Set 2026');
assert.equal(formatPeriodLabel({ mode: 'semester', anchor: d(2026, 9, 1) }), 'Sem. Lug\u2013Dic 2026');
assert.equal(formatPeriodLabel({ mode: 'year', anchor: d(2026, 2, 1) }), '2026');
assert.equal(formatPeriodLabel({ mode: 'all' }), 'Tutti i mesi');
assert.equal(formatPeriodLabel({ mode: 'custom', customStart: d(2026, 7, 1), customEnd: d(2026, 9, 1) }), 'Lug \u2013 Set 2026');
assert.equal(formatPeriodLabel({ mode: 'custom', customStart: d(2025, 11, 1), customEnd: d(2026, 2, 1) }), 'Nov 2025 \u2013 Feb 2026');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL — `SyntaxError: The requested module '../src/utils/format.js' does not provide an export named 'formatPeriodLabel'`.

- [ ] **Step 3: Write minimal implementation**

In `src/utils/format.js`:

```js
import { periodRange } from './finance';

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const monthShort = (ms) => capitalize(new Date(ms).toLocaleDateString('it-IT', { month: 'short' }));

const yearOf = (ms) => new Date(ms).getFullYear();

const RANGE_PREFIX = { bimester: 'Bim.', quarter: 'Trim.', semester: 'Sem.' };

export function formatPeriodLabel(period) {
  const { mode, anchor, customStart, customEnd } = period;
  if (mode === 'all') return 'Tutti i mesi';
  if (mode === 'month') return formatMonthLabel(new Date(anchor));
  if (mode === 'year') return String(yearOf(anchor));
  if (RANGE_PREFIX[mode]) {
    const { startMs, endMs } = periodRange(period);
    return `${RANGE_PREFIX[mode]} ${monthShort(startMs)}\u2013${monthShort(endMs)} ${yearOf(startMs)}`;
  }
  return yearOf(customStart) === yearOf(customEnd)
    ? `${monthShort(customStart)} \u2013 ${monthShort(customEnd)} ${yearOf(customEnd)}`
    : `${monthShort(customStart)} ${yearOf(customStart)} \u2013 ${monthShort(customEnd)} ${yearOf(customEnd)}`;
}
```

(Il file mantiene `formatCurrency`, `formatDate`, `formatMonthLabel` esistenti.)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS — `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/utils/format.js scripts/finance.spec.mjs
git commit -m "feat: etichetta del periodo (formatPeriodLabel)"
```

---

### Task 3: Estensione di `MonthCarousel` (tap singolo + shiftable)

**Files:**
- Modify: `src/components/MonthCarousel.js`

**Interfaces:**
- Consumes: niente di nuovo.
- Produces: nuove prop `onSelect` (tap singolo), `shiftable` (default `true`, disabilita frecce/pan quando `false`), `prevLabel`/`nextLabel` (testi delle etichette laterali; se assenti si ricavano dal mese). Le prop esistenti `month`, `label`, `onPrev`, `onNext`, `onAll`, `allActive` restano invariate.

- [ ] **Step 1: Applicare le modifiche**

In `src/components/MonthCarousel.js`:

1. Firma del componente (riga 12):

```js
export default function MonthCarousel({ month, label, onPrev, onNext, onAll, onSelect, allActive, shiftable = true, prevLabel: prevLabelProp, nextLabel: nextLabelProp }) {
```

2. Dopo `const lastTap = useRef(0);` aggiungere:

```js
  const tapTimer = useRef(null);
  const shiftableRef = useRef(shiftable);
  shiftableRef.current = shiftable;
```

3. Aggiungere un effetto di pulizia (dopo il primo `useEffect` esistente):

```js
  useEffect(() => () => { if (tapTimer.current) clearTimeout(tapTimer.current); }, []);
```

4. `onMoveShouldSetPanResponder` (riga 49) usa il ref:

```js
      onMoveShouldSetPanResponder: (_, g) => shiftableRef.current && !allActiveRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
```

5. Sostituire `handleCenterPress`:

```js
  const handleCenterPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (tapTimer.current) { clearTimeout(tapTimer.current); tapTimer.current = null; }
      onAll?.();
      return;
    }
    lastTap.current = now;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapTimer.current = null; onSelect?.(); }, DOUBLE_TAP_MS);
  };
```

6. Etichette laterali (righe 68-69): usare le prop se fornite, altrimenti il mese:

```js
  const prevText = prevLabelProp ?? formatMonthLabel(addMonths(month, -1));
  const nextText = nextLabelProp ?? formatMonthLabel(addMonths(month, 1));
```

e nei due `Pressable` laterali sostituire `{prevLabel}` con `{prevText}` e `{nextLabel}` con `{nextText}`.

7. Disabilitazione frecce (righe 66-67):

```js
  const prevDisabled = !shiftable || !!allActive;
  const nextDisabled = !shiftable || !!allActive;
```

- [ ] **Step 2: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: `Exported: dist` (nessun errore). Le schermate che non passano ancora `onSelect`/`shiftable` continuano a funzionare con i default.

- [ ] **Step 3: Commit**

```bash
git add src/components/MonthCarousel.js
git commit -m "feat: tap singolo apre la sheet periodo nel MonthCarousel"
```

---

### Task 4: Hook `usePeriod`, sheet `PeriodSheet` e integrazione nella Home

**Files:**
- Create: `src/hooks/usePeriod.js`
- Create: `src/components/PeriodSheet.js`
- Modify: `src/screens/HomeScreen.js`

**Interfaces:**
- Consumes: `startOfMonth`, `periodRange`, `shiftAnchor` (Task 1); `formatPeriodLabel` (Task 2); `MonthCarousel` con `onSelect`/`shiftable` (Task 3).
- Produces: `usePeriod() => { period, range, startMs, endMs, label, prevLabel, nextLabel, allActive, shiftable, prev, next, toggleAll, applyPeriod }`; `PeriodSheet` con props `{ visible, period, onSelect, onClose }`.

- [ ] **Step 1: Creare `src/hooks/usePeriod.js`**

```js
import { useState } from 'react';
import { startOfMonth, periodRange, shiftAnchor } from '../utils/finance';
import { formatPeriodLabel } from '../utils/format';

export default function usePeriod() {
  const [mode, setMode] = useState('month');
  const [anchor, setAnchor] = useState(() => startOfMonth(Date.now()));
  const [customStart, setCustomStart] = useState(() => startOfMonth(Date.now()));
  const [customEnd, setCustomEnd] = useState(() => startOfMonth(Date.now()));
  const [restore, setRestore] = useState(null);

  const period = { mode, anchor, customStart, customEnd };
  const range = periodRange(period);
  const startMs = range ? range.startMs : -Infinity;
  const endMs = range ? range.endMs : Infinity;
  const allActive = mode === 'all';
  const shiftable = mode !== 'all' && mode !== 'custom';

  const prev = () => { if (shiftable) setAnchor((a) => shiftAnchor(a, mode, -1)); };
  const next = () => { if (shiftable) setAnchor((a) => shiftAnchor(a, mode, 1)); };

  const toggleAll = () => {
    if (mode === 'all') {
      if (restore) { setMode(restore.mode); setAnchor(restore.anchor); }
      else setMode('month');
      setRestore(null);
    } else {
      setRestore({ mode, anchor });
      setMode('all');
    }
  };

  const applyPeriod = (nextPeriod) => {
    setMode(nextPeriod.mode);
    if (nextPeriod.anchor != null) setAnchor(nextPeriod.anchor);
    if (nextPeriod.customStart != null) setCustomStart(nextPeriod.customStart);
    if (nextPeriod.customEnd != null) setCustomEnd(nextPeriod.customEnd);
    setRestore(null);
  };

  const sideLabel = (dir) => (shiftable ? formatPeriodLabel({ ...period, anchor: shiftAnchor(anchor, mode, dir) }) : '');

  return { period, range, startMs, endMs, label: formatPeriodLabel(period), prevLabel: sideLabel(-1), nextLabel: sideLabel(1), allActive, shiftable, prev, next, toggleAll, applyPeriod };
}
```

- [ ] **Step 2: Creare `src/components/PeriodSheet.js`**

```jsx
import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { periodRange, startOfMonth, shiftAnchor } from '../utils/finance';
import { colors } from '../theme/colors';

const PRESETS = [
  { mode: 'month', label: 'Mese' },
  { mode: 'bimester', label: 'Bimestre' },
  { mode: 'quarter', label: 'Trimestre' },
  { mode: 'semester', label: 'Semestre' },
  { mode: 'year', label: 'Anno' },
  { mode: 'all', label: 'Tutti' },
];

const monthTitle = (ms) => {
  const s = new Date(ms).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function PeriodSheet({ visible, period, onSelect, onClose }) {
  const [showCustom, setShowCustom] = useState(period.mode === 'custom');
  const [start, setStart] = useState(period.customStart);
  const [end, setEnd] = useState(period.customEnd);

  useEffect(() => {
    if (!visible) return;
    setShowCustom(period.mode === 'custom');
    const range = periodRange(period);
    const startMs = period.mode === 'custom' ? period.customStart : startOfMonth(range ? range.startMs : period.anchor);
    const endMs = period.mode === 'custom' ? period.customEnd : startOfMonth(range ? range.endMs : period.anchor);
    setStart(startMs);
    setEnd(endMs);
  }, [visible]);

  const shift = (which, dir) => {
    if (which === 'start') {
      const nextStart = shiftAnchor(start, 'month', dir);
      setStart(nextStart);
      if (nextStart > end) setEnd(nextStart);
    } else {
      const nextEnd = shiftAnchor(end, 'month', dir);
      setEnd(nextEnd);
      if (nextEnd < start) setStart(nextEnd);
    }
  };

  const pickPreset = (mode) => { onSelect({ mode }); onClose(); };
  const applyCustom = () => { onSelect({ mode: 'custom', customStart: start, customEnd: end }); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Periodo</Text>
          {PRESETS.map((p) => {
            const active = period.mode === p.mode;
            return (
              <Pressable key={p.mode} style={[styles.row, active && styles.rowActive]} onPress={() => pickPreset(p.mode)}>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{p.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
          <Pressable style={[styles.row, showCustom && styles.rowActive]} onPress={() => setShowCustom((v) => !v)}>
            <Text style={[styles.rowText, showCustom && styles.rowTextActive]}>Personalizzato…</Text>
            <Ionicons name={showCustom ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {showCustom ? (
            <View style={styles.customBox}>
              <Stepper label="Da" value={start} onShift={(dir) => shift('start', dir)} />
              <Stepper label="A" value={end} onShift={(dir) => shift('end', dir)} />
              <Pressable style={styles.applyBtn} onPress={applyCustom}>
                <Text style={styles.applyText}>Applica</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({ label, value, onShift }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperBtn} hitSlop={6} onPress={() => onShift(-1)}>
          <Ionicons name="chevron-back" size={16} color={colors.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{monthTitle(value)}</Text>
        <Pressable style={styles.stepperBtn} hitSlop={6} onPress={() => onShift(1)}>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  rowActive: { backgroundColor: '#F3F4F6' },
  rowText: { fontSize: 15, color: colors.text },
  rowTextActive: { fontWeight: '700', color: colors.primary },
  customBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.chipBorder, paddingTop: 12 },
  stepper: { marginBottom: 12 },
  stepperLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 6 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.trackBg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 8 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  applyBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  applyText: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 3: Integrare nella Home (`src/screens/HomeScreen.js`)**

Import: sostituire le righe 6-7 con (in Home `formatMonthLabel` non serve più; `formatPeriodLabel` viene usato solo dentro `usePeriod`)

```js
import { isInRange, totalBalance, sumByKind } from '../utils/finance';
import { formatCurrency } from '../utils/format';
```

Aggiungere dopo l'import di `MonthCarousel`:

```js
import PeriodSheet from '../components/PeriodSheet';
import usePeriod from '../hooks/usePeriod';
```

Stato (righe 19-22): rimuovere `month` e `allMonths`, aggiungere `periodVisible`:

```js
  const [periodVisible, setPeriodVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const { period, startMs, endMs, label, prevLabel, nextLabel, allActive, shiftable, prev, next, toggleAll, applyPeriod } = usePeriod();
```

Rimuovere le righe 27-29 (`range`/`startMs`/`endMs` locali) e le righe 38-39 (`prev`/`next` locali). `period` dal hook è già definito; usare `period` dentro la sheet.

Carosello (riga 45):

```jsx
        <MonthCarousel month={new Date(period.anchor)} label={label} prevLabel={prevLabel} nextLabel={nextLabel} onPrev={prev} onNext={next} onAll={toggleAll} onSelect={() => setPeriodVisible(true)} allActive={allActive} shiftable={shiftable} />
```

Titolo (riga 60):

```jsx
        <Text style={styles.sectionTitle}>Spese per categoria · {label}</Text>
```

Stato vuoto (riga 64):

```jsx
          <Text style={styles.empty}>{allActive ? 'Nessun movimento.' : 'Nessun movimento nel periodo.'}</Text>
```

Aggiungere la sheet prima di `<TransactionFormModal ... />` (riga 74):

```jsx
      <PeriodSheet visible={periodVisible} period={period} onSelect={applyPeriod} onClose={() => setPeriodVisible(false)} />
```

- [ ] **Step 4: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: `Exported: dist`.

- [ ] **Step 5: Verifica manuale (a carico dell'umano, non bloccante)**

Su device/emulatore: tap sul mese apre la sheet; scegliendo Trimestre il chip mostra `Trim. <mese>–<mese> <anno>` e le frecce scorrono di un trimestre; doppio tap su "Tutti i mesi" e di nuovo doppio tap ripristina il periodo precedente; Personalizzato con stepper Da/A applica l'intervallo.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/usePeriod.js src/components/PeriodSheet.js src/screens/HomeScreen.js
git commit -m "feat: selettore di periodo nella Home (sheet, hook usePeriod)"
```

---

### Task 5: Integrare il selettore nei Movimenti

**Files:**
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: `usePeriod` (Task 4), `PeriodSheet` (Task 4), `MonthCarousel` con `onSelect`/`shiftable` (Task 3).
- Produces: niente di nuovo per task successivi.

- [ ] **Step 1: Applicare le modifiche**

In `src/screens/TransactionsScreen.js`:

1. Import `finance` (riga 9): rimuovere `monthRange`, tenere `isInRange`:

```js
import { isInRange, matchesAccountFilter } from '../utils/finance';
```

2. Import `format`: rimuovere `formatMonthLabel` se non più usato, tenere solo ciò che resta. La riga 10 diventa:

```js
```
(rimuovere del tutto la riga di import di `formatMonthLabel`)

3. Aggiungere gli import:

```js
import PeriodSheet from '../components/PeriodSheet';
import usePeriod from '../hooks/usePeriod';
```

4. Stato (righe 25-26): rimuovere `month` e `allMonths`, aggiungere `periodVisible` e il hook:

```js
  const [periodVisible, setPeriodVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const { period, startMs, endMs, label, prevLabel, nextLabel, allActive, shiftable, prev, next, toggleAll, applyPeriod } = usePeriod();
```

5. Nel `useMemo` (righe 34-51): rimuovere `const range = allMonths ? null : monthRange(month);`; il filtro data diventa:

```js
        if (!isInRange(t.date, startMs, endMs)) return false;
```

e la dependency array:

```js
  }, [transactions, query, kind, accountId, selectedCategories, startMs, endMs]);
```

6. Carosello (riga 103):

```jsx
              <MonthCarousel month={new Date(period.anchor)} label={label} prevLabel={prevLabel} nextLabel={nextLabel} onPrev={prev} onNext={next} onAll={toggleAll} onSelect={() => setPeriodVisible(true)} allActive={allActive} shiftable={shiftable} />
```

7. Aggiungere la sheet prima di `<TransactionFormModal ... />` (riga 172):

```jsx
      <PeriodSheet visible={periodVisible} period={period} onSelect={applyPeriod} onClose={() => setPeriodVisible(false)} />
```

- [ ] **Step 2: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: `Exported: dist`.

- [ ] **Step 3: Verifica manuale (a carico dell'umano, non bloccante)**

Su device/emulatore: selezionando un anno nei Movimenti la lista e il filtro data coprono l'intero anno; con "Tutti" nessun limite; l'intervallo personalizzato filtra correttamente.

- [ ] **Step 4: Commit**

```bash
git add src/screens/TransactionsScreen.js
git commit -m "feat: selettore di periodo nella schermata Movimenti"
```

---

## Self-Review

**Spec coverage:**
- Mode set (Mese/Bimestre/Trimestre/Semestre/Anno/Tutti/Personalizzato) → Task 1 (`periodRange`, `shiftAnchor`) + Task 4 (`PRESETS`).
- Blocchi allineati al calendario → Task 1 (`startMonth = m - (m % span)`).
- Tap singolo apre sheet (300 ms), doppio tap "Tutti" → Task 3.
- Frecce/swipe disabilitati per `all`/`custom` → Task 3 (`shiftable`).
- Toggle "Tutti" ripristina mode+anchor → Task 4 (`toggleAll`).
- Etichette chip → Task 2; etichette laterali del carosello coerenti col periodo → Task 3 (`prevLabel`/`nextLabel`) + hook `sideLabel` (Task 4).
- Sheet con preset + stepper Da/A + clamp ordine → Task 4.
- Periodo indipendente per schermata → Task 4 (Home) e Task 5 (Movimenti) con due `usePeriod()` separati.
- Home: titolo e stato vuoto → Task 4.
- Movimenti: filtro data con `isInRange` → Task 5.
- Test puri → Task 1 e Task 2.
- Nessuna nuova dipendenza, niente commenti, commit italiani → vincoli globali.

**Placeholder scan:** nessun TBD/TODO; ogni step di codice ha il codice completo.

**Type consistency:** `period`, `startMs`, `endMs`, `label`, `allActive`, `shiftable`, `prev`, `next`, `toggleAll`, `applyPeriod`, `onSelect`, `shiftable` sono usati con gli stessi nomi in Task 3-5. `periodRange`/`shiftAnchor`/`startOfMonth`/`formatPeriodLabel` hanno le firme definite nei Task 1-2.
