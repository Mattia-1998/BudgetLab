import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function MonthlyNav({ month, onPrev, onNext, onAll, allActive, label }) {
  return (
    <View style={styles.row}>
      {onAll ? (
        <Pressable style={[styles.allChip, allActive && styles.allChipActive]} onPress={onAll}>
          <Text style={[styles.allText, allActive && styles.allTextActive]}>Tutti</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onPrev} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color={colors.primary} />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onNext} hitSlop={12}>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 16 },
  label: { fontSize: 16, fontWeight: '600', minWidth: 150, textAlign: 'center', textTransform: 'capitalize' },
  allChip: { position: 'absolute', left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EEE' },
  allChipActive: { backgroundColor: colors.primary },
  allText: { color: colors.text },
  allTextActive: { color: '#fff' },
});
