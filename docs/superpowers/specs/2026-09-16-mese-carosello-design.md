# Design: Selettore mese a carosello

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

Sostituire il selettore mese a riga (frecce `<`/`>` + testo centrale) con un carosello orizzontale moderno in stile **banking app**: il mese corrente in un chip bianco rialzato (ombra + bordo) al centro, i mesi precedente/successivo come testo grigio chiaro ai lati (effetto "peek"), frecce in cerchietti bianchi ai bordi esterni. Applicato a **Home** e **Movimenti**. Modifica puramente visiva/interattiva: struttura della schermata, card, sezioni e barra tab invariati.

Stile di riferimento fornito dall'utente in HTML/Tailwind (pill grigia `bg-gray-100` arrotondata p-2, frecce `bg-white/80 rounded-full shadow text-indigo-700`, chip centrale `bg-white rounded-xl shadow-md border scale-105` con testo 16px bold, mesi laterali `text-gray-400 text-sm font-medium`, gruppo centrato con spaziatura `space-x-6`).

## Componente

Nuovo componente `src/components/MonthCarousel.js` costruito con primitivi React Native core (`Animated`, `PanResponder`). **Nessuna dipendenza nuova.**

### Layout

```
┌───────────────────────────────────────────────┐  pill grigia trackBg, rounded 18, overflow hidden
│  ⇐  Ago 2026   [ Settembre 2026 ]  Ott 2026  ⇒ │
└───────────────────────────────────────────────┘
     freccia       chip bianco rialzato            freccia
```

- **Pill**: contenitore `backgroundColor: colors.trackBg` (`#ECEDF0`), `borderRadius: 18`, `paddingVertical: 6`, `paddingHorizontal: 8`, `overflow: 'hidden'`, `marginVertical: 6`. In Home incorniciata con margine orizzontale 16 (allineata alle card); in Movimenti eredita il padding 16 dei filtri.
- **Frecce**: cerchietti bianchi (`colors.surface`) 32×32, raggio 16, ombra leggera, icona chevron 16px `colors.primary`. Sempre esterne alla zona dei testi.
- **Centro**: chip bianco (`colors.surface`) `borderRadius: 12`, `paddingHorizontal: 16`, `paddingVertical: 6`, bordo `colors.chipBorder` (`#E5E6EA`), ombra (elevation 3). Testo 16px bold `colors.text`. Doppio tap → toggle "Tutti i mesi".
- **Lati**: testo 14px `fontWeight: 500` `colors.faintText` (`#9CA3AF`), tappabili (slide). Non arretrati verticalmente.
- **Geometria**: i tre elementi vivono in un **gruppo centrato** (`flexDirection: row`, `gap: 24`) dentro un palco `flex: 1` con `overflow: hidden` e `justifyContent: center`. La distanza di scorrimento `slot` è misurata a runtime con `onLayout` sulle larghezze reali: `slot = (prevW + chipW) / 2 + GAP`. L'animazione muove **un solo valore condiviso** `translateX` applicato al gruppo. Il testo laterale, se più largo del palco, viene tagliato ai bordi del palco (mai sotto le frecce).

### Props

```js
<MonthCarousel
  month={month}         // Date attivo
  label={label}         // testo centrale (mese normale oppure "Tutti i mesi")
  onPrev={prev}         // funzione: vai al mese precedente
  onNext={next}         // funzione: vai al mese successivo
  onAll={setAllMonths}  // opzionale: doppio tap sul centro, toggle modalità "Tutti"
  allActive={allMonths} // opzionale: quando true, centro = "Tutti i mesi"
/>
```

Labele dei mesi laterali calcolate internamente con `formatMonthLabel` (es. "Settembre 2026"). Gestione `prev`/`next` e intervallo dati resta invariata nelle schermate.

### Interazioni

- **Tap su mese laterale**: seleziona quel mese (sinistra → `onPrev`, destra → `onNext`).
- **Swipe orizzontale** (`PanResponder`): scorrimento verso sinistra → mese successivo; verso destra → mese precedente. Soglia `max(30, 40% della larghezza slot)` e velocità (flick veloce sotto soglia cambia comunque mese). Animazione di spostamento laterale in tempo reale sul gruppo dei tre elementi (follow del dito), con scatto che li fa scorrere di una larghezza slot e mostra i tre elementi nella nuova posizione.
- **Doppio tap sul centro**: invoca `onAll()` (toggle "Tutti i mesi"). Inerte se `onAll` non passato (caso Home).
- **Stato `allActive`**: swipe disabilitato; mesi laterali visibili ma non tappabili e sfumati (`opacity: 0.3`); frecce attive (scelgono il mese di riferimento). Il centro mostra `label` ("Tutti i mesi").
- **Transizione**: ogni cambio mese anima l'ingresso del nuovo centro (fade).

## Integrazione

| File | Modifica |
|------|----------|
| `src/components/MonthCarousel.js` | **Create** — nuovo componente |
| `src/screens/HomeScreen.js` | **Modify** — sostituisce `MonthlyNav` con `MonthCarousel` (senza `onAll`) |
| `src/screens/TransactionsScreen.js` | **Modify** — sostituisce `MonthlyNav`, rimuove la riga "Torna al mese corrente", passa `onAll`/`allActive` |
| `src/components/MonthlyNav.js` | **Delete** — nessun altro utilizzo |

## Vincoli e coerenza

- Nessuna nuova dipendenza in `package.json`.
- Colori dal tema centralizzato `src/theme/colors.js`. Nuovi token per lo stile banking: `trackBg` (pill), `faintText` (mesi laterali), `chipBorder` (bordo chip).
- Logica di business (range mesi, totale, categorie) intoccata.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` + `npx expo export --platform android`.