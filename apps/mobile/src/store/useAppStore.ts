import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  role: 'GUEST' | 'STAFF' | 'ADMIN';
  roomNumber?: string;
  employeeId?: string;
}

interface QueuedIncident {
  id: string;
  type: string;
  location: string;
  floor?: number;
  description?: string;
  queuedAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

interface IncidentState {
  activeIncidentId: string | null;
  offlineQueue: QueuedIncident[];
  isOffline: boolean;
}

interface AppState extends AuthState, IncidentState {
  // Auth actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;

  // Offline queue actions
  setOffline: (offline: boolean) => void;
  addToOfflineQueue: (incident: QueuedIncident) => Promise<void>;
  clearOfflineQueue: () => Promise<void>;
  setActiveIncidentId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  activeIncidentId: null,
  offlineQueue: [],
  isOffline: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['@evacuaid_user', JSON.stringify(user)],
      ['@evacuaid_access_token', accessToken],
      ['@evacuaid_refresh_token', refreshToken],
    ]);
    set({ user, accessToken, refreshToken, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      '@evacuaid_user',
      '@evacuaid_access_token',
      '@evacuaid_refresh_token',
    ]);
    set({ user: null, accessToken: null, refreshToken: null, activeIncidentId: null });
  },

  loadStoredAuth: async () => {
    try {
      const [[, userStr], [, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
        '@evacuaid_user',
        '@evacuaid_access_token',
        '@evacuaid_refresh_token',
      ]);
      if (userStr && accessToken) {
        set({
          user: JSON.parse(userStr),
          accessToken,
          refreshToken,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      // Load offline queue
      const queueStr = await AsyncStorage.getItem('@evacuaid_offline_queue');
      if (queueStr) {
        set({ offlineQueue: JSON.parse(queueStr) });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setOffline: (isOffline) => set({ isOffline }),

  addToOfflineQueue: async (incident) => {
    const current = get().offlineQueue;
    const updated = [...current, incident];
    await AsyncStorage.setItem('@evacuaid_offline_queue', JSON.stringify(updated));
    set({ offlineQueue: updated });
  },

  clearOfflineQueue: async () => {
    await AsyncStorage.removeItem('@evacuaid_offline_queue');
    set({ offlineQueue: [] });
  },

  setActiveIncidentId: (id) => set({ activeIncidentId: id }),
}));
