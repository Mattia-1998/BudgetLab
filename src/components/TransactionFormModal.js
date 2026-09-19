import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, useWindowDimensions, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { SPENDING_CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import Segmented from './Segmented';
import CategoryTile from './CategoryTile';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

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
  const tileWidth = Math.floor((width - 70) / 4);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('expense');
  const [transferTo, setTransferTo] = useState(null);
  const [category, setCategory] = useState(SPENDING_CATEGORIES[0].key);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [amountFocused, setAmountFocused] = useState(false);
  const [dateFocused, setDateFocused] = useState(false);
  const [noteFocused, setNoteFocused] = useState(false);
  const isEdit = !!initial;
  const spendKeys = SPENDING_CATEGORIES.map((c) => c.key);
  const visibleKeys = spendKeys.slice(0, 3);
  const restKeys = spendKeys.slice(3);

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
      <View style={styles.chipRowWrap}>
        {list.map((a) => {
          const active = value === a.id;
          return (
            <Pressable key={a.id} style={[styles.acctChip, active && styles.acctChipActive]} onPress={() => onChange(a.id)}>
              <Text style={[styles.acctChipText, active && styles.acctChipTextActive]}>{a.name}</Text>
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

  const selectedLabel = CATEGORY_MAP[category] ? CATEGORY_MAP[category].label : '';

  return (
    <Modal visible={visible} transparent animationType="slide" onShow={syncState} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.kaView, { paddingBottom: insets.bottom }]}>
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerEyebrow}>Gestione spese</Text>
                <Text style={styles.title}>{isEdit ? 'Modifica movimento' : 'Nuovo movimento'}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              <Segmented
                options={[
                  { value: 'expense', label: 'Uscita', icon: 'trending-down' },
                  { value: 'income', label: 'Entrata', icon: 'trending-up' },
                  { value: 'transfer', label: 'Trasferimento', icon: 'swap-horizontal' },
                ]}
                value={kind}
                onChange={(v) => { setKind(v); if (v === 'transfer' && !isEdit) { setAccountId(null); setTransferTo(null); } }}
              />
              <View style={[styles.amountBox, amountFocused && styles.fieldFocused]}>
                <Text style={styles.amountLabel}>Importo</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amountSymbol}>€</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0,00 (es. 12,50)"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                  />
                </View>
              </View>
              {kind !== 'transfer' ? (
                <>
                  <View style={styles.catHeader}>
                    <Text style={styles.fieldLabel}>Categoria</Text>
                    <Text style={styles.selectedPill}>{selectedLabel}</Text>
                  </View>
                  <View style={styles.catGrid}>
                    {visibleKeys.map((key) => {
                      const c = CATEGORY_MAP[key];
                      return (
                        <CategoryTile
                          key={key}
                          icon={c.icon}
                          label={c.label}
                          color={c.color}
                          active={category === key}
                          width={tileWidth}
                          pressScale
                          onPress={() => setCategory(key)}
                        />
                      );
                    })}
                    <Pressable style={[styles.catTileArrow, { width: tileWidth }, !categoriesExpanded && restKeys.includes(category) && styles.catTileArrowActive]} onPress={toggleCategories}>
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={!categoriesExpanded && restKeys.includes(category) ? '#fff' : '#94A3B8'} />
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
                              pressScale
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
              <View style={[styles.field, dateFocused && styles.fieldFocused]}>
                <Ionicons name="calendar-outline" size={18} color={colors.faintText} />
                <TextInput
                  style={styles.fieldInput}
                  value={date}
                  onChangeText={setDate}
                  keyboardType="numeric"
                  onFocus={() => setDateFocused(true)}
                  onBlur={() => setDateFocused(false)}
                />
              </View>
              <Text style={styles.fieldLabel}>Nota (opzionale)</Text>
              <View style={[styles.field, noteFocused && styles.fieldFocused]}>
                <Ionicons name="create-outline" size={18} color={colors.faintText} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Aggiungi una nota..."
                  placeholderTextColor={colors.faintText}
                  value={note}
                  onChangeText={setNote}
                  onFocus={() => setNoteFocused(true)}
                  onBlur={() => setNoteFocused(false)}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </ScrollView>
            <View style={styles.actions}>
              <Pressable style={[styles.btn, styles.btnCancel]} onPress={onClose}>
                <Text style={styles.btnText}>Annulla</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnSave]} onPress={save} activeOpacity={0.9}>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.btnSaveText}>Salva</Text>
              </Pressable>
            </View>
          </View>
          <View pointerEvents="none" style={[styles.navBarStrip, { height: insets.bottom }]} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  kaView: { flex: 1, justifyContent: 'flex-end' },
  navBarStrip: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#000000' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 16 },
  headerEyebrow: { fontSize: 11, fontFamily: FONT.semiBold, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  title: { fontSize: 22, fontFamily: FONT.bold, color: '#0F172A' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  scroll: { flexShrink: 1 },
  amountBox: { backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 16, padding: 12, marginBottom: 16 },
  fieldFocused: { borderColor: '#4F46E5' },
  amountLabel: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountSymbol: { fontSize: 22, fontFamily: FONT.bold, color: '#94A3B8' },
  amountInput: { flex: 1, fontSize: 22, fontFamily: FONT.bold, color: '#0F172A', padding: 0 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  fieldLabel: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  selectedPill: { fontSize: 12, fontFamily: FONT.medium, color: '#4F46E5', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, gap: 10 },
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  catTileArrowActive: { backgroundColor: '#111827', borderColor: '#111827' },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  acctChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 8, marginBottom: 8 },
  acctChipActive: { backgroundColor: '#4F46E5' },
  acctChipText: { color: '#475569', fontSize: 13, fontFamily: FONT.medium },
  acctChipTextActive: { color: '#fff' },
  warn: { color: '#B26A00', fontFamily: FONT.medium },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  fieldInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0F172A', padding: 0 },
  error: { color: colors.negative, fontFamily: FONT.medium, fontSize: 13, marginTop: 4, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnCancel: { backgroundColor: '#F1F5F9' },
  btnSave: { backgroundColor: '#4F46E5', elevation: 3, shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText: { color: '#475569', fontFamily: FONT.semiBold, fontSize: 15 },
  btnSaveText: { color: '#fff', fontFamily: FONT.semiBold, fontSize: 15 },
  readonlyBox: { borderWidth: 1, borderColor: colors.chipBorder, borderRadius: 8, padding: 12, marginBottom: 12, backgroundColor: '#F9FAFB' },
  readonlyText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  readonlyHint: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
