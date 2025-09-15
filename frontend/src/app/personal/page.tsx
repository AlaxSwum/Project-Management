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
  CheckIcon,
  Bars3Icon,
  DevicePhoneMobileIcon
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
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<PersonalTask[]>([]); // Combined personal + project tasks
  const [timeBlocks, setTimeBlocks] = useState<PersonalTimeBlock[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [layoutType, setLayoutType] = useState<LayoutType>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
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
  
  // Mobile sidebar state
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Week multi-selection state
  const [selectedHours, setSelectedHours] = useState<{day: Date, hour: number}[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStartHour, setDragStartHour] = useState<{day: Date, hour: number} | null>(null);
  
  // Form states
  const getDefaultTaskForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    
    return {
      title: '',
      description: '',
      status: 'pending' as PersonalTask['status'],
      priority: 'medium' as PersonalTask['priority'],
      category: '',
      tags: [] as string[],
      due_date: tomorrow.toISOString().slice(0, 16),
      estimated_duration: 60,
      is_recurring: false
    };
  };
  
  const [newTask, setNewTask] = useState(getDefaultTaskForm());
  
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

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

      // Don't apply date filters - show all user tasks so they appear in all views
      console.log('Loading all tasks for user:', user?.id);

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

      // Load project tasks assigned to current user
      const { data: projectTasksData, error: projectTasksError } = await supabase
        .from('tasks')
        .select(`
          id, name, description, status, priority, due_date, start_date, 
          estimated_hours, actual_hours, created_at, updated_at, project_id,
          projects(name, color),
          task_assignees!inner(user_id)
        `)
        .eq('task_assignees.user_id', user?.id)
        .order('created_at', { ascending: false });

      if (projectTasksError) {
        console.error('Error loading project tasks:', projectTasksError);
      }

      // Convert project tasks to personal task format
      const convertedProjectTasks: PersonalTask[] = (projectTasksData || []).map(task => ({
        id: `project_${task.id}`,
        user_id: user?.id?.toString() || '60',
        title: `[${(task.projects as any)?.name || 'Project'}] ${task.name}`,
        description: task.description,
        status: task.status === 'todo' ? 'pending' : 
                task.status === 'in_progress' ? 'in_progress' :
                task.status === 'done' ? 'completed' : 'pending',
        priority: task.priority as PersonalTask['priority'],
        category: 'Project Work',
        tags: [`Project: ${(task.projects as any)?.name || 'Unknown'}`],
        due_date: task.due_date,
        estimated_duration: task.estimated_hours ? task.estimated_hours * 60 : undefined,
        actual_duration: task.actual_hours ? task.actual_hours * 60 : undefined,
        is_recurring: false,
        created_at: task.created_at,
        updated_at: task.updated_at,
        completed_at: task.status === 'done' ? task.updated_at : undefined
      }));

      console.log('Personal tasks loaded:', tasksData?.length || 0);
      console.log('Project tasks loaded:', projectTasksData?.length || 0);
      console.log('Time blocks loaded:', timeBlocksData?.length || 0, 'blocks');
      console.log('Current view:', currentView, 'Layout:', layoutType);
      
      setTasks(tasksData || []);
      setProjectTasks(projectTasksData || []);
      setAllTasks([...(tasksData || []), ...convertedProjectTasks]);
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
      setAllTasks(prev => [data, ...prev]); // Also update allTasks
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
      setAllTasks(prev => prev.map(task => task.id === selectedTask.id ? data : task)); // Also update allTasks
      setShowTaskModal(false);
      resetTaskForm();
      setSuccessMessage('Task updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
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
      setAllTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status, ...(status === 'completed' ? { completed_at: updateData.completed_at } : {}) }
          : task
      )); // Also update allTasks

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
      setAllTasks(prev => prev.filter(task => task.id !== taskId)); // Also update allTasks
      setSuccessMessage('Task deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
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

  const handleCreateTaskFromSelection = async () => {
    if (selectedHours.length === 0) return;
    
    // Calculate start and end time from selection
    const sortedHours = selectedHours.sort((a, b) => {
      if (a.day.getTime() !== b.day.getTime()) {
        return a.day.getTime() - b.day.getTime();
      }
      return a.hour - b.hour;
    });
    
    const startTime = new Date(sortedHours[0].day);
    startTime.setHours(sortedHours[0].hour, 0, 0, 0);
    
    const lastSelection = sortedHours[sortedHours.length - 1];
    const endTime = new Date(lastSelection.day);
    endTime.setHours(lastSelection.hour + 1, 0, 0, 0);
    
    // Create the task directly instead of opening modal
    const taskData = {
      title: `Task for ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`,
      description: `Created from ${selectedHours.length} hour selection in week view`,
      status: 'pending' as PersonalTask['status'],
      priority: 'medium' as PersonalTask['priority'],
      category: 'Work',
      tags: null,
      due_date: startTime.toISOString(),
      estimated_duration: selectedHours.length * 60,
      is_recurring: false,
      user_id: user?.id
    };

    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task from selection:', error);
        setError('Failed to create task from selection');
        return;
      }

      setTasks(prev => [data, ...prev]);
      setAllTasks(prev => [data, ...prev]); // Also update allTasks
      setSelectedHours([]);
      setSuccessMessage(`Task created for ${selectedHours.length} hour${selectedHours.length > 1 ? 's' : ''}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      console.log('Task created from week selection:', data);
    } catch (error) {
      console.error('Error creating task from selection:', error);
      setError('Failed to create task from selection');
    }
  };

  const resetTaskForm = () => {
    setNewTask(getDefaultTaskForm());
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

  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });
  
  // Debug logging for task visibility
  console.log('Personal tasks:', tasks.length);
  console.log('Project tasks:', projectTasks.length);
  console.log('Total combined tasks:', allTasks.length);
  console.log('Filtered tasks:', filteredTasks.length);
  console.log('Current filters:', { statusFilter, priorityFilter, searchQuery });

  const tasksByStatus = {
    pending: filteredTasks.filter(task => task.status === 'pending'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    completed: filteredTasks.filter(task => task.status === 'completed'),
    cancelled: filteredTasks.filter(task => task.status === 'cancelled')
  };

  // Kanban drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: PersonalTask) => {
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: PersonalTask['status']) => {
    e.preventDefault();
    try {
      const taskData = JSON.parse(e.dataTransfer.getData('application/json'));
      await handleUpdateTaskStatus(taskData.id, newStatus);
    } catch (error) {
      console.error('Error in drag drop:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {!isMobile && <Sidebar projects={projects} onCreateProject={() => {}} />}
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
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
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 16px;
            border-left: 4px solid #3B82F6;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border: 1px solid #E2E8F0;
            position: relative;
          }
          
          .task-card:hover {
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
            transform: translateY(-2px);
          }
          
          .task-card.completed {
            opacity: 0.7;
            background: #F8FAFC;
          }
          
          .task-card.dragging {
            opacity: 0.5;
            transform: rotate(2deg) scale(1.02);
            z-index: 1000;
          }
          
          .kanban-column {
            background: #F8FAFC;
            border-radius: 16px;
            padding: 20px;
            min-height: 600px;
            border: 2px dashed transparent;
            transition: all 0.3s ease;
          }
          
          .kanban-column.drag-over {
            border-color: #3B82F6;
            background: #EFF6FF;
          }
          
          .kanban-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 12px 16px;
            background: white;
            border-radius: 12px;
            font-weight: 700;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          
          .priority-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 6px 14px;
            border-radius: 24px;
            font-size: 12px;
            font-weight: 500;
            text-transform: capitalize;
          }
          
          .view-tabs {
            display: flex;
            background: white;
            border-radius: 16px;
            padding: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
          }
          
          .view-tab {
            padding: 12px 24px;
            border-radius: 12px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            color: #64748B;
          }
          
          .view-tab.active {
            background: #3B82F6;
            color: white;
            box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
          }
          
          .layout-tabs {
            display: flex;
            background: white;
            border-radius: 16px;
            padding: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
          }
          
          .layout-tab {
            padding: 12px;
            border-radius: 12px;
            border: none;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #64748B;
          }
          
          .layout-tab.active {
            background: #3B82F6;
            color: white;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
          }
          
          .btn {
            padding: 14px 28px;
            border-radius: 12px;
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
          
          .btn-small {
            padding: 8px 12px;
            font-size: 12px;
          }
          
          .search-input {
            width: 100%;
            padding: 14px 20px 14px 48px;
            border: 2px solid #E2E8F0;
            border-radius: 16px;
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
            padding: 14px 20px;
            border: 2px solid #E2E8F0;
            border-radius: 16px;
            font-size: 14px;
            background: white;
            cursor: pointer;
            font-weight: 600;
            color: #374151;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.2s ease;
          }
          
          .filter-select:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0,0,0,0.05);
          }
          
          .filter-select:hover {
            border-color: #C4B5FD;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .stats-card {
            background: white;
            padding: 24px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border: 1px solid #E2E8F0;
            text-align: center;
            transition: all 0.2s ease;
          }
          
          .stats-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.12);
          }
          
          .stats-number {
            font-size: 32px;
            font-weight: 800;
            margin-bottom: 8px;
            line-height: 1;
          }
          
          .stats-label {
            font-size: 12px;
            color: #64748B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          }
          
          .alert {
            padding: 16px 20px;
            border-radius: 12px;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            font-weight: 500;
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
            padding: 80px 20px;
            color: #64748B;
          }
          
          .empty-state-icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            opacity: 0.5;
          }
          
          .hour-slot {
            min-height: 60px;
            border: 1px solid #F1F5F9;
            border-radius: 8px;
            margin: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
          }
          
          .hour-slot:hover {
            background: #EFF6FF;
            border-color: #3B82F6;
          }
          
          .hour-slot.selected {
            background: #3B82F6;
            color: white;
            border-color: #2563EB;
          }
          
          .mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background: white;
            border-bottom: 1px solid #E2E8F0;
            position: sticky;
            top: 0;
            z-index: 100;
          }
          
          .mobile-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100vh;
            background: white;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          
          .mobile-sidebar.open {
            transform: translateX(0);
          }
          
          @media (max-width: 768px) {
            .desktop-only {
              display: none !important;
            }
            
            .mobile-only {
              display: block !important;
            }
            
            .stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 12px !important;
            }
            
            .controls-mobile {
              flex-direction: column !important;
              gap: 16px !important;
            }
            
            .view-tabs {
              width: 100% !important;
            }
            
            .kanban-grid {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
            
            .task-card {
              padding: 16px !important;
            }
            
            .modal-content-mobile {
              margin: 20px !important;
              padding: 40px !important;
              max-width: calc(100vw - 40px) !important;
            }
          }
          
          @media (max-width: 480px) {
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
            
            .modal-content-mobile {
              margin: 10px !important;
              padding: 30px !important;
            }
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {/* Mobile Header */}
        {isMobile && (
          <div className="mobile-header mobile-only" style={{ display: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setShowMobileSidebar(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1F2937' }}
              >
                <Bars3Icon style={{ width: '24px', height: '24px' }} />
              </button>
              <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Personal Tasks</h1>
            </div>
            <button
              onClick={() => {
                setNewTask(getDefaultTaskForm());
                setIsEditingTask(false);
                setSelectedTask(null);
                setShowTaskModal(true);
              }}
              className="btn btn-primary btn-small"
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              New
            </button>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <div className={`mobile-sidebar ${showMobileSidebar ? 'open' : ''}`}>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Menu</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <XMarkIcon style={{ width: '24px', height: '24px' }} />
                </button>
              </div>
              <Sidebar projects={projects} onCreateProject={() => {}} />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar projects={projects} onCreateProject={() => {}} />}
        
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px', 
          flex: 1, 
          padding: isMobile ? '20px' : '32px',
          paddingTop: isMobile ? '0' : '32px'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }} className="desktop-only">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', color: '#1F2937', margin: 0, marginBottom: '8px' }}>
                  Personal Task Manager
                </h1>
                <p style={{ color: '#64748B', margin: 0, fontSize: '16px' }}>
                  Organize your personal tasks and manage your time effectively
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => {
                    setNewTask(getDefaultTaskForm());
                    setIsEditingTask(false);
                    setSelectedTask(null);
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
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
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
                <div className="stats-number" style={{ color: '#64748B' }}>{allTasks.length}</div>
                <div className="stats-label">Total Tasks</div>
                <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px' }}>
                  {tasks.length} personal + {projectTasks.length} project
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            {/* Search and Filters */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', maxWidth: isMobile ? '100%' : '300px', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {!isMobile && (
                <>
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
                </>
              )}
            </div>

            {/* Layout and View Controls */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                      className="btn btn-secondary btn-small"
                    >
                      <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                    
                    <h3 style={{ margin: 0, color: '#1F2937', fontSize: '16px', minWidth: '200px', textAlign: 'center' }}>
                      {formatDate(currentDate)}
                    </h3>
                    
                    <button
                      onClick={() => navigateDate('next')}
                      className="btn btn-secondary btn-small"
                    >
                      <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          {isMobile && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', padding: '0 4px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                style={{ minWidth: '120px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
                style={{ minWidth: '120px' }}
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          )}

          {/* Selected Hours Action */}
          {selectedHours.length > 0 && (
            <div style={{
              background: '#3B82F6',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '12px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontWeight: '600' }}>
                {selectedHours.length} hour{selectedHours.length > 1 ? 's' : ''} selected
              </span>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleCreateTaskFromSelection}
                  style={{
                    background: 'white',
                    color: '#3B82F6',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Create Task
                </button>
                <button
                  onClick={() => setSelectedHours([])}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

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
          {layoutType === 'kanban' && (
            <div className="kanban-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '20px' }}>
              {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                <div 
                  key={status} 
                  className="kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status as PersonalTask['status'])}
                >
                  <div className="kanban-header" style={{ color: getStatusColor(status) }}>
                    <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                    <span style={{ 
                      background: getStatusColor(status) + '20',
                      color: getStatusColor(status),
                      padding: '4px 8px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '700'
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
                        cursor: 'grab'
                      }}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('dragging');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h5 style={{ 
                          margin: 0, 
                          fontSize: '16px', 
                          fontWeight: '600',
                          color: '#1F2937',
                          flex: 1,
                          lineHeight: '1.4'
                        }}>
                          {task.title}
                        </h5>
                        
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '12px' }}>
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
                          {task.description.length > 100 
                            ? task.description.substring(0, 100) + '...'
                            : task.description
                          }
                        </p>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span 
                          className="priority-badge"
                          style={{ 
                            background: getPriorityColor(task.priority) + '20',
                            color: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority}
                        </span>
                        
                        {task.category && (
                          <span style={{ 
                            fontSize: '11px', 
                            color: '#64748B',
                            background: '#F1F5F9',
                            padding: '4px 8px',
                            borderRadius: '12px'
                          }}>
                            {task.category}
                          </span>
                        )}
                        
                        {task.due_date && (
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                        
                        {task.estimated_duration && (
                          <span style={{ fontSize: '11px', color: '#64748B' }}>
                            {task.estimated_duration}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {statusTasks.length === 0 && (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#9CA3AF', 
                      padding: '40px 20px',
                      border: '2px dashed #E2E8F0',
                      borderRadius: '12px'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Drop tasks here or create new ones
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {layoutType === 'list' && (
            <div>
              {filteredTasks.length === 0 ? (
                <div className="empty-state">
                  <ListBulletIcon className="empty-state-icon" />
                  <h3 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 12px 0' }}>No tasks found</h3>
                  <p style={{ margin: '0 0 24px 0' }}>
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' 
                      ? 'Try adjusting your filters or search terms'
                      : 'Create your first task to get started'
                    }
                  </p>
                  {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                    <button
                      onClick={() => {
                        setNewTask(getDefaultTaskForm());
                        setIsEditingTask(false);
                        setSelectedTask(null);
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
                          {task.category}
                        </span>
                      )}
                      
                      {task.due_date && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      {task.estimated_duration && (
                        <span style={{ fontSize: '12px', color: '#64748B' }}>
                          {task.estimated_duration}m
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Calendar View */}
          {layoutType === 'calendar' && (
            <div>
              {currentView === 'month' && (
                <MonthCalendarView 
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  timeBlocks={timeBlocks}
                  onTaskClick={openEditTask}
                  getPriorityColor={getPriorityColor}
                  isMobile={isMobile}
                />
              )}
              
              {currentView === 'week' && (
                <WeekCalendarView 
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  timeBlocks={timeBlocks}
                  selectedHours={selectedHours}
                  setSelectedHours={setSelectedHours}
                  isSelecting={isSelecting}
                  setIsSelecting={setIsSelecting}
                  dragStartHour={dragStartHour}
                  setDragStartHour={setDragStartHour}
                  onTaskClick={openEditTask}
                  getPriorityColor={getPriorityColor}
                  isMobile={isMobile}
                  user={user}
                />
              )}
              
              {currentView === 'day' && (
                <DayCalendarView 
                  currentDate={currentDate}
                  tasks={filteredTasks}
                  timeBlocks={timeBlocks}
                  onTaskClick={openEditTask}
                  onCreateTimeBlock={(startTime, endTime) => {
                    setNewTimeBlock({
                      title: '',
                      description: '',
                      start_time: startTime.toISOString().slice(0, 16),
                      end_time: endTime.toISOString().slice(0, 16),
                      block_type: 'task',
                      color: '#3B82F6',
                      notes: ''
                    });
                    setShowTimeBlockModal(true);
                  }}
                  getPriorityColor={getPriorityColor}
                  isMobile={isMobile}
                  user={user}
                  handleUpdateTaskStatus={handleUpdateTaskStatus}
                  handleDeleteTask={handleDeleteTask}
                  openEditTask={openEditTask}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(6px)',
          padding: isMobile ? '20px' : '60px'
        }} onClick={() => setShowTaskModal(false)}>
          <div className={isMobile ? 'modal-content-mobile' : ''} style={{
            background: 'white',
            borderRadius: '24px',
            padding: isMobile ? '40px' : '80px',
            maxWidth: isMobile ? 'calc(100vw - 40px)' : '750px',
            width: '100%',
            maxHeight: isMobile ? 'calc(100vh - 40px)' : '100%',
            overflowY: 'auto',
            boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.35), 0 25px 25px -5px rgba(0, 0, 0, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: '700', color: '#1F2937' }}>
                {isEditingTask ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '8px' }}
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600', 
                color: '#374151', 
                fontSize: '16px' 
              }}>Title *</label>
              <input
                type="text"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#FAFBFC',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title..."
                required
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#FAFBFC';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600', 
                color: '#374151', 
                fontSize: '16px' 
              }}>Description</label>
              <textarea
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#FAFBFC',
                  transition: 'all 0.2s ease',
                  resize: 'vertical',
                  minHeight: '100px',
                  boxSizing: 'border-box'
                }}
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description..."
                rows={3}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                  e.target.style.background = '#FAFBFC';
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  fontSize: '16px' 
                }}>Priority</label>
                <select
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#FAFBFC',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    fontWeight: '600',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#FAFBFC';
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  fontSize: '16px' 
                }}>Status</label>
                <select
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#FAFBFC',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    fontWeight: '600',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#FAFBFC';
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  fontSize: '16px' 
                }}>Category</label>
                <select
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#FAFBFC',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    fontWeight: '600',
                    color: '#374151',
                    transition: 'all 0.2s ease'
                  }}
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.background = '#FAFBFC';
                  }}
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '12px', 
                  fontWeight: '600', 
                  color: '#374151', 
                  fontSize: '16px' 
                }}>Estimated Duration (minutes)</label>
                <input
                  type="number"
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #E2E8F0',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#FAFBFC',
                    boxSizing: 'border-box'
                  }}
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask({ ...newTask, estimated_duration: parseInt(e.target.value) || 60 })}
                  placeholder="60"
                  min="0"
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '12px', 
                fontWeight: '600', 
                color: '#374151', 
                fontSize: '16px' 
              }}>Due Date</label>
              <input
                type="datetime-local"
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #E2E8F0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  background: '#FAFBFC',
                  boxSizing: 'border-box'
                }}
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '40px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setShowTaskModal(false);
                  resetTaskForm();
                }}
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  background: '#6B7280',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#4B5563';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#6B7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={isEditingTask ? handleUpdateTask : handleCreateTask}
                style={{
                  padding: '16px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  background: '#3B82F6',
                  color: 'white',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563EB';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3B82F6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {isEditingTask ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Calendar View Interfaces
interface CalendarViewProps {
  currentDate: Date;
  tasks: PersonalTask[];
  timeBlocks: PersonalTimeBlock[];
  onTaskClick: (task: PersonalTask) => void;
  getPriorityColor: (priority: string) => string;
  isMobile: boolean;
}

interface WeekCalendarProps extends CalendarViewProps {
  selectedHours: {day: Date, hour: number}[];
  setSelectedHours: (hours: {day: Date, hour: number}[]) => void;
  isSelecting: boolean;
  setIsSelecting: (selecting: boolean) => void;
  dragStartHour: {day: Date, hour: number} | null;
  setDragStartHour: (hour: {day: Date, hour: number} | null) => void;
  user: any;
}

interface DayCalendarProps extends CalendarViewProps {
  onCreateTimeBlock: (startTime: Date, endTime: Date) => void;
  user: any;
  handleUpdateTaskStatus: (taskId: string, status: PersonalTask['status']) => void;
  handleDeleteTask: (taskId: string) => void;
  openEditTask: (task: PersonalTask) => void;
}

const WeekCalendarView: React.FC<WeekCalendarProps> = ({ 
  currentDate, tasks, timeBlocks, selectedHours, setSelectedHours, isSelecting, setIsSelecting,
  dragStartHour, setDragStartHour, onTaskClick, getPriorityColor, isMobile, user
}) => {
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  
  const weekDays: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    weekDays.push(day);
  }
  
  const getDayTasks = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === day.toDateString();
    });
  };
  
  const getDayTimeBlocks = (day: Date) => {
    return timeBlocks.filter(block => {
      const blockDate = new Date(block.start_time);
      return blockDate.toDateString() === day.toDateString();
    });
  };
  
  
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '16px' : '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {/* Debug Panel */}
      <div style={{ marginBottom: '20px', padding: '16px', background: '#EFF6FF', borderRadius: '12px' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#3B82F6', fontWeight: '700' }}>
          Week View Debug: {tasks.length} tasks loaded
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748B' }}>
          Week tasks: {weekDays.map((day, i) => {
            const dayTasks = getDayTasks(day);
            return `${day.toLocaleDateString('en-US', { weekday: 'short' })}: ${dayTasks.length}`;
          }).join(' | ')}
        </p>
        {tasks.length > 0 && (
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#64748B' }}>
            Sample: {tasks.slice(0, 3).map(t => `"${t.title}"`).join(', ')}
          </p>
        )}
      </div>

      {/* Week Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '2px', 
        marginBottom: '12px',
        background: '#F1F5F9',
        borderRadius: '12px',
        padding: '12px'
      }}>
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, index) => {
          const day = weekDays[index];
          const isToday = day.toDateString() === new Date().toDateString();
          const dayTasks = getDayTasks(day);
          
          return (
            <div key={dayName} style={{ 
              textAlign: 'center', 
              fontWeight: '700', 
              color: isToday ? '#3B82F6' : '#64748B', 
              fontSize: isMobile ? '11px' : '14px',
              padding: '8px'
            }}>
              <div>{dayName}</div>
              <div style={{ 
                fontSize: isMobile ? '16px' : '20px', 
                fontWeight: '800',
                color: isToday ? '#3B82F6' : '#1F2937',
                marginTop: '4px'
              }}>
                {day.getDate()}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: '#64748B',
                marginTop: '4px',
                fontWeight: '500'
              }}>
                {dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Week Calendar Grid - Like Month View */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '2px',
        background: '#E2E8F0',
        borderRadius: '12px',
        padding: '2px'
      }}>
        {weekDays.map((day, index) => {
          const dayTasks = getDayTasks(day);
          const dayTimeBlocks = getDayTimeBlocks(day);
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              style={{
                background: 'white',
                minHeight: isMobile ? '120px' : '200px',
                padding: isMobile ? '8px' : '12px',
                border: isToday ? '3px solid #3B82F6' : 'none',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
            >
              <div style={{ 
                fontWeight: isToday ? '800' : '600',
                color: isToday ? '#3B82F6' : '#1F2937',
                marginBottom: '8px',
                fontSize: isMobile ? '14px' : '16px',
                textAlign: 'center'
              }}>
                {day.getDate()}
              </div>
              
              {/* Tasks for this day */}
              {dayTasks.slice(0, isMobile ? 3 : 5).map(task => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  style={{
                    background: getPriorityColor(task.priority) + '20',
                    color: getPriorityColor(task.priority),
                    padding: isMobile ? '4px 6px' : '6px 8px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '9px' : '11px',
                    marginBottom: '4px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    border: `1px solid ${getPriorityColor(task.priority)}40`
                  }}
                >
                  {task.title.length > (isMobile ? 12 : 18) ? task.title.substring(0, isMobile ? 12 : 18) + '...' : task.title}
                </div>
              ))}
              
              {/* Time Blocks for this day */}
              {dayTimeBlocks.slice(0, 2).map(block => (
                <div
                  key={block.id}
                  style={{
                    background: block.color + '40',
                    color: block.color,
                    padding: isMobile ? '3px 5px' : '4px 6px',
                    borderRadius: '4px',
                    fontSize: isMobile ? '8px' : '10px',
                    marginBottom: '3px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    border: `1px solid ${block.color}`
                  }}
                >
                  🕒 {new Date(block.start_time).toLocaleTimeString('en-US', { 
                    hour: 'numeric',
                    hour12: true 
                  })} {block.title.substring(0, 8)}...
                </div>
              ))}
              
              {/* More indicator */}
              {(dayTasks.length > (isMobile ? 3 : 5) || dayTimeBlocks.length > 2) && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: '#6B7280',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  +{Math.max(0, dayTasks.length - (isMobile ? 3 : 5)) + Math.max(0, dayTimeBlocks.length - 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {selectedHours.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#EFF6FF', 
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#3B82F6' }}>
            {selectedHours.length} hour{selectedHours.length > 1 ? 's' : ''} selected
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>
            Click "Create Task" above to create a task for the selected time slots
          </p>
        </div>
      )}
    </div>
  );
};

// Month Calendar View
const MonthCalendarView: React.FC<CalendarViewProps> = ({ 
  currentDate, tasks, timeBlocks, onTaskClick, getPriorityColor, isMobile 
}) => {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  
  const days: Date[] = [];
  const currentDay = new Date(startDate);
  
  for (let i = 0; i < 42; i++) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  const getDayTasks = (day: Date) => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === day.toDateString();
    });
  };
  
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: isMobile ? '16px' : '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {/* Calendar Header */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '1px', 
        marginBottom: '12px',
        background: '#F1F5F9',
        borderRadius: '12px',
        padding: '12px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ 
            textAlign: 'center', 
            fontWeight: '700', 
            color: '#64748B', 
            fontSize: isMobile ? '11px' : '13px',
            padding: '8px'
          }}>
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '2px',
        background: '#E2E8F0',
        borderRadius: '12px',
        padding: '2px'
      }}>
        {days.map((day, index) => {
          const dayTasks = getDayTasks(day);
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={index}
              style={{
                background: 'white',
                minHeight: isMobile ? '80px' : '120px',
                padding: isMobile ? '6px' : '8px',
                opacity: isCurrentMonth ? 1 : 0.5,
                border: isToday ? '2px solid #3B82F6' : 'none',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
              onClick={() => {
                const taskDate = new Date(day);
                taskDate.setHours(9, 0, 0, 0);
                // You can add create task functionality here
              }}
            >
              <div style={{ 
                fontWeight: isToday ? '700' : '500',
                color: isToday ? '#3B82F6' : '#1F2937',
                marginBottom: '4px',
                fontSize: isMobile ? '12px' : '14px'
              }}>
                {day.getDate()}
              </div>
              
              {/* Tasks */}
              {dayTasks.slice(0, isMobile ? 1 : 2).map(task => (
                <div
                  key={task.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTaskClick(task);
                  }}
                  style={{
                    background: getPriorityColor(task.priority) + '20',
                    color: getPriorityColor(task.priority),
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: isMobile ? '8px' : '10px',
                    marginBottom: '2px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                  }}
                >
                  {task.title.length > (isMobile ? 10 : 15) ? task.title.substring(0, isMobile ? 10 : 15) + '...' : task.title}
                </div>
              ))}
              
              {/* More indicator */}
              {dayTasks.length > (isMobile ? 1 : 2) && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  background: '#6B7280',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '8px',
                  fontWeight: '600'
                }}>
                  +{dayTasks.length - (isMobile ? 1 : 2)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Day Calendar View - Previous Design with Enhanced Functionality
const DayCalendarView: React.FC<DayCalendarProps> = ({ 
  currentDate, tasks, timeBlocks, onTaskClick, onCreateTimeBlock, getPriorityColor, isMobile, user,
  handleUpdateTaskStatus, handleDeleteTask, openEditTask
}) => {
  // Local drag state for this component
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<Date | null>(null);
  const [dragEndTime, setDragEndTime] = useState<Date | null>(null);
  const [dragPreview, setDragPreview] = useState<{ start: Date; end: Date } | null>(null);
  const [draggedTask, setDraggedTask] = useState<PersonalTask | null>(null);
  
  const dayTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date);
    return taskDate.toDateString() === currentDate.toDateString();
  });
  
  const dayTimeBlocks = timeBlocks.filter(block => {
    const blockDate = new Date(block.start_time);
    return blockDate.toDateString() === currentDate.toDateString();
  });
  
  // Generate 15-minute slots
  const timeSlots: { hour: number; minute: number }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      timeSlots.push({ hour, minute });
    }
  }
  
  const getBlocksForSlot = (hour: number, minute: number) => {
    return dayTimeBlocks.filter(block => {
      const blockStart = new Date(block.start_time);
      return blockStart.getHours() === hour && 
             Math.floor(blockStart.getMinutes() / 15) * 15 === minute;
    });
  };
  
  const handleSlotClick = (hour: number, minute: number) => {
    const startTime = new Date(currentDate);
    startTime.setHours(hour, minute, 0, 0);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 15);
    
    onCreateTimeBlock(startTime, endTime);
  };
  
  const handleMouseDown = (hour: number, minute: number) => {
    const startTime = new Date(currentDate);
    startTime.setHours(hour, minute, 0, 0);
    setDragStartTime(startTime);
    setIsDragging(true);
  };
  
  const handleMouseMove = (hour: number, minute: number) => {
    if (isDragging && dragStartTime) {
      const currentTime = new Date(currentDate);
      currentTime.setHours(hour, minute, 0, 0);
      setDragEndTime(currentTime);
      
      const start = dragStartTime < currentTime ? dragStartTime : currentTime;
      const end = dragStartTime < currentTime ? currentTime : dragStartTime;
      end.setMinutes(end.getMinutes() + 15);
      
      setDragPreview({ start, end });
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging && dragStartTime && dragEndTime) {
      const start = dragStartTime < dragEndTime ? dragStartTime : dragEndTime;
      const end = dragStartTime < dragEndTime ? dragEndTime : dragStartTime;
      end.setMinutes(end.getMinutes() + 15);
      
      onCreateTimeBlock(start, end);
    }
    
    setIsDragging(false);
    setDragStartTime(null);
    setDragEndTime(null);
    setDragPreview(null);
  };
  
  const isTimeInDragRange = (hour: number, minute: number, dragRange: { start: Date; end: Date }) => {
    const slotTime = new Date(currentDate);
    slotTime.setHours(hour, minute, 0, 0);
    
    return slotTime >= dragRange.start && slotTime <= dragRange.end;
  };
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '24px' }}>
      {/* Time Slots - Previous Design */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          {currentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
          {timeSlots.map(({ hour, minute }) => {
            const blocks = getBlocksForSlot(hour, minute);
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const displayTime = hour === 0 ? '12:00 AM' : 
                               hour < 12 ? `${hour}:${minute.toString().padStart(2, '0')} AM` :
                               hour === 12 ? `12:${minute.toString().padStart(2, '0')} PM` :
                               `${hour - 12}:${minute.toString().padStart(2, '0')} PM`;
            
            return (
              <div key={timeString} style={{ 
                display: 'grid', 
                gridTemplateColumns: '80px 1fr', 
                gap: '12px',
                minHeight: '40px',
                borderBottom: minute === 0 ? '2px solid #E2E8F0' : '1px solid #F1F5F9',
                padding: '8px 0'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748B',
                  fontWeight: '500',
                  textAlign: 'right',
                  paddingTop: '4px'
                }}>
                  {minute === 0 ? displayTime : ''}
                </div>
                
                <div 
                  style={{ 
                    minHeight: '32px',
                    background: blocks.length > 0 ? 'transparent' : 
                               (dragPreview && isTimeInDragRange(hour, minute, dragPreview)) ? '#3B82F6' : '#FAFBFC',
                    borderRadius: '4px',
                    padding: '4px',
                    cursor: blocks.length === 0 ? (isDragging ? 'grabbing' : 'grab') : 'default',
                    border: '1px dashed transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    userSelect: 'none'
                  }}
                  onClick={() => blocks.length === 0 && !isDragging && handleSlotClick(hour, minute)}
                  onMouseDown={() => blocks.length === 0 && handleMouseDown(hour, minute)}
                  onMouseMove={() => handleMouseMove(hour, minute)}
                  onMouseUp={handleMouseUp}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && blocks.length === 0) {
                      e.currentTarget.style.background = '#EFF6FF';
                      e.currentTarget.style.border = '2px dashed #3B82F6';
                      e.currentTarget.innerHTML = `<div style="color: #3B82F6; font-weight: 600; text-align: center; padding: 8px; font-size: 12px;">DROP HERE<br/>${draggedTask.title}</div>`;
                    }
                  }}
                  onDragLeave={(e) => {
                    if (draggedTask) {
                      e.currentTarget.style.background = '#FAFBFC';
                      e.currentTarget.style.border = '2px dashed transparent';
                      e.currentTarget.innerHTML = '<div style="color: #9CA3AF; font-size: 11px; text-align: center; padding-top: 6px;">Drop zone</div>';
                    }
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('DROP EVENT FIRED!', { draggedTask, hour, minute, blocks: blocks.length });
                    
                    if (draggedTask && blocks.length === 0) {
                      console.log('Valid drop - processing...');
                      // Create time block directly here
                      const startTime = new Date(currentDate);
                      startTime.setHours(hour, minute, 0, 0);
                      const endTime = new Date(startTime);
                      endTime.setMinutes(endTime.getMinutes() + (draggedTask.estimated_duration || 60));
                      
                      const timeBlockData = {
                        title: draggedTask.title,
                        description: draggedTask.description || '',
                        start_time: startTime.toISOString(),
                        end_time: endTime.toISOString(),
                        block_type: 'task',
                        color: getPriorityColor(draggedTask.priority),
                        notes: `Scheduled from task: ${draggedTask.title}`,
                        user_id: user?.id || 60,
                        is_completed: false
                      };

                      try {
                        const { data, error } = await supabase
                          .from('personal_time_blocks')
                          .insert([timeBlockData])
                          .select()
                          .single();

                        if (error) {
                          console.error('Supabase error:', error);
                          alert('Error creating time block: ' + error.message);
                        } else {
                          console.log('Time block created successfully!', data);
                          alert(`Time block created for "${draggedTask.title}" at ${startTime.toLocaleTimeString()}`);
                          window.location.reload();
                        }
                      } catch (error) {
                        console.error('Error:', error);
                      }
                    }
                    
                    // Reset visual state
                    e.currentTarget.style.background = '#FAFBFC';
                    e.currentTarget.style.border = '1px dashed transparent';
                    e.currentTarget.innerHTML = '<div style="color: #9CA3AF; font-size: 11px; text-align: center; padding-top: 6px;">Click to select time</div>';
                  }}
                  onMouseEnter={(e) => {
                    if (blocks.length === 0 && !isDragging) {
                      e.currentTarget.style.border = '1px dashed #3B82F6';
                      e.currentTarget.style.background = '#EFF6FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (blocks.length === 0 && !isDragging) {
                      e.currentTarget.style.border = '1px dashed transparent';
                      e.currentTarget.style.background = '#FAFBFC';
                    }
                  }}
                >
                  {blocks.length === 0 ? (
                    <div style={{ 
                      color: (dragPreview && isTimeInDragRange(hour, minute, dragPreview)) ? 'white' : '#9CA3AF', 
                      fontSize: '11px',
                      textAlign: 'center',
                      paddingTop: '6px',
                      fontWeight: (dragPreview && isTimeInDragRange(hour, minute, dragPreview)) ? '600' : '400'
                    }}>
                      {(dragPreview && isTimeInDragRange(hour, minute, dragPreview)) ? 
                        'Creating block...' : 
                        'Click to select time'
                      }
                    </div>
                  ) : (
                    blocks.map(block => (
                      <div
                        key={block.id}
                        style={{
                          background: block.color,
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          marginBottom: '4px',
                          fontWeight: '500',
                          fontSize: '13px'
                        }}
                      >
                        <div>{block.title}</div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>
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
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Day Tasks Sidebar - Previous Design */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
          Tasks for Today
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
          Double-click any task to schedule it automatically
        </p>
        
        {dayTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', padding: '20px' }}>
            <CalendarIcon style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No tasks for today</p>
          </div>
        ) : (
          dayTasks.map(task => (
            <div 
              key={task.id} 
              className="task-card" 
              style={{ 
                borderLeftColor: getPriorityColor(task.priority),
                marginBottom: '12px',
                cursor: 'grab',
                padding: '16px'
              }}
              draggable
              onDragStart={(e) => {
                setDraggedTask(task);
                e.currentTarget.style.opacity = '0.6';
                e.currentTarget.style.transform = 'rotate(3deg) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                e.currentTarget.style.zIndex = '1000';
                console.log('Started dragging task:', task.title);
                
                // Set drag data
                e.dataTransfer.setData('text/plain', task.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={(e) => {
                setDraggedTask(null);
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.zIndex = 'auto';
                console.log('Finished dragging task');
              }}
              onDoubleClick={async () => {
                console.log('Double-clicked task:', task.title);
                
                // Simple scheduling: place at next available 9 AM slot
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                
                const endTime = new Date(tomorrow);
                endTime.setMinutes(endTime.getMinutes() + (task.estimated_duration || 60));
                
                const timeBlockData = {
                  title: task.title,
                  description: task.description || '',
                  start_time: tomorrow.toISOString(),
                  end_time: endTime.toISOString(),
                  block_type: 'task',
                  color: getPriorityColor(task.priority),
                  notes: `Scheduled from task: ${task.title}`,
                  user_id: user?.id || 60,
                  is_completed: false
                };

                try {
                  const { data, error } = await supabase
                    .from('personal_time_blocks')
                    .insert([timeBlockData])
                    .select()
                    .single();

                  if (error) {
                    console.error('Error creating time block:', error);
                    alert('Error: ' + error.message);
                  } else {
                    console.log('Time block created successfully!', data);
                    alert(`Task "${task.title}" scheduled for ${tomorrow.toLocaleString()}`);
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error:', error);
                  alert('Error creating time block');
                }
              }}
              onClick={() => onTaskClick(task)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  fontWeight: '600',
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                }}>
                  {task.title}
                </h5>
                
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed');
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.status === 'completed' ? '#10B981' : '#6B7280' }}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircleIconSolid style={{ width: '16px', height: '16px' }} />
                    ) : (
                      <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTask(task);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3B82F6' }}
                  >
                    <PencilIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                  >
                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
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
          ))
        )}
      </div>
    </div>
  );
};