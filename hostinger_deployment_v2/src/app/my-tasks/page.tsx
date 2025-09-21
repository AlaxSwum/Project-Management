'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { 
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import TaskDetailModal from '@/components/TaskDetailModal';
import MobileHeader from '@/components/MobileHeader';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  color?: string;
}

interface TaskComment {
  id: number;
  comment: string;
  user: User;
  created_at: string;
}

interface TaskAttachment {
  id: number;
  file: string;
  filename: string;
  user: User;
  created_at: string;
  file_size: number;
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
  assignees: User[];  // Changed from single assignee to multiple assignees
  assignee?: User | null;  // Keep for backwards compatibility
  created_by: User;
  tags_list: string[];
  created_at: string;
  updated_at: string;
  project_id: number;
  project: Project;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

const TASK_STATUSES = [
  { value: 'todo', label: 'To Do', color: '#f3f4f6', icon: '' },
  { value: 'in_progress', label: 'In Progress', color: '#dbeafe', icon: '' },
  { value: 'review', label: 'Review', color: '#fef3c7', icon: '' },
  { value: 'done', label: 'Done', color: '#d1fae5', icon: '' },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#10b981', icon: '' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', icon: '' },
  { value: 'high', label: 'High', color: '#ef4444', icon: '' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626', icon: '' },
];

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due Today' },
  { value: 'this_week', label: 'Due This Week' },
];

export default function MyTasksPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Calendar view state
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calendar helper functions
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return filteredTasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === dateString;
    });
  };

  const renderCalendarGrid = () => {
    const today = new Date();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
      const prevMonthDays = getDaysInMonth(prevMonth);
      const day = prevMonthDays - firstDay + i + 1;
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, day);
      const dayTasks = getTasksForDate(date);
      
      days.push(
        <div key={`prev-${day}`} className="calendar-day-cell" style={{ 
          minHeight: '120px', 
          padding: '0.75rem',
          background: '#f8f9fa',
          border: '1px solid #e5e7eb',
          color: '#9ca3af',
          opacity: 0.5
        }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{day}</div>
          {dayTasks.slice(0, 2).map((task, index) => (
            <div key={task.id} style={{
              background: '#e5e7eb',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
              cursor: 'pointer'
            }}>
              {task.name.length > 15 ? `${task.name.substring(0, 15)}...` : task.name}
            </div>
          ))}
        </div>
      );
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayTasks = getTasksForDate(date);
      const isToday = date.toDateString() === today.toDateString();
      
      days.push(
        <div key={day} className="calendar-day-cell" style={{ 
          minHeight: '120px', 
          padding: '0.75rem',
          background: isToday ? '#e3f2fd' : '#ffffff',
          border: isToday ? '2px solid #5884FD' : '1px solid #e5e7eb',
          position: 'relative'
        }}>
          <div style={{ 
            fontSize: '0.875rem', 
            fontWeight: isToday ? '600' : '400',
            color: isToday ? '#5884FD' : '#1f2937',
            marginBottom: '0.5rem' 
          }}>
            {day}
          </div>
          {dayTasks.slice(0, 3).map((task, index) => {
            const priorityConfig = getPriorityConfig(task.priority);
            const overdue = isOverdue(task.due_date);
            
            return (
              <div 
                key={task.id} 
                onClick={() => handleTaskClick(task)}
                style={{
                  background: overdue ? '#fef2f2' : '#f8fafc',
                  border: `1px solid ${overdue ? '#f87171' : priorityConfig.color}`,
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  marginBottom: '0.25rem',
                  cursor: 'pointer',
                  color: overdue ? '#dc2626' : '#1f2937',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontWeight: '500' }}>
                  {task.name.length > 15 ? `${task.name.substring(0, 15)}...` : task.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.125rem' }}>
                  {task.project.name}
                </div>
              </div>
            );
          })}
          {dayTasks.length > 3 && (
            <div style={{
              fontSize: '0.7rem',
              color: '#6b7280',
              fontWeight: '500',
              marginTop: '0.25rem'
            }}>
              +{dayTasks.length - 3} more tasks
            </div>
          )}
        </div>
      );
    }

    // Add days from next month to fill the grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
      const dayTasks = getTasksForDate(date);
      
      days.push(
        <div key={`next-${day}`} className="calendar-day-cell" style={{ 
          minHeight: '120px', 
          padding: '0.75rem',
          background: '#f8f9fa',
          border: '1px solid #e5e7eb',
          color: '#9ca3af',
          opacity: 0.5
        }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>{day}</div>
          {dayTasks.slice(0, 2).map((task, index) => (
            <div key={task.id} style={{
              background: '#e5e7eb',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
              cursor: 'pointer'
            }}>
              {task.name.length > 15 ? `${task.name.substring(0, 15)}...` : task.name}
            </div>
          ))}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchMyTasks();
    fetchProjects();
    fetchUsers();
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  const fetchMyTasks = async () => {
    try {
      const tasksData = await taskService.getUserTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      setError('Failed to fetch your tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsData = await projectService.getProjects();
      setAllProjects(projectsData);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await projectService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task =>
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags_list.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter === 'overdue') {
      filtered = filtered.filter(task => isOverdue(task.due_date));
    } else if (statusFilter === 'today') {
      filtered = filtered.filter(task => isDueToday(task.due_date));
    } else if (statusFilter === 'this_week') {
      filtered = filtered.filter(task => isDueThisWeek(task.due_date));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Apply sorting - ascending order for consistent task display
    filtered.sort((a, b) => {
      // 1. Sort by priority (urgent > high > medium > low)
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // 2. Sort by due date (earliest first, nulls last)
      if (a.due_date && b.due_date) {
        const aDate = new Date(a.due_date).getTime();
        const bDate = new Date(b.due_date).getTime();
        if (aDate !== bDate) {
          return aDate - bDate;
        }
      } else if (a.due_date && !b.due_date) {
        return -1; // a has due date, b doesn't - a comes first
      } else if (!a.due_date && b.due_date) {
        return 1; // b has due date, a doesn't - b comes first
      }

      // 3. Sort by creation date (earliest first)
      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      if (aCreated !== bCreated) {
        return aCreated - bCreated;
      }

      // 4. Sort by name (alphabetical)
      return a.name.localeCompare(b.name);
    });

    setFilteredTasks(filtered);
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
      
      // Update selected task if it's the same one
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const fetchTaskDetails = async (taskId: number) => {
    setIsLoadingComments(true);
    setIsLoadingAttachments(true);
    
    try {
      const [comments, attachments] = await Promise.all([
        taskService.getTaskComments(taskId),
        taskService.getTaskAttachments(taskId).catch(() => [])
      ]);
      
      setTaskComments(comments || []);
      setTaskAttachments(attachments || []);
    } catch (err) {
      console.error('Failed to fetch task details:', err);
    } finally {
      setIsLoadingComments(false);
      setIsLoadingAttachments(false);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!selectedTask) return;
    
    try {
      const updatedTask = await taskService.updateTask(selectedTask.id, taskData);
      setTasks(tasks.map(task => 
        task.id === selectedTask.id ? updatedTask : task
      ));
      setSelectedTask(updatedTask);
      setError('');
    } catch (err: any) {
      setError('Failed to update task');
      throw err;
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
    await fetchTaskDetails(task.id);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      setError('');
    } catch (err: any) {
      setError('Failed to delete task');
      throw err;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      const comment = await taskService.createTaskComment(selectedTask.id, { comment: newComment.trim() });
      if (comment) {
        setTaskComments([...taskComments, comment]);
        setNewComment('');
      }
    } catch (err) {
      setError('Failed to add comment');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedTask) return;
    
    setIsUploading(true);
    try {
      const attachment = await taskService.uploadTaskAttachment(selectedTask.id, selectedFile);
      setTaskAttachments([...taskAttachments, attachment]);
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dueDate) < today;
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return today.toDateString() === due.toDateString();
  };

  const isDueThisWeek = (dueDate: string | null) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const oneWeek = new Date();
    oneWeek.setDate(today.getDate() + 7);
    return due >= today && due <= oneWeek;
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1];
  };

  const getStatusConfig = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'done').length;
    const overdue = tasks.filter(task => isOverdue(task.due_date)).length;
    const dueToday = tasks.filter(task => isDueToday(task.due_date)).length;
    
    return { total, completed, overdue, dueToday };
  };

  const stats = getTaskStats();

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <MobileHeader title="My Tasks" isMobile={isMobile} />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
          }
          .my-tasks-container {
            min-height: 100vh;
            display: flex;
            background: #F5F5ED;
          }
          .main-content {
            flex: 1;
            margin-left: ${isMobile ? '0' : '256px'};
            background: transparent;
            padding-top: ${isMobile ? '70px' : '0'};
            padding-left: ${isMobile ? '12px' : '0'};
            padding-right: ${isMobile ? '12px' : '0'};
          }
          .header {
            background: transparent;
            padding: 2rem;
            margin-bottom: 3rem;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
          }
          .header-title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #1a1a1a;
            margin: 0;
            letter-spacing: -0.02em;
          }
          .header-subtitle {
            color: #666666;
            font-size: 1.1rem;
            font-weight: 400;
            line-height: 1.5;
            margin: 0.5rem 0 0 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 0;
          }
          .stat-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 1.5rem;
            text-align: left;
            transition: all 0.2s ease;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .stat-card:hover {
            transform: translateY(-2px);
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            line-height: 1;
          }
          .stat-label {
            font-size: 0.875rem;
            font-weight: 500;
            margin: 0;
          }
          .filters-section {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            margin: 0 2rem 2rem 2rem;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .filters-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 2rem;
            align-items: end;
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .filter-label {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 1rem;
            letter-spacing: -0.01em;
            margin-bottom: 0.75rem;
            display: block;
          }
          .search-input {
            width: 100%;
            padding: 0.9rem 3rem 0.9rem 1rem;
            border: 2px solid #e8e8e8;
            border-radius: 16px;
            font-size: 0.95rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #1a1a1a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            letter-spacing: -0.01em;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .search-input:hover {
            border-color: #C483D9;
            background: #fafafa;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(196, 131, 217, 0.15);
          }
          .search-input:focus {
            outline: none;
            border-color: #5884FD;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(88, 132, 253, 0.1), 0 4px 16px rgba(88, 132, 253, 0.2);
            transform: translateY(-2px);
          }
          .search-input:active {
            transform: translateY(0);
          }
          .filter-select {
            width: 100%;
            padding: 0.9rem 1rem;
            border: 2px solid #e8e8e8;
            border-radius: 16px;
            font-size: 0.95rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #1a1a1a;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 500;
            letter-spacing: -0.01em;
            cursor: pointer;
            appearance: none;
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 1rem center;
            background-repeat: no-repeat;
            background-size: 1rem;
            padding-right: 3rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
          }
          .filter-select:hover {
            border-color: #C483D9;
            background: #fafafa;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(196, 131, 217, 0.15);
          }
          .filter-select:focus {
            outline: none;
            border-color: #5884FD;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(88, 132, 253, 0.1), 0 4px 16px rgba(88, 132, 253, 0.2);
            transform: translateY(-2px);
          }
          .filter-select:active {
            transform: translateY(0);
          }
          .tasks-section {
            padding: 0 2rem 2rem 2rem;
          }
          .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .task-item {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 16px rgba(0, 0, 0, 0.04);
          }
          .task-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-color: #C483D9;
          }
          .task-item.overdue {
            border-color: #ef4444;
            background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
          }
          .task-item.urgent {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
          }
          .task-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .task-title-section {
            flex: 1;
          }
          .task-title {
            font-weight: 500;
            color: #1a1a1a;
            font-size: 1.2rem;
            line-height: 1.4;
            margin-bottom: 0.5rem;
            letter-spacing: -0.01em;
          }
          .task-project {
            font-size: 0.85rem;
            color: #666666;
            font-weight: 500;
            margin: 0 0.5rem;
          }
          .task-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .priority-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid;
          }
          .status-badge {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid;
          }
          .task-description {
            font-size: 0.9rem;
            color: #6b7280;
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          .task-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .task-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: #6b7280;
            background: #f9fafb;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .task-meta-item.overdue {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
            animation: pulse 2s infinite;
          }
          .task-actions-row {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .status-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #ffffff;
            color: #666666;
            font-weight: 500;
          }
          .status-btn:hover {
            background: #5884FD;
            color: #ffffff;
            border-color: #5884FD;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(88, 132, 253, 0.3);
          }
          .view-btn {
            padding: 0.5rem;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #ffffff;
            color: #666666;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .view-btn:hover {
            background: #5884FD;
            color: #ffffff;
            border-color: #5884FD;
            transform: translateY(-1px);
          }
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            text-align: center;
            color: #9ca3af;
          }
          .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            opacity: 0.5;
          }
          .empty-state-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          .empty-state-text {
            font-size: 0.95rem;
            line-height: 1.5;
          }
          .error-message {
            background: #ffffff;
            border: 1px solid #F87239;
            color: #F87239;
            padding: 1rem;
            border-radius: 12px;
            margin: 0 2rem 2rem 2rem;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(248, 114, 57, 0.1);
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.3s ease-out;
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            padding: 0;
            width: 100%;
            max-width: 900px;
            border-radius: 12px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem;
            border-bottom: 2px solid #f3f4f6;
            flex-shrink: 0;
          }
          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
          }
          .modal-tabs {
            display: flex;
            border-bottom: 2px solid #f3f4f6;
            margin-bottom: 1.5rem;
          }
          .modal-tab {
            padding: 0.75rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            font-weight: 500;
            color: #666666;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
          }
          .modal-tab.active {
            color: #000000;
            border-bottom-color: #000000;
          }
          .modal-tab:hover {
            color: #000000;
          }
          .tab-content {
            display: none;
          }
          .tab-content.active {
            display: block;
          }
          .comments-section {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 1rem;
          }
          .comment-item {
            display: flex;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .comment-avatar {
            width: 32px;
            height: 32px;
            background: #e5e7eb;
            border: 1px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            flex-shrink: 0;
          }
          .comment-content {
            flex: 1;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
          }
          .comment-author {
            font-weight: 600;
            color: #000000;
            font-size: 0.9rem;
          }
          .comment-date {
            font-size: 0.75rem;
            color: #666666;
          }
          .comment-text {
            color: #374151;
            line-height: 1.5;
            font-size: 0.9rem;
          }
          .comment-form {
            display: flex;
            gap: 0.75rem;
            align-items: end;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.9rem;
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
          }
          .comment-input:focus {
            outline: none;
            border-color: #000000;
          }
          .comment-btn {
            padding: 0.75rem 1.5rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          }
          .comment-btn:hover {
            background: #333333;
          }
          .attachments-section {
            margin-bottom: 1.5rem;
          }
          .attachment-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin-bottom: 0.5rem;
          }
          .attachment-icon {
            width: 32px;
            height: 32px;
            background: #e5e7eb;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666666;
          }
          .attachment-info {
            flex: 1;
          }
          .attachment-name {
            font-weight: 500;
            color: #000000;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }
          .attachment-meta {
            font-size: 0.75rem;
            color: #666666;
          }
          .attachment-download {
            padding: 0.5rem;
            background: none;
            border: 1px solid #000000;
            border-radius: 4px;
            cursor: pointer;
            color: #000000;
            transition: all 0.2s ease;
          }
          .attachment-download:hover {
            background: #f3f4f6;
          }
          .file-upload-section {
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            text-align: center;
            transition: all 0.2s ease;
          }
          .file-upload-section:hover {
            border-color: #000000;
            background: #f9fafb;
          }
          .file-upload-input {
            display: none;
          }
          .file-upload-btn {
            padding: 0.75rem 1.5rem;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }
          .file-upload-btn:hover {
            background: #f3f4f6;
          }
          .selected-file {
            margin-top: 1rem;
            padding: 0.75rem;
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .upload-btn {
            padding: 0.5rem 1rem;
            background: #000000;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .upload-btn:hover {
            background: #333333;
          }
          .upload-btn:disabled {
            background: #cccccc;
            cursor: not-allowed;
          }
          
          /* Calendar View Styles */
          .calendar-day-cell {
            position: relative;
            transition: all 0.2s ease;
          }
          .calendar-day-cell:hover {
            background: #f8fafc !important;
          }
          .calendar-grid {
            border-collapse: separate;
            border-spacing: 1px;
          }
          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .close-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            color: #666666;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            background: #f3f4f6;
            color: #000000;
          }
          /* Tablet styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
            .filters-grid {
              grid-template-columns: 1fr 1fr;
            }
            .header {
              padding: 1rem 1.5rem;
            }
            .filters-section {
              margin: 1.5rem;
              padding: 1.25rem;
            }
            .tasks-section {
              padding: 0 1.5rem 1.5rem 1.5rem;
            }
          }

          /* Mobile styles */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            .header {
              padding: 1rem;
              position: relative;
              border-bottom: 1px solid #e5e7eb;
            }
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            .header-title {
              font-size: 1.5rem;
            }
            .header-subtitle {
              font-size: 0.9rem;
            }
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            .stat-card {
              padding: 0.75rem;
            }
            .stat-number {
              font-size: 1.25rem;
            }
            .stat-label {
              font-size: 0.75rem;
            }
            .filters-section {
              margin: 1rem;
              padding: 1rem;
              border-radius: 8px;
            }
            .filters-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .search-input {
              padding: 0.875rem 3rem 0.875rem 1rem;
              font-size: 1rem;
              border-radius: 12px;
            }
            .filter-select {
              padding: 0.875rem 3rem 0.875rem 1rem;
              font-size: 1rem;
              border-radius: 12px;
            }
            .tasks-section {
              padding: 0 1rem 1rem 1rem;
            }
            .task-item {
              padding: 1rem;
              border-radius: 8px;
            }
            .task-header {
              flex-direction: column;
              align-items: start;
              gap: 0.75rem;
            }
            .task-title {
              font-size: 1rem;
              margin-bottom: 0.25rem;
            }
            .task-project {
              font-size: 0.8rem;
            }
            .task-actions {
              align-self: stretch;
              justify-content: flex-start;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            .priority-badge, .status-badge {
              font-size: 0.7rem;
              padding: 0.25rem 0.5rem;
            }
            .task-description {
              font-size: 0.85rem;
              margin-bottom: 0.75rem;
            }
            .task-meta {
              gap: 0.5rem;
              margin-bottom: 0.75rem;
            }
            .task-meta-item {
              font-size: 0.75rem;
              padding: 0.375rem 0.5rem;
            }
            .task-actions-row {
              gap: 0.375rem;
            }
            .status-btn {
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              flex: 1;
              min-width: fit-content;
            }
            .view-btn {
              padding: 0.5rem;
              min-width: 40px;
              height: 40px;
            }
            .empty-state {
              padding: 2rem 1rem;
            }
            .empty-state-icon {
              font-size: 3rem;
            }
            .empty-state-title {
              font-size: 1.1rem;
            }
            .empty-state-text {
              font-size: 0.9rem;
            }
            .error-message {
              margin: 1rem;
              padding: 0.875rem;
              font-size: 0.9rem;
            }
          }

          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .stats-grid {
              gap: 0.5rem;
            }
            .stat-card {
              padding: 0.625rem;
            }
            .stat-number {
              font-size: 1.125rem;
            }
            .filters-section {
              margin: 0.75rem;
              padding: 0.875rem;
            }
            .tasks-section {
              padding: 0 0.75rem 0.75rem 0.75rem;
            }
            .task-item {
              padding: 0.875rem;
            }
            .task-actions {
              gap: 0.375rem;
            }
            .priority-badge, .status-badge {
              font-size: 0.65rem;
              padding: 0.2rem 0.4rem;
            }
            .task-actions-row {
              flex-direction: column;
            }
            .status-btn {
              width: 100%;
              text-align: center;
            }
            .view-btn {
              align-self: flex-end;
              position: absolute;
              top: 0.875rem;
              right: 0.875rem;
            }
            .task-header {
              position: relative;
              padding-right: 3rem;
            }
          }

          /* Mobile modal styles */
          @media (max-width: 768px) {
            .modal-overlay {
              padding: 0.5rem;
              align-items: flex-end;
            }
            .modal-content {
              max-width: 100%;
              max-height: 95vh;
              border-radius: 12px 12px 0 0;
              margin-bottom: 0;
            }
            .modal-header {
              padding: 1rem 1.25rem;
            }
            .modal-title {
              font-size: 1.25rem;
            }
            .modal-body {
              padding: 1.25rem;
            }
            .modal-tabs {
              margin-bottom: 1rem;
              overflow-x: auto;
              white-space: nowrap;
            }
            .modal-tab {
              padding: 0.625rem 1rem;
              font-size: 0.9rem;
            }
            .comment-form {
              flex-direction: column;
              gap: 0.75rem;
            }
            .comment-input {
              min-height: 70px;
              font-size: 1rem;
            }
            .comment-btn {
              align-self: stretch;
              padding: 0.875rem;
            }
            .file-upload-section {
              padding: 1rem;
            }
            .file-upload-btn {
              padding: 0.875rem 1.25rem;
              width: 100%;
              justify-content: center;
            }
            .selected-file {
              flex-direction: column;
              gap: 0.75rem;
              text-align: center;
            }
            .upload-btn {
              align-self: stretch;
              justify-content: center;
              padding: 0.75rem;
            }
            .attachment-item {
              padding: 0.875rem;
            }
            .comment-item {
              padding: 0.875rem;
            }
            .comment-avatar {
              width: 28px;
              height: 28px;
              font-size: 0.75rem;
            }
          }

          /* Landscape mobile */
          @media (max-width: 896px) and (orientation: landscape) {
            .modal-overlay {
              align-items: center;
            }
            .modal-content {
              max-height: 90vh;
              border-radius: 12px;
            }
          }
        `
      }} />
      
      <div className="my-tasks-container">
        {!isMobile && (
          <Sidebar 
            projects={allProjects} 
            onCreateProject={() => {}} 
          />
        )}
        
        <div className="main-content">
          <header className="header">
            <div className="header-content">
              <div>
                <h1 className="header-title">My Tasks</h1>
                <p className="header-subtitle">Manage all your assigned tasks</p>
            </div>
            
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setViewMode('list')}
                style={{
                    padding: '0.75rem 1.25rem',
                    background: viewMode === 'list' ? '#5884FD' : '#ffffff',
                    color: viewMode === 'list' ? '#ffffff' : '#666666',
                    border: '2px solid #e8e8e8',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '-0.01em',
                    boxShadow: viewMode === 'list' ? '0 4px 12px rgba(88, 132, 253, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.borderColor = '#C483D9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 131, 217, 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (viewMode !== 'list') {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                >
                  <ListBulletIcon style={{ width: '16px', height: '16px' }} />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: viewMode === 'calendar' ? '#5884FD' : '#ffffff',
                    color: viewMode === 'calendar' ? '#ffffff' : '#666666',
                    border: '2px solid #e8e8e8',
                  borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    letterSpacing: '-0.01em',
                    boxShadow: viewMode === 'calendar' ? '0 4px 12px rgba(88, 132, 253, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
                }}
                onMouseEnter={(e) => {
                    if (viewMode !== 'calendar') {
                      e.currentTarget.style.borderColor = '#C483D9';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 131, 217, 0.15)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (viewMode !== 'calendar') {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                  e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    }
                  }}
                >
                  <CalendarIcon style={{ width: '16px', height: '16px' }} />
                  Calendar
                </button>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#FFB333' }}>
                    <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
              </div>
                <div>
                  <div className="stat-number" style={{ color: '#FFB333' }}>{stats.total}</div>
                  <div className="stat-label" style={{ color: '#666666' }}>Total Tasks</div>
              </div>
              </div>
              <div className="stat-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <CheckCircleIcon style={{ width: '20px', height: '20px', color: '#10B981' }} />
                </div>
                <div>
                  <div className="stat-number" style={{ color: '#10B981' }}>{stats.completed}</div>
                  <div className="stat-label" style={{ color: '#666666' }}>Completed</div>
                </div>
              </div>
              <div className="stat-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#F87239' }}>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 7v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <div className="stat-number" style={{ color: '#F87239' }}>{stats.overdue}</div>
                  <div className="stat-label" style={{ color: '#666666' }}>Overdue</div>
                </div>
              </div>
              <div className="stat-card">
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem'
                }}>
                  <ClockIcon style={{ width: '20px', height: '20px', color: '#5884FD' }} />
                </div>
                <div>
                  <div className="stat-number" style={{ color: '#5884FD' }}>{stats.dueToday}</div>
                  <div className="stat-label" style={{ color: '#666666' }}>Due Today</div>
                </div>
              </div>
            </div>
          </header>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="filters-section">
            <div className="filters-grid">
              <div className="filter-group">
                <label className="filter-label">Search Tasks</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, description, project, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <MagnifyingGlassIcon 
                    style={{ 
                      position: 'absolute', 
                      right: '1rem', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      width: '18px', 
                      height: '18px', 
                      color: '#666666',
                      pointerEvents: 'none'
                    }} 
                  />
                </div>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Filter by Status</label>
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {FILTER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Filter by Priority</label>
                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_LEVELS.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="tasks-section">
            {viewMode === 'list' ? (
              // List View
              filteredTasks.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '16px',
                  padding: '4rem',
                  textAlign: 'center',
                  color: '#666666',
                  boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
                }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    background: '#f0f0f0',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem'
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#999999' }}>
                      <rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <rect x="13" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                    No tasks found
                  </h3>
                  <p style={{ fontSize: '1.1rem', margin: '0', lineHeight: '1.5', color: '#999999' }}>
                  {tasks.length === 0 
                    ? "You don't have any assigned tasks yet." 
                    : "No tasks match your current filters. Try adjusting your search or filters."
                  }
                  </p>
              </div>
            ) : (
              <div className="tasks-list">
                {filteredTasks.map((task) => {
                  const priorityConfig = getPriorityConfig(task.priority);
                  const statusConfig = getStatusConfig(task.status);
                  const daysUntilDue = getDaysUntilDue(task.due_date);
                  const overdue = isOverdue(task.due_date);
                  const urgent = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue > 0;
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`task-item ${overdue ? 'overdue' : urgent ? 'urgent' : ''}`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="task-header">
                        <div className="task-title-section">
                          <h3 className="task-title">{task.name}</h3>
                          <p className="task-project">{task.project.name}</p>
                        </div>
                        
                        <div className="task-actions">
                          <div 
                            className="priority-badge"
                            style={{ 
                              backgroundColor: priorityConfig.color + '20',
                              borderColor: priorityConfig.color,
                              color: priorityConfig.color
                            }}
                          >
                            <span>{priorityConfig.icon}</span>
                            <span>{priorityConfig.label}</span>
                          </div>
                          
                          <div 
                            className="status-badge"
                            style={{ 
                              backgroundColor: statusConfig.color,
                              borderColor: '#000000',
                              color: '#000000'
                            }}
                          >
                            <span>{statusConfig.icon}</span>
                            <span>{statusConfig.label}</span>
                          </div>
                          
                          <button
                            className="view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                            title="View Details"
                          >
                            <EyeIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="task-description">{task.description}</p>
                      )}
                      
                      <div className="task-meta">
                        {task.due_date && (
                          <div className={`task-meta-item ${overdue ? 'overdue' : ''}`}>
                            <CalendarIcon style={{ width: '14px', height: '14px' }} />
                            <span>{formatDate(task.due_date)}</span>
                            {overdue && <span style={{ fontWeight: 'bold' }}>(Overdue)</span>}
                            {urgent && (
                              <span style={{ fontWeight: 'bold' }}>({daysUntilDue}d left)</span>
                            )}
                          </div>
                        )}
                        
                        <div className="task-meta-item">
                          <UserIcon style={{ width: '14px', height: '14px' }} />
                          <span>Created by {task.created_by.name}</span>
                        </div>
                        
                        {(task.tags_list || []).length > 0 && (
                          <div className="task-meta-item">
                            <TagIcon style={{ width: '14px', height: '14px' }} />
                            <span>{(task.tags_list || []).slice(0, 3).join(', ')}</span>
                            {(task.tags_list || []).length > 3 && (
                              <span style={{ fontWeight: 'bold' }}>+{(task.tags_list || []).length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="task-actions-row">
                        {TASK_STATUSES.filter(s => s.value !== task.status).map(statusOption => (
                          <button
                            key={statusOption.value}
                            onClick={() => handleTaskStatusChange(task.id, statusOption.value)}
                            className="status-btn"
                            title={`Move to ${statusOption.label}`}
                          >
                            {statusOption.icon} {statusOption.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                </div>
              )
            ) : (
              // Calendar View
              <div style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
              }}>
                {/* Calendar Navigation */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '2rem',
                  padding: '0 1rem'
                }}>
                  <button
                    onClick={() => previousMonth()}
                    className="nav-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      background: '#ffffff',
                      border: '2px solid #e8e8e8',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      color: '#666666',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5884FD';
                      e.currentTarget.style.color = '#5884FD';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.color = '#666666';
                    }}
                  >
                    <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                  
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  
                  <button
                    onClick={() => nextMonth()}
                    className="nav-button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '44px',
                      height: '44px',
                      background: '#ffffff',
                      border: '2px solid #e8e8e8',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      color: '#666666',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#5884FD';
                      e.currentTarget.style.color = '#5884FD';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.color = '#666666';
                    }}
                  >
                    <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '1px', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#e5e7eb'
                }}>
                  {/* Day Headers */}
                  {daysOfWeek.map(day => (
                    <div key={day} style={{ 
                      padding: '1rem', 
                      background: '#f8f9fa', 
                      fontWeight: '600', 
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: '#374151'
                    }}>
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar Days */}
                  {renderCalendarGrid()}
                </div>
              </div>
            )}
          </div>

          {showTaskDetail && selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              users={users}
              onClose={handleCloseTaskDetail}
              onSave={handleUpdateTask}
              onStatusChange={handleTaskStatusChange}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
      </div>
    </div>
  );
} 