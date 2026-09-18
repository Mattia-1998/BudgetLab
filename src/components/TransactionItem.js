import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_MAP } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/format';
import { colors } from '../theme/colors';

export default function TransactionItem({ transaction, onPress, onDelete, accountById }) {
  const cat = CATEGORY_MAP[transaction.category] || CATEGORY_MAP.altro;
  const income = transaction.kind === 'income';
  const isTransfer = transaction.kind === 'transfer';
  const amount = isTransfer ? '-'.concat(formatCurrency(transaction.amount)) : (income ? '+' : '-') + formatCurrency(transaction.amount);
  const srcName = accountById && accountById[transaction.accountId] ? accountById[transaction.accountId].name : 'Conto';
  const dstName = accountById && accountById[transaction.transferTo] ? accountById[transaction.transferTo].name : 'Conto';
  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={[styles.iconWrap, { backgroundColor: isTransfer ? '#F3F4F6' : cat.color + '22' }]}>
          <Ionicons name={isTransfer ? 'swap-horizontal-outline' : cat.icon} size={20} color={isTransfer ? '#9CA3AF' : cat.color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.desc}>
            {isTransfer
              ? transaction.note || (transaction.direction ? (transaction.direction === 'deposito' ? 'Deposito' : 'Prelievo') : 'Trasferimento')
              : transaction.note || cat.label}
          </Text>
          <Text style={styles.sub}>
            {isTransfer
              ? `${srcName} → ${dstName} · ${formatDate(transaction.date)}`
              : `${cat.label} · ${formatDate(transaction.date)}`}
          </Text>
        </View>
        <Text style={[styles.amount, { color: isTransfer ? '#9CA3AF' : (income ? colors.positive : colors.negative) }]}>{amount}</Text>
      </Pressable>
      {onDelete ? (
        <Pressable onPress={onDelete} hitSlop={12} style={styles.delete}>
          <Ionicons name="trash-outline" size={18} color={colors.negative} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: 16, marginTop: 8, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  desc: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
  delete: { paddingLeft: 8 },
});
