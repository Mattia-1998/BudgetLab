# Swipe tra le tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere lo swipe orizzontale tra le tre schermate (Home, Movimenti, Conti) mantenendo identici header e tab bar attuali.

**Architecture:** Si sostituisce `createBottomTabNavigator` con un componente `MainTabs` basato su `react-native-pager-view` (pagina che segue il dito). Header e tab bar vengono replicati con i primitivi ufficiali di `@react-navigation/elements` (stesso tema di default, stesso look). Il carosello del mese ha priorità: al tocco blocca lo scroll del pager tramite metodo imperativo.

**Tech Stack:** React Native 0.86 / Expo SDK 57, `react-native-pager-view`, `@react-navigation/elements`, `@react-navigation/native`, `react-native-safe-area-context`, `@expo/vector-icons`.

## Global Constraints

- Unica nuova dipendenza: `react-native-pager-view` (installata con `npx expo install react-native-pager-view`).
- Nessun commento aggiunto al codice.
- Commit conventional in italiano (senza accenti nelle parole a rischio).
- Le tre schermate (`HomeScreen`, `TransactionsScreen`, `AccountsScreen`) non usano hook di navigazione e non vanno modificate.
- Verifica automatica di ogni task: `npx expo export --platform android` → termina con `Exported: dist`.
- Verifica della suite pura (invariata): `node --experimental-detect-module scripts/finance.spec.mjs` → `Tutti i controlli di finanza/format/categorie passano.`
- I controlli visivi/su gesto richiedono il rebuild manuale del dev client (`npx expo run:android`) e non sono verificabili staticamente.

---

### Task 1: Shell di swipe (dipendenza, header, tab bar, pager)

**Files:**
- Modify: `package.json`, `package-lock.json` (dipendenza)
- Create: `src/navigation/tabs.js`
- Create: `src/navigation/AppHeader.js`
- Create: `src/navigation/MainTabBar.js`
- Create: `src/navigation/MainTabs.js`
- Modify: `src/navigation/AppNavigator.js`

**Interfaces:**
- Consumes: `HomeScreen`, `TransactionsScreen`, `AccountsScreen` (default export, nessuna prop).
- Produces:
  - `TABS` da `src/navigation/tabs.js`: array di `{ name, title, icon, component }`.
  - `AppHeader({ title })` default export.
  - `MainTabBar({ tabs, index, onSelect })` default export; `tabs` è `TABS`, `onSelect(i: number)`.
  - `MainTabs()` default export.
  - `AppNavigator()` default export (invariato per `App.js`).

- [ ] **Step 1: Installare la dipendenza**

Run: `npx expo install react-native-pager-view`
Expected: aggiunge `react-native-pager-view` a `package.json` e aggiorna `package-lock.json`.

- [ ] **Step 2: Creare la configurazione delle tab**

Create `src/navigation/tabs.js`:

```js
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';

export const TABS = [
  { name: 'Home', title: 'Home', icon: 'home-outline', component: HomeScreen },
  { name: 'Movimenti', title: 'Movimenti', icon: 'swap-vertical-outline', component: TransactionsScreen },
  { name: 'Conti', title: 'Conti', icon: 'wallet-outline', component: AccountsScreen },
];
```

- [ ] **Step 3: Creare l'header replicato**

Create `src/navigation/AppHeader.js`:

