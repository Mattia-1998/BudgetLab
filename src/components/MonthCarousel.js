import { useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { formatMonthLabel } from '../utils/format';

const SLOT = 110;
const THRESHOLD = 55;
const DOUBLE_TAP_MS = 300;

const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export default function MonthCarousel({ month, label, onPrev, onNext, onAll, allActive }) {
  const [lastTap, setLastTap] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const offsets = useRef([-SLOT, 0, SLOT].map((b) => new Animated.Value(b))).current;

  const slide = (dir) => {
    Animated.timing(x, { toValue: dir === 1 ? SLOT : -SLOT, duration: 220, useNativeDriver: false }).start(() => {
      if (dir === 1) onPrev?.(); else onNext?.();
      x.setValue(0);
    });
  };

  const cancelSwipe = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: false, bounciness: 8 }).start();
  };

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !allActive && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) slide(1);
        else if (g.dx < -THRESHOLD) slide(-1);
        else cancelSwipe();
      },
    })
  ).current;

  const handleCenterPress = () => {
    if (!onAll) return;
    const now = Date.now();
    if (now - lastTap < DOUBLE_TAP_MS) { setLastTap(0); onAll(); } else setLastTap(now);
  };

  const prevDisabled = !!allActive;
  const nextDisabled = !!allActive;
  const prevLabel = formatMonthLabel(addMonths(month, -1));
  const nextLabel = formatMonthLabel(addMonths(month, 1));
  const slotStyle = (i) => ({ transform: [{ translateX: Animated.add(x, offsets[i]) }] });

  return (
    <View style={styles.wrap}>
      <Pressable onPress={() => slide(1)} hitSlop={12}>
        <Ionicons name="chevron-back" size={18} color={colors.primary} />
      </Pressable>
      <View style={styles.stage} {...pan.panHandlers}>
        <Pressable disabled={prevDisabled} onPress={prevDisabled ? undefined : () => slide(1)} style={[styles.band, styles.bandLeft]} hitSlop={8}>
          <Animated.Text style={[styles.side, slotStyle(0), prevDisabled && styles.sideDisabled]}>{prevLabel}</Animated.Text>
        </Pressable>
        <Pressable onPress={handleCenterPress} style={[styles.band, styles.bandCenter]} hitSlop={8}>
          <Animated.Text style={[styles.center, slotStyle(1)]}>{label}</Animated.Text>
        </Pressable>
        <Pressable disabled={nextDisabled} onPress={nextDisabled ? undefined : () => slide(-1)} style={[styles.band, styles.bandRight]} hitSlop={8}>
          <Animated.Text style={[styles.side, slotStyle(2), nextDisabled && styles.sideDisabled]}>{nextLabel}</Animated.Text>
        </Pressable>
      </View>
      <Pressable onPress={() => slide(-1)} hitSlop={12}>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 8 },
  stage: { width: 240, height: 34, justifyContent: 'center' },
  band: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' },
  bandLeft: { left: 0, width: 130 },
  bandCenter: { left: 55, width: 130 },
  bandRight: { left: 110, width: 130 },
  center: { fontSize: 17, fontWeight: 'bold', color: colors.text, textAlign: 'center', textTransform: 'capitalize' },
  side: { fontSize: 13, color: colors.text, opacity: 0.45, textAlign: 'center', textTransform: 'capitalize', position: 'absolute', left: 0, right: 0 },
  sideDisabled: { opacity: 0.2 },
});