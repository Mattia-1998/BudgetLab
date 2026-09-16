# Prelievo/Deposito e categoria Stipendio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere la terza tipologia di movimento "Prelievo/Deposito" (trasferimento a singolo documento con controparte Contanti auto-creata) e la categoria di entrata "Stipendio".

**Architecture:** Nuovo `kind: 'transfer'` nei documenti `transactions` con `direction`, `accountId` (sorgente) e `transferTo` (destinazione). `accountBalance` in `src/utils/finance.js` gestisce entrambe le parti (uscita dal sorgente, arrivo alla destinazione) così il totale saldi resta corretto senza modificare `totalBalance`. L'UI espone la terza tipologia nel form e nella lista.

**Tech Stack:** Expo/React Native (JavaScript), Firestore (Firebase web SDK), test in `scripts/finance.spec.mjs` (node:assert).

## Global Constraints

- Trasferimento = **un solo documento**: `{ kind: 'transfer', direction: 'prelievo'|'deposito', accountId (sorgente), transferTo (destinazione), amount ≥ 0, date (ms), note? }`. Mai `accountId === transferTo`. Nessun campo `category` sui trasferimenti.
- Semantica: **prelievo** = conto selezionato (`accountId`) → Contanti (`transferTo`); **deposito** = Contanti (`accountId`) → conto selezionato (`transferTo`).
- Contanti automatico: se non esiste un conto `type === 'contanti'`, crearlo al salvataggio (sia prelievo sia deposito) con `{ name: 'Contanti', type: 'contanti', color: '#757575', initialBalance: 0, createdAt: Date.now() }`. Se ne esistono più di uno, usare il primo (`accounts.find`).
- Modifica trasferimento: aggiornare **solo** `amount`, `date`, `note`; `direction`, `accountId`, `transferTo` restano fissi.
- Visualizzazione lista trasferimento: importo con `-` prefisso e colore **grigio `#9CA3AF`**, icona neutra `swap-horizontal-outline` (container `#F3F4F6`), descrizione `note || ('Prelievo contanti' | 'Deposito contanti')`, sottotitolo `"{sorgente} → {destinazione} · {data}"`.
- Filtri movimenti: pill `Tutte / Entrate / Uscite / Trasferimenti` (valori `all / income / expense / transfer`). Con `kind === 'transfer'` la sezione **Conto** resta, la sezione **Categoria è nascosta**. La ricerca matcha i trasferimenti per nota.
- Categoria Stipendio: `{ key: 'stipendio', label: 'Stipendio', icon: 'cash-outline', color: '#00838F' }` inserita in `src/constants/categories.js` prima di `altro`. Conteggio categorie: **11**.
- `finance.js`: `accountBalance` attribuisce `signedAmount(t)` quando `t.accountId === accountId` (per `transfer` vale `-amount`) e `+t.amount` quando `t.kind === 'transfer' && t.transferTo === accountId`. `expensesByCategory` e `sumByKind` NON cambiano (già filtrate per kind) — i trasferimenti non compaiono nel grafico spese né nei riepiloghi entrate/uscite.
- Verifica finale: `node --experimental-detect-module scripts/finance.spec.mjs` → "Tutti i controlli di finanza/format/categorie passano."; `npx expo export --platform android` → "Exported: dist".
- Nessuna nuova dipendenza, nessun `git push`. I warning Node (`MODULE_TYPELESS_PACKAGE_JSON`, `NativeCommandError` di PowerShell, Node v20.18.0) sono rumore non bloccante. Ambiente Windows/PowerShell; repo normale su `main`.

---

### Task 1: Categoria Stipendio

**Files:**
- Modify: `src/constants/categories.js`
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: struttura attuale di `CATEGORIES` (oggetti `{ key, label, icon, color }`).
- Produces: `CATEGORIES` con 11 voci; `CATEGORY_MAP.stipendio` usabile dal form e dai filtri nei task successivi.

- [ ] **Step 1: Aggiornare l'assert del conteggio (test rosso)**

In `scripts/finance.spec.mjs`, sostituire:
```js
assert.equal(CATEGORIES.length, 10);
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
```
con:
```js
assert.equal(CATEGORIES.length, 11);
assert.equal(CATEGORY_MAP.stipendio.label, 'Stipendio');
assert.equal(CATEGORY_MAP.stipendio.icon, 'cash-outline');
assert.equal(CATEGORY_MAP.stipendio.color, '#00838F');
assert.equal(CATEGORY_MAP.cibo.label, 'Cibo');
```

