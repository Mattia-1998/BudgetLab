import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { accountBalance, totalBalance } from '../utils/finance';
import { formatCurrency } from '../utils/format';
import AccountFormModal from '../components/AccountFormModal';
import OfflineBanner from '../components/OfflineBanner';
import { colors } from '../theme/colors';

export default function AccountsScreen() {
  const { accounts, loading, error } = useAccounts();
  const { transactions } = useTransactions();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);

  const openCreate = () => { setEditing(null); setModalVisible(true); };
  const openEdit = (acc) => { setEditing(acc); setModalVisible(true); };

  const confirmDelete = (acc) => {
    Alert.alert('Elimina conto', `Eliminare "${acc.name}"? I movimenti collegati resteranno ma senza conto.`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'accounts', acc.id)).catch((e) => Alert.alert('Errore', 'Impossibile eliminare il conto: ' + e.message)) },
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore: {error.message}</Text></View>;

  const total = totalBalance(accounts, transactions);

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Totale</Text>
        <Text style={[styles.totalValue, { color: total >= 0 ? colors.positive : colors.negative }]}>{formatCurrency(total)}</Text>
      </View>
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => {
          const bal = accountBalance(transactions, item.id, item.initialBalance);
          return (
            <Pressable style={styles.card} onPress={() => openEdit(item)} onLongPress={() => confirmDelete(item)}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardType}>{item.type}</Text>
              </View>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={12}>
                <Ionicons name="trash-outline" size={20} color={colors.negative} />
              </Pressable>
              <Text style={[styles.cardBalance, { color: bal >= 0 ? colors.positive : colors.negative }]}>{formatCurrency(bal)}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
      />
      <Pressable style={styles.add} onPress={openCreate}>
        <Ionicons name="add" size={26} color="#fff" />
        <Text style={styles.addText}>Aggiungi conto</Text>
      </Pressable>
      <AccountFormModal visible={modalVisible} onClose={() => setModalVisible(false)} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.negative },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  totalLabel: { fontSize: 16, color: '#555' },
  totalValue: { fontSize: 22, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, gap: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600' },
  cardType: { fontSize: 13, color: '#888', textTransform: 'capitalize' },
  cardBalance: { fontSize: 16, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  add: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, margin: 16, padding: 14, borderRadius: 12, gap: 6 },
  addText: { color: '#fff', fontWeight: '600' },
});