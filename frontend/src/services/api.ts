import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

// Auto-refresh on 401
api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config) & { _retry?: boolean };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { refreshToken, setTokens, logout } = useAuthStore.getState();
        if (!refreshToken) { logout(); return Promise.reject(error); }
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        useAuthStore.getState().logout();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Typed helpers
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }).then((r) => r.data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  me: () => api.get('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/password', { currentPassword, newPassword }).then((r) => r.data),
};

export const employeeApi = {
  list: () => api.get('/employees').then((r) => r.data),
  get: (id: string) => api.get(`/employees/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/employees', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/employees/${id}`).then((r) => r.data),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/employees/${id}/reset-password`, { newPassword }).then((r) => r.data),
};

export const scheduleApi = {
  getOrCreate: (year: number, month: number) =>
    api.get('/schedule', { params: { year, month } }).then((r) => r.data),
  getMy: (year: number, month: number) =>
    api.get('/schedule/my', { params: { year, month } }).then((r) => r.data),
  upsertEntry: (scheduleId: string, data: unknown) =>
    api.post(`/schedule/${scheduleId}/entries`, data).then((r) => r.data),
  bulkUpsert: (scheduleId: string, entries: unknown[]) =>
    api.post(`/schedule/${scheduleId}/entries/bulk`, { entries }).then((r) => r.data),
  deleteEntry: (entryId: string) => api.delete(`/schedule/entries/${entryId}`).then((r) => r.data),
  publish: (scheduleId: string) => api.post(`/schedule/${scheduleId}/publish`).then((r) => r.data),
  getShifts: () => api.get('/shifts').then((r) => r.data),
  createShift: (data: unknown) => api.post('/shifts', data).then((r) => r.data),
  deleteShift: (id: string) => api.delete(`/shifts/${id}`).then((r) => r.data),
};

export const attendanceApi = {
  clockIn: (latitude: number, longitude: number) =>
    api.post('/attendance/clock-in', { latitude, longitude }).then((r) => r.data),
  clockOut: (latitude: number, longitude: number, notes?: string) =>
    api.post('/attendance/clock-out', { latitude, longitude, notes }).then((r) => r.data),
  today: () => api.get('/attendance/today').then((r) => r.data),
  list: (params: Record<string, string | undefined>) =>
    api.get('/attendance', { params }).then((r) => r.data),
  createManual: (data: unknown) => api.post('/attendance/manual', data).then((r) => r.data),
};

export const holidayApi = {
  list: (year: number) => api.get('/holidays', { params: { year } }).then((r) => r.data),
  refresh: (year: number) => api.post('/holidays/refresh', null, { params: { year } }).then((r) => r.data),
  addCustom: (date: string, name: string) => api.post('/holidays/custom', { date, name }).then((r) => r.data),
  removeCustom: (id: string) => api.delete(`/holidays/custom/${id}`).then((r) => r.data),
};

export const statsApi = {
  store: () => api.get('/stats/store').then((r) => r.data),
  employee: (userId: string, year: number) =>
    api.get(`/stats/employee/${userId}`, { params: { year } }).then((r) => r.data),
};

export const exportApi = {
  excel: (year: number, month: number) =>
    api.get('/export/excel', { params: { year, month }, responseType: 'blob' }).then((r) => r.data),
  pdf: (year: number, month: number) =>
    api.get('/export/pdf', { params: { year, month }, responseType: 'blob' }).then((r) => r.data),
};

export const storeApi = {
  current: () => api.get('/stores/current').then((r) => r.data),
  list: () => api.get('/stores').then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/stores/${id}`, data).then((r) => r.data),
  createInvite: (role: string) => api.post('/stores/invite', { role }).then((r) => r.data),
};
