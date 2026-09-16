# App Gestione Economica Personale — Implementazione Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App Android (Expo/React Native) per la gestione economica personale: homepage con grafico spese, saldi dei conti ed elenco movimenti, dati su Cloud Firestore.

**Architecture:** UI Expo (JavaScript) che legge e scrive su Cloud Firestore come unica fonte dati, con persistenza offline. I saldi non si salvano mai: si calcolano sommando i movimenti. Nessun login: config Firebase dentro l'app, utente singolo.

**Tech Stack:** Expo, React Navigation (bottom tabs), Firebase Web SDK (`firebase/firestore`), `react-native-gifted-charts`, `@expo/vector-icons`, `expo-network`.

## Global Constraints

- JavaScript puro (niente TypeScript): progetto Expo con template `blank`.
- Config Firebase dentro l'app in `firebase/config.js`; nessun login.
- Regole Firestore aperte in `firestore.rules` (limite accettato per app personale).
- I saldi conto sono calcolati, mai salvati: `accountBalance` / `totalBalance` in `src/utils/finance.js`.
- Data dei movimenti salvata come numero ms (es. `Date.now()`), mai oggetti `Date`/Timestamp su Firestore.
- Importi sempre positivi; il tipo entrata/uscita è nel campo `kind: 'income' | 'expense'`.
- Categorie fisse in `src/constants/categories.js` (Cibo, Trasporti, Casa, Bollette, Salute, Svago, Shopping, Altro) con icona Ionicons e colore.
- Valuta EUR, formattazione locale `it-IT`.
- Test automatici non previsti: verifica manuale (emulatore/Expo Go) + script `scripts/finance.spec.mjs` per la logica pura.
- Prerequisiti: Node 20+, Expo Go su emulatore/telefono, progetto Firebase creato.

---
### Task 1: Scaffolding del progetto Expo

**Files:**
- Create: (da create-expo-app) `app.json`, `App.js`, `index.js`, `package.json`, `.gitignore`
- Modify: `app.json`

**Interfaces:**
- Produces: progetto Expo funzionante in JS nella root del repo. Entry point `index.js` che registra `App.js` (default export `App`).

- [ ] **Step 1: Verifica ambiente**

Run: `node --version`
Expected: `v20.x` o superiore.

- [ ] **Step 2: Genera il progetto Expo blank (JS)**

Run: `npx create-expo-app@latest . --template blank`
Se chiede conferma per la directory non vuota, rispondi sì. Siamo nella root del repo git già inizializzato (niente worktree).

- [ ] **Step 3: Imposta nome e slug in app.json**

Modify `app.json`: imposta `"name": "Gestione Economica"` e `"slug": "gestione-economica"`.

- [ ] **Step 4: Verifica che il bundle si generi**

Run: `npx expo export --platform android`
Expected: export completato, Build successful, nessun errore.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold app Expo (blank, JS)"
```

---

### Task 2: Dipendenze (navigazione, firebase, grafico, icone, rete)

**Files:**
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 1.
- Produces: pacchetti: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `react-native-screens`, `react-native-safe-area-context`, `firebase`, `react-native-gifted-charts`, `@expo/vector-icons`, `expo-network`, `react-native-svg`, `expo-linear-gradient`.

- [ ] **Step 1: Installa le dipendenze**

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install firebase
npx expo install @expo/vector-icons
npx expo install expo-network
npx expo install react-native-svg expo-linear-gradient
npx expo install react-native-gifted-charts
```

Nota: `expo install` risolve le versioni compatibili con l'SDK; per pacchetti senza versione SDK nota usa l'ultima compatibile.

- [ ] **Step 2: Verifica bundle con le nuove dipendenze**

Run: `npx expo export --platform android`
Expected: Build successful.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: dipendenze navigazione, firebase, grafico, icone, rete"
```

---

### Task 3: Modulo Firebase + regole di sicurezza

**Files:**
- Create: `firebase/config.js`, `firebase/db.js`, `firestore.rules`
- Modify: `App.js` (import del modulo firebase)

**Interfaces:**
- Consumes: pacchetto `firebase` (Task 2).
- Produces: `db` importabile come `import { db } from '../../firebase/db'`; `FIREBASE_CONFIG`; `firestore.rules` da pubblicare.

- [ ] **Step 1: Crea firebase/config.js**

```js
// Config del progetto Firebase (console.firebase.google.com > Impostazioni progetto > App Web).
// Compila i campi con i valori reali prima di usare l'app.
export const FIREBASE_CONFIG = {
  apiKey: "INSERISCI-apiKey",
  authDomain: "INSERISCI-authDomain",
  projectId: "INSERISCI-projectId",
  storageBucket: "INSERISCI-storageBucket",
  messagingSenderId: "INSERISCI-messagingSenderId",
  appId: "INSERISCI-appId",
};
```

- [ ] **Step 2: Crea firebase/db.js (persistenza offline)**

```js
import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);
const db = initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'already-exists') {
    console.warn('[firebase] persistenza già attiva');
  } else {
    console.error('[firebase] inizializzazione persistenza fallita', err);
  }
});

