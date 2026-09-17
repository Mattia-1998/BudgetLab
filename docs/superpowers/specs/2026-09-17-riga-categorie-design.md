# Design — Riga categorie "mostra di più" (Movimenti)

## Obiettivo

La sezione Categoria della schermata Movimenti oggi è un menu espandibile con header cliccabile e griglia 4×3: l'utente non lo gradisce. Al suo posto una **singola riga di caselle categoria**, sempre visibile: prima casella **Tutte**, ultima casella una **freccia** che espande mostrando le altre icone (stile "mostra di più").

## Comportamento

### Riga chiusa (default)

```
[Tutte] [Cibo] [Trasporti] [⌄]
```

- 4 caselle per riga, stessa larghezza `tileWidth` di oggi (caselle da 78px).
- Prima casella = **Tutte** (stato attivo quando `category === 'all'`).
- Ultima casella = **freccia** in stile tile neutro: `chevron-down` quando chiuso, `chevron-up` quando aperto. È il toggle di espansione.
- La riga è sempre visibile: **non** c'è più l'header cliccabile "Categoria" né l'etichetta del filtro accanto alla label.

### Riga aperta

Le categorie restanti si aggiungono sotto in righe wrap da 4. La freccia resta **ancorata alla fine della prima riga** (non si sposta in fondo alla griglia), così resta facile richiudere:

```
[Tutte] [Cibo] [Trasporti] [⌃]
[Casa] [Bollette] [Salute] [Svago]
[Sport] [Auto] [Shopping] [Stipendio]
[Altro]
```

L'ultima riga può risultare più corta delle altre (12+1 caselle su 4 per riga): è accettabile, è l'effetto del wrap naturale.

### Feedback del filtro selezionato da chiuso

Se la categoria selezionata non è tra le prime due visibili, questa compare **subito dopo "Tutte"**, così il filtro attivo è sempre visibile anche a griglia chiusa.

- Nessuna selezione (o "Tutte"): riempimento standard con l'ordine delle `CATEGORIES` (Cibo, Trasporti, …).
- Selezione attiva: le posizioni centrali sono `categoria selezionata` + prime categorie standard non duplicate, fino a riempire le 3 caselle tra "Tutte" e la freccia.
- In entrambi i casi l'ordine non deve mai duplicare una categoria già mostrata.

### Selezione

- Tap su una casella categoria imposta il filtro e lascia la griglia **aperta** (come oggi).
- Tile selezionata evidenziata col colore categoria (sfondo colorato, icona e testo bianchi — stile già in uso).
- Con filtro tipo "Trasferimenti" la sezione resta nascosta come oggi; al passaggio a `transfer` la categoria torna a `all` (comportamento invariato).

## Stato

- Un solo stato locale in `TransactionsScreen`: `categoriesExpanded` (boolean, default `false`).
- `category` e gli altri stati di filtro restano invariati.

## Implementazione

- Tutto dentro `src/screens/TransactionsScreen.js`: nessun nuovo componente, dipendenza o modifica al data flow.
- La riga chiusa e la griglia aperta condividono le tile esistenti (`catTileBase`, `catAllActive`, `catText`, `catTextActive`), `tileWidth` già calcolato.
- Nuova tile **freccia**: stesso stile base, icona chevron, colorazione neutra (es. grigio `colors.textMuted` / bordo `#E5E7EB`).
- Ordine di render: `Tutte` → (3 caselle centrali secondo la regola di feedback) → nel caso aperto, caselle centrali + restanti `CATEGORIES` in wrap → freccia sempre come 4ª casella della prima riga.
- Animazione apertura/chiusura via `LayoutAnimation.configureNext` (animazione nativa, già usata).
- Nessun test framework per UI; il rendering condizionale non tocca la logica di filtro esistente (`filtered` inviato).

## Non fa parte dello scope

- La sezione "Conto" resta come oggi (pill orizzontali scrollabili).
- Nessuna modifica a categorie, dati, backend o logica di filtro.