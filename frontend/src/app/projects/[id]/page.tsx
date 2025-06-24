'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { 
  PlusIcon, 
  CalendarIcon,
  UserIcon,
  TagIcon,
  CheckCircleIcon,
  ListBulletIcon,
  Squares2X2Icon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import TaskDetailModal from '@/components/TaskDetailModal';
import ProjectMembersModal from '@/components/ProjectMembersModal';
import TodoListComponent from '@/components/TodoListComponent';

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
  assignee: User | null;
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

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'timeline' | 'gantt' | 'todo'>('board');
  const [ganttView, setGanttView] = useState<'task' | 'gantt'>('task');
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    // Start from the 1st day of current month
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDayOfMonth;
  });
  const [showCreateTask, setShowCreateTask] = useState(false);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState<number | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    assignee_id: 0,
    priority: 'medium',
    start_date: '',
    due_date: '',
    tags: ''
  });

  useEffect(() => {
    // Don't redirect if auth is still loading
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
      setError('Failed to fetch project');
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
      };

      if (newTask.assignee_id && newTask.assignee_id !== 0) {
        taskData.assignee_id = newTask.assignee_id;
      }

      if (newTask.start_date && newTask.start_date.trim() !== '') {
        taskData.start_date = newTask.start_date;
      }

      if (newTask.due_date && newTask.due_date.trim() !== '') {
        taskData.due_date = newTask.due_date;
      }

      if (newTask.tags && newTask.tags.trim() !== '') {
        taskData.tags = newTask.tags.trim();
      }
      
      const createdTask = await taskService.createTask(Number(params?.id), taskData);
      setTasks([...tasks, createdTask]);
      
      setNewTask({
        name: '',
        description: '',
        assignee_id: 0,
        priority: 'medium',
        start_date: '',
        due_date: '',
        tags: ''
      });
      setShowCreateTask(false);
      setError('');
    } catch (err: any) {
      setError('Failed to create task');
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
      
      // Update selectedTask if it's the one being updated
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      setError('Failed to update task status');
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

  const handleTaskClick = (task: Task, e: React.MouseEvent) => {
    // Don't open modal if we're in the middle of a drag operation
    if (draggedTask) return;
    
    e.stopPropagation();
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskDetail(false);
    setSelectedTask(null);
  };

  const handleMembersUpdate = async () => {
    // Refresh project data to get updated members
    await fetchProject();
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

  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(project!.id);
      router.push('/dashboard');
    } catch (err: any) {
      setError('Failed to delete project');
      setShowDeleteConfirm(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (draggedTask && draggedTask.status !== newStatus) {
      await handleTaskStatusChange(draggedTask.id, newStatus);
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_LEVELS.find(p => p.value === priority) || PRIORITY_LEVELS[1];
  };

  const getStatusConfig = (status: string) => {
    return TASK_STATUSES.find(s => s.value === status) || TASK_STATUSES[0];
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setMonth(newDate.getMonth() - 1, 1); // Go to 1st day of previous month
    setTimelineStartDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setMonth(newDate.getMonth() + 1, 1); // Go to 1st day of next month
    setTimelineStartDate(newDate);
  };

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

  if (!project) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000000', marginBottom: '1rem' }}>Project not found</h1>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: '#000000', color: '#ffffff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Back to Dashboard
          </button>
        </div>
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
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
            overflow-x: hidden;
            max-width: 100vw;
          }
          .project-container {
            min-height: 100vh;
            display: flex;
            background: #f8fafc;
            overflow-x: hidden;
            max-width: 100vw;
          }
          .main-content {
            flex: 1;
            margin-left: 256px;
            background: transparent;
            overflow-x: hidden;
            max-width: calc(100vw - 256px);
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
            text-transform: capitalize;
            font-size: 0.95rem;
            font-weight: 500;
          }
          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .action-buttons-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            min-width: 300px;
          }
          .action-btn {
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            font-size: 0.875rem;
          }
          .action-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .view-toggle {
            display: flex;
            align-items: center;
            background: #ffffff;
            border-radius: 8px;
            padding: 0.25rem;
            border: 2px solid #000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          
          .todo-view {
            padding: 2rem;
            background: #f8fafc;
            min-height: 600px;
          }
          
          .todo-container {
            max-width: 100%;
            margin: 0 auto;
          }
          .view-btn {
            padding: 0.5rem;
            border: none;
            background: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #666666;
          }
          .view-btn.active {
            background: #000000;
            color: #ffffff;
            transform: scale(1.05);
          }
          .members-btn {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
          }
          .members-btn:hover {
            background: #f9fafb;
          }
          .delete-btn {
            background: #ffffff;
            color: #ef4444;
            border: 2px solid #ef4444;
          }
          .delete-btn:hover {
            background: #ef4444;
            color: #ffffff;
          }
          .add-task-btn {
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            color: #ffffff;
            border: none;
          }
          .add-task-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
          .project-stats {
            display: flex;
            align-items: center;
            gap: 2rem;
            flex-wrap: wrap;
          }
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            color: #374151;
            font-weight: 500;
          }
          .members-display {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .members-avatars {
            display: flex;
            align-items: center;
            margin: 0 0.5rem;
          }
          .member-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
            position: relative;
            z-index: 1;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .member-avatar.more-members {
            background: #6b7280;
            font-size: 0.65rem;
            z-index: 0;
          }
          .members-count {
            font-size: 0.85rem;
            color: #6b7280;
            font-weight: 500;
          }
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .project-stats {
              display: none !important;
            }
            
            .stat-item {
              display: none !important;
            }
            
            .members-display {
              display: none !important;
            }
            
            .header {
              padding: 1rem 1rem 0.5rem 1rem;
              position: relative;
            }
            
            .header-title {
              font-size: 1.5rem;
              margin-bottom: 0.25rem;
            }
            
            .header-subtitle {
              font-size: 0.85rem;
              margin-bottom: 1rem;
            }
            
            .header-content {
              flex-direction: column;
              gap: 0;
              align-items: stretch;
            }
            
            .header-actions {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
              width: 100%;
            }
            
            .action-buttons-grid {
              order: 1;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.5rem;
              width: 100%;
              min-width: unset;
            }
            
            .view-toggle {
              order: 2;
              width: 100%;
              justify-content: center;
              padding: 0.25rem;
              background: #ffffff;
              border: 2px solid #000000;
              border-radius: 8px;
              margin-bottom: 0;
            }
            
            .view-btn {
              flex: 1;
              padding: 0.5rem 0.375rem;
              font-size: 0.75rem;
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 0.2rem;
              min-height: 50px;
            }
            
            .view-btn svg {
              width: 20px;
              height: 20px;
            }
            
            .view-btn.active {
              background: #000000;
              color: #ffffff;
            }
            
            .action-btn {
              padding: 0.875rem 0.5rem;
              font-size: 0.8rem;
              gap: 0.5rem;
              flex-direction: column;
              min-height: 60px;
            }
            
            .action-btn svg {
              width: 18px;
              height: 18px;
            }
            
            .members-btn {
              background: #ffffff;
              border: 2px solid #6b7280;
              color: #374151;
            }
            
            .delete-btn {
              background: #ffffff;
              border: 2px solid #ef4444;
              color: #ef4444;
            }
            
            .add-task-btn {
              background: #000000;
              color: #ffffff;
              border: 2px solid #000000;
              font-weight: 600;
            }
            

            

            
            .main-content-area {
              padding: 1rem;
            }
            
            .view-description {
              padding: 1rem;
              margin-bottom: 1rem;
            }
            
            .view-description h3 {
              font-size: 1.1rem;
              margin-bottom: 0.5rem;
            }
            
            .view-description p {
              font-size: 0.85rem;
              line-height: 1.4;
            }
            
            .board-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .status-column {
              padding: 1rem;
              min-height: auto;
            }
            
            .status-header {
              margin-bottom: 1rem;
              padding-bottom: 0.75rem;
            }
            
            .status-title {
              font-size: 1rem;
            }
            
            .status-count {
              padding: 0.25rem 0.75rem;
              font-size: 0.75rem;
            }
            
            .task-card {
              padding: 1rem;
              margin-bottom: 0.75rem;
              border-radius: 8px;
            }
            
            .task-title {
              font-size: 0.95rem;
              line-height: 1.3;
            }
            
            .task-meta-item {
              padding: 0.5rem;
              font-size: 0.8rem;
              border-radius: 4px;
            }
            
            .assignee-avatar {
              width: 20px;
              height: 20px;
              font-size: 0.65rem;
            }
            
            .modal-content {
              background: #ffffff;
              border: 2px solid #000000;
              padding: 2rem !important;
              width: 100%;
              max-width: 95vw;
              padding: 1.5rem !important;
              margin: 0.5rem;
              border-radius: 8px !important;
            }
            
            .modal-title {
              font-size: 1.25rem;
              margin-bottom: 1rem !important;
            }
            
            .form-group {
              margin-bottom: 1.25rem !important;
            }
            
            .form-label {
              font-size: 0.9rem;
              margin-bottom: 0.4rem !important;
            }
            
            .form-input, .form-textarea, .form-select {
              padding: 1rem;
              font-size: 1rem;
              border-radius: 6px;
            }
            
            .button-group {
              flex-direction: column;
              gap: 0.75rem;
              margin-top: 1.25rem !important;
            }
            
            .btn-primary, .btn-secondary {
              padding: 1rem;
              font-size: 1rem;
              border-radius: 6px;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem 0.75rem 0.25rem 0.75rem;
            }
            
            .project-stats {
              display: none !important;
            }
            
            .stat-item {
              display: none !important;
            }
            
            .members-display {
              display: none !important;
            }
            
            .header-title {
              font-size: 1.25rem;
              text-align: center;
            }
            
            .header-subtitle {
              font-size: 0.8rem;
              text-align: center;
              margin-bottom: 1rem;
            }
            
            .main-content-area {
              padding: 0.75rem;
            }
            
            .view-toggle {
              padding: 0.2rem;
              margin-bottom: 0;
            }
            
            .view-btn {
              padding: 0.5rem 0.25rem;
              font-size: 0.7rem;
              min-height: 45px;
              gap: 0.15rem;
            }
            
            .view-btn svg {
              width: 16px;
              height: 16px;
            }
            
            .action-btn {
              padding: 0.75rem 0.375rem;
              font-size: 0.75rem;
              gap: 0.375rem;
              min-height: 55px;
            }
            
            .action-btn svg {
              width: 16px;
              height: 16px;
            }
            
            .project-stats {
              gap: 0.5rem;
              padding: 0.75rem;
              margin-top: 0.75rem;
            }
            

            
            .view-description {
              padding: 0.75rem;
            }
            
            .view-description h3 {
              font-size: 1rem;
            }
            
            .view-description p {
              font-size: 0.8rem;
            }
            
            .status-column {
              padding: 0.75rem;
            }
            
            .status-title {
              font-size: 0.9rem;
            }
            
            .task-card {
              padding: 0.75rem;
            }
            
            .task-title {
              font-size: 0.9rem;
            }
            
            .task-meta-item {
              padding: 0.375rem;
              font-size: 0.75rem;
            }
            
            .assignee-avatar {
              width: 18px;
              height: 18px;
              font-size: 0.6rem;
            }
            
            .modal-content {
              max-width: 98vw;
              padding: 1.25rem !important;
              margin: 0.25rem;
            }
            
            .modal-title {
              font-size: 1.1rem;
              margin-bottom: 0.75rem !important;
            }
            
            .form-group {
              margin-bottom: 1rem !important;
            }
            
            .form-input, .form-textarea, .form-select {
              padding: 0.875rem;
              font-size: 0.9rem;
              border-radius: 6px;
            }
            
            .button-group {
              gap: 0.625rem;
              margin-top: 1rem !important;
            }
            
            .btn-primary, .btn-secondary {
              padding: 0.875rem;
              font-size: 0.9rem;
              border-radius: 6px;
            }
          }
          
          /* Ultra-small mobile screens */
          @media (max-width: 360px) {
            .header {
              padding: 0.5rem;
            }
            
            .header-title {
              font-size: 1.1rem;
            }
            
            .header-subtitle {
              font-size: 0.75rem;
            }
            
            .main-content-area {
              padding: 0.5rem;
            }
            
            .view-toggle {
              padding: 0.2rem;
            }
            
            .view-btn {
              padding: 0.5rem 0.25rem;
              font-size: 0.7rem;
              min-height: 45px;
            }
            
            .view-btn svg {
              width: 14px;
              height: 14px;
            }
            
            .members-btn, .delete-btn, .add-task-btn {
              padding: 0.75rem;
              font-size: 0.8rem;
            }
            
            .project-stats {
              padding: 0.5rem;
            }
            
            .stat-item {
              padding: 0.5rem;
              font-size: 0.75rem;
            }
            
            .view-description {
              padding: 0.5rem;
            }
            
            .status-column {
              padding: 0.5rem;
            }
            
            .task-card {
              padding: 0.5rem;
            }
            
            .modal-content {
              padding: 1rem;
              margin: 0.1rem;
            }
          }
          
          .project-stats {
            display: flex;
            align-items: center;
            gap: 2rem;
            font-size: 0.9rem;
            color: #666666;
          }
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.8);
            padding: 0.5rem 1rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .main-content-area {
            padding: 2rem;
            overflow-x: auto;
            max-width: 100%;
          }
          .error-message {
            background: #ffffff;
            border: 2px solid #ef4444;
            color: #dc2626;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-weight: 500;
            box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.1);
          }
          .board-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            min-height: 600px;
          }
          .status-column {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            min-height: 600px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .status-column.drag-over {
            border-color: #3b82f6;
            background: #eff6ff;
            transform: scale(1.02);
            box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.1), 0 4px 6px -2px rgba(59, 130, 246, 0.05);
          }
          .status-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #f3f4f6;
          }
          .status-title-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .status-icon {
            font-size: 1.25rem;
          }
          .status-title {
            font-weight: 700;
            color: #000000;
            font-size: 1.1rem;
          }
          .status-count {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #000000;
            min-width: 24px;
            text-align: center;
          }
          .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-height: 400px;
          }
          .task-card {
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 1rem;
            cursor: grab;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            min-height: 80px;
          }
          .task-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            border-color: #000000;
          }
          .task-card:active {
            cursor: grabbing;
          }
          .task-card.dragging {
            opacity: 0.5;
            transform: rotate(5deg);
          }
          .task-header {
            margin-bottom: 0.75rem;
          }
          .task-title {
            font-weight: 600;
            color: #000000;
            font-size: 1rem;
            line-height: 1.4;
            flex: 1;
            margin-right: 0.5rem;
          }
          .task-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .task-priority {
            font-size: 1.1rem;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
          }
          .task-menu-btn {
            background: none;
            border: none;
            padding: 0.25rem;
            border-radius: 4px;
            cursor: pointer;
            color: #9ca3af;
            transition: all 0.2s ease;
          }
          .task-menu-btn:hover {
            background: #f3f4f6;
            color: #000000;
          }
          .task-description {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 1rem;
            line-height: 1.5;
          }
          .task-meta {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .task-meta-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8rem;
            color: #6b7280;
            background: #f9fafb;
            padding: 0.5rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .task-meta-item.overdue {
            background: #fef2f2;
            border-color: #fecaca;
            color: #dc2626;
            animation: pulse 2s infinite;
          }
          .task-meta-item.urgent {
            background: #fff7ed;
            border-color: #fed7aa;
            color: #ea580c;
          }
          .assignee-avatar {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 600;
            color: #000000;
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
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            padding: 2rem !important;
            width: 100%;
            max-width: 600px;
            border-radius: 12px !important;
            max-height: 90vh;
            height: auto;
            overflow-y: auto !important;
            overflow-x: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideIn 0.3s ease-out;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            /* Enhanced scrolling support for all devices */
            -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
            scrollbar-width: thin; /* Firefox */
            scrollbar-color: #000000 #f1f1f1; /* Firefox */
          }
          /* Custom scrollbar styling for webkit browsers */
          .modal-content::-webkit-scrollbar {
            width: 8px;
          }
          .modal-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          .modal-content::-webkit-scrollbar-thumb {
            background: #000000;
            border-radius: 4px;
          }
          .modal-content::-webkit-scrollbar-thumb:hover {
            background: #333333;
          }
          /* Enhanced mobile support */
          @media (max-width: 768px) {
            .modal-content {
              max-height: 95vh !important;
              margin: 0.5rem;
              padding: 1.5rem !important;
              max-width: calc(100vw - 1rem);
            }
          }
          @media (max-height: 600px) {
            .modal-content {
              max-height: 98vh !important;
              padding: 1rem !important;
            }
          }
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
            margin-bottom: 1.5rem !important;
            text-align: center;
          }
          /* Enhanced form layout for scrollable modal */
          .modal-content form {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0; /* Allow shrinking */
          }
          .form-group {
            margin-bottom: 1.5rem !important;
            flex-shrink: 0; /* Prevent form groups from shrinking */
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem !important;
            font-size: 0.9rem;
          }
          .form-input {
            width: 100%;
            padding: 0.875rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            transition: all 0.2s ease;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            background: #f9fafb;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .form-textarea {
            width: 100%;
            padding: 0.875rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            resize: vertical;
            font-family: inherit;
            transition: all 0.2s ease;
          }
          .form-textarea:focus {
            outline: none;
            border-color: #000000;
            background: #f9fafb;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .form-select {
            width: 100%;
            padding: 0.875rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            transition: all 0.2s ease;
          }
          .form-select:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem !important;
            flex-shrink: 0; /* Keep buttons at bottom */
            position: sticky;
            bottom: 0;
            background: #ffffff;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          .btn-primary {
            flex: 1;
            background: linear-gradient(135deg, #000000 0%, #333333 100%);
            color: #ffffff;
            border: none;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
          }
          .btn-secondary {
            flex: 1;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-secondary:hover {
            background: #f9fafb;
            transform: translateY(-1px);
          }
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem 1rem;
            text-align: center;
            color: #9ca3af;
            font-style: italic;
          }

          /* View Description Styles */
          .view-description {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .view-description h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin: 0 0 0.5rem 0;
          }
          .view-description p {
            font-size: 0.9rem;
            color: #6b7280;
            margin: 0;
            line-height: 1.5;
          }

          /* View Container Styles */
          .board-view, .list-view, .timeline-view, .gantt-view {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }

          /* Timeline View Styles */
          .timeline-view {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          .timeline-header-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .timeline-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
          }
          .stat-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            margin-bottom: 0.25rem;
            font-weight: 500;
          }
          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #000000;
          }
          .timeline-grid {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .timeline-grid-header {
            display: grid;
            grid-template-columns: 300px 1fr;
            background: #f8fafc;
            border-bottom: 2px solid #000000;
            font-weight: 600;
            color: #000000;
          }
          .timeline-task-column, .timeline-chart-column {
            padding: 1rem 1.5rem;
            border-right: 1px solid #e5e7eb;
          }
          .timeline-chart-column {
            border-right: none;
          }
          .timeline-grid-body {
            min-height: 400px;
          }
          .timeline-row {
            display: grid;
            grid-template-columns: 300px 1fr;
            border-bottom: 1px solid #e5e7eb;
            align-items: center;
            min-height: 80px;
          }
          .timeline-row:last-child {
            border-bottom: none;
          }
          .timeline-task-info {
            padding: 1rem 1.5rem;
            border-right: 1px solid #e5e7eb;
          }
          .task-name {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .task-details {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
          .task-status-badge {
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
            border: 1px solid;
          }
          .status-todo { background: #f3f4f6; color: #374151; border-color: #d1d5db; }
          .status-in_progress { background: #dbeafe; color: #1e40af; border-color: #3b82f6; }
          .status-review { background: #fef3c7; color: #92400e; border-color: #f59e0b; }
          .status-done { background: #d1fae5; color: #065f46; border-color: #10b981; }
          .task-assignee {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .assignee-avatar-sm {
            width: 16px;
            height: 16px;
            background: #f3f4f6;
            border: 1px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: 600;
            color: #000000;
          }
          .task-priority {
            font-size: 0.75rem;
            padding: 0.1rem 0.3rem;
            border-radius: 8px;
            text-transform: capitalize;
          }
          .priority-low { background: #d1fae5; color: #065f46; }
          .priority-medium { background: #fef3c7; color: #92400e; }
          .priority-high { background: #fecaca; color: #991b1b; }
          .priority-urgent { background: #fecaca; color: #991b1b; font-weight: 600; }
          .timeline-chart {
            padding: 1rem 1.5rem;
            position: relative;
          }
          .timeline-bar-container {
            position: relative;
          }
          .timeline-bar {
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
            border: 1px solid #d1d5db;
          }
          .timeline-progress {
            height: 100%;
            border-radius: 10px;
            transition: all 0.3s ease;
            position: relative;
          }
          .timeline-dates {
            display: flex;
            justify-content: space-between;
            margin-top: 0.5rem;
            font-size: 0.7rem;
            color: #6b7280;
          }
          .due-date.overdue {
            color: #dc2626;
            font-weight: 600;
          }

          /* Gantt Chart Styles */
          .gantt-view {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin-bottom: 2rem;
            background: #ffffff;
            padding: 1rem;
            border-radius: 8px;
            border: 2px solid #000000;
          }
          .gantt-header-controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #ffffff;
            padding: 1rem;
            border-radius: 6px;
            border: 2px solid #000000;
          }
          .gantt-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .gantt-btn {
            background: #000000;
            color: #ffffff;
            border: 2px solid #000000;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .gantt-btn:hover {
            background: #ffffff;
            color: #000000;
            transform: translateY(-1px);
          }
          .date-range-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #ffffff;
            padding: 0.25rem;
            border-radius: 4px;
            border: 2px solid #000000;
          }
          .nav-btn {
            background: #ffffff;
            color: #000000;
            border: 1px solid #000000;
            padding: 0.5rem;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nav-btn:hover {
            background: #000000;
            color: #ffffff;
          }
          .date-range {
            font-weight: 600;
            color: #000000;
            min-width: 150px;
            text-align: center;
            font-size: 0.9rem;
          }
          .gantt-chart {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .gantt-sidebar {
            width: 300px;
            border-right: 2px solid #000000;
            background: #f8fafc;
          }
          .gantt-sidebar-header {
            padding: 1rem 1.5rem;
            font-weight: 600;
            color: #000000;
            border-bottom: 2px solid #000000;
            background: #ffffff;
          }
          .gantt-tasks {
            min-height: 400px;
          }
          .gantt-task-row {
            border-bottom: 1px solid #e5e7eb;
            padding: 1rem 1.5rem;
            min-height: 60px;
            display: flex;
            align-items: center;
          }
          .gantt-task-row:last-child {
            border-bottom: none;
          }
          .gantt-task-info {
            width: 100%;
          }
          .gantt-task-name {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.25rem;
            font-size: 0.9rem;
          }
          .gantt-task-meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .assignee-avatar-xs {
            width: 14px;
            height: 14px;
            background: #ffffff;
            border: 1px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.5rem;
            font-weight: 600;
            color: #000000;
          }
          .priority-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            border: 1px solid #000000;
          }
          .priority-dot.priority-low { background: #10b981; }
          .priority-dot.priority-medium { background: #f59e0b; }
          .priority-dot.priority-high { background: #ef4444; }
          .priority-dot.priority-urgent { background: #dc2626; }
          .gantt-timeline {
            flex: 1;
            background: #ffffff;
          }
          .gantt-timeline-header {
            border-bottom: 2px solid #000000;
            background: #f8fafc;
            padding: 1rem;
          }
          .gantt-dates {
            display: grid;
            grid-template-columns: repeat(30, 1fr);
            gap: 0.25rem;
            text-align: center;
            font-size: 0.75rem;
            font-weight: 500;
            color: #000000;
          }
          .gantt-date {
            padding: 0.25rem;
            border-radius: 4px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
          }
          .gantt-bars {
            padding: 1rem;
            min-height: 400px;
          }
          .gantt-bar-row {
            margin-bottom: 1rem;
            height: 40px;
            display: flex;
            align-items: center;
          }
          .gantt-bar {
            height: 24px;
            border-radius: 12px;
            position: relative;
            min-width: 60px;
            border: 2px solid #000000;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
          }
          .gantt-bar:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .gantt-bar-content {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 0.5rem;
          }
          .gantt-bar-text {
            font-size: 0.75rem;
            font-weight: 600;
            color: #000000;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
          }
          .gantt-bar-duration {
            font-size: 0.65rem;
            font-weight: 500;
            color: #374151;
            white-space: nowrap;
            margin-left: 0.25rem;
          }

          /* Enhanced Gantt Chart Styles - Simple Black & White */
          .gantt-chart-enhanced {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            margin-top: 1rem;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
          }
          
          .gantt-sidebar-enhanced {
            width: 350px;
            min-width: 350px;
            border-right: 2px solid #000000;
            background: #ffffff;
            display: flex;
            flex-direction: column;
          }
          
          .gantt-sidebar-header-enhanced {
            display: grid;
            grid-template-columns: 2fr 80px 80px;
            gap: 0;
            background: #000000;
            font-weight: 600;
            color: #ffffff;
            border-bottom: 2px solid #000000;
          }
          
          .task-header-cell, .duration-header-cell, .assignee-header-cell {
            background: #000000;
            padding: 0.75rem;
            font-size: 0.8rem;
            text-align: center;
            border-right: 1px solid #ffffff;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #ffffff;
          }
          
          .task-header-cell {
            text-align: left;
            padding-left: 1rem;
          }
          
          .gantt-tasks-enhanced {
            flex: 1;
            overflow-y: auto;
            min-height: 200px;
          }
          
          .gantt-empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #6b7280;
          }
          
          .gantt-task-row-enhanced {
            border-bottom: 1px solid #000000;
            background: #ffffff;
            transition: all 0.2s ease;
          }
          
          .gantt-task-row-enhanced:hover {
            background: #f0f0f0;
          }
          
          .gantt-task-info-enhanced {
            display: grid;
            grid-template-columns: 2fr 80px 80px;
            gap: 0;
            align-items: center;
            min-height: 60px;
            padding: 0.5rem 0;
          }
          
          .gantt-task-name-enhanced {
            padding: 0 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex: 1;
            overflow: visible;
            white-space: nowrap;
          }
          
          .task-title {
            font-weight: 600;
            color: #000000;
            font-size: 0.85rem;
            flex: 1;
            overflow: visible;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 180px;
          }
          
          .task-status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 2px;
            border: 1px solid #9ca3af;
            flex-shrink: 0;
            position: relative;
          }
          
          .task-status-indicator.status-todo { 
            background: #ffffff; 
            border-style: dashed;
          }
          .task-status-indicator.status-in_progress { 
            background: #6b7280; 
            border-radius: 50%;
          }
          .task-status-indicator.status-review { 
            background: #374151;
            border-radius: 2px;
          }
          .task-status-indicator.status-done { 
            background: #111827;
            border-radius: 2px;
          }
          
          .priority-indicator {
            width: 16px;
            height: 2px;
            flex-shrink: 0;
            background: #d1d5db;
            position: relative;
          }
          
          .priority-indicator.priority-low { 
            width: 8px;
            background: #9ca3af;
          }
          .priority-indicator.priority-medium { 
            width: 12px;
            background: #6b7280;
          }
          .priority-indicator.priority-high { 
            width: 16px;
            background: #374151;
          }
          .priority-indicator.priority-urgent { 
            width: 16px;
            background: #111827;
            height: 3px;
          }
          
          .gantt-task-duration {
            text-align: center;
            font-size: 0.8rem;
            color: #6b7280;
            font-weight: 500;
            padding: 0 0.5rem;
          }
          
          .gantt-task-assignee {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 0 0.5rem;
          }
          
          .assignee-avatar-enhanced {
            width: 20px;
            height: 20px;
            background: #f3f4f6;
            border: 1px solid #9ca3af;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.6rem;
            font-weight: 700;
            color: #374151;
          }
          
          .unassigned {
            color: #9ca3af;
            font-size: 0.8rem;
          }
          
          .gantt-timeline-enhanced {
            flex: 1;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            overflow-x: auto;
            overflow-y: hidden;
            max-width: 100%;
            min-width: 0;
            position: relative;
            box-sizing: border-box;
          }
          
          .gantt-timeline-header-enhanced {
            border-bottom: 2px solid #000000;
            background: #ffffff;
          }
          
          .gantt-month-header {
            background: #000000;
            border-bottom: 2px solid #000000;
            padding: 0.75rem 1rem;
            text-align: center;
          }
          
          .month-label {
            font-weight: 600;
            color: #ffffff;
            font-size: 1rem;
            letter-spacing: 0.05em;
          }
          
          .gantt-week-headers {
            display: flex;
            background: #f0f0f0;
            border-bottom: 2px solid #000000;
            min-width: max-content;
          }
          
          .week-header {
            padding: 0.5rem;
            text-align: center;
            font-size: 0.7rem;
            font-weight: 600;
            color: #000000;
            border-right: 1px solid #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #f0f0f0;
            min-width: 200px;
            flex: 0 0 200px;
          }
          
          .week-header:last-child {
            border-right: none;
          }
          
          .gantt-date-grid {
            display: flex;
            background: #ffffff;
            min-width: max-content;
          }
          
          .gantt-date-cell {
            padding: 0.5rem 0.25rem;
            text-align: center;
            border-right: 1px solid #000000;
            transition: background-color 0.2s ease;
            min-width: 40px;
            flex: 0 0 40px;
          }
          
          .gantt-date-cell:last-child {
            border-right: none;
          }
          
          .gantt-date-cell.today {
            background: #000000;
            color: #ffffff;
            font-weight: 700;
          }
          
          .gantt-date-cell.weekend {
            background: #f0f0f0;
            opacity: 0.7;
            color: #666666;
          }
          
          .date-number {
            font-size: 0.85rem;
            font-weight: 600;
            color: #111827;
            line-height: 1;
          }
          
          .date-day {
            font-size: 0.55rem;
            color: #9ca3af;
            text-transform: uppercase;
            margin-top: 0.2rem;
            letter-spacing: 0.05em;
          }
          
          .gantt-grid-container {
            flex: 1;
            position: relative;
            overflow-y: auto;
            overflow-x: visible;
            background: #ffffff;
            width: 100%;
          }
          
          .gantt-vertical-grid {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: grid;
            grid-template-columns: repeat(30, 1fr);
            pointer-events: none;
            z-index: 1;
          }
          
          .grid-line-vertical {
            border-right: 1px solid #f3f4f6;
            height: 100%;
          }
          
          .grid-line-vertical:nth-child(7n) {
            border-right: 1px solid #e5e7eb;
          }
          
          .gantt-bars-enhanced {
            position: relative;
            z-index: 2;
            padding: 0.5rem;
            min-height: 200px;
          }
          
          .gantt-bars-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100px;
            color: #6b7280;
          }
          
          .gantt-bar-row-enhanced {
            margin-bottom: 0.5rem;
            height: 40px;
            position: relative;
          }
          
          .gantt-horizontal-grid-line {
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            border-top: 1px solid #f3f4f6;
            z-index: 1;
          }
          
          .gantt-bar-enhanced {
            height: 24px;
            border-radius: 4px;
            position: relative;
            min-width: 60px;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s ease;
            cursor: pointer;
            z-index: 3;
            overflow: hidden;
          }
          
          .gantt-bar-enhanced:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-color: #9ca3af;
          }
          
          .gantt-bar-enhanced.status-todo {
            background: #ffffff;
            border-style: dashed;
            border-color: #000000;
            border-width: 2px;
          }
          
          .gantt-bar-enhanced.status-in_progress {
            background: #f0f0f0;
            border-color: #000000;
            border-width: 2px;
          }
          
          .gantt-bar-enhanced.status-review {
            background: #e0e0e0;
            border-color: #000000;
            border-width: 2px;
          }
          
          .gantt-bar-enhanced.status-done {
            background: #000000;
            border-color: #000000;
            border-width: 2px;
          }
          
          .gantt-bar-enhanced.overdue {
            border-color: #000000 !important;
            background: #f0f0f0 !important;
            border-width: 3px;
            border-style: solid !important;
          }
          
          .gantt-bar-content-enhanced {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 0.5rem;
            position: relative;
            z-index: 2;
          }
          
          .gantt-bar-fill {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            border-radius: 2px;
            background: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 2px,
              rgba(0, 0, 0, 0.2) 2px,
              rgba(0, 0, 0, 0.2) 4px
            );
            z-index: 1;
          }
          
          .gantt-bar-text-enhanced {
            font-size: 0.65rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            z-index: 2;
            position: relative;
          }
          
          .gantt-bar-enhanced.status-done .gantt-bar-text-enhanced {
            color: #ffffff;
          }
          
          .gantt-bar-enhanced.status-todo .gantt-bar-text-enhanced,
          .gantt-bar-enhanced.status-in_progress .gantt-bar-text-enhanced,
          .gantt-bar-enhanced.status-review .gantt-bar-text-enhanced {
            color: #000000;
          }
          
          .gantt-bar-duration-enhanced {
            font-size: 0.55rem;
            font-weight: 500;
            white-space: nowrap;
            margin-left: 0.25rem;
            z-index: 2;
            position: relative;
            padding: 0 0.2rem;
            border-radius: 2px;
            border: 1px solid #000000;
            background: #ffffff;
            color: #000000;
          }
          
          .overdue-indicator {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #111827;
            color: #ffffff;
            border-radius: 2px;
            width: 12px;
            height: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.5rem;
            z-index: 4;
            font-weight: 700;
          }
          
          .gantt-legend {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1.5rem;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
          }
          
          .legend-section h4 {
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            margin: 0 0 0.75rem 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #000000;
            padding-bottom: 0.5rem;
          }
          
          .legend-items {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.75rem;
            color: #000000;
            padding: 0.25rem 0.5rem;
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #000000;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .legend-item:hover {
            background: #f0f0f0;
          }
          
          .legend-color {
            width: 12px;
            height: 12px;
            border-radius: 2px;
            border: 1px solid #d1d5db;
            flex-shrink: 0;
          }
          
          .legend-priority-dot {
            width: 12px;
            height: 2px;
            flex-shrink: 0;
            background: #d1d5db;
          }
          
          .progress-example {
            width: 24px;
            height: 8px;
            background: #f3f4f6;
            border-radius: 4px;
            overflow: hidden;
            position: relative;
          }
          
          .progress-bar {
            height: 100%;
            border-radius: 4px;
          }
          
          .overdue-example {
            font-size: 0.8rem;
          }

          @media (max-width: 1200px) {
            .board-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            .timeline-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            .timeline-grid-header, .timeline-row {
              grid-template-columns: 250px 1fr;
            }
            .gantt-sidebar {
              width: 250px;
            }
          }
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            .board-grid {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            .header {
              padding: 1rem;
            }
            .main-content-area {
              padding: 1rem;
            }
            .timeline-stats {
              grid-template-columns: 1fr;
            }
            .timeline-grid-header, .timeline-row {
              grid-template-columns: 1fr;
            }
            .timeline-task-info {
              border-right: none;
              border-bottom: 1px solid #e5e7eb;
            }
            .gantt-chart {
              flex-direction: column;
            }
            .gantt-sidebar {
              width: 100%;
              border-right: none;
              border-bottom: 2px solid #000000;
            }
            .gantt-chart-enhanced {
              flex-direction: column;
            }
            .gantt-sidebar-enhanced {
              width: 100%;
              border-right: none;
              border-bottom: 2px solid #000000;
            }
            .gantt-sidebar-header-enhanced {
              grid-template-columns: 2fr 1fr 1fr;
            }
            .gantt-task-info-enhanced {
              grid-template-columns: 2fr 1fr 1fr;
            }
            .gantt-week-headers {
              grid-template-columns: repeat(2, 1fr);
            }
            .gantt-legend {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
        `
      }} />
      
      <div className="project-container">
      <Sidebar 
        projects={allProjects} 
          onCreateProject={() => {}} 
        />
        
        <div className="main-content">
          <header className="header">
            <div className="header-content">
                <div>
                <h1 className="header-title">{project.name}</h1>
                <p className="header-subtitle">{project.project_type} • {project.status}</p>
              </div>
              
              <div className="header-actions">
                <div className="action-buttons-grid">
                  <button
                    onClick={() => setShowMembersModal(true)}
                    className="action-btn members-btn"
                  >
                    <UserIcon style={{ width: '16px', height: '16px' }} />
                    Members
                  </button>
                  
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="action-btn delete-btn"
                  >
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                    Delete
                  </button>
                  
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="action-btn add-task-btn"
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add Task
                  </button>
                </div>

                <div className="view-toggle">
                  <button
                    onClick={() => setViewMode('board')}
                    className={`view-btn ${viewMode === 'board' ? 'active' : ''}`}
                    title="Board View"
                  >
                    <Squares2X2Icon style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    title="List View"
                  >
                    <ListBulletIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={`view-btn ${viewMode === 'timeline' ? 'active' : ''}`}
                    title="Timeline View"
                  >
                    <ClockIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => setViewMode('gantt')}
                    className={`view-btn ${viewMode === 'gantt' ? 'active' : ''}`}
                    title="Gantt Chart"
                  >
                    <ChartBarIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                  <button
                    onClick={() => setViewMode('todo')}
                    className={`view-btn ${viewMode === 'todo' ? 'active' : ''}`}
                    title="To Do List"
                  >
                    <ClipboardDocumentListIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="project-stats">
              <div className="stat-item">
                <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                {project.completed_task_count} / {project.task_count} tasks completed
              </div>
              <div className="stat-item members-display">
                <UserIcon style={{ width: '16px', height: '16px' }} />
                <div className="members-avatars">
                  {(project.members || []).slice(0, 5).map((member, index) => (
                    <div 
                      key={member.id} 
                      className="member-avatar"
                      title={member.name}
                      style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(project.members || []).length > 5 && (
                    <div className="member-avatar more-members" title={`+${(project.members || []).length - 5} more members`}>
                      +{(project.members || []).length - 5}
                    </div>
                  )}
                </div>
                <span className="members-count">{(project.members || []).length} members</span>
              </div>
            </div>
        </header>

      {error && (
            <div style={{ padding: '2rem 2rem 0 2rem' }}>
              <div className="error-message">
                {error}
          </div>
        </div>
      )}

          <main className="main-content-area">
        {viewMode === 'board' && (
          <div className="board-view">
            <div className="view-description">
              <h3>Board View</h3>
              <p>Kanban-style board with drag-and-drop functionality. Organize tasks by status and track progress visually across columns.</p>
            </div>
            
              <div className="board-grid">
            {TASK_STATUSES.map((status) => {
              const statusTasks = getTasksByStatus(status.value);
              return (
                    <div 
                      key={status.value} 
                      className={`status-column ${dragOverColumn === status.value ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(e, status.value)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, status.value)}
                    >
                      <div className="status-header">
                        <div className="status-title-wrapper">
                          <h3 className="status-title">{status.label}</h3>
                        </div>
                        <span className="status-count">
                      {statusTasks.length}
                    </span>
                  </div>
                  
                      <div className="tasks-list">
                        {statusTasks.length === 0 ? (
                          <div className="empty-state">
                            <p>No tasks yet</p>
                          </div>
                        ) : (
                          statusTasks.map((task) => {
                      const priorityConfig = getPriorityConfig(task.priority);
                            const daysUntilDue = getDaysUntilDue(task.due_date);
                      const overdue = isOverdue(task.due_date);
                      
                      return (
                        <div
                          key={task.id}
                                className={`task-card ${draggedTask?.id === task.id ? 'dragging' : ''}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task)}
                                onDragEnd={() => setDraggedTask(null)}
                                onClick={(e) => handleTaskClick(task, e)}
                              >
                                <div className="task-header">
                                  <h4 className="task-title">{task.name}</h4>
                          </div>
                              
                              {task.assignee && (
                                    <div className="task-meta-item" style={{ marginTop: '0.5rem' }}>
                                      <div className="assignee-avatar">
                                        {task.assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{task.assignee.name}</span>
                                </div>
                              )}
                        </div>
                      );
                          })
                        )}
                  </div>
                </div>
              );
            })}
          </div>
                                </div>
                              )}
                              
        {viewMode === 'list' && (
          <div className="list-view">
            <div className="view-description">
              <h3>List View</h3>
              <p>View all tasks in a sortable table format with advanced filtering options. Perfect for detailed task management and bulk operations.</p>
            </div>
            
            <div style={{ background: '#ffffff', border: '2px solid #000000', borderRadius: '12px', padding: '2rem' }}>
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#000000', margin: '0 0 1rem 0' }}>List View Coming Soon!</h3>
                <p style={{ fontSize: '1rem', margin: '0' }}>Table view with sorting and filtering will be available here.</p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'timeline' && (
          <div className="timeline-view">
            <div className="view-description">
              <h3>Timeline View</h3>
              <p>Track task progress over time with visual progress bars. See start dates, due dates, completion status, and identify overdue tasks at a glance.</p>
                                    </div>
            
            <div className="timeline-header-controls">
              <div className="timeline-stats">
                <div className="stat-card">
                  <div className="stat-label">Total Tasks</div>
                  <div className="stat-value">{tasks.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{tasks.filter(t => t.status === 'done').length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">In Progress</div>
                  <div className="stat-value">{tasks.filter(t => t.status === 'in_progress').length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Overdue</div>
                  <div className="stat-value">{tasks.filter(t => isOverdue(t.due_date)).length}</div>
                </div>
              </div>
            </div>

            <div className="timeline-grid">
              <div className="timeline-grid-header">
                <div className="timeline-task-column">Task</div>
                <div className="timeline-chart-column">Timeline</div>
              </div>
              
              <div className="timeline-grid-body">
                {tasks.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                    No tasks available
                  </div>
                ) : (
                  tasks.map((task) => {
                    const startDate = task.start_date ? new Date(task.start_date) : new Date();
                    const dueDate = task.due_date ? new Date(task.due_date) : null;
                    const progress = task.status === 'done' ? 100 : 
                                   task.status === 'review' ? 80 :
                                   task.status === 'in_progress' ? 50 : 10;
                    
                    return (
                      <div key={task.id} className="timeline-row">
                        <div className="timeline-task-info">
                          <div className="task-name">{task.name}</div>
                          <div className="task-details">
                            <span className={`task-status-badge status-${task.status}`}>
                              {TASK_STATUSES.find(s => s.value === task.status)?.label}
                            </span>
                            {task.assignee && (
                              <span className="task-assignee">
                                <div className="assignee-avatar-sm">
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                {task.assignee.name}
                              </span>
                            )}
                            <span className={`task-priority priority-${task.priority}`}>
                              {task.priority}
                            </span>
                          </div>
                                </div>

                        <div className="timeline-chart">
                          <div className="timeline-bar-container">
                            <div 
                              className="timeline-bar"
                                      style={{
                                backgroundColor: getStatusConfig(task.status).color,
                                width: `${Math.max(progress, 5)}%`
                              }}
                            >
                              <div 
                                className="timeline-progress"
                                style={{ 
                                  width: `${progress}%`,
                                  backgroundColor: task.status === 'done' ? '#10b981' : '#3b82f6'
                                }}
                              />
                            </div>
                            <div className="timeline-dates">
                              <span className="start-date">
                                {startDate.toLocaleDateString()}
                              </span>
                              {dueDate && (
                                <span className={`due-date ${isOverdue(task.due_date) ? 'overdue' : ''}`}>
                                  Due: {dueDate.toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                                </div>
                        </div>
                      );
                          })
                        )}
                  </div>
            </div>
            
            <div className="timeline-info">
              <div className="info-card" style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '8px', padding: '1rem', margin: '1rem 0' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#15803d', margin: '0 0 0.5rem 0' }}>📊 Progress Indicators</h4>
                <p style={{ fontSize: '0.8rem', margin: '0', color: '#15803d', lineHeight: '1.4' }}>
                  Progress bars show completion status: <strong>To Do (10%)</strong>, <strong>In Progress (50%)</strong>, 
                  <strong>Review (80%)</strong>, <strong>Done (100%)</strong>. Overdue tasks are highlighted in red.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'gantt' && (
          <div className="gantt-view">
            {/* Tab Navigation */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginBottom: '2rem', 
              padding: '0 2rem',
              borderBottom: '2px solid #e5e7eb'
            }}>
              <button
                onClick={() => setGanttView('task')}
                style={{
                  padding: '1rem 2rem',
                  border: '3px solid #000000',
                  background: ganttView === 'task' ? '#000000' : '#ffffff',
                  color: ganttView === 'task' ? '#ffffff' : '#000000',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: ganttView === 'task' ? '3px solid #000000' : '3px solid #000000'
                }}
              >
                Tasks
              </button>
              <button
                onClick={() => setGanttView('gantt')}
                style={{
                  padding: '1rem 2rem',
                  border: '3px solid #000000',
                  background: ganttView === 'gantt' ? '#000000' : '#ffffff',
                  color: ganttView === 'gantt' ? '#ffffff' : '#000000',
                  borderRadius: '8px 8px 0 0',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderBottom: ganttView === 'gantt' ? '3px solid #000000' : '3px solid #000000'
                }}
              >
                Gantt Chart
              </button>
            </div>

            {/* Tasks Tab Content - Gantt Left Sidebar */}
            {ganttView === 'task' && (
              <div>
            <div className="view-description">
                  <h3>Tasks</h3>
                  <p>Task list with assignee, duration, and details. This shows the task information from the Gantt chart.</p>
            </div>
            
                <div className="gantt-sidebar-enhanced" style={{ width: '100%', maxWidth: 'none' }}>
                  <div className="gantt-sidebar-header-enhanced" style={{ 
                    display: 'flex', 
                    background: '#ffffff', 
                    border: '2px solid #000000',
                    borderBottom: '2px solid #000000'
                  }}>
                    <div style={{ 
                      flex: '3', 
                      padding: '1rem', 
                      fontWeight: '700', 
                      color: '#000000', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderRight: '2px solid #000000'
                    }}>
                      TASK
                </div>
                    <div style={{ 
                      flex: '1', 
                      padding: '1rem', 
                      fontWeight: '700', 
                      color: '#000000', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '2px solid #000000'
                    }}>
                      DURATION
              </div>
                    <div style={{ 
                      flex: '2', 
                      padding: '1rem', 
                      fontWeight: '700', 
                      color: '#000000', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '2px solid #000000'
                    }}>
                      ASSIGNEE
            </div>
                    <div style={{ 
                      flex: '1.5', 
                      padding: '1rem', 
                      fontWeight: '700', 
                      color: '#000000', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '2px solid #000000'
                    }}>
                      STATUS
                </div>
                    <div style={{ 
                      flex: '1.5', 
                      padding: '1rem', 
                      fontWeight: '700', 
                      color: '#000000', 
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      PRIORITY
                    </div>
                  </div>
                                     <div className="gantt-tasks-enhanced" style={{ 
                     background: '#ffffff',
                     border: '2px solid #000000',
                     borderTop: 'none',
                     overflow: 'hidden'
                   }}>
                  {tasks.length === 0 ? (
                       <div className="gantt-empty-state" style={{
                         padding: '3rem',
                         textAlign: 'center',
                         color: '#6b7280',
                         background: '#f9fafb'
                       }}>
                         <p style={{ margin: '0', fontSize: '1.1rem' }}>📝 No tasks available</p>
                         <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Create your first task to get started!</p>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const taskStartDate = task.start_date ? new Date(task.start_date) : new Date();
                      const taskDueDate = task.due_date ? new Date(task.due_date) : new Date(taskStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                      const durationInDays = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStartDate.getTime()) / (24 * 60 * 60 * 1000)));
                      
                      return (
                          <div 
                            key={task.id} 
                            className="gantt-task-row-enhanced"
                            onClick={(e) => handleTaskClick(task, e)}
                            style={{ 
                              cursor: 'pointer', 
                              transition: 'all 0.2s ease',
                              borderBottom: '2px solid #000000'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0f9ff';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                                                         <div className="gantt-task-info-enhanced" style={{ 
                               display: 'flex', 
                               width: '100%',
                               background: '#ffffff'
                             }}>
                               <div className="gantt-task-name-enhanced" style={{ 
                                 flex: '3', 
                                 display: 'flex', 
                                 flexDirection: 'column', 
                                 gap: '0.25rem',
                                 padding: '1rem',
                                 borderRight: '2px solid #000000'
                               }}>
                                 <span className="task-title" style={{ fontWeight: '600', color: '#000000', fontSize: '1rem' }}>{task.name}</span>
                                 {task.description && (
                                   <span style={{ fontSize: '0.85rem', color: '#666666', lineHeight: '1.3' }}>{task.description}</span>
                                 )}
                                 <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: '#666666', marginTop: '0.25rem' }}>
                                   {task.start_date && <span>Start: {formatDate(task.start_date)}</span>}
                                   {task.due_date && (
                                     <span style={{ color: isOverdue(task.due_date) ? '#ef4444' : '#666666' }}>
                                       Due: {formatDate(task.due_date)}
                                       {isOverdue(task.due_date) && ' (Overdue)'}
                                     </span>
                                   )}
                            </div>
                               </div>
                               <div className="gantt-task-duration" style={{ 
                                 flex: '1', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center', 
                                 fontWeight: '600',
                                 fontSize: '1rem',
                                 color: '#000000',
                                 borderRight: '2px solid #000000'
                               }}>
                                 {durationInDays}d
                               </div>
                               <div className="gantt-task-assignee" style={{ 
                                 flex: '2', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 gap: '0.5rem',
                                 padding: '1rem',
                                 borderRight: '2px solid #000000'
                               }}>
                              {task.assignee ? (
                                   <>
                                     <div className="assignee-avatar-enhanced" style={{
                                       width: '32px',
                                       height: '32px',
                                       borderRadius: '50%',
                                       background: '#000000',
                                       color: '#ffffff',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       fontSize: '0.9rem',
                                       fontWeight: '600'
                                     }}>
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                     <span style={{ fontSize: '0.9rem', color: '#000000', fontWeight: '500' }}>{task.assignee.name}</span>
                                   </>
                              ) : (
                                   <span className="unassigned" style={{ color: '#666666', fontStyle: 'italic' }}>Unassigned</span>
                              )}
                            </div>
                               <div style={{ 
                                 flex: '1.5', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 borderRight: '2px solid #000000'
                               }}>
                                 <span style={{
                                   padding: '0.5rem 1rem',
                                   borderRadius: '4px',
                                   fontSize: '0.8rem',
                                   fontWeight: '600',
                                   background: '#ffffff',
                                   color: '#000000',
                                   border: '2px solid #000000'
                                 }}>
                                   {TASK_STATUSES.find(s => s.value === task.status)?.label || task.status}
                                 </span>
                               </div>
                               <div style={{ 
                                 flex: '1.5', 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center'
                               }}>
                                 <span style={{
                                   padding: '0.5rem 1rem',
                                   borderRadius: '4px',
                                   fontSize: '0.8rem',
                                   fontWeight: '600',
                                   background: '#ffffff',
                                   color: '#000000',
                                   border: '2px solid #000000'
                                 }}>
                                   {PRIORITY_LEVELS.find(p => p.value === task.priority)?.label || task.priority}
                                 </span>
                               </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              </div>
            )}

            {/* Gantt Chart Tab Content - Timeline Only */}
            {ganttView === 'gantt' && (
              <div>
                <div className="view-description">
                  <h3>Gantt Chart</h3>
                  <p>Timeline view with calendar and task bars. Shows the scheduling and duration visualization from the Gantt chart.</p>
                </div>
            
                <div className="gantt-header-controls">
              <div className="gantt-controls">
                <button className="gantt-btn">
                  <AdjustmentsHorizontalIcon style={{ width: '16px', height: '16px' }} />
                  Filters
                </button>
                <div className="date-range-controls">
                  <button className="nav-btn" onClick={handlePreviousMonth}>
                    <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                  <span className="date-range">
                    {timelineStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button className="nav-btn" onClick={handleNextMonth}>
                    <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="gantt-chart-enhanced" style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'visible'
            }}>
              <div className="gantt-timeline-enhanced" style={{ 
                width: '100%', 
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                border: '2px solid #000000',
                boxSizing: 'border-box',
                scrollbarWidth: 'thin'
              }}>
                <div className="gantt-timeline-header-enhanced" style={{ minWidth: '1120px' }}>
                  <div className="gantt-month-header">
                    <div className="month-label">{timelineStartDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className="gantt-week-headers" style={{ display: 'flex', width: '1120px' }}>
                    {Array.from({ length: 4 }, (_, weekIndex) => {
                      // Calculate week start from timelineStartDate (1st of month)
                      const startOfWeek = new Date(timelineStartDate);
                      startOfWeek.setDate(timelineStartDate.getDate() + (weekIndex * 7));
                      
                      // Use simple month-based week numbering (Week 1, 2, 3, 4)
                      const monthWeekNumber = weekIndex + 1;
                      
                      return (
                        <div key={weekIndex} className="week-header" style={{ 
                          width: '280px',
                          padding: '0.5rem',
                          borderRight: weekIndex < 3 ? '1px solid #000000' : 'none',
                          fontWeight: '600',
                          textAlign: 'center',
                          background: '#f3f4f6',
                          boxSizing: 'border-box'
                        }}>
                          Week {monthWeekNumber}
                          <div style={{ fontSize: '0.75rem', color: '#666666' }}>
                            {startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="gantt-date-grid" style={{ display: 'flex', width: '1120px' }}>
                    {Array.from({ length: 28 }, (_, i) => {
                      // Calculate date from timelineStartDate
                      const date = new Date(timelineStartDate);
                      date.setDate(timelineStartDate.getDate() + i);
                      
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      
                      return (
                        <div 
                          key={i} 
                          className={`gantt-date-cell ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                          style={{
                            width: '40px',
                            minWidth: '40px',
                            maxWidth: '40px',
                            padding: '0.5rem',
                            borderRight: i < 27 ? '1px solid #e5e7eb' : 'none',
                            borderBottom: '1px solid #000000',
                            textAlign: 'center',
                            background: isToday ? '#fef3c7' : isWeekend ? '#f9fafb' : '#ffffff',
                            boxSizing: 'border-box'
                          }}
                        >
                          <div className="date-number" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                            {date.getDate()}
                          </div>
                          <div className="date-day" style={{ fontSize: '0.7rem', color: '#666666' }}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="gantt-grid-container" style={{ 
                  minWidth: '1120px',
                  position: 'relative',
                  minHeight: tasks.length > 0 ? `${tasks.length * 40}px` : '200px'
                }}>
                  <div className="gantt-vertical-grid" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '1120px',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    {Array.from({ length: 29 }, (_, i) => (
                      <div key={i} className="grid-line-vertical" style={{
                        position: 'absolute',
                        left: `${(i * 40)}px`,
                        top: 0,
                        height: '100%',
                        width: '1px',
                        background: i === 0 || i === 28 ? '#000000' : '#e5e7eb'
                      }}></div>
                    ))}
                  </div>
                  
                  <div className="gantt-bars-enhanced" style={{ 
                    minWidth: '1120px',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {tasks.length === 0 ? (
                      <div className="gantt-bars-empty">
                        <p>Create tasks to see them on the timeline</p>
                      </div>
                    ) : (
                      tasks.map((task, taskIndex) => {
                        const taskStartDate = task.start_date ? new Date(task.start_date) : new Date();
                        const taskDueDate = task.due_date ? new Date(task.due_date) : new Date(taskStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const durationInDays = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStartDate.getTime()) / (24 * 60 * 60 * 1000)));
                        
                        // Calculate position relative to timeline start (1st of month)
                        const timelineStart = new Date(timelineStartDate);
                        
                        const daysFromStart = Math.ceil((taskStartDate.getTime() - timelineStart.getTime()) / (24 * 60 * 60 * 1000));
                        
                        // Calculate width and position for 28-day timeline
                        const barWidth = Math.min((durationInDays * 40), 28 * 40 - 40); // 40px per day
                        const barLeft = Math.max(0, daysFromStart * 40); // 40px per day
                        
                        const statusConfig = getStatusConfig(task.status);
                        const isOverdueTask = isOverdue(task.due_date);
                        
                        return (
                          <div key={task.id} className="gantt-bar-row-enhanced" style={{
                            position: 'relative',
                            height: '40px',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            <div className="gantt-horizontal-grid-line" style={{
                              position: 'absolute',
                              left: 0,
                              right: 0,
                              bottom: 0,
                              height: '1px',
                              background: '#e5e7eb'
                            }}></div>
                            <div 
                              className={`gantt-bar-enhanced status-${task.status} ${isOverdueTask ? 'overdue' : ''}`}
                              style={{
                                width: `${barWidth}px`,
                                left: `${barLeft}px`,
                                position: 'absolute',
                                height: '30px',
                                background: '#3b82f6',
                                border: '2px solid #000000',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '5px'
                              }}
                              title={`${task.name}\nStart: ${taskStartDate.toLocaleDateString()}\nDue: ${taskDueDate.toLocaleDateString()}\nDuration: ${durationInDays} days\nStatus: ${TASK_STATUSES.find(s => s.value === task.status)?.label}\nAssignee: ${task.assignee?.name || 'Unassigned'}`}
                              onClick={(e) => handleTaskClick(task, e)}
                            >
                              <div className="gantt-bar-content-enhanced" style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 0.5rem',
                                width: '100%',
                                height: '100%'
                              }}>
                                <span className="gantt-bar-text-enhanced" style={{
                                  color: '#ffffff',
                                  fontSize: '0.8rem',
                                  fontWeight: '600',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  flex: 1
                                }}>{task.name}</span>
                                <span className="gantt-bar-duration-enhanced" style={{
                                  color: '#ffffff',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  marginLeft: '0.5rem'
                                }}>{durationInDays}d</span>
                              </div>
                              {isOverdueTask && <div className="overdue-indicator">!</div>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="gantt-legend">
              <div className="legend-section">
                <h4>Status Legend</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: '#ffffff', borderStyle: 'dashed' }}
                    ></div>
                    <span>To Do</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: '#f3f4f6' }}
                    ></div>
                    <span>In Progress</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: '#e5e7eb' }}
                    ></div>
                    <span>Review</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-color" 
                      style={{ backgroundColor: '#d1d5db' }}
                    ></div>
                    <span>Done</span>
                  </div>
                </div>
              </div>
              
              <div className="legend-section">
                <h4>Priority Legend</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div 
                      className="legend-priority-dot" 
                      style={{ width: '8px', backgroundColor: '#9ca3af' }}
                    ></div>
                    <span>Low</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-priority-dot" 
                      style={{ width: '12px', backgroundColor: '#6b7280' }}
                    ></div>
                    <span>Medium</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-priority-dot" 
                      style={{ width: '16px', backgroundColor: '#374151' }}
                    ></div>
                    <span>High</span>
                  </div>
                  <div className="legend-item">
                    <div 
                      className="legend-priority-dot" 
                      style={{ width: '16px', height: '3px', backgroundColor: '#111827' }}
                    ></div>
                    <span>Urgent</span>
                  </div>
                </div>
              </div>
              
              <div className="legend-section">
                <h4>Progress Indicators</h4>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="progress-example">
                      <div className="progress-bar" style={{ 
                        width: '50%', 
                        background: 'repeating-linear-gradient(45deg, transparent, transparent 1px, rgba(0, 0, 0, 0.2) 1px, rgba(0, 0, 0, 0.2) 2px)' 
                      }}></div>
                    </div>
                    <span>Task Progress</span>
                  </div>
                  <div className="legend-item">
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      background: '#111827', 
                      color: '#ffffff', 
                      borderRadius: '2px', 
                      fontSize: '0.5rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontWeight: '700'
                    }}>!</div>
                    <span>Overdue Task</span>
                  </div>
                </div>
              </div>
            </div>
              </div>
            )}
          </div>
        )}

        {viewMode === 'todo' && (
          <div className="todo-view">
            <div className="view-description">
              <h3>To Do List</h3>
              <p>Advanced to-do list for quick task management. Add, edit, and organize todos with priorities, categories, and due dates.</p>
            </div>
            
            <div className="todo-container">
              <TodoListComponent projectId={Number(params?.id)} projectMembers={project.members} />
            </div>
          </div>
        )}
      </main>

      {showCreateTask && (
            <div className="modal-overlay" style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.8)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '1rem', 
              zIndex: 50 
            }}>
              <div className="modal-content" style={{ 
                background: '#ffffff', 
                border: '2px solid #000000', 
                padding: '2rem', 
                width: '100%', 
                maxWidth: '800px', 
                borderRadius: '12px', 
                maxHeight: '90vh', 
                overflowY: 'auto', 
                overflowX: 'hidden',
                boxSizing: 'border-box',
                WebkitOverflowScrolling: 'touch'
              }}>
                <h2 className="modal-title">Create New Task</h2>
                <form onSubmit={handleCreateTask} style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1.5rem' 
                }}>
                                      <div className="form-group">
                      <label className="form-label">Task Name</label>
                <input
                  type="text"
                  required
                        className="form-input"
                        placeholder="Enter task name..."
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                />
              </div>

                    <div className="form-group">
                      <label className="form-label">Description</label>
                <textarea
                        className="form-textarea"
                  rows={3}
                        placeholder="Describe what needs to be done..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>

                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      >
                        {PRIORITY_LEVELS.map(priority => (
                          <option key={priority.value} value={priority.value}>
                            {priority.icon} {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Assignee</label>
                  <select
                        className="form-select"
                    value={newTask.assignee_id}
                        onChange={(e) => setNewTask({ ...newTask, assignee_id: Number(e.target.value) })}
                  >
                    <option value={0}>Unassigned</option>
                        {project.members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newTask.start_date}
                        onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                  value={newTask.due_date}
                        onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      />
              </div>

                    <div className="form-group">
                      <label className="form-label">Tags</label>
                <input
                  type="text"
                        className="form-input"
                        placeholder="frontend, urgent, bug (comma-separated)"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                />
              </div>

                  <div className="button-group" style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    marginTop: '0', 
                    paddingTop: '1rem', 
                    borderTop: '1px solid #e5e7eb' 
                  }}>
                <button
                  type="button"
                  onClick={() => setShowCreateTask(false)}
                        className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                        className="btn-primary"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskDetail && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          users={project.members}
          onClose={handleCloseTaskDetail}
          onSave={handleUpdateTask}
          onStatusChange={handleTaskStatusChange}
          onDelete={handleDeleteTask}
        />
      )}

      {showMembersModal && project && (
        <ProjectMembersModal
          projectId={project.id}
          currentMembers={project.members}
          onClose={() => setShowMembersModal(false)}
          onMembersUpdate={handleMembersUpdate}
        />
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 className="modal-title" style={{ color: '#ef4444' }}>Delete Project</h2>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#6b7280' }}>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All tasks and project data will be permanently deleted.
            </p>
            <div className="button-group">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
} 