import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);

// Su React Native (Expo Go) IndexedDB non è disponibile: si usa la cache in memoria,
// il SDK bufferizza le scritture offline durante la sessione e le sincronizza alla riconnessione.
const db = initializeFirestore(app, { cache: memoryLocalCache({}) });

export { db, app };