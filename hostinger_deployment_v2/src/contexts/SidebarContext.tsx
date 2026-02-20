'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { supabase } from '@/lib/supabase';

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

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
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

  // Fetch projects ONCE when user logs in
  const refreshProjects = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingProjects(true);
    try {
      const fetchedProjects = await projectService.getProjects();
      setProjects(fetchedProjects || []);
      
      // Extract team members from projects
      const allMembersMap = new Map<number, TeamMember>();
      (fetchedProjects || []).forEach((project: Project) => {
        if (project.members && Array.isArray(project.members)) {
          project.members.forEach((member) => {
            if (member.id !== user.id && !allMembersMap.has(member.id)) {
              allMembersMap.set(member.id, member);
            }
          });
        }
      });
      setTeamMembers(Array.from(allMembersMap.values()).slice(0, 15));
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.id]);

  // Only fetch once on mount
  useEffect(() => {
    if (!user?.id || hasFetched) return;
    setHasFetched(true);
    refreshProjects();
  }, [user?.id, hasFetched, refreshProjects]);

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
