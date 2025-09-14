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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
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

export default function PersonalTaskPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<PersonalTimeBlock[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
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
    status: 'pending' as const,
    priority: 'medium' as const,
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
    block_type: 'task' as const,
    color: '#3B82F6',
    notes: ''
  });

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
      const { data: tasksData, error: tasksError } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .gte('due_date', startDate.toISOString())
        .lte('due_date', endDate.toISOString())
        .order('due_date', { ascending: true });

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

      setTasks(prev => [...prev, data]);
      setShowTaskModal(false);
      resetTaskForm();
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const handleCreateTimeBlock = async () => {
    try {
      if (!newTimeBlock.title.trim() || !newTimeBlock.start_time || !newTimeBlock.end_time) {
        setError('Title, start time, and end time are required');
        return;
      }

      const timeBlockData = {
        ...newTimeBlock,
        user_id: user?.id,
        start_time: new Date(newTimeBlock.start_time).toISOString(),
        end_time: new Date(newTimeBlock.end_time).toISOString()
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
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
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
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const handleDeleteTimeBlock = async (timeBlockId: string) => {
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
    } catch (error) {
      console.error('Error deleting time block:', error);
      setError('Failed to delete time block');
    }
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
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
      block_type: 'task',
      color: '#3B82F6',
      notes: ''
    });
    setSelectedTimeBlock(null);
    setIsEditingTimeBlock(false);
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

  const generate15MinSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #C483D9', 
            borderTop: '3px solid #5884FD', 
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
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 4px solid #3B82F6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
          }
          
          .task-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            transform: translateY(-1px);
          }
          
          .time-block {
            background: white;
            border-radius: 6px;
            padding: 8px;
            margin: 2px 0;
            border-left: 3px solid #3B82F6;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .time-block:hover {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .priority-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 500;
          }
          
          .view-tabs {
            display: flex;
            background: white;
            border-radius: 8px;
            padding: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .view-tab {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .view-tab.active {
            background: #3B82F6;
            color: white;
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .modal-content {
            background: white;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          .form-label {
            display: block;
            margin-bottom: 4px;
            font-weight: 500;
            color: #374151;
          }
          
          .form-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #D1D5DB;
            border-radius: 6px;
            font-size: 14px;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
          }
          
          .btn-primary {
            background: #3B82F6;
            color: white;
          }
          
          .btn-primary:hover {
            background: #2563EB;
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
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />
        
        <div style={{ marginLeft: '256px', flex: 1, padding: '24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1F2937', margin: 0 }}>
                Personal Task Management
              </h1>
              <p style={{ color: '#6B7280', margin: '4px 0 0 0' }}>
                Manage your personal tasks and time blocks
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowTaskModal(true)}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                Add Task
              </button>
              <button
                onClick={() => setShowTimeBlockModal(true)}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ClockIcon style={{ width: '16px', height: '16px' }} />
                Add Time Block
              </button>
            </div>
          </div>

          {/* View Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
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
                style={{ padding: '6px' }}
              >
                <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
              </button>
              
              <h2 style={{ margin: 0, color: '#1F2937', fontSize: '18px', minWidth: '200px', textAlign: 'center' }}>
                {formatDate(currentDate)}
              </h2>
              
              <button
                onClick={() => navigateDate('next')}
                className="btn btn-secondary"
                style={{ padding: '6px' }}
              >
                <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{ 
              background: '#FEF2F2', 
              border: '1px solid #FECACA', 
              color: '#B91C1C', 
              padding: '12px', 
              borderRadius: '6px', 
              marginBottom: '24px' 
            }}>
              {error}
            </div>
          )}

          {/* Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            {/* Tasks Section */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' }}>
                Tasks ({tasks.length})
              </h3>
              
              {tasks.length === 0 ? (
                <div style={{ 
                  background: 'white', 
                  padding: '48px', 
                  borderRadius: '8px', 
                  textAlign: 'center',
                  color: '#6B7280'
                }}>
                  <CalendarIcon style={{ width: '48px', height: '48px', margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No tasks found for this {currentView}</p>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="btn btn-primary"
                    style={{ marginTop: '12px' }}
                  >
                    Create your first task
                  </button>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task.id} className="task-card" style={{ borderLeftColor: getPriorityColor(task.priority) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600',
                        color: task.status === 'completed' ? '#6B7280' : '#1F2937',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                      }}>
                        {task.title}
                      </h4>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: task.status === 'completed' ? '#10B981' : '#6B7280'
                          }}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircleIconSolid style={{ width: '20px', height: '20px' }} />
                          ) : (
                            <CheckCircleIcon style={{ width: '20px', height: '20px' }} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                        >
                          <TrashIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                    
                    {task.description && (
                      <p style={{ margin: '0 0 8px 0', color: '#6B7280', fontSize: '14px' }}>
                        {task.description}
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
                        <FlagIcon style={{ width: '10px', height: '10px', marginRight: '2px' }} />
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
                      
                      {task.due_date && (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      {task.estimated_duration && (
                        <span style={{ fontSize: '12px', color: '#6B7280' }}>
                          <ClockIcon style={{ width: '12px', height: '12px', display: 'inline', marginRight: '2px' }} />
                          {task.estimated_duration}m
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Time Blocks Section */}
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1F2937', marginBottom: '16px' }}>
                Time Blocks
              </h3>
              
              <div style={{ background: 'white', borderRadius: '8px', padding: '16px' }}>
                {currentView === 'day' && (
                  <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {generate15MinSlots().map(time => {
                      const blocksAtTime = timeBlocks.filter(block => {
                        const blockStart = new Date(block.start_time);
                        const slotTime = `${blockStart.getHours().toString().padStart(2, '0')}:${blockStart.getMinutes().toString().padStart(2, '0')}`;
                        return slotTime === time;
                      });
                      
                      return (
                        <div key={time} style={{ marginBottom: '1px', minHeight: '20px' }}>
                          <div style={{ fontSize: '10px', color: '#6B7280', marginBottom: '2px' }}>
                            {time}
                          </div>
                          {blocksAtTime.map(block => (
                            <div
                              key={block.id}
                              className="time-block"
                              style={{ 
                                borderLeftColor: block.color,
                                background: block.is_completed ? '#F3F4F6' : 'white'
                              }}
                              onClick={() => {
                                setSelectedTimeBlock(block);
                                setShowTimeBlockModal(true);
                                setIsEditingTimeBlock(true);
                              }}
                            >
                              <div style={{ fontWeight: '500', fontSize: '11px' }}>{block.title}</div>
                              <div style={{ color: '#6B7280', fontSize: '10px' }}>
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
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {currentView !== 'day' && (
                  <div>
                    {timeBlocks.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#6B7280', padding: '24px' }}>
                        <ClockIcon style={{ width: '32px', height: '32px', margin: '0 auto 12px', opacity: 0.5 }} />
                        <p>No time blocks for this {currentView}</p>
                      </div>
                    ) : (
                      timeBlocks.map(block => (
                        <div key={block.id} className="time-block" style={{ borderLeftColor: block.color, marginBottom: '8px' }}>
                          <div style={{ fontWeight: '500', fontSize: '12px' }}>{block.title}</div>
                          <div style={{ color: '#6B7280', fontSize: '11px' }}>
                            {new Date(block.start_time).toLocaleDateString()} {new Date(block.start_time).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
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
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 20px 0' }}>
              {isEditingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Estimated Duration (minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newTask.estimated_duration}
                  onChange={(e) => setNewTask({ ...newTask, estimated_duration: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                value={newTask.category}
                onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                placeholder="Enter category (optional)"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
                onClick={handleCreateTask}
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
            <h3 style={{ margin: '0 0 20px 0' }}>
              {isEditingTimeBlock ? 'Edit Time Block' : 'Create New Time Block'}
            </h3>
            
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={newTimeBlock.title}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, title: e.target.value })}
                placeholder="Enter time block title"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                value={newTimeBlock.description}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, description: e.target.value })}
                placeholder="Enter description"
                rows={2}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTimeBlock.start_time}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, start_time: e.target.value })}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTimeBlock.end_time}
                  onChange={(e) => setNewTimeBlock({ ...newTimeBlock, end_time: e.target.value })}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                value={newTimeBlock.notes}
                onChange={(e) => setNewTimeBlock({ ...newTimeBlock, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
