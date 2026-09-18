# Design: Categoria "Trasferimento" come filtro nei Movimenti

Data: 2026-09-18

## Contesto

I movimenti di tipo trasferimento non hanno categoria e non sono raggiungibili tramite la griglia dei filtri Categoria nella schermata Movimenti (che elenca le 11 categorie di spesa/entrata). Si vuole poter filtrare i trasferimenti da quella griglia aggiungendo una voce `Trasferimento`.

## Comportamento

- Nella griglia dei filtri Categoria della schermata Movimenti compare una nuova tile `Trasferimento` (icona swap orizzontale, grigio `#9CA3AF`, come i movimenti di trasferimento).
- Selezionando `Trasferimento` si vedono i movimenti di tipo trasferimento; la selezione è in OR con le altre categorie (es. `Cibo` + `Trasferimento` mostra le uscite Cibo e i trasferimenti).
- Il filtro tipo (Tutte / Entrate / Uscite / Trasferimenti) resta separato e prevale: con tipo `Entrate` o `Uscite` la tile `Trasferimento` non mostra nulla; con tipo `Trasferimenti` la sezione Categorie resta nascosta come oggi e si vedono tutti i trasferimenti.
- La tile si trova nella griglia espandibile (fondo, dopo le altre), non nella riga fissa che mantiene esattamente 4 posizioni `[Tutte] [Cibo] [Trasporti] [⌄]`.
- La tile `Tutte` azzera l'intera selezione, `Trasferimento` incluso.
- La categoria `Trasferimento` non è selezionabile nel form di un movimento di uscita/entrata.
- Home e grafici restano invariati: la torta delle spese conta solo i movimenti `kind: 'expense'` e nessun movimento ha categoria `trasferimento`.
- La ricerca testuale resta invariata (i trasferimenti restano trovabili tramite la nota).

## Architettura

### `src/constants/categories.js`

- Aggiungere in coda a `CATEGORIES`:
  ```js
  { key: 'trasferimento', label: 'Trasferimento', icon: 'swap-horizontal-outline', color: '#9CA3AF' }
  ```
  Da questo derivano automaticamente `CATEGORY_MAP` (che include `trasferimento`) e `orderedCategoryKeys()` (il cui `rest` include la nuova tile in fondo).
- Esportare `SPENDING_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'trasferimento')` per il form movimento.
- Sostituire `matchesCategoryFilter(selectedKeys, category)` con `matchesCategorySelection(selectedKeys, transaction)`:
  ```js
  export function matchesCategorySelection(selectedKeys, transaction) {
    if (selectedKeys.length === 0) return true;
    if (transaction.kind === 'transfer') return selectedKeys.includes('trasferimento');
    return selectedKeys.includes(transaction.category);
  }
  ```
  La vecchia `matchesCategoryFilter` viene rimossa (unico consumatore: la schermata Movimenti).

### `src/screens/TransactionsScreen.js`

- Import: `matchesCategorySelection` al posto di `matchesCategoryFilter`.
- Nel filtro: `if (!matchesCategorySelection(selectedCategories, t)) return false;`.
- Nessun'altra modifica: la griglia continua a usare `orderedCategoryKeys()` e quindi mostra la tile nuova fra le `rest`.

### `src/components/TransactionFormModal.js`

- Import: `SPENDING_CATEGORIES` al posto di `CATEGORIES`.
- Lo stato `category` continua a inizializzarsi a `SPENDING_CATEGORIES[0].key` e la griglia itera `SPENDING_CATEGORIES`, così `Trasferimento` non è selezionabile per uscita/entrata.

## Error handling

Nessun nuovo errore: la modifica è un filtro e una lista di categorie. Comportamento a selezione vuota invariato (`Tutte`).

## Test (`scripts/finance.spec.mjs`)

- Aggiornare `CATEGORIES.length` da 11 a 12.
- Aggiornare l'atteso di `orderedCategoryKeys()`: `central` invariato (`['cibo','trasporti']`), `rest` con `trasferimento` in fondo.
- Sostituire i test di `matchesCategoryFilter` con `matchesCategorySelection`:
  - set vuoto → `true`;
  - trasferimento con `['trasferimento']` → `true`; trasferimento con `['cibo']` → `false`;
  - uscita con la sua categoria → `true`; uscita con categoria diversa → `false`;
  - OR: `['cibo','trasferimento']` → `true` sia per un trasferimento sia per una uscita Cibo, `false` per una uscita di altra categoria.

## File toccati

- `src/constants/categories.js` — nuova categoria, `SPENDING_CATEGORIES`, `matchesCategorySelection`.
- `src/screens/TransactionsScreen.js` — uso del nuovo helper di filtro.
- `src/components/TransactionFormModal.js` — griglia con `SPENDING_CATEGORIES`.
- `scripts/finance.spec.mjs` — test aggiornati.
