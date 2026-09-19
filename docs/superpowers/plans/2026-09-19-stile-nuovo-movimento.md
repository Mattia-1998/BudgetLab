# Restyle form "Nuovo movimento" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ridisegnare il modal "Nuovo movimento" con lo stile del mockup HTML allegato (header, segmented con icone, importo grande, pill categoria, input con icone), aggiungendo il font Plus Jakarta Sans.

**Architecture:** Restyle in place di `TransactionFormModal.js`. Si aggiunge `expo-font` e si caricano 4 pesi di Plus Jakarta Sans in `App.js`; una mappa `FONT` in `src/theme/typography.js` espone i nomi dei font. `Segmented` (usato solo dal form) viene ristilizzato con icone opzionali; `CategoryTile` riceve una prop opzionale `pressScale` (default off, Movimenti invariato).

**Tech Stack:** React Native 0.86 / Expo SDK 57, `expo-font`, Ionicons, font Plus Jakarta Sans (weight 400/500/600/700).

**Spec:** `docs/superpowers/specs/2026-09-19-stile-nuovo-movimento-design.md`

## Global Constraints

- **Nessun commento nel codice.**
- Commit: conventional, in italiano, senza accenti nelle parole a rischio (es. `restyle`, `gestione`), messaggi brevi.
- Unica nuova dipendenza: `expo-font` (via `npx expo install expo-font`). Nessuna altra libreria, né Iconicons diverse da Ionicons.
- `CategoryTile` è condivisa con Movimenti: ogni modifica deve essere opt-in via prop, mai cambiare il comportamento/visual di default.
- Non modificare la logica di business (validazione, `syncState`, `save`, Firestore) né i file di navigazione/tab.
- Verifica di base: `node --experimental-detect-module scripts/finance.spec.mjs` → output "Tutti i controlli di finanza/format/categorie passano."; `npx expo export --platform android` → "Exported: dist". Il controllo visivo è manuale su device.
- `expo-font` è un modulo nativo: dopo averlo aggiunto serve un rebuild una tantum sulla macchina di esecuzione (`npx expo run:android`), poi Fast Refresh come prima.
- Ambiente: Windows / PowerShell, repo root `C:\Users\matti\Desktop\openwork\Cobol`.

---

### Task 1: Font Plus Jakarta Sans + mappa tipografia + caricamento

**Files:**
- Create: `assets/fonts/PlusJakartaSans-Regular.ttf` (400)
- Create: `assets/fonts/PlusJakartaSans-Medium.ttf` (500)
- Create: `assets/fonts/PlusJakartaSans-SemiBold.ttf` (600)
- Create: `assets/fonts/PlusJakartaSans-Bold.ttf` (700)
- Create: `src/theme/typography.js`
- Modify: `package.json`, `package-lock.json` (via `npx expo install expo-font`)
- Modify: `App.js`

**Interfaces:**
- Produces: `src/theme/typography.js` esporta `export const FONT = { regular: 'PlusJakartaSans-Regular', medium: 'PlusJakartaSans-Medium', semiBold: 'PlusJakartaSans-SemiBold', bold: 'PlusJakartaSans-Bold' };` — i task successivi usano `import { FONT } from '../theme/typography'` e applicano `fontFamily: FONT.x`.

- [ ] **Step 1: Install expo-font**

```powershell
npx expo install expo-font
```

Expected: `package.json` e `package-lock.json` aggiornati con `expo-font` (versione compatibile con Expo SDK 57).

- [ ] **Step 2: Scaricare e rinominare i 4 font statici**

```powershell
New-Item -ItemType Directory -Force -Path assets\fonts | Out-Null
Invoke-WebRequest -Uri "https://gwfh.mranftl.com/api/fonts/plus-jakarta-sans?download=zip&subsets=latin&variants=regular,500,600,700&formats=ttf" -OutFile "$env:TEMP\pjs.zip"
Expand-Archive -Path "$env:TEMP\pjs.zip" -DestinationPath assets\fonts -Force
Get-ChildItem assets\fonts
```

Expected: 4 file `.ttf` in `assets\fonts` (nomi tipo `plus-jakarta-sans-latin-400-normal.ttf`, `-500-`, `-600-`, `-700-`). Rinominarli con:

