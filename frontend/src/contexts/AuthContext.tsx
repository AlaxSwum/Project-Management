'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  position?: string;
  date_joined: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    position?: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // First, restore the user from localStorage to appear logged in
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Then try to verify token in the background
          // Only log out if the token is definitively invalid (401)
          try {
            const profile = await authService.getProfile();
            // Update with fresh profile data if successful
            setUser(profile);
          } catch (verificationError: any) {
            // Only log out for authentication errors, not network errors
            if (verificationError.response?.status === 401) {
              console.log('Token expired or invalid, logging out');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              setUser(null);
            } else {
              // For network errors or server issues, keep user logged in
              console.warn('Token verification failed due to network/server issue, keeping user logged in:', verificationError.message);
            }
          }
        } catch (parseError) {
          // If we can't parse saved user data, clear everything
          console.error('Failed to parse saved user data:', parseError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      const { user: userData, access, refresh } = response;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    position?: string;
    password: string;
    password_confirm: string;
  }) => {
    try {
      const response = await authService.register(userData);
      const { user: newUser, access, refresh } = response;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    } catch (error: any) {
      // Extract detailed error messages from backend
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          // Convert validation errors to readable messages
          const errorMessages = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            } else {
              errorMessages.push(`${field}: ${messages}`);
            }
          }
          const detailedError = new Error(errorMessages.join('\n'));
          (detailedError as any).response = error.response;
          throw detailedError;
        }
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 