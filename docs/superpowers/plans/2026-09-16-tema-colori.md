# Budget Lab — Tema colori centralizzato "Indaco": Piano di implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire tutti i colori hardcoded con una palette centralizzata e applicare il tema indaco `#4F46E5`.

**Architecture:** Creare `src/theme/colors.js` come unica fonte dei colori e aggiornare gli 11 file che usano colori hardcoded per importare e applicare le costanti definite.

**Tech Stack:** React Native (Expo), JavaScript.

## Global Constraints

- Le icone dei numeri di categoria (`src/constants/categories.js`) NON cambiano.
- Nessun cambiamento di comportamento o logica.
- Nessuna aggiunta di dipendenze.
- Le regole di verificatione (spec script + export) devono superare alla fine.
- Questo piano non tocca: `package.json`, `app.json`, `firestore.rules`, test, Keystore, icone App.

---

## File Map (creati/modificati)

| File                            | Azione     | Risponsabilità                                             |
|---------------------------------|------------|------------------------------------------------------------|
| `src/theme/colors.js`           | **CREA**   | Esporta la costante `colors` con tutta la palette.         |
| `src/navigation/AppNavigator.js`| modifica   | Importa colori per `tabBarActiveTintColor`.                |
| `src/screens/HomeScreen.js`     | modifica   | Totali, FAB, sfondi.                                       |
| `src/screens/TransactionsScreen.js`| modifica| FAB, undoAll, sfondi.                                      |
| `src/screens/AccountsScreen.js` | modifica   | Saldi, totale, FAB aggiungi, icone cestino.                |
| `src/components/AccountFormModal.js`| modifica| COLORS pallini, chip attivo, pulsante Salva, bordi.        |
| `src/components/AccountCards.js`| modifica   | Colore saldo card conti.                                   |
| `src/components/MonthlyNav.js` | modifica   | Chevrons e chip "Tutti" attivo.                            |
| `src/components/Segmented.js`   | modifica   | Chip attivo.                                               |
| `src/components/TransactionItem.js`| modifica| Colore importo, cestino.                                   |
| `src/components/TransactionFormModal.js`| modifica| Chip attivo, Salva, errore, bordi input.            |
| `src/components/OfflineBanner.js`| modifica  | Sfondo e testo banner.                                     |

---

### Step 1: Creare la palette

Crea `src/theme/colors.js`:

```js
export const colors = {
  primary:     '#4F46E5',
  positive:    '#4F46E5',
  negative:    '#C62828',
  background:  '#F5F5F5',
  surface:     '#FFFFFF',
  text:        '#333333',
  textMuted:   '#888888',
  offlineBg:   '#FFECB3',
  offlineText: '#6D4C00',
  border:      '#CCC',
  white:       '#FFFFFF',
};
```

---

### Step 2: Aggiorna `src/navigation/AppNavigator.js`

1. Aggiungi dopo gli import esistenti:
   ```js
   import { colors } from '../theme/colors';
   ```
2. Sostituisci:
   ```diff
   -          tabBarActiveTintColor: '#1B5E20',
   +          tabBarActiveTintColor: colors.primary,
   ```

---

### Step 3: Aggiorna `src/screens/HomeScreen.js`

1. Aggiungi import:
   ```js
   import { colors } from '../theme/colors';
   ```
2. Inline (riga 47):
   ```diff
   -            <Text style={[styles.totalValue, { color: total >= 0 ? '#1B5E20' : '#C62828' }]}>
   +            <Text style={[styles.totalValue, { color: total >= 0 ? colors.positive : colors.negative }]}>
   ```
3. Styles:
   ```diff
   -  container: { flex: 1, backgroundColor: '#F5F5F5' },
   -  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
   -  errorText: { color: '#C62828' },
   -  sumIn: { color: '#1B5E20', fontWeight: '600' },
   -  sumOut: { color: '#C62828', fontWeight: '600' },
   -  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', elevation: 4 },
   +  container: { flex: 1, backgroundColor: colors.background },
   +  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
   +  errorText: { color: colors.negative },
   +  sumIn: { color: colors.positive, fontWeight: '600' },
   +  sumOut: { color: colors.negative, fontWeight: '600' },
   +  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
   ```

---

### Step 4: Aggiorna `src/screens/TransactionsScreen.js`

1. Import `{ colors } from '../theme/colors'`.
2. Styles:
   ```diff
   -  container: { flex: 1, backgroundColor: '#F5F5F5' },
   -  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
   -  errorText: { color: '#C62828' },
   -  undoAll: { color: '#1B5E20', textAlign: 'center', marginBottom: 6, fontWeight: '600' },
   -  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', elevation: 4 },
   +  container: { flex: 1, backgroundColor: colors.background },
   +  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
   +  errorText: { color: colors.negative },
   +  undoAll: { color: colors.primary, textAlign: 'center', marginBottom: 6, fontWeight: '600' },
   +  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
   ```

---

### Step 5: Aggiorna `src/screens/AccountsScreen.js`

1. Import `{ colors } from '../theme/colors'`.
2. Inline totale (riga 39):
   ```diff
   -          <Text style={[styles.totalValue, { color: total >= 0 ? '#1B5E20' : '#C62828' }]}>
   +          <Text style={[styles.totalValue, { color: total >= 0 ? colors.positive : colors.negative }]}>
   ```
3. Inline cestino (riga 54):
   ```diff
   -                <Ionicons name="trash-outline" size={20} color="#C62828" />
   +                <Ionicons name="trash-outline" size={20} color={colors.negative} />
   ```
4. Inline saldo conto (riga 56):
   ```diff
   -              <Text style={[styles.cardBalance, { color: bal >= 0 ? '#1B5E20' : '#C62828' }]}>
   +              <Text style={[styles.cardBalance, { color: bal >= 0 ? colors.positive : colors.negative }]}>
   ```
