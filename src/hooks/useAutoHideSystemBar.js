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