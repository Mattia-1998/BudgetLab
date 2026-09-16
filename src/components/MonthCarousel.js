import { useEffect, useRef } from 'react';
import { View, Text, Pressable, PanResponder, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatMonthLabel } from '../utils/format';

const DOUBLE_TAP_MS = 300;
const GAP = 24;

const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function MonthCarousel({ month, label, onPrev, onNext, onAll, allActive }) {
  const slotRef = useRef(143.5);
  const prevW = useRef(75);
  const chipW = useRef(164);
  const lastTap = useRef(0);
  const x = useRef(new Animated.Value(0)).current;
  const z = useRef(new Animated.Value(1)).current;
  const prevMonthRef = useRef(month);
  const allActiveRef = useRef(!!allActive);
  allActiveRef.current = !!allActive;

  useEffect(() => {
    if (prevMonthRef.current.getTime() === month.getTime()) return;
    prevMonthRef.current = month;
    z.setValue(0.25);
    Animated.timing(z, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  }, [month]);

  const updateSlot = () => {
    slotRef.current = (prevW.current + chipW.current) / 2 + GAP;
  };

  const slide = (dir) => {
    const s = slotRef.current;
    Animated.timing(x, { toValue: dir === 1 ? s : -s, duration: 240, useNativeDriver: false }).start(({ finished }) => {
      if (!finished) { x.setValue(0); return; }
      if (dir === 1) onPrev?.(); else onNext?.();
      x.setValue(0);
    });
  };

  const cancelSwipe = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 8 }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !allActiveRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        const thr = Math.max(30, slotRef.current * 0.4);
        if (g.dx > thr || (g.vx > 0.3 && g.dx > 15)) slide(1);
        else if (g.dx < -thr || (g.vx < -0.3 && g.dx < -15)) slide(-1);
        else cancelSwipe();
      },
    })
  ).current;

  const handleCenterPress = () => {
    if (!onAll) return;
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) { lastTap.current = 0; onAll(); } else lastTap.current = now;
  };

  const prevDisabled = !!allActive;
  const nextDisabled = !!allActive;
  const prevLabel = formatMonthLabel(addMonths(month, -1));
  const nextLabel = formatMonthLabel(addMonths(month, 1));

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.arrowBtn} onPress={() => slide(1)} hitSlop={6} accessibilityLabel="Mese precedente">
        <Ionicons name="chevron-back" size={16} color={colors.primary} />
      </Pressable>
      <View style={styles.track} {...pan.panHandlers}>
        <Animated.View style={[styles.group, { transform: [{ translateX: x }] }]}>
          <Pressable disabled={prevDisabled} onPress={prevDisabled ? undefined : () => slide(1)} hitSlop={6} onLayout={(e) => { prevW.current = e.nativeEvent.layout.width; updateSlot(); }}>
            <Text style={[styles.side, prevDisabled && styles.sideDisabled]}>{prevLabel}</Text>
          </Pressable>
          <Animated.View onLayout={(e) => { chipW.current = e.nativeEvent.layout.width; updateSlot(); }} style={[{ opacity: z }]}>
            <Pressable style={styles.chip} onPress={handleCenterPress} hitSlop={4}>
              <Text style={styles.chipText}>{label}</Text>
            </Pressable>
          </Animated.View>
          <Pressable disabled={nextDisabled} onPress={nextDisabled ? undefined : () => slide(-1)} hitSlop={6}>
            <Text style={[styles.side, nextDisabled && styles.sideDisabled]}>{nextLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
      <Pressable style={styles.arrowBtn} onPress={() => slide(-1)} hitSlop={6} accessibilityLabel="Mese successivo">
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.trackBg,
    borderRadius: 18,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 8,
    marginVertical: 6,
    gap: 8,
    overflow: 'hidden',
  },
  track: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  group: { flexDirection: 'row', alignItems: 'center', gap: GAP },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  chipText: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center', textTransform: 'capitalize' },
  side: { fontSize: 14, color: colors.faintText, fontWeight: '500', textTransform: 'capitalize' },
  sideDisabled: { opacity: 0.3 },
});