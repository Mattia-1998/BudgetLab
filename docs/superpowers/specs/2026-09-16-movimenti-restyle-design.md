# Design: Restyle pagina Movimenti (stile banking)

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

Restilizzare la tab **Movimenti** di Budget Lab seguendo un riferimento HTML fornito dall'utente (stile banking: titolo centrato, barra di ricerca, pill per tipo/mese/conto, griglia categorie, stato vuoto con bordo tratteggiato). Le icone SVG dell'HTML vengono sostituite con le **icone Ionicons** già usate dal programma. Nessuna modifica alla logica di business (filtri, query, eliminazione, salvataggio). Nessuna nuova dipendenza.

## Scelte decise con l'utente

- **Header**: resta l'header nativo della tab ("Movimenti" centrato). **Niente ingranaggio** (il pulsante dell'HTML non ha funzione).
- **Filtro Tutte/Entrate/Uscite** (oggi un `Segmented`): diventa una riga di pill compatta sotto la ricerca; il comportamento (valori `all | income | expense`) resta invariato.
- **Icone**: tutte dall'insieme Ionicons esistente del programma (niente SVG dell'HTML).
- **Sfondo**: resta `colors.background` (#F5F5F5), non il grigio #f3f4f6 dell'HTML, per coerenza con le altre pagine.
- Dettagli minori: placeholder "Cerca per categoria o nota...", stato vuoto con testi "Nessun movimento trovato" / "Prova a cambiare i filtri di ricerca o il mese."

## Layout (dall'alto verso il basso)

1. `OfflineBanner`
2. **Barra di ricerca**
3. **Pill tipo** (Tutte · Entrate · Uscite)
4. **`MonthCarousel`** (componente esistente, invariato)
5. **Sezione Conto**: etichetta "CONTO" + riga orizzontale scrollabile di pill
6. **Sezione Categoria**: etichetta "CATEGORIA" + griglia 4 colonne
7. **`FlatList`** dei movimenti (righe `TransactionItem` invariate)
8. **Stato vuoto** come `ListEmptyComponent` (card tratteggiata)
9. **FAB** invariato

**Scroll unico**: ricerca + filtri + sezioni vengono spostati in `ListHeaderComponent` della `FlatList`; tutto scorre insieme alla lista (comportamento della pagina HTML). Il FAB resta fisso in basso a destra.

## Componenti e stili

### Barra di ricerca

- `marginHorizontal: 16`, `marginTop: 12` (dopo banner).
- Altezza ~48px, `borderRadius: 16`, sfondo `#F9FAFB`, bordo 1px `#E5E7EB`.
- Icona `search-outline` (16-18px, grigia `colors.faintText`) assoluta a sinistra, `paddingLeft` del campo ~40px.
- Se `query` non vuota: icona `close-circle` (grigia) a destra che svuota la ricerca (`setQuery('')`).
- `placeholder="Cerca per categoria o nota..."`.

### Pill tipo (Tutte/Entrate/Uscite)

- Riga orizzontale (flex, `gap: 8`) dentro `row` con `paddingHorizontal: 16`, `marginTop: 10`.
- Pill altezza ~34px, `borderRadius: 17`, `paddingHorizontal: 16`, `fontSize: 13`.
- **Attiva**: sfondo `colors.primary`, testo bianco, fontWeight 600.
- **Inattiva**: sfondo `#F1F2F4`, testo `#4A5568` (grigio scuro), bordo 1px `colors.chipBorder`.
- Logica: `kind` (`all | income | expense`), come oggi.

### Sezione Conto

- `paddingHorizontal: 16`, `marginTop: 16`.
- Etichetta: `fontSize: 11`, fontWeight 700, `textTransform: 'uppercase'`, colore `colors.textMuted`, `letterSpacing: 0.6`.
- Riga orizzontale scrollabile (`scrollEnabled`, `showsHorizontalScrollIndicator: false`), `gap: 8`, `marginTop: 8`.
- Prima pill **"Tutti i conti"**: attiva = sfondo `colors.primary`, testo bianco; inattiva = grigia con bordo (come sopra).
- Pill per conto: **pallino 8px** con `account.color` (`borderRadius: 4`) + nome (`fontSize: 13`). Stati di colore come sopra. `shrink: 0`.
- La riga mostra "Tutti i conti" sempre come prima pill o come pill "attiva per default" quando `accountId === 'all'`.

### Sezione Categoria

- Stessa struttura/soluzioni di spaziatura della sezione Conto.
- Griglia `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: 8`, `marginTop: 8`.
- Tile: larghezza `(screenWidth - 16*2 - 8*3) / 4` (~calcolo in JS con `useWindowDimensions`), altezza ~76px, `borderRadius: 16`, align center, icona 22px + label `fontSize: 11`.
- Tiles totali = `Tutte` + 8 categorie = 9 → righe 4/4/1.
- **Tutte**: inattiva = bianca, testo grigio, bordo chiaro, icona `apps-outline` grigia; attiva = sfondo `#111827` (grigio-900), icona e testo bianchi.
- **Categoria** (da `src/constants/categories.js`, icona/colore esistenti): inattiva = bianca, icona `cat.color`, testo `#374151`, bordo 1px `cat.color + '33'` (tinta chiara); attiva = sfondo `cat.color`, icona e testo bianchi.

### Stato vuoto

- Card al centro: `marginTop: 24`, `marginHorizontal: 16`, `borderRadius: 24`, `borderWidth: 1`, `borderStyle: 'dashed'`, `borderColor: #D1D5DB`, `paddingVertical: 40`, align center.
- Cerchio icona 48px (sfondo `#F3F4F6`, grigio chiaro) con `clipboard-outline` 26px `colors.faintText`.
- Titolo: `fontSize: 14`, fontWeight 600, `#1F2937`, `textAlign: center`, `marginTop: 12`.
- Sottotitolo: `fontSize: 12`, `colors.faintText`, `textAlign: center`, `marginTop: 4`.

## Dati e logica

Nessun cambiamento a query/filtri (una `FlatList` con `filtered` come oggi), salvataggio, eliminazione o `TransactionItem`. Le pill riutilizzano gli stessi `state` esistenti: `kind`, `accountId`, `category`, `query`, `month`, `allMonths`.

`Segmented` continua a essere usato solo in `TransactionFormModal` (Uscita/Entrata); la tab Movimenti non lo importa più.

## Vincoli e coerenza

- Colori: token esistenti in `src/theme/colors.js` o esadecimali locali solo dove il tema non li copre (grigi usati in questa sola schermata).
- Nessuna nuova dipendenza.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso: "Tutti i controlli … passano") e `npx expo export --platform android` (atteso: "Exported: dist").
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.