'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService } from '@/lib/api-compatibility';
import { PlusIcon, UsersIcon, CalendarIcon, SparklesIcon, FolderIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';

interface Project {
  id: number;
  name: string;
  description: string;
  project_type?: string;
  status?: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: any[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by: any;
  timeline_folder_id?: number;
}

interface TimelineFolder {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  currency: string;
  is_active: boolean;
  item_count?: number;
  completed_count?: number;
  categories?: { id: number; name: string; color: string }[];
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [timelineFolders, setTimelineFolders] = useState<TimelineFolder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'projects' | 'timeline'>('all');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    project_type: 'general',
    color: '#10B981',
  });
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProjects();
    fetchTimelineFolders();
  }, [isAuthenticated, authLoading, router]);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err: any) {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTimelineFolders = async () => {
    if (!user?.id) return;
    try {
      const userId = parseInt(user.id.toString());
      const { data: memberData } = await supabase
        .from('timeline_folder_members')
        .select('folder_id')
        .eq('user_id', userId);
      
      const folderIds = memberData?.map(m => m.folder_id) || [];
      if (folderIds.length === 0) {
        setTimelineFolders([]);
        return;
      }
      
      const { data: folders, error } = await supabase
        .from('timeline_folders')
        .select('*')
        .in('id', folderIds)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      
      const foldersWithCounts = await Promise.all(
        (folders || []).map(async (folder) => {
          const { data: items } = await supabase
            .from('timeline_items')
            .select('id, status')
            .eq('folder_id', folder.id);
          
          const { data: categories } = await supabase
            .from('timeline_categories')
            .select('id, name, color')
            .eq('folder_id', folder.id)
            .eq('is_active', true)
            .is('parent_category_id', null)
            .order('display_order');
          
          return {
            ...folder,
            item_count: items?.length || 0,
            completed_count: items?.filter(i => i.status === 'completed').length || 0,
            categories: categories || []
          };
        })
      );
      
      setTimelineFolders(foldersWithCounts);
    } catch (error) {
      // Error fetching timeline folders
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = parseInt(user?.id?.toString() || '0');
      
      if (newProject.project_type === 'timeline') {
        const { data: folderData, error: folderError } = await supabase
          .from('timeline_folders')
          .insert([{
            name: newProject.name,
            description: newProject.description || `Timeline project: ${newProject.name}`,
            created_by_id: userId,
            is_active: true,
            total_budget: 0,
            currency: 'USD'
          }])
          .select()
          .single();
        
        if (folderError) throw folderError;
        
        await supabase
          .from('timeline_folder_members')
          .insert([{
            folder_id: folderData.id,
            user_id: userId,
            role: 'owner',
            can_edit: true,
            can_delete: true,
            can_manage_members: true,
            can_manage_budget: true
          }]);
        
        fetchTimelineFolders();
      } else {
    try {
      const project = await projectService.createProject(newProject);
      setProjects([project, ...projects]);
        } catch (projectErr) {
          // Projects table not available
        }
      }
      
      setNewProject({ name: '', description: '', project_type: 'general', color: '#10B981' });
      setShowCreateForm(false);
    } catch (err: any) {
      setError('Failed to create project');
    }
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '3rem', height: '3rem', border: '4px solid rgba(16, 185, 129, 0.2)', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
          <p style={{ color: '#71717A', fontSize: '0.875rem' }}>Loading your workspace...</p>
          </div>
        </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      {/* Sidebar */}
        {!isMobile && (
          <Sidebar 
            projects={projects} 
            onCreateProject={() => setShowCreateForm(true)} 
          />
        )}
        
      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : '280px', background: '#0D0D0D' }}>
        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(13, 13, 13, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #2D2D2D' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                  Welcome back, {user?.name || 'User'}
                </h1>
                <p style={{ color: '#71717A', fontSize: '0.875rem' }}>Manage your projects with style and efficiency</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {(projects.length > 0 || timelineFolders.length > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem' }}>
                    <SparklesIcon style={{ width: '16px', height: '16px', color: '#10B981' }} />
                    <span style={{ color: '#A1A1AA', fontSize: '0.875rem', fontWeight: 500 }}>
                      {projects.length + timelineFolders.length} Active Items
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowCreateForm(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 15px 35px rgba(16, 185, 129, 0.35)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.25)'; }}
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
                  Create Project
                </button>
              </div>
            </div>
            
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
              {[
                { id: 'all', label: 'All', icon: SparklesIcon },
                { id: 'projects', label: 'Projects', icon: FolderIcon, count: projects.length },
                { id: 'timeline', label: 'Timeline', icon: ChartBarIcon, count: timelineFolders.length }
              ].map((tab) => {
                const isActive = viewMode === tab.id;
                return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                      padding: '0.625rem 1rem',
                      borderRadius: '0.75rem',
                      border: isActive ? 'none' : '1px solid #2D2D2D',
                      background: isActive ? 'linear-gradient(135deg, #10B981, #059669)' : '#1A1A1A',
                      color: isActive ? '#FFFFFF' : '#A1A1AA',
                    fontWeight: 500,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#242424';
                        e.currentTarget.style.color = '#FFFFFF';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = '#1A1A1A';
                        e.currentTarget.style.color = '#A1A1AA';
                      }
                    }}
                  >
                    <tab.icon style={{ width: '16px', height: '16px' }} />
                  {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      padding: '0.125rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        background: isActive ? 'rgba(255,255,255,0.2)' : '#2D2D2D'
                      }}>
                        {tab.count}
                    </span>
                  )}
                </button>
                );
              })}
            </div>
            </div>
          </header>

        {/* Main Content Area */}
        <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
            {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.75rem', color: '#EF4444', marginBottom: '1.5rem' }}>
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
              </div>
            ) : (projects.length === 0 && timelineFolders.length === 0) ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
              <div style={{ width: '96px', height: '96px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SparklesIcon style={{ width: '48px', height: '48px', color: '#10B981' }} />
                </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>Ready to start something amazing?</h3>
              <p style={{ color: '#71717A', maxWidth: '28rem', margin: '0 auto 2rem', fontSize: '1rem' }}>
                Create your first project and begin organizing your work with our powerful project management tools.
              </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.25)' }}
                  >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                Create Your First Project
                  </button>
              </div>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Projects */}
                {(viewMode === 'all' || viewMode === 'projects') && projects.map((project) => (
                  <div
                    key={`project-${project.id}`}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1F1F1F'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FolderIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                      <span style={{ fontSize: '0.75rem', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Project</span>
                        </div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: project.color || '#10B981' }} />
                  </div>
                  
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    {project.name}
                  </h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(236, 72, 153, 0.2)', color: '#EC4899', fontSize: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}>
                            {project.project_type?.replace('_', ' ') || 'General'}
                          </span>
                    <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', fontSize: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}>
                            {project.status || 'Active'}
                          </span>
                    </div>
                    
                  <p style={{ color: '#71717A', fontSize: '0.875rem', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {project.description || 'No description provided'}
                    </p>
                    
                    {(project.task_count && project.task_count > 0) && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#71717A', marginBottom: '0.5rem' }}>
                          <span>Progress</span>
                        <span>{project.completed_task_count || 0}/{project.task_count}</span>
                        </div>
                      <div style={{ height: '6px', background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div 
                          style={{ height: '100%', background: 'linear-gradient(90deg, #3B82F6, #60A5FA)', borderRadius: '9999px', transition: 'width 0.5s', width: `${((project.completed_task_count || 0) / project.task_count) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #2D2D2D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#71717A', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <UsersIcon style={{ width: '16px', height: '16px' }} />
                        <span>{project.members?.length || 0}</span>
                        </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <CalendarIcon style={{ width: '16px', height: '16px' }} />
                        <span>{project.task_count || 0} tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
              {/* Timeline Folders */}
                {(viewMode === 'all' || viewMode === 'timeline') && timelineFolders.map((folder) => (
                  <div
                    key={`timeline-${folder.id}`}
                  onClick={() => router.push('/timeline')}
                  style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1F1F1F'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ChartBarIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                      <span style={{ fontSize: '0.75rem', color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Timeline</span>
                    </div>
                  </div>
                  
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    {folder.name}
                  </h3>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                          {folder.categories && folder.categories.length > 0 ? (
                      folder.categories.slice(0, 3).map(cat => (
                              <span 
                                key={cat.id} 
                          style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', borderRadius: '0.5rem', fontWeight: 500, backgroundColor: `${cat.color}20`, color: cat.color }}
                              >
                                {cat.name}
                              </span>
                            ))
                          ) : (
                      <span style={{ padding: '0.25rem 0.625rem', background: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', fontSize: '0.75rem', borderRadius: '0.5rem', fontWeight: 500 }}>
                              Project
                            </span>
                          )}
                    </div>
                    
                  <p style={{ color: '#71717A', fontSize: '0.875rem', marginBottom: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {folder.description || 'Project with tasks and timeline'}
                    </p>
                    
                    {(folder.item_count || 0) > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#71717A', marginBottom: '0.5rem' }}>
                          <span>Progress</span>
                        <span>{folder.completed_count || 0}/{folder.item_count || 0}</span>
                        </div>
                      <div style={{ height: '6px', background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div 
                          style={{ height: '100%', background: 'linear-gradient(90deg, #10B981, #34D399)', borderRadius: '9999px', transition: 'width 0.5s', width: `${((folder.completed_count || 0) / (folder.item_count || 1)) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1rem', borderTop: '1px solid #2D2D2D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#71717A', fontSize: '0.875rem' }}>
                          <CalendarIcon style={{ width: '16px', height: '16px' }} />
                      <span>{folder.item_count || 0} tasks</span>
                      </div>
                      {folder.end_date && (
                      <span style={{ fontSize: '0.75rem', color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                          Due {new Date(folder.end_date).toLocaleDateString()}
                      </span>
                      )}
                    </div>
                  </div>
                ))}
                  </div>
                )}
        </main>
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '32rem', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFFFFF' }}>Create New Project</h2>
                    <button
                onClick={() => setShowCreateForm(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: '#2D2D2D', color: '#71717A', border: 'none', cursor: 'pointer', fontSize: '1.5rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#71717A'; }}
              >
                ×
                    </button>
                  </div>
            
            <form onSubmit={handleCreateProject} style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.75rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', transition: 'border 0.2s' }}
                    placeholder="Enter project name..."
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  />
              </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.75rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', resize: 'none', transition: 'border 0.2s' }}
                    rows={3}
                    placeholder="What is this project about?"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  />
      </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Project Type</label>
                  <select
                    value={newProject.project_type}
                    onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.75rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  >
                    <option value="general">General Project</option>
                    <option value="timeline">Timeline Project</option>
                    <option value="team">Team Project</option>
                    <option value="marketing">Marketing</option>
                    <option value="product">Product Development</option>
                    <option value="design">Design</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Color</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'].map((color) => (
                  <button
                        key={color}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, color })}
                    style={{
                      width: '40px',
                      height: '40px',
                          borderRadius: '0.75rem',
                          border: newProject.color === color ? '2px solid #FFFFFF' : 'none',
                          backgroundColor: color,
                      cursor: 'pointer',
                          transform: newProject.color === color ? 'scale(1.1)' : 'scale(1)',
                          transition: 'all 0.2s',
                          boxShadow: newProject.color === color ? `0 0 0 4px ${color}40` : 'none'
                        }}
                        onMouseEnter={(e) => { if (newProject.color !== color) e.currentTarget.style.transform = 'scale(1.05)'; }}
                        onMouseLeave={(e) => { if (newProject.color !== color) e.currentTarget.style.transform = 'scale(1)'; }}
                      />
                  ))}
                </div>
              </div>
            </div>
            
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                  <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  style={{ flex: 1, padding: '0.75rem 1rem', background: '#2D2D2D', color: '#A1A1AA', border: 'none', borderRadius: '0.75rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#3D3D3D'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem 1rem', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFFFFF', border: 'none', borderRadius: '0.75rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
                >
                  Create Project
                  </button>
                </div>
            </form>
                      </div>
                </div>
              )}
            </div>
  );
} 
