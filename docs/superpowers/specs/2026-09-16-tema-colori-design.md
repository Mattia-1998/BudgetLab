# Budget Lab — Design: Tema colori centralizzato "Indaco"

Data: 2026-09-16
Scopo: skin dell'app sul tono indaco/violaceo, con i colori centralizzati in un'unica fonte per rendere semplici modifiche future.

## Palette (fonte unica: `src/theme/colors.js`)

| Costante      | Valore     | Uso                                                        |
|---------------|------------|------------------------------------------------------------|
| `primary`     | `#4F46E5`  | Pulsanti Salva, FAB, chip attivi, tab attivo, chevron mese |
| `positive`    | `#1B5E20`  | Totali, saldi e importi positivi (entrate) — verde          |
| `negative`    | `#C62828`  | Errori, negativi, uscite, icona cestino                     |
| `background`  | `#F5F5F5`  | Sfondo delle schermate                                      |
| `surface`     | `#FFFFFF`  | Card e modali                                               |
| `text`        | `#333333`  | Testo principale                                            |
| `textMuted`   | `#888888`  | Testo secondario                                            |
| `offlineBg`   | `#FFECB3`  | Banner offline                                              |
| `offlineText` | `#6D4C00`  | Testo banner offline                                        |
| `border`      | `#CCC`     | Bordi input                                                 |
| `white`       | `#FFFFFF`  | Testo su superficie colorata                               |

## Sopravvivenze esplicite (NON cambiano)

- Colori delle **categorie** (`src/constants/categories.js`): restano i valori attuali (sono semantiche dei dati).
- Sfondo `background` e banner offline: invariati.
- Nessun cambiamento di comportamento/logica.

## Pallini colore conti

`COLORS` in `AccountFormModal.js` passa a palette indaco/blu/viola:
`['#4F46E5', '#2563EB', '#7C3AED', '#9333EA', '#0EA5E9', '#37474F']`

## File toccati

- Nuovo: `src/theme/colors.js` (esporta `colors`).
- Aggiornati per importare dal tema: `AppNavigator.js`, `HomeScreen.js`, `TransactionsScreen.js`, `AccountsScreen.js`, `AccountFormModal.js`, `AccountCards.js`, `MonthlyNav.js`, `Segmented.js`, `TransactionItem.js`, `TransactionFormModal.js`.

## Verifica

- `node --experimental-detect-module scripts/finance.spec.mjs` deve passare.
- `npx expo export --platform android` deve riuscire.

## Fuori scope

- Non si toccano categorie, logica, test di comportamenti, icone app, keystore.