```js
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { HeaderBackground, HeaderTitle, getDefaultHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function AppHeader({ title }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = getDefaultHeaderHeight({ width, height }, false, insets.top);

  return (
    <View style={[styles.container, { height: headerHeight }]}>
      <HeaderBackground style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <HeaderTitle>{title}</HeaderTitle>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 4: Creare la tab bar replicata**

Create `src/navigation/MainTabBar.js`:

```js
import { View, StyleSheet } from 'react-native';
import { PlatformPressable, Label } from '@react-navigation/elements';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function MainTabBar({ tabs, index, onSelect }) {
  const insets = useSafeAreaInsets();
  const { fonts } = useTheme();

  return (
    <View style={[styles.bar, { height: 58 + insets.bottom }]}>
      <View style={styles.row}>
        {tabs.map((tab, i) => {
          const focused = i === index;
          const color = focused ? colors.primary : colors.textMuted;
          return (
            <PlatformPressable
              key={tab.name}
              onPress={() => onSelect(i)}
              android_ripple={{ borderless: true }}
              pressOpacity={1}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              style={styles.item}
            >
              <Ionicons name={tab.icon} size={25} color={color} />
              <Label style={[styles.label, fonts.medium]} tintColor={color}>{tab.title}</Label>
            </PlatformPressable>
          );
        })}
      </View>
      <View style={[styles.navBarStrip, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D8D8D8',
    elevation: 8,
  },
  row: { flex: 1, flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', flexDirection: 'column', padding: 5 },
  label: { fontSize: 10 },
  navBarStrip: { backgroundColor: '#000000' },
});
```

- [ ] **Step 5: Creare MainTabs (pager eager)**

Create `src/navigation/MainTabs.js`:

```js
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TABS } from './tabs';
import AppHeader from './AppHeader';
import MainTabBar from './MainTabBar';
import { colors } from '../theme/colors';

export default function MainTabs() {
  const pagerRef = useRef(null);
  const [index, setIndex] = useState(0);

  const selectTab = useCallback((i) => {
    if (i === index) return;
    setIndex(i);
    pagerRef.current?.setPage(i);
  }, [index]);

  return (
    <View style={styles.container}>
      <AppHeader title={TABS[index].title} />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setIndex(e.nativeEvent.position)}
      >
        {TABS.map((tab) => {
          const Screen = tab.component;
          return (
            <View key={tab.name} style={styles.page} collapsable={false}>
              <Screen />
            </View>
          );
        })}
      </PagerView>
      <MainTabBar tabs={TABS} index={index} onSelect={selectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { width: '100%', height: '100%', backgroundColor: colors.background },
});
```

- [ ] **Step 6: Riscrivere il navigator**

Replace the whole content of `src/navigation/AppNavigator.js` with:

```js
import { NavigationContainer } from '@react-navigation/native';
import MainTabs from './MainTabs';

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}
```

- [ ] **Step 7: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`, nessun errore di risoluzione modulo.

- [ ] **Step 8: Verificare la suite pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src/navigation/tabs.js src/navigation/AppHeader.js src/navigation/MainTabBar.js src/navigation/MainTabs.js src/navigation/AppNavigator.js
git commit -m "feat: swipe tra le tab con pager-view"
```

---

### Task 2: Caricamento lazy delle pagine nel pager

**Files:**
- Modify: `src/navigation/MainTabs.js`

**Interfaces:**
- Consumes: `TABS` da `./tabs`.
- Produces: comportamento interno a `MainTabs` (nessuna nuova prop esterna).

- [ ] **Step 1: Sostituire MainTabs con la versione lazy**

Replace the whole content of `src/navigation/MainTabs.js` with:

```js
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TABS } from './tabs';
import AppHeader from './AppHeader';
import MainTabBar from './MainTabBar';
import { colors } from '../theme/colors';

