import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

export default function FormField({ icon, label, ...other }) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldFocused]}>
        {icon ? <Ionicons name={icon} size={18} color={colors.faintText} /> : null}
        <TextInput
          {...other}
          style={styles.input}
          placeholderTextColor={colors.faintText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  fieldFocused: { borderColor: '#4F46E5' },
  input: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0F172A', padding: 0 },
});