```powershell
Rename-Item assets\fonts\plus-jakarta-sans-latin-400-normal.ttf PlusJakartaSans-Regular.ttf
Rename-Item assets\fonts\plus-jakarta-sans-latin-500-normal.ttf PlusJakartaSans-Medium.ttf
Rename-Item assets\fonts\plus-jakarta-sans-latin-600-normal.ttf PlusJakartaSans-SemiBold.ttf
Rename-Item assets\fonts\plus-jakarta-sans-latin-700-normal.ttf PlusJakartaSans-Bold.ttf
```

Se i nomi reali differiscono, adattare i percorsi a quanto elencato da `Get-ChildItem` (mapping 400→Regular, 500→Medium, 600→SemiBold, 700→Bold). Risultato atteso: nella cartella NON resta nessun file diverso dai 4 `PlusJakartaSans-*.ttf`.

- [ ] **Step 3: Creare la mappa tipografia**

`src/theme/typography.js`:

```js
export const FONT = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semiBold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
};
```

- [ ] **Step 4: Caricare i font in App.js**

Sostituire l'intero contenuto di `App.js` con:

```js
import './firebase/db';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
  });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 5: Prova visibile del font**

In `src/components/TransactionFormModal.js`, al titolo esistente applicare il font semibold (riga `styles.title` esistente, che contiene già `fontSize: 18`):

```jsx
<Text style={[styles.title, { fontFamily: FONT.semiBold }]}>...
```

e in cima al file aggiungere l'import `import { FONT } from '../theme/typography';`. Serve solo come prova leggibile; il Task 4 riscriverà comunque il titolo.

- [ ] **Step 6: Verifica bundle**

```powershell
npx expo export --platform android
```

Expected: termina con "Exported: dist", nessun errore (i `.ttf` devono comparire nella bundle/fonts di `dist`).

- [ ] **Step 7: Commit**

```powershell
git add assets/fonts/PlusJakartaSans-*.ttf src/theme/typography.js App.js package.json package-lock.json src/components/TransactionFormModal.js
git commit -m "feat: aggiunge Plus Jakarta Sans via expo-font"
```

---

### Task 2: CategoryTile — prop `pressScale`

**Files:**
- Modify: `src/components/CategoryTile.js`
- Test (visivo): `src/screens/TransactionsScreen.js` resta identico (default off)

**Interfaces:**
- Produces: `CategoryTile` accetta la nuova prop `pressScale?: boolean` (default `false`). Quando `true`, premendo la tile si scala a 0.96. Tutte le altre prop invariate.

- [ ] **Step 1: Sostituire l'intero contenuto di `src/components/CategoryTile.js`**

```js
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryTile({ icon, label, color, active, width, inactiveColor, pressScale, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width }, active && { backgroundColor: color, borderColor: color }, pressScale && pressed && { transform: [{ scale: 0.96 }] }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={22} color={active ? '#fff' : (inactiveColor ?? color)} />
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 },
  text: { fontSize: 11, fontWeight: '500', color: '#374151' },
  textActive: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Verifica bundle**

```powershell
npx expo export --platform android
```

Expected: "Exported: dist", nessun errore.

- [ ] **Step 3: Commit**

```powershell
git add src/components/CategoryTile.js
git commit -m "feat: prop pressScale opzionale su CategoryTile"
```

---

### Task 3: Segmented ristilizzato con icone opzionali

**Files:**
- Modify: `src/components/Segmented.js`
- Test: nessun altro file usa `Segmented` (già verificato: solo `TransactionFormModal`)

**Interfaces:**
- Produces: `Segmented({ options, value, onChange })` — `options` ora può avere `{ value, label, icon? }`. Con `icon`, mostra l'icona Ionicons a sinistra. Stile nuovo: contenitore slate-100 (`#F1F5F9`) arrotondato, bottone attivo indigo (`#4F46E5`) testo bianco, inattivi testo `colors.textMuted`, font Plus Jakarta Medium.
- Consumes: `FONT` da `src/theme/typography`, `colors` da `src/theme/colors`.

- [ ] **Step 1: Sostituire l'intero contenuto di `src/components/Segmented.js`**

