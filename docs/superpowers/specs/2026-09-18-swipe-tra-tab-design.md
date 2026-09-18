# Design: Swipe tra le tre schermate (tab)

Data: 2026-09-18

## Contesto

Le tre sezioni dell'app (Home, Movimenti, Conti) oggi si cambiano solo toccando la tab bar in basso (`createBottomTabNavigator`). Non esiste uno swipe orizzontale tra le schermate.

Obiettivo: poter cambiare schermata anche con uno swipe orizzontale, in modo fluido (la pagina segue il dito), mantenendo identici header e tab bar attuali. Lo swipe tra le tab **non deve interferire con il carosello del mese** in Home e Movimenti: quando si trascina sul carosello, il carosello ha la priorità.

Vincolo aggiuntivo: le tre schermate non usano hook di navigazione (`useNavigation`/`useRoute`), quindi la navigazione può essere sostituita senza toccarle.

## Comportamento

### Swipe e selezione

- Si scorre orizzontalmente tra le tre pagine (Home, Movimenti, Conti), in ordine, **senza wrap-around**: dalla Home si va solo a Movimenti; da Conti solo a Movimenti.
- A fine swipe (`onPageSelected`) header e tab bar si allineano alla pagina corrente.
- Tap su una tab nella barra: la pagina viene raggiunta con animazione (`setPage`) e header/tab bar si aggiornano subito.
- Tap sulla tab già attiva: nessuna azione (comportamento attuale).
- Orientamento bloccato a portrait (come oggi): nessuna gestione landscape.

### Priorità del carosello

- Se il dito inizia un gesto orizzontale **sul `MonthCarousel`**, lo swipe tra le tab è disattivato per la durata del gesto: il carosello scorre i mesi.
- Se il carosello non può scorrere (`!shiftable`, cioè mode `all`/`custom`, oppure "Tutti" attivo), il gesto sul carosello non lo consuma e lo swipe tra le tab resta attivo.

### Lazy loading e stato

- Come con `createBottomTabNavigator` (lazy di default), una schermata viene montata la prima volta che serve, poi resta montata: lo stato (filtri, scroll, dati) è preservato cambiando tab.
- Per evitare il flash di pagina vuota durante il primo swipe verso una schermata mai aperta, la pagina adiacente viene montata non appena diventa parzialmente visibile (progresso dello swipe ≠ 0), così il contenuto è già pronto quando la pagina entra.

## Architettura

### Dipendenza

- Nuova dipendenza: `react-native-pager-view` (installata con `npx expo install react-native-pager-view` per la versione compatibile con Expo SDK 57).
- Supporta sia Android (ViewPager2) sia iOS (UIPageViewController); richiede la New Architecture, già attiva (`android/gradle.properties` → `newArchEnabled=true`).
- Richiede un **rebuild del dev client** (`npx expo run:android`); la cartella `android/` è generata localmente e non tracciata da git.

### `src/navigation/tabs.js` (nuovo)

Configurazione unica delle tab, riusata da header, barra e pager:

`[{ name: 'Home', title: 'Home', icon: 'home-outline', component: HomeScreen }, { name: 'Movimenti', title: 'Movimenti', icon: 'swap-vertical-outline', component: TransactionsScreen }, { name: 'Conti', title: 'Conti', icon: 'wallet-outline', component: AccountsScreen }]`

### `src/navigation/AppNavigator.js` (riscritto)

- Nessun navigator: `export default` rende `<NavigationContainer><MainTabs /></NavigationContainer>`.
- `NavigationContainer` resta solo per fornire i context richiesti dagli elementi ufficiali di React Navigation (`theme`, `locale`, `linking`); non contiene navigator.

### `src/navigation/MainTabs.js` (nuovo)

