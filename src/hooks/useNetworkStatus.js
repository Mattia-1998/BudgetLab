import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;
    Network.getNetworkStateAsync()
      .then((state) => {
        if (mounted) setOnline(state.isInternetReachable !== false);
      })
      .catch(() => {});
    const sub = Network.addNetworkStateListener((state) => {
      if (mounted) setOnline(state.isInternetReachable !== false);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return online;
}