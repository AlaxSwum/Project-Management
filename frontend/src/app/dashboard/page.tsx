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
      console.log('Projects table not available');
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
      console.error('Error fetching timeline folders:', error);
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
          console.log('Projects table not available, skipping');
        }
      }
      
      setNewProject({ name: '', description: '', project_type: 'general', color: '#10B981' });
      setShowCreateForm(false);
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-[#71717A] text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">
      {/* Sidebar */}
      {!isMobile && (
        <Sidebar 
          projects={projects} 
          onCreateProject={() => setShowCreateForm(true)} 
        />
      )}
      
      {/* Main Content */}
      <div className={`flex-1 ${isMobile ? 'ml-0' : 'ml-[280px]'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#2D2D2D]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back, {user?.name || 'User'}
                </h1>
                <p className="text-[#71717A]">Manage your projects with style and efficiency</p>
              </div>
              <div className="flex items-center gap-4">
                {(projects.length > 0 || timelineFolders.length > 0) && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl">
                    <SparklesIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-[#A1A1AA] text-sm font-medium">
                      {projects.length + timelineFolders.length} Active Items
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create Project
                </button>
              </div>
            </div>
            
            {/* View Mode Tabs */}
            <div className="flex gap-2 mt-6">
              {[
                { id: 'all', label: 'All', icon: SparklesIcon },
                { id: 'projects', label: 'Projects', icon: FolderIcon, count: projects.length },
                { id: 'timeline', label: 'Timeline', icon: ChartBarIcon, count: timelineFolders.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    viewMode === tab.id 
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25' 
                      : 'bg-[#1A1A1A] text-[#A1A1AA] hover:bg-[#242424] hover:text-white border border-[#2D2D2D]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs ${
                      viewMode === tab.id ? 'bg-white/20' : 'bg-[#2D2D2D]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (projects.length === 0 && timelineFolders.length === 0) ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to start something amazing?</h3>
              <p className="text-[#71717A] max-w-md mx-auto mb-8">
                Create your first project and begin organizing your work with our powerful project management tools.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Projects */}
              {(viewMode === 'all' || viewMode === 'projects') && projects.map((project) => (
                <div
                  key={`project-${project.id}`}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="group bg-[#1A1A1A] hover:bg-[#1F1F1F] border border-[#2D2D2D] hover:border-[#3D3D3D] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="w-4 h-4 text-[#71717A]" />
                      <span className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Project</span>
                    </div>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#10B981' }} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-pink-500/20 text-pink-400 text-xs rounded-lg font-medium">
                      {project.project_type?.replace('_', ' ') || 'General'}
                    </span>
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg font-medium">
                      {project.status || 'Active'}
                    </span>
                  </div>
                  
                  <p className="text-[#71717A] text-sm mb-4 line-clamp-2">
                    {project.description || 'No description provided'}
                  </p>
                  
                  {(project.task_count && project.task_count > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#71717A] mb-2">
                        <span>Progress</span>
                        <span>{project.completed_task_count || 0}/{project.task_count}</span>
                      </div>
                      <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${((project.completed_task_count || 0) / project.task_count) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]">
                    <div className="flex items-center gap-4 text-[#71717A] text-sm">
                      <div className="flex items-center gap-1.5">
                        <UsersIcon className="w-4 h-4" />
                        <span>{project.members?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4" />
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
                  className="group bg-[#1A1A1A] hover:bg-[#1F1F1F] border border-[#2D2D2D] hover:border-[#3D3D3D] rounded-2xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="w-4 h-4 text-[#71717A]" />
                      <span className="text-xs text-[#71717A] uppercase tracking-wider font-medium">Timeline</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {folder.name}
                  </h3>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {folder.categories && folder.categories.length > 0 ? (
                      folder.categories.slice(0, 3).map(cat => (
                        <span 
                          key={cat.id}
                          className="px-2.5 py-1 text-xs rounded-lg font-medium"
                          style={{ 
                            backgroundColor: `${cat.color}20`, 
                            color: cat.color 
                          }}
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-lg font-medium">
                        Project
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[#71717A] text-sm mb-4 line-clamp-2">
                    {folder.description || 'Project with tasks and timeline'}
                  </p>
                  
                  {(folder.item_count || 0) > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#71717A] mb-2">
                        <span>Progress</span>
                        <span>{folder.completed_count || 0}/{folder.item_count || 0}</span>
                      </div>
                      <div className="h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${((folder.completed_count || 0) / (folder.item_count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-[#2D2D2D]">
                    <div className="flex items-center gap-1.5 text-[#71717A] text-sm">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{folder.item_count || 0} tasks</span>
                    </div>
                    {folder.end_date && (
                      <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-lg">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#2D2D2D]">
              <h2 className="text-xl font-bold text-white">Create New Project</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#71717A] hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white placeholder-[#52525B] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    placeholder="Enter project name..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white placeholder-[#52525B] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                    rows={3}
                    placeholder="What is this project about?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Project Type</label>
                  <select
                    value={newProject.project_type}
                    onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0D0D0D] border border-[#2D2D2D] rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
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
                  <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Color</label>
                  <div className="flex gap-3">
                    {['#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, color })}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          newProject.color === color 
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1A1A1A] scale-110' 
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-3 bg-[#2D2D2D] hover:bg-[#3D3D3D] text-[#A1A1AA] rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all"
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
