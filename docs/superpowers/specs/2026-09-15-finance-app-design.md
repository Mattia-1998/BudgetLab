# App gestione economica personale — Design

Data: 2026-09-15

## Obiettivo

App Android per la gestione economica personale: tracciamento di entrate e uscite su più conti, con riassunto visivo (grafico spese, saldi conti, elenco movimenti) in una homepage.

## Stack

- **Expo (React Native)**, app Android in JavaScript. Progetto creato con `npx create-expo-app`.
- **Firebase Web SDK** (`firebase`, `firestore`) con config dentro l'app. Nessun login: app personale a utente singolo.
- **Navigazione**: bottom tab bar con tab "Home", "Movimenti", "Conti" e pulsante flottante "+" per aggiungere un movimento.
- **Grafico a torta/donut**: `react-native-gifted-charts`.
- **Firestore** come unica fonte dati, con persistenza offline attivata.

## Architettura

- Aggiunte/modifiche sono scritture dirette su Firestore. Nessuna coda di sincronizzazione custom: Firestore gestisce la persistenza offline (SDK web: `enableIndexedDbPersistence(firestore)`).
- I saldi non vengono mai salvati: derivati sommando i movimenti.
- L'app funziona senza rete; le scritture in coda vengono sincronizzate alla riconnessione.
- Indicatore di stato connessione (offline / sincronizzazione) presente in Home.

## Modello dati

### Collezione `accounts`

Documento (id auto generato):
```
{
  name:        string,   // es. "Intesa"
  type:        "banca" | "contante" | "carta",
  color:       string,   // es. "#1B5E20"
  createdAt:   timestamp
}
```

### Collezione `transactions`

Documento (id auto generato):
```
{
  accountId:   string,      // riferimento a un account
  amount:      number,      // sempre positivo
  kind:        "income" | "expense",
  category:    string,      // chiave categoria
  date:        timestamp,
  note:        string       // opzionale
}
```

### Calcoli derivati (mai salvati)

- **Saldo conto** = somma entrate − somma uscite di quel conto.
- **Totale saldi** = somma dei saldi di tutti i conti.
- **Spese per categoria** = somme delle uscite del mese selezionato raggruppate per categoria.
- Il saldo reale iniziale di un conto si rappresenta come una "entrata iniziale".

### Categorie fisse

Cibo, Trasporti, Casa, Bollette, Salute, Svago, Shopping, Altro. Ognuna con icona e colore.

### Sicurezza Firestore

App personale senza login: per ora regole aperte (`allow read, write` su `accounts` e `transactions`). Limite noto e accettato: chiunque abbia la config potrebbe leggere/scrivere i dati. Da rivisitare se l'app diventerà condivisa.

## Schermate

### Home (riassunto)

- In alto: selettore mese (‹ mese › e anno).
- Card orizzontali scorrevoli, una per conto: nome, saldo (verde positivo, rosso negativo), con totale combinato sopra.
- Grafico a torta "Spese per categoria" del mese selezionato; al tocco di una fetta mostra importo e percentuale.
- Elenco ultimi movimenti del mese: icona categoria, descrizione, data, importo (verde + entrata, rosso − uscita).
- Tap su un movimento → aperto in modifica.
- Indicatore offline/sincronizzazione.

### Movimenti

- Lista completa con filtri (conto, categoria, tipo, mese) e ricerca per testo.
- Tap su movimento → modifica. Pulsante per eliminare.
- Pulsante "+" per aggiungere.

### Modale "Nuovo movimento" / "Modifica movimento"

- Importo, tipo (entrata/uscita), categoria con icone, conto, data, nota.
- Pulsanti Salva/Annulla.

### Conti

- Elenco conti con saldo e pulsante "+" per aggiungere (nome, tipo, colore).
- Modifica/eliminazione; l'eliminazione di un conto con movimenti collegati richiede conferma.

### Schermata tab "Conti" vs modali

Le schermate di creazione/modifica movimenti e conti sono modali (sovrapposte) per non allungare la navigazione.

## Gestione errori

- Messaggi inline nei form (es. "Importo non valido").
- Banner/alert se un'operazione Firestore fallisce definitivamente.

## Verifica

Nessun test automatico in questa versione: verifica manuale su emulatore Android o telefono con Expo Go.

## Fuori scope (v1)

- Budget per categoria.
- Spese ricorrenti automatiche.
- Sincronizzazione bancaria automatica / import CSV.
- Multiutente / login.
- Test automatici.