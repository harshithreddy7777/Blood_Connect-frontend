import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

/**
 * Validates whether a JWT token string has expired based on its claims.
 * Decodes the base64url payload and compares 'exp' with Date.now().
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState('');

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bloodconnect_token');
    localStorage.removeItem('bloodconnect_user');
  }, []);

  // Session restoration from localStorage with expiration verification
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('bloodconnect_token');
      const storedUser = localStorage.getItem('bloodconnect_user');

      if (storedToken && storedUser) {
        if (isTokenExpired(storedToken)) {
          logout();
          setSessionMessage('Your previous session has expired. Please sign in again.');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (e) {
      console.error('Failed to restore cached authentication session:', e);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  // Listen for global 401 unauthorized events dispatched by Axios interceptor
  useEffect(() => {
    const handleUnauthorized = (event) => {
      logout();
      setSessionMessage(event.detail?.message || 'Your session has expired. Please sign in again.');
    };

    window.addEventListener('bloodconnect:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('bloodconnect:unauthorized', handleUnauthorized);
  }, [logout]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setSessionMessage('');
    localStorage.setItem('bloodconnect_token', authToken);
    localStorage.setItem('bloodconnect_user', JSON.stringify(userData));
  };

  const isAuthenticated = !!token && !isTokenExpired(token);
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        isAdmin,
        sessionMessage,
        setSessionMessage,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
