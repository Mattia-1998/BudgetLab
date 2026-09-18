# Stile categorie condiviso tra form e Movimenti — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere le tile categoria del form "Nuovo movimento" identiche per stile e comportamento visivo a quelle della pagina Movimenti, tramite un componente condiviso.

**Architecture:** Si estrae la tile presentazionale `CategoryTile` da `TransactionsScreen` e si riusa in `TransactionFormModal`. `CategoryTile` è l'unica fonte di verità per aspetto e stato attivo; i chiamanti passano `width` calcolata e gestiscono selezione/onPress.

**Tech Stack:** React Native 0.86.3, Expo SDK 57, `@expo/vector-icons` (Ionicons). Nessuna nuova dipendenza.

## Global Constraints

- Non aggiungere commenti al codice.
- Nessuna nuova dipendenza; nessuna modifica a Firestore, categorie o logica pura.
- Si lavora direttamente su `main`.
- Messaggi di commit in italiano, stile conventional, senza accenti in parole a rischio.
- Non esiste un test automatico per i componenti UI. La verifica obbligatoria è:
  - `node --experimental-detect-module scripts/finance.spec.mjs` → `Tutti i controlli di finanza/format/categorie passano.`
  - `npx expo export --platform android` → `Exported: dist`
- La verifica visiva finale è manuale su device (dev client, Fast Refresh JS sufficiente: nessuna modifica nativa).
- Valori di stile esatti da replicare (attuali `catTileBase`): `height: 78`, `borderRadius: 16`, `borderWidth: 1`, `borderColor: '#E5E7EB'`, `backgroundColor: '#fff'`, `alignItems: 'center'`, `justifyContent: 'center'`, `gap: 4`; icona `size 22`; testo `fontSize: 11`, `fontWeight: '500'`, `color: '#374151'`; attivo → sfondo e bordo = colore categoria, icona e testo `#fff`, testo `fontWeight: '600'`.

---

### Task 1: Componente `CategoryTile` e migrazione di Movimenti

**Files:**
- Create: `src/components/CategoryTile.js`
- Modify: `src/screens/TransactionsScreen.js`

**Interfaces:**
- Consumes: niente (task iniziale).
- Produces: componente default `CategoryTile` con props:
  - `icon: string` — nome icona Ionicons
  - `label: string` — testo
  - `color: string` — colore categoria (HEX)
  - `active: boolean` — stato selezionato
  - `width: number` — larghezza tile
  - `inactiveColor?: string` — colore icona quando inattivo; default `color`
  - `onPress: function`

- [ ] **Step 1: Creare `src/components/CategoryTile.js`**

```jsx
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryTile({ icon, label, color, active, width, inactiveColor, onPress }) {
  return (
    <Pressable style={[styles.tile, { width }, active && { backgroundColor: color, borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? '#fff' : (inactiveColor ?? color)} />
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 },
  text: { fontSize: 11, fontWeight: '500', color: '#374151' },
  textActive: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 2: Importare `CategoryTile` in `TransactionsScreen.js`**

Aggiungere l'import accanto agli altri componenti:

```jsx
import CategoryTile from '../components/CategoryTile';
```

- [ ] **Step 3: Sostituire la tile "Tutte"**

Sostituire il `Pressable` della tile "Tutte" (dentro `styles.catGrid`) con:

```jsx
<CategoryTile
  icon="apps-outline"
  label="Tutte"
  color="#111827"
  inactiveColor={colors.textMuted}
  active={selectedCategories.length === 0}
  width={tileWidth}
  onPress={() => setSelectedCategories([])}
/>
```

- [ ] **Step 4: Sostituire le tile di `central`**

Sostituire il blocco `{central.map((key) => { ... })}` con:

```jsx
{central.map((key) => {
  const c = CATEGORY_MAP[key];
  return (
    <CategoryTile
      key={key}
      icon={c.icon}
      label={c.label}
      color={c.color}
      active={selectedCategories.includes(key)}
      width={tileWidth}
      onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}
    />
  );
})}
```

- [ ] **Step 5: Sostituire le tile di `rest`**

Sostituire il blocco `{categoriesExpanded ? rest.map((key) => { ... }) : null}` con:

```jsx
{categoriesExpanded
  ? rest.map((key) => {
      const c = CATEGORY_MAP[key];
      return (
        <CategoryTile
          key={key}
          icon={c.icon}
          label={c.label}
          color={c.color}
          active={selectedCategories.includes(key)}
          width={tileWidth}
          onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}
        />
      );
    })
  : null}