export { db, app };
```

- [ ] **Step 3: Crea firestore.rules (regole aperte)**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

- [ ] **Step 4: Importa il modulo in App.js**

Modify `App.js`: aggiungi in cima (prima del componente): `import './firebase/db';`

- [ ] **Step 5: Configurazione manuale utente**

console.firebase.google.com → crea progetto → aggiungi app Web → abilita Cloud Firestore → copia i valori in `firebase/config.js` → pubblica `firestore.rules` (Firestore > Rules, incolla il contenuto del file). Istruzioni da riportare nel README (Task 11).

- [ ] **Step 6: Verifica manuale**

Run: `npx expo start`, apri in Expo Go con config compilata.
Expected: app aperta senza crash, nessun errore rosso in console.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: modulo firebase con persistenza offline e regole aperte"
```

---
### Task 4: Logica pura — categorie, formattazione, calcoli

**Files:**
- Create: `src/constants/categories.js`, `src/utils/format.js`, `src/utils/finance.js`, `scripts/finance.spec.mjs`

**Interfaces:**
- Produces (usate dalle task successive):
  - `CATEGORIES`: array `[{ key, label, icon, color }]` (8 categorie); `CATEGORY_MAP`: oggetto chiave → categoria.
  - `formatCurrency(amount): string`
  - `formatDate(tsMs): string`
  - `formatMonthLabel(date): string`
  - `monthRange(date): { startMs, endMs }`
  - `isInRange(tsMs, startMs, endMs): boolean`
  - `signedAmount(t): number` (+amount se income, −amount se expense)
  - `accountBalance(transactions, accountId): number`
  - `totalBalance(accounts, transactions): number`
  - `expensesByCategory(transactions, startMs, endMs): [{category, total, percent}]` (per total decrescente)
  - `sumByKind(transactions, kind, startMs, endMs): number`

- [ ] **Step 1: Crea src/constants/categories.js**

```js
export const CATEGORIES = [
  { key: 'cibo', label: 'Cibo', icon: 'fast-food-outline', color: '#F4511E' },
  { key: 'trasporti', label: 'Trasporti', icon: 'car-outline', color: '#1E88E5' },
  { key: 'casa', label: 'Casa', icon: 'home-outline', color: '#8E24AA' },
  { key: 'bollette', label: 'Bollette', icon: 'receipt-outline', color: '#00897B' },
  { key: 'salute', label: 'Salute', icon: 'medical-outline', color: '#E53935' },
  { key: 'svago', label: 'Svago', icon: 'game-controller-outline', color: '#FB8C00' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#43A047' },
  { key: 'altro', label: 'Altro', icon: 'ellipsis-horizontal-outline', color: '#757575' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
```

- [ ] **Step 2: Crea src/utils/format.js**

```js
export function formatCurrency(amount) {
  return amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
}

export function formatDate(tsMs) {
  return new Date(tsMs).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
}
```

- [ ] **Step 3: Crea src/utils/finance.js**

```js
export function monthRange(date) {
  const startMs = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const endMs = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
  return { startMs, endMs };
}

export function isInRange(tsMs, startMs, endMs) {
  return tsMs >= startMs && tsMs <= endMs;
}

export function signedAmount(t) {
  return t.kind === 'income' ? t.amount : -t.amount;
}

export function accountBalance(transactions, accountId) {
  return transactions.reduce((sum, t) => (t.accountId === accountId ? sum + signedAmount(t) : sum), 0);
}

export function totalBalance(accounts, transactions) {
  return accounts.reduce((sum, a) => sum + accountBalance(transactions, a.id), 0);
}

export function expensesByCategory(transactions, startMs, endMs) {
  const totals = {};
  transactions.forEach((t) => {
    if (t.kind === 'expense' && isInRange(t.date, startMs, endMs)) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    }
  });
  const entries = Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  const all = entries.reduce((s, i) => s + i.total, 0);
  return entries.map((i) => ({ ...i, percent: all ? Math.round((i.total / all) * 100) : 0 }));
}

export function sumByKind(transactions, kind, startMs, endMs) {
  return transactions.reduce(
    (s, t) => (t.kind === kind && isInRange(t.date, startMs, endMs) ? s + t.amount : s),
    0
  );
}
```

- [ ] **Step 4: Crea scripts/finance.spec.mjs (verifica logica pura)**

