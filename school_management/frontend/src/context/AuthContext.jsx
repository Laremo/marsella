import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api, { setSessionExpiredHandler } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const pendingRequestsRef = useRef([]);

  useEffect(() => {
    setSessionExpiredHandler((callbacks) => {
      pendingRequestsRef.current.push(callbacks);
      setSessionExpired(true);
    });
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: jwtToken, ...userData } = res.data;
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const resolveSessionExpired = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: jwtToken, ...userData } = res.data;
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    setSessionExpired(false);

    // Replay pending failed requests with new token
    const pending = [...pendingRequestsRef.current];
    pendingRequestsRef.current = [];
    pending.forEach(({ resolve }) => {
      try {
        resolve(jwtToken);
      } catch (e) {
        console.error('Error re-executing failed request after re-login', e);
      }
    });

    return userData;
  };

  const cancelSessionExpired = () => {
    const pending = [...pendingRequestsRef.current];
    pendingRequestsRef.current = [];
    pending.forEach(({ reject }) => reject());
    logout();
    setSessionExpired(false);
    window.location.href = '/teacher/login';
  };

  const register = async (username, password, fullName, email, role = 'ROLE_TEACHER') => {
    const res = await api.post('/auth/register', { username, password, fullName, email, role });
    const { token: jwtToken, ...userData } = res.data;
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        resolveSessionExpired,
        cancelSessionExpired,
        sessionExpired,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