```js
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

export default function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(opt.value)}>
            {opt.icon ? <Ionicons name={opt.icon} size={15} color={active ? '#fff' : colors.textMuted} /> : null}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 18, padding: 6, marginBottom: 16, gap: 4 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 13 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: colors.textMuted, fontSize: 13, fontFamily: FONT.medium },
  chipTextActive: { color: '#fff' },
});
```

- [ ] **Step 2: Verifica bundle**

```powershell
npx expo export --platform android
```

Expected: "Exported: dist", nessun errore.

- [ ] **Step 3: Commit**

```powershell
git add src/components/Segmented.js
git commit -m "style: segmented ristilizzato con icone opzionali"
```

---

### Task 4: Restyle completo di `TransactionFormModal.js`

**Files:**
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: `Segmented` (con `icon`), `CategoryTile` (con `pressScale`), `FONT` (`../theme/typography`), `colors` (`../theme/colors`), `SPENDING_CATEGORIES` + `CATEGORY_MAP` (`../constants/categories`), Ionicons.
- Produces: modal con lo stesso comportamento di prima (stesso contratto `{ visible, onClose, accounts, initial }`, stessa `save()`, stesso `syncState`), nuovo look.

- [ ] **Step 1: Sostituire l'intero contenuto di `src/components/TransactionFormModal.js`**

