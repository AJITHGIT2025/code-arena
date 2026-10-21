import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, academicYear: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('codearena_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('codearena_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('codearena_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('codearena_user', JSON.stringify(res.data.user));
        } catch (err) {
          localStorage.removeItem('codearena_token');
          localStorage.removeItem('codearena_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('codearena_token', newToken);
      localStorage.setItem('codearena_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Login failed. Please check your credentials.',
      };
    }
  };

  const register = async (name: string, email: string, password: string, academicYear: string) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, academicYear });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('codearena_token', newToken);
      localStorage.setItem('codearena_user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.error || 'Registration failed.',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('codearena_token');
    localStorage.removeItem('codearena_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      localStorage.setItem('codearena_user', JSON.stringify(res.data.user));
    } catch (err) {
      // ignore
    }
  };

  const isAuthenticated = Boolean(user && token);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isAdmin,
        loading,
        login,
        register,
        logout,
        refreshUser,
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
