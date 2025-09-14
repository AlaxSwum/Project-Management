'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  FlagIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  StarIcon,
  EyeIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid, StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PersonalTask {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  tags?: string[];
  due_date?: string;
  estimated_duration?: number;
  actual_duration?: number;
  is_recurring: boolean;
  recurring_pattern?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface PersonalTimeBlock {
  id: string;
  user_id: string;
  task_id?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  block_type: 'task' | 'break' | 'meeting' | 'focus' | 'personal' | 'other';
  color: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

type ViewType = 'month' | 'week' | 'day';
type LayoutType = 'list' | 'kanban' | 'calendar';

export default function PersonalTaskManager() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<PersonalTimeBlock[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [layoutType, setLayoutType] = useState<LayoutType>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTimeBlockModal, setShowTimeBlockModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<PersonalTimeBlock | null>(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isEditingTimeBlock, setIsEditingTimeBlock] = useState(false);
  
  // Form states
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending' as PersonalTask['status'],
    priority: 'medium' as PersonalTask['priority'],
    category: '',
    tags: [] as string[],
    due_date: '',
    estimated_duration: 0,
    is_recurring: false
  });
  
  const [newTimeBlock, setNewTimeBlock] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    block_type: 'task' as PersonalTimeBlock['block_type'],
    color: '#3B82F6',
    notes: ''
  });

  // Categories for dropdown
  const categories = [
    'Work', 'Personal', 'Health', 'Learning', 'Finance', 'Shopping', 'Travel', 'Other'
  ];

  // Load data
  useEffect(() => {
    if (isAuthenticated && user) {
      loadPersonalData();
    }
  }, [isAuthenticated, user, currentView, currentDate]);

  const loadPersonalData = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Get date range based on current view
      const { startDate, endDate } = getDateRange();

      // Load tasks
      let taskQuery = supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Apply date filter if not showing all
      if (currentView !== 'month' || layoutType === 'calendar') {
        taskQuery = taskQuery
          .gte('due_date', startDate.toISOString())
          .lte('due_date', endDate.toISOString());
      }

      const { data: tasksData, error: tasksError } = await taskQuery;

      if (tasksError) {
        console.error('Error loading tasks:', tasksError);
        setError('Failed to load tasks');
        return;
      }

      // Load time blocks
      const { data: timeBlocksData, error: timeBlocksError } = await supabase
        .from('personal_time_blocks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });

      if (timeBlocksError) {
        console.error('Error loading time blocks:', timeBlocksError);
        setError('Failed to load time blocks');
        return;
      }

      setTasks(tasksData || []);
      setTimeBlocks(timeBlocksData || []);
    } catch (error) {
      console.error('Error loading personal data:', error);
      setError('Failed to load personal data');
    } finally {
      setIsLoading(false);
    }
  };

  const getDateRange = () => {
    const today = new Date(currentDate);
    let startDate: Date;
    let endDate: Date;

    switch (currentView) {
      case 'day':
        startDate = new Date(today);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - today.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
    }

    return { startDate, endDate };
  };

  const handleCreateTask = async () => {
    try {
      if (!newTask.title.trim()) {
        setError('Task title is required');
        return;
      }

      const taskData = {
        ...newTask,
        user_id: user?.id,
        tags: newTask.tags.length > 0 ? newTask.tags : null,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        estimated_duration: newTask.estimated_duration || null
      };

      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        setError('Failed to create task');
        return;
      }

      setTasks(prev => [data, ...prev]);
      setShowTaskModal(false);
      resetTaskForm();
      setSuccessMessage('Task created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async () => {
    try {
      if (!selectedTask || !newTask.title.trim()) {
        setError('Task title is required');
        return;
      }

      const updateData = {
        ...newTask,
        tags: newTask.tags.length > 0 ? newTask.tags : null,
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
        estimated_duration: newTask.estimated_duration || null
      };

      const { data, error } = await supabase
        .from('personal_tasks')
        .update(updateData)
        .eq('id', selectedTask.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task');
        return;
      }

      setTasks(prev => prev.map(task => task.id === selectedTask.id ? data : task));
      setShowTaskModal(false);
      resetTaskForm();
      setSuccessMessage('Task updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleCreateTimeBlock = async () => {
    try {
      if (!newTimeBlock.title.trim() || !newTimeBlock.start_time || !newTimeBlock.end_time) {
        setError('Title, start time, and end time are required');
        return;
      }

      const startTime = new Date(newTimeBlock.start_time);
      const endTime = new Date(newTimeBlock.end_time);

      if (endTime <= startTime) {
        setError('End time must be after start time');
        return;
      }

      const timeBlockData = {
        ...newTimeBlock,
        user_id: user?.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      };

      const { data, error } = await supabase
        .from('personal_time_blocks')
        .insert([timeBlockData])
        .select()
        .single();

      if (error) {
        console.error('Error creating time block:', error);
        setError('Failed to create time block');
        return;
      }

      setTimeBlocks(prev => [...prev, data]);
      setShowTimeBlockModal(false);
      resetTimeBlockForm();
      setSuccessMessage('Time block created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating time block:', error);
      setError('Failed to create time block');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: PersonalTask['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('personal_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) {
        console.error('Error updating task:', error);
        setError('Failed to update task');
        return;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status, ...(status === 'completed' ? { completed_at: updateData.completed_at } : {}) }
          : task
      ));

      setSuccessMessage(`Task marked as ${status.replace('_', ' ')}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const { error } = await supabase
        .from('personal_tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        setError('Failed to delete task');
        return;
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
      setSuccessMessage('Task deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleDeleteTimeBlock = async (timeBlockId: string) => {
    if (!confirm('Are you sure you want to delete this time block?')) return;

    try {
      const { error } = await supabase
        .from('personal_time_blocks')
        .delete()
        .eq('id', timeBlockId);

      if (error) {
        console.error('Error deleting time block:', error);
        setError('Failed to delete time block');
        return;
      }

      setTimeBlocks(prev => prev.filter(block => block.id !== timeBlockId));
      setSuccessMessage('Time block deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting time block:', error);
      setError('Failed to delete time block');
    }
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'pending' as PersonalTask['status'],
      priority: 'medium' as PersonalTask['priority'],
      category: '',
      tags: [],
      due_date: '',
      estimated_duration: 0,
      is_recurring: false
    });
    setSelectedTask(null);
    setIsEditingTask(false);
  };

  const resetTimeBlockForm = () => {
    setNewTimeBlock({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      block_type: 'task' as PersonalTimeBlock['block_type'],
      color: '#3B82F6',
      notes: ''
    });
    setSelectedTimeBlock(null);
    setIsEditingTimeBlock(false);
  };

  const openEditTask = (task: PersonalTask) => {
    setSelectedTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category || '',
      tags: task.tags || [],
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : '',
      estimated_duration: task.estimated_duration || 0,
      is_recurring: task.is_recurring
    });
    setIsEditingTask(true);
    setShowTaskModal(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const formatDate = (date: Date) => {
    switch (currentView) {
      case 'day':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'in_progress': return '#3B82F6';
      case 'pending': return '#F59E0B';
      case 'cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const tasksByStatus = {
    pending: filteredTasks.filter(task => task.status === 'pending'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
    cancelled: filteredTasks.filter(task => task.status === 'cancelled')
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F8FAFC', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #E2E8F0', 
            borderTop: '4px solid #3B82F6', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .task-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            border-left: 4px solid #3B82F6;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border: 1px solid #E2E8F0;
          }
          
          .task-card:hover {
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            transform: translateY(-2px);
          }
          
          .task-card.completed {
            opacity: 0.7;
            background: #F8FAFC;
          }
          
          .kanban-column {
            background: #F1F5F9;
            border-radius: 12px;
            padding: 16px;
            min-height: 600px;
          }
          
          .kanban-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding: 8px 12px;
            background: white;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
          }
          
          .time-block {
            background: white;
            border-radius: 8px;
            padding: 12px;
            margin: 4px 0;
            border-left: 4px solid #3B82F6;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          .time-block:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }
          
          .priority-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }
          
          .view-tabs {
            display: flex;
            background: white;
            border-radius: 12px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
          }
          
          .view-tab {
            padding: 12px 20px;
            border-radius: 8px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            color: #64748B;
          }
          
          .view-tab.active {
            background: #3B82F6;
            color: white;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          }
          
          .layout-tabs {
            display: flex;
            background: white;
            border-radius: 12px;
            padding: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
          }
          
          .layout-tab {
            padding: 10px;
            border-radius: 8px;
            border: none;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #64748B;
          }
          
          .layout-tab.active {
            background: #3B82F6;
            color: white;
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(4px);
          }
          
          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }
          
          .form-group {
            margin-bottom: 20px;
          }
          
          .form-label {
            display: block;
            margin-bottom: 6px;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          
          .form-input {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #E2E8F0;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: #FAFBFC;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            background: white;
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 80px;
          }
          
          .btn {
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          
          .btn-primary {
            background: #3B82F6;
            color: white;
          }
          
          .btn-primary:hover {
            background: #2563EB;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
          
          .btn-secondary {
            background: #6B7280;
            color: white;
          }
          
          .btn-secondary:hover {
            background: #4B5563;
          }
          
          .btn-danger {
            background: #EF4444;
            color: white;
          }
          
          .btn-danger:hover {
            background: #DC2626;
          }
          
          .btn-success {
            background: #10B981;
            color: white;
          }
          
          .btn-success:hover {
            background: #059669;
          }
          
          .search-input {
            width: 100%;
            padding: 12px 16px 12px 44px;
            border: 2px solid #E2E8F0;
            border-radius: 12px;
            font-size: 14px;
            background: white;
            transition: all 0.2s ease;
          }
          
          .search-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .filter-select {
            padding: 8px 12px;
            border: 2px solid #E2E8F0;
            border-radius: 8px;
            font-size: 13px;
            background: white;
            cursor: pointer;
          }
          
          .filter-select:focus {
            outline: none;
            border-color: #3B82F6;
          }
          
          .stats-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
            text-align: center;
          }
          
          .stats-number {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          
          .stats-label {
            font-size: 12px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .alert {
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
          }
          
          .alert-error {
            background: #FEF2F2;
            border: 1px solid #FECACA;
            color: #B91C1C;
          }
          
          .alert-success {
            background: #F0FDF4;
            border: 1px solid #BBF7D0;
            color: #166534;
          }
          
          .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #64748B;
          }
          
          .empty-state-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            opacity: 0.5;
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />
        
        <div style={{ marginLeft: '256px', flex: 1, padding: '32px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1F2937', margin: 0, marginBottom: '8px' }}>
                  Personal Task Manager
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '16px' }}>
                  Organize your personal tasks and manage your time effectively
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    resetTaskForm();
                    setShowTaskModal(true);
                  }}
                  className="btn btn-primary"
                >
                  <PlusIcon style={{ width: '18px', height: '18px' }} />
                  New Task
                </button>
                <button
                  onClick={() => {
                    resetTimeBlockForm();
                    setShowTimeBlockModal(true);
                  }}
                  className="btn btn-secondary"
                >
                  <ClockIcon style={{ width: '18px', height: '18px' }} />
                  Time Block
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
              <div className="stats-card">
                <div className="stats-number" style={{ color: '#F59E0B' }}>{tasksByStatus.pending.length}</div>
                <div className="stats-label">Pending</div>
              </div>
              <div className="stats-card">
                <div className="stats-number" style={{ color: '#3B82F6' }}>{tasksByStatus.in_progress.length}</div>
                <div className="stats-label">In Progress</div>
              </div>
              <div className="stats-card">
                <div className="stats-number" style={{ color: '#10B981' }}>{tasksByStatus.completed.length}</div>
                <div className="stats-label">Completed</div>
              </div>
              <div className="stats-card">
                <div className="stats-number" style={{ color: '#64748B' }}>{tasks.length}</div>
                <div className="stats-label">Total Tasks</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
              <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Layout and View Controls */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div className="layout-tabs">
                <button
                  className={`layout-tab ${layoutType === 'list' ? 'active' : ''}`}
                  onClick={() => setLayoutType('list')}
                  title="List View"
                >
                  <ListBulletIcon style={{ width: '18px', height: '18px' }} />
                </button>
                <button
                  className={`layout-tab ${layoutType === 'kanban' ? 'active' : ''}`}
                  onClick={() => setLayoutType('kanban')}
                  title="Kanban View"
                >
                  <Squares2X2Icon style={{ width: '18px', height: '18px' }} />
                </button>
                <button
                  className={`layout-tab ${layoutType === 'calendar' ? 'active' : ''}`}
                  onClick={() => setLayoutType('calendar')}
                  title="Calendar View"
                >
                  <CalendarDaysIcon style={{ width: '18px', height: '18px' }} />
                </button>
              </div>

              {layoutType === 'calendar' && (
                <>
                  <div className="view-tabs">
                    <button
                      className={`view-tab ${currentView === 'month' ? 'active' : ''}`}
                      onClick={() => setCurrentView('month')}
                    >
                      Month
                    </button>
                    <button
                      className={`view-tab ${currentView === 'week' ? 'active' : ''}`}
                      onClick={() => setCurrentView('week')}
                    >
                      Week
                    </button>
                    <button
                      className={`view-tab ${currentView === 'day' ? 'active' : ''}`}
                      onClick={() => setCurrentView('day')}
                    >
                      Day
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => navigateDate('prev')}
                      className="btn btn-secondary"
                      style={{ padding: '8px' }}
                    >
                      <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                    
                    <h3 style={{ margin: 0, color: '#1F2937', fontSize: '16px', minWidth: '200px', textAlign: 'center' }}>
                      {formatDate(currentDate)}
                    </h3>
                    
                    <button
                      onClick={() => navigateDate('next')}
                      className="btn btn-secondary"
                      style={{ padding: '8px' }}
                    >
                      <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="alert alert-error">
              <ExclamationTriangleIcon style={{ width: '16px', height: '16px' }} />
              {error}
              <button
                onClick={() => setError('')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <XMarkIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success">
              <CheckIcon style={{ width: '16px', height: '16px' }} />
              {successMessage}
              <button
                onClick={() => setSuccessMessage('')}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <XMarkIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          )}

          {/* Main Content */}
          {layoutType === 'list' && (
            <div>
              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <ListBulletIcon className="empty-state-icon" />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No tasks found</h3>
                  <p style={{ margin: '0 0 20px 0' }}>
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Create your first task to get started'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                    <button
                      onClick={() => {
                        resetTaskForm();
                        setShowTaskModal(true);
                      }}
                      className="btn btn-primary"
                    >
                      <PlusIcon style={{ width: '16px', height: '16px' }} />
                      Create Task
                    </button>
                  )}
                </div>
              ) : (
                filteredTasks.map(task => (
                  <div 
                    key={task.id} 
                    className={`task-card ${task.status === 'completed' ? 'completed' : ''}`}
                    style={{ borderLeftColor: getPriorityColor(task.priority) }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: task.status === 'completed' ? '#6B7280' : '#1F2937',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        flex: 1
                      }}>
                        {task.title}
                      </h4>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: task.status === 'completed' ? '#10B981' : '#6B7280',
                            padding: '4px'
                          }}
                          title={task.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircleIconSolid style={{ width: '20px', height: '20px' }} />
                          ) : (
                            <CheckCircleIcon style={{ width: '20px', height: '20px' }} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => openEditTask(task)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6', padding: '4px' }}
                          title="Edit task"
                        >
                          <PencilIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '4px' }}
                          title="Delete task"
                        >
                          <TrashIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p style={{ margin: '0 0 12px 0', color: '#64748B', fontSize: '14px', lineHeight: '1.5' }}>
                        {task.description}
                      </p>
                    )}
                    
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span 
                        className="priority-badge"
                        style={{ 
                          background: getPriorityColor(task.priority) + '20',
                          color: getPriorityColor(task.priority)
                        }}
                      >
                        <FlagIcon style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                        {task.priority}
                      </span>
                      
                      <span 
                        className="status-badge"
                        style={{ 
                          background: getStatusColor(task.status) + '20',
                          color: getStatusColor(task.status)
                        }}
                      >
                        {task.status.replace('_', ' ')}
                      </span>
                      
                      {task.category && (
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#64748B',
                          background: '#F1F5F9',
                          padding: '4px 8px',
                          borderRadius: '12px'
                        }}>
                          <TagIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                          {task.category}
                        </span>
                      )}
                      
                      {task.due_date && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          <CalendarIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      {task.estimated_duration && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          <ClockIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
                          {task.estimated_duration}m
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {layoutType === 'kanban' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <div key={status} className="kanban-column">
                  <div className="kanban-header" style={{ color: getStatusColor(status) }}>
                    <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                    <span style={{ 
                      background: getStatusColor(status) + '20',
                      color: getStatusColor(status),
                      padding: '2px 6px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {statusTasks.length}
                    </span>
                  </div>
                  
                  {statusTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="task-card"
                      style={{ 
                        borderLeftColor: getPriorityColor(task.priority),
                        marginBottom: '12px',
                        cursor: 'pointer'
                      }}
                      onClick={() => openEditTask(task)}
                    >
                      <h5 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: '#1F2937'
                      }}>
                        {task.title}
                      </h5>
                      
                      {task.description && (
                        <p style={{ 
                          margin: '0 0 8px 0', 
                          color: '#64748B', 
                          fontSize: '12px',
                          lineHeight: '1.4'
                        }}>
                          {task.description.length > 60 
                            ? task.description.substring(0, 60) + '...'
                            : task.description
                          }
                        </p>
                      )}
                      
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span 
                          className="priority-badge"
                          style={{ 
                            background: getPriorityColor(task.priority) + '20',
                            color: getPriorityColor(task.priority),
                            fontSize: '10px',
                            padding: '2px 6px'
                          }}
                        >
                          {task.priority}
                        </span>
                        
                        {task.due_date && (
                          <span style={{ fontSize: '10px', color: '#64748B' }}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {layoutType === 'calendar' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
                  Tasks for {formatDate(currentDate)}
                </h3>
                
                {filteredTasks.length === 0 ? (
                  <div className="empty-state">
                    <CalendarIcon className="empty-state-icon" />
                    <p>No tasks for this {currentView}</p>
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div key={task.id} className="task-card" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{task.title}</h5>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'completed' ? '#10B981' : '#6B7280' }}
                          >
                            {task.status === 'completed' ? (
                              <CheckCircleIconSolid style={{ width: '16px', height: '16px' }} />
                            ) : (
                              <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                            )}
                          </button>
                          <button
                            onClick={() => openEditTask(task)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6' }}
                          >
                            <PencilIcon style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Time Blocks</h3>
                
                {timeBlocks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>
                    <ClockIcon style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No time blocks</p>
                  </div>
                ) : (
                  timeBlocks.map(block => (
                    <div key={block.id} className="time-block" style={{ borderLeftColor: block.color }}>
                      <div style={{ fontWeight: '500', fontSize: '13px', marginBottom: '4px' }}>{block.title}</div>
                      <div style={{ color: '#64748B', fontSize: '11px' }}>
                        {new Date(block.start_time).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - {new Date(block.end_time).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          onClick={() => handleDeleteTimeBlock(block.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <TrashIcon style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {isEditingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title..."
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description..."
                rows={3}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Estimated Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask({ ...newTask, estimated_duration: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="datetime-local"
                className="form-input"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={isEditingTask ? handleUpdateTask : handleCreateTask}
                className="btn btn-primary"
              >
                {isEditingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Block Modal */}
      {showTimeBlockModal && (
        <div className="modal-overlay" onClick={() => setShowTimeBlockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                {isEditingTimeBlock ? 'Edit Time Block' : 'Create New Time Block'}
              </h3>
              <button
                onClick={() => {
                  setShowTimeBlockModal(false);
                  resetTimeBlockForm();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={newTimeBlock.title}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, title: e.target.value })}
                placeholder="Enter time block title..."
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                value={newTimeBlock.description}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, description: e.target.value })}
                placeholder="Enter description..."
                rows={2}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTimeBlock.start_time}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, start_time: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTimeBlock.end_time}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, end_time: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Block Type</label>
                <select
                  className="form-input"
                  value={newTimeBlock.block_type}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, block_type: e.target.value as any })}
                >
                  <option value="task">Task</option>
                  <option value="break">Break</option>
                  <option value="meeting">Meeting</option>
                  <option value="focus">Focus Time</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="color"
                  className="form-input"
                  value={newTimeBlock.color}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, color: e.target.value })}
                  style={{ height: '44px' }}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input form-textarea"
                value={newTimeBlock.notes}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '32px' }}>
              <button
                onClick={() => {
                  setShowTimeBlockModal(false);
                  resetTimeBlockForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTimeBlock}
                className="btn btn-primary"
              >
                {isEditingTimeBlock ? 'Update Time Block' : 'Create Time Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}