export default function MainTabs() {
  const pagerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState([0]);

  const ensureLoaded = useCallback((i) => {
    if (i < 0 || i >= TABS.length) return;
    setLoaded((prev) => (prev.includes(i) ? prev : [...prev, i]));
  }, []);

  const selectTab = useCallback((i) => {
    if (i === index) return;
    ensureLoaded(i);
    setIndex(i);
    pagerRef.current?.setPage(i);
  }, [index, ensureLoaded]);

  return (
    <View style={styles.container}>
      <AppHeader title={TABS[index].title} />
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        offscreenPageLimit={2}
        onPageSelected={(e) => {
          const i = e.nativeEvent.position;
          ensureLoaded(i);
          setIndex(i);
        }}
        onPageScroll={(e) => {
          const { position, offset } = e.nativeEvent;
          ensureLoaded(position);
          if (offset > 0) ensureLoaded(position + 1);
        }}
      >
        {TABS.map((tab, i) => {
          const Screen = tab.component;
          return (
            <View key={tab.name} style={styles.page} collapsable={false}>
              {loaded.includes(i) ? <Screen /> : null}
            </View>
          );
        })}
      </PagerView>
      <MainTabBar tabs={TABS} index={index} onSelect={selectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { width: '100%', height: '100%', backgroundColor: colors.background },
});
```

- [ ] **Step 2: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/MainTabs.js
git commit -m "feat: caricamento lazy delle pagine nel pager"
```

---

### Task 3: Priorità al carosello del mese

**Files:**
- Create: `src/navigation/PagerSwipeContext.js`
- Modify: `src/navigation/MainTabs.js`
- Modify: `src/components/MonthCarousel.js`

**Interfaces:**
- Consumes: `pagerRef` di `MainTabs` (istanza `PagerView` con metodo `setScrollEnabled(bool)`).
- Produces: `PagerSwipeContext` (React context) e `usePagerSwipe()` che restituisce `{ lock, unlock }` oppure `null`; entrambe le funzioni senza argomenti.

- [ ] **Step 1: Creare il contesto di lock del pager**

Create `src/navigation/PagerSwipeContext.js`:

```js
import { createContext, useContext } from 'react';

export const PagerSwipeContext = createContext(null);

export function usePagerSwipe() {
  return useContext(PagerSwipeContext);
}
```

- [ ] **Step 2: Fornire il contesto da MainTabs**

Replace the whole content of `src/navigation/MainTabs.js` with:

```js
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { TABS } from './tabs';
import AppHeader from './AppHeader';
import MainTabBar from './MainTabBar';
import { PagerSwipeContext } from './PagerSwipeContext';
import { colors } from '../theme/colors';

export default function MainTabs() {
  const pagerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState([0]);

  const ensureLoaded = useCallback((i) => {
    if (i < 0 || i >= TABS.length) return;
    setLoaded((prev) => (prev.includes(i) ? prev : [...prev, i]));
  }, []);

  const swipe = useMemo(() => ({
    lock: () => pagerRef.current?.setScrollEnabled(false),
    unlock: () => pagerRef.current?.setScrollEnabled(true),
  }), []);

  const selectTab = useCallback((i) => {
    if (i === index) return;
    ensureLoaded(i);
    setIndex(i);
    pagerRef.current?.setPage(i);
  }, [index, ensureLoaded]);

  return (
    <PagerSwipeContext.Provider value={swipe}>
      <View style={styles.container}>
        <AppHeader title={TABS[index].title} />
        <PagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          offscreenPageLimit={2}
          onPageSelected={(e) => {
            const i = e.nativeEvent.position;
            ensureLoaded(i);
            setIndex(i);
          }}
          onPageScroll={(e) => {
            const { position, offset } = e.nativeEvent;
            ensureLoaded(position);
            if (offset > 0) ensureLoaded(position + 1);
          }}
        >
          {TABS.map((tab, i) => {
            const Screen = tab.component;
            return (
              <View key={tab.name} style={styles.page} collapsable={false}>
                {loaded.includes(i) ? <Screen /> : null}
              </View>
            );
          })}
        </PagerView>
        <MainTabBar tabs={TABS} index={index} onSelect={selectTab} />
      </View>
    </PagerSwipeContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  pager: { flex: 1 },
  page: { width: '100%', height: '100%', backgroundColor: colors.background },
});
```

- [ ] **Step 3: Importare l'hook nel carosello**

In `src/components/MonthCarousel.js`, after the existing import of `formatMonthLabel`, add:

```js
import { usePagerSwipe } from '../navigation/PagerSwipeContext';
```

- [ ] **Step 4: Leggere il contesto nel carosello**

In `src/components/MonthCarousel.js`, immediately after the line:

```js
  const allActiveRef = useRef(!!allActive);
```

add:

```js
  const pager = usePagerSwipe();
```

- [ ] **Step 5: Bloccare/sbloccare il pager al tocco del carosello**

In `src/components/MonthCarousel.js`, replace:

```js
    <View style={styles.wrap}>
```

with:

```js
    <View
      style={styles.wrap}
      onTouchStart={() => { if (shiftableRef.current && !allActiveRef.current) pager?.lock(); }}
      onTouchEnd={() => pager?.unlock()}
      onTouchCancel={() => pager?.unlock()}
    >
```

- [ ] **Step 6: Verificare il bundle**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 7: Verificare la suite pura**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: `Tutti i controlli di finanza/format/categorie passano.`

- [ ] **Step 8: Commit**

```bash
git add src/navigation/PagerSwipeContext.js src/navigation/MainTabs.js src/components/MonthCarousel.js
git commit -m "feat: priorita al carosello mese durante lo swipe"
```

---

## Verifica finale (manuale, su device)

Dopo il rebuild del dev client (`npx expo run:android`):

- [ ] Swipe orizzontale cambia schermata (Home ↔ Movimenti ↔ Conti), senza wrap-around.
- [ ] Tap su una tab: cambia pagina con animazione, header e tab bar si aggiornano.
- [ ] Header centrato, bianco, alta uguale a prima; titolo = nome schermata.
- [ ] Tab bar identica a prima (icone, etichette, striscia nera, elevazione).
- [ ] Swipe sul `MonthCarousel`: scorrono i mesi, la pagina NON cambia.
- [ ] Con "Tutti" attivo (mode all), swipe sul carosello: cambia tab.
- [ ] Prima apertura di Movimenti/Conti: nessuna pagina vuota evidente durante lo swipe.
- [ ] Tornando su una schermata, filtro/scroll/stato sono preservati.
- [ ] `node --experimental-detect-module scripts/finance.spec.mjs` ancora verde.
