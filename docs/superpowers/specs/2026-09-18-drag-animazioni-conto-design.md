# Design: Animazioni drag & drop conti (ghost sotto il dito + righe che scorrono)

Data: 2026-09-18

## Contesto

Il riordino conti (v1.4.0) usa long-press + drag & drop. Oggi ci sono due difetti UX:

1. Al long-press il ghost appare ancorato al bordo alto della riga, non sotto il dito, e il pan responder si attiva solo al primo movimento: il ghost non "segue il dito" appena selezionato.
2. Quando il ghost oltrepassa la metà di una riga, la lista ri-renderizza all'istante (riordino dati) senza animazione: le righe sotto "saltano" di posizione, non scivolano per fare spazio.

Obiettivo: al long-press il conto segue subito il dito, e durante il trascinamento le righe non trascinate scivolano in modo animato per fare spazio.

## Comportamento

- **Long-press**: card sollevata (scale 1.03, vibrazione), ghost posizionato con il centro esattamente sotto il punto di pressione del dito dentro la card (`event.locationY`). L'asse Y del dito viene ancorato subito (`grantY = pageY`, senza toccare `granted`): quando poi il pan responder si attiva al primo movimento, `dy` parte da zero rispetto al punto del long-press→ il ghost segue il pollice 1:1 dal primo pixel, senza salti. `granted` resta `false` finché non arriva il grant del pan responder, così il rilascio senza movimento continua a essere gestito da `onPressOut` (come oggi).
- **Durante il drag**: la riga trascinata diventa invisibile (opacity 0) ma mantiene il suo spazio nel layout (nessun collasso, niente salti). Il ghost la copre. Quando la metà del ghost supera la metà di una riga, la riga coinvolta (e il blocco di righe tra posizione vecchia e nuova) scorre di una posizione con una animazione secca: `Animated.timing` ~160ms, `Easing.out`, nessun rimbalzo.
- **Rilascio con movimento**: il ghost stesso "atterra" scivolando nella fessura finale (timing ~180ms con scale che torna a 1); le altre righe sono già esattamente nella posizione finale (spostate di uno slot durante il drag), quindi niente altro si muove; alla fine (callback) riordinamento finale + `syncWorking` + reset offset + salvataggio Firestore (batch, come oggi). Se non c'è stato movimento: ripristino come oggi.
- **Niente auto-scroll** ai bordi dello schermo (fuori scope).
- Threshold "didDrag" invariato (5px), `scrollEnabled` bloccato durante il drag come oggi.

## Architettura

Approccio a traslazione per-riga: durante il drag la lista resta nell'ordine originale (niente riordino dati in tempo reale), le righe non trascinate si spostano via `translateY` animato.

### Stato e refs (`AccountsScreen.js`)

- `rowOffsets = useRef({})`: id → `Animated.Value(0)`, creati al primo render di ogni riga.
- `drag.curIndex`: indice di inserimento corrente (posizione tra le righe non trascinate, come oggi con `dragInsertIndex`).
- `drag.prevList`, `drag.startIndex`, `drag.didDrag`, `drag.granted`, `drag.grantY`: invariati con la correzione sull'ancora.
- Il FlatList usa `data={dragId ? working : accounts}` ma `working` resta nell'ordine originale durante il drag; cambia solo al commit del rilascio.

### Riga visiva

- La riga trascinata: wrapper con `opacity: 0` (mantiene spazio) invece del placeholder vuoto attuale.
- Separatore: si rimuove `ItemSeparatorComponent` e la spaziatura da 10px diventa padding/underlay dentro il wrapper tradotto di ogni riga, così la spaziatura si muove con la card.
- Wrapper di ogni riga: `Animated.View` con `transform: [{ translateY: offset }]`.

### Ancora del dito

- `startDrag(acc, index, evt)` riceve l'evento del long-press:
  - `grantY = evt.nativeEvent.pageY`
  - `baseGhostTop = contentRowTop(accounts, index) + (evt.nativeEvent.locationY - rowHeightOf(acc) / 2)`
  - `granted` resta `false` (il rilascio senza movimento passa da `onPressOut`, come oggi).
- Pan responder: `onPanResponderGrant` setta `granted = true` e **non** sovrascrive `grantY` (l'ancora del long-press).

### Offset "fai spazio" (durante il drag)

Helper puro `dragRowOffsets(list, draggedId, rowHeights, targetIndex)` in `finance.js` (`startIndex` ricavato da `list.indexOf(draggedId)`):

- per ogni riga non trascinata all'indice originale `i`:
  - `targetIndex < startIndex` e `targetIndex <= i < startIndex` → offset `+(rowH(dragged) + 10)`
  - `targetIndex > startIndex` e `startIndex < i <= targetIndex` → offset `-(rowH(dragged) + 10)`
  - altrimenti `0`
- la riga trascinata → `0`.

Al cambio di `drag.curIndex`: `Animated.timing(rowOffsets[id], { toValue: target, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true })` per le sole righe con target cambiato.

### Atterraggio (rilascio)

- `final = reorderAt(working, startIndex, curIndex)`.
- Le righe non trascinate sono **già** nella posizione visiva finale durante il drag (il blocco spostato si trova esattamente uno slot più su/giù, come in `final`): non serve altra animazione per loro.
- Il ghost vola da dov'è a `contentRowTop(final, curIndex) - scrollOffset` con scale → 1 (timing 180ms, `Easing.out(Easing.quad)`); la card in mano resta invisibile.
- Al termine (callback): `setDragId(null)`, `syncWorking(final)`, reset di tutti gli offset a 0 (istantaneo, le posizioni visive coincidono), commit Firestore batch come oggi.
- Se `!didDrag`: ripristino `syncWorking(prevList)` e reset offset, senza commit.

## Error handling

- Commit Firestore fallisce → alert + `syncWorking(prevList)` come oggi.
- Niente error handling aggiuntivo necessario: gli `Animated` si interrompono/reimpostano su ogni fine drag.

## Test (in `finance.spec.mjs`)

Pure functions, stesse convenzioni esistenti:

- `dragRowOffsets`: spostamento giù, spostamento su, indice invariato (tutti `0`), drag del primo e dell'ultimo, righe fuori blocco a `0`.
- `reorderAt`: riordino giù, su, da→a uguali, primo/ultimo elemento.
- `dragInsertIndex` invariato (test esistenti).

## File toccati

- `src/screens/AccountsScreen.js` — comportamento drag & drop animato.
- `src/utils/finance.js` — helper `dragRowOffsets`, `reorderAt`.
- `finance.spec.mjs` — test per i nuovi helper.