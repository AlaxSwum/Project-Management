'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseAuth } from '@/lib/supabase';

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
  const [isClient, setIsClient] = useState(false);

  // Handle SSR
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) {
      return;
    }

    const initializeAuth = async () => {
      try {
        console.log('Starting auth initialization...');
        
        const { user: currentUser, error } = await supabaseAuth.getUser();
        
        console.log('Auth result:', { currentUser, error });
        
        if (currentUser && !error) {
          const userData: User = {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.email,
            phone: currentUser.user_metadata?.phone || '',
            role: currentUser.user_metadata?.role || 'member',
            position: currentUser.user_metadata?.position || '',
            date_joined: new Date().toISOString()
          };
          setUser(userData);
          console.log('User set:', userData);
        } else {
          console.log('No user found or error occurred');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    // Set a maximum timeout for auth initialization
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timeout, proceeding without auth');
      setIsLoading(false);
    }, 2000);

    initializeAuth().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isClient]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const { user: authUser, error } = await supabaseAuth.signIn(email, password);
      
      if (error) {
        console.error('Login error:', error);
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }

      if (authUser) {
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'member',
          position: authUser.user_metadata?.position || '',
          date_joined: new Date().toISOString()
        };
        setUser(userData);
        console.log('Login successful:', userData);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.message || 'Login failed');
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
      if (userData.password !== userData.password_confirm) {
        throw new Error("Passwords don't match");
      }

      const { user: authUser, error } = await supabaseAuth.signUp(userData);
      
      if (error) {
        throw new Error(error instanceof Error ? error.message : 'Registration failed');
      }

      if (authUser) {
        const newUser: User = {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email,
          phone: authUser.user_metadata?.phone || '',
          role: authUser.user_metadata?.role || 'member',
          position: authUser.user_metadata?.position || '',
          date_joined: new Date().toISOString()
        };
        setUser(newUser);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await supabaseAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
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