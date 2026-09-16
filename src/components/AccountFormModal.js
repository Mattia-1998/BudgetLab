import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';

const TYPES = ['contante', 'banca', 'carta'];
const COLORS = ['#1B5E20', '#1565C0', '#6A1B9A', '#AD1457', '#E65100', '#37474F'];

export default function AccountFormModal({ visible, onClose, initial }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState(null);
  const isEdit = !!initial;

  const syncState = () => {
    setName(initial ? initial.name : '');
    setType(initial ? initial.type : TYPES[0]);
    setColor(initial ? initial.color : COLORS[0]);
    setError(null);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Inserisci un nome');
      return;
    }
    const data = { name: name.trim(), type, color, createdAt: initial ? initial.createdAt : Date.now() };
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
          <View style={styles.row}>
            {TYPES.map((t) => (
              <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
                <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
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
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#1B5E20' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  colorDot: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  colorDotActive: { borderWidth: 3, borderColor: '#000' },
  error: { color: '#C62828', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: '#1B5E20' },
  btnText: { color: '#333', fontWeight: '600' },
});