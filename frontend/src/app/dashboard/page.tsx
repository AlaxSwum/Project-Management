'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PlusIcon, CheckCircleIcon, ClockIcon, FolderIcon } from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, inProgress: 0, completed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  const fetchData = async () => {
    if (!user?.id) return;

    try {
      // Get all projects where user is a member
      const { data: allProjects } = await supabase.from('projects_project').select('*');
      const myProjects = (allProjects || []).filter((p: any) => 
        p.members && p.members.some((m: any) => m.id === user.id)
      );
      setProjects(myProjects);

      // Get all tasks from user's projects
      const projectIds = myProjects.map(p => p.id);
      if (projectIds.length > 0) {
        const { data: allTasks } = await supabase
          .from('projects_task')
          .select('*')
          .in('project_id', projectIds);
        
        setTasks(allTasks || []);
        
        // Calculate stats
        const total = allTasks?.length || 0;
        const inProgress = allTasks?.filter(t => t.status === 'in_progress').length || 0;
        const completed = allTasks?.filter(t => t.status === 'done').length || 0;
        setStats({ total, inProgress, completed });
      }
    } catch (error) {
      // Error
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const completionPercentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      
      <div style={{ flex: 1, marginLeft: '280px', background: '#0D0D0D', padding: '2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Project Dashboard</h1>
          <p style={{ color: '#71717A', fontSize: '0.9375rem' }}>Overview of your projects and tasks</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Total Tasks */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>{stats.total}</div>
            <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 500 }}>Tasks</div>
          </div>

          {/* In Progress */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem', borderLeft: '3px solid #F59E0B' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.5rem' }}>{stats.inProgress}</div>
            <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 500 }}>In Progress</div>
          </div>

          {/* Completed */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem', borderLeft: '3px solid #10B981' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem' }}>{stats.completed}</div>
            <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 500 }}>Completed</div>
          </div>

          {/* Completion Rate */}
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3B82F6', marginBottom: '0.5rem' }}>{completionPercentage}%</div>
            <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 500 }}>Completion</div>
          </div>
        </div>

        {/* Projects Grid */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1rem' }}>Your Projects</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1F1F1F'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '0.25rem', backgroundColor: project.color || '#71717A' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>{project.name}</h3>
                </div>
                <p style={{ color: '#71717A', fontSize: '0.875rem', marginBottom: '1rem', lineHeight: 1.5 }}>{project.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #2D2D2D' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#71717A' }}>{project.task_count || 0} tasks</span>
                  <span style={{ fontSize: '0.8125rem', color: '#10B981' }}>{project.completed_task_count || 0} done</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
