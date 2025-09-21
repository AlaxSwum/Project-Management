'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ListBulletIcon,
  CheckIcon,
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import Sidebar from '@/components/Sidebar';

interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  category?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export default function PersonalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [view, setView] = useState<'tasks' | 'calendar'>('tasks');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | '15min'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    due_date: ''
  });

  // Calendar functions
  const previousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch tasks
  useEffect(() => {
    if (isAuthenticated) {
      fetchTasks();
    }
  }, [isAuthenticated]);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTasks(data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskForm.title.trim()) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('personal_tasks')
        .insert([{
          user_id: user.id,
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          priority: taskForm.priority,
          status: 'todo',
          category: taskForm.category.trim() || null,
          due_date: taskForm.due_date || null
        }]);
      
      if (error) throw error;
      
      // Reset form and refresh tasks
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        due_date: ''
      });
      setShowAddTask(false);
      await fetchTasks();
      
    } catch (err: any) {
      console.error('Error adding task:', err);
      alert('Failed to add task. Please try again.');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('personal_tasks')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      
      if (error) throw error;
      
      await fetchTasks();
      
    } catch (err: any) {
      console.error('Error updating task:', err);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('personal_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      await fetchTasks();
      
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

        <div style={{
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '1rem' : '2rem', 
          background: '#f8fafc', 
          flex: 1,
          minHeight: '100vh',
          paddingTop: isMobile ? '4rem' : '2rem'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h1 style={{ 
                  fontSize: '2.5rem', 
                  fontWeight: '300', 
                  margin: '0', 
                  color: '#111827',
                  letterSpacing: '-0.02em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  {view === 'tasks' ? (
                    <>
                      <ListBulletIcon style={{ width: '32px', height: '32px' }} />
                      Personal Tasks
                    </>
                  ) : (
                    <>
                      <CalendarIcon style={{ width: '32px', height: '32px' }} />
                      Personal Calendar
                    </>
                  )}
                </h1>
                
                {/* View Toggle */}
                <div style={{
                  display: 'flex',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '2px solid #e5e7eb',
                  gap: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <button
                    onClick={() => setView('tasks')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: view === 'tasks' ? '#3b82f6' : 'transparent',
                      color: view === 'tasks' ? '#ffffff' : '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setView('calendar')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      background: view === 'calendar' ? '#3b82f6' : 'transparent',
                      color: view === 'calendar' ? '#ffffff' : '#6b7280',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Calendar
                  </button>
                </div>
              </div>
              
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                {view === 'tasks' 
                  ? 'Manage your personal tasks and productivity'
                  : 'Schedule and organize your tasks with calendar views'
                }
              </p>
            </div>
            
            <button
              onClick={() => setShowAddTask(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Add Task
            </button>
          </div>

          {/* Main Content */}
          {view === 'tasks' ? (
            // TASKS VIEW
            <div>
              {error && (
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  borderRadius: '8px', 
                  padding: '1rem', 
                  marginBottom: '2rem',
                  color: '#dc2626',
                  fontWeight: '500',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              {isLoading ? (
                <div style={{
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center', 
                  height: '400px',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid #f3f4f6',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  <p style={{ color: '#6b7280', fontSize: '1rem' }}>Loading personal tasks...</p>
                </div>
              ) : (
                <div>
                  {/* Tasks List */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden'
                  }}>
                    {/* Header */}
                    <div style={{
                      background: '#f9fafb',
                      padding: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        margin: '0',
                        color: '#111827'
                      }}>
                        Tasks ({tasks.length})
                      </h3>
                    </div>

                    {/* Tasks */}
                    <div style={{ padding: '1rem' }}>
                      {tasks.length === 0 ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '3rem',
                          color: '#6b7280'
                        }}>
                          <ListBulletIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No tasks yet</p>
                          <p style={{ fontSize: '0.875rem' }}>Create your first personal task to get started</p>
                        </div>
                      ) : (
                        tasks.map(task => (
                          <div
                            key={task.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '1rem',
                              padding: '1rem',
                              border: '1px solid #f3f4f6',
                              borderRadius: '8px',
                              marginBottom: '0.75rem',
                              background: task.status === 'completed' ? '#f8fafc' : '#ffffff',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <button
                              onClick={() => updateTaskStatus(
                                task.id, 
                                task.status === 'completed' ? 'todo' : 'completed'
                              )}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0',
                                marginTop: '0.125rem'
                              }}
                            >
                              {task.status === 'completed' ? (
                                <CheckCircleIconSolid style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  color: '#10b981' 
                                }} />
                              ) : (
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  border: '2px solid #d1d5db',
                                  borderRadius: '50%',
                                  transition: 'all 0.2s ease'
                                }} />
                              )}
                            </button>
                            
                            <div style={{ flex: 1 }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                marginBottom: '0.5rem'
                              }}>
                                <h4 style={{
                                  fontSize: '1rem',
                                  fontWeight: '500',
                                  color: task.status === 'completed' ? '#9ca3af' : '#111827',
                                  margin: '0',
                                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                }}>
                                  {task.title}
                                </h4>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    color: getPriorityColor(task.priority),
                                    background: `${getPriorityColor(task.priority)}20`,
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '12px'
                                  }}>
                                    {task.priority}
                                  </span>
                                  
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      color: '#ef4444',
                                      padding: '0.25rem'
                                    }}
                                  >
                                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                                  </button>
                                </div>
                              </div>
                              
                              {task.description && (
                                <p style={{
                                  fontSize: '0.875rem',
                                  color: '#6b7280',
                                  margin: '0 0 0.5rem 0',
                                  lineHeight: '1.4'
                                }}>
                                  {task.description}
                                </p>
                              )}
                              
                              <div style={{
                                display: 'flex',
                                gap: '1rem',
                                fontSize: '0.75rem',
                                color: '#9ca3af'
                              }}>
                                {task.category && (
                                  <span>Category: {task.category}</span>
                                )}
                                {task.due_date && (
                                  <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // CALENDAR VIEW
            <div>
              {/* Calendar View Toggle */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  background: '#ffffff',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '2px solid #e5e7eb',
                  gap: '2px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {[
                    { key: 'month', label: 'Month' },
                    { key: 'week', label: 'Week' },
                    { key: 'day', label: 'Day' },
                    { key: '15min', label: '15 Min' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCalendarView(key as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: calendarView === key ? '#3b82f6' : 'transparent',
                        color: calendarView === key ? '#ffffff' : '#6b7280',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '70px'
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendar Navigation */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <button 
                  onClick={previousMonth}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
                </button>
                
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0'
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                
                <button 
                  onClick={nextMonth}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Calendar Content */}
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <CalendarIcon style={{ 
                  width: '80px', 
                  height: '80px', 
                  color: '#3b82f6', 
                  marginBottom: '2rem' 
                }} />
                <h2 style={{
                  fontSize: '2rem',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '1rem'
                }}>
                  {calendarView.toUpperCase()} VIEW
                </h2>
                <p style={{
                  color: '#6b7280',
                  fontSize: '1.125rem',
                  marginBottom: '2rem',
                  maxWidth: '500px'
                }}>
                  {calendarView === 'month' && 'Monthly overview of your scheduled tasks'}
                  {calendarView === 'week' && 'Weekly schedule with hourly time slots'}
                  {calendarView === 'day' && 'Daily schedule with 15-minute time blocks'}
                  {calendarView === '15min' && '15-minute focused time blocking view'}
                </p>
                
                {/* Feature highlights */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '2rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'left',
                    maxWidth: '200px'
                  }}>
                    <ClockIcon style={{ width: '24px', height: '24px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>15-Min Blocks</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Precise time management</p>
                  </div>
                  <div style={{
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'left',
                    maxWidth: '200px'
                  }}>
                    <ListBulletIcon style={{ width: '24px', height: '24px', color: '#3b82f6', marginBottom: '0.5rem' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>Drag & Drop</h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0' }}>Easy task scheduling</p>
                  </div>
                </div>
                
                <div style={{
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '8px',
                  padding: '1rem',
                  fontSize: '0.875rem',
                  color: '#92400e'
                }}>
                  Calendar views with 15-minute time blocking are coming soon! This will integrate with your personal tasks for complete time management.
                </div>
              </div>
            </div>
          )}

          {/* Add Task Modal */}
          {showAddTask && (
            <div style={{
              position: 'fixed',
              inset: '0',
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              padding: '1rem'
            }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '2rem',
                width: '100%',
                maxWidth: '500px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#111827',
                    margin: '0'
                  }}>
                    Add New Task
                  </h3>
                  <button
                    onClick={() => setShowAddTask(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <XMarkIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
                  </button>
                </div>

                <form onSubmit={addTask}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      placeholder="Enter task title"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      placeholder="Task description (optional)"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151',
                        marginBottom: '0.5rem'
                      }}>
                        Category
                      </label>
                      <input
                        type="text"
                        value={taskForm.category}
                        onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                        placeholder="e.g., Work, Personal"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={taskForm.due_date}
                      onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem'
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowAddTask(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: '#ffffff',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#3b82f6',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      Add Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </div>
  );
}