```

- [ ] **Step 6: Rimuovere gli stili migrati**

Dal `StyleSheet` di `TransactionsScreen.js` rimuovere le chiavi `catTileBase`, `catAllActive`, `catText`, `catTextActive`. Mantenere `catGrid` e `catTileArrow` (la tile freccia resta locale).

- [ ] **Step 7: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: `Exported: dist` senza errori.

- [ ] **Step 8: Verifica manuale (Movimenti invariato)**

Su device: nella pagina Movimenti le tile categoria si vedono e si comportano come prima (multi-selezione, tile "Tutte" con icona grigia quando inattiva, freccia expand/collapse).

- [ ] **Step 9: Commit**

```bash
git add src/components/CategoryTile.js src/screens/TransactionsScreen.js
git commit -m "refactor: estrae CategoryTile condivisa per le categorie"
```

---

### Task 2: Migrazione del form "Nuovo movimento"

**Files:**
- Modify: `src/components/TransactionFormModal.js`

**Interfaces:**
- Consumes: `CategoryTile` da Task 1 (props come definito sopra).
- Produces: griglia categorie del form con tile riempite a colore e selezione singola.

- [ ] **Step 1: Aggiornare gli import**

In `TransactionFormModal.js`:

- Aggiungere `useWindowDimensions` all'import da `react-native` (l'import attuale è `Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform`).
- Rimuovere l'import `import { Ionicons } from '@expo/vector-icons';` (dopo la migrazione non è più usato nel file).
- Aggiungere `import CategoryTile from './CategoryTile';`.

- [ ] **Step 2: Calcolare `tileWidth`**

Dentro il componente, dopo `const insets = useSafeAreaInsets();`, aggiungere:

```jsx
const { width } = useWindowDimensions();
const tileWidth = Math.floor((width - 64) / 4);
```

- [ ] **Step 3: Sostituire la griglia categorie**

Sostituire il blocco:

```jsx
<View style={styles.catGrid}>
  {SPENDING_CATEGORIES.map((c) => {
    const active = category === c.key;
    return (
      <Pressable key={c.key} style={[styles.cat, active && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setCategory(c.key)}>
        <Ionicons name={c.icon} size={20} color={c.color} />
        <Text style={styles.catText}>{c.label}</Text>
      </Pressable>
    );
  })}
</View>
```

con:

```jsx
<View style={styles.catGrid}>
  {SPENDING_CATEGORIES.map((c) => (
    <CategoryTile
      key={c.key}
      icon={c.icon}
      label={c.label}
      color={c.color}
      active={category === c.key}
      width={tileWidth}
      onPress={() => setCategory(c.key)}
    />
  ))}
</View>
```

- [ ] **Step 4: Aggiornare gli stili**

- In `catGrid` aggiungere `gap: 8` (mantenere `flexDirection: 'row'`, `flexWrap: 'wrap'`, `marginBottom: 10`).
- Rimuovere le chiavi di stile `cat` e `catText`.

- [ ] **Step 5: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: `Exported: dist` senza errori.

- [ ] **Step 6: Verificare la logica pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 7: Verifica manuale (form)**

Su device: nel form "Nuovo movimento" selezionando una categoria la tile si riempie del colore con icona e testo bianchi; il tap cambia la selezione (una sola attiva); salvataggio e modifica invariati.

- [ ] **Step 8: Commit**

```bash
git add src/components/TransactionFormModal.js
git commit -m "feat: stile categorie del form come nella pagina Movimenti"
```

---

## Self-Review

- **Copertura spec:** componente condiviso (Task 1), migrazione Movimenti ed eliminazione stili (Task 1), migrazione form con `tileWidth`, gap e rimozione stili (Task 2), verifica build/logica/manuale (entrambi i task). Nessun requisito dello spec senza task.
- **Placeholder:** nessun "TBD"/"TODO"; ogni step di codice contiene il codice reale.
- **Coerenza tipi/nomi:** `CategoryTile` e le sue props sono identiche tra Task 1 e Task 2; `tileWidth` definita nel Task 2 prima dell'uso; `inactiveColor` opzionale come da spec.