5. Styles:
   ```diff
   -  container: { flex: 1, backgroundColor: '#F5F5F5' },
   -  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
   -  errorText: { color: '#C62828' },
   -  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B5E20', margin: 16, padding: 14, borderRadius: 12, gap: 6 },
   +  container: { flex: 1, backgroundColor: colors.background },
   +  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
   +  errorText: { color: colors.negative },
   +  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, margin: 16, padding: 14, borderRadius: 12, gap: 6 },
   ```

---

### Step 6: Aggiorna `src/components/AccountFormModal.js`

1. Import `{ colors } from '../theme/colors'`.
2. Sostituisci la palette colori:
   ```diff
   -const COLORS = ['#1B5E20', '#1565C0', '#6A1B9A', '#AD1457', '#E65100', '#37474F'];
   +const COLORS = ['#4F46E5', '#2563EB', '#7C3AED', '#9333EA', '#0EA5E9', '#37474F'];
   ```
3. Styles:
   ```diff
   -  typeChipActive: { backgroundColor: '#1B5E20' },
   -  error: { color: '#C62828', marginBottom: 10 },
   -  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 12 },
   -  btnSave: { backgroundColor: '#1B5E20' },
   +  typeChipActive: { backgroundColor: colors.primary },
   +  error: { color: colors.negative, marginBottom: 10 },
   +  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 12 },
   +  btnSave: { backgroundColor: colors.primary },
   ```

---

### Step 7: Aggiorna `src/components/AccountCards.js`

1. Import `{ colors } from '../theme/colors'`.
2. Inline (riga 14):
   ```diff
   -            <Text style={[styles.balance, { color: bal >= 0 ? '#1B5E20' : '#C62828' }]}>
   +            <Text style={[styles.balance, { color: bal >= 0 ? colors.positive : colors.negative }]}>
   ```

---

### Step 8: Aggiorna `src/components/MonthlyNav.js`

1. Import `{ colors } from '../theme/colors'`.
2. JSX:
   ```diff
   -        <Ionicons name="chevron-back" size={22} color="#1B5E20" />
   +        <Ionicons name="chevron-back" size={22} color={colors.primary} />
   ```
   ```diff
   -        <Ionicons name="chevron-forward" size={22} color="#1B5E20" />
   +        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
   ```
3. Styles:
   ```diff
   -  allChipActive: { backgroundColor: '#1B5E20' },
   -  allText: { color: '#333' },
   +  allChipActive: { backgroundColor: colors.primary },
   +  allText: { color: colors.text },
   ```

---

### Step 9: Aggiorna `src/components/Segmented.js`

1. Import `{ colors } from '../theme/colors'`.
2. Styles:
   ```diff
   -  chipActive: { backgroundColor: '#1B5E20' },
   -  chipText: { color: '#333' },
   +  chipActive: { backgroundColor: colors.primary },
   +  chipText: { color: colors.text },
   ```

---

### Step 10: Aggiorna `src/components/TransactionItem.js`

1. Import `{ colors } from '../theme/colors'`.
2. Inline amount (riga 20):
   ```diff
   -        <Text style={[styles.amount, { color: income ? '#1B5E20' : '#C62828' }]}>
   +        <Text style={[styles.amount, { color: income ? colors.positive : colors.negative }]}>
   ```
3. Inline cestino (riga 24):
   ```diff
   -          <Ionicons name="trash-outline" size={18} color="#C62828" />
   +          <Ionicons name="trash-outline" size={18} color={colors.negative} />
   ```
4. Styles:
   ```diff
   -  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
   -  sub: { fontSize: 12, color: '#888', marginTop: 2 },
   +  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
   +  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
   ```

---

### Step 11: Aggiorna `src/components/TransactionFormModal.js`

1. Import `{ colors } from '../theme/colors'`.
2. Styles:
   ```diff
   -  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10 },
   -  chipActive: { backgroundColor: '#1B5E20' },
   -  error: { color: '#C62828', marginBottom: 10 },
   -  btnSave: { backgroundColor: '#1B5E20' },
   +  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
   +  chipActive: { backgroundColor: colors.primary },
   +  error: { color: colors.negative, marginBottom: 10 },
   +  btnSave: { backgroundColor: colors.primary },
   ```

---

### Step 12: Aggiorna `src/components/OfflineBanner.js`

1. Import `{ colors } from '../theme/colors'`.
2. Styles:
   ```diff
   -  banner: { backgroundColor: '#FFECB3', paddingVertical: 8, paddingHorizontal: 12 },
   -  text: { color: '#6D4C00', textAlign: 'center', fontSize: 13 },
   +  banner: { backgroundColor: colors.offlineBg, paddingVertical: 8, paddingHorizontal: 12 },
   +  text: { color: colors.offlineText, textAlign: 'center', fontSize: 13 },
   ```

---

### Step 13: Verifica

1. Esegui: `node --experimental-detect-module scripts/finance.spec.mjs` → deve uscire "Tutti i controlli di finanza/format/categorie passano."
2. Esegui: `npx expo export --platform android` → deve completare senza errori.

---

### Step 14: Commit

```bash
git add src/theme/colors.js src/navigation/AppNavigator.js src/screens/HomeScreen.js \
  src/screens/TransactionsScreen.js src/screens/AccountsScreen.js \
  src/components/AccountFormModal.js src/components/AccountCards.js \
  src/components/MonthlyNav.js src/components/Segmented.js \
  src/components/TransactionItem.js src/components/TransactionFormModal.js \
  src/components/OfflineBanner.js

git commit -m "refactor: tema colori indaco centralizzato"
```