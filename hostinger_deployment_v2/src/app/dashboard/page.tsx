'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { ChartBarIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
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
      // Step 1: Get only user's project IDs via membership table (server-side filter)
      const { data: membershipData } = await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', user.id);

      const projectIds = (membershipData || []).map((m: any) => m.project_id);

      if (projectIds.length === 0) {
        setProjects([]);
        setTasks([]);
        return;
      }

      // Step 2: Fetch projects and recent tasks in parallel, select only needed fields
      const [{ data: myProjects }, { data: recentTasks }] = await Promise.all([
        supabase
          .from('projects_project')
          .select('id, name, color, task_count, completed_task_count')
          .in('id', projectIds),
        supabase
          .from('projects_task')
          .select('id, name, status, due_date, project_id')
          .in('project_id', projectIds)
          .order('due_date', { ascending: true })
          .limit(20),
      ]);

      setProjects(myProjects || []);
      setTasks(recentTasks || []);
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

  const totalTasks = tasks.length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      <Sidebar projects={projects} onCreateProject={() => {}} />
      
      <div className="page-main" style={{ flex: 1, marginLeft: '280px', background: '#0D0D0D' }}>
        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: '1px solid #1F1F1F' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'Mabry Pro, sans-serif' }}>
            Project Dashboard
          </h1>
          <p style={{ color: '#71717A', fontSize: '0.9375rem', fontFamily: 'Mabry Pro, sans-serif' }}>Overview of your projects and tasks</p>
        </div>

        <div style={{ padding: '2rem' }}>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.75rem 1.5rem' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'Mabry Pro, sans-serif' }}>{totalTasks}</div>
              <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 600, fontFamily: 'Mabry Pro, sans-serif' }}>Tasks</div>
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.75rem 1.5rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 700, color: '#F59E0B', marginBottom: '0.5rem', fontFamily: 'Mabry Pro, sans-serif' }}>{inProgressTasks}</div>
              <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 600, fontFamily: 'Mabry Pro, sans-serif' }}>In Progress</div>
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.75rem 1.5rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '2.75rem', fontWeight: 700, color: '#10B981', marginBottom: '0.5rem', fontFamily: 'Mabry Pro, sans-serif' }}>{completedTasks}</div>
              <div style={{ fontSize: '0.875rem', color: '#71717A', fontWeight: 600, fontFamily: 'Mabry Pro, sans-serif' }}>Completed</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
            {/* Left Column - Tasks */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '1.25rem', fontFamily: 'Mabry Pro, sans-serif' }}>Tasks</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => router.push(`/projects/${task.project_id}`)}
                    style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '1.125rem 1.25rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '1rem' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#242424'; e.currentTarget.style.borderColor = '#3D3D3D'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.borderColor = '#2D2D2D'; }}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#71717A', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.25rem', fontFamily: 'Mabry Pro, sans-serif' }}>{task.name}</div>
                      <div style={{ fontSize: '0.8125rem', color: '#71717A', fontFamily: 'Mabry Pro, sans-serif' }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </div>
                    </div>
                    <div style={{ padding: '0.375rem 0.875rem', background: task.status === 'done' ? 'rgba(16, 185, 129, 0.2)' : task.status === 'in_progress' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(113, 113, 122, 0.2)', color: task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#F59E0B' : '#71717A', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Mabry Pro, sans-serif', textTransform: 'capitalize' }}>
                      {task.status.replace('_', ' ')}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem' }}>
                    <p style={{ color: '#71717A', fontSize: '0.9375rem', fontFamily: 'Mabry Pro, sans-serif' }}>No tasks yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Goals */}
            <div>
              <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0, fontFamily: 'Mabry Pro, sans-serif' }}>Goals</h3>
                  <button style={{ width: '20px', height: '20px', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}>
                    <XMarkIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem', fontFamily: 'Mabry Pro, sans-serif' }}>Website Launch</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div style={{ flex: 1, height: '8px', background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: '60%', height: '100%', background: '#10B981', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 600, fontFamily: 'Mabry Pro, sans-serif' }}>60%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#71717A', fontFamily: 'Mabry Pro, sans-serif' }}>60% complete</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircleIcon style={{ width: '16px', height: '16px', color: '#10B981' }} />
                    <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontFamily: 'Mabry Pro, sans-serif' }}>Complete Design Phase</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #2D2D2D', borderRadius: '0.25rem' }} />
                    <span style={{ fontSize: '0.875rem', color: '#71717A', fontFamily: 'Mabry Pro, sans-serif' }}>Finish Testing</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #2D2D2D', borderRadius: '0.25rem' }} />
                    <span style={{ fontSize: '0.875rem', color: '#71717A', fontFamily: 'Mabry Pro, sans-serif' }}>Prepare Launch Plan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
