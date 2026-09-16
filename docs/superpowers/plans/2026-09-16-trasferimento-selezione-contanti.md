# Selezione Conti Contanti nei Trasferimenti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consentire di scegliere quale conto Contanti è la controparte di un trasferimento Prelievo/Deposito quando esistono più conti `contanti`, mantenendo l'auto-creazione quando non ce n'è nessuno.

**Architecture:** In `TransactionFormModal.js` si aggiunge lo stato `cashAccountId` (id del conto Contanti controparte), una preselezione del primo conto `contanti` entrando in modalità trasferimento, un selettore chip condiviso (`chipRow`) riusato per la riga non-contanti e per la nuova riga contanti, e il salvataggio che usa `cashAccountId` invece del primo `contanti` trovato. Nessuna modifica al modello dati Firestore né agli altri file.

**Tech Stack:** Expo SDK 57 / React Native 0.86 / JavaScript (JSX) / Firebase Firestore.

## Global Constraints

- Si modifica UN SOLO file: `src/components/TransactionFormModal.js`.
- NON toccare: `finance.js`, `categories.js`, `finance.spec.mjs`, `TransactionItem.js`, `TransactionsScreen.js`, `HomeScreen.js`, `AccountFormModal.js`, `Segmented.js`.
- Nessuna nuova dipendenza. Nessun `?.` (optional chaining): usare find + if.
- Valori esatti dell'auto-creazione Contanti: `name: 'Contanti'`, `type: 'contanti'`, `color: '#757575'`, `initialBalance: 0`, `createdAt: Date.now()`.
- FIX precedentemente approvato da PRESERVARE: in creazione, entrando in `transfer`, `accountId` (conto non-contanti) va azzerato.
- In modifica di un trasferimento: blocco read-only invariato, `updateDoc` solo `{ amount, date, note }`.
- Ambient Windows PowerShell. Verifica build: `npx expo export --platform android` deve terminare con `Exported: dist` (warning Node v20.18.0 attesi, ignorare).
- Working dir: `C:\Users\matti\Desktop\openwork\Cobol`. Branch `main`. Commit su `main`, niente push.

---

### Task 1: Selettore controparte Contanti nel form trasferimento

**Files:**
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: prop `accounts` (array di `{ id, name, type, color, initialBalance }`), prop `initial` (documento trasferimento con `kind`, `direction`, `accountId`, `transferTo`), `isEdit = !!initial`, stato `kind`, `direction`, `accountId` già esistenti.
- Produces: stato `cashAccountId`; funzione locale `chipRow({ label, list, value, onChange, emptyMsg })`; riga contanti sempre visibile in creazione per `kind === 'transfer'`; salvataggio creazione trasferimenti che usa `cashAccountId` (o auto-crea se null).

- [ ] **Step 1: Aggiungere lo stato `cashAccountId`**

In `src/components/TransactionFormModal.js`, dopo la riga `const [direction, setDirection] = useState('prelievo');` aggiungere:

```js
  const [cashAccountId, setCashAccountId] = useState(null);
```

- [ ] **Step 2: Sincronizzare lo stato in `syncState`**

Nella funzione `syncState`, subito dopo `setAccountId(...)` (riga attuale `setAccountId(initial ? initial.accountId : null);`) aggiungere:

```js
    setCashAccountId(initial && initial.kind === 'transfer' ? (initial.direction === 'deposito' ? initial.accountId : initial.transferTo) : null);
```

- [ ] **Step 3: Aggiungere la funzione locale `chipRow`**

Dopo la fine della funzione `syncState` (e prima della funzione `save`), aggiungere la funzione condivisa che renderizza un blocco selettore chip (etichetta + `acctRow` + warn se lista vuota):

```js
  const chipRow = ({ label, list, value, onChange, emptyMsg }) => (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.acctRow}>
        {list.map((a) => {
          const active = value === a.id;
          return (
            <Pressable key={a.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(a.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
            </Pressable>
          );
        })}
        {list.length === 0 ? <Text style={styles.warn}>{emptyMsg}</Text> : null}
      </View>
    </View>
  );
```

- [ ] **Step 4: Preselezionare il primo contanti entrando in modalità trasferimento**

Nel `<Segmented>` della tipologia (riga attuale con `onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) setAccountId(null); }}`), sostituire il callback con:

```jsx
            onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); const firstCash = accounts.find((a) => a.type === 'contanti'); setCashAccountId(firstCash ? firstCash.id : null); } }}
```

- [ ] **Step 5: Sostituire il selettore conto con la doppia riga (non-contanti + contanti)**

Il blocco condizionale dei conti inizia con `{kind === 'transfer' && isEdit ? (` (read-only) e il ramo else è l'attuale `<View>...` con il selettore singolo. Sostituire SOLO il contenuto del ramo else (dalla riga attuale `<View>` dopo `) : (` fino alla chiusura `</View>` prima di `)}`) con:

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

Il ramo else nell'insieme diventa quindi:

```jsx
          ) : (
            <>
              {chipRow({ ... })}
              {kind === 'transfer' ? chipRow({ ... }) : null}
            </>
          )}
```

Nell'else-branch NON riportare la riga `hint` ("Il conto Contanti viene usato...") ora superflua: il warn `emptyMsg` della riga contanti la sostituisce.

- [ ] **Step 6: Usare `cashAccountId` nel salvataggio creazione trasferimento**

Nella funzione `save`, blocco `if (kind === 'transfer')`, ramo `else` (creazione), sostituire la riga attuale `let cashAcct = accounts.find((a) => a.type === 'contanti');` con:

```js
          let cashAcct = accounts.find((a) => a.id === cashAccountId);
```

Il resto del ramo resta identico: se `cashAcct` è assente (`cashAccountId` null perché nessun contanti esistente) viene creato con `addDoc(collection(db, 'accounts'), { name: 'Contanti', type: 'contanti', color: '#757575', initialBalance: 0, createdAt: Date.now() });` e usato `{ id: ref.id }`.

- [ ] **Step 7: Verificare che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist` (warning Node v20.18.0 attesi).

- [ ] **Step 8: Verifica rapida dei cambiamenti**

Run: `git diff src/components/TransactionFormModal.js | Select-String -Pattern "cashAccountId|chipRow" -SimpleMatch`
Expected: compaiono occorrenze di entrambi i simboli nelle modifiche (stato, syncState, onChange, riga contanti, save). Controllo visivo che il blocco read-only (modifica trasferimento) e il flusso expense/income siano intatti.

- [ ] **Step 9: Commit**

```bash
git add src/components/TransactionFormModal.js
git commit -m "feat: selezione conto contanti controparte nei trasferimenti"
```