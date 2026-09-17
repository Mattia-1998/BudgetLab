# Budget Lab

**Versione:** 1.3.0  
**Piattaforma:** React Native (Expo)  
**Backend:** Firebase  

App mobile personale per la gestione di conti e movimenti finanziari, costruita con React Native ed Expo. I dati vengono sincronizzati su Cloud Firestore in tempo reale. Permette di gestire conti bancari, movimenti in entrata e uscita, trasferimenti Prelievo/Deposito tra conti, grafici delle spese per categoria, e monitorare la connessione con bufferizzazione offline.

---

## 🚀 Funzionalità Principali

### 🏠 Home
- Saldo totale calcolato da tutti i conti
- Entrate/uscite del mese corrente
- Grafico a torta delle spese per categoria (usando `react-native-gifted-charts`)
- Ultimi 10 movimenti in riepilogo

### 📋 Movimenti
- Ricerca libera per titolo/nota
- Filtri combinabili: tipo (entrate/uscite/trasferimenti), conto, categoria, mese
- **Multi-selezione categorie**: più categorie insieme (filtro OR), riga a posizione fissa `[Tutte] [Cibo] [Trasporti] [⌄]`, griglia espandibile con le restanti 9 (wrap da 4), freccia illuminata con filtro attivo
- MonthCarousel per scorrere i mesi
- Aggiunta, modifica e eliminazione movimenti
- Trasferimenti **Prelievo/Deposito** con controparte Contanti selezionabile (o creata automaticamente)
- Trasferimenti mostrati in grigio neutro con percorso "sorgente → destinazione"
- Sezione "Conto" a pill con pallino colore del conto associato
- Scroll unico con intestazione e lista nel `ListHeaderComponent`

### 💳 Conti
- Gestione conti bancari, carte e contanti
- Saldo sempre calcolato dai movimenti (via `accountBalance`)
- Card con pallino colore, etichette tipo (Carta / Conto Corrente / Contanti)
- Cestino diretto sulla card per eliminazione
- Riquadro "Totale saldi" con saldo totale di tutti i conti
- Barra full-width "Aggiungi conto" con modale creazione/modifica
- **12 palette colori** selezionabili per conto su due righe (viola, blu, verde, rosso, giallo, arancione e altri)

### 📊 Categorie di spesa
11 categorie predefinite: Cibo, Trasporti, Casa, Bollette, Salute, Svago, Sport, Auto, Stipendio, Shopping, Altro — ciascuna con icona e colore dedicati. Lo Stipendio è pensato per le entrate.

### 🔌 Modalità offline
- Indicatore di connessione in tempo reale (tramite `expo-network`)
- Banner giallo offline con messaggio "Offline"
- Le scritture offline vengono bufferizzate in memoria (`memoryLocalCache` di Firestore) e sincronizzate alla riconnessione

---

## 🛠️ Stack Tecnologico

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **React Native** | 0.86.3 | Framework mobile |
| **Expo** | 57.0.23 | Toolchain & runtime |
| **React Navigation** | 7.x (bottom-tabs 7.19.1) | Navigazione a tab |
| **Firebase** | 12.19.0 | Database (Firestore) in tempo reale |
| **react-native-gifted-charts** | 1.4.78 | Grafico a torta spese (Home) |
| **expo-network** | 57.0.2 | Rilevamento stato connessione |
| **expo-linear-gradient** | 57.0.2 | Gradiente grafici |
| **react-native-svg** | 15.15.4 | Rendering SVG (grafici) |
| **react-native-safe-area-context** | 5.7.0 | Safe area |
| **react-native-screens** | 4.26.0 | Navigazione nativa |

---

## 📦 Installazione

### Prerequisiti
- Node.js ≥ 20 (consigliato ≥ 20.19.4)
- npm
- Expo CLI: `npm install -g @expo/cli`
- Un progetto Firebase attivo (opzionale, se vuoi riconfigurare il backend)

### Setup Progetto
```bash
# Clona repository
cd Cobol

# Installa dipendenze
npm install

# Configura Firebase (opzionale)
# Se usi lo stesso progetto Firebase i campi sono già in firebase/config.js
# Per un nuovo progetto apri firebase/config.js e sostituisci i valori

# Avvia sviluppo
npx expo start
```

### Comandi Utili
```bash
npx expo start              # Avvia Expo Dev Server
npx expo start --android    # Avvia su emulatore Android
npx run:android             # Avvia build nativa Android (via Expo)
npx run:ios                 # Avvia su simulatore iOS (solo macOS)
npx expo start --web        # Avvia versione web
```

### Verifica logica pura
```bash
node --experimental-detect-module scripts/finance.spec.mjs
```
Esegue i test di business logic (calcolo saldi, formattazione valuta, categorie).  
Atteso: `Tutti i controlli di finanza/format/categorie passano.`

