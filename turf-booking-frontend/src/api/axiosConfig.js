import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 90000, // 90 seconds to survive Render cold starts
});

// Retry failed requests once (handles cold-start timeouts)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config._retry && (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error'))) {
      config._retry = true;
      return api(config);
    }
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
