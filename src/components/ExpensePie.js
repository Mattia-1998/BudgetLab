import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { CATEGORY_MAP } from '../constants/categories';
import { expensesByCategory } from '../utils/finance';
import { formatCurrency } from '../utils/format';

export default function ExpensePie({ transactions, startMs, endMs }) {
  const data = expensesByCategory(transactions, startMs, endMs);
  if (data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Nessuna spesa nel mese</Text>
      </View>
    );
  }
  const slices = data.map((d) => ({
    value: d.total,
    color: (CATEGORY_MAP[d.category] || CATEGORY_MAP.altro).color,
  }));
  return (
    <View style={styles.wrap}>
      <PieChart data={slices} donut radius={90} innerRadius={55} focusOnPress />
      <View style={styles.legend}>
        {data.map((d) => {
          const cat = CATEGORY_MAP[d.category] || CATEGORY_MAP.altro;
          return (
            <View key={d.category} style={styles.legendRow}>
              <View style={[styles.swatch, { backgroundColor: cat.color }]} />
              <Text style={styles.legendLabel}>{cat.label}</Text>
              <Text style={styles.legendValue}>{formatCurrency(d.total)} · {d.percent}%</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, alignItems: 'center' },
  empty: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#888' },
  legend: { alignSelf: 'stretch', marginTop: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontSize: 14 },
  legendValue: { fontSize: 14, fontWeight: '600' },
});