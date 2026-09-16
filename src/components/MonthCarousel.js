import { useEffect, useRef } from 'react';
import { View, Pressable, PanResponder, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatMonthLabel } from '../utils/format';

const DOUBLE_TAP_MS = 300;

const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function MonthCarousel({ month, label, onPrev, onNext, onAll, allActive }) {
  const slotRef = useRef(80);
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

  const onStageLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) slotRef.current = w / 3;
  };

  const prevDisabled = !!allActive;
  const nextDisabled = !!allActive;
  const prevLabel = formatMonthLabel(addMonths(month, -1));
  const nextLabel = formatMonthLabel(addMonths(month, 1));
  const move = { transform: [{ translateX: x }] };
  const moveRecess = { transform: [{ translateX: x }, { translateY: 3 }] };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => slide(1)} hitSlop={12} accessibilityLabel="Mese precedente">
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
      </Pressable>
      <View style={styles.stage} onLayout={onStageLayout} {...pan.panHandlers}>
        <Pressable disabled={prevDisabled} onPress={prevDisabled ? undefined : () => slide(1)} style={styles.cell} hitSlop={8}>
          <Animated.Text style={[styles.side, moveRecess, prevDisabled && styles.sideDisabled]}>{prevLabel}</Animated.Text>
        </Pressable>
        <Pressable disabled={nextDisabled} onPress={nextDisabled ? undefined : () => slide(-1)} style={styles.cell} hitSlop={8}>
          <Animated.Text style={[styles.side, moveRecess, nextDisabled && styles.sideDisabled]}>{nextLabel}</Animated.Text>
        </Pressable>
        <Pressable onPress={handleCenterPress} style={styles.cell} hitSlop={8}>
          <Animated.Text style={[styles.center, move, { opacity: z }]}>{label}</Animated.Text>
        </Pressable>
      </View>
      <Pressable onPress={() => slide(-1)} hitSlop={12} accessibilityLabel="Mese successivo">
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 6 },
  stage: { flex: 1, flexDirection: 'row', height: 34, alignItems: 'center' },
  cell: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center' },
  center: { fontSize: 17, fontWeight: 'bold', color: colors.text, textAlign: 'center', textTransform: 'capitalize' },
  side: { fontSize: 13, color: colors.text, opacity: 0.45, textAlign: 'center', textTransform: 'capitalize' },
  sideDisabled: { opacity: 0.2 },
});