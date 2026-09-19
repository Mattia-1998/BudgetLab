# Design — Restyle del form "Nuovo movimento"

Data: 2026-09-19
Stato: approvato (brainstorming)

## Obiettivo

Rendere il form "Nuovo movimento" (`TransactionFormModal`) più curato visivamente, ispirandosi al mockup HTML fornito (header con X, segmented con icone, importo grande, pill categoria selezionata, chip conti, input con icone, footer). **Solo look: la logica resta invariata.**

## Contesto

- `TransactionFormModal.js` (~263 righe): modal con `Segmented`, importo, griglia categorie (3 + freccia espandi + 8), chip conti, data, nota, azioni.
- `colors.primary` è già indigo `#4F46E5` (stesso brand del mockup).
- `Segmented` è usato **solo** dal form → può essere ristilizzato senza impatti.
- Nessun font custom oggi; `expo-font` NON è in `package.json` → va aggiunto (rebuild nativo una tantum).
- `CategoryTile` condivisa con Movimenti: il restyle dei tocchi alle tile deve essere aggiunto come elemento specifico del form o come render già compatibile, senza cambiare le dimensioni/colori correnti di Movimenti.

## Decisioni di design (da brainstorming)

1. **Approccio A**: restyle in place di `TransactionFormModal`, senza estrarre nuovi componenti globali. `Segmented` viene ristilizzato (usato solo qui).
2. **Font**: aggiungere **Plus Jakarta Sans** come asset via `expo-font`, con 4 pesi (400, 500, 600, 700). Caricato alla radice dell'app (`App`); applicato nel form con `fontFamily` per peso. Le altre schermate restano col font di sistema (scope sul form).
3. **Griglia categorie**: mantenere la **freccia espandi** (3 tile + freccia in prima riga, altre 8 dietro espansione). Niente "Tutte" (è un form a selezione obbligatoria).
4. **Tile selezionata**: riempimento col **colore della categoria** (convenzione attuale, come Movimenti), non arancio uniforme del mockup.
5. **Nessun toast** di conferma al salvataggio: il form si chiude come oggi.
6. **Icone Ionicons esistenti** (niente FontAwesome). La tile fittizia "Entrate" del mockup va ignorata: contano solo le categorie dell'app (`SPENDING_CATEGORIES` / `CATEGORY_MAP`).
7. **Bordo indigo al focus**: simulato via stato `focused` locale (RN non ha `:focus-within`).

## UI — sezioni

### Header
- Label piccola uppercase "Gestione Spese" (leggera, testo muted) sopra il titolo.
- Titolo semiforte: "Nuovo movimento" o "Modifica movimento" (da `isEdit`).
- Pulsante X rotondo (slate-100) a destra, chiude il modal.

### Segmented (Uscita / Entrata / Trasferimento)
- Contenitore slate-100 arrotondato (`rounded-2xl`), 3 bottoni flessibili.
- Ogni bottone: icona Ionicons (`trending-down`, `trending-up`, `swap-horizontal`) + label.
- Attivo: indigo (`#4F46E5`) con testo bianco; inattivi: testo slate-600.
- Ristilizzare `Segmented.js` accettando un'icona opzionale per opzione; API invariata per i chiamanti.

### Importo
- Card slate-50 (`#F8FAFC`) con bordo slate-200 che diventa indigo al focus (stato `focused`).
- Prefisso "€" grande + input bold (`fontSize` ~28-30) senza bordo interno.
- Placeholder "0,00 (es. 12,50)".

### Categoria
- Riga header: label "Categoria" uppercase + pill a destra col nome della categoria selezionata (bg indigo-50, testo indigo-600).
- Griglia 4 colonne (`gap` ~10), tile `CategoryTile` con radius maggiore (`rounded-2xl` ~16/18) e padding interno; icona ~20-22; label xs.
- Feedback press: scala 0.96 quando premuta. Implementato come prop opzionale `pressScale` booleana su `CategoryTile` (default disattivata): il form la attiva, **Movimenti resta identico**.
- Freccia espandi (chevron-down/up, dimensione 24) come oggi, dopo le prime 3 tile; attiva (sfondo scuro `#111827`) quando una categoria nascosta è selezionata e la griglia è collassata.

### Conti
- Chip arrotondati (`rounded-xl`): attivo indigo testo bianco, inattivi slate-100 testo slate-600. Stesso comportamento di oggi (conto singolo; conti di partenza/arrivo per trasferimento).

### Data e Nota
- Input slate-50 (`#F8FAFC`) arrotondati (`rounded-xl`), bordo slate-200 che diventa indigo al focus.
- Icona a sinistra: `calendar-outline` per la data, `create-outline` (penna) per la nota.
- Data: formato testuale GG/MM/AAAA invariato (nessun date picker nativo).

### Footer
- Righe: "Annulla" (slate-100) + "Salva" (indigo-600, testo bianco, ombra leggera) a pari larghezza, arrotondati, scala al press.

## Comportamento (invariato)

- Switch tipo: stessa logica (`Segmented`), reset conti se si passa a trasferimento.
- Categoria: singola obbligatoria, default `cibo`; `categoriesExpanded` per espandere/nascondere le 8 restanti; freccia attiva se `!expanded && categoria nascosta selezionata`.
- Validazione invariata: importo > 0, data GG/MM/AAAA valida, conti obbligatori per trasferimento e diversi tra loro. Messaggi di errore in stile nuovo (rosso, sotto i campi).
- `syncState` per la modifica invariato; `save()` invariato (Firestore).
- Chiusura via X o Annulla; il backdrop non chiude.

## Font e asset

- Aggiungere i 4 `.ttf` di Plus Jakarta Sans in `assets/fonts/`:
  - `PlusJakartaSans-Regular.ttf` (400)
  - `PlusJakartaSans-Medium.ttf` (500)
  - `PlusJakartaSans-SemiBold.ttf` (600)
  - `PlusJakartaSans-Bold.ttf` (700)
- Aggiungere `expo-font` alle dipendenze e usare `useFonts` in `App` (blocco fino a font caricate).
- Nel form usare `fontFamily` per peso tramite una mappa locale (es. `FONT = { regular, medium, semiBold, bold }`).

## Verifica

- `node --experimental-detect-module scripts/finance.spec.mjs` → verde (logica pura invariata).
- `npx expo export --platform android` → bundle ok (JS + font).
- Rebuild nativo una tantum (`npx expo run:android`) perché viene aggiunto `expo-font`.
- Controllo visivo manuale del form su device (header, segmented, importo, griglia + freccia, chip, footer, messaggi di errore).