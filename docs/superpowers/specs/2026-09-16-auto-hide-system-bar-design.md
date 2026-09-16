# Design: Auto-hide barra di sistema Android

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

Dopo 5 secondi di inattività (nessun tocco sull'app), la **barra di sistema Android** (tasti di navigazione) si nasconde automaticamente. Quando scompare, la tab bar dell'app (Home, Movimenti, Conti) deve scendere fino al bordo inferiore dello schermo senza lasciare alcun bordo bianco. La barra di sistema riappare con lo swipe dal bordo inferiore (comportamento nativo Android ed edge-to-edge obbligatorio), e la tab bar risale parallelamente per non essere coperta. Nessuna modifica su iOS (non esiste la barra di sistema).

## Scelte decise con l'utente

- **Timeout di inattività**: 5 secondi.
- **Riapparizione**: swipe dal bordo inferiore; l'utente ha chiesto il comportamento "inset" (barra che spinge su i contenuti, i tasti della tab bar mai coperti).
- **Vincolo SDK 57**: le API `setBehaviorAsync()`/`inset-swipe` **non esistono più** in expo-navigation-bar SDK 57 (Android 15+ impone edge-to-edge; il reveal nativo è solo overlay temporaneo). L'effetto "push" viene quindi **simulato in JS**: con `NavigationBar.useVisibility()` la tab bar usa `paddingBottom = insets.bottom` quando la barra è visibile e `0` quando è nascosta, con `LayoutAnimation`. Risultato percepito identico all'inset-swipe.
- **Piattaforma**: solo Android (`Platform.OS === 'android'`); su iOS l'hook è inerte.
- **Tab bar ancorata al fondo** quando la barra di sistema è nascosta (`paddingBottom: 0`), con transizione fluida via `LayoutAnimation`.

## Dipendenza

Aggiungere `expo-navigation-bar` (`npx expo install expo-navigation-bar`). Funziona in Expo Go, nessuna config plugin aggiuntiva, nessuna modifica al progetto nativo `android/` (rigenerato da prebuild).

Nota API: in SDK 57 `NavigationBar.setHidden()` (imperativo, corrente) e `NavigationBar.useVisibility()` (hook, deprecato ma funzionante) sono le uniche API di visibilità disponibili.

## Componenti

### Nuovo hook `src/hooks/useAutoHideSystemBar.js`

- Ritorna `{ hidden, resetTimer }` dove `hidden = visibility === 'hidden'` (da `NavigationBar.useVisibility()`, `null` all'inizializzazione → trattato come visibile).
- Solo Android: su iOS ritorna `{ hidden: false, resetTimer: noop }`.
- All'avvio (montaggio) avvia il timer da 5s.
- `resetTimer()`: azzera il timer e lo riavvia da 5s. Chiamata a ogni touch sull'app e a ogni ritorno in foreground (`AppState` → `'active'`).
- A timer scaduto: `NavigationBar.setHidden(true)` (in `try/catch`).
- Cleanup (smontaggio): `NavigationBar.setHidden(false)`, clear del timer.

### `src/navigation/AppNavigator.js`

- Usare `useSafeAreaInsets()` e l'hook `useAutoHideSystemBar()`.
- Rendere un `View` radice `flex: 1` con `onTouchStart={resetTimer}` attorno a `<NavigationContainer>`: ogni tocco nell'app (anche su ScrollView/Pressable, i touch bubblano) azzera il timer. Un'unica istanza dell'hook.
- `tabBarStyle: { paddingBottom: hidden ? 0 : insets.bottom }`.
- Prima di cambiare stato `hidden`: `LayoutAnimation.easeInEaseOut()` per la transizione fluida (la tab bar scivola in fondo quando la barra si nasconde, risale quando la barra è visibile).

## Flusso risultante

1. All'avvio: barra di sistema visibile, tab bar in posizione normale (sopra l'inset).
2. L'utente tocca l'app → il timer si azzera a ogni tocco → la barra resta visibile.
3. L'utente smette di toccare → dopo 5s la barra di sistema scompare e la tab bar scivola fino al bordo (nessun bordo bianco).
4. Swipe dal bordo inferiore → la barra di sistema riappare (overlay temporaneo) e, via `useVisibility()`, la tab bar risale sopra di essa; dopo l'inattività il sistema la rimasconde e la tab bar riscende.
5. Chiusura app → ripristinata visibile.

## Comportamenti e stati limite

- **Inattività mentre la barra è già nascosta**: il timer continua ad azzerarsi con i touch; nessun effetto aggiuntivo.
- **Foreground/background**: il ritorno in foreground azzera il timer (la barra non si nasconde appena riapri l'app se riprendi a usarla).
- **Errore API**: tutte le chiamate `expo-navigation-bar` in `try/catch`; un errore non deve rompere l'app (la barra resta come da sistema).
- **iOS**: nessun effetto visibile.

## Error handling

- `setHidden` eseguita in `try/catch` con `.catch()` silenzioso.
- `useVisibility()` restituisce `null` durante l'inizializzazione: trattarlo come `visible` per evitare che la tab bar salti in fondo all'avvio.
- Nessun crash se `expo-navigation-bar` non fosse disponibile.

## Verifica

- Manuale su dispositivo/emulatore Android: inattività 5s → barra scompare e tab bar scende al fondo; swipe → barra riappare spingendo su la tab bar; tocco → timer azzerato; su iOS nessun effetto.
- `node --experimental-detect-module scripts/finance.spec.mjs` (atteso: "Tutti i controlli … passano").
- `npx expo export --platform android` (atteso: "Exported: dist").

## Vincoli e coerenza

- Nessuna modifica alla logica di business (saldi, transazioni, conti).
- Stile: nessun token colore nuovo; la tab bar mantiene lo stile attuale.
- Commit frequenti sul branch corrente (`main`). Push solo su richiesta dell'utente.