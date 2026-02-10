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
  refreshProjects: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType>({
  projects: [],
  teamMembers: [],
  loadingProjects: true,
  unreadNotifications: 0,
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
  const [hasFetched, setHasFetched] = useState(false);

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

  // Fetch unread notification count - poll every 30s
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
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <SidebarContext.Provider value={{ projects, teamMembers, loadingProjects, unreadNotifications, refreshProjects }}>
      {children}
    </SidebarContext.Provider>
  );
}
