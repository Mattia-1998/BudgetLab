import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MonthlyNav({ month, onPrev, onNext, onAll, allActive, label }) {
  return (
    <View style={styles.row}>
      {onAll ? (
        <Pressable style={[styles.allChip, allActive && styles.allChipActive]} onPress={onAll}>
          <Text style={[styles.allText, allActive && styles.allTextActive]}>Tutti</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onPrev} hitSlop={12}>
        <Ionicons name="chevron-back" size={22} color="#1B5E20" />
      </Pressable>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onNext} hitSlop={12}>
        <Ionicons name="chevron-forward" size={22} color="#1B5E20" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 16 },
  label: { fontSize: 16, fontWeight: '600', minWidth: 150, textAlign: 'center', textTransform: 'capitalize' },
  allChip: { position: 'absolute', left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#EEE' },
  allChipActive: { backgroundColor: '#1B5E20' },
  allText: { color: '#333' },
  allTextActive: { color: '#fff' },
});
