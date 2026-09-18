import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryTile({ icon, label, color, active, width, height = 78, inactiveColor, onPress }) {
  return (
    <Pressable style={[styles.tile, { width, height }, active && { backgroundColor: color, borderColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? '#fff' : (inactiveColor ?? color)} />
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4 },
  text: { fontSize: 11, fontWeight: '500', color: '#374151' },
  textActive: { color: '#fff', fontWeight: '600' },
});
