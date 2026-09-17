# Design — Riordino conti con long-press & drag

## Obiettivo

Permettere all'utente di ordinare i conti come preferisce: tenendo premuta (long-press) una card conto nella tab **Conti**, la trascina su/giù e la rilascia nella nuova posizione. L'ordine personalizzato è persistente (Firestore) e vale ovunque i conti vengono mostrati (tab Conti, striscia orizzontale Home, filtro conto in Movimenti).

## Requisiti decisi con l'utente

- Interazione: **long-press & drag** con rilascio per confermare la posizione.
- L'ordine vale **ovunque** i conti sono mostrati.
- Ordine **persistente in Firestore** (campo `order` numerico).
- **Nessuna nuova dipendenza** (drag con `PanResponder` nativo, nessun rebuild del dev client).

## Sezione 1 — Dati e ordinamento

### Modello dati

- Ogni documento conto in Firestore ottiene un campo `order` numerico.
- `firestore.rules` resta invariato (write già aperto).

### Funzione pura

Nuova funzione `sortAccountsByOrder(accounts)` in `src/utils/finance.js`:

- Conti con `order` presente: ordinati per `order` crescente.
- Conti senza `order` (già esistenti al lancio della feature): in fondo, ordinati per `createdAt`.
- Parità (`order` uguale o entrambi senza `order`): risolte con `createdAt` crescente.

Testata in `scripts/finance.spec.mjs` (casi: solo con order, senza order in coda, parità).

### Hook condiviso

- `useAccounts` applica `sortAccountsByOrder` alla lista prima di ritornarla.
- In questo modo ogni consumer (`AccountsScreen`, `HomeScreen`, `TransactionsScreen`, `AccountCards`) eredita lo stesso ordine **senza modifiche puntuali**.

### Nuovo conto

- In `AccountFormModal` (creazione): `order = max(existing order) + 1` così finisce in fondo.
- `AccountFormModal` riceve la lista `accounts` come prop (passata da `AccountsScreen`, che è l'unico consumer del modal); al salvataggio di un nuovo conto calcola `max(accounts[].order)` e assegna `max + 1`. In modifica (`updateDoc`) il campo `order` non viene toccato.

## Sezione 2 — Drag & drop (tab Conti)

- Long-press sulla card → attiva il drag, con `Vibration.vibrate()` di feedback.
- Durante il drag:
  - Card "fantasma" che segue il dito: `Animated.View` posizionata in assoluto con `translateY`, con scala e ombra per emergere.
  - Riordino **live** della lista: quando il dito supera metà della card precedente/successiva, lo stato locale viene riordinato; la card originale viene nascosta per evitare duplicati visivi.
- Rilascio = drop nella posizione corrente.
- Un press breve senza spostamento (nessun long-press) continua ad aprire il form di modifica come oggi: durante il drag un flag (`didDrag`, spostamento > soglia) impedisce che il rilascio attivi anche `onPress`.
- Drag su una sola card alla volta. Nessun auto-scroll ai bordi in questa versione (liste conti tipicamente corte); miglioramento futuro possibile.
- Solo `AccountsScreen` ha la logica di drag: `PanResponder` + stato `dragState` + refs per posizione; `FlatList` resta il contenitore.

## Sezione 3 — Persistenza e gestione errori

- Al drop: `writeBatch` Firestore che riscrive `order` ridistribuiti **0..n-1** sull'intera lista (resta sempre coerente).
- Ottimistico: la lista si riordina subito in locale; all'arrivo del `onSnapshot` i valori sono già allineati.
- Su errore del batch: `Alert.alert('Errore', 'Impossibile salvare l\'ordine...')` e ripristino dell'ordine precedente.
- Il cestino resta visibile ma non interagibile durante un drag attivo.
- Offline: la cache in memoria (`memoryLocalCache`) bufferizza le scritture del batch e le sincronizza alla riconnessione, come già avviene per le altre operazioni.

## Test e verifica

- `node --experimental-detect-module scripts/finance.spec.mjs` — atteso "Tutti i controlli … passano".
- `npx expo export --platform android` — atteso "Exported: dist".
- Commit frequenti sul branch corrente. Push solo su richiesta dell'utente.

## Non fa parte dello scope

- Nessuna modifica a `firestore.rules`, backend, form conto (campi), cancellazione conto, saldi.
- Nessuna nuova dipendenza, nessun rebuild del dev client.
- Nessun auto-scroll durante il drag.