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
  assignees: User[];  // Changed from single assignee to multiple assignees
  assignee?: User | null;  // Keep for backwards compatibility
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
    // Start from January 1st of current year
    const today = new Date();
    return new Date(today.getFullYear(), 0, 1);
  });
  const [showCreateTask, setShowCreateTask] = useState(false);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState<number | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    assignee_ids: [] as number[],  // Multiple assignees support
    priority: 'medium',
    start_date: '',
    due_date: '',
    tags: '',
    duration: 30  // Duration in minutes
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProject();
  }, [isAuthenticated, authLoading, params?.id, router]);

  useEffect(() => {
    // Auto-scroll to current week when gantt view is opened
    if (ganttView === 'gantt') {
      setTimeout(() => {
        const currentWeek = getWeekNumber(new Date());
        const scrollPosition = (currentWeek - 1) * 50 - 300; // Center the current week
        const timelineElement = document.querySelector('.gantt-timeline-enhanced');
        if (timelineElement) {
          timelineElement.scrollLeft = Math.max(0, scrollPosition);
        }
      }, 100);
    }
  }, [ganttView, tasks]);

  const fetchProject = async () => {
    try {
      const [projectData, tasksData, projectsData] = await Promise.all([
        projectService.getProject(Number(params?.id)),
        taskService.getProjectTasks(Number(params?.id)),
        projectService.getProjects()
      ]);
      setProject(projectData as any);
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

      // Handle multiple assignees using assignee_ids array
      if (newTask.assignee_ids && newTask.assignee_ids.length > 0) {
        taskData.assignee_ids = newTask.assignee_ids;
        console.log('Using assignee_ids array:', taskData.assignee_ids);
      } else {
        // Default to empty array if no assignees selected
        taskData.assignee_ids = [];
        console.log('No assignees selected, using empty array');
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

      // Add duration if provided
      if (newTask.duration) {
        taskData.duration = newTask.duration;
      }
      
      const createdTask = await taskService.createTask(Number(params?.id), taskData);
      setTasks([...tasks, createdTask]);
      
      // Send notifications for task assignment
      if (taskData.assignee_ids && taskData.assignee_ids.length > 0 && user && project) {
        try {
          const { notificationService } = await import('@/lib/notification-service');
          // Send notification to each assignee
          for (const assigneeId of taskData.assignee_ids) {
            await notificationService.sendTaskAssignmentNotification(
              createdTask.id,
              assigneeId,
              user.id,
              taskData.name
            );
          }
        } catch (notificationError) {
          console.error('Failed to send task assignment notifications:', notificationError);
          // Don't fail the task creation if notifications fail
        }
      }
      
      setNewTask({
        name: '',
        description: '',
        assignee_ids: [],
        priority: 'medium',
        start_date: '',
        due_date: '',
        tags: '',
        duration: 30
      });
      setShowCreateTask(false);
      setError('');
    } catch (err: any) {
      setError('Failed to create task');
    }
  };

  const handleTaskStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      const oldStatus = task?.status || '';
      
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

      // Send notifications for status change
      if (task && user && project && oldStatus !== newStatus) {
        try {
          const { notificationService } = await import('@/lib/notification-service');
          // Send notification to task assignees about status change
          if (task.assignees && task.assignees.length > 0) {
            for (const assignee of task.assignees) {
              await notificationService.sendTaskUpdateNotification(
                task.id,
                assignee.id,
                user.id,
                task.name,
                `status changed from ${oldStatus} to ${newStatus}`
              );
            }
          }
        } catch (notificationError) {
          console.error('Failed to send task status change notifications:', notificationError);
          // Don't fail the status update if notifications fail
        }
      }
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!selectedTask) return;
    
    try {
      const oldAssigneeIds = selectedTask.assignees?.map(a => a.id) || [];
      const newAssigneeIds = taskData.assignee_ids || [];
      
      const updatedTask = await taskService.updateTask(selectedTask.id, taskData);
      setTasks(tasks.map(task => 
        task.id === selectedTask.id ? updatedTask : task
      ));
      setSelectedTask(updatedTask);

      // Send notifications for new assignees
      const addedAssigneeIds = newAssigneeIds.filter((id: number) => !oldAssigneeIds.includes(id));
      if (addedAssigneeIds.length > 0 && user && project) {
        try {
          const { notificationService } = await import('@/lib/notification-service');
          // Send notification to each new assignee
          for (const assigneeId of addedAssigneeIds) {
            await notificationService.sendTaskAssignmentNotification(
              updatedTask.id,
              assigneeId,
              user.id,
              updatedTask.name
            );
          }
        } catch (notificationError) {
          console.error('Failed to send task assignment notifications:', notificationError);
          // Don't fail the task update if notifications fail
        }
      }

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

  // Helper function to sort tasks in ascending order
  const sortTasks = (taskList: Task[]) => {
    return taskList.sort((a, b) => {
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
  };

  const getTasksByStatus = (status: string) => {
    const statusTasks = tasks.filter(task => task.status === status);
    return sortTasks(statusTasks);
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

  const handlePreviousYear = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setFullYear(newDate.getFullYear() - 1);
    setTimelineStartDate(newDate);
  };

  const handleNextYear = () => {
    const newDate = new Date(timelineStartDate);
    newDate.setFullYear(newDate.getFullYear() + 1);
    setTimelineStartDate(newDate);
  };

  const getProjectStartDate = () => {
    if (!tasks || tasks.length === 0) return timelineStartDate;
    
    const taskDates = tasks
      .map(task => task.start_date ? new Date(task.start_date) : null)
      .filter(date => date !== null)
      .sort((a, b) => a!.getTime() - b!.getTime());
    
    if (taskDates.length > 0) {
      const earliestTask = taskDates[0]!;
      // Start from the beginning of the year containing the earliest task
      return new Date(earliestTask.getFullYear(), 0, 1);
    }
    
    return timelineStartDate;
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfWeek = startOfYear.getDay();
    const daysToFirstMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const firstMonday = new Date(date.getFullYear(), 0, 1 + daysToFirstMonday);
    
    if (date < firstMonday) {
      return 1;
    }
    
    const diffTime = date.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  };

  const getWeekStartDate = (year: number, weekNumber: number) => {
    const startOfYear = new Date(year, 0, 1);
    const dayOfWeek = startOfYear.getDay();
    const daysToFirstMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
    const weekStart = new Date(firstMonday);
    weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    return weekStart;
  };

  // Get task color based on status
  const getTaskColor = (status: string) => {
    switch(status) {
      case 'todo': return '#6366F1'; // Indigo
      case 'in_progress': return '#3B82F6'; // Blue
      case 'review': return '#F59E0B'; // Amber
      case 'done': return '#10B981'; // Emerald
      default: return '#6B7280'; // Gray
    }
  };

  // Get lighter background color for task bars
  const getTaskBgColor = (status: string) => {
    switch(status) {
      case 'todo': return 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)';
      case 'in_progress': return 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)';
      case 'review': return 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)';
      case 'done': return 'linear-gradient(135deg, #10B981 0%, #059669 100%)';
      default: return 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)';
    }
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
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes shimmer {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
          
          @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 179, 51, 0.3); }
            50% { box-shadow: 0 0 30px rgba(255, 179, 51, 0.5); }
          }
          
          body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
            overflow-x: hidden;
            max-width: 100vw;
          }
          
          .project-container {
            min-height: 100vh;
            display: flex;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            overflow-x: hidden;
            max-width: 100vw;
            position: relative;
          }
          
          .project-container::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 20% 80%, rgba(255, 179, 51, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(196, 131, 217, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(88, 132, 253, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }
          
          .main-content {
            flex: 1;
            background: transparent;
            overflow-x: hidden;
            max-width: 100vw;
            position: relative;
            z-index: 1;
            padding-top: ${isMobile ? '70px' : '0'};
            padding-left: ${isMobile ? '12px' : '0'};
            padding-right: ${isMobile ? '12px' : '0'};
          }
          
          .header {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 179, 51, 0.2);
            padding: 2rem 3rem;
            position: sticky;
            top: 0;
            z-index: 20;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border-radius: 0 0 24px 24px;
            margin: 0 1rem;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }
          
          .header-title {
            font-size: 2rem;
            font-weight: 700;
            color: #FFB333;
            margin: 0;
            letter-spacing: -0.025em;
            line-height: 1.2;
            position: relative;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .header-title:hover {
            color: #F87239;
            transform: translateX(8px);
          }
          
          .header-title::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 0;
            width: 60px;
            height: 3px;
            background: #C483D9;
            border-radius: 2px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .header-title:hover::after {
            width: 120px;
            background: #5884FD;
          }
          
          .header-subtitle {
            color: #6B7280;
            text-transform: capitalize;
            font-size: 1rem;
            font-weight: 500;
            margin-top: 0.75rem;
            letter-spacing: 0.025em;
            transition: all 0.3s ease;
          }
          
          .header-actions {
            display: flex;
            align-items: center;
            gap: 1.5rem;
          }
          
          .action-buttons-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            min-width: 360px;
          }
          
          .action-btn {
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            font-size: 0.875rem;
            position: relative;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid transparent;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          
          .action-btn:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
          }
          
          .action-btn:active {
            transform: translateY(-2px) scale(0.98);
          }
          .view-toggle {
            display: flex;
            align-items: center;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 12px;
            padding: 0.5rem;
            border: 2px solid #F5F5ED;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          
          .todo-view {
              padding: 0 !important;
              background: transparent !important;
              min-height: auto !important;
          }
          
          .todo-container {
              max-width: 100% !important;
              margin: 0 auto !important;
              padding: 0 !important;
            }
            
            .todo-stats-grid {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 0.375rem !important;
              margin-bottom: 0.75rem !important;
            }
            
            .todo-stat-card {
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 6px !important;
              padding: 0.5rem 0.25rem !important;
              text-align: center !important;
              min-height: 45px !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: center !important;
              align-items: center !important;
            }
            
            .todo-stat-number {
              font-size: 1rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
              margin: 0 !important;
              line-height: 1 !important;
            }
            
            .todo-stat-label {
              font-size: 0.6rem !important;
              font-weight: 600 !important;
              color: #6b7280 !important;
              margin-top: 0.2rem !important;
              text-transform: uppercase !important;
              letter-spacing: 0.025em !important;
              line-height: 1.1 !important;
            }
            
            .todo-controls {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
              margin-bottom: 1rem !important;
            }
            
            .todo-add-btn {
              background: #000000 !important;
              color: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              padding: 0.75rem !important;
              font-weight: 600 !important;
              font-size: 0.9rem !important;
              cursor: pointer !important;
              transition: all 0.2s ease !important;
              text-align: center !important;
              touch-action: manipulation !important;
              -webkit-tap-highlight-color: transparent !important;
            }
            
            .todo-add-btn:hover {
              transform: translateY(-1px) !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
            }
            
            .todo-view-toggle {
              display: flex !important;
              gap: 0.25rem !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              padding: 0.25rem !important;
            }
            
            .todo-view-btn {
              flex: 1 !important;
              padding: 0.5rem !important;
              border: none !important;
              background: transparent !important;
              color: #6b7280 !important;
              border-radius: 4px !important;
              cursor: pointer !important;
              font-size: 0.8rem !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
              text-align: center !important;
            }
            
            .todo-view-btn.active {
              background: #000000 !important;
              color: #ffffff !important;
            }
            
            .todo-filters {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.5rem !important;
              margin-bottom: 1rem !important;
            }
            
            .todo-filter-select {
              padding: 0.75rem !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-size: 0.9rem !important;
              font-weight: 500 !important;
              cursor: pointer !important;
            }
            
            .todo-empty-state {
              text-align: center !important;
              padding: 3rem 1rem !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 12px !important;
              color: #6b7280 !important;
            }
            
            .todo-empty-state h3 {
              font-size: 1.1rem !important;
              font-weight: 600 !important;
              color: #000000 !important;
              margin: 0 0 0.5rem 0 !important;
            }
            
            .todo-empty-state p {
              font-size: 0.9rem !important;
              margin: 0 !important;
              font-style: italic !important;
          }
          .view-btn {
            padding: 0.75rem 1rem;
            border: none;
            background: transparent;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            color: #6B7280;
            font-weight: 600;
            font-size: 0.875rem;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            flex-direction: column;
            min-height: 60px;
          }
          
          .view-btn svg {
            width: 20px;
            height: 20px;
            transition: all 0.3s ease;
            opacity: 0.7;
          }
          
          .view-btn:hover {
            color: #FFB333;
            transform: translateY(-2px);
          }
          
          .view-btn:hover svg {
            opacity: 1;
            transform: scale(1.1);
          }
          
          .view-btn.active {
            background: #FFB333;
            color: #FFFFFF;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.3);
          }
          
          .view-btn.active svg {
            opacity: 1;
            color: #FFFFFF;
            transform: scale(1.05);
          }
          
          .members-btn {
            background: rgba(255, 255, 255, 0.95);
            color: #5884FD;
            border-color: #5884FD;
          }
          
          .members-btn:hover {
            background: #5884FD;
            color: #FFFFFF;
            border-color: #5884FD;
          }
          
          .delete-btn {
            background: rgba(255, 255, 255, 0.95);
            color: #EF4444;
            border-color: #EF4444;
          }
          
          .delete-btn:hover {
            background: #EF4444;
            color: #FFFFFF;
            border-color: #EF4444;
          }
          
          .add-task-btn {
            background: #FFB333;
            color: #FFFFFF;
            border-color: #FFB333;
          }
          
          .add-task-btn:hover {
            background: #F87239;
            border-color: #F87239;
          }
          .project-stats {
            display: flex;
            align-items: center;
            gap: 3rem;
            flex-wrap: wrap;
            margin-top: 1rem;
          }
          
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1rem;
            color: #374151;
            font-weight: 600;
            padding: 0.75rem 1.25rem;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 16px;
            border: 1px solid rgba(255, 179, 51, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .stat-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border-color: rgba(255, 179, 51, 0.4);
          }
          
          .members-display {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1.25rem;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 16px;
            border: 1px solid rgba(196, 131, 217, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .members-display:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            border-color: rgba(196, 131, 217, 0.4);
          }
          
          .members-avatars {
            display: flex;
            align-items: center;
            margin: 0;
            gap: -8px;
          }
          
          .member-avatar {
            width: 40px;
            height: 40px;
            background: #FFB333;
            color: #FFFFFF;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem;
            font-weight: 700;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            margin-left: -8px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
          }
          
          .member-avatar:first-child {
            margin-left: 0;
          }
          
          .member-avatar:nth-child(2) {
            background: #F87239;
          }
          
          .member-avatar:nth-child(3) {
            background: #C483D9;
          }
          
          .member-avatar:nth-child(4) {
            background: #5884FD;
          }
          
          .member-avatar:hover {
            transform: translateY(-4px) scale(1.1);
            z-index: 2;
            box-shadow: 0 8px 20px rgba(255, 179, 51, 0.3);
          }
          
          .member-avatar.more-members {
            background: #6B7280;
            font-size: 0.75rem;
            z-index: 0;
          }
          
          .members-count {
            font-size: 0.925rem;
            color: #6B7280;
            font-weight: 600;
            margin-left: 0.5rem;
          }
          
          /* Modal and Form Styling */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 1000;
            backdrop-filter: blur(8px);
            animation: fadeIn 0.3s ease-out;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          .modal-content {
            background: rgba(255, 255, 255, 0.98);
            border: 2px solid #FFB333;
            border-radius: 16px;
            padding: 2rem;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(20px);
            animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
          }
          
          .modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #F87239, #C483D9, #5884FD);
            border-radius: 16px 16px 0 0;
          }
          
          .modal-title {
            font-size: 1.75rem;
            font-weight: 700;
            color: #374151;
            margin: 0 0 1.5rem 0;
            letter-spacing: -0.025em;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          
          .form-label {
            font-size: 0.925rem;
            font-weight: 600;
            color: #374151;
            letter-spacing: 0.025em;
          }
          
          .form-input, .form-textarea, .form-select {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid rgba(245, 245, 237, 0.8);
            border-radius: 8px;
            font-size: 0.925rem;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            backdrop-filter: blur(10px);
          }
          
          .form-input:focus, .form-textarea:focus, .form-select:focus {
            outline: none;
            border-color: #FFB333;
            box-shadow: 0 0 0 3px rgba(255, 179, 51, 0.1);
            background: #FFFFFF;
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 100px;
          }
          
          .button-group {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 2px solid rgba(245, 245, 237, 0.6);
          }
          
          .btn-primary, .btn-secondary {
            flex: 1;
            padding: 1rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 0.925rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
          }
          
          .btn-primary {
            background: #FFB333;
            color: #FFFFFF;
            border: 2px solid #FFB333;
          }
          
          .btn-primary:hover {
            background: #F87239;
            border-color: #F87239;
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.3);
          }
          
          .btn-secondary {
            background: rgba(255, 255, 255, 0.9);
            color: #6B7280;
            border: 2px solid #E5E7EB;
          }
          
          .btn-secondary:hover {
            background: #F9FAFB;
            color: #374151;
            border-color: #D1D5DB;
            transform: translateY(-2px);
          }
          
          /* Enhanced seamless flow animations */
          .main-content-area > * {
            animation: fadeInUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .status-column:nth-child(1) { animation-delay: 0.1s; }
          .status-column:nth-child(2) { animation-delay: 0.2s; }
          .status-column:nth-child(3) { animation-delay: 0.3s; }
          .status-column:nth-child(4) { animation-delay: 0.4s; }
          
          .task-card {
            animation: slideInTask 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            opacity: 0;
          }
          
          @keyframes slideInTask {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
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
              font-size: 0.9rem !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              word-break: break-word !important;
              white-space: normal !important;
              hyphens: auto !important;
              max-width: 100% !important;
              display: block !important;
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
            padding: 2rem 3rem;
            overflow-x: auto;
            max-width: 100%;
            position: relative;
          }
          
          .main-content-area::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
              radial-gradient(circle at 25% 25%, rgba(255, 179, 51, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(196, 131, 217, 0.03) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
          }
          
          .error-message {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #EF4444;
            color: #DC2626;
            padding: 1.25rem 1.5rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-weight: 600;
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.1);
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 1;
          }
          
          .board-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            min-height: 600px;
            position: relative;
            z-index: 1;
          }
          
          .status-column {
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #F5F5ED;
            border-radius: 16px;
            padding: 1.5rem;
            min-height: 600px;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            backdrop-filter: blur(20px);
            position: relative;
            overflow: hidden;
          }
          
          .status-column::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: #FFB333;
            transition: all 0.4s ease;
          }
          
          .status-column:nth-child(2)::before {
            background: #5884FD;
          }
          
          .status-column:nth-child(3)::before {
            background: #F87239;
          }
          
          .status-column:nth-child(4)::before {
            background: #C483D9;
          }
          
          .status-column:hover {
            transform: translateY(-4px);
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
            border-color: rgba(255, 179, 51, 0.3);
          }
          
          .status-column.drag-over {
            border-color: #FFB333;
            background: rgba(255, 179, 51, 0.05);
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 60px rgba(255, 179, 51, 0.2);
          }
          .status-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid rgba(245, 245, 237, 0.6);
            position: relative;
            z-index: 1;
          }
          
          .status-title-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          
          .status-icon {
            font-size: 1.25rem;
            transition: all 0.3s ease;
          }
          
          .status-title {
            font-weight: 700;
            color: #374151;
            font-size: 1.1rem;
            letter-spacing: -0.025em;
            transition: all 0.3s ease;
          }
          
          .status-count {
            background: rgba(255, 179, 51, 0.1);
            border: 2px solid #FFB333;
            padding: 0.375rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            color: #FFB333;
            min-width: 24px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .tasks-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            min-height: 400px;
          }
          .task-card {
            background: rgba(255, 255, 255, 0.9);
            border: 2px solid rgba(245, 245, 237, 0.8);
            border-radius: 12px;
            padding: 1.25rem;
            cursor: grab;
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            position: relative;
            overflow: hidden;
            min-height: 80px;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          }
          
          .task-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: #FFB333;
            opacity: 0;
            transition: all 0.3s ease;
          }
          
          .task-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
            border-color: rgba(255, 179, 51, 0.4);
          }
          
          .task-card:hover::before {
            opacity: 1;
          }
          
          .task-card:active {
            cursor: grabbing;
          }
          
          .task-card.dragging {
            opacity: 0.6;
            transform: rotate(5deg) scale(1.05);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          }
          .task-header {
            margin-bottom: 0.75rem;
          }
          .task-title {
            font-weight: 600 !important;
            color: #374151 !important;
            font-size: 1rem !important;
            line-height: 1.4 !important;
            flex: 1 !important;
            margin-right: 0.5rem !important;
            letter-spacing: -0.025em !important;
            transition: all 0.3s ease !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
            hyphens: auto !important;
            max-width: 100% !important;
            display: block !important;
          }
          
          .task-card:hover .task-title {
            color: #FFB333;
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
            padding: 0 0.75rem !important;
            display: flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            flex: 1 !important;
            overflow: visible !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
            hyphens: auto !important;
          }
          
          .task-title {
            font-weight: 600 !important;
            color: #000000 !important;
            font-size: 0.85rem !important;
            flex: 1 !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
            word-break: break-word !important;
            white-space: normal !important;
            hyphens: auto !important;
            line-height: 1.3 !important;
            max-width: 180px !important;
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
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            hyphens: auto;
            line-height: 1.2;
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
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            hyphens: auto;
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
              display: grid !important;
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 0.5rem !important;
              width: 100% !important;
              margin-bottom: 1rem !important;
            }
            
            .stat-card {
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              padding: 0.75rem 0.5rem !important;
              text-align: center !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              min-height: 60px !important;
              box-shadow: none !important;
            }
            
            .stat-label {
              font-size: 0.65rem !important;
              font-weight: 600 !important;
              color: #6b7280 !important;
              margin-bottom: 0.25rem !important;
              text-transform: uppercase !important;
              letter-spacing: 0.025em !important;
              line-height: 1.2 !important;
            }
            
            .stat-value {
              font-size: 1.25rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
              margin: 0 !important;
              line-height: 1 !important;
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
              display: grid !important;
              grid-template-columns: 2fr 0.8fr 1.2fr 0.8fr 0.8fr !important;
              gap: 0 !important;
            }
            .gantt-task-info-enhanced {
              display: grid !important;
              grid-template-columns: 2fr 0.8fr 1.2fr 0.8fr 0.8fr !important;
              gap: 0 !important;
            }
            
            .gantt-sidebar-enhanced {
              width: 100% !important;
              overflow-x: auto !important;
              scrollbar-width: thin !important;
              -ms-overflow-style: none !important;
            }
            
            .gantt-sidebar-enhanced::-webkit-scrollbar {
              height: 4px !important;
            }
            
            .gantt-sidebar-enhanced::-webkit-scrollbar-track {
              background: #f1f1f1 !important;
            }
            
            .gantt-sidebar-enhanced::-webkit-scrollbar-thumb {
              background: #888 !important;
              border-radius: 2px !important;
            }
            .gantt-week-headers {
              grid-template-columns: repeat(2, 1fr);
            }
            .gantt-legend {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
          
          /* Enhanced Mobile Responsive Styles */
          @media (max-width: 768px) {
            body {
              overflow-x: hidden !important;
            }
            
            .project-container {
              flex-direction: column !important;
              overflow-x: hidden !important;
            }
            
            .main-content {
              max-width: 100vw !important;
              overflow-x: hidden !important;
              width: 100% !important;
            }
            
            .header {
              padding: 1rem 0.75rem 0.5rem 0.75rem !important;
              position: relative !important;
              overflow-x: hidden !important;
              border-bottom: 2px solid #000000 !important;
              background: #ffffff !important;
            }
            
            .header-content {
              flex-direction: column !important;
              gap: 1rem !important;
              align-items: stretch !important;
              margin-bottom: 0 !important;
            }
            
            .header-title {
              font-size: 1.25rem !important;
              margin-bottom: 0.25rem !important;
              text-align: center !important;
              word-break: break-word !important;
              line-height: 1.3 !important;
              padding: 0 0.5rem !important;
            }
            
            .header-subtitle {
              font-size: 0.8rem !important;
              margin-bottom: 0 !important;
              text-align: center !important;
              color: #666666 !important;
            }
            
            .header-actions {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
              width: 100% !important;
            }
            
            .action-buttons-grid {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 0.375rem !important;
              width: 100% !important;
              min-width: unset !important;
            }
            
            .action-btn {
              padding: 0.75rem 0.25rem !important;
              font-size: 0.7rem !important;
              gap: 0.25rem !important;
              flex-direction: column !important;
              min-height: 55px !important;
              touch-action: manipulation !important;
              -webkit-tap-highlight-color: transparent !important;
              text-align: center !important;
              justify-content: center !important;
              align-items: center !important;
              box-shadow: none !important;
              border-radius: 6px !important;
            }
            
            .action-btn svg {
              width: 16px !important;
              height: 16px !important;
              margin-bottom: 0.125rem !important;
            }
            
            .action-btn:hover {
              transform: none !important;
              box-shadow: none !important;
            }
            
            .members-btn {
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              color: #000000 !important;
            }
            
            .delete-btn {
              background: #ffffff !important;
              border: 2px solid #ef4444 !important;
              color: #ef4444 !important;
            }
            
            .add-task-btn {
              background: #000000 !important;
              color: #ffffff !important;
              border: 2px solid #000000 !important;
              font-weight: 600 !important;
            }
            
            .view-toggle {
              display: flex !important;
              align-items: center !important;
              width: 100% !important;
              justify-content: space-between !important;
              padding: 0.25rem !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
              margin-bottom: 0 !important;
              overflow-x: auto !important;
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
              box-shadow: none !important;
            }
            
            .view-toggle::-webkit-scrollbar {
              display: none !important;
            }
            
            .view-btn {
              flex: 1 !important;
              padding: 0.5rem 0.25rem !important;
              font-size: 0.65rem !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 0.2rem !important;
              min-height: 48px !important;
              min-width: 58px !important;
              white-space: nowrap !important;
              border: none !important;
              background: transparent !important;
              color: #666666 !important;
              border-radius: 4px !important;
              transition: all 0.2s ease !important;
              cursor: pointer !important;
            }
            
            .view-btn svg {
              width: 18px !important;
              height: 18px !important;
              margin-bottom: 0.125rem !important;
            }
            
            .view-btn.active {
              background: #000000 !important;
              color: #ffffff !important;
              transform: none !important;
            }
            
            .view-btn:hover {
              transform: none !important;
            }
            
            .main-content-area {
              padding: 0.75rem !important;
              overflow-x: hidden !important;
              max-width: 100vw !important;
              box-sizing: border-box !important;
              width: 100% !important;
            }
            
            .timeline-view {
              padding: 0 !important;
              background: transparent !important;
            }
            
            .timeline-header-controls {
              padding: 0 !important;
              margin-bottom: 1rem !important;
              background: transparent !important;
            }
            
            .timeline-grid {
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 12px !important;
              overflow: hidden !important;
              margin-bottom: 1rem !important;
            }
            
            .timeline-grid-header {
              background: #f9fafb !important;
              border-bottom: 2px solid #000000 !important;
              padding: 0.75rem !important;
              font-weight: 700 !important;
              font-size: 0.8rem !important;
              text-transform: uppercase !important;
              letter-spacing: 0.025em !important;
            }
            
            .timeline-row {
              border-bottom: 1px solid #e5e7eb !important;
              padding: 0.75rem !important;
              transition: all 0.2s ease !important;
            }
            
            .timeline-row:hover {
              background: #f9fafb !important;
            }
            
            .timeline-row:last-child {
              border-bottom: none !important;
            }
            
            .timeline-task-info {
              margin-bottom: 0.5rem !important;
            }
            
            .task-name {
              font-size: 0.9rem !important;
              font-weight: 600 !important;
              color: #000000 !important;
              margin-bottom: 0.375rem !important;
              line-height: 1.3 !important;
            }
            
            .task-details {
              display: flex !important;
              flex-wrap: wrap !important;
              gap: 0.375rem !important;
              align-items: center !important;
            }
            
            .task-status-badge {
              padding: 0.25rem 0.5rem !important;
              border-radius: 4px !important;
              font-size: 0.65rem !important;
              font-weight: 600 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.025em !important;
              border: 1px solid #000000 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            
            .task-assignee {
              display: flex !important;
              align-items: center !important;
              gap: 0.25rem !important;
              font-size: 0.75rem !important;
              color: #6b7280 !important;
            }
            
            .assignee-avatar-sm {
              width: 16px !important;
              height: 16px !important;
              border-radius: 50% !important;
              background: #f3f4f6 !important;
              border: 1px solid #000000 !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 0.6rem !important;
              font-weight: 600 !important;
              color: #000000 !important;
            }
            
            .task-priority {
              padding: 0.25rem 0.5rem !important;
              border-radius: 4px !important;
              font-size: 0.65rem !important;
              font-weight: 600 !important;
              text-transform: uppercase !important;
              letter-spacing: 0.025em !important;
              border: 1px solid #000000 !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            
            .timeline-chart {
              margin-top: 0.5rem !important;
            }
            
            .timeline-bar-container {
              position: relative !important;
              background: #f3f4f6 !important;
              border: 1px solid #e5e7eb !important;
              border-radius: 6px !important;
              overflow: hidden !important;
              height: 24px !important;
              margin-bottom: 0.375rem !important;
            }
            
            .timeline-bar {
              height: 100% !important;
              position: relative !important;
              border-radius: 6px !important;
              background: #e5e7eb !important;
              transition: all 0.3s ease !important;
            }
            
            .timeline-progress {
              height: 100% !important;
              border-radius: 6px !important;
              transition: all 0.3s ease !important;
            }
            
            .timeline-dates {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              font-size: 0.7rem !important;
              color: #6b7280 !important;
            }
            
            .start-date {
              font-weight: 500 !important;
            }
            
            .due-date {
              font-weight: 500 !important;
            }
            
            .due-date.overdue {
              color: #ef4444 !important;
              font-weight: 600 !important;
            }
            
            .info-card {
              margin: 1rem 0 !important;
              padding: 0.875rem !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 8px !important;
            }
            
            .info-card h4 {
              font-size: 0.85rem !important;
              font-weight: 600 !important;
              color: #000000 !important;
              margin: 0 0 0.375rem 0 !important;
            }
            
            .info-card p {
              font-size: 0.75rem !important;
              color: #6b7280 !important;
              margin: 0 !important;
              line-height: 1.4 !important;
            }
            
            .view-description {
              padding: 0.875rem !important;
              margin-bottom: 1rem !important;
              border-radius: 8px !important;
              overflow-wrap: break-word !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              box-shadow: none !important;
            }
            
            .view-description h3 {
              font-size: 1rem !important;
              margin-bottom: 0.5rem !important;
              color: #000000 !important;
              font-weight: 600 !important;
            }
            
            .view-description p {
              font-size: 0.8rem !important;
              line-height: 1.4 !important;
              color: #6b7280 !important;
              margin: 0 !important;
            }
            
            .board-view {
              display: flex !important;
              flex-direction: column !important;
              gap: 1rem !important;
              width: 100% !important;
              overflow-x: hidden !important;
            }
            
            .board-grid {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 1rem !important;
              width: 100% !important;
              overflow-x: hidden !important;
              min-height: auto !important;
            }
            
            .status-column {
              padding: 0.875rem !important;
              min-height: auto !important;
              width: 100% !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              border: 2px solid #000000 !important;
              border-radius: 12px !important;
              box-shadow: none !important;
            }
            
            .status-header {
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              margin-bottom: 0.875rem !important;
              padding-bottom: 0.75rem !important;
              border-bottom: 2px solid #f3f4f6 !important;
            }
            
            .status-title {
              font-size: 0.95rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
            }
            
            .status-count {
              background: #f3f4f6 !important;
              border: 2px solid #000000 !important;
              padding: 0.2rem 0.6rem !important;
              border-radius: 20px !important;
              font-size: 0.7rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
              min-width: 20px !important;
              text-align: center !important;
            }
            
            .tasks-list {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
              min-height: 200px !important;
            }
            
            .task-card {
              background: #ffffff !important;
              border: 2px solid #e5e7eb !important;
              border-radius: 8px !important;
              padding: 0.875rem !important;
              margin-bottom: 0 !important;
              cursor: grab !important;
              transition: all 0.3s ease !important;
              position: relative !important;
              overflow: hidden !important;
              min-height: 60px !important;
              touch-action: manipulation !important;
              -webkit-tap-highlight-color: transparent !important;
            }
            
            .task-card:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 4px 12px -3px rgba(0, 0, 0, 0.1) !important;
              border-color: #000000 !important;
            }
            
            .task-header {
              margin-bottom: 0.5rem !important;
            }
            
            .task-title {
              font-size: 0.9rem !important;
              line-height: 1.3 !important;
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
              word-break: break-word !important;
              white-space: normal !important;
              hyphens: auto !important;
              max-width: 100% !important;
              font-weight: 600 !important;
              color: #000000 !important;
              margin: 0 !important;
            }
            
            .task-meta-item {
              display: flex !important;
              align-items: center !important;
              gap: 0.375rem !important;
              padding: 0.375rem 0.5rem !important;
              font-size: 0.75rem !important;
              border-radius: 4px !important;
              background: #f9fafb !important;
              border: 1px solid #e5e7eb !important;
              color: #6b7280 !important;
              margin-top: 0.5rem !important;
            }
            
            .assignee-avatar {
              width: 18px !important;
              height: 18px !important;
              font-size: 0.6rem !important;
              background: #f3f4f6 !important;
              border: 1px solid #000000 !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-weight: 600 !important;
              color: #000000 !important;
            }
            
            .empty-state {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 2rem 1rem !important;
              text-align: center !important;
              color: #9ca3af !important;
              font-style: italic !important;
              min-height: 120px !important;
            }
            
            .empty-state p {
              margin: 0 !important;
              font-size: 0.875rem !important;
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
          }
        `
      }} />
      
      <div className="project-container">
        <div className="main-content">
          <header className="header">
            <div className="header-content">
                <div>
                <h1 className="header-title" style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word', 
                  whiteSpace: 'normal',
                  lineHeight: '1.2',
                  maxWidth: '100%',
                  hyphens: 'auto'
                }}>{project.name}</h1>
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
                              
                              {((task.assignees && task.assignees.length > 0) || task.assignee) && (
                                    <div className="task-meta-item" style={{ marginTop: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {task.assignees && task.assignees.length > 0 ? (
                                      <>
                                        {task.assignees.slice(0, 3).map((assignee, index) => (
                                          <div key={assignee.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <div className="assignee-avatar" style={{ 
                                              width: '24px', 
                                              height: '24px',
                                              fontSize: '0.7rem',
                                              marginLeft: index > 0 ? '-8px' : '0',
                                              zIndex: task.assignees.length - index,
                                              position: 'relative',
                                              border: '2px solid #ffffff'
                                            }}>
                                              {assignee.name.charAt(0).toUpperCase()}
                                            </div>
                                            {index === 0 && task.assignees.length === 1 && (
                                              <span style={{ fontSize: '0.8rem' }}>{assignee.name}</span>
                                            )}
                                          </div>
                                        ))}
                                        {task.assignees.length > 3 && (
                                          <div style={{ 
                                            width: '24px', 
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: '#6b7280',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.6rem',
                                            fontWeight: '600',
                                            marginLeft: '-8px',
                                            border: '2px solid #ffffff'
                                          }}>
                                            +{task.assignees.length - 3}
                                          </div>
                                        )}
                                        {task.assignees.length > 1 && (
                                          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.25rem' }}>
                                            {task.assignees.length} assignees
                                          </span>
                                        )}
                                      </>
                                    ) : task.assignee ? (
                                      <>
                                      <div className="assignee-avatar">
                                        {task.assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span>{task.assignee.name}</span>
                                      </>
                                    ) : null}
                                  </div>
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
            <div className="view-description" style={{
              background: '#FEF7ED',
              padding: '2rem',
              borderRadius: '20px',
              border: '1px solid #FED7AA',
              marginBottom: '2.5rem',
              boxShadow: '0 4px 16px rgba(251, 146, 60, 0.08)'
            }}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '700', 
                color: '#EA580C', 
                margin: '0 0 0.75rem 0',
                letterSpacing: '-0.025em'
              }}>Timeline View</h3>
              <p style={{ 
                color: '#78716C', 
                margin: '0', 
                lineHeight: '1.6',
                fontSize: '1rem',
                fontWeight: '500'
              }}>Track task progress over time with visual progress bars. See start dates, due dates, completion status, and identify overdue tasks at a glance.</p>
                                    </div>
            
            <div className="timeline-header-controls" style={{ marginBottom: '2.5rem' }}>
              <div className="timeline-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.5rem',
                width: '100%',
                maxWidth: '1400px',
                margin: '0 auto'
              }}>
                <div className="stat-card" style={{
                  background: '#FEF3C7',
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  border: '1px solid #F59E0B',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '160px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(245, 158, 11, 0.24)';
                  e.currentTarget.style.background = '#FEF3C7';
                  e.currentTarget.style.borderColor = '#F59E0B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(245, 158, 11, 0.12)';
                  e.currentTarget.style.background = '#FEF3C7';
                  e.currentTarget.style.borderColor = '#F59E0B';
                }}>
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '20px',
                      height: '20px',
                      opacity: 0.6
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  <div className="stat-value" style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#92400E',
                    marginBottom: '0.5rem',
                    lineHeight: '1'
                  }}>{tasks.length}</div>
                  <div className="stat-label" style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#78350F',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Total Tasks</div>
                </div>
                
                <div className="stat-card" style={{
                  background: '#D1FAE5',
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  border: '1px solid #10B981',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '160px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.24)';
                  e.currentTarget.style.background = '#A7F3D0';
                  e.currentTarget.style.borderColor = '#10B981';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.12)';
                  e.currentTarget.style.background = '#D1FAE5';
                  e.currentTarget.style.borderColor = '#10B981';
                }}>
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '20px',
                      height: '20px',
                      opacity: 0.6
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <div className="stat-value" style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#047857',
                    marginBottom: '0.5rem',
                    lineHeight: '1'
                  }}>{tasks.filter(t => t.status === 'done').length}</div>
                  <div className="stat-label" style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#064E3B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Completed</div>
                </div>
                
                <div className="stat-card" style={{
                  background: '#DBEAFE',
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  border: '1px solid #3B82F6',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '160px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(59, 130, 246, 0.24)';
                  e.currentTarget.style.background = '#BFDBFE';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.12)';
                  e.currentTarget.style.background = '#DBEAFE';
                  e.currentTarget.style.borderColor = '#3B82F6';
                }}>
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '20px',
                      height: '20px',
                      opacity: 0.6
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <div className="stat-value" style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#1E40AF',
                    marginBottom: '0.5rem',
                    lineHeight: '1'
                  }}>{tasks.filter(t => t.status === 'in_progress').length}</div>
                  <div className="stat-label" style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1E3A8A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>In Progress</div>
                </div>
                
                <div className="stat-card" style={{
                  background: '#FEE2E2',
                  padding: '2rem 1.5rem',
                  borderRadius: '20px',
                  border: '1px solid #EF4444',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.12)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  flex: '1',
                  minWidth: '160px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(239, 68, 68, 0.24)';
                  e.currentTarget.style.background = '#FECACA';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.12)';
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#EF4444';
                }}>
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      width: '20px',
                      height: '20px',
                      opacity: 0.6
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12" y2="16" />
                  </svg>
                  <div className="stat-value" style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: '#DC2626',
                    marginBottom: '0.5rem',
                    lineHeight: '1'
                  }}>{tasks.filter(t => isOverdue(t.due_date)).length}</div>
                  <div className="stat-label" style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#991B1B',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>Overdue</div>
                </div>
              </div>
            </div>

            <div className="timeline-grid" style={{
              background: '#FFFFFF',
              border: '1px solid #F3F4F6',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <div className="timeline-grid-header" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                background: '#FEF3C7',
                color: '#92400E',
                fontWeight: '700',
                padding: '1.5rem',
                borderBottom: '1px solid #FED7AA'
              }}>
                <div className="timeline-task-column" style={{ 
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  fontWeight: '800'
                }}>Task Details</div>
                <div className="timeline-chart-column" style={{ 
                  fontSize: '1rem',
                  letterSpacing: '0.05em',
                  fontWeight: '800'
                }}>Progress Timeline</div>
              </div>
              
              <div className="timeline-grid-body" style={{
                padding: '0'
              }}>
                {tasks.length === 0 ? (
                  <div style={{ 
                    padding: '4rem 3rem', 
                    textAlign: 'center', 
                    color: '#78716C',
                    background: '#FEFDFB'
                  }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '1rem'
                    }}>📅</div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      marginBottom: '0.75rem',
                      color: '#57534E'
                    }}>No tasks available</div>
                    <div style={{ 
                      fontSize: '1rem',
                      fontWeight: '500',
                      lineHeight: '1.5'
                    }}>Create your first task to see the beautiful timeline visualization</div>
                  </div>
                ) : (
                  sortTasks(tasks).map((task) => {
                    const startDate = task.start_date ? new Date(task.start_date) : new Date();
                    const dueDate = task.due_date ? new Date(task.due_date) : null;
                    const progress = task.status === 'done' ? 100 : 
                                   task.status === 'review' ? 80 :
                                   task.status === 'in_progress' ? 50 : 10;
                    
                    return (
                      <div key={task.id} className="timeline-row" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 2fr',
                        borderBottom: '1px solid #F3F4F6',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        background: 'transparent'
                      }} 
                      onClick={(e) => handleTaskClick(task, e)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#FEF7ED';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(251, 146, 60, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        <div className="timeline-task-info" style={{
                          padding: '2rem 1.5rem',
                          borderRight: '1px solid #F3F4F6'
                        }}>
                          <div className="task-name" style={{
                            fontSize: '1.125rem',
                            fontWeight: '700',
                            color: '#57534E',
                            marginBottom: '1rem',
                            letterSpacing: '-0.025em',
                            lineHeight: '1.4'
                          }}>{task.name}</div>
                          <div className="task-details" style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.875rem',
                            alignItems: 'center'
                          }}>
                            <span className={`task-status-badge status-${task.status}`} style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: task.status === 'done' ? '#D1FAE5' : 
                                         task.status === 'in_progress' ? '#DBEAFE' : 
                                         task.status === 'review' ? '#FEF3C7' : '#FEE2E2',
                              color: task.status === 'done' ? '#047857' : 
                                     task.status === 'in_progress' ? '#1E40AF' : 
                                     task.status === 'review' ? '#92400E' : '#DC2626',
                              border: `2px solid ${task.status === 'done' ? '#10B981' : 
                                                  task.status === 'in_progress' ? '#3B82F6' : 
                                                  task.status === 'review' ? '#F59E0B' : '#EF4444'}`,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}>
                              {TASK_STATUSES.find(s => s.value === task.status)?.label}
                            </span>
                            {((task.assignees && task.assignees.length > 0) || task.assignee) && (
                              <span className="task-assignee" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#78716C',
                                fontWeight: '600'
                              }}>
                                {task.assignees && task.assignees.length > 0 ? (
                                  <>
                                    {task.assignees.slice(0, 2).map((assignee, index) => (
                                      <div key={assignee.id} className="assignee-avatar-sm" style={{ 
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: index === 0 ? '#F59E0B' : '#3B82F6',
                                        color: '#FFFFFF',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: index > 0 ? '-10px' : '0',
                                        zIndex: task.assignees.length - index,
                                        position: 'relative',
                                        border: '3px solid #FFFFFF',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                      }}>
                                        {assignee.name.charAt(0).toUpperCase()}
                                      </div>
                                    ))}
                                    {task.assignees.length > 2 && (
                                      <div className="assignee-avatar-sm" style={{ 
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        background: '#10B981',
                                        color: '#FFFFFF',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '-10px',
                                        border: '3px solid #FFFFFF',
                                        zIndex: 1,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                      }}>
                                        +{task.assignees.length - 2}
                                      </div>
                                    )}
                                    <span style={{ fontSize: '0.875rem', marginLeft: '0.5rem', color: '#57534E', fontWeight: '600' }}>
                                      {task.assignees.length === 1 ? task.assignees[0].name : `${task.assignees.length} assignees`}
                                    </span>
                                  </>
                                ) : task.assignee ? (
                                  <>
                                    <div className="assignee-avatar-sm" style={{
                                      width: '28px',
                                      height: '28px',
                                      borderRadius: '50%',
                                      background: '#F59E0B',
                                      color: '#FFFFFF',
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '3px solid #FFFFFF',
                                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                    }}>
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                    <span style={{ color: '#57534E', fontWeight: '600' }}>{task.assignee.name}</span>
                                  </>
                                ) : null}
                              </span>
                            )}
                            <span className={`task-priority priority-${task.priority}`} style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              background: task.priority === 'urgent' ? '#FEE2E2' : 
                                         task.priority === 'high' ? '#FEF3C7' : 
                                         task.priority === 'medium' ? '#DBEAFE' : '#F9FAFB',
                              color: task.priority === 'urgent' ? '#DC2626' : 
                                     task.priority === 'high' ? '#92400E' : 
                                     task.priority === 'medium' ? '#1E40AF' : '#6B7280',
                              border: `2px solid ${task.priority === 'urgent' ? '#EF4444' : 
                                                  task.priority === 'high' ? '#F59E0B' : 
                                                  task.priority === 'medium' ? '#3B82F6' : '#D1D5DB'}`,
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
                            }}>
                              {task.priority}
                            </span>
                          </div>
                                </div>

                        <div className="timeline-chart" style={{
                          padding: '2rem 1.5rem'
                        }}>
                          <div className="timeline-bar-container" style={{
                            marginBottom: '1.5rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '1rem'
                            }}>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#57534E'
                              }}>{progress}% Complete</span>
                            </div>
                            <div 
                              className="timeline-bar"
                                      style={{
                                width: '100%',
                                height: '4px',
                                background: '#F3F4F6',
                                overflow: 'hidden',
                                position: 'relative'
                              }}
                            >
                              <div 
                                className="timeline-progress"
                                style={{ 
                                  width: `${Math.max(progress, 5)}%`,
                                  height: '100%',
                                  background: task.status === 'done' ? '#10B981' : 
                                             task.status === 'in_progress' ? '#3B82F6' : 
                                             task.status === 'review' ? '#F59E0B' : '#F59E0B',
                                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                  position: 'relative'
                                }}
                              />
                            </div>
                            <div className="timeline-dates" style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '0.75rem',
                              marginTop: '1rem',
                              color: '#78716C'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}>
                                <span style={{ fontWeight: '600' }}>Start:</span>
                                <span>{startDate.toLocaleDateString()}</span>
                              </div>
                              {dueDate && (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.5rem'
                                }}>
                                  <span style={{ fontWeight: '600' }}>Due:</span>
                                  <span style={{
                                    color: isOverdue(task.due_date) ? '#DC2626' : '#78716C',
                                    fontWeight: isOverdue(task.due_date) ? '600' : 'normal'
                                  }}>{dueDate.toLocaleDateString()}</span>
                                </div>
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
            
            <div className="timeline-info" style={{ marginTop: '2.5rem' }}>
              <div className="info-card" style={{ 
                background: '#FEF7ED', 
                border: '1px solid #FED7AA', 
                borderRadius: '20px', 
                padding: '2rem', 
                boxShadow: '0 4px 16px rgba(251, 146, 60, 0.08)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <svg 
                    style={{
                      width: '24px',
                      height: '24px',
                      opacity: 0.6
                    }}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                  <h4 style={{ 
                    fontSize: '1.125rem', 
                    fontWeight: '800', 
                    color: '#EA580C', 
                    margin: '0',
                    letterSpacing: '-0.025em'
                  }}>Progress Guide</h4>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  maxWidth: '1400px',
                  margin: '0 auto'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#57534E', marginBottom: '0.25rem' }}>Planning</div>
                    <div style={{ fontSize: '1.125rem', color: '#92400E', fontWeight: '700' }}>10%</div>
                  </div>
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3B82F6'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#57534E', marginBottom: '0.25rem' }}>In Progress</div>
                    <div style={{ fontSize: '1.125rem', color: '#1E40AF', fontWeight: '700' }}>50%</div>
                  </div>
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #F59E0B'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#57534E', marginBottom: '0.25rem' }}>Review</div>
                    <div style={{ fontSize: '1.125rem', color: '#92400E', fontWeight: '700' }}>80%</div>
                  </div>
                  <div style={{
                    background: '#FFFFFF',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #10B981'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#57534E', marginBottom: '0.25rem' }}>Complete</div>
                    <div style={{ fontSize: '1.125rem', color: '#047857', fontWeight: '700' }}>100%</div>
                  </div>
                </div>
                <p style={{ 
                  fontSize: '0.925rem', 
                  margin: '0', 
                  color: '#78716C', 
                  lineHeight: '1.6',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  Tasks are automatically color-coded by status. Overdue items are highlighted with a red border for immediate attention.
                </p>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'gantt' && (
          <div className="gantt-view">
            {/* Header Section */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '2rem',
              borderBottom: '2px solid #E5E7EB',
              paddingBottom: '1rem',
              background: '#ffffff'
            }}>
              <div>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold', 
                  margin: '0', 
                  color: '#000000'
                }}>
                  Gantt Chart
                </h1>
                <p style={{ fontSize: '1rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
                  {project?.name || 'Project'} • {ganttView === 'task' ? 'Task Management' : 'Timeline Visualization'}
                </p>
              </div>
              
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                background: '#F9FAFB',
                borderRadius: '8px',
                padding: '0.25rem',
                border: '2px solid #E5E7EB'
              }}>
                <button
                  onClick={() => setGanttView('task')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: ganttView === 'task' ? '#000000' : 'transparent',
                    color: ganttView === 'task' ? '#FFFFFF' : '#374151',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.025em'
                  }}
                  onMouseEnter={(e) => {
                    if (ganttView !== 'task') {
                      e.currentTarget.style.background = '#E5E7EB';
                      e.currentTarget.style.color = '#000000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (ganttView !== 'task') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setGanttView('gantt')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    background: ganttView === 'gantt' ? '#000000' : 'transparent',
                    color: ganttView === 'gantt' ? '#FFFFFF' : '#374151',
                    borderRadius: '6px',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.025em'
                  }}
                  onMouseEnter={(e) => {
                    if (ganttView !== 'gantt') {
                      e.currentTarget.style.background = '#E5E7EB';
                      e.currentTarget.style.color = '#000000';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (ganttView !== 'gantt') {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                >
                  Gantt Chart
                </button>
              </div>
            </div>

            {/* Tasks Tab Content - Gantt Left Sidebar */}
            {ganttView === 'task' && (
              <div>
            
                <div className="gantt-sidebar-enhanced" style={{ 
                  width: '100%', 
                  maxWidth: 'none',
                  background: '#ffffff',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '2rem'
                }}>
                  <div className="gantt-sidebar-header-enhanced" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 0.8fr 1.2fr 0.8fr 0.8fr',
                    background: '#F9FAFB', 
                    border: 'none',
                    borderBottom: '1px solid #E5E7EB',
                    minWidth: '100%',
                    width: '100%'
                  }}>
                    <div style={{ 
                      padding: '1rem 1rem', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      borderRight: '1px solid #E5E7EB',
                      textAlign: 'left',
                      letterSpacing: '0.025em'
                    }}>
                      TASK
                </div>
                    <div style={{ 
                      padding: '1rem 0.5rem', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #E5E7EB',
                      textAlign: 'center',
                      letterSpacing: '0.025em'
                    }}>
                      DURATION
              </div>
                    <div style={{ 
                      padding: '1rem 0.5rem', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #E5E7EB',
                      textAlign: 'center',
                      letterSpacing: '0.025em'
                    }}>
                      ASSIGNEE
            </div>
                    <div style={{ 
                      padding: '1rem 0.5rem', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #E5E7EB',
                      textAlign: 'center',
                      letterSpacing: '0.025em'
                    }}>
                      STATUS
                </div>
                    <div style={{ 
                      padding: '1rem 0.5rem', 
                      fontWeight: '700', 
                      color: '#374151', 
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      letterSpacing: '0.025em'
                    }}>
                      PRIORITY
                    </div>
                  </div>
                                     <div className="gantt-tasks-enhanced" style={{ 
                     background: '#ffffff',
                     border: 'none',
                     overflow: 'hidden'
                   }}>
                  {tasks.length === 0 ? (
                       <div className="gantt-empty-state" style={{
                         padding: '3rem',
                         textAlign: 'center',
                         color: '#6b7280',
                         background: '#f9fafb'
                       }}>
                         <p style={{ margin: '0', fontSize: '1.1rem' }}>No tasks available</p>
                         <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Create your first task to get started!</p>
                    </div>
                  ) : (
                    sortTasks(tasks).map((task) => {
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
                              borderBottom: '1px solid #E5E7EB'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = '#F8FAFC';
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
                               display: 'grid',
                               gridTemplateColumns: '2fr 0.8fr 1.2fr 0.8fr 0.8fr',
                               width: '100%',
                               background: '#ffffff',
                               minHeight: '50px'
                             }}>
                               <div className="gantt-task-name-enhanced" style={{ 
                                 display: 'flex', 
                                 flexDirection: 'column', 
                                 gap: '0.25rem',
                                 padding: '1rem 1rem',
                                 borderRight: '1px solid #E5E7EB',
                                 justifyContent: 'center'
                               }}>
                                 <span className="task-title" style={{ 
                                   fontWeight: '600', 
                                   color: '#1F2937', 
                                   fontSize: '0.875rem', 
                                   lineHeight: '1.3',
                                   wordWrap: 'break-word',
                                   overflowWrap: 'break-word',
                                   wordBreak: 'break-word',
                                   whiteSpace: 'normal',
                                   hyphens: 'auto',
                                   maxWidth: '100%'
                                 }}>{task.name}</span>
                                 {task.description && (
                                   <span style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: '1.3' }}>
                                     {task.description.substring(0, 30)}{task.description.length > 30 ? '...' : ''}
                                     </span>
                                   )}
                               </div>
                               <div className="gantt-task-duration" style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center', 
                                 fontWeight: '600',
                                 fontSize: '0.875rem',
                                 color: '#374151',
                                 borderRight: '1px solid #E5E7EB',
                                 padding: '1rem 0.5rem'
                               }}>
                                 {durationInDays}d
                               </div>
                               <div className="gantt-task-assignee" style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 gap: '0.5rem',
                                 padding: '1rem 0.5rem',
                                 borderRight: '1px solid #E5E7EB'
                               }}>
                              {task.assignee ? (
                                   <>
                                     <div className="assignee-avatar-enhanced" style={{
                                       width: '24px',
                                       height: '24px',
                                       borderRadius: '50%',
                                       background: '#F3F4F6',
                                       color: '#374151',
                                       border: '2px solid #E5E7EB',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       fontSize: '0.75rem',
                                       fontWeight: '600'
                                     }}>
                                  {task.assignee.name.charAt(0).toUpperCase()}
                                </div>
                                     <span style={{ fontSize: '0.75rem', color: '#374151', fontWeight: '500' }}>{task.assignee.name.split(' ')[0]}</span>
                                   </>
                              ) : (
                                   <span className="unassigned" style={{ color: '#9CA3AF', fontStyle: 'italic', fontSize: '0.75rem' }}>Unassigned</span>
                              )}
                            </div>
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 borderRight: '1px solid #E5E7EB',
                                 padding: '1rem 0.5rem'
                               }}>
                                 <span style={{
                                   padding: '0.25rem 0.5rem',
                                   borderRadius: '6px',
                                   fontSize: '0.75rem',
                                   fontWeight: '600',
                                   background: getStatusConfig(task.status).color,
                                   color: '#1F2937',
                                   border: '1px solid #E5E7EB',
                                   textTransform: 'capitalize',
                                   letterSpacing: '0.025em'
                                 }}>
                                   {TASK_STATUSES.find(s => s.value === task.status)?.label || task.status}
                                 </span>
                               </div>
                               <div style={{ 
                                 display: 'flex', 
                                 alignItems: 'center', 
                                 justifyContent: 'center',
                                 padding: '1rem 0.5rem'
                               }}>
                                 <span style={{
                                   padding: '0.25rem 0.5rem',
                                   borderRadius: '6px',
                                   fontSize: '0.75rem',
                                   fontWeight: '600',
                                   background: getPriorityConfig(task.priority).color + '20',
                                   color: getPriorityConfig(task.priority).color,
                                   border: '1px solid ' + getPriorityConfig(task.priority).color + '40',
                                   textTransform: 'capitalize',
                                   letterSpacing: '0.025em'
                                 }}>
                                   {task.priority}
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
            
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: '#F9FAFB',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px'
                }}>
                  <button style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#374151',
                    border: '2px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                    e.currentTarget.style.borderColor = '#E5E7EB';
                  }}>
                    <AdjustmentsHorizontalIcon style={{ width: '16px', height: '16px' }} />
                    Filters
                  </button>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: '#ffffff',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: '2px solid #E5E7EB'
                  }}>
                    <button 
                      onClick={handlePreviousYear}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#374151',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                    <span style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#1F2937',
                      minWidth: '140px',
                      textAlign: 'center'
                    }}>
                      {timelineStartDate.getFullYear()}
                    </span>
                    <button 
                      onClick={handleNextYear}
                      style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#374151',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F3F4F6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>

            <div className="gantt-chart-enhanced" style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'visible',
              background: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #E5E7EB',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>


              <div className="gantt-timeline-enhanced" style={{ 
                width: '100%', 
                maxWidth: '100%',
                overflowX: 'auto',
                overflowY: 'hidden',
                boxSizing: 'border-box',
                scrollbarWidth: 'thin',
                background: '#ffffff'
              }}>
                                  <div className="gantt-timeline-header-enhanced" style={{ minWidth: '2600px' }}>
                    <div className="gantt-year-header" style={{
                      background: '#F9FAFB',
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid #E5E7EB',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div className="year-label" style={{
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: '#1F2937'
                      }}>{getProjectStartDate().getFullYear()}</div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        fontWeight: '500'
                      }}>
                        52 weeks • January to December
                      </div>
                    </div>
                    <div className="gantt-week-headers" style={{ display: 'flex', width: '2600px' }}>
                      {Array.from({ length: 52 }, (_, weekIndex) => {
                        const weekNumber = weekIndex + 1;
                        const weekStartDate = getWeekStartDate(getProjectStartDate().getFullYear(), weekNumber);
                      
                                              // Check if this week contains current date
                        const currentDate = new Date();
                        const weekEndDate = new Date(weekStartDate);
                        weekEndDate.setDate(weekStartDate.getDate() + 6);
                        const isCurrentWeek = currentDate >= weekStartDate && currentDate <= weekEndDate;
                        
                        return (
                          <div key={weekIndex} className="week-header" style={{ 
                            width: '50px',
                            minWidth: '50px',
                            padding: '0.5rem 0.25rem',
                            borderRight: weekIndex < 51 ? '1px solid #E5E7EB' : 'none',
                            fontWeight: isCurrentWeek ? '700' : '600',
                            textAlign: 'center',
                            background: isCurrentWeek 
                              ? 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' 
                              : weekIndex % 2 === 0 ? '#F9FAFB' : '#ffffff',
                            boxSizing: 'border-box',
                            color: isCurrentWeek ? '#ffffff' : '#374151',
                            fontSize: '0.75rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            borderRadius: isCurrentWeek ? '6px' : '0',
                            boxShadow: isCurrentWeek ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentWeek) {
                              e.currentTarget.style.background = 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentWeek) {
                              e.currentTarget.style.background = weekIndex % 2 === 0 ? '#F9FAFB' : '#ffffff';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
                          >
                            <div style={{ 
                              marginBottom: '0.25rem',
                              textShadow: isCurrentWeek ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                            }}>
                              W{weekNumber}
                            </div>
                            <div style={{ 
                              fontSize: '0.6rem', 
                              color: isCurrentWeek ? 'rgba(255, 255, 255, 0.9)' : '#6B7280', 
                              fontWeight: '400',
                              textShadow: isCurrentWeek ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
                            }}>
                              {weekStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                    })}
                  </div>
                </div>
                
                <div className="gantt-grid-container" style={{ 
                  minWidth: '2600px',
                  position: 'relative',
                  minHeight: tasks.length > 0 ? `${tasks.length * 65}px` : '200px',
                  background: '#ffffff'
                }}>
                  <div className="gantt-vertical-grid" style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '2600px',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    {Array.from({ length: 53 }, (_, i) => (
                      <div key={i} className="grid-line-vertical" style={{
                        position: 'absolute',
                        left: `${(i * 50)}px`,
                        top: 0,
                        height: '100%',
                        width: '1px',
                        background: i === 0 || i === 52 ? '#D1D5DB' : '#F3F4F6'
                      }}></div>
                    ))}
                  </div>
                  
                  <div className="gantt-bars-enhanced" style={{ 
                    minWidth: '2600px',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    {tasks.length === 0 ? (
                      <div className="gantt-bars-empty" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#6B7280',
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        margin: '2rem'
                      }}>
                        <p style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>No tasks available</p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Create your first task to see it on the timeline!</p>
                      </div>
                    ) : (
                      sortTasks(tasks).map((task, taskIndex) => {
                        const taskStartDate = task.start_date ? new Date(task.start_date) : new Date();
                        const taskDueDate = task.due_date ? new Date(task.due_date) : new Date(taskStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const durationInWeeks = Math.max(1, Math.ceil((taskDueDate.getTime() - taskStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
                        
                        // Calculate position relative to year start
                        const taskStartWeek = getWeekNumber(taskStartDate);
                        
                        // Calculate width and position for 52-week timeline
                        const barWidth = Math.min((durationInWeeks * 50), 52 * 50 - 50); // 50px per week
                        const barLeft = Math.max(0, (taskStartWeek - 1) * 50); // 50px per week
                        

                        
                        const statusConfig = getStatusConfig(task.status);
                        const isOverdueTask = isOverdue(task.due_date);
                        
                                                  return (
                            <div key={task.id} className="gantt-bar-row-enhanced" style={{
                              position: 'relative',
                              height: '65px',
                              borderBottom: '1px solid #F3F4F6',
                              background: taskIndex % 2 === 0 ? '#FAFBFC' : '#ffffff'
                            }}>
                              {/* Task Bar */}
                              <div 
                                className={`gantt-bar-enhanced status-${task.status} ${isOverdueTask ? 'overdue' : ''}`}
                                style={{
                                  width: `${barWidth}px`,
                                  left: `${barLeft}px`,
                                  position: 'absolute',
                                  height: '40px',
                                  background: getTaskBgColor(task.status),
                                  border: `2px solid ${getTaskColor(task.status)}`,
                                  borderRadius: '10px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  padding: '0 0.75rem',
                                  overflow: 'hidden'
                                }}
                                title={`${task.name}\nStart: ${taskStartDate.toLocaleDateString()}\nDue: ${taskDueDate.toLocaleDateString()}\nDuration: ${durationInWeeks} weeks\nStatus: ${TASK_STATUSES.find(s => s.value === task.status)?.label}\nAssignee: ${task.assignee?.name || task.assignees?.map(a => a.name).join(', ') || 'Unassigned'}`}
                                onClick={(e) => handleTaskClick(task, e)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                                  e.currentTarget.style.zIndex = '10';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                  e.currentTarget.style.zIndex = '2';
                                }}
                              >
                                {/* Task Content */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  width: '100%',
                                  gap: '0.5rem'
                                }}>
                                  {/* Left side - Task name and assignee */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flex: 1,
                                    minWidth: 0
                                  }}>
                                    {/* Assignee Avatar */}
                                    {(task.assignee || task.assignees?.[0]) && (
                                      <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: '#ffffff',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        color: getTaskColor(task.status),
                                        flexShrink: 0
                                      }}>
                                        {(task.assignee?.name || task.assignees?.[0]?.name || 'U').charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    
                                    {/* Task Name */}
                                    <span style={{
                                      color: '#ffffff',
                                      fontSize: '0.875rem',
                                      fontWeight: '600',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                    }}>
                                      {task.name}
                                    </span>
                                  </div>
                                  
                                  {/* Right side - Duration */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    flexShrink: 0
                                  }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      color: 'rgba(255, 255, 255, 0.9)',
                                      background: 'rgba(255, 255, 255, 0.2)',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '4px',
                                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                                    }}>
                                      {durationInWeeks}w
                                    </span>
                                  </div>
                                </div>
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
                      <label className="form-label">Assignees</label>
                      <div style={{ 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '0.75rem',
                        background: '#ffffff',
                        minHeight: '120px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {project.members.length === 0 ? (
                          <div style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                            No team members available
                          </div>
                        ) : (
                          project.members.map(member => (
                            <label 
                              key={member.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                transition: 'background-color 0.2s ease',
                                marginBottom: '0.25rem'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <input
                                type="checkbox"
                                checked={newTask.assignee_ids.includes(member.id)}
                                onChange={(e) => {
                                  console.log('Checkbox clicked for member:', member.name, 'Checked:', e.target.checked);
                                  console.log('Current assignee_ids:', newTask.assignee_ids);
                                  
                                  if (e.target.checked) {
                                    const newAssigneeIds = [...newTask.assignee_ids, member.id];
                                    console.log('Adding member, new assignee_ids:', newAssigneeIds);
                                    setNewTask({ 
                                      ...newTask, 
                                      assignee_ids: newAssigneeIds
                                    });
                                  } else {
                                    const newAssigneeIds = newTask.assignee_ids.filter(id => id !== member.id);
                                    console.log('Removing member, new assignee_ids:', newAssigneeIds);
                                    setNewTask({ 
                                      ...newTask, 
                                      assignee_ids: newAssigneeIds
                                    });
                                  }
                                }}
                                style={{ 
                                  marginRight: '0.5rem',
                                  accentColor: '#000000',
                                  transform: 'scale(1.2)'
                                }}
                              />
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: newTask.assignee_ids.includes(member.id) ? '#000000' : '#f3f4f6',
                                color: newTask.assignee_ids.includes(member.id) ? '#ffffff' : '#000000',
                                border: '2px solid #000000',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.875rem',
                                fontWeight: '600'
                              }}>
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ 
                                fontSize: '0.9rem', 
                                fontWeight: '500',
                                color: newTask.assignee_ids.includes(member.id) ? '#000000' : '#374151'
                              }}>
                        {member.name}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                      {newTask.assignee_ids.length > 0 && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.75rem', 
                          background: newTask.assignee_ids.length > 1 ? '#dcfce7' : '#f0f9ff', 
                          border: newTask.assignee_ids.length > 1 ? '2px solid #16a34a' : '1px solid #3b82f6', 
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          color: newTask.assignee_ids.length > 1 ? '#15803d' : '#1e40af',
                          fontWeight: '600'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {newTask.assignee_ids.length > 1 && <span style={{ fontSize: '1.2rem' }}>✅</span>}
                            <strong>
                              {newTask.assignee_ids.length} assignee{newTask.assignee_ids.length === 1 ? '' : 's'} selected
                              {newTask.assignee_ids.length > 1 && ' (Multiple assignees!)'}
                            </strong>
                          </div>
                          <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', opacity: 0.8 }}>
                            Selected: {project.members.filter(m => newTask.assignee_ids.includes(m.id)).map(m => m.name).join(', ')}
                          </div>
                        </div>
                      )}
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
                      <label className="form-label">Duration (minutes)</label>
                      <input
                        type="number"
                        min="5"
                        step="5"
                        className="form-input"
                        placeholder="30"
                        value={newTask.duration}
                        onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 30 })}
                      />
                      <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                        Estimated time to complete this task
                      </small>
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