export const CATEGORIES = [
  { key: 'cibo', label: 'Cibo', icon: 'fast-food-outline', color: '#F4511E' },
  { key: 'trasporti', label: 'Trasporti', icon: 'car-outline', color: '#1E88E5' },
  { key: 'casa', label: 'Casa', icon: 'home-outline', color: '#8E24AA' },
  { key: 'bollette', label: 'Bollette', icon: 'receipt-outline', color: '#00897B' },
  { key: 'salute', label: 'Salute', icon: 'medical-outline', color: '#E53935' },
  { key: 'svago', label: 'Svago', icon: 'game-controller-outline', color: '#FB8C00' },
  { key: 'sport', label: 'Sport', icon: 'football-outline', color: '#1565C0' },
  { key: 'auto', label: 'Auto', icon: 'car-sport-outline', color: '#6D4C41' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#43A047' },
  { key: 'stipendio', label: 'Stipendio', icon: 'cash-outline', color: '#00838F' },
  { key: 'altro', label: 'Altro', icon: 'ellipsis-horizontal-outline', color: '#757575' },
  { key: 'trasferimento', label: 'Trasferimento', icon: 'swap-horizontal-outline', color: '#9CA3AF' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

export const SPENDING_CATEGORIES = CATEGORIES.filter((c) => c.key !== 'trasferimento');

export function orderedCategoryKeys() {
  const standard = CATEGORIES.map((c) => c.key);
  return { central: standard.slice(0, 2), rest: standard.slice(2) };
}

export function toggleCategory(selectedKeys, key) {
  return selectedKeys.includes(key)
    ? selectedKeys.filter((k) => k !== key)
    : [...selectedKeys, key];
}

export function hasSelectedCategories(selectedKeys) {
  return selectedKeys.length > 0;
}

export function matchesCategorySelection(selectedKeys, transaction) {
  if (selectedKeys.length === 0) return true;
  if (transaction.kind === 'transfer') return selectedKeys.includes('trasferimento');
  return selectedKeys.includes(transaction.category);
}