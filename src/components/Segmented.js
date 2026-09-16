import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(opt.value)}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.text },
  chipTextActive: { color: '#fff' },
});
