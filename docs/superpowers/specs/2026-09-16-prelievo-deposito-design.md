# Design — Prelievo/Deposito e categoria Stipendio

Data: 2026-09-16 · Progetto: Budget Lab (Expo / React Native / Firestore)

## Obiettivo

Aggiungere all'app il concetto di **trasferimento tra conti** tramite una terza tipologia di movimento **"Prelievo/Deposito"**, accanto a Uscita ed Entrata, che sposta denaro tra un conto non-contanti e il conto **Contanti** (auto-creato se mancante). Aggiungere inoltre la categoria **Stipendio** per le entrate.

## Decisioni approvate

- **Modello:** un **singolo documento** di trasferimento (Approccio A).
- **Visualizzazione lista:** importo **in grigio con segno `-`** (colore neutro `#9CA3AF`), perché non è né una spesa né un'entrata reale.
- **Semantica direzioni:**
  - **Prelievo**: conto selezionato → Contanti (il conto scende, Contanti sale).
  - **Deposito**: Contanti → conto selezionato (Contanti scende, il conto sale).
- **Contanti automatico:** se non esiste un conto di tipo `contanti`, viene creato al salvataggio di un prelievo **o** di un deposito, con nome `"Contanti"`, tipo `contanti`, saldo iniziale `0`, colore `#757575`. Se esistono più conti `contanti`, si usa il **primo** in ordine di elenco.
- **Modifica:** per un trasferimento esistente si modificano **solo importo, data e nota**; direzione e conti coinvolti restano fissi.

## Categoria Stipendio

- Aggiunta in `src/constants/categories.js`:
  `{ key: 'stipendio', label: 'Stipendio', icon: 'cash-outline', color: '#00838F' }`
- Le categorie passano da 10 a **11** → aggiornare `assert` in `scripts/finance.spec.mjs`.
- È una categoria condivisa (form e filtro). Il grafico a torta conta solo `kind === 'expense'`, quindi lo Stipendio (entrata) non compare mai nel grafico spese.

## Modello dati trasferimento

Documento in collezione `transactions`:

```javascript
{
  kind: 'transfer',          // terzo tipo accanto a 'expense' | 'income'
  direction: 'prelievo',     // 'prelievo' | 'deposito'
  accountId: "carta123",     // conto da cui i soldi ESCONO (sorgente)
  transferTo: "contanti123", // conto a cui ARRIVANO (destinazione)
  amount: 50,                // ≥ 0
  date: 1726550400000,       // timestamp ms
  note: "Bancomat",          // opzionale
  // categoria ASSENTE per i trasferimenti
}
```

Mappatura direzioni:
- **prelievo**: `accountId` = conto selezionato (non-contanti), `transferTo` = conto Contanti.
- **deposito**: `accountId` = conto Contanti, `transferTo` = conto non-contanti selezionato.

## Logica saldi (`src/utils/finance.js`)

- `signedAmount(t)` esteso per gestire il trasferimento come uscita dal proprio conto:
  - `income` → `+amount`
  - `transfer` → `-amount` (uscita dal conto sorgente)
  - `expense` → `-amount`
- `accountBalance(transactions, accountId, initialBalance)`:
  - attribuisce `signedAmount(t)` quando `t.accountId === accountId`;
  - attribuisce **`+t.amount`** quando `t.kind === 'transfer' && t.transferTo === accountId`;
  - le due condizioni sono mutuamente esclusive (vietato `accountId === transferTo`).
- `expensesByCategory`: invariata (filtra già `kind === 'expense'`).
- `sumByKind`: invariata (`income`/`expense` non includono i trasferimenti).
- `totalBalance`: somma dei saldi → i trasferimenti si annullano, totale corretto automaticamente.

## Form movimento (`src/components/TransactionFormModal.js`)

- Segmented con **3 opzioni**: `Uscita ('expense')`, `Entrata ('income')`, `Prelievo ⤡ Deposito ('transfer')`.
- Con `kind === 'transfer'`:
  - compare un secondo toggler **Prelievo | Deposito** (`direction`, default `prelievo`);
  - la sezione **Categoria viene nascosta**;
  - il selettore conto mostra **solo i conti non-contanti**, con etichetta dinamica "Conto da cui prelevare" / "Conto in cui depositare";
  - riga di aiuto: "Il conto Contanti viene usato (o creato automaticamente).".
