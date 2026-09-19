import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions, LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { SPENDING_CATEGORIES, CATEGORY_MAP, orderedCategoryKeys } from '../constants/categories';
import Segmented from './Segmented';
import CategoryTile from './CategoryTile';
import { colors } from '../theme/colors';

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
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 64) / 4);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [transferTo, setTransferTo] = useState(null);
  const [category, setCategory] = useState(SPENDING_CATEGORIES[0].key);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const isEdit = !!initial;
  const { central, rest } = orderedCategoryKeys();
  const restKeys = rest.filter((key) => key !== 'trasferimento');

  const toggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesExpanded((v) => !v);
  };

  const syncState = () => {
    setAmount(initial ? String(initial.amount) : '');
    setKind(initial ? initial.kind : 'expense');
    setCategory(initial ? initial.category : SPENDING_CATEGORIES[0].key);
    setAccountId(initial ? initial.accountId : null);
    setTransferTo(initial && initial.kind === 'transfer' ? initial.transferTo : null);
    setDate(initial ? toDmy(initial.date) : toDmy(Date.now()));
    setNote(initial && initial.note ? initial.note : '');
    setError(null);
  };

  const chipRow = ({ label, list, value, onChange, emptyMsg }) => (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.acctRow}>
        {list.map((a) => {
          const active = value === a.id;
          return (
            <Pressable key={a.id} style={[styles.chip, active && styles.chipActive]} onPress={() => onChange(a.id)}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{a.name}</Text>
            </Pressable>
          );
        })}
        {list.length === 0 ? <Text style={styles.warn}>{emptyMsg}</Text> : null}
      </View>
    </View>
  );

  const save = async () => {
    const value = Number(String(amount).replace(',', '.'));
    if (!(value > 0)) { setError('Inserisci un importo valido'); return; }
    const tsMs = parseDate(date);
    if (tsMs == null) { setError('Data non valida (usare GG/MM/AAAA)'); return; }
    if (kind === 'transfer') {
      if (!accountId) { setError('Seleziona il conto di partenza'); return; }
      if (!transferTo) { setError('Seleziona il conto di arrivo'); return; }
      if (accountId === transferTo) { setError('Scegli due conti diversi'); return; }
      try {
        if (isEdit) {
          await updateDoc(doc(db, 'transactions', initial.id), { amount: value, date: tsMs, note: note.trim() });
        } else {
          await addDoc(collection(db, 'transactions'), {
            kind: 'transfer',
            accountId,
            transferTo,
            amount: value,
            date: tsMs,
            note: note.trim(),
          });
        }
        onClose();
      } catch (err) {
        setError('Errore di salvataggio: ' + err.message);
      }
      return;
    }
    if (!accountId) { setError('Seleziona un conto'); return; }
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.kaView, { paddingBottom: insets.bottom }]}>
          <ScrollView style={styles.card}>
          <Text style={styles.title}>{isEdit ? 'Modifica movimento' : 'Nuovo movimento'}</Text>
          <Segmented
            options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }, { value: 'transfer', label: 'Trasferimento' }]}
            value={kind}
            onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); setTransferTo(null); } }}
          />
          <TextInput
            style={styles.input}
            placeholder="Importo (es. 12,50)"
            placeholderTextColor={colors.faintText}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
          {kind !== 'transfer' ? (
            <>
              <Text style={styles.fieldLabel}>Categoria</Text>
              <View style={styles.catGrid}>
                {central.map((key) => {
                  const c = CATEGORY_MAP[key];
                  return (
                    <CategoryTile
                      key={key}
                      icon={c.icon}
                      label={c.label}
                      color={c.color}
                      active={category === key}
                      width={tileWidth}
                      onPress={() => setCategory(key)}
                    />
                  );
                })}
                <Pressable style={[styles.catTileArrow, { width: tileWidth }, !categoriesExpanded && restKeys.includes(category) && styles.catTileArrowActive]} onPress={toggleCategories}>
                  <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={!categoriesExpanded && restKeys.includes(category) ? '#fff' : colors.textMuted} />
                </Pressable>
                {categoriesExpanded
                  ? restKeys.map((key) => {
                      const c = CATEGORY_MAP[key];
                      return (
                        <CategoryTile
                          key={key}
                          icon={c.icon}
                          label={c.label}
                          color={c.color}
                          active={category === key}
                          width={tileWidth}
                          onPress={() => setCategory(key)}
                        />
                      );
                    })
                  : null}
              </View>
            </>
          ) : null}
          {kind === 'transfer' && isEdit ? (
            (() => {
              const src = accounts.find((a) => a.id === initial.accountId);
              const dst = accounts.find((a) => a.id === initial.transferTo);
              return (
                <View style={styles.readonlyBox}>
                  <Text style={styles.readonlyText}>
                    {(src ? src.name : 'Conto')} → {(dst ? dst.name : 'Conto')}
                  </Text>
                  <Text style={styles.readonlyHint}>Conti non modificabili in modifica.</Text>
                </View>
              );
            })()
          ) : (
            <>
              {kind === 'transfer' ? (
                <>
                  {chipRow({
                    label: 'Conto di partenza',
                    list: accounts.filter((a) => a.id !== transferTo),
                    value: accountId,
                    onChange: setAccountId,
                    emptyMsg: 'Nessun conto disponibile: crea prima un conto.',
                  })}
                  {chipRow({
                    label: 'Conto di arrivo',
                    list: accounts.filter((a) => a.id !== accountId),
                    value: transferTo,
                    onChange: setTransferTo,
                    emptyMsg: 'Nessun conto disponibile: crea prima un conto.',
                  })}
                </>
              ) : chipRow({
                label: 'Conto',
                list: accounts,
                value: accountId,
                onChange: setAccountId,
                emptyMsg: 'Nessun conto: crea prima un conto.',
              })}
            </>
          )}
          <Text style={styles.fieldLabel}>Data (GG/MM/AAAA)</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Nota (opzionale)" placeholderTextColor={colors.faintText} value={note} onChangeText={setNote} />
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
        </KeyboardAvoidingView>
        <View pointerEvents="none" style={[styles.navBarStrip, { height: insets.bottom }]} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kaView: { flex: 1, justifyContent: 'flex-end' },
  navBarStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#000000' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: '90%' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 8 },
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  catTileArrowActive: { backgroundColor: '#111827', borderColor: '#111827' },
  acctRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EEE', marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: '#333' },
  chipTextActive: { color: '#fff' },
  warn: { color: '#B26A00' },
  error: { color: colors.negative, marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  btn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 8, marginHorizontal: 6 },
  btnCancel: { backgroundColor: '#EEE' },
  btnSave: { backgroundColor: colors.primary },
  btnText: { color: '#333', fontWeight: '600' },
  hint: { fontSize: 12, color: '#555', marginBottom: 10 },
  readonlyBox: { borderWidth: 1, borderColor: colors.chipBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB' },
  readonlyText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  readonlyHint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
