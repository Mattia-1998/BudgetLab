# Design: Selettore mese a carosello

**Data:** 2026-09-16 · **Stato:** approvato

## Obiettivo

Sostituire il selettore mese a riga (frecce `<`/`>` + testo centrale) con un carosello orizzontale moderno: mese corrente centrale in evidenza (grassetto), mesi precedente/successivo ai lati in opacità ridotta e leggermente arretrati per l'effetto profondità, frecce discrete ai bordi estremi. Applicato a **Home** e **Movimenti**. Modifica puramente visiva/interattiva: struttura della schermata, card, sezioni e barra tab invariati.

## Componente

Nuovo componente `src/components/MonthCarousel.js` costruito con primitivi React Native core (`Animated`, `PanResponder`). **Nessuna dipendenza nuova.**

### Layout

```
< chevron-left │   Ago 2026   │   Set 2026   │   Ott 2026   │ chevron-right >
               │   0.45 opacity│  bold, 17px  │  0.45 opacity│
```

- **Centro**: mese corrente, `fontWeight: bold`, colore `colors.text`, dimensione `17`.
- **Lati**: mese precedente a sinistra, successivo a destra; `opacity: 0.45`, dimensione `13`, lieve `translateY` verso il basso (effetto arretrato). Non selezionabile visivamente come il centro.
- **Frecce**: ai bordi estremi, dimensione `18`, colore `colors.primary`, tappabili.

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
- **Swipe orizzontale** (`PanResponder`): scorrimento verso sinistra → mese successivo; verso destra → mese precedente. Soglia `60px` e velocità. Animazione `Animated.spring` di spostamento laterale in tempo reale sul fascio dei tre testi (follow del dito), con scatto che mostra i tre testi nella nuova posizione.
- **Doppio tap sul centro**: invoca `onAll()` (toggle "Tutti i mesi"). Inerte se `onAll` non passato (caso Home).
- **Stato `allActive`**: swipe disabilitato; mesi laterali visibili ma non tappabili e ulteriormente sfumati; frecce attive (scelgono il mese di riferimento). Il centro mostra `label` ("Tutti i mesi").
- **Transizione**: ogni cambio mese anima l'ingresso del nuovo centro (fade + slide).

## Integrazione

| File | Modifica |
|------|----------|
| `src/components/MonthCarousel.js` | **Create** — nuovo componente |
| `src/screens/HomeScreen.js` | **Modify** — sostituisce `MonthlyNav` con `MonthCarousel` (senza `onAll`) |
| `src/screens/TransactionsScreen.js` | **Modify** — sostituisce `MonthlyNav`, rimuove la riga "Torna al mese corrente", passa `onAll`/`allActive` |
| `src/components/MonthlyNav.js` | **Delete** — nessun altro utilizzo |

## Vincoli e coerenza

- Nessuna nuova dipendenza in `package.json`.
- Colori dal tema centralizzato `src/theme/colors.js` (primary/text/textMuted).
- Logica di business (range mesi, totale, categorie) intoccata.
- Verifica: `node --experimental-detect-module scripts/finance.spec.mjs` + `npx expo export --platform android`.