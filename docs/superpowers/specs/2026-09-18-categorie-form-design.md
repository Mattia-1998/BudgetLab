# Design — Stile categorie condiviso tra form e Movimenti

Data: 2026-09-18
Stato: approvato

## Problema

Nel form "Nuovo movimento" (`src/components/TransactionFormModal.js`) la selezione di una categoria evidenzia solo il bordo della tile (`borderColor` + `borderWidth: 2`), mentre nella pagina Movimenti (`src/screens/TransactionsScreen.js`) la tile selezionata si riempie del colore della categoria con icona e testo bianchi.

Obiettivo: le categorie del form devono avere **stesso stile e stesso comportamento visivo** di quelle in Movimenti.

## Ambito

- Estrarre una tile categoria presentazionale condivisa.
- Usarla sia in Movimenti sia nel form "Nuovo movimento".
- Nessuna modifica a Firestore, categorie, logica pura o filtri.

## Decisioni

- **Approccio scelto:** componente condiviso `CategoryTile` (unica fonte di verità per stile e stato attivo).
- **Form:** selezione **singola obbligatoria**; nessuna tile "Tutte" (un movimento ha sempre una categoria). Il tap imposta la categoria, non la deseleziona.
- **Movimenti:** comportamento invariato (multi-selezione, tile "Tutte", expand/collapse).

## Componente `CategoryTile`

Nuovo file `src/components/CategoryTile.js`.

Props:

| Prop | Tipo | Descrizione |
|------|------|-------------|
| `icon` | string | Nome icona Ionicons |
| `label` | string | Testo della tile |
| `color` | string | Colore categoria (HEX) |
| `active` | boolean | Stato selezionato |
| `width` | number | Larghezza calcolata dal chiamante |
| `onPress` | function | Handler del tap |
| `inactiveColor` | string | Opzionale, colore icona quando `active` è falso; default `color` |

Rendering: `Pressable` con stile base:

- `height: 78`, `borderRadius: 16`, `borderWidth: 1`, `borderColor: '#E5E7EB'`, `backgroundColor: '#fff'`, `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 4`.
- `active` → `backgroundColor: color`, `borderColor: color`; icona e testo bianchi (`catTextActive`: `color: '#fff'`, `fontWeight: '600'`).
- inattivo → sfondo bianco, icona `inactiveColor`, testo `#374151` (`fontSize: 11`, `fontWeight: '500'`).
- Dimensione icona: 22.

La tile "Tutte" dei Movimenti si ottiene passando `color='#111827'`, `icon='apps-outline'` e `inactiveColor={colors.textMuted}`, per replicate esattamente l'attuale icona grigia quando inattiva.

## Modifiche ai file

### `src/screens/TransactionsScreen.js`

- Sostituire i tre `Pressable` inline (tile "Tutte", `central`, `rest`) con `<CategoryTile>`.
- `tileWidth` resta calcolato nella screen.
- Rimuovere gli stili migrati: `catTileBase`, `catAllActive`, `catText`, `catTextActive`.
- Mantenere locale la tile freccia (`catTileArrow`) perché specifica.
- Nessun cambiamento a filtri, multi-selezione, expand/collapse.

### `src/components/TransactionFormModal.js`

- Calcolare `tileWidth = Math.floor((width - 64) / 4)` con `useWindowDimensions` (padding della card 20×2 + 3 gap da 8).
- Sostituire il `Pressable` categoria con `<CategoryTile width={tileWidth} icon={c.icon} label={c.label} color={c.color} active={category === c.key} onPress={() => setCategory(c.key)} />`.
- Rimuovere gli stili locali `cat` e `catText` e il prop inline `{ borderColor: c.color, borderWidth: 2 }`.
- Griglia (`catGrid`) invariata: `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: 8`.

## Flusso dati

Nessun cambiamento: `category` resta uno stato locale del form, inizializzato a `SPENDING_CATEGORIES[0].key` e incluso nel documento salvato. La tile è solo presentazione.

## Verifica

- `node --experimental-detect-module scripts/finance.spec.mjs` → deve restare verde (logica pura non toccata).
- `npx expo export --platform android` → bundle senza errori.
- Controllo manuale su device:
  - Form: selezionando ogni categoria la tile si riempie del colore con icona e testo bianchi; il tap cambia la selezione; salvataggio invariato.
  - Movimenti: aspetto e comportamento delle tile invariati.
