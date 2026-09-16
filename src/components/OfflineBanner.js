import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { colors } from '../theme/colors';

export default function OfflineBanner() {
  const online = useNetworkStatus();
  if (online) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Nessuna connessione — le modifiche verranno sincronizzate quando torna la rete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: colors.offlineBg, paddingVertical: 8, paddingHorizontal: 12 },
  text: { color: colors.offlineText, textAlign: 'center', fontSize: 13 },
});