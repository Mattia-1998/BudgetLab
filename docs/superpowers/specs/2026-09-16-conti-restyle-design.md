# Design: Restyle pagina Conti (stile banking)

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

Restilizzare la tab **Conti** di Budget Lab seguendo un riferimento HTML fornito dall'utente (stile banking: riquadro "Totale saldi", card conto con bordo e ombra, barra completa "Aggiungi conto"). Icone e stile coerenti con le altre pagine già restilizzate (Movimenti stile banking). Nessuna modifica alla logica di business (saldi, eliminazione, modifica). Nessuna nuova dipendenza.

## Scelte decise con l'utente

- **Header**: resta l'header nativo della tab ("Conti" centrato). **Niente ingranaggio**.
- **Pulsante "Aggiungi conto"**: barra full-width in fondo (non FAB circolare), con icona `add` + testo.
- **Tipo conto mappato** in etichette pulite: `carta` → "Carta", `banca` → "Conto Corrente", `contanti` → "Contanti" (niente `textTransform: 'capitalize'`).
- **Saldo card**: nero (grigio-900) se ≥ 0, rosso (`colors.negative`) se < 0.
- Sfondo `colors.background` invariato.

## Layout (dall'alto verso il basso)

1. `OfflineBanner`
2. **Riquadro "Totale saldi"**
3. **`FlatList`** delle card conto
4. **Barra "Aggiungi conto"** full-width in fondo
5. `AccountFormModal` (invariato)

## Componenti e stili

### Riquadro "Totale saldi"

- `marginHorizontal: 16`, `marginTop: 12`, `paddingVertical: 12`, `paddingHorizontal: 16`, `borderRadius: 16`, sfondo `#F9FAFB`, bordo 1px `#E5E7EB`, `flexDirection: 'row'`, `justifyContent: 'space-between'`, `alignItems: 'center'`.
- Label: "Totale saldi", `fontSize: 14`, fontWeight 500, colore `#6B7280`.
- Valore: `formatCurrency(total)`, `fontSize: 18`, fontWeight 700; nero `#111827` se `total >= 0`, `colors.negative` altrimenti.

### Card conto

- `backgroundColor: '#fff'`, `marginHorizontal: 16`, `marginTop: 10`, `padding: 14`, `borderRadius: 16`, `borderWidth: 1`, `borderColor: '#E5E7EB'`, `flexDirection: 'row'`, `alignItems: 'center'`.
- **Sinistra** (`flex: 1`):
  - Riga orizzontale con pallino 12px (`item.color`) + colonna testi (gap 10 tra pallino e testi).
  - Nome: `fontSize: 14`, fontWeight 600, colore `#111827`.
  - Tipo: `fontSize: 12`, colore `#9CA3AF`, `marginTop: 2`, label mappata (vedi sopra).
  - `item.code` se presente: `fontSize: 12`, colore `#9CA3AF`, `marginTop: 2`.
- **Destra**:
  - Saldo: `fontSize: 14`, fontWeight 700, nero `#111827` se ≥ 0, `colors.negative` se < 0.
  - Icona cestino `trash-outline`, size 20, colore `#9CA3AF`; `Pressable` di eliminazione accanto al saldo con `gap: 12`, `paddingLeft: 4`.
- Press sulla card → `openEdit(item)` (apre il form di modifica). Press cestino → `confirmDelete(item)` (invariato). `onLongPress` sulla card rimosso (la pressione apre il form; la cancellazione è esplicita col cestino).

### Barra "Aggiungi conto"

- `position: 'absolute'`, `left: 16`, `right: 16`, `bottom: 20` (sopra la tab bar), `backgroundColor: colors.primary`, `borderRadius: 16`, `paddingVertical: 14`, `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 8`, `elevation: 4`.
- Icona `add` (24, bianca) + testo "Aggiungi conto" (14, 600, bianco). `onPress={openCreate}`.

### Stato vuoto

- Text semplice "Nessun conto. Aggiungine uno." (12, `#9CA3AF`, centrato, `marginTop: 40`) come `ListEmptyComponent` — invariato.

## Dati e logica

Nessun cambiamento a: `useAccounts`, `useTransactions`, `accountBalance`, `totalBalance`, `AccountFormModal`, `deleteDoc`. Restano invariati `total`, `accountBalance(transactions, item.id, item.initialBalance)` e le funzioni `openCreate/openEdit/confirmDelete`.

## Vincoli e coerenza

- Colori: token esistenti in `src/theme/colors.js` (`colors.primary`, `colors.positive`, `colors.negative`, `colors.background`) o grigi della schermata: `#F9FAFB`, `#E5E7EB`, `#6B7280`, `#111827`, `#9CA3AF`.
- Nessuna nuova dipendenza.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` (atteso: "Tutti i controlli … passano") e `npx expo export --platform android` (atteso: "Exported: dist").
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.