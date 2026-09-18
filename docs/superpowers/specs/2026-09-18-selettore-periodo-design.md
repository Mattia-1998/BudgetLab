# Design: Selettore di periodo (mese, blocchi, anno, tutti, personalizzato)

Data: 2026-09-18

## Contesto

Oggi Home e Movimenti permettono solo due viste: un mese per volta (con `MonthCarousel`) oppure "Tutti i mesi" (doppio tap sul chip). Non è possibile guardare un blocco più ampio (bimestre/trimestre/semestre), un anno specifico o un intervallo scelto dall'utente. Le due schermate duplicano la stessa logica `month` + `allMonths` + `range`.

Obiettivo: introdurre un selettore di periodo unico e riutilizzabile, con granularità predefinite e un intervallo personalizzato, **senza nuove dipendenze** e mantenendo il comportamento attuale (scroll mese, doppio tap "Tutti i mesi").

## Comportamento

### Periodi disponibili

- **Mese**: un mese (comportamento attuale).
- **Bimestre**: blocchi allineati al calendario Gen–Feb, Mar–Apr, Mag–Giu, Lug–Ago, Set–Ott, Nov–Dic.
- **Trimestre**: Gen–Mar, Apr–Giu, Lug–Set, Ott–Dic.
- **Semestre**: Gen–Giu, Lug–Dic.
- **Anno**: Gen–Dic; navigabile anno per anno.
- **Tutti**: nessun limite (intero storico).
- **Personalizzato**: intervallo scelto dall'utente tra due mesi (mese di inizio e mese di fine, inclusi).

### Interazione

- Il chip centrale del `MonthCarousel` diventa il controllo del periodo:
  - **un tap** apre la sheet "Periodo";
  - **doppio tap** attiva/disattiva "Tutti i mesi" (scorciatoia conservata).
  - Per distinguere i due gesti, il tap singolo apre la sheet dopo ~300 ms (tempo per riconoscere un eventuale secondo tap). Il timer viene annullato se arriva il secondo tap.
- I blocchi sono **allineati al calendario**: cambiando granularità si conserva il mese di riferimento (es. `Luglio 2026` → `Trimestre` = `Lug–Set 2026`).
- Frecce e swipe del carosello restano attivi solo per i mode a scorrimento, spostando di un'unità: mese ±1, bimestre ±2, trimestre ±3, semestre ±6, anno ±12 mesi.
- Nei mode **Tutti** e **Personalizzato** frecce e swipe sono disabilitati; per cambiare si riapre la sheet toccando il chip.
- Da "Tutti", il doppio tap ripristina mode+mese precedenti; entrando in "Tutti" lo stato corrente viene memorizzato.
- Il periodo è **indipendente per schermata**: Home e Movimenti hanno ciascuno il proprio stato, come oggi.

### Etichette del chip

- Mese: `Luglio 2026`
- Bimestre: `Bim. Lug–Ago 2026`
- Trimestre: `Trim. Lug–Set 2026`
- Semestre: `Sem. Lug–Dic 2026`
- Anno: `2026`
- Tutti: `Tutti i mesi`
- Personalizzato: stesso anno → `Lug – Set 2026`; anni diversi → anno su entrambi gli estremi (`Nov 2025 – Feb 2026`)

### Sheet "Periodo"

- Elenco preset con la voce corrente evidenziata: `Mese · Bimestre · Trimestre · Semestre · Anno · Tutti · Personalizzato…`
- Tap su un preset → applica (conservando il mese di riferimento) e chiude.
- `Personalizzato…` mostra due stepper `Da ◀ <Mese Anno> ▶` e `A ◀ <Mese Anno> ▶` (un tap sulle frecce sposta di un mese).
  - I valori iniziali sono quelli custom correnti; se il mode corrente non è `custom`, partono dall'inizio/fine del periodo attuale (o dal mese di riferimento per "Tutti").
  - L'ordine è garantito per costruzione: spostando l'inizio oltre la fine, la fine viene trascinata e viceversa (nessuno stato non valido).
  - Pulsante `Applica` → applica `mode: 'custom'` con inizio/fine scelti e chiude.

## Architettura

### `src/utils/finance.js` (funzioni pure)

- `startOfMonth(ms)` → ms del primo giorno del mese.
- `periodRange(period)` → `{ startMs, endMs }` oppure `null` per `all`:
  - `month`: primo giorno → ultimo ms del mese di `anchor`.
  - `bimester`/`quarter`/`semester`: primo mese del blocco allineato al calendario (`m - (m % span)`) per `span` = 2/3/6 mesi.
  - `year`: 1 Gen → 31 Dic dell'anno di `anchor`.
  - `custom`: primo giorno del mese `customStart` → ultimo ms del mese `customEnd`.
- `shiftAnchor(anchorMs, mode, dir)` → nuovo anchor spostato di un'unità (passo in mesi: 1/2/3/6/12); per `all` e `custom` restituisce `anchorMs` invariato.

`period` ha forma `{ mode, anchor, customStart, customEnd }` (interi ms).

### `src/utils/format.js`

