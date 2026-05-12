import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const api = axios.create({
  baseURL: 'http://localhost:5107/api/tenant',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ ATTACH TOKEN TO EVERY REQUEST
api.interceptors.request.use(
  (config) => {
    // Get token directly from the store state to avoid desync
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`[API] 🔑 Token attached to ${config.url}`);
    } else {
      console.warn(`[API] ⚠️ No token found for ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ HANDLE 401 UNAUTHORIZED (EXPIRED TOKENS)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry if we're already on the login page
      if (window.location.pathname === '/login') {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      console.log('[API] 🔄 Token expired. Attempting refresh...');

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post('http://localhost:5107/api/tenant/auth/refresh', {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
        
        // Update store with new tokens
        useAuthStore.getState().setTokens(accessToken, newRefreshToken);
        
        console.log('[API] ✅ Token refreshed successfully');

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] ❌ Refresh failed. Logging out...', refreshError);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;