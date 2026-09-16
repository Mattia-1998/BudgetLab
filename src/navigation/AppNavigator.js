import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
          tabBarActiveTintColor: colors.primary,
          headerTitleAlign: 'center',
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Movimenti" component={TransactionsScreen} options={{ title: 'Movimenti' }} />
        <Tab.Screen name="Conti" component={AccountsScreen} options={{ title: 'Conti' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