---

## ⚙️ Configurazione

### Firebase (`firebase/config.js`)
```javascript
export const FIREBASE_CONFIG = {
  apiKey: "TUA_API_KEY",
  authDomain: "TUO_PROGETTO.firebaseapp.com",
  projectId: "TUO_PROGETTO_ID",
  storageBucket: "TUO_PROGETTO.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
```

### Permessi Android (`app.json`)
L'app non richiede permessi speciali (nessuna camera, notifiche o storage nativo).  
Il pacchetto Android è: `com.mattia1998.budgetlab`  
Icone adaptive: foreground, background e monochrome in `assets/`.

---

## 📁 Struttura Progetto

```
Cobol/
├── App.js                          # Root (Necessario per Expo)
├── index.js                        # Entry point
├── app.json                        # Configurazione Expo
├── package.json                    # Dipendenze
├── firestore.rules                 # Regole Firestore (aperte)
├── firebase/
│   ├── config.js                   # Config Firebase (API key, ecc.)
│   └── db.js                       # Inizializzazione Firestore (memoryLocalCache)
│
├── src/
│   ├── navigation/
│   │   └── AppNavigator.js         # Navigatore principale a tab
│   │
│   ├── screens/
│   │   ├── HomeScreen.js           # Home: saldo, grafico torta, ultimi movimenti
│   │   ├── AccountsScreen.js       # Conti: card, totale saldi, barra aggiungi
│   │   └── TransactionsScreen.js   # Movimenti: ricerca, filtri, lista
│   │
│   ├── components/
│   │   ├── AccountFormModal.js     # Modale creazione/modifica conto
│   │   ├── AccountCards.js         # Card singolo conto (old layout, legacy)
│   │   ├── TransactionFormModal.js # Modale creazione/modifica movimento
│   │   ├── TransactionItem.js      # Singola riga movimento
│   │   ├── MonthCarousel.js        # Carosello mese animato
│   │   ├── ExpensePie.js           # Grafico a torta spese per categoria
│   │   ├── Segmented.js            # Filtro segmentato (Entrate/Uscite)
│   │   └── OfflineBanner.js        # Banner "Offline" con indicatore stato
│   │
│   ├── hooks/
│   │   ├── useAccounts.js          # Snapshot real-time conti Firestore
│   │   ├── useTransactions.js      # Snapshot real-time movimenti Firestore
│   │   └── useNetworkStatus.js     # Rilevamento connessione via expo-network
│   │
│   ├── constants/
│   │   └── categories.js           # 10 categorie spesa (chiave, label, icona, colore)
│   │
│   ├── theme/
│   │   └── colors.js               # Palette colori globale (primary, negative, background, ecc.)
│   │
│   └── utils/
│       ├── finance.js              # accountBalance, totals, income/outgoing, pie data
│       └── format.js               # formatCurrency (€), formatDate
│
├── scripts/
│   └── finance.spec.mjs            # Test unitari logica pura (saldo, formati, categorie)
│
└── assets/
    ├── icon.png
    ├── splash-icon.png
    ├── favicon.png
    └── android-icon-*.png          # Icone adaptive Android
```

---

## 🔥 Architettura Dati (Firestore)

### Collezioni Principali
| Collezione | Descrizione |
|------------|-------------|
| `accounts` | Conti utente (banca, carta, contanti) |
| `transactions` | Tutti i movimenti finanziari (entrate e uscite) |

### Esempio Documento Account
```javascript
{
  name: "Fineco",
  type: "carta",              // "carta" | "banca" | "contanti"
  color: "#4F46E5",           // colore card (HEX)
  initialBalance: 1200.50,    // saldo iniziale alla creazione
  createdAt: 1726464000000,   // timestamp ms
  code: "1234 5678 9101 1121" // opzionale: IBAN o numero carta
}
```

### Esempio Documento Transazione
```javascript
{
  accountId: "abc123",        // ID del conto associato
  amount: 85.50,              // importo in euro (≥ 0)
  kind: "expense",            // "income" | "expense"
  category: "cibo",           // chiave da CATEGORIES (cibo, trasporti, casa, ecc.)
  date: 1726550400000,        // timestamp ms della data
  note: "Spesa settimanale"   // opzionale
}
```

### Esempio Documento Trasferimento
```javascript
{
  kind: "transfer",           // terza tipologia
  direction: "prelievo",      // "prelievo" (conto → Contanti) | "deposito" (Contanti → conto)
  accountId: "carta123",      // ID del conto sorgente (i soldi escono)
  transferTo: "contanti123",  // ID del conto destinazione (i soldi arrivano)
  amount: 50,                 // importo in euro (≥ 0)
  date: 1726550400000,        // timestamp ms della data
  note: "Bancomat"            // opzionale (nessuna categoria)
}
```

---

## 🧪 Testing

