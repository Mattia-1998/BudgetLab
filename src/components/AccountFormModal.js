import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { colors } from '../theme/colors';

const TYPES = ['carta', 'banca'];
const TYPE_LABELS = { carta: 'Carta', banca: 'Banca' };
const COLORS = ['#4F46E5', '#2563EB', '#7C3AED', '#9333EA', '#0EA5E9', '#37474F'];

export default function AccountFormModal({ visible, onClose, initial }) {
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState(null);
  const isEdit = !!initial;

  const syncState = () => {
    setName(initial ? initial.name : '');
    setInitialBalance(initial ? String(initial.initialBalance ?? '') : '');
    setType(initial ? initial.type : TYPES[0]);
    setColor(initial ? initial.color : COLORS[0]);
    setError(null);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Inserisci un nome');
      return;
    }
    const parsed = parseFloat(initialBalance.replace(',', '.'));
    if (initialBalance.trim() !== '' && isNaN(parsed)) {
      setError('Inserisci un saldo valido (es. 100,00)');
      return;
    }
    const data = {
      name: name.trim(),
      type,
      color,
      initialBalance: initialBalance.trim() === '' ? 0 : parsed,
      createdAt: initial ? initial.createdAt : Date.now(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'accounts', initial.id), data);
      } else {
        await addDoc(collection(db, 'accounts'), data);
      }
      onClose();
    } catch (err) {
      setError('Errore di salvataggio: ' + err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Modifica conto' : 'Nuovo conto'}</Text>
          <TextInput style={styles.input} placeholder="Nome (es. Intesa)" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="Saldo iniziale (es. 100,00)"
            value={initialBalance}
            onChangeText={setInitialBalance}
            keyboardType="numeric"
          />
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <Pressable key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{TYPE_LABELS[t]}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.colorRow}>
            {COLORS.map((c) => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} onPress={() => setColor(c)} />
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnText}>Annulla</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnSave]} onPress={save}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Salva</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 12 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeChip: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 8, backgroundColor: '#EEE' },
  typeChipActive: { backgroundColor: colors.primary },
  typeText: { color: '#333', fontWeight: '600' },
  typeTextActive: { color: '#fff' },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#000' },
  error: { color: colors.negative, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: colors.primary },
  btnText: { color: '#333', fontWeight: '600' },
});