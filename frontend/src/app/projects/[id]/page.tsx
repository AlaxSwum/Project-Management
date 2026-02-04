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
  report_to_ids?: number[];
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
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({ name: '', description: '', priority: '', status: '', due_date: '' });
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
  const [customRoleInput, setCustomRoleInput] = useState<string>('');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newMemberRole, setNewMemberRole] = useState<string>('Member');
  const [ganttViewMode, setGanttViewMode] = useState<'week' | 'month'>('month');
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
    
    const oldStatus = draggedTask.status;
    
    try {
      await taskService.updateTask(draggedTask.id, { status: newStatus });
      setTasks(tasks.map(t => t.id === draggedTask.id ? { ...t, status: newStatus } : t));
      
      // Send notification for status change
      if (user?.id && draggedTask) {
        const { supabase } = await import('@/lib/supabase');
        
        // Get task details to find who to notify
        const { data: taskData } = await supabase
          .from('projects_task')
          .select('assignee_ids, report_to_ids, name, project_id')
          .eq('id', draggedTask.id)
          .single();
        
        if (taskData) {
          const notifyUserIds = new Set<number>();
          
          // Add assignees
          if (taskData.assignee_ids && Array.isArray(taskData.assignee_ids)) {
            taskData.assignee_ids.forEach((id: number) => {
              if (id !== user.id) notifyUserIds.add(id);
            });
          }
          
          // Add report_to users
          if (taskData.report_to_ids && Array.isArray(taskData.report_to_ids)) {
            taskData.report_to_ids.forEach((id: number) => {
              if (id !== user.id) notifyUserIds.add(id);
            });
          }
          
          // Create notifications
          const statusMessages: Record<string, string> = {
            'backlog': 'moved to backlog',
            'in_progress': 'started working on',
            'done': 'completed',
            'archived': 'archived'
          };
          const action = statusMessages[newStatus] || `changed status to ${newStatus}`;
          
          const notifications = Array.from(notifyUserIds).map(recipientId => ({
            task_id: draggedTask.id,
            project_id: taskData.project_id,
            recipient_id: recipientId,
            sender_id: user.id,
            notification_type: 'status_changed',
            message: `${user?.name || 'Someone'} ${action} task: ${taskData.name}`,
            task_name: taskData.name,
            task_status: newStatus,
            old_status: oldStatus,
            new_status: newStatus,
          }));
          
          if (notifications.length > 0) {
            await supabase.from('task_notifications').insert(notifications);
          }
        }
      }
    } catch (err) {
      console.error('Error updating task:', err);
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
          supabase.from('task_comments').select(`
            id,
            task_id,
            user_id,
            comment,
            created_at,
            auth_user!task_comments_user_id_fkey(name)
          `).eq('task_id', selectedTask.id).order('created_at', { ascending: false })
        ]);
        
        setSubtasks(subtasksRes.data || []);
        setActivityLog(activityRes.data || []);
        setAttachments(attachmentsRes.data || []);
        
        // Transform comments to include user_name
        const transformedComments = (commentsRes.data || []).map((c: any) => ({
          ...c,
          user_name: c.auth_user?.name || 'User',
          comment_text: c.comment
        }));
        setComments(transformedComments);
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

  // Create notification for task updates
  const createNotification = async (taskId: number, type: string, message: string, oldStatus?: string, newStatus?: string) => {
    if (!user?.id || !selectedTask) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // Get all users who should be notified (assignees + report_to)
      const notifyUserIds = new Set<number>();
      
      // Add assignees
      (selectedTask.assignees || []).forEach((assignee: any) => {
        if (assignee.id !== user.id) notifyUserIds.add(assignee.id);
      });
      
      // Add report_to users
      if (selectedTask.report_to_ids && Array.isArray(selectedTask.report_to_ids)) {
        selectedTask.report_to_ids.forEach((id: number) => {
          if (id !== user.id) notifyUserIds.add(id);
        });
      }
      
      // Create notifications for each user
      const notifications = Array.from(notifyUserIds).map(recipientId => ({
        task_id: taskId,
        project_id: selectedTask.project_id,
        recipient_id: recipientId,
        sender_id: user.id,
        notification_type: type,
        message: message,
        task_name: selectedTask.name,
        task_status: newStatus || selectedTask.status,
        old_status: oldStatus,
        new_status: newStatus,
      }));
      
      if (notifications.length > 0) {
        await supabase.from('task_notifications').insert(notifications);
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: selectedTask.id,
          user_id: user?.id,
          comment: newComment.trim()
        })
        .select()
        .single();
      
      if (!error && data) {
        setComments([{ ...data, user_name: user?.name || 'User' }, ...comments]);
        setNewComment('');
        
        // Send notification
        await createNotification(
          selectedTask.id,
          'comment_added',
          `${user?.name || 'Someone'} commented on task: ${selectedTask.name}`
        );
      } else {
        console.error('Comment error:', error);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const saveTaskEdit = async () => {
    if (!selectedTask || !editTaskForm.name.trim()) return;
    
    const oldStatus = selectedTask.status;
    const newStatus = editTaskForm.status;
    
    try {
      await taskService.updateTask(selectedTask.id, {
        name: editTaskForm.name.trim(),
        description: editTaskForm.description.trim(),
        priority: editTaskForm.priority,
        status: editTaskForm.status,
        due_date: editTaskForm.due_date || null
      });
      
      // Update local state
      setTasks(tasks.map(t => t.id === selectedTask.id ? {
        ...t,
        name: editTaskForm.name.trim(),
        description: editTaskForm.description.trim(),
        priority: editTaskForm.priority,
        status: editTaskForm.status,
        due_date: editTaskForm.due_date || null
      } : t));
      
      setSelectedTask({
        ...selectedTask,
        name: editTaskForm.name.trim(),
        description: editTaskForm.description.trim(),
        priority: editTaskForm.priority,
        status: editTaskForm.status,
        due_date: editTaskForm.due_date || null
      });
      
      // Send notification if status changed
      if (oldStatus !== newStatus) {
        const statusMessages: Record<string, string> = {
          'backlog': 'moved to backlog',
          'in_progress': 'started working on',
          'done': 'completed',
          'archived': 'archived'
        };
        const action = statusMessages[newStatus] || `changed status to ${newStatus}`;
        await createNotification(
          selectedTask.id,
          'status_changed',
          `${user?.name || 'Someone'} ${action} task: ${selectedTask.name}`,
          oldStatus,
          newStatus
        );
      }
      
      setIsEditingTask(false);
    } catch (error) {
      alert('Error updating task');
    }
  };

  const startEditingTask = () => {
    if (!selectedTask) return;
    setEditTaskForm({
      name: selectedTask.name || '',
      description: selectedTask.description || '',
      priority: selectedTask.priority || 'low',
      status: selectedTask.status || 'todo',
      due_date: selectedTask.due_date ? selectedTask.due_date.split('T')[0] : ''
    });
    setIsEditingTask(true);
  };

  // Fetch available users to add as members
  const fetchAvailableUsers = async () => {
    if (!project) return;
    
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email')
        .order('name');
      
      if (!error && data) {
        // Filter out users who are already members
        const currentMemberIds = project.members?.map(m => m.id) || [];
        const available = data.filter(u => !currentMemberIds.includes(u.id));
        setAvailableUsers(available);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Add member to project
  const addMember = async () => {
    if (!selectedUserId || !project) return;
    
    try {
      const { error } = await supabase
        .from('project_members')
        .insert({
          project_id: project.id,
          user_id: selectedUserId,
          role: newMemberRole
        });
      
      if (error) throw error;
      
      // Fetch updated project
      await fetchProject();
      setShowAddMemberModal(false);
      setSelectedUserId(null);
      setNewMemberRole('Member');
    } catch (err) {
      console.error('Error adding member:', err);
      alert('Failed to add member. Please try again.');
    }
  };

  // Remove member from project
  const removeMember = async (userId: number) => {
    if (!project) return;
    
    if (!confirm('Remove this member from the project?')) return;
    
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Update local state
      setProject(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members?.filter(m => m.id !== userId)
        };
      });
    } catch (err) {
      console.error('Error removing member:', err);
      alert('Failed to remove member. Please try again.');
    }
  };

  // Leave project (current user)
  const leaveProject = async () => {
    if (!project || !user) return;
    
    if (!confirm('Are you sure you want to leave this project?')) return;
    
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', project.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Error leaving project:', err);
      alert('Failed to leave project. Please try again.');
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
            // Gantt Chart View - Calendar Style
            <div style={{ display: 'flex', gap: '1rem', height: '100%' }}>
              {/* Main Gantt Area */}
              <div style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Gantt Header */}
              <div style={{ padding: '1rem 1.5rem', background: '#141414', borderBottom: '1px solid #2D2D2D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {/* View Mode Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0D0D0D', padding: '0.25rem', borderRadius: '0.5rem' }}>
                    {(['week', 'month'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setGanttViewMode(mode)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: ganttViewMode === mode ? '#3B82F6' : 'transparent',
                          border: 'none',
                          borderRadius: '0.375rem',
                          color: ganttViewMode === mode ? '#FFFFFF' : '#71717A',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textTransform: 'capitalize'
                        }}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                        const d = new Date(ganttStartDate);
                        if (ganttViewMode === 'week') d.setDate(d.getDate() - 7);
                        else d.setMonth(d.getMonth() - 1);
                        setGanttStartDate(d);
                      }}
                      style={{ width: '36px', height: '36px', background: '#2D2D2D', border: 'none', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button
                    onClick={() => setGanttStartDate(new Date())}
                      style={{ padding: '0.5rem 1rem', background: '#10B981', border: 'none', borderRadius: '0.5rem', color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                        const d = new Date(ganttStartDate);
                        if (ganttViewMode === 'week') d.setDate(d.getDate() + 7);
                        else d.setMonth(d.getMonth() + 1);
                        setGanttStartDate(d);
                      }}
                      style={{ width: '36px', height: '36px', background: '#2D2D2D', border: 'none', borderRadius: '0.5rem', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#3D3D3D'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                    >
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                    <div style={{ padding: '0.5rem 1rem', background: '#2D2D2D', borderRadius: '0.5rem', marginLeft: '0.5rem' }}>
                      <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>
                        {ganttStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                </div>
              </div>

                {/* Gantt Content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {ganttViewMode === 'week' ? (
                    // Week View - Days as rows, hours as columns
                    <div style={{ display: 'flex', minHeight: '100%' }}>
                      {/* Day Labels Column */}
                      <div style={{ width: '100px', flexShrink: 0, background: '#141414', borderRight: '1px solid #2D2D2D' }}>
                        <div style={{ height: '48px', borderBottom: '1px solid #2D2D2D' }} />
                        {Array.from({ length: 7 }, (_, i) => {
                          const date = new Date(ganttStartDate);
                          date.setDate(date.getDate() - date.getDay() + i);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          return (
                            <div key={i} style={{ height: '80px', padding: '0.75rem', borderBottom: '1px solid #2D2D2D', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: isToday ? '#3B82F610' : 'transparent' }}>
                              <span style={{ color: isToday ? '#3B82F6' : '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>{dayNames[i]}</span>
                              <span style={{ color: isToday ? '#3B82F6' : '#71717A', fontSize: '0.75rem' }}>{date.getDate()}/{date.getMonth() + 1}</span>
                  </div>
                          );
                        })}
                </div>
                      
                      {/* Time Grid */}
                      <div style={{ flex: 1, minWidth: '800px' }}>
                        {/* Hour Headers */}
                        <div style={{ display: 'flex', height: '48px', borderBottom: '1px solid #2D2D2D', background: '#141414' }}>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = 7 + i;
                      return (
                              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #2D2D2D' }}>
                                <span style={{ color: '#71717A', fontSize: '0.75rem', fontWeight: 500 }}>{hour}:00</span>
                        </div>
                      );
                    })}
                  </div>
                        
                        {/* Day Rows with Tasks */}
                        {Array.from({ length: 7 }, (_, dayIdx) => {
                          const date = new Date(ganttStartDate);
                          date.setDate(date.getDate() - date.getDay() + dayIdx);
                          const isToday = date.toDateString() === new Date().toDateString();
                          const dayTasks = filteredTasks.filter(t => {
                            if (!t.due_date) return false;
                            const taskDate = new Date(t.due_date);
                            return taskDate.toDateString() === date.toDateString();
                          });
                          
                          const barColors = ['#06B6D4', '#F97316', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444'];
                          
                      return (
                            <div key={dayIdx} style={{ display: 'flex', height: '80px', borderBottom: '1px solid #2D2D2D', position: 'relative', background: isToday ? '#3B82F608' : 'transparent' }}>
                              {Array.from({ length: 12 }, (_, i) => (
                                <div key={i} style={{ flex: 1, borderRight: '1px solid #1F1F1F' }} />
                              ))}
                              
                              {/* Tasks for this day */}
                              {dayTasks.map((task, taskIdx) => {
                                const barColor = barColors[taskIdx % barColors.length];
                                const leftPos = 10 + (taskIdx % 3) * 25;
                                const width = 40 + (taskIdx % 2) * 20;
                                
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    style={{
                                      position: 'absolute',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      left: `${leftPos}%`,
                                      width: `${width}%`,
                                      height: '40px',
                                      background: barColor,
                                      borderRadius: '0.5rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      padding: '0 0.75rem',
                                      gap: '0.5rem',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                      zIndex: taskIdx + 1,
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.02)'; e.currentTarget.style.zIndex = '100'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%)'; e.currentTarget.style.zIndex = String(taskIdx + 1); }}
                                  >
                                    {task.assignees?.[0] && (
                                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FFFFFF', border: `2px solid ${barColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 600, color: barColor, flexShrink: 0 }}>
                                        {task.assignees[0].name.charAt(0)}
                                      </div>
                                    )}
                                    <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                        </div>
                      );
                    })}
                              
                              {/* Today indicator line */}
                              {isToday && (
                                <div style={{ position: 'absolute', left: `${((new Date().getHours() - 7) / 12) * 100}%`, top: 0, bottom: 0, width: '2px', background: '#EF4444', zIndex: 50 }}>
                                  <div style={{ position: 'absolute', top: '-6px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                  </div>
                              )}
                </div>
                          );
                        })}
              </div>
                    </div>
                  ) : (
                    // Month View - Elux Space Timeline Style (dates horizontal, tasks floating)
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
                      {/* Date Headers - Horizontal Timeline */}
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0, marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid #2D2D2D' }}>
                        {(() => {
                          const today = new Date();
                          const daysInMonth = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0).getDate();
                          const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                          
                          return Array.from({ length: daysInMonth }, (_, i) => {
                            const dayNum = i + 1;
                            const date = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth(), dayNum);
                            const dayOfWeek = date.getDay();
                            const isToday = dayNum === today.getDate() && ganttStartDate.getMonth() === today.getMonth() && ganttStartDate.getFullYear() === today.getFullYear();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                            
                            return (
                              <div key={i} style={{ 
                                flex: 1,
                                minWidth: '40px',
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}>
                                <span style={{ color: isWeekend ? '#52525B' : '#71717A', fontSize: '0.6875rem', fontWeight: 500 }}>
                                  {dayNames[dayOfWeek]}
                                </span>
                                <span style={{ 
                                  color: isToday ? '#FFFFFF' : isWeekend ? '#52525B' : '#A1A1AA', 
                                  fontSize: '0.8125rem', 
                                  fontWeight: isToday ? 700 : 500,
                                  background: isToday ? '#3B82F6' : 'transparent',
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {dayNum}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      
                      {/* Task Timeline Area */}
                      <div style={{ flex: 1, position: 'relative', minHeight: '400px', background: '#141414', borderRadius: '0.75rem', overflow: 'hidden' }}>
                        {/* Today indicator line */}
                        {(() => {
                          const today = new Date();
                          const daysInMonth = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0).getDate();
                          const isCurrentMonth = ganttStartDate.getMonth() === today.getMonth() && ganttStartDate.getFullYear() === today.getFullYear();
                          if (!isCurrentMonth) return null;
                          const leftPos = ((today.getDate() - 0.5) / daysInMonth) * 100;
                          return (
                            <div style={{ position: 'absolute', left: `${leftPos}%`, top: 0, bottom: 0, width: '2px', background: '#3B82F6', zIndex: 100 }}>
                              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#3B82F6', color: '#FFFFFF', fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                {today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </div>
                            </div>
                          );
                        })()}
                        
                        {/* Grid lines */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                          {(() => {
                            const daysInMonth = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0).getDate();
                            return Array.from({ length: daysInMonth }, (_, i) => (
                              <div key={i} style={{ flex: 1, minWidth: '40px', borderRight: '1px solid #1F1F1F' }} />
                            ));
                          })()}
                        </div>
                        
                        {/* Floating Task Bars */}
                        {(() => {
                          const daysInMonth = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0).getDate();
                          const barColors = ['#10B981', '#F97316', '#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#EF4444', '#3B82F6'];
                          
                          // Get tasks for this month
                          const monthTasks = filteredTasks.filter(t => {
                            if (!t.due_date && !t.start_date) return false;
                            const taskDate = t.due_date ? new Date(t.due_date) : new Date(t.start_date!);
                            return taskDate.getMonth() === ganttStartDate.getMonth() && taskDate.getFullYear() === ganttStartDate.getFullYear();
                          });
                          
                          // Position tasks to avoid overlap
                          const taskPositions: { task: typeof monthTasks[0]; row: number; startDay: number; endDay: number }[] = [];
                          monthTasks.forEach((task, idx) => {
                            const endDate = task.due_date ? new Date(task.due_date) : new Date(task.start_date!);
                            const startDate = task.start_date ? new Date(task.start_date) : new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                            const startDay = Math.max(1, startDate.getMonth() === ganttStartDate.getMonth() ? startDate.getDate() : 1);
                            const endDay = Math.min(daysInMonth, endDate.getMonth() === ganttStartDate.getMonth() ? endDate.getDate() : daysInMonth);
                            
                            // Find available row
                            let row = 0;
                            while (taskPositions.some(tp => tp.row === row && !(endDay < tp.startDay || startDay > tp.endDay))) {
                              row++;
                            }
                            taskPositions.push({ task, row, startDay, endDay });
                          });
                          
                          return taskPositions.map(({ task, row, startDay, endDay }, idx) => {
                            const barColor = barColors[idx % barColors.length];
                            const leftPos = ((startDay - 1) / daysInMonth) * 100;
                            const width = Math.max(((endDay - startDay + 1) / daysInMonth) * 100, 5);
                            const topPos = 20 + row * 60;
                            
                            return (
                              <div
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                style={{
                                  position: 'absolute',
                                  top: `${topPos}px`,
                                  left: `${leftPos}%`,
                                  width: `${width}%`,
                                  minWidth: '80px',
                                  height: '44px',
                                  background: barColor,
                                  borderRadius: '9999px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0 0.75rem',
                                  gap: '0.5rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  zIndex: idx + 1,
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.zIndex = '200'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.zIndex = String(idx + 1); e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                              >
                                <span style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                  {task.name}
                                </span>
                                {/* Assignee avatars */}
                                <div style={{ display: 'flex', marginLeft: 'auto', flexShrink: 0 }}>
                                  {(task.assignees || []).slice(0, 3).map((assignee, aIdx) => (
                                    <div
                                      key={assignee.id}
                                      style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: '#FFFFFF',
                                        border: `2px solid ${barColor}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.6875rem',
                                        fontWeight: 600,
                                        color: barColor,
                                        marginLeft: aIdx > 0 ? '-8px' : '0'
                                      }}
                                    >
                                      {assignee.name.charAt(0)}
                    </div>
                  ))}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        
                        {/* Empty state */}
                        {filteredTasks.filter(t => {
                          if (!t.due_date && !t.start_date) return false;
                          const taskDate = t.due_date ? new Date(t.due_date) : new Date(t.start_date!);
                          return taskDate.getMonth() === ganttStartDate.getMonth() && taskDate.getFullYear() === ganttStartDate.getFullYear();
                        }).length === 0 && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#52525B', fontSize: '0.875rem' }}>No tasks this month</span>
                          </div>
                  )}
                </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar - Mini Calendar */}
              <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Mini Calendar */}
                <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1rem', border: '1px solid #2D2D2D' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <button onClick={() => { const d = new Date(ganttStartDate); d.setMonth(d.getMonth() - 1); setGanttStartDate(d); }} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 600 }}>{ganttStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => { const d = new Date(ganttStartDate); d.setMonth(d.getMonth() + 1); setGanttStartDate(d); }} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', padding: '0.25rem' }}>
                      <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: '0.625rem', color: '#52525B', fontWeight: 600 }}>{d}</div>
                    ))}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.25rem' }}>
                    {(() => {
                      const monthStart = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth(), 1);
                      const startDay = monthStart.getDay();
                      const daysInMonth = new Date(ganttStartDate.getFullYear(), ganttStartDate.getMonth() + 1, 0).getDate();
                      const today = new Date();
                      
                      return Array.from({ length: 42 }, (_, i) => {
                        const dayNum = i - startDay + 1;
                        const isValid = dayNum > 0 && dayNum <= daysInMonth;
                        const isToday = isValid && dayNum === today.getDate() && ganttStartDate.getMonth() === today.getMonth() && ganttStartDate.getFullYear() === today.getFullYear();
                        
                    return (
                          <div key={i} style={{
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: isToday ? '#FFFFFF' : isValid ? '#A1A1AA' : '#3D3D3D',
                            background: isToday ? '#3B82F6' : 'transparent',
                            borderRadius: '0.375rem',
                            fontWeight: isToday ? 600 : 400,
                            cursor: isValid ? 'pointer' : 'default'
                          }}>
                            {isValid ? dayNum : ''}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
                
                {/* Upcoming Tasks */}
                <div style={{ background: '#1A1A1A', borderRadius: '1rem', padding: '1rem', border: '1px solid #2D2D2D', flex: 1 }}>
                  <h4 style={{ color: '#71717A', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Upcoming</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {filteredTasks.filter(t => t.due_date && new Date(t.due_date) >= new Date()).slice(0, 5).map((task, i) => {
                      const colors = ['#06B6D4', '#F97316', '#8B5CF6', '#EC4899', '#10B981'];
                      return (
                        <div key={task.id} onClick={() => setSelectedTask(task)} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#252525'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: '4px', height: '32px', background: colors[i % colors.length], borderRadius: '2px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#FFFFFF', fontSize: '0.8125rem', fontWeight: 500 }}>{task.name.length > 20 ? task.name.substring(0, 20) + '...' : task.name}</div>
                            <div style={{ color: '#71717A', fontSize: '0.6875rem' }}>{new Date(task.due_date!).toLocaleDateString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
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
                                    gridTemplateColumns: '1.5fr 1.5fr 160px 120px 100px 80px 80px',
                                    padding: '0.75rem 1.5rem',
                                    background: '#0A0A0A',
                                    borderBottom: '1px solid #1F1F1F',
                                    gap: '1rem'
                                  }}>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Task Name
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Description
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Due Date
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Type
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Assignee
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center' }}>
                                      Priority
                                    </div>
                                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      Actions
                                    </div>
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
                                          gridTemplateColumns: '1.5fr 1.5fr 160px 120px 100px 80px 80px',
                                          padding: '0.875rem 1.5rem',
                                          borderBottom: '1px solid #1F1F1F',
                                          cursor: 'pointer',
                                          transition: 'all 0.15s',
                                          gap: '1rem',
                                          alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = '#1A1A1A'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                      >
                                        {/* Task Name */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: status.color, flexShrink: 0 }} />
                                          <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {task.name}
                                          </span>
              </div>

                                        {/* Description */}
                                        <div style={{ color: '#71717A', fontSize: '0.8125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {task.description || '-'}
                                        </div>

                                        {/* Due Date */}
                                        <div style={{ color: '#A1A1AA', fontSize: '0.8125rem' }}>
                                          {task.due_date ? (
                                            new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                          ) : (
                                            <span style={{ color: '#52525B' }}>No date</span>
                                          )}
                                        </div>

                                        {/* Type */}
                                        <div>
                                          <span style={{ 
                                            padding: '0.25rem 0.625rem', 
                                            borderRadius: '9999px', 
                                            fontSize: '0.6875rem', 
                                            fontWeight: 500,
                                            backgroundColor: `${typeColor}20`,
                                            color: typeColor
                                          }}>
                                            {taskType}
                                        </span>
                                  </div>

                                        {/* Assignee */}
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                              {task.assignees && task.assignees.length > 0 ? (
                                            <div style={{ display: 'flex' }}>
                                              {task.assignees.slice(0, 3).map((assignee, i) => (
                                    <div 
                                      key={assignee.id}
                                                  style={{ 
                                                    width: '28px', 
                                                    height: '28px', 
                                                    borderRadius: '50%', 
                                                    border: '2px solid #0D0D0D', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    fontSize: '0.6875rem', 
                                                    fontWeight: 600, 
                                                    color: '#FFFFFF', 
                                                    backgroundColor: ['#3B82F6', '#EC4899', '#8B5CF6'][i % 3], 
                                                    marginLeft: i > 0 ? '-8px' : '0',
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
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.6875rem',
                                            fontWeight: 500,
                                            backgroundColor: task.priority === 'high' ? '#EF444420' : 
                                                             task.priority === 'medium' ? '#F59E0B20' : '#22C55E20',
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
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem' }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedTask(task);
                                            }}
                                            style={{ 
                                              width: '30px', 
                                              height: '30px', 
                                              background: '#1F1F1F', 
                                              border: '1px solid #2D2D2D', 
                                              color: '#71717A', 
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '0.5rem',
                                              transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#3B82F6'; e.currentTarget.style.borderColor = '#3B82F6'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.borderColor = '#2D2D2D'; }}
                                            title="Edit task"
                                          >
                                            <PencilIcon style={{ width: '14px', height: '14px' }} />
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
                                              width: '30px', 
                                              height: '30px', 
                                              background: '#1F1F1F', 
                                              border: '1px solid #2D2D2D', 
                                              color: '#71717A', 
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              borderRadius: '0.5rem',
                                              transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = '#EF4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#71717A'; e.currentTarget.style.borderColor = '#2D2D2D'; }}
                                            title="Delete task"
                                          >
                                            <TrashIcon style={{ width: '14px', height: '14px' }} />
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
                      
                      // Get vibrant color for this task based on status/priority
                      const getTaskColor = () => {
                        const colorMap: Record<string, { bg: string; text: string }> = {
                          'backlog': { bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', text: '#FFFFFF' },
                          'in_progress': { bg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', text: '#FFFFFF' },
                          'done': { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', text: '#FFFFFF' },
                          'archived': { bg: 'linear-gradient(135deg, #52525B 0%, #3F3F46 100%)', text: '#FFFFFF' },
                        };
                        
                        // Use status for color, fallback to priority
                        if (colorMap[task.status]) return colorMap[task.status];
                        
                        // Fallback colors by priority
                        if (task.priority === 'high') return { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', text: '#FFFFFF' };
                        if (task.priority === 'medium') return { bg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', text: '#FFFFFF' };
                        return { bg: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', text: '#FFFFFF' };
                      };
                      
                      const taskColor = getTaskColor();
                      
                      return (
                        <div
                          key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task)}
                          onClick={() => setSelectedTask(task)}
                          style={{ 
                            background: taskColor.bg,
                            border: 'none',
                            borderRadius: '14px', 
                            padding: '14px 16px', 
                            cursor: 'pointer', 
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                                              position: 'relative',
                            minHeight: '150px',
                            maxHeight: '150px',
                                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          }}
                          onMouseEnter={(e) => { 
                            e.currentTarget.style.transform = 'translateY(-3px)'; 
                            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.35)';
                          }}
                          onMouseLeave={(e) => { 
                            e.currentTarget.style.transform = 'translateY(0)'; 
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
                          }}
                        >
                          {/* Checkbox */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                // Toggle task completion
                              }}
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '5px',
                                border: '2px solid rgba(255,255,255,0.9)',
                                background: 'rgba(255,255,255,0.15)',
                                cursor: 'pointer',
                                flexShrink: 0,
                                marginTop: '2px',
                              }}
                            />
                            <h3 style={{ 
                              color: '#FFFFFF', 
                              fontWeight: 600, 
                              fontSize: '14px', 
                              lineHeight: 1.4, 
                              margin: 0, 
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>{task.name}</h3>
                          </div>
            
                          {/* Date */}
                          {task.due_date && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              marginBottom: '10px',
                              color: 'rgba(255,255,255,0.85)',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}>
                              <CalIcon style={{ width: '14px', height: '14px' }} />
                              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                          )}

                          {/* Priority Badge */}
                          {task.priority && (
                            <div style={{ marginBottom: '12px' }}>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '6px', 
                                fontSize: '11px', 
                                fontWeight: 600,
                                background: 'rgba(255,255,255,0.2)',
                                color: '#FFFFFF',
                                textTransform: 'capitalize',
                              }}>
                                {task.priority} priority
                              </span>
                  </div>
                          )}

                          {/* Spacer */}
                          <div style={{ flex: 1 }} />
                
                          {/* Footer with Assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex' }}>
                              {(task.assignees || []).slice(0, 3).map((assignee, i) => (
                                <div
                                  key={assignee.id}
                                  style={{ 
                                    width: '28px', 
                                    height: '28px', 
                                    borderRadius: '50%', 
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    fontSize: '11px', 
                                    fontWeight: 600, 
                                    color: '#FFFFFF', 
                                    backgroundColor: 'rgba(0,0,0,0.3)',
                                    marginLeft: i > 0 ? '-8px' : '0',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                  }}
                                >
                                  {assignee.name.charAt(0)}
                                          </div>
                                        ))}
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

                {/* Team Member Timeline with Progress Bars */}
                <div style={{ flex: 1, background: '#141414', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #1F1F1F', overflow: 'auto' }}>
                  {/* Week Headers */}
                  <div style={{ display: 'flex', marginBottom: '1.25rem', paddingLeft: '200px' }}>
                    {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((week, i) => {
                      const today = new Date();
                      const weekOfMonth = Math.ceil(today.getDate() / 7);
                      const isCurrentWeek = i + 1 === weekOfMonth && ganttStartDate.getMonth() === today.getMonth() && ganttStartDate.getFullYear() === today.getFullYear();
                      
                      return (
                        <div key={week} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
                          <span style={{ color: isCurrentWeek ? '#10B981' : '#52525B', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{week}</span>
                          {isCurrentWeek && (
                            <div style={{ position: 'absolute', top: '1.75rem', left: '50%', transform: 'translateX(-50%)', width: '2px', height: 'calc(100vh - 400px)', background: 'linear-gradient(180deg, #EF4444 0%, transparent 100%)', zIndex: 10 }}>
                              <div style={{ position: 'absolute', top: '-0.625rem', left: '50%', transform: 'translateX(-50%)', padding: '0.25rem 0.5rem', background: '#10B981', borderRadius: '0.25rem', color: '#FFF', fontSize: '0.5625rem', fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Today</div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Team Member Rows with Progress */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {project.members?.map((member, memberIdx) => {
                      const memberColors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16'];
                      const memberColor = memberColors[memberIdx % memberColors.length];
                      
                      // Get all tasks for this member
                      const allMemberTasks = tasks.filter(t => t.assignees?.some(a => a.id === member.id));
                      const completedTasks = allMemberTasks.filter(t => t.status === 'done').length;
                      const totalTasks = allMemberTasks.length;
                      const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                      
                      return (
                        <div key={member.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 0', borderBottom: memberIdx < (project.members?.length || 0) - 1 ? '1px solid #1F1F1F' : 'none' }}>
                          {/* Member info */}
                          <div style={{ width: '200px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '1rem' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: memberColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#FFFFFF' }}>{member.name.charAt(0)}</span>
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <span style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {member.name.length > 12 ? member.name.substring(0, 12) + '...' : member.name}
                              </span>
                              <span style={{ color: '#52525B', fontSize: '0.6875rem' }}>{completedTasks}/{totalTasks} done</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar - Full width like previous UI */}
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ flex: 1, height: '32px', background: '#1F1F1F', borderRadius: '9999px', overflow: 'hidden', position: 'relative' }}>
                              {/* Filled Progress */}
                              <div style={{ 
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                height: '100%', 
                                width: `${completionPercent}%`, 
                                background: `linear-gradient(90deg, ${memberColor} 0%, ${memberColor}AA 100%)`,
                                borderRadius: '9999px',
                                display: 'flex',
                                alignItems: 'center',
                                paddingLeft: '0.75rem',
                                transition: 'width 0.5s ease'
                              }}>
                                {completionPercent > 15 && (
                                  <span style={{ color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 600 }}>{completionPercent}% Complete</span>
                                )}
                              </div>
                              {/* Show percentage outside if bar is too small */}
                              {completionPercent <= 15 && completionPercent > 0 && (
                                <span style={{ position: 'absolute', left: `calc(${completionPercent}% + 0.5rem)`, top: '50%', transform: 'translateY(-50%)', color: '#A1A1AA', fontSize: '0.75rem', fontWeight: 500 }}>{completionPercent}%</span>
                              )}
                              {completionPercent === 0 && (
                                <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#52525B', fontSize: '0.75rem' }}>No tasks completed</span>
                              )}
                            </div>
                            
                            {/* Percentage Badge */}
                            <div style={{ 
                              minWidth: '48px',
                              padding: '0.375rem 0.625rem',
                              background: completionPercent >= 80 ? '#10B98120' : completionPercent >= 50 ? '#F59E0B20' : completionPercent > 0 ? '#3B82F620' : '#2D2D2D',
                              borderRadius: '9999px',
                              textAlign: 'center'
                            }}>
                              <span style={{ 
                                color: completionPercent >= 80 ? '#10B981' : completionPercent >= 50 ? '#F59E0B' : completionPercent > 0 ? '#3B82F6' : '#52525B',
                                fontSize: '0.8125rem',
                                fontWeight: 700
                              }}>
                                {completionPercent}%
                              </span>
                            </div>
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
                            {member.id !== user?.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMember(member.id);
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
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                              >
                                <TrashIcon style={{ width: '14px', height: '14px' }} />
                                Remove
                              </button>
                            )}
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
                                onClick={() => { setEditingMemberRole(role); setCustomRoleInput(''); }}
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
                          
                          {/* Custom Role Input */}
                          <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Or enter custom role
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <input
                                type="text"
                                value={customRoleInput}
                                onChange={(e) => setCustomRoleInput(e.target.value)}
                                placeholder="e.g. Product Owner, Scrum Master..."
                                style={{
                                  flex: 1,
                                  padding: '0.625rem 0.875rem',
                                  background: '#141414',
                                  border: '1px solid #3D3D3D',
                                  borderRadius: '0.5rem',
                                  color: '#FFFFFF',
                                  fontSize: '0.8125rem',
                                  outline: 'none'
                                }}
                                onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                                onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                              />
                              <button
                                onClick={() => {
                                  if (customRoleInput.trim()) {
                                    setEditingMemberRole(customRoleInput.trim());
                                  }
                                }}
                                disabled={!customRoleInput.trim()}
                                style={{
                                  padding: '0.625rem 1rem',
                                  background: customRoleInput.trim() ? '#3B82F6' : '#2D2D2D',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  color: customRoleInput.trim() ? '#FFFFFF' : '#52525B',
                                  fontSize: '0.8125rem',
                                  fontWeight: 500,
                                  cursor: customRoleInput.trim() ? 'pointer' : 'not-allowed',
                                  transition: 'all 0.2s'
                                }}
                              >
                                Apply
                              </button>
                            </div>
                            {editingMemberRole && !roleOptions.includes(editingMemberRole) && (
                              <p style={{ color: '#10B981', fontSize: '0.75rem', marginTop: '0.375rem' }}>
                                Custom role selected: {editingMemberRole}
                              </p>
                            )}
                          </div>
                          
                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingMemberId(null);
                                setEditingMemberRole('');
                                setCustomRoleInput('');
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
                                  
                                  // Refresh project data to get updated members
                                  await fetchProject();
                                  
                                  setEditingMemberId(null);
                                  setEditingMemberRole('');
                                  setCustomRoleInput('');
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
                onClick={() => {
                  fetchAvailableUsers();
                  setShowAddMemberModal(true);
                }}
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
                onClick={leaveProject}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  padding: '0.625rem 1rem', 
                  background: 'transparent', 
                  border: '1px solid #EF4444', 
                  borderRadius: '0.5rem', 
                  color: '#EF4444', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#EF4444'; }}
              >
                Leave Project
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

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setShowAddMemberModal(false)}>
          <div style={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: '1rem', width: '100%', maxWidth: '28rem', boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2D2D2D' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>Add Team Member</h2>
              <p style={{ fontSize: '0.8125rem', color: '#71717A', margin: '0.25rem 0 0' }}>Select a user to add to this project</p>
            </div>
            
            {/* Content */}
            <div style={{ padding: '1.5rem' }}>
              {/* User Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select User
                </label>
                <select
                  value={selectedUserId || ''}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: '#141414',
                    border: '1px solid #3D3D3D',
                    borderRadius: '0.5rem',
                    color: '#FFFFFF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                >
                  <option value="">Select a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>
              
              {/* Role Selection */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.6875rem', fontWeight: 600, color: '#71717A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Assign Role
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['Admin', 'Manager', 'Member', 'Developer', 'Designer', 'QA', 'Viewer'].map(role => (
                    <button
                      key={role}
                      onClick={() => setNewMemberRole(role)}
                      style={{
                        padding: '0.5rem 0.875rem',
                        background: newMemberRole === role ? '#3B82F6' : '#2D2D2D',
                        border: newMemberRole === role ? '1px solid #3B82F6' : '1px solid #3D3D3D',
                        borderRadius: '0.5rem',
                        color: newMemberRole === role ? '#FFFFFF' : '#A1A1AA',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #2D2D2D', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUserId(null);
                  setNewMemberRole('Member');
                }}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: 'transparent',
                  border: '1px solid #3D3D3D',
                  borderRadius: '0.5rem',
                  color: '#A1A1AA',
                  fontSize: '0.875rem',
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
                onClick={addMember}
                disabled={!selectedUserId}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: selectedUserId ? '#10B981' : '#2D2D2D',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: selectedUserId ? '#FFFFFF' : '#52525B',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: selectedUserId ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { if (selectedUserId) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={(e) => { if (selectedUserId) e.currentTarget.style.background = '#10B981'; }}
              >
                Add Member
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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                {isEditingTask ? 'Edit Task' : 'Task Detail'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {!isEditingTask ? (
                <button
                    onClick={startEditingTask}
                    style={{ padding: '0.5rem 1rem', background: '#3B82F6', border: 'none', color: '#FFFFFF', cursor: 'pointer', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.375rem', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#2563EB'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#3B82F6'}
                  >
                    <PencilIcon style={{ width: '14px', height: '14px' }} />
                    Edit
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditingTask(false)}
                      style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #2D2D2D', color: '#A1A1AA', cursor: 'pointer', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#71717A'; e.currentTarget.style.color = '#FFFFFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2D2D2D'; e.currentTarget.style.color = '#A1A1AA'; }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveTaskEdit}
                      style={{ padding: '0.5rem 1rem', background: '#10B981', border: 'none', color: '#FFFFFF', cursor: 'pointer', borderRadius: '0.5rem', fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#10B981'}
                    >
                      Save Changes
                    </button>
                  </>
                )}
                <button
                  onClick={() => { setSelectedTask(null); setIsEditingTask(false); }}
                style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#71717A', cursor: 'pointer', borderRadius: '0.375rem', transition: 'all 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#2D2D2D'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#71717A'; }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left Panel - Task Details */}
              <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', borderRight: '1px solid #2D2D2D' }}>
                {isEditingTask ? (
                  <>
                    <input
                      type="text"
                      value={editTaskForm.name}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, name: e.target.value })}
                      placeholder="Task name"
                      style={{ width: '100%', fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1rem', outline: 'none' }}
                    />
                    <textarea
                      value={editTaskForm.description}
                      onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                      placeholder="Task description"
                      rows={3}
                      style={{ width: '100%', color: '#A1A1AA', fontSize: '0.9375rem', lineHeight: 1.6, background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.5rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', outline: 'none', resize: 'vertical' }}
                    />
                  </>
                ) : (
                  <>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem' }}>{selectedTask.name}</h1>
                <p style={{ color: '#A1A1AA', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                  {selectedTask.description || 'No description provided'}
                </p>
                  </>
                )}

                {/* Task Properties Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Status</label>
                    {isEditingTask ? (
                      <select
                        value={editTaskForm.status}
                        onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                      >
                        {TASK_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: TASK_STATUSES.find(s => s.value === selectedTask.status)?.color }} />
                      <span style={{ fontSize: '0.875rem', color: '#FFFFFF', fontWeight: 500 }}>
                        {TASK_STATUSES.find(s => s.value === selectedTask.status)?.label}
                                     </span>
                               </div>
                    )}
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

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Due date</label>
                    {isEditingTask ? (
                      <input
                        type="date"
                        value={editTaskForm.due_date}
                        onChange={(e) => setEditTaskForm({ ...editTaskForm, due_date: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none' }}
                      />
                    ) : selectedTask.due_date ? (
                      <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#FFFFFF' }}>
                          {new Date(selectedTask.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                 </span>
              </div>
                    ) : (
                      <div style={{ padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#52525B' }}>No due date</span>
              </div>
            )}
                  </div>

              <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#71717A', marginBottom: '0.5rem' }}>Priority</label>
                    {isEditingTask ? (
                      <select
                        value={editTaskForm.priority}
                        onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value })}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: '0.375rem', color: '#FFFFFF', fontSize: '0.875rem', outline: 'none', cursor: 'pointer' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    ) : (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', background: selectedTask.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : selectedTask.priority === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)', borderRadius: '9999px', border: '1px solid #2D2D2D' }}>
                        <span style={{ fontSize: '0.875rem', color: selectedTask.priority === 'high' ? '#EF4444' : selectedTask.priority === 'medium' ? '#F59E0B' : '#10B981', fontWeight: 500, textTransform: 'capitalize' }}>
                          {selectedTask.priority || 'Low'}
                      </span>
                </div>
                    )}
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
