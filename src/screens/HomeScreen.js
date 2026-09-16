import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { monthRange, totalBalance, sumByKind } from '../utils/finance';
import { formatMonthLabel, formatCurrency } from '../utils/format';
import MonthlyNav from '../components/MonthlyNav';
import AccountCards from '../components/AccountCards';
import ExpensePie from '../components/ExpensePie';
import TransactionItem from '../components/TransactionItem';
import TransactionFormModal from '../components/TransactionFormModal';
import OfflineBanner from '../components/OfflineBanner';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const { accounts, loading: loadingAccts, error: errorAccts } = useAccounts();
  const { transactions, loading: loadingTxs, error: errorTxs } = useTransactions();
  const [month, setMonth] = useState(() => new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  if (loadingAccts || loadingTxs) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (errorAccts || errorTxs) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore</Text></View>;

  const range = monthRange(month);
  const total = totalBalance(accounts, transactions);
  const income = sumByKind(transactions, 'income', range.startMs, range.endMs);
  const expense = sumByKind(transactions, 'expense', range.startMs, range.endMs);
  const monthTx = transactions
    .filter((t) => t.date >= range.startMs && t.date <= range.endMs)
    .sort((a, b) => b.date - a.date);
  const recent = monthTx.slice(0, 10);

  const prev = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const next = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <MonthlyNav month={month} label={formatMonthLabel(month)} onPrev={prev} onNext={next} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {accounts.length === 0 && !loadingAccts && !loadingTxs && !errorAccts && !errorTxs ? (
          <Text style={styles.invite}>Crea un conto nella tab Conti per iniziare</Text>
        ) : null}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Totale saldi</Text>
          <Text style={[styles.totalValue, { color: total >= 0 ? colors.positive : colors.negative }]}>{formatCurrency(total)}</Text>
          <View style={styles.monthSummary}>
            <Text style={styles.sumIn}>Entrate: {formatCurrency(income)}</Text>
            <Text style={styles.sumOut}>Uscite: {formatCurrency(expense)}</Text>
          </View>
        </View>
        <AccountCards accounts={accounts} transactions={transactions} />
        <Text style={styles.sectionTitle}>Spese per categoria · {formatMonthLabel(month)}</Text>
        <ExpensePie transactions={transactions} startMs={range.startMs} endMs={range.endMs} />
        <Text style={styles.sectionTitle}>Ultimi movimenti</Text>
        {recent.length === 0 ? (
          <Text style={styles.empty}>Nessun movimento in questo mese.</Text>
        ) : (
          recent.map((t) => (
            <TransactionItem key={t.id} transaction={t} onPress={() => { setEditing(t); setModalVisible(true); }} />
          ))
        )}
      </ScrollView>
      <Pressable style={styles.fab} onPress={() => { setEditing(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} accounts={accounts} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.negative },
  scrollContent: { paddingBottom: 100 },
  totalCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, borderRadius: 12, padding: 16 },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 28, fontWeight: '700', marginTop: 4 },
  monthSummary: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  sumIn: { color: colors.positive, fontWeight: '600' },
  sumOut: { color: colors.negative, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 16 },
  invite: { marginHorizontal: 16, marginTop: 24, marginBottom: 8, fontSize: 15, color: '#888', textAlign: 'center' },
  empty: { textAlign: 'center', marginTop: 20, color: '#888' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});