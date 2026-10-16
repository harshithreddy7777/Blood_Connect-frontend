import axios from 'axios';

/**
 * BloodConnect Axios Configuration
 * - Base URL configured to Spring Boot backend API.
 * - Request interceptor automatically attaches Authorization: Bearer <token>.
 * - Response interceptor detects HTTP 401 (expired/revoked tokens), clears localStorage,
 *   and dispatches a custom event to update in-memory AuthContext synchronously.
 * - SECURITY: Tokens and credentials are never logged to console or remote monitoring.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bloodconnect_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified unauthorized, timeout, and offline handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear persistent state on expired or invalid token
      localStorage.removeItem('bloodconnect_token');
      localStorage.removeItem('bloodconnect_user');

      // Dispatch global unauthorized event for React state eviction
      const msg = error.response.data?.message || 'Your session has expired. Please sign in again.';
      window.dispatchEvent(
        new CustomEvent('bloodconnect:unauthorized', {
          detail: { message: msg },
        })
      );
    } else if (!error.response) {
      // Offline or network timeout handling
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        error.userMessage = 'The request timed out. Please check your connection and retry.';
      } else {
        error.userMessage = 'Unable to reach the BloodConnect server. Please check your network or try again later.';
      }
    } else if (error.response.status >= 500) {
      error.userMessage = error.response.data?.message || 'A server error occurred. Please try again later.';
    }
    return Promise.reject(error);
  }
);

export default api;
