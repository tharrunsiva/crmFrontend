import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto Login Session Verification
  const verifySession = useCallback(async (savedToken) => {
    try {
      const { data } = await api.get('/auth/me');
      if (data.success) {
        setUser(data.data);
        setToken(savedToken);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session validation error:', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      verifySession(savedToken);
    } else {
      setLoading(false);
    }
  }, [verifySession]);

  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      if (data.success) {
        const userData = data.data;
        setUser(userData);
        setToken(userData.token);
        
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed due to networking issues',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Network logout failed, clearing client state anyway.');
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', userData);
      if (data.success && data.data && data.data.token) {
        const loggedUser = data.data;
        setUser(loggedUser.user);
        setToken(loggedUser.token);
        
        localStorage.setItem('token', loggedUser.token);
        localStorage.setItem('user', JSON.stringify(loggedUser.user));
        return { success: true, message: data.message };
      }
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Forgot password request failed',
      };
    }
  };

  const resetPassword = async (email, otpCode, newPassword) => {
    try {
      const { data } = await api.post('/auth/reset-password', { email, otpCode, newPassword });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Reset password action failed',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
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
