import HomeScreen from '../screens/HomeScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AccountsScreen from '../screens/AccountsScreen';

export const TABS = [
  { name: 'Home', title: 'Home', icon: 'home-outline', component: HomeScreen },
  { name: 'Movimenti', title: 'Movimenti', icon: 'swap-vertical-outline', component: TransactionsScreen },
  { name: 'Conti', title: 'Conti', icon: 'wallet-outline', component: AccountsScreen },
];