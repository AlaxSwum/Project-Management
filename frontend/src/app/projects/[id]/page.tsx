'use client';

import React, { useState, useEffect } from 'react';
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
  FolderIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Subtask {
  id: number;
  title: string;
  is_completed: boolean;
  completed_by_id?: number;
  completed_at?: string;
}

interface ActivityLog {
  id: number;
  user_name: string;
  activity_type: string;
  description: string;
  created_at: string;
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
  subtasks?: Subtask[];
  activity?: ActivityLog[];
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
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [activeTab, setActiveTab] = useState<'subtask' | 'attachment' | 'comments'>('subtask');
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
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<string[]>([]);
  const [tempSubtask, setTempSubtask] = useState('');

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
        tags: newTask.tags.trim(), // Database column is 'tags', not 'tags_list'
        start_date: newTask.start_date || null,
        due_date: newTask.due_date || null,
      };
      
      const createdTask = await taskService.createTask(Number(params?.id), taskData);
      
      // Create subtasks if any
      if (newTaskSubtasks.length > 0) {
        const { supabase } = await import('@/lib/supabase');
        const subtasksToCreate = newTaskSubtasks.map((title, index) => ({
          task_id: createdTask.id,
          title,
          position: index,
          created_by_id: user?.id
        }));
        
        await supabase.from('task_subtasks').insert(subtasksToCreate);
      }
      
      setTasks([...tasks, createdTask]);
      setNewTask({ name: '', description: '', priority: 'medium', tags: '', assignee_ids: [], report_to_ids: [], start_date: '', due_date: '' });
      setNewTaskSubtasks([]);
      setTempSubtask('');
      setShowCreateTask(false);
      fetchProject();
    } catch (err) {
      // Error creating task
    }
  };

  const addTempSubtask = () => {
    if (tempSubtask.trim()) {
      setNewTaskSubtasks([...newTaskSubtasks, tempSubtask.trim()]);
      setTempSubtask('');
    }
  };

  const removeTempSubtask = (index: number) => {
    setNewTaskSubtasks(newTaskSubtasks.filter((_, i) => i !== index));
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

  // Fetch subtasks, attachments, comments and activity when task is selected
  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (!selectedTask) {
        setSubtasks([]);
        setActivityLog([]);
        setAttachments([]);
        setComments([]);
        return;
      }

      try {
        const { supabase } = await import('@/lib/supabase');
        
        // Fetch all data in parallel
        const [subtasksRes, activityRes, attachmentsRes, commentsRes] = await Promise.all([
          supabase.from('task_subtasks').select('*').eq('task_id', selectedTask.id).order('position'),
          supabase.from('task_activity_log').select('*').eq('task_id', selectedTask.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('task_attachment_links').select('*').eq('task_id', selectedTask.id).order('created_at', { ascending: false }),
          supabase.from('task_comments').select('*').eq('task_id', selectedTask.id).order('created_at', { ascending: false })
        ]);
        
        setSubtasks(subtasksRes.data || []);
        setActivityLog(activityRes.data || []);
        setAttachments(attachmentsRes.data || []);
        setComments(commentsRes.data || []);
      } catch (error) {
        // Error fetching task details
      }
    };

    fetchTaskDetails();
  }, [selectedTask]);

  const addSubtask = async () => {
    if (!newSubtask.trim() || !selectedTask) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('task_subtasks')
        .insert([{
          task_id: selectedTask.id,
          title: newSubtask.trim(),
          created_by_id: user?.id,
          position: subtasks.length
        }])
        .select()
        .single();
      
      if (!error && data) {
        setSubtasks([...subtasks, data]);
        setNewSubtask('');
      }
    } catch (error) {
      // Error adding subtask
    }
  };

  const toggleSubtask = async (subtaskId: number, isCompleted: boolean) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('task_subtasks')
        .update({ 
          is_completed: !isCompleted,
          completed_by_id: !isCompleted ? user?.id : null,
          completed_at: !isCompleted ? new Date().toISOString() : null
        })
        .eq('id', subtaskId);
      
      setSubtasks(subtasks.map(st => 
        st.id === subtaskId ? { ...st, is_completed: !isCompleted } : st
      ));
    } catch (error) {
      // Error toggling subtask
    }
  };

  const addAttachmentLink = async () => {
    if (!newAttachmentUrl.trim() || !selectedTask) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('task_attachment_links')
        .insert([{
          task_id: selectedTask.id,
          project_id: selectedTask.project_id,
          user_id: user?.id,
          user_name: user?.name || 'User',
          attachment_url: newAttachmentUrl.trim(),
          attachment_name: newAttachmentName.trim() || 'Link'
        }])
        .select()
        .single();
      
      if (!error && data) {
        setAttachments([data, ...attachments]);
        setNewAttachmentUrl('');
        setNewAttachmentName('');
      }
    } catch (error) {
      // Error adding attachment
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('task_comments')
        .insert([{
          task_id: selectedTask.id,
          project_id: selectedTask.project_id,
          user_id: user?.id,
          user_name: user?.name || 'User',
          comment_text: newComment.trim()
        }])
        .select()
        .single();
      
      if (!error && data) {
        setComments([data, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      // Error adding comment
    }
  };

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
            
        {/* Main Content - Kanban or Table View */}
        <div style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem', overflowX: 'auto', background: '#0D0D0D' }}>
          {selectedView === 'list' ? (
            // Table View (Monday.com style)
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2D2D2D' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '40px' }}>
                      <input type="checkbox" style={{ cursor: 'pointer' }} />
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', minWidth: '250px' }}>Task</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '120px' }}>Owner</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '130px' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '120px' }}>Due Date</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '200px' }}>Notes</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '100px' }}>Files</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '150px' }}>Timeline</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#141414', width: '130px' }}>Last Updated</th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#71717A', background: '#141414', width: '50px' }}>
                      <button style={{ width: '24px', height: '24px', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add column">
                        <PlusIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Group by status */}
                  {TASK_STATUSES.map((status) => {
                    const statusTasks = filteredTasks.filter(t => t.status === status.value);
                    if (statusTasks.length === 0) return null;
                    
                    return (
                      <React.Fragment key={status.value}>
                        <tr style={{ background: '#0D0D0D' }}>
                          <td colSpan={10} style={{ padding: '0.75rem 1rem', borderTop: '1px solid #2D2D2D', borderBottom: '1px solid #2D2D2D' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }} />
                              <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>{status.label}</span>
                              <span style={{ padding: '0.125rem 0.5rem', background: '#2D2D2D', borderRadius: '0.375rem', fontSize: '0.75rem', color: '#A1A1AA' }}>
                                {statusTasks.length}
                              </span>
              </div>
                          </td>
                        </tr>
                        {statusTasks.map((task) => (
                          <tr 
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            style={{ borderBottom: '1px solid #1F1F1F', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1A1A1A'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '1rem' }}>
                              <input type="checkbox" style={{ cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 500 }}>{task.name}</span>
                              </div>
                              {(() => {
                                const tags = task.tags_list || (task.tags ? task.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
                                return tags.length > 0 && (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
                                    {tags.slice(0, 2).map((tag: string, i: number) => {
                                      const tagColor = getTagColor(tag);
                                      return (
                                        <span key={i} style={{ padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 500, backgroundColor: `${tagColor}20`, color: tagColor }}>
                                          {tag}
                                        </span>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              {task.assignees && task.assignees.length > 0 ? (
                                <div style={{ display: 'flex', gap: '-0.25rem' }}>
                                  {task.assignees.slice(0, 2).map((assignee, i) => (
                                    <div 
                                      key={assignee.id}
                                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 500, color: '#FFFFFF', backgroundColor: ['#8B5CF6', '#EC4899'][i % 2], marginLeft: i > 0 ? '-6px' : '0' }}
                                      title={assignee.name}
                                    >
                                      {assignee.name.charAt(0)}
                    </div>
                  ))}
                    </div>
                              ) : (
                                <span style={{ color: '#52525B', fontSize: '0.875rem' }}>-</span>
                              )}
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                padding: '0.375rem 0.75rem', 
                                borderRadius: '0.375rem', 
                                fontSize: '0.8125rem', 
                                fontWeight: 500,
                                backgroundColor: task.status === 'done' ? '#10B98120' : task.status === 'in_progress' ? '#3B82F620' : task.status === 'review' ? '#F59E0B20' : '#71717A20',
                                color: task.status === 'done' ? '#10B981' : task.status === 'in_progress' ? '#3B82F6' : task.status === 'review' ? '#F59E0B' : '#71717A',
                                textTransform: 'capitalize',
                                display: 'inline-block'
                              }}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: task.due_date ? '#FFFFFF' : '#52525B', fontSize: '0.875rem' }}>
                              {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                            </td>
                            <td style={{ padding: '1rem', color: '#71717A', fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.description || '-'}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{ color: '#71717A', fontSize: '0.875rem' }}>
                                {Math.floor(Math.random() * 5)}
                              </span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ height: '4px', flex: 1, background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden', minWidth: '60px' }}>
                                  <div style={{ height: '100%', width: '40%', backgroundColor: status.color, borderRadius: '9999px' }} />
                </div>
                                <span style={{ color: '#71717A', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>40%</span>
              </div>
                            </td>
                            <td style={{ padding: '1rem', color: '#71717A', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                              {new Date(task.updated_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <button style={{ background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', padding: '0.25rem' }} onClick={(e) => { e.stopPropagation(); }}>
                                <EllipsisHorizontalIcon style={{ width: '20px', height: '20px' }} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Add Task Row */}
                  <tr style={{ borderTop: '1px solid #2D2D2D' }}>
                    <td colSpan={10} style={{ padding: '1rem' }}>
                      <button
                        onClick={() => setShowCreateTask(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#71717A', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#71717A'}
                      >
                        <PlusIcon style={{ width: '16px', height: '16px' }} />
                        Add task
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
          </div>
          ) : (
            // Kanban Board View
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
                      const taskTags = task.tags_list || (task.tags ? task.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
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
                              {taskTags.slice(0, 3).map((tag: string, i: number) => {
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
                        )}
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.75rem' }}>Assign To</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                    {project.members?.map((member, i) => {
                      const isSelected = newTask.assignee_ids.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: isSelected ? '#1A1A1A' : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected ? '#3D3D3D' : '#2D2D2D',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1A1A1A'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTask({ ...newTask, assignee_ids: [...newTask.assignee_ids, member.id] });
                              } else {
                                setNewTask({ ...newTask, assignee_ids: newTask.assignee_ids.filter(id => id !== member.id) });
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                          />
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                            {member.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.email}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                    {(!project.members || project.members.length === 0) && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#71717A', fontSize: '0.875rem' }}>
                        No team members available
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.75rem' }}>
                    Report To
                    <span style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 400, marginLeft: '0.5rem' }}>
                      (These users will receive notifications)
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                    {project.members?.map((member, i) => {
                      const isSelected = newTask.report_to_ids.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            background: isSelected ? '#1A1A1A' : 'transparent',
                            border: '1px solid',
                            borderColor: isSelected ? '#3B82F6' : '#2D2D2D',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#1A1A1A'; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewTask({ ...newTask, report_to_ids: [...newTask.report_to_ids, member.id] });
                              } else {
                                setNewTask({ ...newTask, report_to_ids: newTask.report_to_ids.filter(id => id !== member.id) });
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#3B82F6' }}
                          />
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                            {member.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {member.email}
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '6px', height: '6px', background: '#3B82F6', borderRadius: '50%', boxShadow: '0 0 8px rgba(59, 130, 246, 0.5)' }} />
                          )}
                        </label>
                      );
                    })}
                    {(!project.members || project.members.length === 0) && (
                      <div style={{ padding: '1rem', textAlign: 'center', color: '#71717A', fontSize: '0.875rem' }}>
                        No team members available
                      </div>
                    )}
                  </div>
                  {newTask.report_to_ids.length > 0 && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#71717A', marginBottom: '0.5rem' }}>
                        {newTask.report_to_ids.length} {newTask.report_to_ids.length === 1 ? 'user' : 'users'} will be notified
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {newTask.report_to_ids.map(id => {
                          const member = project.members?.find(m => m.id === id);
                          return member ? (
                            <span key={id} style={{ fontSize: '0.75rem', color: '#3B82F6', fontWeight: 500 }}>
                              {member.name}
                            </span>
                          ) : null;
                        }).reduce((prev: any, curr: any, i: number) => {
                          if (i === 0) return [curr];
                          return [...prev, <span key={`sep-${i}`} style={{ color: '#71717A' }}>,</span>, curr];
                        }, [])}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtasks Section */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Subtasks</label>
                  {newTaskSubtasks.length > 0 && (
                    <div style={{ marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {newTaskSubtasks.map((subtask, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                          <span style={{ width: '16px', height: '16px', border: '2px solid #52525B', borderRadius: '0.25rem', flexShrink: 0 }} />
                          <span style={{ flex: 1, color: '#FFFFFF', fontSize: '0.875rem' }}>{subtask}</span>
                          <button
                            type="button"
                            onClick={() => removeTempSubtask(index)}
                            style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: 0 }}
                          >
                            <XMarkIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={tempSubtask}
                      onChange={(e) => setTempSubtask(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTempSubtask(); } }}
                      placeholder="Add a subtask..."
                      style={{ flex: 1, padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', transition: 'border 0.2s' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#10B981'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#2D2D2D'}
                    />
                    <button
                      type="button"
                      onClick={addTempSubtask}
                      style={{ padding: '0.75rem 1.25rem', background: '#2D2D2D', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#3D3D3D'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#2D2D2D'}
                    >
                      Add
                    </button>
                  </div>
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
                  style={{ flex: 1, padding: '0.75rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', transition: 'background 0.2s' }}
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

      {/* Task Detail Modal - Dark Theme */}
      {selectedTask && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)', padding: '1rem' }}
          onClick={() => setSelectedTask(null)}
        >
          <div 
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '75rem', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Task Detail</h2>
              <button
                onClick={() => setSelectedTask(null)}
                style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Panel - Task Details */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid #2D2D2D' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem' }}>{selectedTask.name}</h1>
                
                <p style={{ color: '#A1A1AA', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  {selectedTask.description || 'No description provided'}
                </p>

                {/* Task Properties Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Status</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TASK_STATUSES.find(s => s.value === selectedTask.status)?.color }} />
                      <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                        {TASK_STATUSES.find(s => s.value === selectedTask.status)?.label}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Assigned to</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {(selectedTask.assignees || []).map((assignee, i) => (
                        <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ['#8B5CF6', '#F59E0B', '#EC4899'][i % 3], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.65rem', fontWeight: 600 }}>
                            {assignee.name.charAt(0)}
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: '#FFFFFF', fontWeight: 500 }}>{assignee.name}</span>
                        </div>
                      ))}
                      {(!selectedTask.assignees || selectedTask.assignees.length === 0) && (
                        <span style={{ fontSize: '0.875rem', color: '#52525B' }}>No assignees</span>
                      )}
                    </div>
                  </div>

                  {selectedTask.start_date && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Start date</label>
                      <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                          {new Date(selectedTask.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {selectedTask.due_date && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Due date</label>
                      <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                          {new Date(selectedTask.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Priority</label>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: selectedTask.priority === 'low' ? 'rgba(16, 185, 129, 0.2)' : '#0D0D0D', borderRadius: '9999px', border: '1px solid #2D2D2D' }}>
                      <span style={{ fontSize: '0.875rem', color: selectedTask.priority === 'low' ? '#10B981' : '#FFFFFF', fontWeight: 500, textTransform: 'capitalize' }}>
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tabs and Content Section */}
                <div style={{ marginTop: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                      {activeTab === 'subtask' && `Subtask (${subtasks.filter(s => s.is_completed).length}/${subtasks.length})`}
                      {activeTab === 'attachment' && `Attachments (${attachments.length})`}
                      {activeTab === 'comments' && `Comments (${comments.length})`}
                    </h3>
                  </div>

                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid #2D2D2D', marginBottom: '1rem' }}>
                    {[
                      { id: 'subtask', label: 'Subtask', count: subtasks.length },
                      { id: 'attachment', label: 'Attachment', count: attachments.length },
                      { id: 'comments', label: 'Comments', count: comments.length }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                          padding: '0.75rem 0',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          color: activeTab === tab.id ? '#10B981' : '#71717A',
                          borderBottom: activeTab === tab.id ? '2px solid #10B981' : 'none',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'color 0.2s'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div>
                    {/* Subtasks Tab */}
                    {activeTab === 'subtask' && (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          {subtasks.map((subtask) => (
                            <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#0D0D0D', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                              <input 
                                type="checkbox"
                                checked={subtask.is_completed}
                                onChange={() => toggleSubtask(subtask.id, subtask.is_completed)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                              />
                              <span style={{ flex: 1, color: subtask.is_completed ? '#52525B' : '#FFFFFF', fontSize: '0.9375rem', textDecoration: subtask.is_completed ? 'line-through' : 'none' }}>
                                {subtask.title}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
                            placeholder="+ Add subtask"
                            style={{ flex: 1, padding: '0.625rem 0.875rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#FFFFFF', outline: 'none' }}
                          />
                          <button
                            onClick={addSubtask}
                            type="button"
                            style={{ padding: '0.625rem 1rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Attachments Tab */}
                    {activeTab === 'attachment' && (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          {attachments.map((attachment) => (
                            <div key={attachment.id} style={{ padding: '0.75rem', background: '#0D0D0D', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <PaperClipIcon style={{ width: '16px', height: '16px', color: '#10B981' }} />
                                <a 
                                  href={attachment.attachment_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  style={{ flex: 1, color: '#10B981', fontSize: '0.9375rem', fontWeight: 500, textDecoration: 'none' }}
                                >
                                  {attachment.attachment_name}
                                </a>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#71717A', marginLeft: '1.75rem' }}>
                                Added by {attachment.user_name} • {new Date(attachment.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={newAttachmentName}
                            onChange={(e) => setNewAttachmentName(e.target.value)}
                            placeholder="Attachment name (e.g., Design mockup)"
                            style={{ padding: '0.625rem 0.875rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#FFFFFF', outline: 'none' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                              type="url"
                              value={newAttachmentUrl}
                              onChange={(e) => setNewAttachmentUrl(e.target.value)}
                              onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttachmentLink(); } }}
                              placeholder="Paste link URL (https://...)"
                              style={{ flex: 1, padding: '0.625rem 0.875rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#FFFFFF', outline: 'none' }}
                            />
                            <button
                              onClick={addAttachmentLink}
                              type="button"
                              style={{ padding: '0.625rem 1rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                            >
                              Add Link
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Comments Tab */}
                    {activeTab === 'comments' && (
                      <div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
                          {comments.map((comment) => (
                            <div key={comment.id} style={{ padding: '1rem', background: '#0D0D0D', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                              <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0 }}>
                                  {comment.user_name?.charAt(0) || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>{comment.user_name || 'User'}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#71717A', marginLeft: '0.5rem' }}>
                                      {new Date(comment.created_at).toLocaleDateString()} at {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p style={{ color: '#A1A1AA', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
                                    {comment.comment_text}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(); } }}
                            placeholder="Write a comment..."
                            style={{ flex: 1, padding: '0.625rem 0.875rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#FFFFFF', outline: 'none', resize: 'none', minHeight: '80px' }}
                          />
                          <button
                            onClick={addComment}
                            type="button"
                            style={{ padding: '0.625rem 1rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.375rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', alignSelf: 'flex-end' }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Created by */}
                <div style={{ marginTop: '2rem', padding: '1rem', background: '#0D0D0D', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#71717A', marginBottom: '0.5rem' }}>Created by</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 600 }}>
                      {selectedTask.created_by?.name?.charAt(0) || 'U'}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                      {selectedTask.created_by?.name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right Panel - Project Status & Activities */}
              <div style={{ width: '380px', background: '#0D0D0D', padding: '1.5rem', overflowY: 'auto', borderLeft: '1px solid #2D2D2D' }}>
                {/* Project Status */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#71717A', marginBottom: '1rem' }}>Project Status</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: '#1A1A1A', borderRadius: '0.5rem', border: '1px solid #2D2D2D' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '0.375rem', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ClockIcon style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>Time Remaining</div>
                      <div style={{ fontSize: '0.75rem', color: '#71717A' }}>
                        {selectedTask.due_date ? Math.max(0, Math.ceil((new Date(selectedTask.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) + 'd' : 'No due date'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#71717A' }}>Progress</span>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#10B981' }}>
                        {subtasks.length > 0 ? Math.round((subtasks.filter(s => s.is_completed).length / subtasks.length) * 100) : 0}%
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#2D2D2D', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ width: `${subtasks.length > 0 ? (subtasks.filter(s => s.is_completed).length / subtasks.length) * 100 : 0}%`, height: '100%', background: '#10B981', borderRadius: '9999px', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#71717A', margin: 0 }}>Activities</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {activityLog.map((activity) => (
                      <div key={activity.id} style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 600, flexShrink: 0 }}>
                          {activity.user_name.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>{activity.user_name} </span>
                            <span style={{ fontSize: '0.875rem', color: '#A1A1AA' }}>{activity.description}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#71717A' }}>
                            {new Date(activity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(activity.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {activity.activity_type === 'status_changed' && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', fontSize: '0.75rem', borderRadius: '0.25rem', fontWeight: 500 }}>To Do</span>
                              <span style={{ fontSize: '0.75rem', color: '#71717A' }}>→</span>
                              <span style={{ padding: '0.25rem 0.5rem', background: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', fontSize: '0.75rem', borderRadius: '0.25rem', fontWeight: 500 }}>In Progress</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Default activity - task created */}
                    {activityLog.length === 0 && (
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.7rem', fontWeight: 600 }}>
                          {selectedTask.created_by?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#FFFFFF' }}>{selectedTask.created_by?.name || 'User'} </span>
                            <span style={{ fontSize: '0.875rem', color: '#A1A1AA' }}>created task</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#71717A' }}>
                            {new Date(selectedTask.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(selectedTask.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    )}
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