- Validazione invariata (importo > 0, data GG/MM/AAAA valida, conto selezionato).
- **Salvataggio creazione**: risolve il conto Contanti (`accounts.find(a => a.type === 'contanti')`); se assente `addDoc` in `accounts` con i valori predefiniti; poi scrive il trasferimento:
  - prelievo: `{ accountId: selezionato, transferTo: contanti.id }`
  - deposito: `{ accountId: contanti.id, transferTo: selezionato }`
  - `data = { kind: 'transfer', direction, accountId, transferTo, amount, date, note }`
- **Modifica** (`initial.kind === 'transfer'`): conserva `direction`, `accountId`, `transferTo` originali; aggiorna solo `amount`, `date`, `note`. Direzione/conti mostrati come read-only.

## Lista movimenti (`src/components/TransactionItem.js`)

Per `kind === 'transfer'`:
- icona neutra: `swap-horizontal-outline`, tonde grigie (container `#F3F4F6`, icone `#9CA3AF`);
- descrizione: `note || (direction === 'prelievo' ? 'Prelievo contanti' : 'Deposito contanti')`;
- sottotitolo con percorso del conto e data: `"{source} → {target} · {date}"` (richiede lookup nome conto);
- importo: `"-€X"` grigio `#9CA3AF` (colore neutro), peso `700`.
- soggetto a una nuova prop opzionale per il lookup dei nomi conto (es. `accountById`).

## Filtri movimenti (`src/screens/TransactionsScreen.js`)

- Pill tipologia: `Tutte · Entrate · Uscite · Trasferimenti` (valori `all / income / expense / transfer`).
- Con `kind === 'transfer'` la sezione riga **Categoria è nascosta** (i trasferimenti non hanno categoria).
- Il filtro **Conto resta attivo** (matcha `t.accountId`, la sorgente del trasferimento).
- Il campo ricerca (categoria/nota) continua a funzionare: i trasferimenti matchano per nota.

## Home (`src/screens/HomeScreen.js`)

- "Ultimi movimenti": i trasferimenti compaiono resi grigi da `TransactionItem`; nessuna modifica alla logica.
- Riepilogo entrate/uscite del mese: i trasferimenti sono esclusi (già per `kind`).
- `AccountCards` e Totale saldi: coerenti grazie a `accountBalance`/`totalBalance`.

## Test (`scripts/finance.spec.mjs`)

Nuovi casi:
1. `CATEGORIES.length === 11` e presenza di `stipendio` con icona/colore.
2. Prelievo: saldo conto sorgente ridotto di `amount`, saldo Contanti aumentato di `amount`, `totalBalance` invariata.
3. Deposito: simmetrico (Contanti ridotto, conto aumentato, totale invariato).
4. `expensesByCategory` e `sumByKind` ignorano i trasferimenti.
5. Un trasferimento non è conteggiato come `income` né come `expense`.

## Verifica finale

- `node --experimental-detect-module scripts/finance.spec.mjs` → "Tutti i controlli ... passano."
- `npx expo export --platform android` → "Exported: dist".

## File toccati

- `src/constants/categories.js` (categoria Stipendio)
- `src/utils/finance.js` (trasferimenti nei saldi)
- `src/components/TransactionFormModal.js` (kind transfer + direzione + contanti automatico)
- `src/components/TransactionItem.js` (visualizzazione grigia)
- `src/screens/TransactionsScreen.js` (filtro Trasferimenti)
- `src/screens/HomeScreen.js` (lookup nomi conto per il sottotitolo)
- `scripts/finance.spec.mjs` (logica trasferimenti + 11 categorie)

## Fuori scope

- Trasferimenti tra due conti non-contanti (sempre Contanti come controparte).
- Funzioni/regole Firestore: restano aperte.
- Autenticazione.