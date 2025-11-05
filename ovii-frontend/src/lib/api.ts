import axios from 'axios';
import { useUserStore } from './store/useUserStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.ovii.it.com',
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

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // If the error status is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark the request as retried
      const { refreshToken, logout, tokenRefresh } = useUserStore.getState();

      if (refreshToken) {
        try {
          // Attempt to refresh the token
          await tokenRefresh();
          // Retry the original request with the new access token
          const newAccessToken = useUserStore.getState().accessToken;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, log out the user
          console.error('Token refresh failed:', refreshError);
          logout();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, log out
        logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;