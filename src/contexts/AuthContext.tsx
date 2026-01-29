import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '@/types';
import { mockUsers, mockCredentials } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: 'admin' | 'customer') => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string, role: 'admin' | 'customer'): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check mock credentials
    if (role === 'admin') {
      if (email === mockCredentials.admin.email && password === mockCredentials.admin.password) {
        const adminUser = mockUsers.find(u => u.role === 'admin');
        if (adminUser) {
          setUser(adminUser);
          return true;
        }
      }
    } else {
      // For customer, accept any customer email with the demo password
      const customerUser = mockUsers.find(u => u.email === email && u.role === 'customer');
      if (customerUser && password === mockCredentials.customer.password) {
        setUser(customerUser);
        return true;
      }
    }

    return false;
  };

  const logout = () => {
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
