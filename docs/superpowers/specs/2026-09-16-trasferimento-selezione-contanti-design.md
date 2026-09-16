# Design — Selezione conto Contanti nei trasferimenti

Data: 2026-09-16 · Progetto: Budget Lab (Expo / React Native / Firestore)

## Obiettivo

Quando esistono **più conti di tipo `contanti`**, l'utente deve poter scegliere **quale** conto Contanti è la controparte di un trasferimento **Prelievo/Deposito**:
- nel **deposito** da quale conto Contanti vengono sottratti i soldi (sorgente);
- nel **prelievo** in quale conto Contanti vengono depositati (destinazione).

Oggi il conto Contanti è risolto in automatico con il primo `type === 'contanti'` (`accounts.find`), senza possibilità di scelta.

## Decisioni approvate (brainstorming)

- **Selettore sempre visibile:** in modalità trasferimento (creazione) il selettore della controparte Contanti compare **sempre**, anche con un solo conto Contanti (già preselezionato).
- **Auto-creazione mantenuta:** se non esiste **nessun** conto `contanti`, resta la creazione automatica al salvataggio (nome `"Contanti"`, `type: 'contanti'`, colore `#757575`, `initialBalance: 0`), con nota informativa in UI.
- **Approccio:** **hoisting del selettore chip** in un'helper condiviso (Approccio 2) per non duplicare il markup delle due righe (non-contanti e contanti).

## Stato del form (`src/components/TransactionFormModal.js`)

- Nuovo stato `cashAccountId` (id del conto Contanti controparte), default `null`.
- `syncState`:
  - trasferimento in **modifica** → `cashAccountId` derivato dal lato contanti originale:
    - `initial.direction === 'deposito'` → `initial.accountId`;
    - `initial.direction === 'prelievo'` → `initial.transferTo`.
  - qualsiasi altro caso → `null`.
- Change tipologia verso `transfer` (creazione): `setAccountId(null)` (FIX precedentemente approvato) **e** `setCashAccountId(primo conto `contanti` esistente | null)`.
  - `cashAccountId` null in creazione = nessun contanti esistente → auto-creazione al salvataggio.

## Selettore chip condiviso

Funzione locale `chipRow({ label, list, value, onChange, emptyMsg })` che renderizza: etichetta, riga chip (`acctRow`) e messaggio `warn` se `list` vuota. Riusata esattamente due volte, solo in **creazione** con `kind === 'transfer'`:

1. **Conto (non-contanti):**
   - lista: `accounts.filter(a => a.type !== 'contanti')`;
   - etichetta: `"Conto da cui prelevare"` (prelievo) / `"Conto in cui depositare"` (deposito);
   - `emptyMsg`: "Nessun conto non-contanti disponibile: crea prima un conto."
2. **Contanti (controparte):**
   - lista: `accounts.filter(a => a.type === 'contanti')`;
   - etichetta: `"Contanti in cui depositare"` (prelievo) / `"Contanti da cui prelevare"` (deposito); la controparte è simmetrica al conto non-contanti;
   - `emptyMsg`: "Nessun conto Contanti: verrà creato automaticamente."

In **modifica** di un trasferimento il blocco resta **read-only** invariato (nomi dei due conti + direzione; nessun selettore).

## Salvataggio creazione trasferimento

- `cashAcct = accounts.find(a => a.id === cashAccountId)`; se assente (nessun contanti esistente) si crea come oggi (`addDoc` in `accounts` con i valori predefiniti) e si usa il nuovo `ref.id`.
- Riferimenti documento invariati:
  - **prelievo**: `{ accountId: contoSelezionato, transferTo: cashAcct.id }`
  - **deposito**: `{ accountId: cashAcct.id, transferTo: contoSelezionato }`
- Validazioni esistenti invariate (importo > 0, conto non-contanti selezionato, data valida). `cashAccountId` null è ammesso **solo** perché coperto dall'auto-creazione.

## Modello dati / compatibilità

- **Nessuna modifica** al modello Firestore dei trasferimenti (`accountId`, `transferTo`, `direction`, `kind`).
- **Nessuna modifica** a `src/utils/finance.js`, `src/constants/categories.js`, `scripts/finance.spec.mjs`, `TransactionItem.js`, `TransactionsScreen.js`, `HomeScreen.js` (la visualizzazione "sorgente → destinazione" usa già `accountById`).
- Documenti esistenti creati col vecchio comportamento restano validi.

## Verifica finale

- `npx expo export --platform android` → termina con `Exported: dist`.

## File toccati

- `src/components/TransactionFormModal.js` (stato `cashAccountId`, `chipRow`, save con controparte selezionabile)

## Fuori scope

- Trasferimenti tra due conti non-contanti.
- Modifica direzione/conti di un trasferimento esistente.
- Aggiunta di funzioni/regole Firestore.