# Trasferimenti tra conti Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sostituire Prelievo/Deposito con trasferimenti liberi tra due conti qualsiasi scelti come conto di partenza e conto di arrivo.

**Architecture:** Si mantiene la stessa forma del documento `{ kind:'transfer', accountId, transferTo, amount, date, note }` e si depreca `direction` (non più scritto, usato solo come fallback per l'etichetta dei documenti storici). Il form mostra due selettori di conto e nessuna scelta di direzione. Il filtro Movimenti considera sia sorgente sia destinazione tramite l'helper puro `matchesAccountFilter`. `accountBalance` resta invariata (già addebita/accredita i due conti).

**Tech Stack:** React Native / Expo SDK 57, RN 0.86.3, React 19.2.3, Firebase Firestore, test puri con `node:assert`.

## Global Constraints

- Nessuna nuova dipendenza: usare solo API già presenti nel progetto.
- Niente commenti aggiunti al codice.
- Test puri in `scripts/finance.spec.mjs`, eseguiti con `node --experimental-detect-module scripts/finance.spec.mjs` → output atteso `Tutti i controlli di finanza/format/categorie passano.`
- Verifica bundle: `npx expo export --platform android` → output atteso `Exported: dist`.
- Commit stile conventional in italiano (`feat:`, `fix:`, `docs:`, `test:`).
- Messaggi utente in italiano.
- Retrocompatibilità: i documenti di trasferimento esistenti con `direction` devono continuare a leggersi correttamente.

---

### Task 1: Helper puro `matchesAccountFilter` + test

**Files:**
- Modify: `src/utils/finance.js` (append in fondo)
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: niente.
- Produces: `matchesAccountFilter(transaction, accountId) -> boolean`. Ritorna `true` se `accountId === 'all'`; altrimenti `true` se `transaction.accountId === accountId` oppure `transaction.transferTo === accountId`. Per i movimenti non-trasferimento `transferTo` è `undefined`, quindi il match avviene solo su `accountId`.

- [ ] **Step 1: Write the failing test**

In `scripts/finance.spec.mjs`, aggiungi `matchesAccountFilter` all'import da `finance.js` (riga 2):

```js
import { monthRange, isInRange, accountBalance, totalBalance, expensesByCategory, sumByKind, sortAccountsByOrder, nextAccountOrder, dragInsertIndex, dragRowOffsets, reorderAt, matchesAccountFilter } from '../src/utils/finance.js';
```

Poi aggiungi questi assert subito prima della riga `console.log('Tutti i controlli ...')` in fondo al file:

```js
const freeTransfer = [{ id: 'f1', accountId: 'c2', transferTo: 'c1', amount: 15, kind: 'transfer', date: d(2026, 9, 8) }];
assert.equal(accountBalance(freeTransfer, 'c1'), 15);
assert.equal(accountBalance(freeTransfer, 'c2'), -15);
assert.equal(totalBalance(accounts, freeTransfer), 0);

const transferTx = { id: 't1', kind: 'transfer', accountId: 'c1', transferTo: 'c2', amount: 50 };
assert.equal(matchesAccountFilter(transferTx, 'all'), true);
assert.equal(matchesAccountFilter(transferTx, 'c1'), true);  // match sorgente
assert.equal(matchesAccountFilter(transferTx, 'c2'), true);  // match destinazione
assert.equal(matchesAccountFilter(transferTx, 'c3'), false); // conto non coinvolto
assert.equal(matchesAccountFilter(txs[0], 'all'), true);
assert.equal(matchesAccountFilter(txs[0], 'c1'), true);
assert.equal(matchesAccountFilter(txs[0], 'c2'), false);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: FAIL con `SyntaxError: The requested module '../src/utils/finance.js' does not provide an export named 'matchesAccountFilter'` (o `TypeError: matchesAccountFilter is not a function`).

- [ ] **Step 3: Write minimal implementation**

In `src/utils/finance.js`, aggiungi in fondo:

```js
export function matchesAccountFilter(transaction, accountId) {
  if (accountId === 'all') return true;
  return transaction.accountId === accountId || transaction.transferTo === accountId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: PASS con output `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 5: Commit**

```bash
git add src/utils/finance.js scripts/finance.spec.mjs
git commit -m "test: helper matchesAccountFilter e saldi trasferimento tra conti qualsiasi"
```

---

### Task 2: Form trasferimento con conto di partenza e conto di arrivo

**Files:**
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: `accounts` prop (array di `{ id, name, type, ... }`).
- Produces: i nuovi trasferimenti vengono salvati come `{ kind: 'transfer', accountId, transferTo, amount, date, note }`, senza `direction`. In modifica restano aggiornati solo `amount`, `date`, `note`.

- [ ] **Step 1: Aggiorna stato e `syncState`**

In `src/components/TransactionFormModal.js`, sostituisci il blocco di stato (righe 25-33):

Vecchio:
```js
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [direction, setDirection] = useState('prelievo');
  const [cashAccountId, setCashAccountId] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
```

Nuovo:
```js
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [transferTo, setTransferTo] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
```

Sostituisci il corpo di `syncState` (righe 36-46):

Vecchio:
```js
  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setDirection(initial && initial.direction ? initial.direction : 'prelievo');
    setCategory(initial ? initial.category : CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setCashAccountId(initial && initial.kind === 'transfer' ? (initial.direction === 'deposito' ? initial.accountId : initial.transferTo) : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };
```

Nuovo:
```js
  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setCategory(initial ? initial.category : CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setTransferTo(initial && initial.kind === 'transfer' ? initial.transferTo : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };
```

- [ ] **Step 2: Riscrivi `save`**

Sostituisci l'intera funzione `save` (righe 65-114):

Vecchio:
```js
  const save = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!(value > 0)) { setError('Inserisci un importo valido'); return; }
    if (!accountId) { setError('Seleziona un conto'); return; }
    const tsMs = parseDate(date);
    if (tsMs == null) { setError('Data non valida (usare GG/MM/AAAA)'); return; }
    if (kind === 'transfer') {
      try {
        if (isEdit) {
          await updateDoc(doc(db, 'transactions', initial.id), { amount: value, date: tsMs, note: note.trim() });
        } else {
          let cashAcct = accounts.find((a) => a.id === cashAccountId);
          if (!cashAcct) {
            const ref = await addDoc(collection(db, 'accounts'), {
              name: 'Contanti',
              type: 'contanti',
              color: '#757575',
              initialBalance: 0,
              createdAt: Date.now(),
            });
            cashAcct = { id: ref.id };
          }
          await addDoc(collection(db, 'transactions'), {
            kind: 'transfer',
            direction,
            accountId: direction === 'prelievo' ? accountId : cashAcct.id,
            transferTo: direction === 'prelievo' ? cashAcct.id : accountId,
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
```

Nuovo:
```js
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
```

- [ ] **Step 3: Aggiorna il selettore tipo e rimuovi il selettore direzione**

Sostituisci il `Segmented` del tipo (righe 122-126) e rimuovi del tutto il `Segmented` Prelievo/Deposito (righe 127-133).

Vecchio:
```jsx
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }, { value: 'transfer', label: 'Prelievo/Deposito' }]}
            value={kind}
            onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); const firstCash = accounts.find((a) => a.type === 'contanti'); setCashAccountId(firstCash ? firstCash.id : null); } }}
          />
          {kind === 'transfer' && !isEdit ? (
            <Segmented
              options={[{ value: 'prelievo', label: 'Prelievo' }, { value: 'deposito', label: 'Deposito' }]}
              value={direction}
              onChange={setDirection}
            />
          ) : null}
```

Nuovo:
```jsx
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }, { value: 'transfer', label: 'Trasferimento' }]}
            value={kind}
            onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); setTransferTo(null); } }}
          />
