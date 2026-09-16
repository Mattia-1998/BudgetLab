import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_MAP } from '../constants/categories';
import { formatCurrency, formatDate } from '../utils/format';
import { colors } from '../theme/colors';

export default function TransactionItem({ transaction, onPress, onDelete }) {
  const cat = CATEGORY_MAP[transaction.category] || CATEGORY_MAP.altro;
  const income = transaction.kind === 'income';
  const amount = (income ? '+' : '-') + formatCurrency(transaction.amount);
  return (
    <View style={styles.card}>
      <Pressable style={styles.main} onPress={onPress}>
        <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
          <Ionicons name={cat.icon} size={20} color={cat.color} />
        </View>
        <View style={styles.body}>
          <Text style={styles.desc}>{transaction.note || cat.label}</Text>
          <Text style={styles.sub}>{cat.label} · {formatDate(transaction.date)}</Text>
        </View>
        <Text style={[styles.amount, { color: income ? colors.positive : colors.negative }]}>{amount}</Text>
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
