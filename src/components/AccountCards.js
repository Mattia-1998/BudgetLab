import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { accountBalance } from '../utils/finance';
import { formatCurrency } from '../utils/format';
import { colors } from '../theme/colors';

export default function AccountCards({ accounts, transactions }) {
  if (accounts.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {accounts.map((a) => {
        const bal = accountBalance(transactions, a.id, a.initialBalance);
        return (
          <View key={a.id} style={[styles.card, { borderLeftColor: a.color }]}>
            <Text style={styles.name}>{a.name}</Text>
            <Text style={[styles.balance, { color: bal >= 0 ? colors.positive : colors.negative }]}>{formatCurrency(bal)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, padding: 16, minWidth: 150 },
  name: { fontSize: 14, color: '#666' },
  balance: { fontSize: 18, fontWeight: '700', marginTop: 4 },
});