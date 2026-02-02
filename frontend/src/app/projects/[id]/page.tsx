'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  EllipsisHorizontalIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CalendarIcon as CalIcon,
  ChartBarIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignees: User[];
  assignee?: User | null;
  created_by: User;
  tags_list: string[];
  created_at: string;
  updated_at: string;
  project_id: number;
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  members: User[];
  tasks: Task[];
  task_count: number;
  completed_task_count: number;
  created_by: User;
  created_at: string;
}

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#EF4444' },
  { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
  { value: 'review', label: 'Review', color: '#F59E0B' },
  { value: 'done', label: 'Complete', color: '#10B981' },
];

const TAG_COLORS: Record<string, string> = {
  'design': '#EC4899',
  'ui/ux': '#EC4899',
  'frontend': '#3B82F6',
  'backend': '#8B5CF6',
  'api': '#3B82F6',
  'qa': '#06B6D4',
  'auth': '#EF4444',
  'database': '#6366F1',
  'media': '#A855F7',
  'performance': '#14B8A6',
  'research': '#EF4444',
};

function getTagColor(tag: string): string {
  const normalizedTag = tag.toLowerCase();
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (normalizedTag.includes(key)) return color;
  }
  return '#71717A';
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('kanban');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium',
    tags: '',
    assignee_ids: [] as number[],
    report_to_ids: [] as number[],
    start_date: '',
    due_date: '',
  });

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
    fetchProject();
  }, [isAuthenticated, authLoading, params?.id, router]);

  const fetchProject = async () => {
    try {
      const [projectData, tasksData, projectsData] = await Promise.all([
        projectService.getProject(Number(params?.id)),
        taskService.getProjectTasks(Number(params?.id)),
        projectService.getProjects()
      ]);
      setProject(projectData);
      setTasks(tasksData);
      setAllProjects(projectsData);
    } catch (err: any) {
      if (err.response?.status === 404) {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const taskData: any = {
        name: newTask.name.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        status: 'todo',
        assignee_ids: newTask.assignee_ids,
        report_to_ids: newTask.report_to_ids,
        tags_list: newTask.tags.split(',').map(t => t.trim()).filter(Boolean),
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
      };
      
      const createdTask = await taskService.createTask(Number(params?.id), taskData);
      setTasks([...tasks, createdTask]);
      setNewTask({ name: '', description: '', priority: 'medium', tags: '', assignee_ids: [], report_to_ids: [], start_date: '', due_date: '' });
      setShowCreateTask(false);
      fetchProject();
    } catch (err) {
      // Error creating task
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.status === newStatus) return;
    
    try {
      await taskService.updateTask(draggedTask.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));
    } catch (err) {
      // Error updating task
    }
    setDraggedTask(null);
  };

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(16, 185, 129, 0.2)', borderTop: '4px solid #10B981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
      </div>
    );
  }

  if (!isAuthenticated || !project) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex' }}>
      {/* Sidebar */}
      <Sidebar projects={allProjects} onCreateProject={() => {}} />
      
      {/* Main Content */}
      <div style={{ flex: 1, marginLeft: isMobile ? 0 : '280px', display: 'flex', flexDirection: 'column', background: '#0D0D0D' }}>
        {/* Top Breadcrumb Header */}
        <div style={{ height: '56px', background: '#0D0D0D', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <span style={{ color: '#71717A' }}>Project</span>
            <span style={{ color: '#3D3D3D' }}>&gt;</span>
            <span style={{ color: '#71717A' }}>Website</span>
            <span style={{ color: '#3D3D3D' }}>&gt;</span>
            <span style={{ color: '#FFFFFF' }}>{project.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '-0.5rem' }}>
              {project.members?.slice(0, 4).map((member, i) => (
                <div 
                  key={member.id}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 500, color: '#FFFFFF', backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i % 4], marginLeft: i > 0 ? '-8px' : '0' }}
                  title={member.name}
                >
                  {member.name.charAt(0)}
                </div>
              ))}
              {project.members && project.members.length > 4 && (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#FFFFFF', backgroundColor: '#2D2D2D', marginLeft: '-8px' }}>
                  +{project.members.length - 4}
                </div>
              )}
            </div>
            <button style={{ width: '32px', height: '32px', background: 'none', border: 'none', borderRadius: '0.5rem', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Project Title Header */}
        <div style={{ padding: isMobile ? '1rem' : '1.25rem 1.5rem', borderBottom: '1px solid #1F1F1F' }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', marginBottom: '1rem', gap: isMobile ? '1rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
              <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', borderRadius: '0.5rem', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderIcon style={{ width: isMobile ? '18px' : '20px', height: isMobile ? '18px' : '20px', color: '#10B981' }} />
              </div>
              <h1 style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{project.name}</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
              {!isMobile && (
                <div style={{ display: 'flex', gap: '-0.5rem' }}>
                  {project.members?.slice(0, 5).map((member, i) => (
                    <div 
                      key={member.id}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 500, color: '#FFFFFF', backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5], marginLeft: i > 0 ? '-8px' : '0' }}
                    >
                      {member.name.charAt(0)}
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowCreateTask(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#3B82F6', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                New Task
              </button>
            </div>
          </div>
          
          {/* View Tabs and Search */}
          <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0.75rem' : '0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#1A1A1A', borderRadius: '0.5rem', padding: '0.25rem', width: isMobile ? '100%' : 'auto', overflowX: 'auto' }}>
              {[
                { id: 'kanban', label: 'Kanban', icon: Squares2X2Icon },
                { id: 'board', label: 'Board', icon: ChartBarIcon },
                { id: 'list', label: 'List', icon: ListBulletIcon },
                { id: 'calendar', label: 'Calendar', icon: CalIcon }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    background: selectedView === view.id ? '#2D2D2D' : 'transparent',
                    color: selectedView === view.id ? '#FFFFFF' : '#71717A',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedView !== view.id) e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedView !== view.id) e.currentTarget.style.color = '#71717A';
                  }}
                >
                  <view.icon style={{ width: '16px', height: '16px' }} />
                  {view.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: isMobile ? '100%' : 'auto' }}>
              <div style={{ position: 'relative', flex: isMobile ? 1 : 'none' }}>
                <MagnifyingGlassIcon style={{ width: '16px', height: '16px', position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#52525B', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: isMobile ? '100%' : '200px', paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#FFFFFF', outline: 'none', transition: 'border 0.2s' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                />
              </div>
              <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#A1A1AA', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#A1A1AA'}
              >
                <AdjustmentsHorizontalIcon style={{ width: '16px', height: '16px' }} />
                {!isMobile && 'Filter'}
              </button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem', overflowX: 'auto', background: '#0D0D0D' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, minmax(280px, 1fr))', gap: '1.25rem', maxWidth: '100%' }}>
            {TASK_STATUSES.map((status) => {
              const statusTasks = filteredTasks.filter(t => t.status === status.value);
              
              return (
                <div
                  key={status.value}
                  style={{ width: '100%', minWidth: isMobile ? '100%' : '280px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', borderRadius: '0.75rem', border: dragOverColumn === status.value ? '2px solid #10B981' : '2px solid transparent' }}
                  onDragOver={(e) => handleDragOver(e, status.value)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, status.value)}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0 0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: status.color }} />
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>{status.label}</span>
                      <span style={{ padding: '0.125rem 0.5rem', background: '#2D2D2D', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#A1A1AA', fontWeight: 600 }}>
                        {statusTasks.length}
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowCreateTask(true)}
                      style={{ width: '24px', height: '24px', background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#52525B'}
                    >
                      <PlusIcon style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>

                  {/* Tasks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px' }}>
                    {statusTasks.map((task) => {
                      const taskTags = task.tags_list || [];
                      const subtasksTotal = 4;
                      const subtasksCompleted = Math.floor(Math.random() * 5);
                      const progress = (subtasksCompleted / subtasksTotal) * 100;
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => setSelectedTask(task)}
                          style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Tags */}
                          {taskTags.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                              {taskTags.slice(0, 3).map((tag, i) => {
                                const tagColor = getTagColor(tag);
                                return (
                                  <span
                                    key={i}
                                    style={{ padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500, backgroundColor: `${tagColor}20`, color: tagColor }}
                                  >
                                    {tag}
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* Title and Menu */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.4, margin: 0, flex: 1 }}>{task.name}</h3>
                            <button style={{ width: '24px', height: '24px', background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.opacity = '1'; }}
                            >
                              <EllipsisHorizontalIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                          </div>

                          {/* Description */}
                          {task.description && (
                            <p style={{ color: '#71717A', fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>
                          )}

                          {/* Progress */}
                          <div style={{ marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                              <span style={{ color: '#71717A', fontSize: '0.75rem' }}>Progress</span>
                              <span style={{ color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 500 }}>
                                {subtasksCompleted}/{subtasksTotal}
                              </span>
                            </div>
                            <div style={{ height: '4px', background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${progress}%`, backgroundColor: status.color, borderRadius: '9999px', transition: 'width 0.3s' }} />
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #2D2D2D' }}>
                            {/* Avatars */}
                            <div style={{ display: 'flex', gap: '-0.375rem' }}>
                              {(task.assignees || []).slice(0, 2).map((assignee, i) => (
                                <div
                                  key={assignee.id}
                                  style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 500, color: '#FFFFFF', backgroundColor: ['#8B5CF6', '#EC4899'][i % 2], marginLeft: i > 0 ? '-6px' : '0' }}
                                >
                                  {assignee.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            
                            {/* Counts */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#71717A', fontSize: '0.75rem' }}>
                                <PaperClipIcon style={{ width: '14px', height: '14px' }} />
                                <span>{Math.floor(Math.random() * 5) + 1}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#71717A', fontSize: '0.75rem' }}>
                                <ChatBubbleLeftIcon style={{ width: '14px', height: '14px' }} />
                                <span>{Math.floor(Math.random() * 20) + 1}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State */}
                    {statusTasks.length === 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '150px', border: '2px dashed #2D2D2D', borderRadius: '0.75rem', background: 'transparent' }}>
                        <span style={{ color: '#52525B', fontSize: '0.875rem' }}>No tasks</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '40rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Create New Task</h2>
              <button
                onClick={() => setShowCreateTask(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', fontSize: '1.5rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Task Name *</label>
                  <input
                    type="text"
                    required
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', transition: 'border 0.2s' }}
                    placeholder="Enter task name..."
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', resize: 'none', transition: 'border 0.2s' }}
                    rows={3}
                    placeholder="Describe the task..."
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={newTask.tags}
                    onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', transition: 'border 0.2s' }}
                    placeholder="Design, Frontend, API..."
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Start Date</label>
                    <input
                      type="date"
                      value={newTask.start_date}
                      onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Due Date</label>
                    <input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Assign To (Hold Ctrl/Cmd for multiple)</label>
                  <select
                    multiple
                    value={newTask.assignee_ids.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(o => parseInt(o.value));
                      setNewTask({ ...newTask, assignee_ids: selected });
                    }}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s', minHeight: '100px' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  >
                    {project.members?.map(member => (
                      <option key={member.id} value={member.id} style={{ padding: '0.5rem', background: '#0D0D0D', color: '#FFFFFF' }}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  {newTask.assignee_ids.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {newTask.assignee_ids.map(id => {
                        const member = project.members?.find(m => m.id === id);
                        return member ? (
                          <span key={id} style={{ padding: '0.25rem 0.625rem', background: '#2D2D2D', color: '#FFFFFF', fontSize: '0.75rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {member.name}
                            <button
                              type="button"
                              onClick={() => setNewTask({ ...newTask, assignee_ids: newTask.assignee_ids.filter(aid => aid !== id) })}
                              style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                              <XMarkIcon style={{ width: '12px', height: '12px' }} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Report To (Hold Ctrl/Cmd for multiple)</label>
                  <select
                    multiple
                    value={newTask.report_to_ids.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(o => parseInt(o.value));
                      setNewTask({ ...newTask, report_to_ids: selected });
                    }}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer', transition: 'border 0.2s', minHeight: '100px' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                  >
                    {project.members?.map(member => (
                      <option key={member.id} value={member.id} style={{ padding: '0.5rem', background: '#0D0D0D', color: '#FFFFFF' }}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.75rem', color: '#71717A', marginTop: '0.5rem' }}>
                    Users selected here will receive notifications when this task is updated, status changes, or comments are added.
                  </p>
                  {newTask.report_to_ids.length > 0 && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {newTask.report_to_ids.map(id => {
                        const member = project.members?.find(m => m.id === id);
                        return member ? (
                          <span key={id} style={{ padding: '0.25rem 0.625rem', background: '#8B5CF6', color: '#FFFFFF', fontSize: '0.75rem', borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            {member.name}
                            <button
                              type="button"
                              onClick={() => setNewTask({ ...newTask, report_to_ids: newTask.report_to_ids.filter(rid => rid !== id) })}
                              style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0, display: 'flex' }}
                            >
                              <XMarkIcon style={{ width: '12px', height: '12px' }} />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #2D2D2D', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                  style={{ flex: 1, padding: '0.75rem', background: '#2D2D2D', color: '#A1A1AA', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#3D3D3D'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#2D2D2D'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: '0.75rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '1rem' }}
          onClick={() => setSelectedTask(null)}
        >
          <div 
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '48rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', margin: '0 0 0.5rem 0' }}>{selectedTask.name}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedTask.tags_list?.map((tag, i) => {
                    const tagColor = getTagColor(tag);
                    return (
                      <span
                        key={i}
                        style={{ padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 500, backgroundColor: `${tagColor}20`, color: tagColor }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: isMobile ? '1rem' : '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? '1.5rem' : '2rem' }}>
                {/* Left Column - Main Content */}
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Description</h3>
                    <p style={{ color: '#FFFFFF', fontSize: '0.9375rem', lineHeight: 1.6 }}>{selectedTask.description || 'No description provided'}</p>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Activity</h3>
                    <div style={{ padding: '1rem', background: '#0D0D0D', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                      <p style={{ color: '#71717A', fontSize: '0.875rem' }}>No recent activity</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Details */}
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', marginBottom: '0.75rem' }}>Status</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TASK_STATUSES.find(s => s.value === selectedTask.status)?.color }} />
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>
                        {TASK_STATUSES.find(s => s.value === selectedTask.status)?.label}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', marginBottom: '0.75rem' }}>Priority</h3>
                    <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem', textTransform: 'capitalize' }}>{selectedTask.priority}</span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', marginBottom: '0.75rem' }}>Assignees</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(selectedTask.assignees || []).map((assignee) => (
                        <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500 }}>
                            {assignee.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>{assignee.name}</div>
                            <div style={{ color: '#71717A', fontSize: '0.75rem' }}>{assignee.email}</div>
                          </div>
                        </div>
                      ))}
                      {(!selectedTask.assignees || selectedTask.assignees.length === 0) && (
                        <p style={{ color: '#71717A', fontSize: '0.875rem', padding: '1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', textAlign: 'center' }}>No assignees</p>
                      )}
                    </div>
                  </div>

                  {selectedTask.due_date && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', marginBottom: '0.75rem' }}>Due Date</h3>
                      <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                        <span style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>
                          {new Date(selectedTask.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#A1A1AA', marginBottom: '0.75rem' }}>Created</h3>
                    <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem' }}>
                        {new Date(selectedTask.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
