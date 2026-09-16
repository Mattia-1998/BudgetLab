# IBAN / Numero carta sugli account — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere un campo opzionale "IBAN" (conti di tipo Banca) o "Numero carta" (conti di tipo Carta) al form degli account e mostrarlo nella lista della tab Conti.

**Architecture:** Campo nuovo opzionale `code` sul documento Firestore `accounts`. Il form (`AccountFormModal`) usa un'unica `TextInput` con etichetta dinamica in base al `type` selezionato; la lista (`AccountsScreen`) mostra `item.code` sotto nome/tipo solo se presente. Home invariata.

**Tech Stack:** React Native (JavaScript), Expo SDK, Firestore (`addDoc`/`updateDoc`). Nessuna dipendenza nuova.

## Global Constraints

- Colori dal tema centralizzato o grigi già usati nelle card (`#888` per testi secondari, come `cardType` oggi).
- Nessuna nuova dipendenza in `package.json`.
- Logica di business (accountBalance, totalBalance, movimenti) intoccata.
- Testi in italiano. Ordine campi del form: Nome → Saldo iniziale → Tipo → IBAN / Numero carta → Colore.
- Verifica obbligatoria: `npx expo export --platform android` (atteso: "Exported: dist"). La logica è invariata → `scripts/finance.spec.mjs` deve continuare a passare ("Tutti i controlli di finanza/format/categorie passano.").
- Commit frequenti, uno per task, sul branch corrente (`main`). Push solo su richiesta dell'utente.

---

### Task 1: Campo `code` nel form account

**Files:**
- Modify: `src/components/AccountFormModal.js`

**Interfaces:**
- Consumes: `colors` da `src/theme/colors.js` (già importato).
- Produces: nuovo campo `code` nel documento account salvato con `addDoc`/`updateDoc`.

- [ ] **Step 1: Aggiungere lo stato `code`**

In `src/components/AccountFormModal.js` aggiungere, accanto agli altri `useState` (riga ~14):

```js
const [code, setCode] = useState('');
```

- [ ] **Step 2: Precaricare `code` in modalità modifica**

In `syncState` (righe 19-25) aggiungere la riga:

```js
setCode(initial ? (initial.code ?? '') : '');
```

- [ ] **Step 3: Salvare `code`**

Nel dato `data` (righe 37-43) aggiungere:

```js
code: code.trim(),
```

- [ ] **Step 4: Renderizzare il campo con etichetta dinamica**

Nel JSX, tra la `typeRow` (righe 69-75) e la `colorRow` (righe 76-80), inserire:

```jsx
<TextInput
  style={styles.input}
  placeholder={type === 'banca' ? 'IBAN (es. IT60X0542811101000000123456)' : 'Numero carta (es. 1234 5678 9101 1121)'}
  value={code}
  onChangeText={setCode}
  autoCapitalize="characters"
/>
```

L'etichetta reagisce al chip tipo perché il `placeholder` dipende da `type` (Banca → IBAN, Carta → Numero carta). Nessuno stile nuovo serve: si riusa `styles.input`.

- [ ] **Step 5: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist` (nessun errore di sintassi/import).

- [ ] **Step 6: Commit**

```bash
git add src/components/AccountFormModal.js
git commit -m "feat: campo IBAN / numero carta nel form conto (etichetta dinamica per tipo)"
```

---

### Task 2: Mostrare `code` nella lista Conti

**Files:**
- Modify: `src/screens/AccountsScreen.js:50-52,83`

**Interfaces:**
- Consumes: campo `item.code` sul documento account (prodotto da Task 1 / dati Firestore esistenti).
- Produces: riga testuale `cardCode` visualizzata solo se `item.code` è presente.

- [ ] **Step 1: Renderizzare il codice nella card**

In `src/screens/AccountsScreen.js`, dentro la card, dopo il `cardType` (riga 52), aggiungere:

```jsx
{item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
```

- [ ] **Step 2: Aggiungere lo stile `cardCode`**

Nello `StyleSheet`, vicino a `cardType` (riga 83), aggiungere:

```js
cardCode: { fontSize: 13, color: '#888', marginTop: 2 },
```

- [ ] **Step 3: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 4: Commit**

```bash
git add src/screens/AccountsScreen.js
git commit -m "feat: mostra IBAN / numero carta nella lista conti (solo se presente)"
```

---

### Task 3: Verifica finale

- [ ] **Step 1: Suite di logica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 2: Build**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Riepilogo diffs**

Run: `git log --oneline -3` per confermare i commit `feat:` dei due task. Nessun push: lo fa l'utente su richiesta.