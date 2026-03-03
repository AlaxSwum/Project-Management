'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, supabaseAuth, supabaseDb } from '@/lib/supabase';
import { appCache } from '@/lib/appCache';

// In-flight promise dedup — prevents SidebarContext from re-fetching what login already started
const _inflight = new Map<string, Promise<any>>();
export function getInflightFetch(key: string) { return _inflight.get(key); }

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

  useEffect(() => {
    // Read localStorage synchronously — no network, instant
    let basicUser: User | null = null;
    try {
      const stored = localStorage.getItem('supabase_user');
      const token = localStorage.getItem('supabase_token');
      if (stored && token) {
        const parsed = JSON.parse(stored);
        if (parsed?.id) {
          basicUser = {
            id: parsed.id,
            email: parsed.email,
            name: parsed.user_metadata?.name || parsed.email,
            phone: parsed.user_metadata?.phone || '',
            role: parsed.user_metadata?.role || 'member',
            position: parsed.user_metadata?.position || '',
            avatar_url: '',
            location: '',
            bio: '',
            date_joined: new Date().toISOString(),
          };
          // Use richer cached profile if available
          const cached = appCache.get<User>(`user_profile_${parsed.id}`);
          setUser(cached || basicUser);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }

    // Background: fetch fresh full profile from DB (doesn't block sidebar)
    const refreshProfile = async () => {
      if (!basicUser) return;
      try {
        const { data: profileData } = await supabase
          .from('auth_user')
          .select('name, email, phone, role, position, avatar_url, location, bio')
          .eq('id', basicUser!.id)
          .single();

        if (profileData) {
          const userData: User = {
            id: basicUser!.id,
            email: profileData.email || basicUser!.email,
            name: profileData.name || basicUser!.name,
            phone: profileData.phone || '',
            role: profileData.role || basicUser!.role,
            position: profileData.position || '',
            avatar_url: profileData.avatar_url || '',
            location: profileData.location || '',
            bio: profileData.bio || '',
            date_joined: new Date().toISOString(),
          };
          appCache.set(`user_profile_${basicUser!.id}`, userData);
          setUser(userData);
        }
      } catch {
        // Silent — basicUser already set above
      }
    };
    refreshProfile();
  }, []); // runs once on mount, client-side only

  const login = async (email: string, password: string) => {
    try {
      const { user: authUser, full_profile, projectsPromise, error } = await supabaseAuth.signIn(email, password) as {
        user: { id: number; email: string; user_metadata: Record<string, string> } | null;
        full_profile?: User;
        projectsPromise?: Promise<{ data: any; error: any }>;
        error: Error | null;
      };

      if (error) {
        throw new Error(error instanceof Error ? error.message : 'Login failed');
      }

      if (authUser) {
        // Use full_profile from signIn — no second RTT needed
        const userData: User = full_profile ?? {
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
        appCache.set(`user_profile_${authUser.id}`, userData);
        setUser(userData);

        // Projects fetch was started inside signIn — it's already in-flight
        // Wire it into the inflight map so SidebarContext awaits the same promise
        const cacheKey = `sidebar_projects_${authUser.id}`;
        const fetchPromise = (projectsPromise || supabaseDb.getProjectsLean(authUser.id)).then(({ data }: any) => {
          if (data) appCache.set(cacheKey, data);
          _inflight.delete(cacheKey);
          return data;
        }).catch(() => { _inflight.delete(cacheKey); });
        _inflight.set(cacheKey, fetchPromise);
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
      // Clear all caches
      if (user?.id) {
        appCache.delete(`user_profile_${user.id}`);
        appCache.delete(`sidebar_projects_${user.id}`);
      }
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
