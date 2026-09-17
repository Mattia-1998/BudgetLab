import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/db';
import { sortAccountsByOrder } from '../utils/finance';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'accounts'),
      (snap) => {
        setAccounts(sortAccountsByOrder(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { accounts, loading, error };
}