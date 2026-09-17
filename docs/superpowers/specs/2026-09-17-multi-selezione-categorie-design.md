# Design — Multi-selezione categorie con ordine fisso (Movimenti)

## Obiettivo

La selezione della categoria nella schermata Movimenti deve supportare più categorie contemporaneamente e le icone devono mantenere le loro posizioni. Selezionare una categoria non deve più riordinarla in prima posizione; con il menu chiuso e qualche selezione attiva, la tile freccia si illumina per indicare il filtro.

## Comportamento

### Stato e filtro

- Lo stato `category` (stringa, valori `'all'` o chiave singola) è sostituito da **`selectedCategories`**: array di chiavi categoria, **vuoto = nessun filtro** (tutti i movimenti).
- Filtro `filtered` (memo esistente): se `selectedCategories` non è vuoto, un movimento passa solo se `selectedCategories.includes(t.category)` — semantica **OR** (almeno una delle selezionate).
- Le caselle centrali della riga sono **sempre fisse**: `[Tutte] [Cibo] [Trasporti] [⌄]`. Nessun riordino in base alla selezione.

### Interazioni

- **Tap su una categoria**: toggle — se presente nel set la rimuove, altrimenti la aggiunge. La tile è evidenziata (sfondo colore categoria, icona/testo bianchi) se la chiave è nel set. La griglia resta aperta dopo la selezione.
- **Tap su "Tutte"**: azzera il set (`[]`); la tile "Tutte" è attiva quando il set è vuoto.
- **Tile freccia**: chevron `chevron-down` (chiuso) / `chevron-up` (aperto). Quando il menu è chiuso e `selectedCategories` non è vuoto, la tile si **illumina**: sfondo `#111827` e chevron bianco (stessa palette della tile "Tutte" attiva). Aperta o senza selezione resta con lo stile neutro.
- La sezione resta nascosta con filtro tipo "Trasferimenti"; il reset della selezione categoria al passaggio a `transfer` (set → `[]`) è invariato.

## Stato

- Nel componente: `selectedCategories` (array, default `[]`), `categoriesExpanded` (boolean, default `false`).
- Nessun altro stato toccato.

## Implementazione

- Nuova funzione pura `toggleCategory(selectedKeys, key)` in `src/constants/categories.js`: aggiunge/rimuove `key` senza duplicati.
- `orderedCategoryKeys` semplificato senza parametro di selezione: `central` fisse `['cibo', 'trasporti']`, `rest` = le rimanenti in ordine standard. (La logica "selezionata prima" viene rimossa.)
- Predicato di filtro nel memo: `selectedCategories.length === 0 || selectedCategories.includes(t.category)`.
- Stile freccia attiva: `catTileArrowActive` (sfondo `#111827`), applicato quando `!categoriesExpanded && selectedCategories.length > 0`.
- `scripts/finance.spec.mjs`: nuovi assert per toggle (add/remove, senza duplicati), predicato OR (vuoto → tutto; non vuoto → solo categorie nel set), `orderedCategoryKeys` fissa, e stato freccia attiva (`length > 0`). I test dell'helper riordino precedente vengono aggiornati (il comportamento "selezionata prima" non esiste più).
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs`.

## Non fa parte dello scope

- La sezione "Conto" resta invariata (pill orizzontali).
- Nessuna modifica a categorie dati, backend o agli altri filtri (ricerca, tipo, mese, conto).
- Nessuna nuova dipendenza.