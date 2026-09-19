import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Easing, PanResponder, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { accountBalance, totalBalance, dragInsertIndex, dragRowOffsets, reorderAt } from '../utils/finance';
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

  const listRef = useRef(null);
  const rowHeights = useRef({});
  const scrollOffset = useRef(0);
  const workingRef = useRef(accounts);
  const drag = useRef({
    active: false,
    id: null,
    startIndex: 0,
    curIndex: 0,
    grantY: 0,
    baseGhostTop: 0,
    didDrag: false,
    granted: false,
    prevList: null,
    lastOffsets: null,
  }).current;

  const [dragId, setDragId] = useState(null);
  const [working, setWorking] = useState(accounts);
  const ghostY = useRef(new Animated.Value(0)).current;
  const ghostScale = useRef(new Animated.Value(1)).current;
  const rowOffsets = useRef({});

  const syncWorking = (next) => { workingRef.current = next; setWorking(next); };

  useEffect(() => {
    if (!drag.active) syncWorking(accounts);
  }, [accounts]);

  const rowHeightOf = (a) => rowHeights.current[a.id] || 70;

  const ensureRowOffset = (id) => {
    if (!rowOffsets.current[id]) rowOffsets.current[id] = new Animated.Value(0);
    return rowOffsets.current[id];
  };

  const resetRowOffsets = () => {
    Object.values(rowOffsets.current).forEach((v) => v.setValue(0));
  };

  const applyOffsets = (targetIndex) => {
    const list = workingRef.current;
    const targets = dragRowOffsets(list, drag.id, rowHeights.current, targetIndex);
    list.forEach((r) => ensureRowOffset(r.id));
    list.forEach((r) => {
      if (r.id === drag.id) return;
      const val = rowOffsets.current[r.id];
      if ((drag.lastOffsets && drag.lastOffsets[r.id]) !== targets[r.id]) {
        Animated.timing(val, { toValue: targets[r.id], duration: 160, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
      }
    });
    drag.lastOffsets = targets;
  };

  // top in coordinate "contenuto" della riga index (paddingTop 10 + righe precedenti + separatori da 10)
  const contentRowTop = (list, index) => {
    let top = 10;
    for (let i = 0; i < index; i++) top += rowHeightOf(list[i]) + 10;
    return top;
  };

  const startDrag = (acc, index, evt) => {
    drag.active = true;
    drag.id = acc.id;
    drag.startIndex = index;
    drag.curIndex = index;
    drag.grantY = evt.nativeEvent.pageY;
    drag.didDrag = false;
    drag.granted = false;
    drag.prevList = [...accounts];
    drag.lastOffsets = null;
    resetRowOffsets();
    drag.baseGhostTop = contentRowTop([...accounts], index) + (evt.nativeEvent.locationY - rowHeightOf(acc) / 2);
    ghostY.setValue(drag.baseGhostTop - (scrollOffset.current || 0));
    syncWorking([...accounts]);
    setDragId(acc.id);
    Vibration.vibrate(10);
    Animated.spring(ghostScale, { toValue: 1.03, useNativeDriver: true }).start();
  };

  const finishDrag = () => {
    if (!drag.active) return;
    const list = workingRef.current;
    const prevList = drag.prevList;
    drag.active = false;
    drag.id = null;
    if (!drag.didDrag) {
      setDragId(null);
      Animated.spring(ghostScale, { toValue: 1, useNativeDriver: true }).start();
      resetRowOffsets();
      drag.lastOffsets = null;
      syncWorking(prevList || list);
      return;
    }
    const final = reorderAt(list, drag.startIndex, drag.curIndex);
    const targetY = contentRowTop(final, drag.curIndex) - (scrollOffset.current || 0);
    Animated.parallel([
      Animated.timing(ghostY, { toValue: targetY, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(ghostScale, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start(() => {
      setDragId(null);
      syncWorking(final);
      resetRowOffsets();
      drag.lastOffsets = null;
      const batch = writeBatch(db);
      final.forEach((a, i) => {
        if ((a.order ?? null) !== i) batch.update(doc(db, 'accounts', a.id), { order: i });
      });
      batch.commit().catch((err) => {
        Alert.alert('Errore', "Impossibile salvare l'ordine: " + err.message);
        syncWorking(prevList || final);
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => drag.active,
      onPanResponderGrant: () => { drag.granted = true; },
      onPanResponderMove: (_, gs) => {
        if (!drag.active) return;
        const dy = gs.moveY - drag.grantY;
        if (Math.abs(dy) > 5) drag.didDrag = true;
        const list = workingRef.current;
        const dragged = list.find((a) => a.id === drag.id);
        if (!dragged) return;
        const ghostTop = drag.baseGhostTop + dy;
        const ghostMid = ghostTop + rowHeightOf(dragged) / 2;
        const rows = list.filter((a) => a.id !== drag.id);
        const insertAt = dragInsertIndex(rows, rowHeights.current, ghostMid);
        if (insertAt !== drag.curIndex) {
          drag.curIndex = insertAt;
          applyOffsets(insertAt);
        }
        ghostY.setValue(Math.max(0, ghostTop) - (scrollOffset.current || 0));
      },
      onPanResponderRelease: finishDrag,
      onPanResponderTerminate: finishDrag,
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const renderCardContent = (item, withTrash) => {
    const bal = accountBalance(transactions, item.id, item.initialBalance);
    const balColor = bal >= 0 ? '#111827' : colors.negative;
    return (
      <>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <View style={styles.cardBody}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardType}>{TYPE_LABELS[item.type] || item.type}</Text>
          {item.code ? <Text style={styles.cardCode}>{item.code}</Text> : null}
        </View>
        <Text style={[styles.cardBalance, { color: balColor }]}>{formatCurrency(bal)}</Text>
        {withTrash ? (
          <Pressable onPress={() => confirmDelete(item)} hitSlop={12} style={styles.cardDelete}>
            <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
          </Pressable>
        ) : null}
      </>
    );
  };

  const openCreate = () => { setEditing(null); setModalVisible(true); };
  const openEdit = (acc) => { setEditing(acc); setModalVisible(true); };

  const confirmDelete = (acc) => {
    if (drag.active) return;
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
      <View style={styles.listWrap}>
        <FlatList
          ref={listRef}
          data={working}
          keyExtractor={(a) => a.id}
          renderItem={({ item, index }) => {
            const offset = ensureRowOffset(item.id);
            const isDragged = dragId === item.id;
            return (
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  { transform: [{ translateY: offset }], opacity: isDragged ? 0 : 1 },
                ]}
              >
                <View
                  onLayout={(e) => { rowHeights.current[item.id] = e.nativeEvent.layout.height; }}
                >
                  <Pressable
                    style={styles.card}
                    onPress={() => { if (!drag.active) openEdit(item); }}
                    onLongPress={(e) => startDrag(item, index, e)}
                    onPressOut={() => {
                      setTimeout(() => {
                        if (drag.active && !drag.granted) finishDrag();
                      }, 0);
                    }}
                  >
                    {renderCardContent(item, true)}
                  </Pressable>
                </View>
                <View style={styles.rowSpacer} />
              </Animated.View>
            );
          }}
          contentContainerStyle={styles.listContent}
          scrollEnabled={dragId === null}
          removeClippedSubviews={false}
          onScroll={(e) => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
          ListEmptyComponent={<Text style={styles.empty}>Nessun conto. Aggiungine uno.</Text>}
        />
        {dragId ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.ghost, { transform: [{ translateY: ghostY }, { scale: ghostScale }] }]}
          >
            <View style={styles.card}>
              {renderCardContent(working.find((a) => a.id === dragId) || accounts.find((a) => a.id === dragId), false)}
            </View>
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.addFooter}>
        <TouchableOpacity style={styles.add} onPress={openCreate}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addText}>Aggiungi conto</Text>
        </TouchableOpacity>
      </View>
      <AccountFormModal visible={modalVisible} onClose={() => setModalVisible(false)} initial={editing} accounts={accounts} transactions={transactions} />
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  listWrap: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingTop: 10, paddingBottom: 20 },
  rowSpacer: { height: 10 },
  ghost: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 10, elevation: 8 },
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