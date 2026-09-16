# Auto-hide barra di sistema Android — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nascondere la barra di sistema Android dopo 5s di inattività e far scendere la tab bar dell'app al bordo inferiore (nessun bordo bianco), con reveal fluido via swipe dal bordo.

**Architecture:** Un nuovo hook `useAutoHideSystemBar` (timer + `NavigationBar.setHidden` + `useVisibility` per lo stato), una`SafeAreaProvider` al root di App.js, e AppNavigator che legge il flag `hidden` per animare il padding della tab bar via `Animated.Value`.

**Tech Stack:** React Native 0.86, Expo SDK 57, `expo-navigation-bar`, `react-native-safe-area-context` (già presente), `LayoutAnimation`/`Animated` (built-in).

## Global Constraints

- Piattaforma: solo Android; su iOS la feature è inerte.
- Nessuna nuova dipendenza oltre `expo-navigation-bar`.
- Tab bar mantiene stile, colore e struttura attuali; cambia solo il padding bottom.
- `LayoutAnimation` / `Animated` per transizioni fluide.
- Nessuna modifica alla logica di business (saldi, transazioni, conti).
- Nessun commento inutile nel codice.
- Verifica obbligatoria di ogni task: `npx expo export --platform android` (atteso: `Exported: dist`).
- Commit frequenti, uno per task, sul branch `main`. Push solo su richiesta dell'utente.

---

### Task 1: Dipendenza + hook `useAutoHideSystemBar` + SafeAreaProvider al root

**Files:**
- Modify: `package.json` (via npx expo install, non manuale)
- Create: `src/hooks/useAutoHideSystemBar.js`
- Modify: `App.js`

**Interfaces:**
- Consumes: `NavigationBar.useVisibility()`, `NavigationBar.setHidden()` da `expo-navigation-bar`; `AppState` da React Native.
- Produce: `{ hidden: boolean, resetTimer: () => void }` — `hidden = true` solo quando la barra Android è nascosta; `resetTimer()` azzera il timer di inattività (chiamato da AppNavigator's touch wrapper).

- [ ] **Step 1: Installare expo-navigation-bar**

Run: `npx expo install expo-navigation-bar`
Expected: pacchetto aggiunto in `package.json` e installato in `node_modules`.

- [ ] **Step 2: Aggiungere SafeAreaProvider al root di App.js**

Modificare `App.js` — wrappare `AppNavigator` con `SafeAreaProvider` (serve per usare `useSafeAreaInsets` in AppNavigator, al di fuori del provider interno a NavigationContainer):

```js
import './firebase/db';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 3: Creare il hook `src/hooks/useAutoHideSystemBar.js`**

Creare `src/hooks/useAutoHideSystemBar.js` con il contenuto completo:

```js
import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';

const INACTIVITY_MS = 5000;

export default function useAutoHideSystemBar() {
  const timerRef = useRef(null);
  const visibility = NavigationBar.useVisibility();
  const hidden = Platform.OS === 'android' && visibility === 'hidden';

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const start = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          NavigationBar.setHidden(true);
        } catch {}
      }, INACTIVITY_MS);
    };

    start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
    });

    return () => {
      sub.remove();
      clearTimeout(timerRef.current);
      try {
        NavigationBar.setHidden(false);
      } catch {}
    };
  }, []);

  const resetTimer = useCallback(() => {
    if (Platform.OS !== 'android') return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        NavigationBar.setHidden(true);
      } catch {}
    }, INACTIVITY_MS);
  }, []);

  return { hidden, resetTimer };
}
```

- [ ] **Step 4: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 5: Commit**

```bash
git add App.js src/hooks/useAutoHideSystemBar.js package.json
git commit -m "feat: hook auto-hide barra di sistema Android (5s inattivita)"
```

---

### Task 2: Integrazione in AppNavigator (touch wrapper + Animated padding)

**Files:**
- Modify: `src/navigation/AppNavigator.js`

**Interfaces:**
- Consumes: `useAutoHideSystemBar()` (Task 1) → `{ hidden, resetTimer }`.
- Consumes: `useSafeAreaInsets()` da `react-native-safe-area-context` (provider attivo grazie al Task 1).
- Produce: tab bar con `paddingBottom` animato che scende a 0 quando la barra è nascosta e torna a `insets.bottom` quando è visibile; root wrapper con `onTouchStart={resetTimer}`.

- [ ] **Step 1: Riscrivere completamente `src/navigation/AppNavigator.js`**

Sostituire tutto il file con:

```js
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import { colors } from '../theme/colors';
import useAutoHideSystemBar from '../hooks/useAutoHideSystemBar';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Movimenti: 'swap-vertical-outline',
  Conti: 'wallet-outline',
};

const AnimatedTabBar = Animated.createAnimatedComponent(BottomTabBar);

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { hidden, resetTimer } = useAutoHideSystemBar();
  const padAnim = useRef(new Animated.Value(insets.bottom)).current;

  useEffect(() => {
    Animated.timing(padAnim, {
      toValue: hidden ? 0 : insets.bottom,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [hidden, insets.bottom]);

  return (
    <View style={styles.root} onTouchStart={resetTimer}>
      <NavigationContainer>
        <Tab.Navigator
          tabBar={(props) => (
            <AnimatedTabBar {...props} style={[props.style, { paddingBottom: padAnim }]} />
          )}
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
            ),
            tabBarActiveTintColor: colors.primary,
            headerTitleAlign: 'center',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
          <Tab.Screen name="Movimenti" component={TransactionsScreen} options={{ title: 'Movimenti' }} />
          <Tab.Screen name="Conti" component={AccountsScreen} options={{ title: 'Conti' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
```

Nota: `Animated.createAnimatedComponent(BottomTabBar)` è il pattern documentato da react-navigation per animare la barra tab; `Animated.Value` in `paddingBottom` sostituisce il padding di default (già `insets.bottom` di react-navigation), e scala a 0 quando la barra Android è nascosta.

- [ ] **Step 2: Verifica che compili**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Commit**

```bash
git add src/navigation/AppNavigator.js
git commit -m "feat: tab bar annulla al fondo con animated padding, touch wrapper per auto-hide"
```

---

### Task 3: Verifica finale

- [ ] **Step 1: Suite di logica**

Run: `node --experimental-detect-module scripts/finance.spec.mjs`
Expected: "Tutti i controlli di finanza/format/categorie passano."

- [ ] **Step 2: Build**

Run: `npx expo export --platform android`
Expected: termina con `Exported: dist`.

- [ ] **Step 3: Riepilogo diffs**

Run: `git log --oneline -4` per confermare i commit dei task precedenti. Nessun push: lo fa l'utente su richiesta.
