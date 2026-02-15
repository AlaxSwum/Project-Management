'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Project {
  id: number;
  name: string;
  description?: string;
  project_type?: string;
  status?: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: any[];
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: any;
  [key: string]: any;
}

interface ProjectsContextType {
  projects: Project[];
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  removeProject: (id: number) => void;
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const refreshProjects = async () => {
    if (!user?.id) return;
    try {
      const { projectService } = await import('@/lib/api-compatibility');
      const data = await projectService.getProjects();
      if (Array.isArray(data)) {
        setProjects(data); // Keep full project data
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeProject = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // Load projects ONCE on mount when user is available
  useEffect(() => {
    if (user?.id && !hasLoaded) {
      setHasLoaded(true);
      refreshProjects();
    }
  }, [user?.id]);

  return (
    <ProjectsContext.Provider value={{ projects, isLoading, refreshProjects, removeProject }}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
}
