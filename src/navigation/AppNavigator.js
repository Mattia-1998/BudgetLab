import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';
import { colors } from '../theme/colors';
import useAutoHideSystemBar from '../hooks/useAutoHideSystemBar';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home-outline',
  Movimenti: 'swap-vertical-outline',
  Conti: 'wallet-outline',
};

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { hidden, resetTimer } = useAutoHideSystemBar();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const bottomInsetRef = useRef(insets.bottom);

  useEffect(() => {
    if (insets.bottom > bottomInsetRef.current) {
      bottomInsetRef.current = insets.bottom;
    }
  }, [insets.bottom]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: hidden ? bottomInsetRef.current : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [hidden, slideAnim]);

  return (
    <View style={styles.root} onTouchStart={resetTimer}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
            ),
            tabBarActiveTintColor: colors.primary,
            headerTitleAlign: 'center',
          })}
          tabBar={(tabBarProps) => (
            <Animated.View
              style={{
                transform: [{ translateY: slideAnim }],
              }}
            >
              <BottomTabBar {...tabBarProps} />
            </Animated.View>
          )}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
          <Tab.Screen name="Movimenti" component={TransactionsScreen} options={{ title: 'Movimenti' }} />
          <Tab.Screen name="Conti" component={AccountsScreen} options={{ title: 'Conti' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});