import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { loginApi, logoutApi, setTokens, clearTokens, getAccessToken } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'customer') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storeUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    return { ...u, createdAt: new Date(u.createdAt) };
  } catch {
    return null;
  }
}

function clearUser() {
  localStorage.removeItem('user');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restore session on mount
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      const stored = loadUser();
      if (stored) {
        setUser(stored);
      } else {
        clearTokens();
        clearUser();
      }
    }
  }, []);

  const login = async (email: string, password: string, _role: 'admin' | 'customer'): Promise<boolean> => {
    try {
      const data = await loginApi(email, password);
      setTokens(data.accessToken, data.refreshToken);
      const loggedInUser: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        company: data.user.company || undefined,
        role: data.user.role as 'admin' | 'customer',
        createdAt: new Date(),
      };
      storeUser(loggedInUser);
      setUser(loggedInUser);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    logoutApi();
    clearTokens();
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
