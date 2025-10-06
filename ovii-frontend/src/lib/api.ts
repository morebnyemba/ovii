import axios from 'axios';
import { useUserStore } from './store/useUserStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://api.ovii.it.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token to every request
api.interceptors.request.use(
  (config) => {
    // Get the token directly from the Zustand store
    const { accessToken } = useUserStore.getState();
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;