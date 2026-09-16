# Design: IBAN / Numero carta sugli account

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

In **Budget Lab**, quando si crea o modifica un conto si potrà indicare un codice opzionale: **IBAN** se il conto è di tipo **Banca**, **Numero carta** se il conto è di tipo **Carta**. Il valore viene mostrato nella lista della tab **Conti**, sotto nome/tipo. Nessuna modifica alla logica di business (saldi, movimenti, totale): campo puramente informativo.

## Scelte decise con l'utente

- **Campo unico** con etichetta che cambia in base al tipo selezionato: "IBAN" per `banca`, "Numero carta" per `carta`.
- **Visualizzazione**: solo nella lista della tab Conti. Home (card orizzontali) invariata.
- **Opzionale e libero**: nessun controllo di formato; il valore viene salvato con `trim()`.

## Schema dati

Nuovo campo opzionale sul documento `accounts`:

```js
{
  name: string,
  type: 'carta' | 'banca',
  color: string,
  initialBalance: number,
  createdAt: number,     // ms epoch
  code?: string,         // nuovo — IBAN o numero carta, opzionale
}
```

Gli account esistenti non hanno `code`: il dato è assente → non viene mostrato. Nessuna migrazione dati necessaria.

## Modifiche

| File | Modifica |
|------|----------|
| `src/components/AccountFormModal.js` | **Modify** — nuovo campo testo opzionale `code`. Etichetta dinamica: Banca → "IBAN", Carta → "Numero carta". Agganciato a `syncState`/`save` |
| `src/screens/AccountsScreen.js` | **Modify** — nella card della lista, sotto `cardType`, riga testuale piccola in grigio (`#888`) con `item.code`, renderizzata solo se presente |

### Dettaglio form

- Posizione: subito dopo la riga del tipo (`typeRow`), così l'etichetta reagisce alla selezione del chip. Ordine finale dei campi: **Nome → Saldo iniziale → Tipo → IBAN / Numero carta → Colore**.
- `placeholder` esemplificativo diverso per etichetta: IBAN → es. `IT60X0542811101000000123456`; Numero carta → es. `1234 5678 9101 1121`.
- `autoCapitalize="characters"` sul campo per coerenza visiva di IBAN/numero.
- `syncState` (modifica): precompila con `initial.code ?? ''`; `save`: `code: code.trim()` (o `''` se vuoto → salvato comunque, il campo è opt-in).

### Dettaglio lista Conti

```js
{item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
```

Stile: `cardCode: { fontSize: 13, color: '#888', marginTop: 2 }`.

## Vincoli e coerenza

- Colori dal tema (`colors` esistente) o grigi già usati nelle card.
- Nessuna nuova dipendenza.
- Logica di business (accountBalance, totalBalance, movimenti) intoccata.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso: "Tutti i controlli ... passano") e `npx expo export --platform android` (atteso: "Exported: dist").
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.