import { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { monthRange, isInRange } from '../utils/finance';
import { formatMonthLabel } from '../utils/format';
import TransactionItem from '../components/TransactionItem';
import TransactionFormModal from '../components/TransactionFormModal';
import MonthlyNav from '../components/MonthlyNav';
import Segmented from '../components/Segmented';
import OfflineBanner from '../components/OfflineBanner';

export default function TransactionsScreen() {
  const { accounts, loading: loadingAccts, error: errorAccts } = useAccounts();
  const { transactions, loading: loadingTxs, error: errorTxs } = useTransactions();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all'); // 'all' | 'income' | 'expense'
  const [accountId, setAccountId] = useState('all');
  const [category, setCategory] = useState('all');
  const [month, setMonth] = useState(() => new Date());
  const [allMonths, setAllMonths] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const range = allMonths ? null : monthRange(month);
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (kind !== 'all' && t.kind !== kind) return false;
        if (accountId !== 'all' && t.accountId !== accountId) return false;
        if (category !== 'all' && t.category !== category) return false;
        if (range && !isInRange(t.date, range.startMs, range.endMs)) return false;
        if (q) {
          const catLabel = (CATEGORY_MAP[t.category] || CATEGORY_MAP.altro).label.toLowerCase();
          const note = (t.note || '').toLowerCase();
          if (!catLabel.includes(q) && !note.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  }, [transactions, query, kind, accountId, category, month, allMonths]);

  if (loadingAccts || loadingTxs) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (errorAccts || errorTxs) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore</Text></View>;

  const confirmDelete = (t) =>
    Alert.alert('Elimina movimento', 'Eliminare questo movimento?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'transactions', t.id)) },
    ]);

  const prev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <TextInput style={styles.search} placeholder="Cerca per categoria o nota" value={query} onChangeText={setQuery} />
      <View style={styles.filters}>
        <Segmented
          options={[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }]}
          value={kind}
          onChange={setKind}
        />
        <Segmented
          options={[{ value: 'all', label: 'Conto: tutti' }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]}
          value={accountId}
          onChange={setAccountId}
        />
        <Segmented
          options={[{ value: 'all', label: 'Cat: tutte' }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]}
          value={category}
          onChange={setCategory}
        />
        <MonthlyNav
          month={month}
          label={allMonths ? 'Tutti i mesi' : formatMonthLabel(month)}
          onPrev={prev}
          onNext={next}
          onAll={() => setAllMonths(true)}
          allActive={allMonths}
        />
        {allMonths ? <Pressable onPress={() => setAllMonths(false)}><Text style={styles.undoAll}>Torna al mese corrente</Text></Pressable> : null}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => { setEditing(item); setModalVisible(true); }}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>Nessun movimento trovato.</Text>}
      />
      <Pressable style={styles.fab} onPress={() => { setEditing(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} accounts={accounts} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5' },
  errorText: { color: '#C62828' },
  search: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#DDD' },
  filters: { marginTop: 8, paddingHorizontal: 16 },
  undoAll: { color: '#1B5E20', textAlign: 'center', marginBottom: 6, fontWeight: '600' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
