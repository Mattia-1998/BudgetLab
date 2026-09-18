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