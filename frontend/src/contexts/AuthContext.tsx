'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, supabaseAuth } from '@/lib/supabase';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: string;
  position?: string;
  date_joined: string;
  avatar_url?: string;
  location?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  // Registration disabled in internal app
  register: (userData: {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    position?: string;
    password: string;
    password_confirm: string;
  }) => Promise<never>;
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
        // Small delay to ensure localStorage is fully available
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const { user: currentUser, error } = await supabaseAuth.getUser();
        
        if (currentUser && !error) {
          // Fetch full profile from database including avatar_url, location, bio
          try {
            const { data: profileData } = await supabase
              .from('auth_user')
              .select('name, email, phone, role, position, avatar_url, location, bio')
              .eq('id', currentUser.id)
              .single();
            
            const userData: User = {
              id: currentUser.id,
              email: profileData?.email || currentUser.email,
              name: profileData?.name || currentUser.user_metadata?.name || currentUser.email,
              phone: profileData?.phone || currentUser.user_metadata?.phone || '',
              role: profileData?.role || currentUser.user_metadata?.role || 'member',
              position: profileData?.position || currentUser.user_metadata?.position || '',
              avatar_url: profileData?.avatar_url || '',
              location: profileData?.location || '',
              bio: profileData?.bio || '',
              date_joined: new Date().toISOString()
            };
            setUser(userData);
          } catch (profileError) {
            // Fallback to basic user data if profile fetch fails
            const userData: User = {
              id: currentUser.id,
              email: currentUser.email,
              name: currentUser.user_metadata?.name || currentUser.email,
              phone: currentUser.user_metadata?.phone || '',
              role: currentUser.user_metadata?.role || 'member',
              position: currentUser.user_metadata?.position || '',
              avatar_url: '',
              location: '',
              bio: '',
              date_joined: new Date().toISOString()
            };
            setUser(userData);
          }
        }
      } catch (error) {
        // Silent error handling
      } finally {
        setIsLoading(false);
      }
    };

    // Set a maximum timeout for auth initialization
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // Delay initialization slightly to avoid hydration mismatch
    const delayedInit = setTimeout(() => {
      initializeAuth().finally(() => {
        clearTimeout(timeoutId);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(delayedInit);
    };
  }, [isClient]);

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser, error } = await supabaseAuth.signIn(email, password);
      
      if (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }

      if (authUser) {
        // Fetch full profile from database including avatar_url, location, bio
        try {
          const { data: profileData } = await supabase
            .from('auth_user')
            .select('name, email, phone, role, position, avatar_url, location, bio')
            .eq('id', authUser.id)
            .single();
          
          const userData: User = {
            id: authUser.id,
            email: profileData?.email || authUser.email,
            name: profileData?.name || authUser.user_metadata?.name || authUser.email,
            phone: profileData?.phone || authUser.user_metadata?.phone || '',
            role: profileData?.role || authUser.user_metadata?.role || 'member',
            position: profileData?.position || authUser.user_metadata?.position || '',
            avatar_url: profileData?.avatar_url || '',
            location: profileData?.location || '',
            bio: profileData?.bio || '',
            date_joined: new Date().toISOString()
          };
          setUser(userData);
        } catch (profileError) {
          // Fallback to basic user data if profile fetch fails
          const userData: User = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email,
            phone: authUser.user_metadata?.phone || '',
            role: authUser.user_metadata?.role || 'member',
            position: authUser.user_metadata?.position || '',
            avatar_url: '',
            location: '',
            bio: '',
            date_joined: new Date().toISOString()
          };
          setUser(userData);
        }
      }
    } catch (error: any) {
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
    throw new Error('Registration is disabled. Please contact an administrator.');
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