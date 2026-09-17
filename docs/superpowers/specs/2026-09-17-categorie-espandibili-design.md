# Design — Sezione Categorie espandibile (Movimenti)

## Obiettivo

Nella schermata Movimenti, la griglia delle categorie (12 tile in 4 colonne, ~3 righe da 78px) occupa troppo spazio e nasconde i movimenti sottostanti. La sezione Categoria deve diventare un menu espandibile: chiuso di default, che resta aperto dopo la selezione.

## Comportamento

- La sezione "Categoria" è **chiusa all'avvio** della schermata.
- L'header della sezione diventa cliccabile: label "Categoria" + chevron `chevron-down`/`chevron-up` (Ionicons).
- Tap sull'header alterna visibilità della griglia (apri/chiudi).
- Dopo la selezione di una categoria la griglia **resta aperta** (nessun auto-close).
- Quando la griglia è chiusa e c'è una categoria attiva (diversa da "Tutte"), l'header mostra il **nome della categoria selezionata** in grigio accanto a "Categoria", così il filtro attivo resta visibile anche da chiuso.
- Con filtro tipo "Trasferimenti" la sezione resta nascosta come oggi; il reset della categoria a "Tutte" al cambio di tipo è invariato.

## Stato

- Un solo stato locale in `TransactionsScreen`: `categoriesExpanded` (boolean, default `false`).

## Implementazione

- Tutto dentro `src/screens/TransactionsScreen.js`, nessun nuovo componente o dipendenza.
- L'header della sezione: `Pressable` con `sectionLabel` esistente e icona chevron.
- Il contenuto (griglia `catGrid` esistente) viene renderizzato solo se `categoriesExpanded === true`.
- Animazione di apertura/chiusura via `LayoutAnimation.configureNext` (animazione nativa, no librerie aggiuntive).
- Test: nessun test framework per UI; la logica di filtro esistente è invariata (il rendering condizionale non tocca il data flow).

## Non fa parte dello scope

- La sezione "Conto" resta sempre visibile (non espandibile).
- Nessuna modifica al data flow di filtro, ai dati o al backend.