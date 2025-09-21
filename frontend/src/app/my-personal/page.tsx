'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ListBulletIcon,
  CheckIcon
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
  const router = useRouter();
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    due_date: ''
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
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchTasks();
  }, [isAuthenticated, authLoading, router, user]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data: tasksData, error: tasksError } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (tasksError) {
        console.error('Error fetching tasks:', tasksError);
        if (tasksError.code === '42P01') {
          setError('Personal tasks system not set up yet. Please contact administrator.');
          return;
        }
        throw tasksError;
      }
      
      setTasks(tasksData || []);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Failed to load personal tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskForm.title.trim()) {
      alert('Please enter a task title');
      return;
    }
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([{
          user_id: user?.id,
          title: taskForm.title,
          description: taskForm.description || null,
          priority: taskForm.priority,
          category: taskForm.category || null,
          due_date: taskForm.due_date || null,
          status: 'todo'
        }])
        .select();
      
      if (error) throw error;
      
      // Reset form and close modal
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        due_date: ''
      });
      setShowAddTask(false);
      
      // Refresh tasks
      await fetchTasks();
      
    } catch (err: any) {
      console.error('Error adding task:', err);
      alert('Failed to add task. Please try again.');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('personal_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (error) throw error;
      
      // Refresh tasks
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
      
      // Refresh tasks
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
    <>
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
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#111827',
                letterSpacing: '-0.02em'
              }}>
                Personal Tasks
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#6b7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage your personal tasks and productivity
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
                padding: '0.75rem 1rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              Add Task
            </button>
          </div>

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
                      <ListBulletIcon style={{
                        width: '48px',
                        height: '48px',
                        margin: '0 auto 1rem',
                        color: '#d1d5db'
                      }} />
                      <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                        No personal tasks yet
                      </p>
                      <p style={{ fontSize: '0.875rem', margin: '0' }}>
                        Create your first task to get started with personal productivity.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: task.status === 'completed' ? '#f0fdf4' : '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {/* Status Checkbox */}
                          <button
                            onClick={() => updateTaskStatus(
                              task.id, 
                              task.status === 'completed' ? 'todo' : 'completed'
                            )}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem'
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
                                borderRadius: '50%'
                              }}></div>
                            )}
                          </button>
                          
                          {/* Task Content */}
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: task.status === 'completed' ? '#6b7280' : '#111827',
                              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                              marginBottom: '0.25rem'
                            }}>
                              {task.title}
                            </div>
                            {task.description && (
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                marginBottom: '0.25rem'
                              }}>
                                {task.description}
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              gap: '0.5rem',
                              fontSize: '0.75rem'
                            }}>
                              <span style={{
                                background: getPriorityColor(task.priority),
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                textTransform: 'capitalize'
                              }}>
                                {task.priority}
                              </span>
                              {task.category && (
                                <span style={{
                                  background: '#f3f4f6',
                                  color: '#374151',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  {task.category}
                                </span>
                              )}
                              {task.due_date && (
                                <span style={{
                                  background: '#fef3c7',
                                  color: '#92400e',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}>
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {task.status !== 'completed' && (
                              <button
                                onClick={() => updateTaskStatus(task.id, 'in_progress')}
                                style={{
                                  background: task.status === 'in_progress' ? '#dbeafe' : '#f9fafb',
                                  color: task.status === 'in_progress' ? '#1e40af' : '#6b7280',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  padding: '0.5rem',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {task.status === 'in_progress' ? 'In Progress' : 'Start'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteTask(task.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#dc2626',
                                padding: '0.25rem'
                              }}
                            >
                              <TrashIcon style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div 
          style={{
            position: 'fixed',
            inset: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            zIndex: 1000
          }}
          onClick={() => setShowAddTask(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '500px',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                margin: '0',
                color: '#111827'
              }}>
                Add Personal Task
              </h2>
              <button
                onClick={() => setShowAddTask(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
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
                  required
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

              <div>
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
                gap: '0.75rem',
                marginTop: '1rem'
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

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </>
  );
}