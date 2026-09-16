# Finance App

App mobile personale per la gestione di conti e movimenti finanziari, costruita con Expo e React Native. I dati vengono sincronizzati su Cloud Firebase in tempo reale.

## Prerequisiti

- Node.js 20+
- Expo Go (Google Play) oppure emulatore Android
- Un progetto Firebase attivo

## Setup Firebase

1. Vai su [console.firebase.google.com](https://console.firebase.google.com) e crea un nuovo progetto.
2. Aggiungi un'app Web al progetto e copia i valori generati.
3. Attiva **Cloud Firestore** in modalità di produzione.
4. Apri `firebase/config.js` e sostituisci i placeholder `INSERISCI-*` con i valori reali del tuo progetto Firebase.
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
- Tutti i dati sono sincronizzati sul cloud Firebase.