- [ ] **Step 2: Eseguire il test per verificare che fallisca**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `AssertionError [ERR_ASSERTION]: 10 == 11` (il processo esce diverso da 0). Il warning Node è atteso, non bloccante.

- [ ] **Step 3: Aggiungere la categoria**

In `src/constants/categories.js`, inserire subito prima dell'elemento `altro`:
```js
  { key: 'stipendio', label: 'Stipendio', icon: 'cash-outline', color: '#00838F' },
```

- [ ] **Step 4: Eseguire il test per verificare che passi**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: stampa `Tutti i controlli di finanza/format/categorie passano.` e uscita 0.

- [ ] **Step 5: Commit**

```bash
git add src/constants/categories.js scripts/finance.spec.mjs
git commit -m "feat: categoria stipendio"
```

---

### Task 2: Logica trasferimenti nei saldi

**Files:**
- Modify: `src/utils/finance.js`
- Test: `scripts/finance.spec.mjs`

**Interfaces:**
- Consumes: `accountBalance`, `totalBalance`, `expensesByCategory`, `sumByKind` esistenti.
- Produces: `accountBalance` esteso che gestisce `kind === 'transfer'` (uscita dal `accountId`, entrata nel `transferTo`). `totalBalance` invariato ma corretto per i trasferimenti. Sotto-forma documentata nel test: `{ id, accountId, transferTo, amount, kind: 'transfer', direction, date }`.

- [ ] **Step 1: Scrivere i test (rossi)**

In `scripts/finance.spec.mjs`, dopo le assertion `sumByKind` (riga 34) aggiungere un blocco trasferimenti. Le fixture esistenti: `txs` (c1: +100 ok, −30 cibo, −10 trasporti → saldo 60; c2: −20 → saldo −20), `accounts` (c1 'Conto', c2 'Contanti'):
```js
const prelievo = [
  { id: 'p1', accountId: 'c1', transferTo: 'c2', amount: 50, kind: 'transfer', direction: 'prelievo', date: d(2026, 9, 8) },
];
assert.equal(accountBalance([...txs, ...prelievo], 'c1'), 10);   // 60 - 50
assert.equal(accountBalance([...txs, ...prelievo], 'c2'), 30);   // -20 + 50
assert.equal(totalBalance(accounts, [...txs, ...prelievo]), 40); // totale invariato

const deposito = [
  { id: 'd1', accountId: 'c2', transferTo: 'c1', amount: 25, kind: 'transfer', direction: 'deposito', date: d(2026, 9, 8) },
];
assert.equal(accountBalance([...txs, ...deposito], 'c1'), 85);   // 60 + 25
assert.equal(accountBalance([...txs, ...deposito], 'c2'), -45);  // -20 - 25
assert.equal(totalBalance(accounts, [...txs, ...deposito]), 40); // totale invariato

const all = [...txs, ...prelievo, ...deposito];
const catsAll = expensesByCategory(all, startMs, endMs).reduce((s, i) => s + i.total, 0);
assert.equal(catsAll, 60); // i trasferimenti non compaiono come spese
assert.equal(sumByKind(all, 'income', startMs, endMs), 100);
assert.equal(sumByKind(all, 'expense', startMs, endMs), 60);
```

- [ ] **Step 2: Eseguire i test per verificare che falliscano**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `AssertionError` (attualmente `accountBalance` non conosce `transferTo`, quindi `c2` non riceve il credito). Warning Node atteso.

- [ ] **Step 3: Implementare in `accountBalance`**