```js
import assert from 'node:assert';
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind } from '../src/utils/finance.js';
import { CATEGORIES, CATEGORY_MAP } from '../src/constants/categories.js';
import { formatCurrency } from '../src/utils/format.js';

const d = (y, m, day) => new Date(y, m - 1, day, 12, 0, 0).getTime();
const txs = [
  { id: 'a', accountId: 'c1', amount: 100, kind: 'income', category: 'altro', date: d(2026, 9, 5) },
  { id: 'b', accountId: 'c1', amount: 30, kind: 'expense', category: 'cibo', date: d(2026, 9, 10) },
  { id: 'c', accountId: 'c2', amount: 20, kind: 'expense', category: 'cibo', date: d(2026, 9, 12) },
  { id: 'd', accountId: 'c1', amount: 10, kind: 'expense', category: 'trasporti', date: d(2026, 8, 20) },
];
const accounts = [{ id: 'c1', name: 'Conto' }, { id: 'c2', name: 'Contanti' }];

const { startMs, endMs } = monthRange(new Date(2026, 8, 15));
assert.equal(isInRange(d(2026, 9, 1), startMs, endMs), true);
assert.equal(isInRange(d(2026, 8, 31), startMs, endMs), false);

assert.equal(accountBalance(txs, 'c1'), 60); // 100 - 30 - 10 (il 10 resta nel saldo totale del conto)
assert.equal(accountBalance(txs, 'c2'), -20);
assert.equal(totalBalance(accounts, txs), 40);

const cats = expensesByCategory(txs, startMs, endMs);
assert.deepEqual(cats, [
  { category: 'cibo', total: 50, percent: 83 },
  { category: 'trasporti', total: 10, percent: 17 },
]);

assert.equal(sumByKind(txs, 'income', startMs, endMs), 100);
assert.equal(sumByKind(txs, 'expense', startMs, endMs), 60);

assert.equal(CATEGORIES.length, 8);
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
assert.equal(formatCurrency(12.5), '12,50\u00a0€');

console.log('Tutti i controlli di finanza/format/categorie passano.');
```

Nota: il file usa solo il runtime Node (nessun test framework).

- [ ] **Step 5: Esegui lo script**

