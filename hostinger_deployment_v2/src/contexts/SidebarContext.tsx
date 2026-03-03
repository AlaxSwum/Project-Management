'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth, getInflightFetch } from '@/contexts/AuthContext';
import { supabase, supabaseDb } from '@/lib/supabase';
import { appCache } from '@/lib/appCache';

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: Array<{
    id: number;
    name: string;
    email: string;
    role?: string;
    avatar_url?: string;
  }>;
}

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

interface SidebarContextType {
  projects: Project[];
  teamMembers: TeamMember[];
  loadingProjects: boolean;
  unreadNotifications: number;
  unreadMessages: Record<number, number>; // userId -> unread count
  totalUnreadMessages: number;
  clearUnreadForUser: (userId: number) => void;
  refreshProjects: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
  projects: [],
  teamMembers: [],
  loadingProjects: true,
  unreadNotifications: 0,
  unreadMessages: {},
  totalUnreadMessages: 0,
  clearUnreadForUser: () => {},
  refreshProjects: async () => {},
});

export function useSidebarData() {
  return useContext(SidebarContext);
}

// 30-minute TTL for sidebar cache — background refresh keeps it fresh
const SIDEBAR_TTL = 30 * 60 * 1000;

// Synchronously hydrate from sessionStorage before first render
function getInitialSidebarData(): { projects: Project[]; uid: number | null } {
  if (typeof window === 'undefined') return { projects: [], uid: null };
  try {
    const stored = localStorage.getItem('supabase_user');
    const token = localStorage.getItem('supabase_token');
    if (stored && token) {
      const uid = JSON.parse(stored)?.id;
      if (uid) {
        const cached = appCache.get<Project[]>(`sidebar_projects_${uid}`, SIDEBAR_TTL);
        if (cached) return { projects: cached, uid };
      }
    }
  } catch { /* ignore */ }
  return { projects: [], uid: null };
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const initial = getInitialSidebarData();
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  // Extract team members from cached projects synchronously
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    if (!initial.projects.length || !initial.uid) return [];
    const map = new Map<number, TeamMember>();
    initial.projects.forEach(p => {
      (p.members || []).forEach(m => {
        if (m.id !== initial.uid && !map.has(m.id)) map.set(m.id, m);
      });
    });
    return Array.from(map.values()).slice(0, 15);
  });
  const [loadingProjects, setLoadingProjects] = useState(initial.projects.length === 0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState<Record<number, number>>({});
  const [hasFetched, setHasFetched] = useState(false);

  const totalUnreadMessages = Object.values(unreadMessages).reduce((sum, n) => sum + n, 0);

  // Clear unread for a specific user when opening their chat
  const clearUnreadForUser = useCallback((userId: number) => {
    setUnreadMessages(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const applyProjects = useCallback((fetchedProjects: Project[], currentUserId: number) => {
    setProjects(fetchedProjects);
    const allMembersMap = new Map<number, TeamMember>();
    fetchedProjects.forEach((project: Project) => {
      if (project.members && Array.isArray(project.members)) {
        project.members.forEach((member) => {
          if (!allMembersMap.has(member.id)) {
            allMembersMap.set(member.id, member);
          }
        });
      }
    });

    // Cache all known users globally — getProjectWithTasks uses this to skip user RTT
    const usersObj: Record<number, TeamMember> = {};
    allMembersMap.forEach((m, id) => { usersObj[id] = m; });
    appCache.set('global_users', usersObj);

    // Exclude current user from sidebar team list
    allMembersMap.delete(currentUserId);
    setTeamMembers(Array.from(allMembersMap.values()).slice(0, 15));
  }, []);

  // Fetch projects — show cache instantly, then refresh in background
  const refreshProjects = useCallback(async () => {
    // Use AuthContext user ID, or fall back to stored ID for parallel startup
    let uid = user?.id;
    if (!uid) {
      try {
        const stored = localStorage.getItem('supabase_user');
        const token = localStorage.getItem('supabase_token');
        if (stored && token) uid = JSON.parse(stored)?.id ?? undefined;
      } catch {}
    }
    if (!uid) return;

    const cacheKey = `sidebar_projects_${uid}`;

    // Load cache immediately (instant render)
    const cached = appCache.get<Project[]>(cacheKey, SIDEBAR_TTL);
    if (cached) {
      applyProjects(cached, uid);
      setLoadingProjects(false);
    }

    // If cache is fresh (< 60s old), skip network fetch entirely
    const freshEntry = appCache.get<Project[]>(cacheKey, 60_000);
    if (freshEntry) return;

    // If login already started a fetch, await that instead of starting a new one
    const inflight = getInflightFetch(cacheKey);
    if (inflight) {
      try {
        const data = await inflight;
        if (data) {
          applyProjects(data as Project[], uid);
          setLoadingProjects(false);
        }
        return;
      } catch { /* fall through to fresh fetch */ }
    }

    // Fetch fresh data in background (1 RTT)
    try {
      const { data, error } = await supabaseDb.getProjectsLean(uid);
      const fetchedProjects = (data || []) as unknown as Project[];
      if (error) console.error('Error fetching projects:', error);
      appCache.set(cacheKey, fetchedProjects);
      applyProjects(fetchedProjects, uid);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.id, applyProjects]);

  // Fetch on mount using stored user ID — no waiting for AuthContext
  useEffect(() => {
    if (hasFetched) return;
    // Read user ID from localStorage directly (same data AuthContext uses)
    let storedId: number | null = null;
    try {
      const stored = localStorage.getItem('supabase_user');
      const token = localStorage.getItem('supabase_token');
      if (stored && token) storedId = JSON.parse(stored)?.id ?? null;
    } catch {}
    const uid = user?.id ?? storedId;
    if (!uid) return;
    setHasFetched(true);
    refreshProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // re-check if auth user changes (login/logout)

  // Fetch unread notification count - initial fetch + real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const fetchCount = async () => {
      try {
        const { count } = await supabase
          .from('task_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('is_read', false);
        setUnreadNotifications(count || 0);
      } catch (error) {
        // Silent fail
      }
    };

    fetchCount();

    // Real-time subscription instead of polling every 30s
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          if (!(payload.new as any).is_read) {
            setUnreadNotifications((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'task_notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch on update (e.g. mark-as-read)
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Real-time message listener - get notified when ANY new message arrives
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          const msg = payload.new as any;
          // Only count messages from others, not our own
          if (msg.sender_id && msg.sender_id !== user.id) {
            setUnreadMessages(prev => ({
              ...prev,
              [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <SidebarContext.Provider value={{ 
      projects, teamMembers, loadingProjects, unreadNotifications,
      unreadMessages, totalUnreadMessages, clearUnreadForUser,
      refreshProjects 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}