```js
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { SPENDING_CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import Segmented from './Segmented';
import CategoryTile from './CategoryTile';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

const parseDate = (value) => {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return date.getFullYear() === Number(m[3]) ? date.getTime() : null;
};

const toDmy = (ts) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function TransactionFormModal({ visible, onClose, accounts, initial }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 70) / 4);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [transferTo, setTransferTo] = useState(null);
  const [category, setCategory] = useState(SPENDING_CATEGORIES[0].key);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const isEdit = !!initial;
  const spendKeys = SPENDING_CATEGORIES.map((c) => c.key);
  const visibleKeys = spendKeys.slice(0, 3);
  const restKeys = spendKeys.slice(3);

  const toggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesExpanded((v) => !v);
  };

  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setCategory(initial ? initial.category : SPENDING_CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setTransferTo(initial && initial.kind === 'transfer' ? initial.transferTo : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };

  const chipRow = ({ label, list, value, onChange, emptyMsg }) => (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chipRowWrap}>
        {list.map((a) => {
          const active = value === a.id;
          return (
            <Pressable key={a.id} style={[styles.acctChip, active && styles.acctChipActive]} onPress={() => onChange(a.id)}>
              <Text style={[styles.acctChipText, active && styles.acctChipTextActive]}>{a.name}</Text>
            </Pressable>
          );
        })}
        {list.length === 0 ? <Text style={styles.warn}>{emptyMsg}</Text> : null}
      </View>
    </View>
  );

  const save = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!(value > 0)) { setError('Inserisci un importo valido'); return; }
    const tsMs = parseDate(date);
    if (tsMs == null) { setError('Data non valida (usare GG/MM/AAAA)'); return; }
    if (kind === 'transfer') {
      if (!accountId) { setError('Seleziona il conto di partenza'); return; }
      if (!transferTo) { setError('Seleziona il conto di arrivo'); return; }
      if (accountId === transferTo) { setError('Scegli due conti diversi'); return; }
      try {
        if (isEdit) {
          await updateDoc(doc(db, 'transactions', initial.id), { amount: value, date: tsMs, note: note.trim() });
        } else {
          await addDoc(collection(db, 'transactions'), {
            kind: 'transfer',
            accountId,
            transferTo,
            amount: value,
            date: tsMs,
            note: note.trim(),
          });
        }
        onClose();
      } catch (err) {
        setError('Errore di salvataggio: ' + err.message);
      }
      return;
    }
    if (!accountId) { setError('Seleziona un conto'); return; }
    const data = { accountId, amount: value, kind, category, date: tsMs, note: note.trim() };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'transactions', initial.id), data);
      } else {
        await addDoc(collection(db, 'transactions'), data);
      }
      onClose();
    } catch (err) {
      setError('Errore di salvataggio: ' + err.message);
    }
  };

  const selectedLabel = CATEGORY_MAP[category] ? CATEGORY_MAP[category].label : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.kaView, { paddingBottom: insets.bottom }]}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerEyebrow}>Gestione spese</Text>
                <Text style={styles.title}>{isEdit ? 'Modifica movimento' : 'Nuovo movimento'}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              <Segmented
                options={[
                  { value: 'expense', label: 'Uscita', icon: 'trending-down' },
                  { value: 'income', label: 'Entrata', icon: 'trending-up' },
                  { value: 'transfer', label: 'Trasferimento', icon: 'swap-horizontal' },
                ]}
                value={kind}
                onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); setTransferTo(null); } }}
              />
              <View style={[styles.amountBox, amountFocused && styles.fieldFocused]}>
                <Text style={styles.amountLabel}>Importo</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountSymbol}>€</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0,00 (es. 12,50)"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                  />
                </View>
              </View>
              {kind !== 'transfer' ? (
                <>
                  <View style={styles.catHeader}>
                    <Text style={styles.fieldLabel}>Categoria</Text>
                    <Text style={styles.selectedPill}>{selectedLabel}</Text>
                  </View>
                  <View style={styles.catGrid}>
                    {visibleKeys.map((key) => {
                      const c = CATEGORY_MAP[key];
                      return (
                        <CategoryTile
                          key={key}
                          icon={c.icon}
                          label={c.label}
                          color={c.color}
                          active={category === key}
                          width={tileWidth}
                          pressScale
                          onPress={() => setCategory(key)}
                        />
                      );
                    })}
                    <Pressable style={[styles.catTileArrow, { width: tileWidth }, !categoriesExpanded && restKeys.includes(category) && styles.catTileArrowActive]} onPress={toggleCategories}>
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={!categoriesExpanded && restKeys.includes(category) ? '#fff' : '#94A3B8'} />
                    </Pressable>
                    {categoriesExpanded
                      ? restKeys.map((key) => {
                          const c = CATEGORY_MAP[key];
                          return (
                            <CategoryTile
                              key={key}
                              icon={c.icon}
                              label={c.label}
                              color={c.color}
                              active={category === key}
                              width={tileWidth}
                              pressScale
                              onPress={() => setCategory(key)}
                            />
                          );
                        })
                      : null}
                  </View>
                </>
              ) : null}
              {kind === 'transfer' && isEdit ? (
                (() => {
                  const src = accounts.find((a) => a.id === initial.accountId);
                  const dst = accounts.find((a) => a.id === initial.transferTo);
                  return (
                    <View style={styles.readonlyBox}>
                      <Text style={styles.readonlyText}>
                        {(src ? src.name : 'Conto')} → {(dst ? dst.name : 'Conto')}
                      </Text>
                      <Text style={styles.readonlyHint}>Conti non modificabili in modifica.</Text>
                    </View>
                  );
                })()
              ) : (
                <>
                  {kind === 'transfer' ? (
                    <>
                      {chipRow({
                        label: 'Conto di partenza',
                        list: accounts.filter((a) => a.id !== transferTo),
                        value: accountId,
                        onChange: setAccountId,
                        emptyMsg: 'Nessun conto disponibile: crea prima un conto.',
                      })}
                      {chipRow({
                        label: 'Conto di arrivo',
                        list: accounts.filter((a) => a.id !== accountId),
                        value: transferTo,
                        onChange: setTransferTo,
                        emptyMsg: 'Nessun conto disponibile: crea prima un conto.',
                      })}
                    </>
                  ) : chipRow({
                    label: 'Conto',
                    list: accounts,
                    value: accountId,
                    onChange: setAccountId,
                    emptyMsg: 'Nessun conto: crea prima un conto.',
                  })}
                </>
              )}
              <Text style={styles.fieldLabel}>Data (GG/MM/AAAA)</Text>
              <View style={[styles.field, dateFocused && styles.fieldFocused]}>
                <Ionicons name="calendar-outline" size={18} color={colors.faintText} />
                <TextInput
                  style={styles.fieldInput}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numeric"
                  onFocus={() => setDateFocused(true)}
                  onBlur={() => setDateFocused(false)}
                />
              </View>
              <Text style={styles.fieldLabel}>Nota (opzionale)</Text>
              <View style={[styles.field, noteFocused && styles.fieldFocused]}>
                <Ionicons name="create-outline" size={18} color={colors.faintText} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Aggiungi una nota..."
                  placeholderTextColor={colors.faintText}
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSave]} onPress={save} activeOpacity={0.9}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.btnSaveText}>Salva</Text>
              </Pressable>
            </View>
          </View>
          <View pointerEvents="none" style={[styles.navBarStrip, { height: insets.bottom }]} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kaView: { flex: 1, justifyContent: 'flex-end' },
  navBarStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#000000' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 16 },
  headerEyebrow: { fontSize: 11, fontFamily: FONT.semiBold, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 22, fontFamily: FONT.bold, color: '#0F172A' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  amountBox: { backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, marginBottom: 16 },
  fieldFocused: { borderColor: '#4F46E5' },
  amountLabel: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountSymbol: { fontSize: 28, fontFamily: FONT.bold, color: '#94A3B8' },
  amountInput: { flex: 1, fontSize: 28, fontFamily: FONT.bold, color: '#0F172A', padding: 0 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  fieldLabel: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  selectedPill: { fontSize: 12, fontFamily: FONT.medium, color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 10 },
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  catTileArrowActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  acctChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 8, marginBottom: 8 },
  acctChipActive: { backgroundColor: '#4F46E5' },
  acctChipText: { color: '#475569', fontSize: 13, fontFamily: FONT.medium },
  acctChipTextActive: { color: '#fff' },
  warn: { color: '#B26A00', fontFamily: FONT.medium },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0F172A', padding: 0 },
  error: { color: colors.negative, fontFamily: FONT.medium, fontSize: 13, marginTop: 4, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnCancel: { backgroundColor: '#F1F5F9' },
  btnSave: { backgroundColor: '#4F46E5', elevation: 3, shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText: { color: '#475569', fontFamily: FONT.semiBold, fontSize: 15 },
  btnSaveText: { color: '#fff', fontFamily: FONT.semiBold, fontSize: 15 },
  readonlyBox: { borderWidth: 1, borderColor: colors.chipBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB' },
  readonlyText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  readonlyHint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
```

