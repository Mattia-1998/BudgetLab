# Budget Lab v1.0.0

App mobile personale per la gestione di conti e movimenti finanziari, costruita con Expo e React Native. I dati vengono sincronizzati su Cloud Firestore in tempo reale.

## Funzionalità

- **Home**: saldo totale, entrate/uscite del mese, grafico a torta delle spese per categoria, ultimi 10 movimenti.
- **Movimenti**: ricerca, filtri per tipo/conto/categoria/mese, aggiunta, modifica ed eliminazione.
- **Conti**: gestione conti con saldo sempre calcolato dai movimenti.
- Indicatore di connessione: i movimenti fatti offline vengono bufferizzati e sincronizzati alla riconnessione.

## Versione

**v1.0.0**

## Prerequisiti

- Node.js 20+
- Expo Go (Google Play) oppure emulatore Android
- Un progetto Firebase attivo

## Setup Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e crea un nuovo progetto.
2. Aggiungi un'app Web al progetto e copia i valori generati.
3. Attiva **Cloud Firestore**.
4. Apri `firebase/config.js`: se riparti da questo repo i campi sono già compilati per il progetto attivo; per impostare un nuovo progetto sostituiscili con i valori reali.
5. Nel tab **Rules** della console Firebase, pubblica le regole di `firestore.rules` per aprire l'accesso (regole aperte, senza autenticazione).

## Esecuzione

```bash
npm install
npx expo start
```

Scansiona il codice QR con Expo Go sul tuo dispositivo Android.

## Verifica logica pura

```bash
node --experimental-detect-module scripts/finance.spec.mjs
```

## Limiti

- App personale, pensata per un singolo utente.
- Regole Firestore aperte: nessun login, nessuna autenticazione.
- Su React Native la persistenza offline usa una cache in memoria (IndexedDB non è disponibile): i dati non letti durante la sessione richiedono una connessione per il primo caricamento.