```bash
node --experimental-detect-module scripts/finance.spec.mjs
```
Verifica la correttezza della logica pura:
- Calcolo saldi per conto (`accountBalance`)
- Somme totali, entrate e uscite
- Formattazione valuta (`formatCurrency`)
- Integrità lista categorie (`CATEGORIES.length === 11`)

---

## 📋 Changelog

- **1.3.0** — Multi-selezione categorie e nuove icone:
  - Selezionabili più categorie insieme nella schermata Movimenti (filtro OR): i movimenti mostrati appartengono ad almeno una categoria selezionata
  - Riga categorie a posizione fissa `[Tutte] [Cibo] [Trasporti] [⌄]`: le tile non si riordinano più alla selezione
  - Freccia "mostra di più" che espande la griglia con le restanti 9 categorie (wrap da 4) e si illumina quando è attivo un filtro con menu chiuso
  - "Tutte" azzera la selezione; al passaggio al filtro Trasferimenti la sezione Categoria viene nascosta e la selezione azzerata
  - Nuove icone app e icona adattiva Android; rimossi sfondo, monochrome, favicon e splash non utilizzati

- **1.2.0** — Palette colori ampliata, UX input e barra di navigazione:
  - **12 colori** per i conti (da 6): aggiunte prima riga integra le tinte viola/blu, seconda riga con verde, rosso, giallo, arancione, rosa e teal
  - Placeholder dei campi input ora visibili (hint grigi su sfondo bianco in modali e ricerca movimenti)
  - Tab bar fissa ancorata al fondo con stripe nera in corrispondenza della barra di navigazione Android
  - Safe area insets applicati alle modali (spazio corretto sotto i contenuti su device con barra gesture)
  - `expo-dev-client` in dev; build debug e release installabili insieme (`applicationIdSuffix .debug`)
  - Rimosso l'auto-hide della barra di sistema Android (sostituito da barra di navigazione nera fissa via plugin `withBlackNavigationBar`)

- **1.1.0** — Trasferimenti e saldi contanti:
  - Terza tipologia di movimento **Prelievo/Deposito**: trasferimento tra un conto non-contanti e il conto Contanti (auto-creato se mancante)
  - Selezione esplicita del conto **Contanti** controparte quando esistono più conti contanti (preselezionato il primo)
  - Trasferimenti in lista con icona e importo grigi, percorso "sorgente → destinazione" e filtro dedicato "Trasferimenti"
  - Saldi aggiornati su entrambi i lati (conto sorgente e destinazione), esclusi da grafico e riepiloghi mensili
  - Nuova categoria **Stipendio** (11 categorie totali)
  - In modifica, direzione e conti del trasferimento restano fissi (solo importo, data e nota)

- **1.0.0** — Release iniziale:
  - Home con saldo totale, grafico a torta spese, ultimi 10 movimenti
  - Movimenti: ricerca, filtri (tipo/conto/categoria/mese), scroll unico, sezione Conto a pill, griglia categorie 4 colonne, stato vuoto con card tratteggiata
  - Conti: card restilizzate (pallino, etichette tipo, saldo nero/rosso, cestino a destra), riquadro "Totale saldi", barra full-width "Aggiungi conto"
  - Tipo "Contanti" con formattazione valuta live e cursore prima del simbolo €
  - IBAN/carta opzionali per conti banca e carta
  - Modalità offline con banner di stato
  - Categorie: 10 predefinite (Cibo, Trasporti, Casa, Bollette, Salute, Svago, Sport, Auto, Shopping, Altro)

---

## 📋 Roadmap / TODO

- [ ] Autenticazione utente (Firebase Auth)
- [ ] Regole Firestore per sicurezza (attualmente aperte)
- [ ] Export/Import dati (CSV/Excel)
- [ ] Grafici tempororali (trend spese mensili/annuali)
- [ ] Budget mensili per categoria con alert
- [ ] Multi-utente con ruoli
- [ ] Widget Android/iOS per saldo rapido
- [ ] Backup automatico su Google Drive / iCloud

---

## 🤝 Contribuire

1. Fork del repository
2. Crea branch feature (`git checkout -b feature/nuova-funzionalita`)
3. Commit modifiche (`git commit -m 'Aggiunta nuova funzionalità'`)
4. Push branch (`git push origin feature/nuova-funzionalita`)
5. Apri Pull Request

---

## 📄 Licenza

Progetto personale - Tutti i diritti riservati.

---

## 👨‍💻 Autore

**Mattia Giroldini** - Sviluppatore  
Progetto: **Budget Lab** - Gestione personale conti e movimenti finanziari

---

## 📞 Supporto

Per segnalazioni bug o richieste funzionalità:
- Apri una **Issue** su GitHub

---

*Ultimo aggiornamento: Settembre 2026 - Versione 1.3.0*