import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';
import { formatCurrency } from '../utils/format';
import { nextAccountOrder, accountBalance, accountTransactionsTotal } from '../utils/finance';
import Segmented from './Segmented';
import FormField from './FormField';

const TYPES = ['carta', 'banca', 'contanti'];
const TYPE_LABELS = { carta: 'Carta', banca: 'Banca', contanti: 'Contanti' };
const COLORS = ['#4F46E5', '#2563EB', '#7C3AED', '#9333EA', '#0EA5E9', '#37474F', '#16A34A', '#DC2626', '#FACC15', '#F97316', '#EC4899', '#0D9488'];
const COLOR_ROWS = [COLORS.slice(0, 6), COLORS.slice(6, 12)];

function formatInputCurrency(text) {
  const hasComma = /,/.test(text);
  const clean = text.replace(/[^\d,]/g, '');
  const [intRaw = '', ...decParts] = clean.split(',');
  const dec = decParts.join('').slice(0, 2);
  const int = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const suffix = hasComma ? (dec === '' ? ',' : ',' + dec) : '';
  const out = int + suffix;
  return out ? out + ' €' : '';
}

function parseCurrencyInput(text) {
  const cleaned = text.replace(/[^\d,]/g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  return Number.isNaN(value) ? 0 : value;
}

export default function AccountFormModal({ visible, onClose, initial, accounts = [], transactions = [] }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState(TYPES[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const isEdit = !!initial;
  const net = isEdit ? accountTransactionsTotal(transactions, initial.id) : 0;

  const syncState = () => {
    setName(initial ? initial.name : '');
    setBalance(initial ? formatCurrency(accountBalance(transactions, initial.id, initial.initialBalance)) : '');
    setType(initial ? initial.type : TYPES[0]);
    setColor(initial ? initial.color : COLORS[0]);
    setCode(initial ? (initial.code ?? '') : '');
    setError(null);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Inserisci un nome');
      return;
    }
    const parsed = parseCurrencyInput(balance);
    if (balance.trim() !== '' && parsed === 0 && !/[\d]/.test(balance)) {
      setError('Inserisci un saldo valido (es. 100,00)');
      return;
    }
    const balanceValue = balance.trim() === '' ? 0 : parsed;
    const data = {
      name: name.trim(),
      type,
      color,
      initialBalance: isEdit ? balanceValue - net : balanceValue,
      code: code.trim(),
      createdAt: initial ? initial.createdAt : Date.now(),
    };
    try {
      if (isEdit) {
        await updateDoc(doc(db, 'accounts', initial.id), data);
      } else {
        await addDoc(collection(db, 'accounts'), { ...data, order: nextAccountOrder(accounts) });
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
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerEyebrow}>Conti</Text>
                <Text style={styles.title}>{isEdit ? 'Modifica conto' : 'Nuovo conto'}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
              <FormField icon="wallet-outline" label="Nome" placeholder="Nome (es. Intesa)" value={name} onChangeText={setName} />
              <FormField
                icon="cash-outline"
                label={isEdit ? 'Saldo attuale' : 'Saldo iniziale'}
                placeholder={isEdit ? 'Saldo attuale (es. 100,00)' : 'Saldo iniziale (es. 100,00)'}
                value={balance}
                onChangeText={(v) => setBalance(formatInputCurrency(v))}
                keyboardType="decimal-pad"
                selection={{ start: Math.max(0, balance.length - 2), end: Math.max(0, balance.length - 2) }}
              />
              {isEdit ? (
                <Text style={styles.balanceHint}>
                  Saldo iniziale: {formatCurrency((balance.trim() === '' ? 0 : parseCurrencyInput(balance)) - net)}
                </Text>
              ) : null}
              <Text style={styles.fieldLabel}>Tipo di conto</Text>
              <Segmented
                options={[
                  { value: 'carta', label: TYPE_LABELS.carta, icon: 'card-outline' },
                  { value: 'banca', label: TYPE_LABELS.banca, icon: 'business-outline' },
                  { value: 'contanti', label: TYPE_LABELS.contanti, icon: 'cash-outline' },
                ]}
                value={type}
                onChange={setType}
              />
              {type !== 'contanti' ? (
                <FormField
                  icon="card-outline"
                  label="Codice"
                  placeholder={type === 'banca' ? 'IBAN (es. IT60X0542811101000000123456)' : 'Numero carta (es. 1234 5678 9101 1121)'}
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="characters"
                />
              ) : null}
              <Text style={styles.fieldLabel}>Colore</Text>
              <View style={styles.colorBlock}>
                {COLOR_ROWS.map((rowColors, rowIndex) => (
                  <View key={rowIndex} style={styles.colorRow}>
                    {rowColors.map((c) => (
                      <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} onPress={() => setColor(c)} />
                    ))}
                  </View>
                ))}
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
  fieldLabel: { fontSize: 12, fontFamily: FONT.semiBold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  colorBlock: { marginBottom: 8 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginBottom: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotActive: { borderWidth: 3, borderColor: '#0F172A' },
  balanceHint: { fontFamily: FONT.medium, fontSize: 12, color: colors.textMuted, marginTop: 6, marginBottom: 4 },
  error: { color: colors.negative, fontFamily: FONT.medium, fontSize: 13, marginTop: 4, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  btnCancel: { backgroundColor: '#F1F5F9' },
  btnSave: { backgroundColor: '#4F46E5', elevation: 3, shadowColor: '#4F46E5', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  btnText: { color: '#475569', fontFamily: FONT.semiBold, fontSize: 15 },
  btnSaveText: { color: '#fff', fontFamily: FONT.semiBold, fontSize: 15 },
});