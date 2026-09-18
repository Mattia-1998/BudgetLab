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