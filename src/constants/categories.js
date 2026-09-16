export const CATEGORIES = [
  { key: 'cibo', label: 'Cibo', icon: 'fast-food-outline', color: '#F4511E' },
  { key: 'trasporti', label: 'Trasporti', icon: 'car-outline', color: '#1E88E5' },
  { key: 'casa', label: 'Casa', icon: 'home-outline', color: '#8E24AA' },
  { key: 'bollette', label: 'Bollette', icon: 'receipt-outline', color: '#00897B' },
  { key: 'salute', label: 'Salute', icon: 'medical-outline', color: '#E53935' },
  { key: 'svago', label: 'Svago', icon: 'game-controller-outline', color: '#FB8C00' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#43A047' },
  { key: 'altro', label: 'Altro', icon: 'ellipsis-horizontal-outline', color: '#757575' },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));