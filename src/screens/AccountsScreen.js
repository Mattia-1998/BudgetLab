import { useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
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

const TYPE_LABELS = { carta: 'Carta', banca: 'Conto Corrente', contanti: 'Contanti' };

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
        <Text style={styles.totalLabel}>Totale saldi</Text>
        <Text style={[styles.totalValue, { color: total >= 0 ? '#111827' : colors.negative }]}>{formatCurrency(total)}</Text>
      </View>
      <FlatList
        data={accounts}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => {
          const bal = accountBalance(transactions, item.id, item.initialBalance);
          const balColor = bal >= 0 ? '#111827' : colors.negative;
          return (
            <Pressable style={styles.card} onPress={() => openEdit(item)}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
                {item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
              </View>
              <Text style={[styles.cardBalance, { color: balColor }]}>{formatCurrency(bal)}</Text>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={12} style={styles.cardDelete}>
                <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
      />
      <View style={styles.addFooter}>
        <TouchableOpacity style={styles.add} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addText}>Aggiungi conto</Text>
        </TouchableOpacity>
      </View>
      <AccountFormModal visible={modalVisible} onClose={() => setModalVisible(false)} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.negative },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 16, marginTop: 12, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  totalLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  totalValue: { fontSize: 18, fontWeight: '700' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  cardBody: { flex: 1, marginLeft: 10 },
  cardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardType: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardCode: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  cardBalance: { fontSize: 14, fontWeight: '700', marginRight: 12 },
  cardDelete: { paddingLeft: 4 },
  empty: { textAlign: 'center', marginTop: 40, color: '#888' },
  addFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10, backgroundColor: colors.background },
  add: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: 48, borderRadius: 16, backgroundColor: colors.primary },
  addText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 6 },
});