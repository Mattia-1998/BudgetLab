import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { NavigationBar } from 'expo-navigation-bar';

const INACTIVITY_MS = 5000;

export default function useAutoHideSystemBar() {
  const timerRef = useRef(null);
  const visibility = NavigationBar.useVisibility();
  const hidden = Platform.OS === 'android' && visibility === 'hidden';

  const arm = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        NavigationBar.setHidden(true);
      } catch {}
    }, INACTIVITY_MS);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    arm();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') arm();
    });

    return () => {
      sub.remove();
      clearTimeout(timerRef.current);
      try {
        NavigationBar.setHidden(false);
      } catch {}
    };
  }, [arm]);

  const resetTimer = useCallback(() => {
    if (Platform.OS !== 'android') return;
    arm();
  }, [arm]);

  return { hidden, resetTimer };
}