Run: `node scripts/finance.spec.mjs`
Expected: stampa "Tutti i controlli di finanza/format/categorie passano." Nessun `AssertionError`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: categorie, formattazione e calcoli finanziari con verifica"
```

---

### Task 5: Scheletro navigazione (3 tab)

**Files:**
- Create: `src/screens/HomeScreen.js`, `src/screens/TransactionsScreen.js`, `src/screens/AccountsScreen.js`, `src/navigation/AppNavigator.js`
- Modify: `App.js`

**Interfaces:**
- Consumes: task 1-3.
- Produces: `AppNavigator` (default export) con tab `Home`, `Movimenti`, `Conti`. Screens placeholder da completare nelle task 7-9.

- [ ] **Step 1: Crea le tre schermate placeholder**

Create `src/screens/HomeScreen.js`:
```js
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
```
Idem per `TransactionsScreen.js` (testo "Movimenti") e `AccountsScreen.js` (testo "Conti"), con nomi default export `TransactionsScreen` / `AccountsScreen`.

- [ ] **Step 2: Crea src/navigation/AppNavigator.js**

```js
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Movimenti: 'swap-vertical-outline',
  Conti: 'wallet-outline',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: '#1B5E20',
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Movimenti" component={TransactionsScreen} options={{ title: 'Movimenti' }} />
        <Tab.Screen name="Conti" component={AccountsScreen} options={{ title: 'Conti' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 3: Usa AppNavigator in App.js**

Modify `App.js`: mantieni `import './firebase/db';` in cima, poi `import AppNavigator from './src/navigation/AppNavigator';` e render `export default App` che ritorna `<AppNavigator />`.

- [ ] **Step 4: Verifica manuale**

Run: `npx expo start`, apri in Expo Go.
Expected: tre tab in basso (Home, Movimenti, Conti) navigabili, tutti mostrano il proprio testo.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: navigazione a tab con schermate base"
```

---
### Task 6: Hook dati (accounts, transactions, rete) + banner offline

**Files:**
- Create: `src/hooks/useAccounts.js`, `src/hooks/useTransactions.js`, `src/hooks/useNetworkStatus.js`, `src/components/OfflineBanner.js`

**Interfaces:**
- Consumes: `db` da `../../firebase/db` (Task 3), pacchetto `expo-network` (Task 2).
- Produces:
  - `useAccounts(): { accounts, loading, error }` con `accounts = [{ id, name, type, color, createdAt }]`.
  - `useTransactions(): { transactions, loading, error }` con `transactions = [{ id, accountId, amount, kind, category, date(ms), note }]`.
  - `useNetworkStatus(): boolean` (true = online).
  - `<OfflineBanner />` (usa `useNetworkStatus` internamente; renderizza nulla se online).

- [ ] **Step 1: Crea src/hooks/useAccounts.js**

```js
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/db';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accounts'),
      (snap) => {
        setAccounts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { accounts, loading, error };
}
```

- [ ] **Step 2: Crea src/hooks/useTransactions.js**

```js
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/db';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'transactions'),
      (snap) => {
        setTransactions(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { transactions, loading, error };
}
```

- [ ] **Step 3: Crea src/hooks/useNetworkStatus.js**

```js
import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    Network.getNetworkStateAsync()
      .then((state) => {
        if (mounted) setOnline(state.isInternetReachable !== false);
      })
      .catch(() => {});
    const sub = Network.addNetworkStateListener((state) => {
      if (mounted) setOnline(state.isInternetReachable !== false);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return online;
}
```

- [ ] **Step 4: Crea src/components/OfflineBanner.js**

```js
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const online = useNetworkStatus();
  if (online) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Nessuna connessione — le modifiche verrano sincronizzate quando torna la rete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#FFECB3', paddingVertical: 8, paddingHorizontal: 12 },
  text: { color: '#6D4C00', textAlign: 'center', fontSize: 13 },
});
```

- [ ] **Step 5: Verifica temporanea + manuale**

Per verificare la pipeline: in `HomeScreen.js` (placeholder) mostrare brevemente `<OfflineBanner />` e `JSON.stringify(accounts)` + `JSON.stringify(transactions.length)` usando `useAccounts`/`useTransactions`, poi rimuovere prima del commit. In Expo Go con config compilata: expected lista conti popolata dai dati Firestore (vuota se il db è nuovo, senza errori rossi). Attiva/disattiva modalità aereo: banner appare/scompare.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: hook dati Firestore, stato rete e banner offline"
```

---

### Task 7: Schermata Conti + modale crea/modifica conto

**Files:**
- Create: `src/components/AccountFormModal.js`
- Modify: `src/screens/AccountsScreen.js`

**Interfaces:**
- Consumes: `useAccounts`, `useTransactions`, `accountBalance`, `totalBalance`, `formatCurrency`, `OfflineBanner` (Task 4 e 6).
- Produces:
  - `<AccountFormModal visible onClose initial={account|null} />` (campiona `initial`; crea se null, aggiorna se presente).
  - `AccountsScreen` completo: lista conti con saldo, aggiunta/modifica/eliminazione.
  - Scritture: `addDoc(collection(db,'accounts'), {...})`, `updateDoc(doc(db,'accounts',id), {...})`, `deleteDoc(doc(db,'accounts',id))`.

- [ ] **Step 1: Crea src/components/AccountFormModal.js**

```js
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';

const TYPES = ['contante', 'banca', 'carta'];
const COLORS = ['#1B5E20', '#1565C0', '#6A1B9A', '#AD1457', '#E65100', '#37474F'];

export default function AccountFormModal({ visible, onClose, initial }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState(null);
  const isEdit = !!initial;

  const syncState = () => {
    setName(initial ? initial.name : '');
    setType(initial ? initial.type : TYPES[0]);
    setColor(initial ? initial.color : COLORS[0]);
    setError(null);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Inserisci un nome');
      return;
    }
    const data = { name: name.trim(), type, color, createdAt: initial ? initial.createdAt : Date.now() };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'accounts', initial.id), data);
      } else {
        await addDoc(collection(db, 'accounts'), data);
      }
      onClose();
    } catch (err) {
      setError('Errore di salvataggio: ' + err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Modifica conto' : 'Nuovo conto'}</Text>
          <TextInput style={styles.input} placeholder="Nome (es. Intesa)" value={name} onChangeText={setName} />
          <View style={styles.row}>
            {TYPES.map((t) => (
              <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            {COLORS.map((c) => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} onPress={() => setColor(c)} />
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnText}>Annulla</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnSave]} onPress={save}>
              <Text style={styles.btnText}>Salva</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#1B5E20' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  colorDotActive: { borderWidth: 3, borderColor: '#000' },
  error: { color: '#C62828', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: '#1B5E20' },
  btnText: { color: '#333', fontWeight: '600' },
});
```
(Il contrasto del testo del pulsante "Salva" viene sistemato in Task 10.)

- [ ] **Step 2: Crea AccountsScreen completa**

```js
import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { accountBalance, totalBalance } from '../utils/finance';
import { formatCurrency } from '../utils/format';
import AccountFormModal from '../components/AccountFormModal';
import OfflineBanner from '../components/OfflineBanner';

export default function AccountsScreen() {
  const { accounts, loading, error } = useAccounts();
  const { transactions } = useTransactions();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => { setEditing(null); setModalVisible(true); };
  const openEdit = (acc) => { setEditing(acc); setModalVisible(true); };

  const confirmDelete = (acc) => {
    Alert.alert('Elimina conto', `Eliminare "${acc.name}"? I movimenti collegati resteranno ma senza conto.`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'accounts', acc.id)) },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore: {error.message}</Text></View>;

  const total = totalBalance(accounts, transactions);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Totale</Text>
        <Text style={[styles.totalValue, { color: total >= 0 ? '#1B5E20' : '#C62828' }]}>{formatCurrency(total)}</Text>
      </View>
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => {
          const bal = accountBalance(transactions, item.id);
          return (
            <Pressable style={styles.card} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardType}>{item.type}</Text>
              </View>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={12}>
                <Ionicons name="trash-outline" size={20} color="#C62828" />
              </Pressable>
              <Text style={[styles.cardBalance, { color: bal >= 0 ? '#1B5E20' : '#C62828' }]}>{formatCurrency(bal)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
      />
      <Pressable style={styles.add} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.addText}>Aggiungi conto</Text>
      </Pressable>
      <AccountFormModal visible={modalVisible} onClose={() => setModalVisible(false)} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  errorText: { color: '#C62828' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  totalLabel: { fontSize: 16, color: '#555' },
  totalValue: { fontSize: 22, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardType: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  cardBalance: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B5E20', margin: 16, padding: 14, borderRadius: 12, gap: 6 },
  addText: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 3: Verifica manuale (Expo Go)**

Expected:
- Creare conti di ogni tipo → compaiono in lista con saldo 0,00 € e totale aggiornato.
- Tap su conto → modale pre-compilata; salva, le modifiche si vedono (nome/colore/tipo).
- Trash o long-press → Alert di conferma; eliminando si aggiorna il totale.
- Nome vuoto → errore inline "Inserisci un nome".

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: schermata conti con saldi e modale crea/modifica/elimina"
```

---
### Task 8: Movimenti — modale form + schermata con filtri ed eliminazione

**Files:**
- Create: `src/components/TransactionItem.js`, `src/components/TransactionFormModal.js`, `src/components/MonthlyNav.js`, `src/components/Segmented.js`
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: `CATEGORIES/CATEGORY_MAP`, `formatCurrency/formatDate`, `useAccounts/useTransactions`, `db` (Task 4, 6, 3).
- Produces:
  - `<TransactionItem transaction onPress onDelete />` riga riutilizzabile (usata anche in Home, Task 9).
  - `<TransactionFormModal visible onClose accounts initial />` (crea se `initial` null, modifica altrimenti; campi amount/kind/category/account/date/note; date salvata come ms).
  - `<MonthlyNav month onPrev onNext onAll allActive label />` selettore mese riutilizzabile.
  - `<Segmented options value onChange />` (Entrata/Uscita e altri gruppi di chip).
  - `TransactionsScreen`: ricerca testo, filtro tipo, filtro conto, filtro categoria, mese (o "Tutti"), lista, modifica, eliminazione.

- [ ] **Step 1: Crea src/components/Segmented.js**

```js
import { View, Pressable, Text, StyleSheet } from 'react-native';

export default function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(opt.value)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#1B5E20' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
});
```

- [ ] **Step 2: Crea src/components/MonthlyNav.js**

```js
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MonthlyNav({ month, onPrev, onNext, onAll, allActive, label }) {
  return (
    <View style={styles.row}>
      {onAll ? (
        <Pressable style={[styles.allChip, allActive && styles.allChipActive]} onPress={onAll}>
          <Text style={[styles.allText, allActive && styles.allTextActive]}>Tutti</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onPrev} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color="#1B5E20" />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onNext} hitSlop={12}>
        <Ionicons name="chevron-forward" size={22} color="#1B5E20" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 16 },
  label: { fontSize: 16, fontWeight: '600', minWidth: 150, textAlign: 'center', textTransform: 'capitalize' },
  allChip: { position: 'absolute', left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EEE' },
  allChipActive: { backgroundColor: '#1B5E20' },
  allText: { color: '#333' },
  allTextActive: { color: '#fff' },
});
```

- [ ] **Step 3: Crea src/components/TransactionItem.js**

```js
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_MAP } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/format';

export default function TransactionItem({ transaction, onPress, onDelete }) {
  const cat = CATEGORY_MAP[transaction.category] || CATEGORY_MAP.altro;
  const income = transaction.kind === 'income';
  const amount = (income ? '+' : '-') + formatCurrency(transaction.amount);
  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
          <Ionicons name={cat.icon} size={20} color={cat.color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.desc}>{transaction.note || cat.label}</Text>
          <Text style={styles.sub}>{cat.label} · {formatDate(transaction.date)}</Text>
        </View>
        <Text style={[styles.amount, { color: income ? '#1B5E20' : '#C62828' }]}>{amount}</Text>
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={12} style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color="#C62828" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  desc: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, color: '#888', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  delete: { paddingLeft: 8 },
});
```

- [ ] **Step 4: Crea src/components/TransactionFormModal.js**

```js
import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { CATEGORIES } from '../constants/categories';
import Segmented from './Segmented';

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
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const isEdit = !!initial;

  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setCategory(initial ? initial.category : CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };

  const save = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!(value > 0)) { setError('Inserisci un importo valido'); return; }
    if (!accountId) { setError('Seleziona un conto'); return; }
    const tsMs = parseDate(date);
    if (tsMs == null) { setError('Data non valida (usare GG/MM/AAAA)'); return; }
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

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Modifica movimento' : 'Nuovo movimento'}</Text>
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }]}
            value={kind}
            onChange={setKind}
          />
          <TextInput
            style={styles.input}
            placeholder="Importo (es. 12,50)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.fieldLabel}>Categoria</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable key={c.key} style={[styles.cat, active && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setCategory(c.key)}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                  <Text style={styles.catText}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Conto</Text>
          <View style={styles.acctRow}>
            {accounts.map((a) => {
              const active = accountId === a.id;
              return (
                <Pressable key={a.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setAccountId(a.id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
                </Pressable>
              );
            })}
            {accounts.length === 0 ? <Text style={styles.warn}>Nessun conto: crea prima un conto.</Text> : null}
          </View>
          <Text style={styles.fieldLabel}>Data (GG/MM/AAAA)</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Nota (opzionale)" value={note} onChangeText={setNote} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnText}>Annulla</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnSave]} onPress={save}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Salva</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  cat: { alignItems: 'center', justifyContent: 'center', width: 80, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginBottom: 8 },
  catText: { fontSize: 11, color: '#444' },
  acctRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#1B5E20' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  warn: { color: '#B26A00' },
  error: { color: '#C62828', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: '#1B5E20' },
  btnText: { color: '#333', fontWeight: '600' },
});
```

- [ ] **Step 5: Crea TransactionsScreen completa**

```js
import { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { monthRange, isInRange } from '../utils/finance';
import { formatMonthLabel } from '../utils/format';
import TransactionItem from '../components/TransactionItem';
import TransactionFormModal from '../components/TransactionFormModal';
import MonthlyNav from '../components/MonthlyNav';
import Segmented from '../components/Segmented';
import OfflineBanner from '../components/OfflineBanner';

export default function TransactionsScreen() {
  const { accounts, loading: loadingAccts, error: errorAccts } = useAccounts();
  const { transactions, loading: loadingTxs, error: errorTxs } = useTransactions();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all'); // 'all' | 'income' | 'expense'
  const [accountId, setAccountId] = useState('all');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState(() => new Date());
  const [allMonths, setAllMonths] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const range = allMonths ? null : monthRange(month);
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (kind !== 'all' && t.kind !== kind) return false;
        if (accountId !== 'all' && t.accountId !== accountId) return false;
        if (category !== 'all' && t.category !== category) return false;
        if (range && !isInRange(t.date, range.startMs, range.endMs)) return false;
        if (q) {
          const catLabel = (CATEGORY_MAP[t.category] || CATEGORY_MAP.altro).label.toLowerCase();
          const note = (t.note || '').toLowerCase();
          if (!catLabel.includes(q) && !note.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  }, [transactions, query, kind, accountId, category, month, allMonths]);

  if (loadingAccts || loadingTxs) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (errorAccts || errorTxs) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore</Text></View>;

  const confirmDelete = (t) =>
    Alert.alert('Elimina movimento', 'Eliminare questo movimento?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'transactions', t.id)) },
    ]);

  const prev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <TextInput style={styles.search} placeholder="Cerca per categoria o nota" value={query} onChangeText={setQuery} />
      <View style={styles.filters}>
        <Segmented
          options={[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }]}
          value={kind}
          onChange={setKind}
        />
        <Segmented
          options={[{ value: 'all', label: 'Conto: tutti' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
          value={accountId}
          onChange={setAccountId}
        />
        <Segmented
          options={[{ value: 'all', label: 'Cat: tutte' }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
          value={category}
          onChange={setCategory}
        />
        <MonthlyNav
          month={month}
          label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)}
          onPrev={prev}
          onNext={next}
          onAll={() => setAllMonths(true)}
          allActive={allMonths}
        />
        {allMonths ? <Pressable onPress={() => setAllMonths(false)}><Text style={styles.undoAll}>Torna al mese corrente</Text></Pressable> : null}
      </View>
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
        ListEmptyComponent={<Text style={styles.empty}>Nessun movimento trovato.</Text>}
      />
      <Pressable style={styles.fab} onPress={() => { setEditing(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} accounts={accounts} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  errorText: { color: '#C62828' },
  search: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#DDD' },
  filters: { marginTop: 8, paddingHorizontal: 16 },
  undoAll: { color: '#1B5E20', textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
```

Nota: `Segmented` con molti conti/categorie produce chip a capo automatico (flexWrap): accettabile per v1; se troppa roba diventa scorrevole in un secondo momento.

- [ ] **Step 6: Verifica manuale (Expo Go)**

Expected:
- Aggiungi movimenti: entrata e uscita con conto, categoria, data, nota → compaiono in lista con importo e icone giusti.
- Filtri (tipo, conto, categoria), ricerca testo, cambio mese e "Tutti": la lista reagisce correttamente.
- Tap su riga → modale pre-compilata; salvataggio update in tempo reale.
- Trash → conferma ed eliminazione.
- Validi gli errori: importo non valido, conto non selezionato, data malformata.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: movimenti con form, filtri, ricerca, modifica ed eliminazione"
```

---
### Task 9: Home — riassunto (saldi, grafico spese, ultimi movimenti)

**Files:**
- Create: `src/components/AccountCards.js`, `src/components/ExpensePie.js`
- Modify: `src/screens/HomeScreen.js`

**Interfaces:**
- Consumes: task 4, 6, 8 (`TransactionItem`, `TransactionFormModal`, `MonthlyNav`, `OfflineBanner`).
- Produces:
  - `<AccountCards accounts transactions />` card orizzontali scorrevoli con saldo per conto.
  - `<ExpensePie transactions startMs endMs />` grafico a torta donut (react-native-gifted-charts) + legenda con importi e percentuali; se nessuna spesa mostra "Nessuna spesa nel mese".
  - `HomeScreen` completo: selezione mese, totale saldi, entrate/uscite del mese, card conti, grafico, ultimi 10 movimenti del mese con modifica e FAB per aggiungere.

- [ ] **Step 1: Crea src/components/AccountCards.js**

```js
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { accountBalance } from '../utils/finance';
import { formatCurrency } from '../utils/format';

export default function AccountCards({ accounts, transactions }) {
  if (accounts.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {accounts.map((a) => {
        const bal = accountBalance(transactions, a.id);
        return (
          <View key={a.id} style={[styles.card, { borderLeftColor: a.color }]}>
            <Text style={styles.name}>{a.name}</Text>
            <Text style={[styles.balance, { color: bal >= 0 ? '#1B5E20' : '#C62828' }]}>{formatCurrency(bal)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, padding: 16, minWidth: 150 },
  name: { fontSize: 14, color: '#666' },
  balance: { fontSize: 18, fontWeight: '700', marginTop: 4 },
});
```

- [ ] **Step 2: Crea src/components/ExpensePie.js**

```js
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { CATEGORY_MAP } from '../constants/categories';
import { expensesByCategory } from '../utils/finance';
import { formatCurrency } from '../utils/format';

export default function ExpensePie({ transactions, startMs, endMs }) {
  const data = expensesByCategory(transactions, startMs, endMs);
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nessuna spesa nel mese</Text>
      </View>
    );
  }
  const slices = data.map((d) => ({
    value: d.total,
    color: (CATEGORY_MAP[d.category] || CATEGORY_MAP.altro).color,
  }));
  return (
    <View style={styles.wrap}>
      <PieChart data={slices} donut radius={90} innerRadius={55} focusOnPress />
      <View style={styles.legend}>
        {data.map((d) => {
          const cat = CATEGORY_MAP[d.category];
          return (
            <View key={d.category} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: cat.color }]} />
              <Text style={styles.legendLabel}>{cat.label}</Text>
              <Text style={styles.legendValue}>{formatCurrency(d.total)} · {d.percent}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  empty: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#888' },
  legend: { alignSelf: 'stretch', marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14 },
  legendValue: { fontSize: 14, fontWeight: '600' },
});
```

- [ ] **Step 3: Crea HomeScreen completa**

```js
import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { monthRange, totalBalance, sumByKind } from '../utils/finance';
import { formatMonthLabel, formatCurrency } from '../utils/format';
import MonthlyNav from '../components/MonthlyNav';
import AccountCards from '../components/AccountCards';
import ExpensePie from '../components/ExpensePie';
import TransactionItem from '../components/TransactionItem';
import TransactionFormModal from '../components/TransactionFormModal';
import OfflineBanner from '../components/OfflineBanner';

export default function HomeScreen() {
  const { accounts, loading: loadingAccts, error: errorAccts } = useAccounts();
  const { transactions, loading: loadingTxs, error: errorTxs } = useTransactions();
  const [month, setMonth] = useState(() => new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  if (loadingAccts || loadingTxs) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (errorAccts || errorTxs) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore</Text></View>;

  const range = monthRange(month);
  const total = totalBalance(accounts, transactions);
  const income = sumByKind(transactions, 'income', range.startMs, range.endMs);
  const expense = sumByKind(transactions, 'expense', range.startMs, range.endMs);
  const monthTx = transactions
    .filter((t) => t.date >= range.startMs && t.date <= range.endMs)
    .sort((a, b) => b.date - a.date);
  const recent = monthTx.slice(0, 10);

  const prev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <MonthlyNav month={month} label={formatMonthLabel(month)} onPrev={prev} onNext={next} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Totale saldi</Text>
          <Text style={[styles.totalValue, { color: total >= 0 ? '#1B5E20' : '#C62828' }]}>{formatCurrency(total)}</Text>
          <View style={styles.monthSummary}>
            <Text style={styles.sumIn}>Entrate: {formatCurrency(income)}</Text>
            <Text style={styles.sumOut}>Uscite: {formatCurrency(expense)}</Text>
          </View>
        </View>
        <AccountCards accounts={accounts} transactions={transactions} />
        <Text style={styles.sectionTitle}>Spese per categoria · {formatMonthLabel(month)}</Text>
        <ExpensePie transactions={transactions} startMs={range.startMs} endMs={range.endMs} />
        <Text style={styles.sectionTitle}>Ultimi movimenti</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>Nessun movimento in questo mese.</Text>
        ) : (
          recent.map((t) => (
            <TransactionItem key={t.id} transaction={t} onPress={() => { setEditing(t); setModalVisible(true); }} />
          ))
        )}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => { setEditing(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} accounts={accounts} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  errorText: { color: '#C62828' },
  scrollContent: { paddingBottom: 100 },
  totalCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 16 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  monthSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sumIn: { color: '#1B5E20', fontWeight: '600' },
  sumOut: { color: '#C62828', fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 16 },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
```

- [ ] **Step 4: Verifica manuale (Expo Go)**

Expected:
- Totale saldi = somma dei saldi; colore verde/rosso in base al segno; entrate/uscite del mese corrette.
- Card conti scorrevoli con saldi aggiornati in tempo reale.
- Grafico donut con le fette delle spese del mese selezionato; legenda con importi e percentuali; cambiando mese cambiano fetta e legenda; "Nessuna spesa nel mese" se vuoto.
- Ultimi 10 movimenti del mese; tap → modifica funzionante; FAB → nuovo movimento.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: homepage con saldi, grafico spese e ultimi movimenti"
```

---

### Task 10: Rifiniture visive e usabilità

**Files:**
- Modify: `src/components/AccountFormModal.js`, `src/components/TransactionFormModal.js`, `src/screens/AccountsScreen.js`, `src/screens/TransactionsScreen.js`, `src/screens/HomeScreen.js`

**Interfaces:**
- Consumes: le componenti/create delle task precedenti.
- Produces: niente nuove API; ritocchi di stile e comportamento esistenti.

- [ ] **Step 1: Testo bianco sul pulsante Salva dei modali**

Modify `AccountFormModal.js` e `TransactionFormModal.js`: il pulsante "Salva" usa lo stile `btnSave` (sfondo verde) → testo bianco. In `TransactionFormModal` è già `{ color: '#fff' }`; in `AccountFormModal` applica lo stesso pattern al Pressable Salva.

- [ ] **Step 2: Tastiera sopra i modali**

Modify entrambi i modali: avvolgi il contenuto in un `KeyboardAvoidingView` (behavior `padding` su iOS, `undefined` su Android — Android la gestisce da sé) dentro il backdrop, sopra la `ScrollView`.

- [ ] **Step 3: Stato vuoto più chiaro in Home**

Modify `HomeScreen.js`: se `accounts.length === 0` mostra in alto un piccolo invito: "Crea un conto nella tab Conti per iniziare", mantenendo il resto della schermata.

- [ ] **Step 4: Verifica manuale (Expo Go)**

Expected: testi "Salva" leggibili su sfondo verde; la tastiera non copre i campi dei modali; con zero conti la Home mostra l'invito.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "style: rifiniture usabilità modali e stato vuoto Home"
```

---

### Task 11: README e verifica finale

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: istruzioni Firebase della Task 3 (step 5).

- [ ] **Step 1: Crea README.md in italiano**

Contenuto minimo:
- Titolo e breve descrizione.
- Prerequisiti: Node 20+, Expo Go (Google Play) o emulatore Android.
- Setup Firebase: console.firebase.google.com → crea progetto → aggiungi app Web → attiva Cloud Firestore (modalità di produzione) → copia i valori in `firebase/config.js` → pubblica `firestore.rules` nel tab Rules.
- Esecuzione: `npm install`, `npx expo start` → scansiona QR con Expo Go.
- Verifica logica pura: `node scripts/finance.spec.mjs`.
- Nota sui limiti: app personale, regole Firestore aperte, nessun login, dati sincronizzati sul cloud Firebase.

- [ ] **Step 2: Checklist di verifica finale completa**

Su Expo Go (config Firebase compilata):
1. Tab navigabili con icone corrette.
2. Crea 2 conti (es. "Contanti", "Intesa") → saldi 0,00 € e totale 0,00 €.
3. Aggiungi: un'entrata iniziale di 1000 € su "Intesa"; spese in 3 categorie diverse su entrambi i conti nel mese corrente; un movimento fuori dal mese corrente.
4. Home: totale = somma attesa; grafico con 3 fette con percentuali che sommano ~100; "ultimi movimenti" coi movimenti del mese; cambia mese ‹/› e verifica che il grafico e l'elenco seguano la selezione.
5. Movimenti: filtra per tipo, conto, categoria; cerca testo; elimina un movimento (conferma) e verifica che saldi e grafico si aggiornino.
6. Conti: modifica nome/colore; elimina un conto con conferma; verifica totale aggiornato.
7. Modalità aereo ON → banner "Nessuna connessione…" appare; aggiungi un movimento (resta in coda localmente); modalità aereo OFF → banner sparisce e dopo qualche secondo il movimento è sincronizzato.
8. `node scripts/finance.spec.mjs` → passa.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: README con setup Firebase e checklist di verifica"
```