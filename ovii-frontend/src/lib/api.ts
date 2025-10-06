import axios from 'axios';
import { useUserStore } from './store/useUserStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.ovii.it.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This allows Axios to send cookies
  xsrfCookieName: 'csrftoken', // The name of the cookie Django sets
  xsrfHeaderName: 'X-CSRFToken', // The name of the header Django expects
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