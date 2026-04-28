import axios from 'axios';
import { API_URL } from '../constants';
import { useAppStore } from '../store/useAppStore';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth token to every request
api.interceptors.request.use((config) => {
  const token = useAppStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = useAppStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = res.data.data;
          const user = useAppStore.getState().user!;
          await useAppStore.getState().setAuth(user, accessToken, newRefresh);
          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        } catch {
          await useAppStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const guestLogin = (name: string, roomNumber: string) =>
  api.post('/auth/guest-login', { name, roomNumber }).then((r) => r.data);

export const staffLogin = (employeeId: string, password: string) =>
  api.post('/auth/staff-login', { employeeId, password }).then((r) => r.data);

// ─── Incidents ────────────────────────────────────────────────────────────────

export const createIncident = (data: {
  type: string;
  location: string;
  floor?: number;
  description?: string;
}) => api.post('/incidents', data).then((r) => r.data);

export const getIncidents = () => api.get('/incidents').then((r) => r.data);

export const getIncident = (id: string) => api.get(`/incidents/${id}`).then((r) => r.data);

export const getGuidance = (id: string) =>
  api.get(`/incidents/${id}/guidance`).then((r) => r.data);

export const updateIncident = (
  id: string,
  data: { status?: string; assignedToId?: string; message?: string }
) => api.patch(`/incidents/${id}`, data).then((r) => r.data);

export const assignResponder = (id: string, staffId?: string) =>
  api.post(`/incidents/${id}/assign`, { staffId }).then((r) => r.data);

export const broadcastAlert = (id: string, message: string) =>
  api.post(`/incidents/${id}/broadcast`, { message }).then((r) => r.data);

export const notifyAuthorities = (id: string) =>
  api.post(`/incidents/${id}/notify-authorities`).then((r) => r.data);

export const getIncidentReport = (id: string) =>
  api.get(`/incidents/${id}/report`).then((r) => r.data);

// ─── Zones ────────────────────────────────────────────────────────────────────

export const getZones = () => api.get('/zones').then((r) => r.data);

export const seedZones = () => api.post('/zones/seed').then((r) => r.data);

export default api;
