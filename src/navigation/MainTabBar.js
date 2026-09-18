import { View, StyleSheet } from 'react-native';
import { PlatformPressable, Label } from '@react-navigation/elements';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

export default function MainTabBar({ tabs, index, onSelect }) {
  const insets = useSafeAreaInsets();
  const { fonts } = useTheme();

  return (
    <View style={[styles.bar, { height: 58 + insets.bottom }]}>
      <View style={styles.row}>
        {tabs.map((tab, i) => {
          const focused = i === index;
          const color = focused ? colors.primary : colors.textMuted;
          return (
            <PlatformPressable
              key={tab.name}
              onPress={() => onSelect(i)}
              android_ripple={{ borderless: true }}
              pressOpacity={1}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              style={styles.item}
            >
              <Ionicons name={tab.icon} size={25} color={color} />
              <Label style={[styles.label, fonts.medium]} tintColor={color}>{tab.title}</Label>
            </PlatformPressable>
          );
        })}
      </View>
      <View style={[styles.navBarStrip, { height: insets.bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D8D8D8',
    elevation: 8,
  },
  row: { flex: 1, flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: 5 },
  label: { fontSize: 10 },
  navBarStrip: { backgroundColor: '#000000' },
});