```

- [ ] **Step 4: Aggiorna la sezione readonly in modifica**

Sostituisci il blocco readonly (righe 158-170):

Vecchio:
```jsx
          {kind === 'transfer' && isEdit ? (
            (() => {
              const src = accounts.find((a) => a.id === initial.accountId);
              const dst = accounts.find((a) => a.id === initial.transferTo);
              return (
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>
                    {(src ? src.name : 'Conto')} → {(dst ? dst.name : 'Conto')} · {initial.direction === 'deposito' ? 'Deposito' : 'Prelievo'}
                  </Text>
                  <Text style={styles.readonlyHint}>Direzione e conti non modificabili in modifica.</Text>
                </View>
              );
            })()
          ) : (
```

Nuovo:
```jsx
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
```

- [ ] **Step 5: Sostituisci i due selettori di conto**

Sostituisci il blocco dei `chipRow` (righe 172-188):

Vecchio:
```jsx
            <>
              {chipRow({
                label: kind === 'transfer' ? (direction === 'deposito' ? 'Conto in cui depositare' : 'Conto da cui prelevare') : 'Conto',
                list: kind === 'transfer' ? accounts.filter((a) => a.type !== 'contanti') : accounts,
                value: accountId,
                onChange: setAccountId,
                emptyMsg: kind === 'transfer' ? 'Nessun conto non-contanti disponibile: crea prima un conto.' : 'Nessun conto: crea prima un conto.',
              })}
              {kind === 'transfer' ? chipRow({
                label: direction === 'deposito' ? 'Contanti da cui prelevare' : 'Contanti in cui depositare',
                list: accounts.filter((a) => a.type === 'contanti'),
                value: cashAccountId,
                onChange: setCashAccountId,
                emptyMsg: 'Nessun conto Contanti: verrà creato automaticamente.',
              }) : null}
            </>
```

Nuovo:
```jsx
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
```

- [ ] **Step 6: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

Run: `npx expo export --platform android`
Expected: `Exported: dist`

Verifica manuale su device/emulatore (nuovo movimento):
- scegliendo `Trasferimento` non compare più la scelta Prelievo/Deposito;
- i due selettori si chiamano `Conto di partenza` e `Conto di arrivo`;
- il conto scelto in un selettore sparisce dall'altro;
- salvando senza note il movimento appare grigio con sottotitolo `Sorgente → Destinazione · data`;
- modificando un trasferimento esistente i conti sono in sola lettura e nessuna scritta Prelievo/Deposito compare.

- [ ] **Step 7: Commit**

```bash
git add src/components/TransactionFormModal.js
git commit -m "feat: trasferimenti liberi tra conto di partenza e conto di arrivo"
```

---

### Task 3: Etichetta trasferimento e filtro per conto

**Files:**
- Modify: `src/components/TransactionItem.js:22-25`
- Modify: `src/screens/TransactionsScreen.js:9,40`

**Interfaces:**
- Consumes: `matchesAccountFilter(transaction, accountId) -> boolean` da Task 1; documenti trasferimento `{ kind:'transfer', accountId, transferTo, ... }` (con o senza `direction`) da Task 2.
- Produces: nessuna nuova interfaccia pubblica.

- [ ] **Step 1: Aggiorna l'etichetta di default in `TransactionItem.js`**

Vecchio (righe 21-25):
```jsx
          <Text style={styles.desc}>
            {isTransfer
              ? transaction.note || (transaction.direction === 'deposito' ? 'Deposito contanti' : 'Prelievo contanti')
              : transaction.note || cat.label}
          </Text>
```

Nuovo:
```jsx
          <Text style={styles.desc}>
            {isTransfer
              ? transaction.note || (transaction.direction ? (transaction.direction === 'deposito' ? 'Deposito' : 'Prelievo') : 'Trasferimento')
              : transaction.note || cat.label}
          </Text>
```

- [ ] **Step 2: Usa l'helper nel filtro di `TransactionsScreen.js`**

Riga 9, vecchio:
```js
import { monthRange, isInRange } from '../utils/finance';
```
Nuovo:
```js
import { monthRange, isInRange, matchesAccountFilter } from '../utils/finance';
```

Riga 40, vecchio:
```js
        if (accountId !== 'all' && t.accountId !== accountId) return false;
```
Nuovo:
```js
        if (!matchesAccountFilter(t, accountId)) return false;
```

- [ ] **Step 3: Verifica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

Run: `npx expo export --platform android`
Expected: `Exported: dist`

Verifica manuale su device/emulatore:
- filtrando Movimenti per il conto di partenza il trasferimento compare;
- filtrando per il conto di arrivo il trasferimento compare;
- un trasferimento storico senza nota mostra ancora `Prelievo`/`Deposito`; uno nuovo mostra `Trasferimento`;
- un movimento di entrata/uscita non compare sotto un conto non associato.

- [ ] **Step 4: Commit**

```bash
git add src/components/TransactionItem.js src/screens/TransactionsScreen.js
git commit -m "feat: trasferimento visibile sotto entrambi i conti e etichetta generica"
```

---

## Note di self-review

- Copertura spec: modello dati (Task 2 + retrocompatibilità Task 3), form a due selettori (Task 2), visualizzazione grigia ed etichetta (Task 3), filtro su sorgente/destinazione (Task 1 helper + Task 3), saldi invariati (Task 1 test), validazioni (Task 2), test (Task 1).
- Nessun placeholder; nomi usati in modo coerente (`transferTo`, `matchesAccountFilter`).
- Le verifiche manuali restano a carico di un umano su device; export e test automatici coprono la parte statica.
