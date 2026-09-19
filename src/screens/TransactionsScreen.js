import { useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, Pressable, Alert, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { CATEGORY_MAP, orderedCategoryKeys, toggleCategory, hasSelectedCategories, matchesCategorySelection } from '../constants/categories';
import { isInRange, matchesAccountFilter } from '../utils/finance';
import CategoryTile from '../components/CategoryTile';
import TransactionItem from '../components/TransactionItem';
import TransactionFormModal from '../components/TransactionFormModal';
import MonthCarousel from '../components/MonthCarousel';
import PeriodSheet from '../components/PeriodSheet';
import usePeriod from '../hooks/usePeriod';
import OfflineBanner from '../components/OfflineBanner';
import { colors } from '../theme/colors';

export default function TransactionsScreen() {
  const { accounts, loading: loadingAccts, error: errorAccts } = useAccounts();
  const { transactions, loading: loadingTxs, error: errorTxs } = useTransactions();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all'); // 'all' | 'income' | 'expense' | 'transfer'
  const [accountId, setAccountId] = useState('all');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [periodVisible, setPeriodVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const { period, startMs, endMs, label, prevLabel, nextLabel, allActive, shiftable, prev, next, toggleAll, applyPeriod } = usePeriod();
  const { width } = useWindowDimensions();
  const tileWidth = Math.floor((width - 56) / 4); // 32 di padding laterali di filterBlock + 24 di gap (3×8)
  const accountMap = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const { central, rest } = orderedCategoryKeys();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (kind !== 'all' && t.kind !== kind) return false;
        if (!matchesAccountFilter(t, accountId)) return false;
        if (!matchesCategorySelection(selectedCategories, t)) return false;
        if (!isInRange(t.date, startMs, endMs)) return false;
        if (q) {
          const catLabel = (CATEGORY_MAP[t.category] || CATEGORY_MAP.altro).label.toLowerCase();
          const note = (t.note || '').toLowerCase();
          if (!catLabel.includes(q) && !note.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  }, [transactions, query, kind, accountId, selectedCategories, startMs, endMs]);

  if (loadingAccts || loadingTxs) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (errorAccts || errorTxs) return <View style={styles.center}><Text style={styles.errorText}>Errore Firestore</Text></View>;

  const confirmDelete = (t) =>
    Alert.alert('Elimina movimento', 'Eliminare questo movimento?', [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'transactions', t.id)).catch((e) => Alert.alert('Errore', 'Impossibile eliminare il movimento: ' + e.message)) },
    ]);

  const toggleCategories = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesExpanded((v) => !v);
  };

  return (
    <View style={styles.container}>
      <OfflineBanner />
      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            onPress={() => { setEditing(item); setModalVisible(true); }}
            onDelete={() => confirmDelete(item)}
            accountById={accountMap}
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.faintText} style={styles.searchIcon} />
              <TextInput style={styles.search} placeholder="Cerca per categoria o nota..." placeholderTextColor={colors.faintText} value={query} onChangeText={setQuery} />
              {query ? (
                <Pressable style={styles.searchClear} onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={colors.faintText} />
                </Pressable>
              ) : null}
            </View>
            <View style={styles.filterRow}>
              {[{ value: 'all', label: 'Tutte' }, { value: 'income', label: 'Entrate' }, { value: 'expense', label: 'Uscite' }, { value: 'transfer', label: 'Trasferimenti' }].map((opt) => (
                <Pressable key={opt.value} style={[styles.pill, kind === opt.value && styles.pillActive]} onPress={() => { setKind(opt.value); if (opt.value === 'transfer') setSelectedCategories([]); }}>
                  <Text style={[styles.pillText, kind === opt.value && styles.pillTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.monthWrap}>
              <MonthCarousel month={new Date(period.anchor)} label={label} prevLabel={prevLabel} nextLabel={nextLabel} onPrev={prev} onNext={next} onAll={toggleAll} onSelect={() => setPeriodVisible(true)} allActive={allActive} shiftable={shiftable} />
            </View>
            <View style={styles.filterBlock}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Conto</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionRow}>
                  <Pressable style={[styles.pill, accountId === 'all' && styles.pillActive]} onPress={() => setAccountId('all')}>
                    <Text style={[styles.pillText, accountId === 'all' && styles.pillTextActive]}>Tutti i conti</Text>
                  </Pressable>
                  {accounts.map((a) => (
                    <Pressable key={a.id} style={[styles.pill, accountId === a.id && styles.pillActive]} onPress={() => setAccountId(a.id)}>
                      <View style={[styles.dot, { backgroundColor: a.color }]} />
                      <Text style={[styles.pillText, accountId === a.id && styles.pillTextActive]}>{a.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              {kind !== 'transfer' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Categoria</Text>
                  <View style={styles.catGrid}>
                    <CategoryTile
                      icon="apps-outline"
                      label="Tutte"
                      color="#111827"
                      inactiveColor={colors.textMuted}
                      active={selectedCategories.length === 0}
                      width={tileWidth}
                      onPress={() => setSelectedCategories([])}
                    />
                    {central.map((key) => {
                      const c = CATEGORY_MAP[key];
                      return (
                        <CategoryTile
                          key={key}
                          icon={c.icon}
                          label={c.label}
                          color={c.color}
                          active={selectedCategories.includes(key)}
                          width={tileWidth}
                          onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}
                        />
                      );
                    })}
                    <Pressable style={[styles.catTileArrow, { width: tileWidth }, !categoriesExpanded && hasSelectedCategories(selectedCategories) && styles.catTileArrowActive]} onPress={toggleCategories}>
                      <Ionicons name={categoriesExpanded ? 'chevron-up' : 'chevron-down'} size={24} color={!categoriesExpanded && hasSelectedCategories(selectedCategories) ? '#fff' : colors.textMuted} />
                    </Pressable>
                    {categoriesExpanded
                      ? rest.map((key) => {
                          const c = CATEGORY_MAP[key];
                          return (
                            <CategoryTile
                              key={key}
                              icon={c.icon}
                              label={c.label}
                              color={c.color}
                              active={selectedCategories.includes(key)}
                              width={tileWidth}
                              onPress={() => setSelectedCategories((s) => toggleCategory(s, key))}
                            />
                          );
                        })
                      : null}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="clipboard-outline" size={26} color={colors.faintText} />
            </View>
            <Text style={styles.emptyTitle}>Nessun movimento trovato</Text>
            <Text style={styles.emptySub}>Prova a cambiare i filtri di ricerca o il mese.</Text>
          </View>
        }
      />
      <Pressable style={styles.fab} onPress={() => { setEditing(null); setModalVisible(true); }}>
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>
      <PeriodSheet visible={periodVisible} period={period} onSelect={applyPeriod} onClose={() => setPeriodVisible(false)} />
      <TransactionFormModal visible={modalVisible} onClose={() => setModalVisible(false)} accounts={accounts} initial={editing} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.negative },
  searchWrap: { marginHorizontal: 16, marginTop: 12, justifyContent: 'center' },
  search: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingVertical: 14, paddingLeft: 40, paddingRight: 40, fontSize: 14, color: colors.text },
  searchIcon: { position: 'absolute', left: 14 },
  searchClear: { position: 'absolute', right: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 17, backgroundColor: '#F1F2F4', borderWidth: 1, borderColor: colors.chipBorder },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { fontSize: 13, fontWeight: '500', color: '#4A5568' },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  monthWrap: { marginHorizontal: 16, marginTop: 10 },
  filterBlock: { paddingHorizontal: 16, marginTop: 8 },
  section: { marginTop: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, color: colors.textMuted, marginBottom: 8 },
  sectionRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catTileArrow: { height: 78, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  catTileArrowActive: { backgroundColor: '#111827', borderColor: '#111827' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  emptyCard: { marginTop: 24, marginHorizontal: 16, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', paddingVertical: 40, alignItems: 'center', backgroundColor: '#fff' },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', textAlign: 'center', marginTop: 12 },
  emptySub: { fontSize: 12, color: colors.faintText, textAlign: 'center', marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
});
