import { View, Text, StyleSheet } from 'react-native';

export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text>Movimenti</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
