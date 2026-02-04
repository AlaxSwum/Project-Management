'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { supabase } from '@/lib/supabase';
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
  ClockIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  MapIcon
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
  tags_list?: string[];
  tags?: string;
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
  const [selectedView, setSelectedView] = useState<'kanban' | 'list' | 'calendar' | 'gantt' | 'growth'>('kanban');
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    priority: [] as string[],
    assignee: [] as number[],
    tags: [] as string[],
  });
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'text',
    width: 150
  });
  const [ganttStartDate, setGanttStartDate] = useState(() => {
    // Start from beginning of current month
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
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
  const [showProjectMembers, setShowProjectMembers] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingMemberRole, setEditingMemberRole] = useState<string>('');
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'kanban' | 'list' | 'gantt' | 'calendar'>('kanban');
  const [enteredTags, setEnteredTags] = useState<string[]>([]);
  const [taskMenuOpen, setTaskMenuOpen] = useState<number | null>(null);

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
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      const [projectData, tasksData, projectsData] = await Promise.all([
        projectService.getProject(Number(params?.id)),
        taskService.getProjectTasks(Number(params?.id)),
        projectService.getProjects()
      ]);
      
      // Filter to only show projects where user is a member
      const myProjects = projectsData.filter(project => {
        return project.members && project.members.some((m: any) => m.id === user.id);
      });
      
      setProject(projectData);
      setTasks(tasksData);
      setAllProjects(myProjects); // Only projects where user is member
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

  // Filter for Kanban: only show tasks within 1 month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const kanbanTasks = tasks.filter(task => {
    // Only show tasks updated within 1 month in Kanban view
    if (selectedView === 'kanban') {
      const updatedDate = new Date(task.updated_at);
      if (updatedDate < oneMonthAgo) return false;
    }
    return true;
  });

  // Apply search and filters
  const filteredTasks = (selectedView === 'kanban' ? kanbanTasks : tasks).filter(task => {
    // Search filter
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = filters.status.length === 0 || filters.status.includes(task.status);
    
    // Priority filter
    const matchesPriority = filters.priority.length === 0 || filters.priority.includes(task.priority);
    
    // Assignee filter
    const matchesAssignee = filters.assignee.length === 0 || 
      (task.assignees && task.assignees.some(a => filters.assignee.includes(a.id)));
    
    // Tags filter
    const taskTagsArray = task.tags_list || (task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    const matchesTags = filters.tags.length === 0 ||
      taskTagsArray.some((tag: string) => filters.tags.includes(tag));
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesTags;
  });

  // Group tasks by month for table view
  const tasksByMonth = React.useMemo(() => {
    const groups: Record<string, typeof filteredTasks> = {};
    
    filteredTasks.forEach(task => {
      let monthKey = 'No Due Date';
      if (task.due_date) {
        monthKey = new Date(task.due_date).toLocaleString('default', { month: 'long', year: 'numeric' });
      }
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(task);
    });
    
    return groups;
  }, [filteredTasks]);
  
  // Auto-expand latest month with all its status groups on first load
  useEffect(() => {
    if (expandedMonths.length === 0 && Object.keys(tasksByMonth).length > 0) {
      // Get the latest month (first after sorting by date descending)
      const sortedMonths = Object.keys(tasksByMonth).sort((a, b) => {
        if (a === 'No Due Date') return 1;
        if (b === 'No Due Date') return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      });
      const latestMonth = sortedMonths[0];
      
      // Expand the month and all its status groups
      const statusKeys = TASK_STATUSES.map(s => `${latestMonth}-${s.value}`);
      setExpandedMonths([latestMonth, ...statusKeys]);
    }
  }, [tasksByMonth]);

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
n              {/* Team Members Button - Avatar Style */}
              <button
                onClick={() => setShowProjectMembers(true)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <div style={{ display: 'flex' }}>
                  {project.members?.slice(0, 3).map((member, i) => (
                    <div 
                      key={member.id}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        border: '2px solid #0D0D0D', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        color: '#FFFFFF', 
                        backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6'][i % 3], 
                        marginLeft: i > 0 ? '-8px' : '0',
                        transition: 'transform 0.2s'
                      }}
                    >
                      {member.name.charAt(0)}
                    </div>
                  ))}
                  {project.members && project.members.length > 3 && (
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      border: '2px solid #0D0D0D', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: '0.6875rem', 
                      fontWeight: 600,
                      color: '#FFFFFF', 
                      backgroundColor: '#2D2D2D', 
                      marginLeft: '-8px' 
                    }}>
                      +{project.members.length - 3}
                    </div>
                  )}
                </div>
              </button>
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
                { id: 'list', label: 'List', icon: ListBulletIcon },
                { id: 'gantt', label: 'Gantt', icon: ChartBarIcon },
                { id: 'calendar', label: 'Calendar', icon: CalIcon },
                { id: 'growth', label: 'Growth Map', icon: MapIcon }
              ].map((view) => (
                  <button
                  key={view.id}
                  onClick={() => {
                    setSelectedView(view.id as any);
                    setSelectedTab(view.id as any);
                  }}
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
                  <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: showFilterPanel ? '#10B981' : '#1A1A1A', border: '1px solid', borderColor: showFilterPanel ? '#10B981' : '#2D2D2D', borderRadius: '0.5rem', fontSize: '0.875rem', color: showFilterPanel ? '#FFFFFF' : '#A1A1AA', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
              >
                <AdjustmentsHorizontalIcon style={{ width: '16px', height: '16px' }} />
                {!isMobile && 'Filter'}
                {(filters.status.length > 0 || filters.priority.length > 0 || filters.assignee.length > 0 || filters.tags.length > 0) && (
                  <span style={{ width: '18px', height: '18px', background: '#EF4444', color: '#FFFFFF', fontSize: '0.7rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    {filters.status.length + filters.priority.length + filters.assignee.length + filters.tags.length}
                  </span>
                )}
                  </button>
                </div>
          </div>

          {/* Filter Panel - Improved UI */}
          {showFilterPanel && (
            <div style={{ margin: '1rem 1.5rem 0', padding: '1.5rem', background: '#141414', border: '1px solid #2D2D2D', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Status Filter */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {TASK_STATUSES.map(status => (
                      <label 
                        key={status.value} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          cursor: 'pointer',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: filters.status.includes(status.value) ? '#1F1F1F' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (!filters.status.includes(status.value)) e.currentTarget.style.background = '#1A1A1A'; }}
                        onMouseLeave={(e) => { if (!filters.status.includes(status.value)) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({ ...filters, status: [...filters.status, status.value] });
                            } else {
                              setFilters({ ...filters, status: filters.status.filter(s => s !== status.value) });
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: status.color }}
                        />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: status.color }} />
                        <span style={{ fontSize: '0.875rem', color: '#E5E5E5' }}>{status.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Priority</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { value: 'low', color: '#22C55E' },
                      { value: 'medium', color: '#F59E0B' },
                      { value: 'high', color: '#EF4444' },
                      { value: 'urgent', color: '#DC2626' }
                    ].map(priority => (
                      <label 
                        key={priority.value} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          cursor: 'pointer',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: filters.priority.includes(priority.value) ? '#1F1F1F' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (!filters.priority.includes(priority.value)) e.currentTarget.style.background = '#1A1A1A'; }}
                        onMouseLeave={(e) => { if (!filters.priority.includes(priority.value)) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({ ...filters, priority: [...filters.priority, priority.value] });
                            } else {
                              setFilters({ ...filters, priority: filters.priority.filter(p => p !== priority.value) });
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: priority.color }}
                        />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: priority.color }} />
                        <span style={{ fontSize: '0.875rem', color: '#E5E5E5', textTransform: 'capitalize' }}>{priority.value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assignee Filter */}
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Assignee</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {project.members?.map((member, i) => (
                      <label 
                        key={member.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.75rem', 
                          cursor: 'pointer',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          background: filters.assignee.includes(member.id) ? '#1F1F1F' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (!filters.assignee.includes(member.id)) e.currentTarget.style.background = '#1A1A1A'; }}
                        onMouseLeave={(e) => { if (!filters.assignee.includes(member.id)) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <input
                          type="checkbox"
                          checked={filters.assignee.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters({ ...filters, assignee: [...filters.assignee, member.id] });
                            } else {
                              setFilters({ ...filters, assignee: filters.assignee.filter(a => a !== member.id) });
                            }
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3B82F6' }}
                        />
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.6875rem', fontWeight: 600 }}>
                          {member.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: '#E5E5E5' }}>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(filters.status.length > 0 || filters.priority.length > 0 || filters.assignee.length > 0 || filters.tags.length > 0) && (
                <button
                  onClick={() => setFilters({ status: [], priority: [], assignee: [], tags: [] })}
                  style={{ marginTop: '1.25rem', padding: '0.625rem 1.25rem', background: '#EF4444', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#DC2626'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#EF4444'}
                >
                  Clear All Filters
                  </button>
              )}
            </div>
          )}
                </div>

        {/* Main Content - Multiple Views */}
        <div style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem', overflowX: 'auto', background: '#0D0D0D' }}>
          {selectedView === 'calendar' ? (
            // Calendar View
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '0.5rem', background: '#2D2D2D', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', cursor: 'pointer' }}>←</button>
                  <button style={{ padding: '0.5rem', background: '#2D2D2D', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', cursor: 'pointer' }}>→</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: '#2D2D2D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{ padding: '0.75rem', background: '#141414', textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#71717A' }}>
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const dayTasks = filteredTasks.filter(t => {
                    if (!t.due_date) return false;
                    const taskDate = new Date(t.due_date).getDate();
                    return taskDate === i - 2; // Sample - needs proper calendar logic
                  });
                  return (
                    <div key={i} style={{ minHeight: '100px', padding: '0.5rem', background: '#1A1A1A', borderTop: i > 6 ? '1px solid #2D2D2D' : 'none' }}>
                      <div style={{ fontSize: '0.8125rem', color: '#71717A', marginBottom: '0.375rem' }}>{i + 1}</div>
                      {dayTasks.slice(0, 2).map(task => (
                        <div key={task.id} style={{ fontSize: '0.75rem', color: '#FFFFFF', background: '#0D0D0D', padding: '0.25rem 0.375rem', borderRadius: '0.25rem', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderLeft: '2px solid', borderLeftColor: TASK_STATUSES.find(s => s.value === task.status)?.color || '#71717A' }}>
                          {task.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : selectedView === 'gantt' ? (
            // Gantt Chart View - Daily Timeline
            <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.75rem', overflow: 'hidden' }}>
              {/* Gantt Header with Month Navigation */}
              <div style={{ padding: '1rem 1.5rem', background: '#141414', borderBottom: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Timeline</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      const newDate = new Date(ganttStartDate);
                      newDate.setDate(newDate.getDate() - 14);
                      setGanttStartDate(newDate);
                    }}
                    style={{ padding: '0.5rem 0.75rem', background: '#2D2D2D', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setGanttStartDate(new Date())}
                    style={{ padding: '0.5rem 0.75rem', background: '#3B82F6', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(ganttStartDate);
                      newDate.setDate(newDate.getDate() + 14);
                      setGanttStartDate(newDate);
                    }}
                    style={{ padding: '0.5rem 0.75rem', background: '#2D2D2D', border: 'none', borderRadius: '0.375rem', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex' }}>
                <div style={{ width: '280px', background: '#141414', borderRight: '1px solid #2D2D2D' }}>
                  <div style={{ padding: '0.875rem 1rem', borderBottom: '2px solid #2D2D2D' }}>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.075em' }}>Task</div>
                  </div>
                </div>
                <div style={{ flex: 1, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #2D2D2D' }}>
                    {Array.from({ length: 12 }, (_, weekIndex) => {
                      const weekStartDate = new Date(ganttStartDate);
                      weekStartDate.setDate(weekStartDate.getDate() + (weekIndex * 7));
                      const weekEndDate = new Date(weekStartDate);
                      weekEndDate.setDate(weekEndDate.getDate() + 6);
                      return (
                        <div key={weekIndex} style={{ minWidth: '210px', padding: '0.5rem', background: '#141414', borderRight: '1px solid #2D2D2D', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', textTransform: 'uppercase' }}>
                            {weekStartDate.getDate()} {weekStartDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} - {weekEndDate.getDate()} {weekEndDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', borderBottom: '2px solid #2D2D2D' }}>
                    {Array.from({ length: 84 }, (_, dayIndex) => {
                      const currentDate = new Date(ganttStartDate);
                      currentDate.setDate(currentDate.getDate() + dayIndex);
                      const isToday = currentDate.toDateString() === new Date().toDateString();
                      const isSunday = currentDate.getDay() === 0;
                      return (
                        <div key={dayIndex} style={{ minWidth: '30px', padding: '0.5rem 0.25rem', background: isToday ? '#10B98120' : '#141414', borderRight: '1px solid #1F1F1F', borderLeft: isSunday && dayIndex > 0 ? '1px solid #2D2D2D' : 'none', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: isToday ? 700 : 500, color: isToday ? '#10B981' : '#71717A' }}>{currentDate.getDate()}</div>
                          {isToday && <div style={{ fontSize: '0.5625rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginTop: '0.125rem' }}>TODAY</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', maxHeight: '600px', overflowY: 'auto' }}>
                <div style={{ width: '280px' }}>
                  {filteredTasks.filter(t => t.start_date && t.due_date).map((task, index) => (
                    <div key={task.id} style={{ padding: '0.875rem 1rem', background: index % 2 === 0 ? '#1A1A1A' : '#0D0D0D', borderBottom: '1px solid #1F1F1F', display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '52px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: task.status === 'done' ? '#10B981' : TASK_STATUSES.find(s => s.value === task.status)?.color || '#71717A', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.875rem', color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                    </div>
                  ))}
                  {filteredTasks.filter(t => t.start_date && t.due_date).length === 0 && (
                    <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#71717A', fontSize: '0.875rem' }}>No tasks with dates</div>
                  )}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  {filteredTasks.filter(t => t.start_date && t.due_date).map((task, index) => {
                    const taskStart = new Date(task.start_date!);
                    const taskEnd = new Date(task.due_date!);
                    const dayWidth = 30;
                    const daysSinceStart = Math.floor((taskStart.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const startOffset = Math.max(0, daysSinceStart * dayWidth);
                    const widthInDays = taskDuration * dayWidth;
                    const isCompleted = task.status === 'done';
                    const barColor = isCompleted ? '#10B981' : TASK_STATUSES.find(s => s.value === task.status)?.color || '#71717A';
                    return (
                      <div key={task.id} style={{ position: 'relative', background: index % 2 === 0 ? '#1A1A1A' : '#0D0D0D', borderBottom: '1px solid #1F1F1F', minHeight: '52px' }}>
                        <div onClick={() => setSelectedTask(task)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: `${startOffset}px`, width: `${widthInDays}px`, height: '24px', background: barColor, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', padding: '0 0.5rem', gap: '0.375rem', boxShadow: isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.3)' : `0 2px 8px ${barColor}40` }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.03)'; e.currentTarget.style.boxShadow = `0 4px 16px ${barColor}60`; e.currentTarget.style.zIndex = '10'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.boxShadow = isCompleted ? '0 2px 8px rgba(16, 185, 129, 0.3)' : `0 2px 8px ${barColor}40`; e.currentTarget.style.zIndex = '1'; }}>
                          {task.assignees && task.assignees.length > 0 && (<div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid ' + barColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 600, color: barColor, flexShrink: 0 }}>{task.assignees[0].name.charAt(0)}</div>)}
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : selectedView === 'list' ? (
            // List View - Grouped by Month, then by Status within each month
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(tasksByMonth).sort(([monthA], [monthB]) => {
                // Sort: Latest months first, then No Due Date last
                if (monthA === 'No Due Date') return 1;
                if (monthB === 'No Due Date') return -1;
                return new Date(monthB).getTime() - new Date(monthA).getTime();
              }).map(([month, monthTasks], monthIndex) => {
                const isMonthExpanded = expandedMonths.includes(month);
                
                // Status breakdown for this month
                const statusCounts = TASK_STATUSES.map(status => ({
                  ...status,
                  count: monthTasks.filter(t => t.status === status.value).length
                })).filter(s => s.count > 0);
                
                return (
                  <div key={month} style={{ background: '#1A1A1A', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #2D2D2D' }}>
                    {/* Month Header */}
                    <div 
                      onClick={() => {
                        if (isMonthExpanded) {
                          setExpandedMonths(expandedMonths.filter(m => m !== month));
                        } else {
                          setExpandedMonths([...expandedMonths, month]);
                        }
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '1rem 1.25rem', 
                        cursor: 'pointer',
                        borderBottom: isMonthExpanded ? '1px solid #2D2D2D' : 'none',
                        background: '#141414'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg style={{ width: '18px', height: '18px', color: '#71717A', transform: isMonthExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <CalIcon style={{ width: '20px', height: '20px', color: '#3B82F6' }} />
                        <span style={{ color: '#FFFFFF', fontSize: '1rem', fontWeight: 600 }}>{month}</span>
                        <span style={{ 
                          padding: '0.25rem 0.625rem', 
                          background: '#2D2D2D', 
                          borderRadius: '0.375rem', 
                          fontSize: '0.75rem', 
                          color: '#A1A1AA', 
                          fontWeight: 600 
                        }}>
                          {monthTasks.length} {monthTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      
                      {/* Status breakdown badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {statusCounts.map(status => (
                          <div key={status.value} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color }} />
                            <span style={{ fontSize: '0.8125rem', color: '#A1A1AA', fontWeight: 500 }}>
                              {status.count} {status.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expanded Month Content - Status Groups */}
                    {isMonthExpanded && (
                      <div style={{ padding: '0' }}>
                        {TASK_STATUSES.map((status) => {
                          const statusTasks = monthTasks.filter(t => t.status === status.value);
                          if (statusTasks.length === 0) return null;
                          
                          const statusKey = `${month}-${status.value}`;
                          const isStatusExpanded = expandedMonths.includes(statusKey);
                          
                          return (
                            <div key={status.value} style={{ borderBottom: '1px solid #2D2D2D' }}>
                              {/* Status Sub-Header */}
                              <div 
                                onClick={() => {
                                  if (isStatusExpanded) {
                                    setExpandedMonths(expandedMonths.filter(m => m !== statusKey));
                                  } else {
                                    setExpandedMonths([...expandedMonths, statusKey]);
                                  }
                                }}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  padding: '0.75rem 1.25rem 0.75rem 2.5rem', 
                                  cursor: 'pointer',
                                  background: '#0D0D0D'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                  <svg style={{ width: '14px', height: '14px', color: '#52525B', transform: isStatusExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span style={{ color: status.color, fontSize: '0.875rem', fontWeight: 600 }}>{status.label}</span>
                                  <span style={{ 
                                    padding: '0.125rem 0.5rem', 
                                    background: `${status.color}20`, 
                                    borderRadius: '0.375rem', 
                                    fontSize: '0.6875rem', 
                                    color: status.color, 
                                    fontWeight: 600 
                                  }}>
                                    {statusTasks.length}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowCreateTask(true); }}
                                  style={{ 
                                    width: '22px', 
                                    height: '22px', 
                                    background: 'transparent', 
                                    border: 'none', 
                                    color: '#52525B', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    borderRadius: '0.25rem',
                                    transition: 'all 0.2s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = '#2D2D2D'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <PlusIcon style={{ width: '14px', height: '14px' }} />
                                </button>
                              </div>

                              {/* Status Tasks Table */}
                              {isStatusExpanded && (
                                <>
                                  {/* Table Header */}
                                  <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '40px 1fr 1.5fr 160px 120px 100px 80px 50px',
                                    padding: '0.625rem 1.25rem 0.625rem 2.5rem',
                                    background: '#0A0A0A',
                                    borderBottom: '1px solid #1F1F1F',
                                    gap: '0.5rem'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <input type="checkbox" style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: status.color }} />
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Task Name
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Description
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Estimation
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Type
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      People
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Priority
                                    </div>
                                    <div></div>
                                  </div>

                                  {/* Task Rows */}
                                  {statusTasks.map((task) => {
                                    const tags = task.tags_list || (task.tags ? task.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []);
                                    const taskType = tags.length > 0 ? tags[0] : 'General';
                                    const typeColor = taskType.toLowerCase().includes('dashboard') ? '#3B82F6' : 
                                                     taskType.toLowerCase().includes('mobile') ? '#8B5CF6' : 
                                                     taskType.toLowerCase().includes('api') ? '#EC4899' : '#71717A';
                                    
                                    return (
                                      <div 
                                        key={task.id}
                                        onClick={() => setSelectedTask(task)}
                                        style={{ 
                                          display: 'grid', 
                                          gridTemplateColumns: '40px 1fr 1.5fr 160px 120px 100px 80px 50px',
                                          padding: '0.75rem 1.25rem 0.75rem 2.5rem',
                                          borderBottom: '1px solid #1F1F1F',
                                          cursor: 'pointer',
                                          transition: 'background 0.15s',
                                          gap: '0.5rem',
                                          alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                      >
                                        {/* Checkbox */}
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <input 
                                            type="checkbox" 
                                            style={{ width: '14px', height: '14px', cursor: 'pointer', accentColor: status.color }} 
                                            onClick={(e) => e.stopPropagation()} 
                                          />
                                        </div>

                                        {/* Task Name */}
                                        <div style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {task.name}
                                        </div>

                                        {/* Description */}
                                        <div style={{ color: '#71717A', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {task.description || '-'}
                                        </div>

                                        {/* Estimation */}
                                        <div style={{ color: '#A1A1AA', fontSize: '0.8125rem' }}>
                                          {task.start_date && task.due_date ? (
                                            `${new Date(task.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                          ) : task.due_date ? (
                                            new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                          ) : (
                                            '-'
                                          )}
                                        </div>

                                        {/* Type */}
                                        <div>
                                          <span style={{ 
                                            padding: '0.1875rem 0.5rem', 
                                            borderRadius: '0.25rem', 
                                            fontSize: '0.6875rem', 
                                            fontWeight: 500,
                                            backgroundColor: `${typeColor}20`,
                                            color: typeColor,
                                            border: `1px solid ${typeColor}40`
                                          }}>
                                            {taskType}
                                          </span>
                                        </div>

                                        {/* People */}
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                          {task.assignees && task.assignees.length > 0 ? (
                                            <div style={{ display: 'flex' }}>
                                              {task.assignees.slice(0, 3).map((assignee, i) => (
                                                <div 
                                                  key={assignee.id}
                                                  style={{ 
                                                    width: '24px', 
                                                    height: '24px', 
                                                    borderRadius: '50%', 
                                                    border: '2px solid #0D0D0D', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: '0.625rem', 
                                                    fontWeight: 600, 
                                                    color: '#FFFFFF', 
                                                    backgroundColor: ['#3B82F6', '#EC4899', '#8B5CF6'][i % 3], 
                                                    marginLeft: i > 0 ? '-6px' : '0',
                                                    position: 'relative',
                                                    zIndex: 3 - i
                                                  }}
                                                  title={assignee.name}
                                                >
                                                  {assignee.name.charAt(0).toUpperCase()}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <span style={{ color: '#52525B', fontSize: '0.8125rem' }}>-</span>
                                          )}
                                        </div>

                                        {/* Priority */}
                                        <div>
                                          <span style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 500,
                                            color: task.priority === 'high' ? '#EF4444' : 
                                                   task.priority === 'medium' ? '#F59E0B' : '#22C55E'
                                          }}>
                                            <span style={{ 
                                              width: '6px', 
                                              height: '6px', 
                                              borderRadius: '50%', 
                                              backgroundColor: task.priority === 'high' ? '#EF4444' : 
                                                               task.priority === 'medium' ? '#F59E0B' : '#22C55E'
                                            }} />
                                            {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Low'}
                                          </span>
                                        </div>

                                        {/* Edit & Delete Buttons */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.25rem' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTask(task);
                                            }}
                                            style={{ 
                                              width: '28px', 
                                              height: '28px', 
                                              background: 'transparent', 
                                              border: 'none', 
                                              color: '#52525B', 
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '0.25rem',
                                              transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.background = '#3B82F620'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'transparent'; }}
                                            title="Edit task"
                                          >
                                            <PencilIcon style={{ width: '16px', height: '16px' }} />
                                          </button>
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              if (confirm('Delete this task?')) {
                                                try {
                                                  await taskService.deleteTask(task.id);
                                                  setTasks(tasks.filter(t => t.id !== task.id));
                                                  fetchProject();
                                                } catch (error) {
                                                  alert('Error deleting task');
                                                }
                                              }
                                            }}
                                            style={{ 
                                              width: '28px', 
                                              height: '28px', 
                                              background: 'transparent', 
                                              border: 'none', 
                                              color: '#52525B', 
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '0.25rem',
                                              transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#EF444420'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#52525B'; e.currentTarget.style.background = 'transparent'; }}
                                            title="Delete task"
                                          >
                                            <TrashIcon style={{ width: '16px', height: '16px' }} />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Add Task Button */}
                        <div style={{ padding: '0.75rem 1.25rem 0.75rem 2.5rem', background: '#0D0D0D' }}>
                          <button
                            onClick={() => setShowCreateTask(true)}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem', 
                              color: '#52525B', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              fontSize: '0.8125rem', 
                              fontWeight: 500,
                              transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#52525B'}
                          >
                            <PlusIcon style={{ width: '14px', height: '14px' }} />
                            Add task
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : selectedView === 'kanban' ? (
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
                          style={{ 
                            background: '#1A1A1A', 
                            border: '1px solid #2D2D2D', 
                            borderRadius: '0.75rem', 
                            padding: '1rem', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s', 
                                              position: 'relative',
                            minHeight: '220px',
                            maxHeight: '220px',
                                            display: 'flex',
                            flexDirection: 'column'
                          }}
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
                              
                          {/* Title and Action Buttons */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <h3 style={{ color: '#FFFFFF', fontWeight: 500, fontSize: '0.9375rem', lineHeight: 1.4, margin: 0, flex: 1, fontFamily: 'Mabry Pro, sans-serif' }}>{task.name}</h3>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTask(task);
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'transparent',
                                  border: '1px solid #3B82F6',
                                  borderRadius: '0.375rem',
                                  color: '#3B82F6',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s',
                                  fontFamily: 'Mabry Pro, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#3B82F6';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#3B82F6';
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this task?')) {
                                    try {
                                      await taskService.deleteTask(task.id);
                                      setTasks(tasks.filter(t => t.id !== task.id));
                                      fetchProject();
                                    } catch (error) {
                                      alert('Error deleting task');
                                    }
                                  }
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'transparent',
                                  border: '1px solid #EF4444',
                                  borderRadius: '0.375rem',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s',
                                  fontFamily: 'Mabry Pro, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#EF4444';
                                  e.currentTarget.style.color = '#FFFFFF';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#EF4444';
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
            
                          {/* Description */}
                          {task.description && (
                            <p style={{ color: '#71717A', fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: '0 0 auto' }}>{task.description}</p>
                          )}

                          {/* Spacer to push footer to bottom */}
                          <div style={{ flex: 1 }} />

                          {/* Progress */}
                          <div style={{ marginBottom: '1rem', flex: '0 0 auto' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #2D2D2D', flex: '0 0 auto' }}>
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

                    {/* Add New Task Button */}
                    <button
                      onClick={() => {
                        setNewTaskColumn(status.value);
                        setShowCreateTask(true);
                      }}
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'transparent',
                        border: '1px dashed #2D2D2D',
                        borderRadius: '0.5rem',
                        color: '#71717A',
                  cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginTop: '0.5rem'
                }}
                onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#1A1A1A';
                        e.currentTarget.style.borderColor = '#3D3D3D';
                        e.currentTarget.style.color = '#FFFFFF';
                }}
                onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#2D2D2D';
                        e.currentTarget.style.color = '#71717A';
                      }}
                    >
                      <PlusIcon style={{ width: '16px', height: '16px' }} />
                      Add New Task
                    </button>
                </div>
                </div>
              );
            })}
            </div>
          ) : (
            // Growth Map View - Team Member Focus
            <div style={{ display: 'flex', gap: '1.5rem', height: '100%', padding: '0.5rem' }}>
              {/* Left Panel - Project Info & Team Groups */}
              <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Project Card */}
                <div style={{ background: 'linear-gradient(135deg, #1F1F1F 0%, #141414 100%)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #2D2D2D' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderIcon style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 600, margin: 0 }}>{project.name}</h3>
                      <p style={{ color: '#71717A', fontSize: '0.6875rem', margin: '0.25rem 0 0' }}>Project tasks overview</p>
                    </div>
                  </div>
                  
                  <p style={{ color: '#52525B', fontSize: '0.625rem', marginBottom: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>Team members</p>
                  <div style={{ display: 'flex', gap: '0.375rem' }}>
                    {project.members?.slice(0, 4).map((member, i) => (
                      <div key={member.id} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'][i % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: '0.6875rem', fontWeight: 600, border: '2px solid #141414' }}>
                        {member.name.charAt(0)}
                      </div>
                    ))}
                    {project.members && project.members.length > 4 && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A1A1AA', fontSize: '0.5625rem', fontWeight: 600, border: '2px solid #141414' }}>
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* In Progress Section */}
                {(() => {
                  const monthStart = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth(), 1);
                  const monthEnd = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0);
                  const isTaskInMonth = (t: Task) => {
                    const due = t.due_date ? new Date(t.due_date) : null;
                    const start = t.start_date ? new Date(t.start_date) : null;
                    if (due && due >= monthStart && due <= monthEnd) return true;
                    if (start && start >= monthStart && start <= monthEnd) return true;
                    if (start && due && start <= monthEnd && due >= monthStart) return true;
                    return false;
                  };
                  const monthInProgress = tasks.filter(t => t.status === 'in_progress' && isTaskInMonth(t));
                  const monthCompleted = tasks.filter(t => t.status === 'done' && isTaskInMonth(t));
                  const monthTodo = tasks.filter(t => t.status === 'todo' && isTaskInMonth(t));
                  
                  return (
                    <>
                      <div style={{ background: '#141414', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid #2D2D2D' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: monthInProgress.length > 0 ? '0.625rem' : 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
                            <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 500 }}>In Progress</span>
                          </div>
                          <span style={{ color: '#3B82F6', fontSize: '0.75rem', fontWeight: 600 }}>{monthInProgress.length}</span>
                        </div>
                        {monthInProgress.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            {monthInProgress.slice(0, 2).map(task => (
                              <div key={task.id} onClick={() => setSelectedTask(task)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem', borderRadius: '0.375rem', cursor: 'pointer', background: '#1A1A1A', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#252525'} onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '0.375rem', background: '#2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', color: '#A1A1AA' }}>{task.name.charAt(0)}</div>
                                <span style={{ color: '#A1A1AA', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Completed Section */}
                      <div style={{ background: '#141414', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid #2D2D2D' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                            <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 500 }}>Completed</span>
                          </div>
                          <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>{monthCompleted.length}</span>
                        </div>
                      </div>

                      {/* To Do Section */}
                      <div style={{ background: '#141414', borderRadius: '0.75rem', padding: '0.875rem', border: '1px solid #2D2D2D' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                            <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 500 }}>To Do</span>
                          </div>
                          <span style={{ color: '#EF4444', fontSize: '0.75rem', fontWeight: 600 }}>{monthTodo.length}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Main Growth Map Timeline */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h2 style={{ color: '#FFFFFF', fontSize: '1.375rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>My growth map</h2>
                    <p style={{ color: '#52525B', fontSize: '0.8125rem', margin: '0.25rem 0 0' }}>Track your team progress for the month</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      onClick={() => {
                        const d = new Date(ganttStartDate);
                        d.setMonth(d.getMonth() - 1);
                        setGanttStartDate(d);
                      }}
                      style={{ width: '36px', height: '36px', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#71717A'; }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1rem', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem' }}>
                      <CalIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500 }}>
                        {ganttStartDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        const d = new Date(ganttStartDate);
                        d.setMonth(d.getMonth() + 1);
                        setGanttStartDate(d);
                      }}
                      style={{ width: '36px', height: '36px', background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#71717A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1A1A'; e.currentTarget.style.color = '#71717A'; }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>

                {/* Timeline Container */}
                <div style={{ flex: 1, background: '#141414', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #1F1F1F', overflow: 'hidden' }}>
                  {/* Week Headers */}
                  <div style={{ display: 'flex', marginBottom: '1.25rem', paddingLeft: '180px' }}>
                    {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((week, i) => {
                      const today = new Date();
                      const weekOfMonth = Math.ceil(today.getDate() / 7);
                      const isCurrentWeek = i + 1 === weekOfMonth && ganttStartDate.getMonth() === today.getMonth() && ganttStartDate.getFullYear() === today.getFullYear();
                      
                      return (
                        <div key={week} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                          <span style={{ color: isCurrentWeek ? '#10B981' : '#52525B', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{week}</span>
                          {isCurrentWeek && (
                            <div style={{ position: 'absolute', top: '1.75rem', left: '50%', transform: 'translateX(-50%)', width: '2px', height: 'calc(100vh - 380px)', background: 'linear-gradient(180deg, #EF4444 0%, transparent 100%)', zIndex: 10 }}>
                              <div style={{ position: 'absolute', top: '-0.625rem', left: '50%', transform: 'translateX(-50%)', padding: '0.25rem 0.5rem', background: '#10B981', borderRadius: '0.25rem', color: '#FFF', fontSize: '0.5625rem', fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Team Member Rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {project.members?.map((member, memberIdx) => {
                      const memberColors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
                      const memberColor = memberColors[memberIdx % memberColors.length];
                      const barColors = ['#86EFAC', '#FDE047', '#FDA4AF', '#A5B4FC', '#F9A8D4', '#93C5FD', '#FCA5A5', '#A7F3D0'];
                      
                      // Get month boundaries
                      const monthStart = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth(), 1);
                      const monthEnd = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0);
                      
                      // Filter tasks for this member that fall within the selected month
                      const memberTasks = tasks.filter(t => {
                        if (!t.assignees?.some(a => a.id === member.id)) return false;
                        
                        const taskDue = t.due_date ? new Date(t.due_date) : null;
                        const taskStart = t.start_date ? new Date(t.start_date) : null;
                        
                        // Check if task falls within month (has due date or start date in this month)
                        if (taskDue) {
                          const dueInMonth = taskDue >= monthStart && taskDue <= monthEnd;
                          if (dueInMonth) return true;
                        }
                        if (taskStart) {
                          const startInMonth = taskStart >= monthStart && taskStart <= monthEnd;
                          if (startInMonth) return true;
                        }
                        // Also include tasks that span across the month
                        if (taskStart && taskDue) {
                          const spansMonth = taskStart <= monthEnd && taskDue >= monthStart;
                          if (spansMonth) return true;
                        }
                        return false;
                      });
                      
                      // Count total tasks for this member (regardless of month)
                      const totalMemberTasks = tasks.filter(t => t.assignees?.some(a => a.id === member.id)).length;
                      
                      return (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'flex-start', minHeight: '48px', paddingBottom: '0.5rem', borderBottom: memberIdx < (project.members?.length || 0) - 1 ? '1px solid #1F1F1F' : 'none' }}>
                          {/* Member info */}
                          <div style={{ width: '180px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1rem', paddingTop: '0.25rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 0 2px ${memberColor}30` }}>
                              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FFFFFF' }}>{member.name.charAt(0)}</span>
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.name.length > 14 ? member.name.substring(0, 14) + '...' : member.name}
                              </span>
                              <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{memberTasks.length} this month</span>
                            </div>
                          </div>
                          
                          {/* Timeline bars for member's tasks */}
                          <div style={{ flex: 1, position: 'relative', minHeight: '44px', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingTop: '0.25rem' }}>
                            {memberTasks.slice(0, 3).map((task, taskIdx) => {
                              const taskDueDate = task.due_date ? new Date(task.due_date) : null;
                              const taskStartDate = task.start_date ? new Date(task.start_date) : null;
                              
                              let startPos = (taskIdx * 15) + 5;
                              let width = 25 + (taskIdx % 2) * 15;
                              
                              const totalDays = monthEnd.getDate();
                              
                              if (taskStartDate || taskDueDate) {
                                // Calculate start position
                                let effectiveStart = 1;
                                if (taskStartDate) {
                                  if (taskStartDate < monthStart) {
                                    effectiveStart = 1;
                                  } else {
                                    effectiveStart = taskStartDate.getDate();
                                  }
                                } else if (taskDueDate) {
                                  effectiveStart = Math.max(1, taskDueDate.getDate() - 7); // Default 7 day duration
                                }
                                
                                // Calculate end position
                                let effectiveEnd = totalDays;
                                if (taskDueDate) {
                                  if (taskDueDate > monthEnd) {
                                    effectiveEnd = totalDays;
                                  } else {
                                    effectiveEnd = taskDueDate.getDate();
                                  }
                                } else if (taskStartDate) {
                                  effectiveEnd = Math.min(totalDays, taskStartDate.getDate() + 7);
                                }
                                
                                startPos = ((effectiveStart - 1) / totalDays) * 100;
                                width = Math.max(10, ((effectiveEnd - effectiveStart + 1) / totalDays) * 100);
                              }
                              
                              const barColor = barColors[taskIdx % barColors.length];
                              
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => setSelectedTask(task)}
                                  style={{ 
                                    position: 'relative',
                                    left: `${startPos}%`,
                                    width: `${Math.min(width, 100 - startPos)}%`,
                                    height: '28px',
                                    backgroundColor: barColor,
                                    borderRadius: '0.375rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    paddingLeft: '0.625rem',
                                    paddingRight: '0.5rem',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    transition: 'transform 0.15s, box-shadow 0.15s'
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; }}
                                >
                                  <span style={{ color: '#000', fontSize: '0.6875rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                                    {task.name}
                                  </span>
                                  {(task.priority === 'high' || task.priority === 'urgent') && (
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '0.375rem' }}>
                                      <span style={{ fontSize: '0.5rem', color: '#FFF', fontWeight: 700 }}>!</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            {memberTasks.length === 0 && (
                              <div style={{ height: '28px', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#3D3D3D', fontSize: '0.6875rem', fontStyle: 'italic' }}>No tasks this month</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Panel - Overview & Reminders */}
              <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Overview Card */}
                <div style={{ background: 'linear-gradient(135deg, #1F1F1F 0%, #141414 100%)', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #2D2D2D' }}>
                  <h4 style={{ color: '#52525B', fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.375rem' }}>Overview</h4>
                  <p style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem' }}>{project.name}</p>
                  
                  {/* Progress Ring */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                      <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1F1F1F" strokeWidth="10" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#10B981" strokeWidth="10" 
                          strokeDasharray={`${(tasks.filter(t => t.status === 'done').length / Math.max(tasks.length, 1)) * 251.2} 251.2`} 
                          strokeLinecap="round" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#F59E0B" strokeWidth="10" 
                          strokeDasharray={`${(tasks.filter(t => t.status === 'in_progress').length / Math.max(tasks.length, 1)) * 251.2} 251.2`}
                          strokeDashoffset={`${-(tasks.filter(t => t.status === 'done').length / Math.max(tasks.length, 1)) * 251.2}`}
                          strokeLinecap="round" />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: 700 }}>
                          {Math.round((tasks.filter(t => t.status === 'done').length / Math.max(tasks.length, 1)) * 100)}%
                        </span>
                        <span style={{ color: '#52525B', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Complete</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.6875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ color: '#71717A' }}>Done</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                      <span style={{ color: '#71717A' }}>Active</span>
                    </div>
                  </div>
                </div>

                {/* Reminder Card */}
                <div style={{ background: '#141414', borderRadius: '1rem', padding: '1.25rem', border: '1px solid #2D2D2D', flex: 1 }}>
                  <h4 style={{ color: '#52525B', fontSize: '0.625rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Reminder</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {tasks.filter(t => t.status !== 'done' && t.due_date).slice(0, 4).map((task, i) => {
                      const taskColors = ['#86EFAC', '#FDE047', '#FDA4AF', '#A5B4FC'];
                      return (
                        <div key={task.id} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer', padding: '0.625rem', borderRadius: '0.5rem', background: '#1A1A1A', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#252525'} onMouseLeave={(e) => e.currentTarget.style.background = '#1A1A1A'}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '0.375rem', background: taskColors[i % taskColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6875rem', fontWeight: 600, color: '#000' }}>{task.name.charAt(0)}</div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <p style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</p>
                              <p style={{ color: '#3B82F6', fontSize: '0.6875rem', margin: '0.125rem 0 0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
                                <svg style={{ width: '10px', height: '10px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Modal */}
      {showProjectMembers && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowProjectMembers(false)}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '32rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Team Members</h2>
                <p style={{ fontSize: '0.8125rem', color: '#71717A', margin: '0.25rem 0 0' }}>{project.members?.length || 0} members in this project</p>
              </div>
              <button
                onClick={() => setShowProjectMembers(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            {/* Members List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.members?.map((member, i) => {
                  const memberTasks = tasks.filter(t => t.assignees?.some(a => a.id === member.id));
                  const completedTasks = memberTasks.filter(t => t.status === 'done').length;
                  const isEditing = editingMemberId === member.id;
                  const roleOptions = ['Admin', 'Manager', 'Member', 'Developer', 'Designer', 'QA', 'Viewer'];
                  
                  return (
                    <div 
                      key={member.id}
                      style={{ 
                        padding: '1rem',
                        background: isEditing ? '#1F1F1F' : '#141414',
                        borderRadius: '0.75rem',
                        border: isEditing ? '1px solid #3B82F6' : '1px solid #2D2D2D',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Avatar */}
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          backgroundColor: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontSize: '1.125rem',
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {member.name.charAt(0)}
                        </div>
                        
                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#FFFFFF', fontSize: '0.9375rem', fontWeight: 500 }}>{member.name}</span>
                            {!isEditing && (
                              <span style={{ 
                                padding: '0.125rem 0.5rem', 
                                background: member.role === 'admin' || member.role === 'Admin' ? '#3B82F620' : 
                                           member.role === 'Manager' ? '#8B5CF620' : '#71717A20', 
                                borderRadius: '0.25rem', 
                                fontSize: '0.6875rem', 
                                color: member.role === 'admin' || member.role === 'Admin' ? '#3B82F6' : 
                                       member.role === 'Manager' ? '#8B5CF6' : '#71717A',
                                fontWeight: 500,
                                textTransform: 'capitalize'
                              }}>
                                {member.role || 'Member'}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#71717A', fontSize: '0.8125rem' }}>{member.email}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                            <span style={{ color: '#A1A1AA' }}>{memberTasks.length} tasks</span>
                            <span style={{ color: '#10B981' }}>{completedTasks} done</span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        {!isEditing && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingMemberId(member.id);
                                setEditingMemberRole(member.role || 'Member');
                              }}
                              style={{ 
                                padding: '0.5rem 0.875rem', 
                                background: '#2D2D2D', 
                                border: 'none', 
                                borderRadius: '0.5rem', 
                                color: '#A1A1AA', 
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                            >
                              <PencilIcon style={{ width: '14px', height: '14px' }} />
                              Edit
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Edit Mode - Role Selection */}
                      {isEditing && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2D2D2D' }}>
                          <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Select Role
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {roleOptions.map(role => (
                              <button
                                key={role}
                                onClick={() => setEditingMemberRole(role)}
                                style={{
                                  padding: '0.5rem 0.875rem',
                                  background: editingMemberRole === role ? '#3B82F6' : '#2D2D2D',
                                  border: editingMemberRole === role ? '1px solid #3B82F6' : '1px solid #3D3D3D',
                                  borderRadius: '0.5rem',
                                  color: editingMemberRole === role ? '#FFFFFF' : '#A1A1AA',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { if (editingMemberRole !== role) { e.currentTarget.style.background = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}}
                                onMouseLeave={(e) => { if (editingMemberRole !== role) { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}}
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingMemberId(null);
                                setEditingMemberRole('');
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                background: 'transparent',
                                border: '1px solid #3D3D3D',
                                borderRadius: '0.5rem',
                                color: '#A1A1AA',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#71717A'; e.currentTarget.style.color = '#FFFFFF'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3D3D3D'; e.currentTarget.style.color = '#A1A1AA'; }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  // Update member role via API
                                  const { error } = await supabase
                                    .from('project_members')
                                    .update({ role: editingMemberRole })
                                    .eq('project_id', project.id)
                                    .eq('user_id', member.id);
                                  
                                  if (error) throw error;
                                  
                                  // Update local state
                                  setProject(prev => {
                                    if (!prev) return prev;
                                    return {
                                      ...prev,
                                      members: prev.members?.map(m => 
                                        m.id === member.id ? { ...m, role: editingMemberRole } : m
                                      )
                                    };
                                  });
                                  
                                  setEditingMemberId(null);
                                  setEditingMemberRole('');
                                } catch (err) {
                                  console.error('Error updating role:', err);
                                  alert('Failed to update role. Please try again.');
                                }
                              }}
                              style={{
                                padding: '0.5rem 1.25rem',
                                background: '#10B981',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: '#FFFFFF',
                                fontSize: '0.8125rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                            >
                              Save Role
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #2D2D2D', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.625rem 1rem', 
                  background: 'transparent', 
                  border: '1px solid #3B82F6', 
                  borderRadius: '0.5rem', 
                  color: '#3B82F6', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#3B82F6'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3B82F6'; }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                Add Member
              </button>
              <button
                onClick={() => setShowProjectMembers(false)}
                style={{ 
                  padding: '0.625rem 1.25rem', 
                  background: '#2D2D2D', 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  color: '#FFFFFF', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#3D3D3D'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2D2D2D'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Add Column Modal */}
      {showAddColumnModal && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '1rem' }}
          onClick={() => setShowAddColumnModal(false)}
        >
          <div 
            style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '32rem', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Add Custom Column</h3>
              <button
                onClick={() => setShowAddColumnModal(false)}
                style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', background: 'transparent', border: 'none', color: '#71717A', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
                </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Column Name</label>
                      <input
                    type="text"
                    value={newColumn.name}
                    onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                    placeholder="e.g., Budget, Phase, Designer"
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none' }}
                      />
                    </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Column Type</label>
                  <select
                    value={newColumn.type}
                    onChange={(e) => setNewColumn({ ...newColumn, type: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="status">Status</option>
                    <option value="person">Person</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="url">URL</option>
                  </select>
              </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#A1A1AA', marginBottom: '0.5rem' }}>Column Width (px)</label>
                <input
                    type="number"
                    value={newColumn.width}
                    onChange={(e) => setNewColumn({ ...newColumn, width: parseInt(e.target.value) || 150 })}
                    min="100"
                    max="400"
                    style={{ width: '100%', padding: '0.75rem 1rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none' }}
                />
              </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                  onClick={() => setShowAddColumnModal(false)}
                  style={{ flex: 1, padding: '0.75rem', background: '#2D2D2D', color: '#A1A1AA', border: 'none', borderRadius: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Cancel
              </button>
              <button
                  onClick={async () => {
                    if (!newColumn.name.trim()) return;
                    try {
                      const { supabase } = await import('@/lib/supabase');
                      await supabase.rpc('add_project_custom_column', {
                        p_project_id: project.id,
                        p_column_name: newColumn.name.trim(),
                        p_column_type: newColumn.type,
                        p_column_width: newColumn.width
                      });
                      setNewColumn({ name: '', type: 'text', width: 150 });
                      setShowAddColumnModal(false);
                      fetchProject();
                    } catch (error) {
                      // Error adding column
                    }
                  }}
                  style={{ flex: 1, padding: '0.75rem', background: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Add Column
              </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
