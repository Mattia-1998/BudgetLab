import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

export default function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(opt.value)}>
            {opt.icon ? <Ionicons name={opt.icon} size={15} color={active ? '#fff' : colors.textMuted} /> : null}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 18, padding: 6, marginBottom: 16, gap: 4 },
  chip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 13 },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: colors.textMuted, fontSize: 13, fontFamily: FONT.medium },
  chipTextActive: { color: '#fff' },
});
