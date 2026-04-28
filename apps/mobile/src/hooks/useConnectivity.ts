import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useAppStore } from '../store/useAppStore';
import { createIncident } from '../services/api';

/**
 * Hook — monitors network connectivity and syncs offline queue on reconnect.
 * Simulates Bluetooth Mesh: when offline, incidents are queued locally and
 * synced automatically when internet becomes available.
 */
export const useConnectivity = () => {
  const { setOffline, offlineQueue, clearOfflineQueue } = useAppStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setOffline(!isConnected);

      // Sync offline queue on reconnect
      if (isConnected && offlineQueue.length > 0) {
        console.log(`[BLE-SIM] Reconnected — syncing ${offlineQueue.length} queued incidents`);
        try {
          await Promise.allSettled(
            offlineQueue.map((incident) =>
              createIncident({
                type: incident.type,
                location: incident.location,
                floor: incident.floor,
                description: `[Queued offline at ${incident.queuedAt}] ${incident.description || ''}`,
              })
            )
          );
          await clearOfflineQueue();
          console.log('[BLE-SIM] Offline queue synced successfully');
        } catch (err) {
          console.error('[BLE-SIM] Sync failed:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [offlineQueue]);

  return {
    isOffline: useAppStore((s) => s.isOffline),
    queueLength: useAppStore((s) => s.offlineQueue.length),
  };
};