- `formatPeriodLabel(period)` → etichetta del chip secondo le regole sopra. Usa `periodRange(period)` (da `./finance`) per i confini e `toLocaleDateString('it-IT', { month: 'short' })` per i mesi brevi (con iniziale maiuscola).

### `src/hooks/usePeriod.js`

Stato per singola schermata:

- stato: `mode` (default `'month'`), `anchor` (default `startOfMonth(new Date())`), `customStart`, `customEnd`, `restore` (per il toggle di "Tutti").
- deriva: `period`, `range` (`periodRange`), `startMs`/`endMs` (`-Infinity`/`Infinity` quando `range` è `null`), `label` (`formatPeriodLabel`), `allActive` (`mode === 'all'`), `shiftable` (`mode !== 'all' && mode !== 'custom'`).
- azioni: `prev()`, `next()` (spostano l'anchor di un'unità se `shiftable`), `toggleAll()` (memorizza/ripristina mode+anchor), `applyPeriod(next)` (imposta mode e, se presenti, anchor/customStart/customEnd; azzera `restore`).

### `src/components/PeriodSheet.js` (nuovo)

Modale coerente con le altre (sfondo semi-trasparente, card, chiusura su backdrop). Props: `visible`, `period`, `onSelect`, `onClose`. Contiene i preset e i due stepper custom. `onSelect` riceve il nuovo `period` parziale (`{ mode }` oppure `{ mode: 'custom', customStart, customEnd }`).

### `src/components/MonthCarousel.js` (esteso, non riscritto)

- Nuova prop `onSelect` (apertura sheet) e `shiftable` (default `true`).
- Frecce e pan disabilitati se `!shiftable`; `allActive` continua a disabilitare la navigazione.
- Gestione del tap: primo tap → timer ~300 ms → `onSelect?.()`; secondo tap entro la finestra → annulla il timer e chiama `onAll?.()`. Timer annullato allo smontaggio.
- La label resta passata dal genitore.

### `src/screens/HomeScreen.js` e `src/screens/TransactionsScreen.js`

- Rimuovere lo stato locale `month`/`allMonths` e usare `usePeriod()` (indipendente per schermata).
- `MonthCarousel` con `label`, `onPrev`, `onNext`, `onAll={toggleAll}`, `allActive`, `shiftable`, `onSelect`.
- Rendere `PeriodSheet` e applicare `applyPeriod`.
- Home: `range`/`startMs`/`endMs` dal hook; titolo `Spese per categoria · <label>`; stato vuoto `Nessun movimento.` quando `allActive`, altrimenti `Nessun movimento nel periodo.`
- Movimenti: il filtro data usa `isInRange(t.date, startMs, endMs)` (gli infiniti coprono "Tutti"); rimuovere il ramo `allMonths ? null : monthRange(month)`.

## Error handling

- Custom: ordine inizio/fine garantito per costruzione (clamp); nessuno stato non valido.
- Nessun nuovo errore di rete o Firestore: cambia solo il filtro locale.

## Test (`scripts/finance.spec.mjs`)

Test puri (nessun framework):

- `periodRange`:
  - `month` su un mese noto → primo giorno / ultimo ms corretti;
  - `bimester` su Lug 2026 → Lug–Ago; su Apr 2026 → Mar–Apr;
  - `quarter` su Apr 2026 → Apr–Giu;
  - `semester` su Set 2026 → Lug–Dic;
  - `year` su qualsiasi mese 2026 → 1 Gen–31 Dic 2026;
  - `all` → `null`;
  - `custom` Lug 2025 → Set 2026 → inizio 1 Lug 2025, fine ultimo ms Set 2026.
- `shiftAnchor`:
  - `month` indietro da Gen 2026 → Dic 2025;
  - `quarter` avanti da Lug 2026 → Ott 2026;
  - `year` avanti da Feb 2026 → Feb 2027;
  - `all`/`custom` → invariato.
- `formatPeriodLabel`: `Luglio 2026`, `Trim. Lug–Set 2026`, `2026`, `Tutti i mesi`, e un custom cross-anno `Nov 2025 – Feb 2026`.

## File toccati

- `src/utils/finance.js` — `startOfMonth`, `periodRange`, `shiftAnchor`.
- `src/utils/format.js` — `formatPeriodLabel`.
- `src/hooks/usePeriod.js` — nuovo hook di stato.
- `src/components/PeriodSheet.js` — nuova modale di selezione periodo.
- `src/components/MonthCarousel.js` — `onSelect`, `shiftable`, gestione tap singolo/doppio.
- `src/screens/HomeScreen.js` — uso di `usePeriod`, `PeriodSheet`.
- `src/screens/TransactionsScreen.js` — uso di `usePeriod`, `PeriodSheet`.
- `scripts/finance.spec.mjs` — test di `periodRange`, `shiftAnchor`, `formatPeriodLabel`.

## Vincoli

- Nessuna nuova dipendenza.
- Nessun commento aggiunto al codice.
- Commit conventional in italiano.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` → `Tutti i controlli di finanza/format/categorie passano.`; `npx expo export --platform android` → `Exported: dist`.
