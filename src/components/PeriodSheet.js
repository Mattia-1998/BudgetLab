import { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { periodRange, startOfMonth, shiftAnchor } from '../utils/finance';
import { colors } from '../theme/colors';

const PRESETS = [
  { mode: 'month', label: 'Mese' },
  { mode: 'bimester', label: 'Bimestre' },
  { mode: 'quarter', label: 'Trimestre' },
  { mode: 'semester', label: 'Semestre' },
  { mode: 'year', label: 'Anno' },
  { mode: 'all', label: 'Tutti' },
];

const monthTitle = (ms) => {
  const s = new Date(ms).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export default function PeriodSheet({ visible, period, onSelect, onClose }) {
  const [showCustom, setShowCustom] = useState(period.mode === 'custom');
  const [start, setStart] = useState(period.customStart);
  const [end, setEnd] = useState(period.customEnd);

  useEffect(() => {
    if (!visible) return;
    setShowCustom(period.mode === 'custom');
    const range = periodRange(period);
    const startMs = period.mode === 'custom' ? period.customStart : startOfMonth(range ? range.startMs : period.anchor);
    const endMs = period.mode === 'custom' ? period.customEnd : startOfMonth(range ? range.endMs : period.anchor);
    setStart(startMs);
    setEnd(endMs);
  }, [visible]);

  const shift = (which, dir) => {
    if (which === 'start') {
      const nextStart = shiftAnchor(start, 'month', dir);
      setStart(nextStart);
      if (nextStart > end) setEnd(nextStart);
    } else {
      const nextEnd = shiftAnchor(end, 'month', dir);
      setEnd(nextEnd);
      if (nextEnd < start) setStart(nextEnd);
    }
  };

  const pickPreset = (mode) => { onSelect({ mode }); onClose(); };
  const applyCustom = () => { onSelect({ mode: 'custom', customStart: start, customEnd: end }); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Periodo</Text>
          {PRESETS.map((p) => {
            const active = period.mode === p.mode;
            return (
              <Pressable key={p.mode} style={[styles.row, active && styles.rowActive]} onPress={() => pickPreset(p.mode)}>
                <Text style={[styles.rowText, active && styles.rowTextActive]}>{p.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
          <Pressable style={[styles.row, showCustom && styles.rowActive]} onPress={() => setShowCustom((v) => !v)}>
            <Text style={[styles.rowText, showCustom && styles.rowTextActive]}>Personalizzato…</Text>
            <Ionicons name={showCustom ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          </Pressable>
          {showCustom ? (
            <View style={styles.customBox}>
              <Stepper label="Da" value={start} onShift={(dir) => shift('start', dir)} />
              <Stepper label="A" value={end} onShift={(dir) => shift('end', dir)} />
              <Pressable style={styles.applyBtn} onPress={applyCustom}>
                <Text style={styles.applyText}>Applica</Text>
              </Pressable>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Stepper({ label, value, onShift }) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepperControls}>
        <Pressable style={styles.stepperBtn} hitSlop={6} onPress={() => onShift(-1)}>
          <Ionicons name="chevron-back" size={16} color={colors.primary} />
        </Pressable>
        <Text style={styles.stepperValue}>{monthTitle(value)}</Text>
        <Pressable style={styles.stepperBtn} hitSlop={6} onPress={() => onShift(1)}>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  rowActive: { backgroundColor: '#F3F4F6' },
  rowText: { fontSize: 15, color: colors.text },
  rowTextActive: { fontWeight: '700', color: colors.primary },
  customBox: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.chipBorder, paddingTop: 12 },
  stepper: { marginBottom: 12 },
  stepperLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 6 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.trackBg, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 8 },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { fontSize: 15, fontWeight: '600', color: colors.text, textTransform: 'capitalize' },
  applyBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  applyText: { color: '#fff', fontWeight: '700' },
});