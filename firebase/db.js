import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { FIREBASE_CONFIG } from './config.js';

const app = initializeApp(FIREBASE_CONFIG);
const db = initializeFirestore(app, { cacheSizeBytes: CACHE_SIZE_UNLIMITED });

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'already-exists') {
    console.warn('[firebase] persistenza già attiva');
  } else {
    console.error('[firebase] inizializzazione persistenza fallita', err);
  }
});

export { db, app };