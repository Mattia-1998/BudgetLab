# Design: Trasferimenti liberi tra conti (niente più Prelievo/Deposito)

Data: 2026-09-18

## Contesto

Oggi un trasferimento si crea scegliendo una direzione (`Prelievo` o `Deposito`) e un conto non-contanti: il form filtra i conti per tipo e usa sempre un conto di tipo `Contanti` come controparte, creandolo in automatico se manca. Il documento salvato è:

```
{ kind: 'transfer', direction: 'prelievo'|'deposito', accountId, transferTo, amount, date, note }
```

Obiettivo: eliminare il concetto di Prelievo/Deposito e permettere di spostare denaro **tra due conti qualsiasi**, scegliendo semplicemente il conto di partenza e il conto di arrivo. Il movimento resta né entrata né uscita e continua a mostrarsi in grigio.

## Comportamento

- **Form nuovo trasferimento**: la terza opzione del selettore tipo si chiama `Trasferimento` (non più `Prelievo/Deposito`). Non esiste più alcuna scelta di direzione. Compaiono due selettori a chip:
  - **Conto di partenza** (`accountId`)
  - **Conto di arrivo** (`transferTo`)
  - Entrambi elencano tutti i conti disponibili, di qualunque tipo (inclusi `Contanti`). La lista di ciascun selettore esclude il conto attualmente scelto nell'altro, così non è possibile selezionare lo stesso conto due volte.
- **Niente auto-creazione**: nessun conto `Contanti` viene creato automaticamente. Se i conti non bastano, l'utente li crea prima dalla tab Conti.
- **Salvataggio nuovo**: `addDoc({ kind:'transfer', accountId, transferTo, amount, date, note })`. Il campo `direction` non viene più scritto.
- **Modifica di un trasferimento**: restano modificabili solo importo, data e nota (come oggi). Sorgente e destinazione sono mostrate in sola lettura come `Sorgente → Destinazione`, senza la dicitura `· Prelievo/Deposito`.
- **Visualizzazione**: invariata nella forma (icona swap grigia, importo grigio, sottotitolo `Sorgente → Destinazione · data`). La descrizione di default quando manca la nota è `Trasferimento`; per i documenti storici senza nota si mantiene il fallback a `Deposito`/`Prelievo` in base al vecchio campo `direction`.
- **Filtro per conto nei Movimenti**: un trasferimento compare sia filtrando il conto di partenza sia quello di arrivo.
- **Saldi**: nessuna modifica. `accountBalance` addebita già la sorgente (`accountId`, negativo) e accredita la destinazione (`transferTo`, positivo). Un trasferimento non è mai entrata né uscita.

## Architettura

Approccio A: si mantiene la stessa forma del documento, deprecando `direction`.

### Modello dati

- Nuovi documenti: `{ kind:'transfer', accountId, transferTo, amount, date, note }`.
- Nessuna migrazione: i documenti storici con `direction` restano leggibili. `direction` non guida più alcuna logica; è usato solo come fallback per l'etichetta descrittiva dei trasferimenti senza nota.

### `TransactionFormModal.js`

- Stato: rimosso `direction` e `cashAccountId`; aggiunto `transferTo`.
- `syncState`: per i trasferimenti esistenti imposta `accountId = initial.accountId` e `transferTo = initial.transferTo`; per i nuovi entrambi `null`.
- Rimosso il `Segmented` Prelievo/Deposito e la relativa gestione al cambio tipo.
- Il Selettore tipo usa le opzioni `Uscita`, `Entrata`, `Trasferimento`.
- Due `chipRow`:
  - `Conto di partenza` → valore `accountId`, lista `accounts` filtrata escludendo `transferTo`.
  - `Conto di arrivo` → valore `transferTo`, lista `accounts` filtrata escludendo `accountId`.
  - Messaggio vuoto: `Nessun conto disponibile: crea prima un conto.`
- `save` per `kind === 'transfer'`:
  - valida importo, conti scelti, conti diversi, data;
  - nuovo: `addDoc` con `{ kind:'transfer', accountId, transferTo, amount, date, note }`;
  - modifica: `updateDoc` con `{ amount, date, note }` (invariato).
- Sezione readonly in modifica: `Sorgente → Destinazione` senza direzione.

### `TransactionItem.js`

- Descrizione di default: `transaction.note || (transaction.direction ? (transaction.direction === 'deposito' ? 'Deposito' : 'Prelievo') : 'Trasferimento')`.
- Nessun'altra modifica: icona, colori grigi e sottotitolo restano.

### `TransactionsScreen.js`

- Il filtro conto usa un helper puro `matchesAccountFilter(t, accountId)`:
  ```js
  export function matchesAccountFilter(t, accountId) {
    if (accountId === 'all') return true;
    return t.accountId === accountId || t.transferTo === accountId;
  }
  ```
  (per i non-trasferimenti `transferTo` è `undefined`, quindi il match resta sul solo `accountId`).

### `finance.js` e `format`

- `accountBalance` invariata.
- Aggiunto `matchesAccountFilter` esportata.

## Error handling

- Importo non valido → `Inserisci un importo valido`.
- Conti mancanti → `Seleziona il conto di partenza` / `Seleziona il conto di arrivo`.
- Stesso conto selezionato (possibile solo per stati incoerenti) → `Scegli due conti diversi`.
- Data non valida → `Data non valida (usare GG/MM/AAAA)`.
- Errore Firestore → `Errore di salvataggio: <message>` (come oggi).

## Test (`scripts/finance.spec.mjs`)

Pure functions, stesse convenzioni esistenti:

- `accountBalance` con trasferimento tra due conti qualsiasi: la sorgente è addebitata di `amount`, la destinazione accreditata di `amount`, il saldo totale dei due conti non cambia.
- `matchesAccountFilter`:
  - `'all'` → sempre `true`;
  - match sul conto di partenza;
  - match sul conto di arrivo;
  - conto non coinvolto → `false`;
  - movimento non trasferimento → match solo su `accountId`.

## File toccati

- `src/components/TransactionFormModal.js` — due selettori partenza/arrivo, niente direzione, niente auto-creazione.
- `src/components/TransactionItem.js` — etichetta di default `Trasferimento` con fallback storico.
- `src/screens/TransactionsScreen.js` — filtro conto esteso a sorgente e destinazione.
- `src/utils/finance.js` — helper `matchesAccountFilter`.
- `scripts/finance.spec.mjs` — test saldi trasferimento e filtro conto.
