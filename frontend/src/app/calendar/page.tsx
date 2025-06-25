'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TagIcon,

} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
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
  color?: string;
  task_count?: number;
  completed_task_count?: number;
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
  project_name?: string;
  project_color?: string;
  is_important?: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  const fetchData = async () => {
    try {
      const [projectsData, tasksData] = await Promise.all([
        projectService.getProjects(),
        taskService.getUserTasks()
      ]);
      
      // Filter tasks to only show those assigned to the user or created by the user
      const userTasks = tasksData.filter((task: Task) => {
        return task.assignee?.id === user?.id || task.created_by?.id === user?.id;
      });
      
      // Add project info to tasks
      const tasksWithProjectInfo = userTasks.map((task: Task) => {
        const project = projectsData.find((p: Project) => p.id === task.project_id);
        return {
          ...task,
          project_name: project?.name || 'Unknown Project',
          project_color: project?.color || '#6b7280',
          is_important: task.priority === 'urgent' || task.priority === 'high',
          tags_list: task.tags_list || [], // Ensure tags_list is always an array
          assignee: task.assignee || null // Ensure assignee is properly handled
        };
      });
      
      setProjects(projectsData);
      setTasks(tasksWithProjectInfo);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
    const filteredTasks = tasks.filter(task => {
      const taskDueDate = task.due_date ? task.due_date.split('T')[0] : null;
      return taskDueDate === dateString;
    });
    
    // Sort by priority (urgent/high first) and then by name
    return filteredTasks.sort((a, b) => {
      if (a.is_important && !b.is_important) return -1;
      if (!a.is_important && b.is_important) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const toggleTaskImportant = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Toggle between high/urgent and medium priority
      const newPriority = task.is_important ? 'medium' : 'high';
      
      await taskService.updateTask(taskId, { priority: newPriority });
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, priority: newPriority, is_important: !t.is_important }
          : t
      ));
    } catch (err) {
      console.error('Failed to update task importance:', err);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon style={{ width: '12px', height: '12px', color: '#000000' }} />;
      case 'high':
        return <ExclamationTriangleIcon style={{ width: '12px', height: '12px', color: '#000000' }} />;
      case 'medium':
        return <ClockIcon style={{ width: '12px', height: '12px', color: '#000000' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#000000';
      case 'in_progress':
        return '#6b7280';
      case 'review':
        return '#9ca3af';
      default:
        return '#d1d5db';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: newStatus }
          : t
      ));
      
      // Update selectedTask if it's the one being updated
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleTaskModalOpen = (task: Task) => {
    if (showTaskModal) return; // Prevent multiple modals
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCloseTaskDetail = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (taskData: any) => {
    try {
      await taskService.updateTask(selectedTask!.id, taskData);
      // Refresh data to get updated task
      await fetchData();
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      // Refresh data after deletion
      await fetchData();
      handleCloseTaskDetail();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };



  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showTaskModal) {
        setShowTaskModal(false);
        setSelectedTask(null);
      }
    };

    if (showTaskModal) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showTaskModal]);

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

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
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
          }
          .calendar-container {
            min-height: 100vh;
            display: flex;
            background: #f8fafc;
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
          .header-controls {
            display: flex;
            align-items: center;
            gap: 2rem;
          }
          .filter-controls {
            display: flex;
            gap: 1rem;
          }
          .filter-btn {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
          }
          .filter-btn:hover {
            background: #f9fafb;
            transform: translateY(-1px);
          }
          .filter-btn.active {
            background: #000000;
            color: #ffffff;
          }
          .calendar-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            border-top: 2px solid #000000;
            padding-top: 1rem;
          }
          .calendar-stats .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
            background: rgba(255, 255, 255, 0.8);
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
          }
          .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 500;
          }
          .stat-value {
            font-size: 1.25rem;
            font-weight: bold;
            color: #000000;
          }
          .stat-value.overdue {
            color: #000000;
            font-weight: 800;
          }
          .header-title {
            font-size: 1.875rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .calendar-nav {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .nav-btn {
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 0.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .nav-btn:hover {
            background: #f9fafb;
            transform: translateY(-1px);
          }
          .month-year {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            min-width: 200px;
            text-align: center;
          }
          .calendar-content {
            padding: 2rem;
          }
          .calendar-grid {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .calendar-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            background: #f8fafc;
            border-bottom: 2px solid #000000;
          }
          .calendar-header-cell {
            padding: 1rem;
            text-align: center;
            font-weight: 600;
            color: #000000;
            border-right: 1px solid #e5e7eb;
          }
          .calendar-header-cell:last-child {
            border-right: none;
          }
          .calendar-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
          }
          .calendar-cell {
            min-height: 120px;
            padding: 0.75rem;
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
            background: #ffffff;
            transition: all 0.2s ease;
          }
          .calendar-cell:hover {
            background: #f9fafb;
          }
          .calendar-cell:nth-child(7n) {
            border-right: none;
          }
          .calendar-cell.other-month {
            background: #f8fafc;
            color: #9ca3af;
          }
          .calendar-cell.today {
            background: #f3f4f6;
            border: 2px solid #000000;
          }
          .day-number {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
          }
          .calendar-cell.other-month .day-number {
            color: #9ca3af;
          }
          .calendar-cell.today .day-number {
            color: #000000;
            font-weight: 800;
          }
          .events-container {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .task-item {
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 0.5rem;
            font-size: 0.7rem;
            margin-bottom: 0.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }
          .task-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-color: #000000;
          }
          .task-item.important {
            border-color: #000000;
            background: #f3f4f6;
          }
          .task-item.overdue {
            border-color: #000000;
            background: #e5e7eb;
          }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.25rem;
          }
          .task-name {
            font-weight: 600;
            color: #000000;
            line-height: 1.2;
            flex: 1;
            margin-right: 0.25rem;
          }
          .task-icons {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .task-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.65rem;
          }
          .project-name {
            font-weight: 500;
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .assignee {
            display: flex;
            align-items: center;
            gap: 0.125rem;
            color: #6b7280;
          }
          .more-tasks {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
            font-size: 0.65rem;
            color: #6b7280;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .more-tasks:hover {
            background: #e5e7eb;
          }
          

          
          /* Enhanced Task Modal */
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
            box-sizing: border-box;
          }
          .enhanced-task-modal {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 12px;
            width: 100%;
            max-width: 900px;
            height: 85vh;
            max-height: 85vh;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
          }
          .task-details-section {
            padding: 1.5rem;
            border-bottom: 2px solid #e5e7eb;
            flex-shrink: 0;
            max-height: 60%;
            overflow-y: auto;
          }
          .interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 250px;
            background: #ffffff;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5rem;
            border-bottom: 2px solid #000000;
            background: #f8fafc;
          }
          .modal-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin: 0;
            flex: 1;
            line-height: 1.3;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            font-weight: bold;
            color: #6b7280;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            color: #000000;
          }
          /* Tab Navigation */
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #000000;
            background: #f8fafc;
            flex-shrink: 0;
            z-index: 1;
          }
          .tab-btn {
            flex: 1;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-right: 1px solid #e5e7eb;
            font-weight: 600;
            color: #6b7280;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            min-height: 60px;
          }
          .tab-btn:last-child {
            border-right: none;
          }
          .tab-btn:hover {
            background: #e5e7eb;
            color: #000000;
          }
          .tab-btn.active {
            background: #ffffff;
            color: #000000;
            border-bottom: 3px solid #000000;
            margin-bottom: -2px;
          }

          /* Comments Section */
          .comments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .comments-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .empty-comments, .empty-files {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
          }
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
          }
          .comment-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #f3f4f6;
          }
          .comment-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .author-avatar, .current-user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #000000;
            flex-shrink: 0;
          }
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .author-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
          }
          .comment-time {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .comment-content {
            margin-left: 2.75rem;
            font-size: 0.875rem;
            color: #374151;
            line-height: 1.5;
          }
          .add-comment {
            border-top: 1px solid #e5e7eb;
            padding: 1.5rem;
            background: #f8fafc;
          }
          .comment-input-container {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 0;
            margin: 0;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
          }
          .comment-input:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          .send-comment-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .send-comment-btn:hover:not(:disabled) {
            background: #374151;
            transform: translateY(-1px);
          }
          .send-comment-btn:disabled {
            background: #d1d5db;
            cursor: not-allowed;
          }

          /* Files Section */
          .files-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            background: #f8fafc;
          }
          .files-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #000000;
            margin: 0;
          }
          .upload-btn {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .upload-btn:hover {
            background: #374151;
            transform: translateY(-1px);
          }
          .files-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .file-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
          }
          .file-item:hover {
            border-color: #000000;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .file-item:last-child {
            margin-bottom: 0;
          }
          .file-icon {
            width: 40px;
            height: 40px;
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #6b7280;
            flex-shrink: 0;
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-weight: 600;
            color: #000000;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
          }
          .file-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.75rem;
            color: #6b7280;
          }
          .file-actions {
            display: flex;
            gap: 0.5rem;
          }
          .download-btn {
            background: #ffffff;
            color: #6b7280;
            border: 1px solid #d1d5db;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .download-btn:hover {
            color: #000000;
            border-color: #000000;
            transform: translateY(-1px);
          }
          .task-status-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid;
          }
          .status-todo { background: #ffffff; color: #000000; border-color: #000000; }
          .status-in_progress { background: #d1d5db; color: #000000; border-color: #000000; }
          .status-review { background: #9ca3af; color: #ffffff; border-color: #000000; }
          .status-done { background: #000000; color: #ffffff; border-color: #000000; }
          .priority-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            border: 1px solid;
          }
          .priority-low { background: #ffffff; color: #000000; border-color: #000000; }
          .priority-medium { background: #d1d5db; color: #000000; border-color: #000000; }
          .priority-high { background: #6b7280; color: #ffffff; border-color: #000000; }
          .priority-urgent { background: #000000; color: #ffffff; border-color: #000000; }
          .description {
            margin-bottom: 1.5rem;
          }
          .description h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #000000;
            margin: 0 0 0.5rem 0;
          }
          .description p {
            font-size: 0.875rem;
            color: #374151;
            line-height: 1.5;
            margin: 0;
          }
          .task-metadata {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .meta-item .label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #6b7280;
            min-width: 80px;
          }
          .meta-item .value {
            font-size: 0.8rem;
            color: #000000;
            text-align: right;
            flex: 1;
          }
          .meta-item .value.overdue {
            color: #dc2626;
            font-weight: 600;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            justify-content: flex-end;
          }
          .tag {
            background: #f3f4f6;
            color: #374151;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 0.2rem;
            border: 1px solid #d1d5db;
          }

          .status-change-section {
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1rem;
          }
          .status-change-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .status-change-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .status-change-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 2px solid #000000;
            border-radius: 6px;
            background: #ffffff;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .status-change-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .status-change-btn.active {
            background: #000000;
            color: #ffffff;
          }
          .status-change-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          /* Modal Splitter Styles */
          .modal-splitter {
            height: 8px;
            background: linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
            border-top: 1px solid #d1d5db;
            border-bottom: 1px solid #d1d5db;
            cursor: ns-resize;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            user-select: none;
          }
          .modal-splitter:hover {
            background: linear-gradient(to bottom, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%);
            border-color: #9ca3af;
          }
          .modal-splitter.dragging {
            background: linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%);
            border-color: #1d4ed8;
          }
          .splitter-handle {
            width: 40px;
            height: 4px;
            background: #9ca3af;
            border-radius: 2px;
            transition: all 0.2s ease;
          }
          .modal-splitter:hover .splitter-handle {
            background: #6b7280;
            width: 60px;
          }
          .modal-splitter.dragging .splitter-handle {
            background: #ffffff;
            width: 80px;
            height: 3px;
          }
          
          .resizable-task-details {
            overflow-y: auto;
            flex: none;
          }
          
          .resizable-interaction-section {
            flex: none;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          /* Responsive Design */
          
          /* Large desktop styles */
          @media (max-width: 1400px) {
            .calendar-cell {
              min-height: 110px;
            }
          }
          
          /* Desktop styles */
          @media (max-width: 1200px) {
            .calendar-stats {
              grid-template-columns: repeat(3, 1fr);
            }
            .header-controls {
              flex-direction: column;
              gap: 1rem;
            }
            .calendar-cell {
              min-height: 100px;
              padding: 0.75rem;
            }
            .task-item {
              font-size: 0.65rem;
              padding: 0.4rem;
            }
          }
          
          /* Tablet styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
            .header {
              padding: 1rem 1.5rem;
            }
            .calendar-content {
              padding: 1.5rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            .calendar-cell {
              min-height: 90px;
              padding: 0.625rem;
            }
            .calendar-header-cell {
              padding: 0.875rem;
            }
            .task-item {
              font-size: 0.7rem;
              padding: 0.5rem;
            }
            .task-name {
              font-size: 0.75rem;
            }
            .task-meta {
              font-size: 0.65rem;
            }
          }
          
          /* Mobile styles */
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
              width: 100%;
              max-width: 100vw;
              overflow-x: hidden;
            }
            .header {
              padding: 0.875rem;
              position: sticky;
              top: 0;
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              z-index: 30;
              width: 100%;
              box-sizing: border-box;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .header-content {
              flex-direction: column;
              gap: 0.875rem;
              margin-bottom: 0.875rem;
            }
            .header-controls {
              width: 100%;
              max-width: 100%;
            }
            .calendar-nav {
              justify-content: space-between;
              width: 100%;
              max-width: 280px;
              margin: 0 auto;
            }
            .month-year {
              font-size: 1rem;
              font-weight: 700;
              color: #000000;
              text-align: center;
              flex: 1;
            }
            .nav-btn {
              padding: 0.75rem;
              min-width: 44px;
              min-height: 44px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .filter-btn {
              display: none;
            }
            .calendar-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.375rem;
              margin-top: 0.875rem;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }
            .stat-item {
              padding: 0.625rem 0.25rem;
              border-radius: 6px;
              background: rgba(255, 255, 255, 0.95);
              border: 1px solid #e5e7eb;
              text-align: center;
              min-height: 50px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              box-sizing: border-box;
              overflow: hidden;
            }
            .stat-value {
              font-size: 1.125rem;
              font-weight: 800;
              margin-bottom: 0.125rem;
              line-height: 1;
            }
            .stat-label {
              font-size: 0.6rem;
              font-weight: 600;
              color: #6b7280;
              line-height: 1.2;
              word-break: break-word;
            }
            .calendar-content {
              padding: 0.875rem;
              width: 100%;
              box-sizing: border-box;
            }
            .calendar-grid {
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              border: 1px solid #e5e7eb;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }
            
            /* Mobile Calendar Header */
            .calendar-header {
              background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
              padding: 0;
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              width: 100%;
            }
            .calendar-header-cell {
              color: #ffffff;
              font-weight: 700;
              font-size: 0.75rem;
              text-align: center;
              padding: 0.75rem 0.125rem;
              border-right: 1px solid rgba(255, 255, 255, 0.1);
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-header-cell:last-child {
              border-right: none;
            }
            
            /* Mobile Calendar Body */
            .calendar-body {
              background: #ffffff;
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              width: 100%;
            }
            .calendar-cell {
              min-height: 85px;
              padding: 0.375rem;
              border-right: 1px solid #f1f5f9;
              border-bottom: 1px solid #f1f5f9;
              background: #ffffff;
              transition: all 0.2s ease;
              position: relative;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-cell:hover {
              background: #f8fafc;
              border-color: #e2e8f0;
            }
            .calendar-cell:nth-child(7n) {
              border-right: none;
            }
            .calendar-cell.other-month {
              background: #f9fafb;
              opacity: 0.6;
            }
            .calendar-cell.other-month .day-number {
              color: #9ca3af;
            }
            .calendar-cell.today {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              border: 2px solid #000000;
              box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
            }
            .calendar-cell.today .day-number {
              color: #000000;
              font-weight: 800;
            }
            .day-number {
              font-size: 0.8rem;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 0.25rem;
              display: block;
              text-align: left;
            }
            .events-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
              overflow: hidden;
            }
            .task-item {
              font-size: 0.6rem;
              padding: 0.25rem;
              border-radius: 4px;
              margin-bottom: 0;
              min-height: auto;
              line-height: 1.2;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid transparent;
              position: relative;
              overflow: hidden;
            }
            .task-item:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              border-color: rgba(0, 0, 0, 0.1);
            }
            .task-header {
              margin-bottom: 0.125rem;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .task-name {
              font-size: 0.6rem;
              line-height: 1.2;
              font-weight: 600;
              color: #1f2937;
              flex: 1;
              margin-right: 0.125rem;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .task-icons {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              flex-shrink: 0;
            }
            .task-meta {
              font-size: 0.5rem;
              color: #6b7280;
              line-height: 1.1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
            }
            .project-name {
              font-weight: 500;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .assignee {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              font-size: 0.5rem;
              color: #6b7280;
            }
            .more-tasks {
              padding: 0.1875rem;
              font-size: 0.55rem;
              border-radius: 3px;
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              color: #6b7280;
              text-align: center;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid #d1d5db;
              margin-top: 0.125rem;
            }
            .more-tasks:hover {
              background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
              color: #374151;
              transform: translateY(-1px);
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.25rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
              gap: 0.25rem;
            }
            .stat-item {
              padding: 0.5rem 0.125rem;
              min-height: 45px;
            }
            .stat-value {
              font-size: 1rem;
            }
            .stat-label {
              font-size: 0.55rem;
            }
            .calendar-nav {
              max-width: 260px;
            }
            .month-year {
              font-size: 0.9rem;
            }
            .nav-btn {
              min-width: 40px;
              min-height: 40px;
              padding: 0.625rem;
            }
            .calendar-content {
              padding: 0.625rem;
            }
            .calendar-header-cell {
              font-size: 0.65rem;
              padding: 0.625rem 0.0625rem;
            }
            .calendar-cell {
              min-height: 70px;
              padding: 0.25rem;
            }
            .day-number {
              font-size: 0.75rem;
              margin-bottom: 0.1875rem;
            }
            .task-item {
              font-size: 0.55rem;
              padding: 0.1875rem;
              border-radius: 3px;
            }
            .task-name {
              font-size: 0.55rem;
              line-height: 1.1;
            }
            .task-meta {
              font-size: 0.45rem;
            }
            .project-name {
              width: 100%;
            }
            .assignee {
              font-size: 0.45rem;
            }
            .more-tasks {
              font-size: 0.5rem;
              padding: 0.125rem;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .calendar-cell {
              min-height: 60px;
            }
          }
            
            /* Mobile Modal Styles */
            .modal-overlay {
              padding: 0.75rem;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.6);
            }
            .enhanced-task-modal {
              margin: 0;
              width: 100%;
              max-width: calc(100vw - 1.5rem);
              max-height: calc(100vh - 1.5rem);
              height: auto;
              min-height: 80vh;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            .modal-header {
              padding: 1rem;
              border-bottom: 1px solid #e5e7eb;
              background: #ffffff;
              position: relative;
              flex-shrink: 0;
            }
            .modal-header h3 {
              font-size: 1rem;
              line-height: 1.3;
              padding-right: 2.5rem;
              margin: 0;
              font-weight: 600;
            }
            .close-btn {
              position: absolute;
              top: 0.75rem;
              right: 0.75rem;
              font-size: 1.125rem;
              padding: 0.375rem;
              background: #f8fafc;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e7eb;
            }
            .task-details-section {
              padding: 1rem;
              flex: 1;
              overflow-y: auto;
              background: #ffffff;
            }
            .task-status-row {
              display: flex;
              gap: 0.5rem;
              align-items: flex-start;
              margin-bottom: 1rem;
              flex-wrap: wrap;
            }
            .status-badge, .priority-badge {
              font-size: 0.7rem;
              padding: 0.375rem 0.75rem;
              border-radius: 20px;
              font-weight: 600;
            }
            .description {
              margin-bottom: 1rem;
            }
            .description h4 {
              font-size: 0.85rem;
              margin-bottom: 0.5rem;
            }
            .description p {
              font-size: 0.8rem;
              line-height: 1.4;
            }
            .task-metadata {
              gap: 0.75rem;
              margin-bottom: 1rem;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0.5rem 0;
              border-bottom: 1px solid #f3f4f6;
            }
            .meta-item:last-child {
              border-bottom: none;
            }
            .meta-item .label {
              font-size: 0.7rem;
              color: #6b7280;
              font-weight: 500;
              min-width: 60px;
            }
            .meta-item .value {
              font-size: 0.8rem;
              text-align: right;
              flex: 1;
              font-weight: 500;
            }
            .meta-item .value.overdue {
              color: #dc2626;
              font-weight: 600;
            }
            .tags {
              justify-content: flex-end;
              flex-wrap: wrap;
              gap: 0.25rem;
            }
            .tag {
              font-size: 0.65rem;
              padding: 0.2rem 0.5rem;
              background: #f3f4f6;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            }
            .status-change-section {
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 1rem;
            }
            .status-change-title {
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
              color: #000000;
            }
            .status-change-buttons {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem 0.5rem;
              font-size: 0.75rem;
              justify-content: center;
              min-height: 44px;
              border-radius: 6px;
              font-weight: 500;
            }
            
            /* Mobile Modal Splitter */
            .modal-splitter {
              height: 8px;
              touch-action: none;
              background: #f3f4f6;
              cursor: ns-resize;
            }
            .splitter-handle {
              width: 40px;
              height: 3px;
              background: #9ca3af;
            }
            
            /* Mobile Tab Navigation */
            .tab-navigation {
              overflow-x: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
              background: #f8fafc;
              border-bottom: 1px solid #e5e7eb;
              flex-shrink: 0;
            }
            .tab-navigation::-webkit-scrollbar {
              display: none;
            }
            .tab-btn {
              padding: 0.875rem 1rem;
              font-size: 0.8rem;
              min-width: 100px;
              white-space: nowrap;
              min-height: 48px;
              font-weight: 500;
            }
            
            /* Mobile Comments & Files */
            .comments-list, .files-list {
              max-height: 200px;
              padding: 0.875rem;
              overflow-y: auto;
            }
            .comment-item {
              margin-bottom: 1rem;
              padding-bottom: 0.75rem;
            }
            .comment-header {
              gap: 0.5rem;
              margin-bottom: 0.5rem;
            }
            .author-avatar, .current-user-avatar {
              width: 32px;
              height: 32px;
              font-size: 0.8rem;
            }
            .comment-content {
              margin-left: 2.5rem;
              font-size: 0.85rem;
              line-height: 1.4;
            }
            .add-comment {
              padding: 1rem;
              background: #f8fafc;
              border-top: 1px solid #e5e7eb;
            }
            .comment-input-container {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .comment-input {
              min-height: 80px;
              font-size: 0.9rem;
              padding: 0.875rem;
              border-radius: 8px;
              border: 2px solid #e5e7eb;
              resize: vertical;
            }
            .comment-input:focus {
              border-color: #000000;
              outline: none;
            }
            .send-comment-btn {
              align-self: stretch;
              padding: 0.875rem;
              justify-content: center;
              font-size: 0.85rem;
              min-height: 44px;
              background: #000000;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              font-weight: 600;
            }
            .files-header {
              padding: 1rem;
              background: #f8fafc;
              border-bottom: 1px solid #e5e7eb;
            }
            .files-header h4 {
              font-size: 0.9rem;
              font-weight: 600;
              margin: 0;
            }
            .upload-btn {
              padding: 0.625rem 1rem;
              font-size: 0.8rem;
              min-height: 40px;
              background: #000000;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              font-weight: 500;
            }
            .file-item {
              padding: 0.875rem;
              border-bottom: 1px solid #f3f4f6;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }
            .file-item:last-child {
              border-bottom: none;
            }
            .file-icon {
              width: 40px;
              height: 40px;
              background: #f3f4f6;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .file-info {
              flex: 1;
              min-width: 0;
            }
            .file-name {
              font-size: 0.85rem;
              font-weight: 500;
              margin-bottom: 0.25rem;
              word-break: break-word;
            }
            .file-meta {
              font-size: 0.7rem;
              color: #6b7280;
              display: flex;
              gap: 0.5rem;
            }
            .file-actions {
              flex-shrink: 0;
            }
            .download-btn {
              padding: 0.5rem;
              font-size: 0.8rem;
              min-height: 36px;
              min-width: 36px;
              background: #f8fafc;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.875rem;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .calendar-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            .stat-item {
              padding: 0.75rem;
            }
            .calendar-nav {
              gap: 1rem;
            }
            .month-year {
              font-size: 1rem;
              min-width: 150px;
            }
            .calendar-content {
              padding: 0.75rem;
            }
            .calendar-cell {
              padding: 0.875rem;
              flex-direction: column;
              align-items: flex-start;
            }
            .day-number {
              align-self: flex-start;
              margin-bottom: 0.75rem;
              margin-right: 0;
            }
            .events-container {
              width: 100%;
            }
            .important-tasks-sidebar {
              margin: 0.75rem;
            }
            .important-tasks-list {
              padding: 0.875rem;
            }
            .important-task-item {
              padding: 0.875rem;
              flex-direction: column;
              gap: 0.75rem;
            }
            .star-btn-large {
              align-self: flex-end;
            }
            .enhanced-task-modal {
              border-radius: 8px 8px 0 0;
              max-height: 95vh;
              height: 95vh;
            }
            .modal-header {
              padding: 0.875rem;
            }
            .modal-header h3 {
              font-size: 0.9rem;
              padding-right: 2rem;
            }
            .close-btn {
              width: 28px;
              height: 28px;
              top: 0.625rem;
              right: 0.625rem;
              font-size: 1rem;
            }
            .task-details-section {
              padding: 0.875rem;
            }
            .task-status-row {
              gap: 0.375rem;
            }
            .status-badge, .priority-badge {
              font-size: 0.65rem;
              padding: 0.3rem 0.6rem;
            }
            .meta-item .label {
              font-size: 0.65rem;
              min-width: 50px;
            }
            .meta-item .value {
              font-size: 0.75rem;
            }
            .status-change-section {
              padding: 0.875rem;
            }
            .status-change-title {
              font-size: 0.8rem;
            }
            .status-change-buttons {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem;
              font-size: 0.7rem;
            }
            .tab-btn {
              min-width: 80px;
              padding: 0.75rem 0.75rem;
              font-size: 0.75rem;
              min-height: 44px;
            }
            .comment-input {
              min-height: 70px;
              font-size: 0.85rem;
              padding: 0.75rem;
            }
            .send-comment-btn {
              padding: 0.75rem;
              font-size: 0.8rem;
              min-height: 40px;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .enhanced-task-modal {
              height: 90vh;
              max-height: 90vh;
              align-items: center;
              border-radius: 12px;
            }
            .modal-overlay {
              align-items: center;
              padding: 1rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .important-tasks-sidebar {
              order: 0;
            }
          }
        `
      }} />
      
      <div className="calendar-container">
        <Sidebar 
          projects={projects} 
          onCreateProject={() => {}} 
        />
        
        <div className="main-content">
          <header className="header">
            <div className="header-content">
              <h1 className="header-title">
                <CalendarIcon style={{ width: '32px', height: '32px' }} />
                Calendar
              </h1>
              
              <div className="header-controls">
                <div className="calendar-nav">
                  <button onClick={previousMonth} className="nav-btn">
                    <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                  <div className="month-year">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </div>
                  <button onClick={nextMonth} className="nav-btn">
                    <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
                

              </div>
            </div>
            
            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-label">Total Tasks</span>
                <span className="stat-value">{tasks.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{tasks.filter(t => t.status === 'in_progress').length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Due Today</span>
                <span className="stat-value">
                  {getTasksForDate(today).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Overdue</span>
                <span className="stat-value overdue">
                  {tasks.filter(t => isOverdue(t.due_date)).length}
                </span>
              </div>
            </div>
          </header>

          <main className="calendar-content">
            <div className="calendar-grid">
              <div className="calendar-header">
                {daysOfWeek.map((day) => (
                  <div key={day} className="calendar-header-cell">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="calendar-body">
                {/* Empty cells for days before the first day of the month */}
                {Array.from({ length: firstDay }, (_, index) => {
                  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                  const prevMonthDays = getDaysInMonth(prevMonth);
                  const dayNumber = prevMonthDays - firstDay + index + 1;
                  
                  return (
                    <div key={`prev-${index}`} className="calendar-cell other-month">
                      <div className="day-number">{dayNumber}</div>
                    </div>
                  );
                })}
                
                {/* Days of the current month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const dayNumber = index + 1;
                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                  const isToday = currentDate.getMonth() === today.getMonth() && 
                                  currentDate.getFullYear() === today.getFullYear() && 
                                  dayNumber === today.getDate();
                  
                  const dayTasks = getTasksForDate(cellDate);
                  
                  return (
                    <div key={dayNumber} className={`calendar-cell ${isToday ? 'today' : ''}`}>
                      <div className="day-number">{dayNumber}</div>
                      <div className="events-container">
                        {(dayTasks || []).slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`task-item ${task.is_important ? 'important' : ''} ${isOverdue(task.due_date) ? 'overdue' : ''}`}
                            style={{ borderLeft: `3px solid ${getStatusColor(task.status)}` }}
                            onClick={() => handleTaskModalOpen(task)}
                          >
                            <div className="task-header">
                              <span className="task-name">{task.name}</span>
                              <div className="task-icons">
                                {getPriorityIcon(task.priority)}
                              </div>
                            </div>
                            <div className="task-meta">
                              <span className="project-name" style={{ color: '#000000' }}>
                                {task.project_name}
                              </span>
                              {task.assignee && (
                                <span className="assignee">
                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                  {task.assignee.name ? task.assignee.name.split(' ')[0] : 'Unknown'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {(dayTasks || []).length > 3 && (
                          <div className="more-tasks">
                            +{(dayTasks || []).length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Fill remaining cells with next month's days */}
                {Array.from({ length: 42 - (firstDay + daysInMonth) }, (_, index) => {
                  const dayNumber = index + 1;
                  
                  return (
                    <div key={`next-${index}`} className="calendar-cell other-month">
                      <div className="day-number">{dayNumber}</div>
                    </div>
                  );
                })}
              </div>
            </div>



            {/* Task Detail Modal */}
            {showTaskModal && selectedTask && (
              <TaskDetailModal
                task={selectedTask}
                users={[]} // Calendar doesn't need user list for assignment changes
                onClose={handleCloseTaskDetail}
                onSave={handleUpdateTask}
                onStatusChange={updateTaskStatus}
                onDelete={handleDeleteTask}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 