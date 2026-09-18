import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { HeaderBackground, HeaderTitle, getDefaultHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function AppHeader({ title }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const headerHeight = getDefaultHeaderHeight({ width, height }, false, insets.top);

  return (
    <View style={[styles.container, { height: headerHeight }]}>
      <HeaderBackground style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <HeaderTitle>{title}</HeaderTitle>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.surface },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});