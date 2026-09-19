import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_MAP } from '../constants/categories';
import { expensesByCategory, accountBalance } from '../utils/finance';
import { formatCurrency } from '../utils/format';
import { colors } from '../theme/colors';
import { FONT } from '../theme/typography';

export default function ExpensePie({ transactions, startMs, endMs, label, accounts = [] }) {
  const [mode, setMode] = useState('cat');
  const toggle = () => setMode((m) => (m === 'cat' ? 'acct' : 'cat'));

  const catData = expensesByCategory(transactions, startMs, endMs);
  const catEmpty = catData.length === 0;

  const acctRows = accounts.map((a) => ({ account: a, balance: accountBalance(transactions, a.id, a.initialBalance) }));
  const positives = acctRows.filter((r) => r.balance > 0);
  const acctEmpty = positives.length === 0;
  const totalPositive = positives.reduce((s, r) => s + r.balance, 0);

  const slices =
    mode === 'cat'
      ? catData.map((d) => ({
          value: d.total,
          color: (CATEGORY_MAP[d.category] || CATEGORY_MAP.altro).color,
        }))
      : positives.map((r) => ({ value: r.balance, color: r.account.color }));

  const caption = mode === 'cat' ? `Spese per categoria${label ? ' · ' + label : ''}` : 'Ripartizione sui conti';

  const emptyText = mode === 'cat' ? 'Nessuna spesa nel mese' : 'Nessun saldo da mostrare';
  const ready = mode === 'cat' ? !catEmpty : !acctEmpty;

  const legend =
    mode === 'cat'
      ? catData.map((d) => {
          const cat = CATEGORY_MAP[d.category] || CATEGORY_MAP.altro;
          return (
            <View key={d.category} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: cat.color }]} />
              <Text style={styles.legendLabel}>{cat.label}</Text>
              <Text style={styles.legendValue}>{formatCurrency(d.total)} · {d.percent}%</Text>
            </View>
          );
        })
      : acctRows.map((r) => {
          const percent = r.balance > 0 ? Math.round((r.balance / totalPositive) * 100) : null;
          const negative = r.balance < 0;
          return (
            <View key={r.account.id} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: r.account.color }]} />
              <Text style={styles.legendLabel}>{r.account.name}</Text>
              <Text style={[styles.legendValue, negative && styles.legendNegative]}>
                {formatCurrency(r.balance)}
                {percent != null ? ` · ${percent}%` : ''}
              </Text>
            </View>
          );
        });

  return (
    <Pressable style={styles.wrap} onPress={toggle}>
      <View style={styles.captionRow}>
        <Text style={styles.caption}>{caption}</Text>
        <Ionicons name="repeat" size={16} color={colors.faintText} />
      </View>
      {ready ? (
        <>
          <PieChart data={slices} donut radius={90} innerRadius={55} focusOnPress />
          <View style={styles.legend}>{legend}</View>
        </>
      ) : (
        <View style={styles.emptyInner}>
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  captionRow: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  caption: { fontSize: 13, fontFamily: FONT.semiBold, color: '#0F172A' },
  emptyInner: { paddingVertical: 12 },
  emptyText: { color: '#888', fontFamily: FONT.medium },
  legend: { alignSelf: 'stretch', marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14 },
  legendValue: { fontSize: 14, fontFamily: FONT.semiBold },
  legendNegative: { color: colors.negative },
});