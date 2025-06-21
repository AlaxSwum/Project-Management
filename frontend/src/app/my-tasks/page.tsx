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
  DocumentIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import TaskDetailModal from '@/components/TaskDetailModal';

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
  assignee: User | null;
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
      setTaskComments([...taskComments, comment]);
      setNewComment('');
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
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
            background: #ffffff;
          }
          .my-tasks-container {
            min-height: 100vh;
            display: flex;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          }
          .main-content {
            flex: 1;
            margin-left: 256px;
            background: transparent;
          }
          .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-bottom: 2px solid #000000;
            padding: 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 20;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          .header-title {
            font-size: 1.875rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .header-subtitle {
            color: #666666;
            font-size: 0.95rem;
            font-weight: 500;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .stat-card {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            transition: all 0.2s ease;
          }
          .stat-card:hover {
            border-color: #000000;
            transform: translateY(-2px);
          }
          .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 0.25rem;
          }
          .stat-label {
            font-size: 0.8rem;
            color: #666666;
            font-weight: 500;
          }
          .filters-section {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            margin: 2rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .filters-grid {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 1rem;
            align-items: end;
          }
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .filter-label {
            font-weight: 600;
            color: #000000;
            font-size: 0.9rem;
          }
          .search-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            transition: all 0.2s ease;
          }
          .search-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .filter-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            transition: all 0.2s ease;
          }
          .filter-select:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
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
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }
          .task-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: #000000;
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
            font-weight: 600;
            color: #000000;
            font-size: 1.1rem;
            line-height: 1.4;
            margin-bottom: 0.5rem;
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
            border: 1px solid #000000;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
            background: #ffffff;
            color: #000000;
            font-weight: 500;
          }
          .status-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .view-btn {
            padding: 0.5rem;
            border: 1px solid #000000;
            border-radius: 6px;
            background: #ffffff;
            color: #000000;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .view-btn:hover {
            background: #f3f4f6;
            transform: scale(1.05);
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
            border: 2px solid #ef4444;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin: 2rem;
            font-weight: 500;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
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
              padding: 0.875rem;
              font-size: 1rem;
            }
            .filter-select {
              padding: 0.875rem;
              font-size: 1rem;
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
        <Sidebar 
          projects={allProjects} 
          onCreateProject={() => {}} 
        />
        
        <div className="main-content">
          <header className="header">
            <div className="header-content">
              <div>
                <h1 className="header-title">My Tasks</h1>
                <p className="header-subtitle">Manage all your assigned tasks</p>
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.total}</div>
                <div className="stat-label">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.completed}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.overdue}</div>
                <div className="stat-label">Overdue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.dueToday}</div>
                <div className="stat-label">Due Today</div>
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
                      right: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      width: '16px', 
                      height: '16px', 
                      color: '#9ca3af' 
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
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">□</div>
                <div className="empty-state-title">No tasks found</div>
                <div className="empty-state-text">
                  {tasks.length === 0 
                    ? "You don't have any assigned tasks yet." 
                    : "No tasks match your current filters. Try adjusting your search or filters."
                  }
                </div>
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
                        
                        {task.tags_list.length > 0 && (
                          <div className="task-meta-item">
                            <TagIcon style={{ width: '14px', height: '14px' }} />
                            <span>{task.tags_list.slice(0, 3).join(', ')}</span>
                            {task.tags_list.length > 3 && (
                              <span style={{ fontWeight: 'bold' }}>+{task.tags_list.length - 3} more</span>
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