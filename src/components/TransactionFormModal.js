import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { CATEGORIES } from '../constants/categories';
import Segmented from './Segmented';

const parseDate = (value) => {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return date.getFullYear() === Number(m[3]) ? date.getTime() : null;
};

const toDmy = (ts) => {
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

export default function TransactionFormModal({ visible, onClose, accounts, initial }) {
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const isEdit = !!initial;

  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setCategory(initial ? initial.category : CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };

  const save = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!(value > 0)) { setError('Inserisci un importo valido'); return; }
    if (!accountId) { setError('Seleziona un conto'); return; }
    const tsMs = parseDate(date);
    if (tsMs == null) { setError('Data non valida (usare GG/MM/AAAA)'); return; }
    const data = { accountId, amount: value, kind, category, date: tsMs, note: note.trim() };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'transactions', initial.id), data);
      } else {
        await addDoc(collection(db, 'transactions'), data);
      }
      onClose();
    } catch (err) {
      setError('Errore di salvataggio: ' + err.message);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Modifica movimento' : 'Nuovo movimento'}</Text>
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }]}
            value={kind}
            onChange={setKind}
          />
          <TextInput
            style={styles.input}
            placeholder="Importo (es. 12,50)"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          <Text style={styles.fieldLabel}>Categoria</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map((c) => {
              const active = category === c.key;
              return (
                <Pressable key={c.key} style={[styles.cat, active && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setCategory(c.key)}>
                  <Ionicons name={c.icon} size={20} color={c.color} />
                  <Text style={styles.catText}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>Conto</Text>
          <View style={styles.acctRow}>
            {accounts.map((a) => {
              const active = accountId === a.id;
              return (
                <Pressable key={a.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setAccountId(a.id)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
                </Pressable>
              );
            })}
            {accounts.length === 0 ? <Text style={styles.warn}>Nessun conto: crea prima un conto.</Text> : null}
          </View>
          <Text style={styles.fieldLabel}>Data (GG/MM/AAAA)</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Nota (opzionale)" value={note} onChangeText={setNote} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
              <Text style={styles.btnText}>Annulla</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnSave]} onPress={save}>
              <Text style={[styles.btnText, { color: '#fff' }]}>Salva</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  cat: { alignItems: 'center', justifyContent: 'center', width: 80, padding: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', marginBottom: 8 },
  catText: { fontSize: 11, color: '#444' },
  acctRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: '#1B5E20' },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  warn: { color: '#B26A00' },
  error: { color: '#C62828', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: '#1B5E20' },
  btnText: { color: '#333', fontWeight: '600' },
});