In `src/utils/finance.js`, sostituire `accountBalance` con:
```js
export function accountBalance(transactions, accountId, initialBalance = 0) {
  const sum = transactions.reduce((sum, t) => {
    if (t.accountId === accountId) return sum + signedAmount(t);
    if (t.kind === 'transfer' && t.transferTo === accountId) return sum + t.amount;
    return sum;
  }, 0);
  return sum + (initialBalance || 0);
}
```
Non toccare `signedAmount` (per `transfer` l'else `-t.amount` è già corretto), né le altre funzioni.

- [ ] **Step 4: Eseguire i test per verificare che passino**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.` e uscita 0.

- [ ] **Step 5: Commit**

```bash
git add src/utils/finance.js scripts/finance.spec.mjs
git commit -m "feat: saldi gestiscono i trasferimenti prelievo/deposito"
```

---

### Task 3: Visualizzazione trasferimenti in lista + filtro

**Files:**
- Modify: `src/components/TransactionItem.js`
- Modify: `src/screens/TransactionsScreen.js`
- Modify: `src/screens/HomeScreen.js`

**Interfaces:**
- Consumes: documento trasferimento (Task 2): `kind`, `direction`, `accountId`, `transferTo`, `amount`, `date`, `note`.
- Produces: `TransactionItem` accetta nuova prop opzionale `accountById` (oggetto `{ [id]: account }`) per risolvere i nomi nel sottotitolo. Lo stato `kind` di `TransactionsScreen` esteso al valore `'all' | 'income' | 'expense' | 'transfer'`.

- [ ] **Step 1: Aggiornare `TransactionItem`**

In `src/components/TransactionItem.js`:
1. Firmare la prop: `export default function TransactionItem({ transaction, onPress, onDelete, accountById })`.
2. Dopo `const income = ...` aggiungere:
```js
  const isTransfer = transaction.kind === 'transfer';
  const amount = isTransfer ? '-'.concat(formatCurrency(transaction.amount)) : (income ? '+' : '-') + formatCurrency(transaction.amount);
  const srcName = accountById && accountById[transaction.accountId] ? accountById[transaction.accountId].name : 'Conto';
  const dstName = accountById && accountById[transaction.transferTo] ? accountById[transaction.transferTo].name : 'Conto';
```
3. Icona (sostituire il blocco `iconWrap`):
```jsx
        <View style={[styles.iconWrap, { backgroundColor: isTransfer ? '#F3F4F6' : cat.color + '22' }]}>
          <Ionicons name={isTransfer ? 'swap-horizontal-outline' : cat.icon} size={20} color={isTransfer ? '#9CA3AF' : cat.color} />
        </View>
```
4. Descrizione e sottotitolo:
```jsx
          <Text style={styles.desc}>
            {isTransfer
              ? transaction.note || (transaction.direction === 'deposito' ? 'Deposito contanti' : 'Prelievo contanti')
              : transaction.note || cat.label}
          </Text>
          <Text style={styles.sub}>
            {isTransfer
              ? `${srcName} → ${dstName} · ${formatDate(transaction.date)}`
              : `${cat.label} · ${formatDate(transaction.date)}`}
          </Text>
```
5. Importo:
```jsx
        <Text style={[styles.amount, { color: isTransfer ? '#9CA3AF' : (income ? colors.positive : colors.negative) }]}>{amount}</Text>
```

- [ ] **Step 2: Aggiornare il filtro in `TransactionsScreen`**

In `src/screens/TransactionsScreen.js`:
1. Nella `filterRow`, sostituire la lista `map` con:
```jsx
              {[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }, { value: 'transfer', label: 'Trasferimenti' }].map((opt) => (
```
2. Nascondere la sezione Categoria quando è attivo il filtro trasferimenti, avvolgendo il blocco `<View style={styles.section}> ... Categoria ... </View>` con:
```jsx
              {kind !== 'transfer' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Categoria</Text>
                  ... (griglia esistente invariata) ...
                </View>
              ) : null}
```
3. Prima del `return` (dopo `const tileWidth = ...`) aggiungere:
```js
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));
```
4. Nel `renderItem` passare la nuova prop:
```jsx
          <TransactionItem
            transaction={item}
            onPress={() => { setEditing(item); setModalVisible(true); }}
            onDelete={() => confirmDelete(item)}
            accountById={accountMap}
          />
```

- [ ] **Step 3: Aggiornare `HomeScreen`**

In `src/screens/HomeScreen.js`, nel `recent.map` passare la prop:
```jsx
            <TransactionItem key={t.id} transaction={t} onPress={() => { setEditing(t); setModalVisible(true); }} accountById={Object.fromEntries(accounts.map((a) => [a.id, a]))} />
```
(La prop di default è `undefined` dove manca → sottotitolo usa `'Conto'` fallback; nessun crash.)

- [ ] **Step 4: Verificare che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist` (bundling OK). Warning Node v20.18.0 atteso.

- [ ] **Step 5: Commit**

```bash
git add src/components/TransactionItem.js src/screens/TransactionsScreen.js src/screens/HomeScreen.js
git commit -m "feat: lista e filtro trasferimenti (grigio neutro, pill Trasferimenti)"
```

---

### Task 4: Form movimento con Prelievo/Deposito e contanti automatico

**Files:**
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: `accounts` (prop esistente, oggetti `{ id, name, type, color, initialBalance }`), `CATEGORIES` (Task 1), `addDoc`/`collection`/`updateDoc`/`doc` (già importati), `db`.
- Produces: crea trasferimenti con il modello del Task 2 e, se serve, il conto Contanti `{ name: 'Contanti', type: 'contanti', color: '#757575', initialBalance: 0, createdAt: Date.now() }`. In modifica conserva `direction`/`accountId`/`transferTo` originali.