- Stato `index` (default `0`) e `loaded` (default `[0]`).
- `PagerView` con `style={{ flex: 1 }}`, `initialPage={0}`, tre figli `View` con `width/height: '100%'` e `collapsable={false}` (i figli di `PagerView` non supportano `flex: 1`).
- Ogni pagina rende il componente della schermata solo se `loaded` include l'indice, altrimenti un `View` vuoto con sfondo `colors.background`.
- `onPageSelected={e => { ensureLoaded(e.nativeEvent.position); setIndex(e.nativeEvent.position); }}`.
- `onPageScroll={e => { const { position, offset } = e.nativeEvent; if (offset > 0) ensureLoaded(position + 1); else if (offset < 0) ensureLoaded(position - 1); }}` (carica l'adiacente appena visibile).
- `selectTab(i)`: se `i === index` non fa nulla; carica `i`, aggiorna `index` e chiama `pagerRef.current?.setPage(i)`.
- Espone via `PagerSwipeContext` le funzioni imperative `lock()` → `pagerRef.current?.setScrollEnabled(false)` e `unlock()` → `pagerRef.current?.setScrollEnabled(true)`.
- Layout: `<AppHeader title={tabs[index].title} />` + `PagerView` + `<MainTabBar tabs={tabs} index={index} onSelect={selectTab} />`, dentro `<View style={{ flex: 1, backgroundColor: colors.background }}>`.

### `src/navigation/AppHeader.js` (nuovo)

Replica fedele dell'header attuale usando i primitivi ufficiali, così il look non cambia:

- Altezza `getDefaultHeaderHeight({ width, height }, false, insets.top)` (Android 64 + inset, iOS 44 + inset) con `useWindowDimensions()`.
- Sfondo: `HeaderBackground` in `StyleSheet.absoluteFill` (bianco + elevazione 4).
- Contenuto: `View` `flex: 1` con `paddingTop: insets.top`, `alignItems/justifyContent: 'center'`, titolo in `HeaderTitle` (testo 20 su Android, colore del default theme come oggi).

### `src/navigation/MainTabBar.js` (nuovo)

Barra presentazionale che riproduce gli stili di `BottomTabItem`:

- Contenitore alto `58 + insets.bottom`, sfondo `colors.surface`, bordo top hairline `#D8D8D8`, elevazione 8, striscia finale nera `#000000` alta `insets.bottom`.
- Riga `flex: 1`, `flexDirection: 'row'`.
- Per ogni tab un `PlatformPressable` (`android_ripple={{ borderless: true }}`, `pressOpacity: 1`, role tab, `aria-selected`, stile `flex: 1`, `column`, `padding: 5`) con icona `Ionicons` size `25` e `Label` (`fontSize: 10` + `fonts.medium` dal theme) del titolo.
- Colori: attivo `colors.primary`, inattivo `colors.textMuted`.

### `src/navigation/PagerSwipeContext.js` (nuovo)

`PagerSwipeContext` (default `null`) + hook `usePagerSwipe()`. `MainTabs` lo popola con `{ lock, unlock }` stabili (`useMemo`).

### `src/components/MonthCarousel.js` (esteso, non riscritto)

- Legge `usePagerSwipe()`.
- Sul `View` radice: `onTouchStart` → `if (shiftableRef.current && !allActiveRef.current) pager?.lock()`, `onTouchEnd`/`onTouchCancel` → `pager?.unlock()`.
- `PanResponder`, animazioni e tap restano invariati.

### Schermate

Nessuna modifica: continuano a rendere il proprio `View` `flex: 1` con sfondo `colors.background`.

## Error handling

- Nessun nuovo percorso di errore di rete o Firestore: cambia solo il contenimento delle schermate.
- `MonthCarousel` usato fuori da `MainTabs` (contesto `null`) non deve rompersi: le chiamate sono opzionali.

## Test

- Nessuna nuova funzione pura: la suite `scripts/finance.spec.mjs` resta invariata e deve continuare a passare.
- Verifica non automatizzabile: swipe, priorità del carosello, allineamento header/barra e lazy mount vanno controllati a mano su device.

## File toccati

- `package.json` / `package-lock.json` — dipendenza `react-native-pager-view`.
- `src/navigation/tabs.js` — nuovo, configurazione delle tab.
- `src/navigation/AppNavigator.js` — riscritto (`NavigationContainer` + `MainTabs`).
- `src/navigation/MainTabs.js` — nuovo, pager + lazy + contesto di lock.
- `src/navigation/AppHeader.js` — nuovo, header replicato.
- `src/navigation/MainTabBar.js` — nuova, tab bar replicata.
- `src/navigation/PagerSwipeContext.js` — nuovo, contesto lock/unlock del pager.
- `src/components/MonthCarousel.js` — lock/unlock del pager al tocco.

## Vincoli

- Nuova dipendenza concordata: solo `react-native-pager-view`.
- Nessun commento aggiunto al codice.
- Commit conventional in italiano.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` → `Tutti i controlli di finanza/format/categorie passano.`; `npx expo export --platform android` → `Exported: dist`.
- Rebuild manuale del dev client richiesto prima della verifica su device.

## Limiti noti

- Durante lo swipe header e tab bar si allineano a fine gesto (comportamento standard per una barra in basso), non progressivamente durante il trascinamento.
- La priorità del carosello dipende dal lock impostato al `touchStart`; va confermata su device (in teoria il pager non intercetta il gesto una volta disabilitato).
