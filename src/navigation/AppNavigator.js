import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Movimenti: 'swap-vertical-outline',
  Conti: 'wallet-outline',
};

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  const tabBarBackground = () => (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.tabBarSurface} />
      <View style={[styles.navBarStrip, { height: insets.bottom }]} />
    </View>
  );

  const tabBarStyle = { height: 58 + insets.bottom };

  const tabBarButton = (props) => (
    <PlatformPressable {...props} style={[props.style, styles.tabBarButtonContent]} />
  );

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          headerTitleAlign: 'center',
          tabBarButton,
          tabBarBackground,
          tabBarStyle,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Movimenti" component={TransactionsScreen} options={{ title: 'Movimenti' }} />
        <Tab.Screen name="Conti" component={AccountsScreen} options={{ title: 'Conti' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarSurface: { flex: 1, backgroundColor: colors.surface },
  navBarStrip: { backgroundColor: '#000000' },
  tabBarButtonContent: { justifyContent: 'center' },
});