- [ ] **Step 1: Stato e sincronizzazione**

In `src/components/TransactionFormModal.js`:
1. Aggiungere lo stato dopo `const [kind, setKind] = ...`:
```js
  const [direction, setDirection] = useState('prelievo');
```
2. In `syncState`, dopo `setKind(...)` aggiungere:
```js
    setDirection(initial && initial.direction ? initial.direction : 'prelievo');
```

- [ ] **Step 2: Terza tipologia e toggle direzione**

Nel JSX, sostituire il `<Segmented ... />` della tipologia (righe ~67-71) con:
```jsx
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }, { value: 'transfer', label: 'Prelievo/Deposito' }]}
            value={kind}
            onChange={setKind}
          />
```
Subito dopo, aggiungere il toggle di direzione visibile solo per i trasferimenti:
```jsx
          {kind === 'transfer' && !isEdit ? (
            <Segmented
              options={[{ value: 'prelievo', label: 'Prelievo' }, { value: 'deposito', label: 'Deposito' }]}
              value={direction}
              onChange={setDirection}
            />
          ) : null}
```

- [ ] **Step 3: Nascondere Categoria per i trasferimenti**

Avvolgere il blocco Categoria (dal `<Text style={styles.fieldLabel}>Categoria</Text>` fino alla chiusura del `catGrid`) in:
```jsx
          {kind !== 'transfer' ? (
            <>
              <Text style={styles.fieldLabel}>Categoria</Text>
              ... (griglia esistente invariata) ...
            </>
          ) : null}
```

- [ ] **Step 4: Selettore conto con logica per i trasferimenti**

Sostituire l'intero blocco `Conto` (dal `<Text style={styles.fieldLabel}>Conto</Text>` fino alla chiusura del contenitore `acctRow`, inclusi i `warn`) con:
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
            <View>
              <Text style={styles.fieldLabel}>
                {kind === 'transfer' ? (direction === 'deposito' ? 'Conto in cui depositare' : 'Conto da cui prelevare') : 'Conto'}
              </Text>
              <View style={styles.acctRow}>
                {(kind === 'transfer' ? accounts.filter((a) => a.type !== 'contanti') : accounts).map((a) => {
                  const active = accountId === a.id;
                  return (
                    <Pressable key={a.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setAccountId(a.id)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
                    </Pressable>
                  );
                })}
                {(kind === 'transfer' ? accounts.filter((a) => a.type !== 'contanti').length : accounts.length) === 0 ? (
                  <Text style={styles.warn}>{kind === 'transfer' ? 'Nessun conto non-contanti disponibile: crea prima un conto.' : 'Nessun conto: crea prima un conto.'}</Text>
                ) : null}
              </View>
              {kind === 'transfer' ? (
                <Text style={styles.hint}>Il conto Contanti viene usato (o creato automaticamente) come controparte.</Text>
              ) : null}
            </View>
          )}
```

- [ ] **Step 5: Salvataggio trasferimenti + contanti automatico**

In `save()`, subito dopo la validazione della data (`if (tsMs == null) { ... }`) e prima della riga `const data = { accountId, ... }`, inserire:
```js
    if (kind === 'transfer') {
      try {
        if (isEdit) {
          await updateDoc(doc(db, 'transactions', initial.id), { amount: value, date: tsMs, note: note.trim() });
        } else {
          let cashAcct = accounts.find((a) => a.type === 'contanti');
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
```
(Nota: il blocco `try/catch` esistente per i tipi normali non deve essere toccato; questo blocco fa `return` prima.)

- [ ] **Step 6: Stili aggiuntivi**

In `StyleSheet.create`, aggiungere:
```js
  hint: { fontSize: 12, color: '#555', marginBottom: 10 },
  readonlyBox: { borderWidth: 1, borderColor: colors.chipBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB' },
  readonlyText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  readonlyHint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
```

- [ ] **Step 7: Verificare che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`. Warning Node v20.18.0 atteso.

- [ ] **Step 8: Commit**

```bash
git add src/components/TransactionFormModal.js
git commit -m "feat: trasferimento prelievo/deposito nel form con contanti automatico"
```

---

### Task 5: Verifica finale

**Files:**
- (nessuna modifica — eseguita dal controller)

- [ ] **Step 1: Test logica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.` (uscita 0). Warning Node atteso e non bloccante.

- [ ] **Step 2: Build**

Run: `npx expo export --platform android`
Expected: `Exported: dist` (bundling OK).

- [ ] **Step 3: Acquisire l'hash HEAD**

Run: `git rev-parse HEAD`
Expected: output dell'hash del commit finale per il report di review.