Attenzione: il file deve terminare con newline finale (ultima riga `});` seguita da LF).

- [ ] **Step 2: Verifica suite logica**

```powershell
node --experimental-detect-module scripts/finance.spec.mjs
```

Expected: "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 3: Verifica bundle**

```powershell
npx expo export --platform android
```

Expected: "Exported: dist", nessun errore.

- [ ] **Step 4: Verifica visiva su device**

Dopo il rebuild nativo (`npx expo run:android`, necessario una volta per `expo-font`), aprire "Nuovo movimento" e verificare: header con titolo + X, segmented con icone, importo grande con €, griglia categorie 3+freccia+8 con pill del selezionato, chip conti, input data/nota con icone, footer Annulla/Salva, bordo indigo al focus sugli input, messaggi di errore visibili. Non è possibile validare il look da CLI: va fatto manualmente.

- [ ] **Step 5: Commit**

```powershell
git add src/components/TransactionFormModal.js
git commit -m "feat: restyle del form nuovo movimento"
```

---

## Self-Review

- **Spec coverage:** tutte le sezioni del design (header, segmented con icone, importo, categoria con pill+freccia+scale, chip conti, data/nota con icone, footer) sono implementate nel Task 4; font+infra nel Task 1; `pressScale` nel Task 2; Segmented nel Task 3. Scelte del brainstorming (niente toast, selezionata = colore categoria, freccia mantenuta, niente "Tutte", Ionicons) rispettate.
- **Placeholder scan:** nessun "TBD/TODO"; ogni task ha codice completo.
- **Type consistency:** `FONT.*` come da `typography.js`; prop `icon` di Segmented come da Task 3; prop `pressScale` come da Task 2; `visibleKeys`/`restKeys`/`toggleCategories` come già in uso nel form corrente.
- Gap potenziale: il build nativo per `expo-font` è documentato nel vincolo globale e richiesto nel Task 1 (step 1) e Task 4 (step 4).