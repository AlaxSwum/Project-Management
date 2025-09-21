'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
  import Sidebar from '@/components/Sidebar';
  import { projectService } from '@/lib/api-compatibility';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  location?: string;
  event_type: string;
  priority: 'low' | 'medium' | 'high';
  status: 'confirmed' | 'tentative' | 'cancelled';
  color: string;
  item_type: 'event' | 'task' | 'time_block';
  completion_percentage?: number;
}

interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  color: string;
  category?: string;
}

type ViewType = 'month' | 'week' | 'day' | '15min';

export default function PersonalCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<PersonalTask[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewType>('15min');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState<PersonalTask | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{date: Date, hour: number, minute: number} | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    color: '#FFB333'
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchCalendarData();
    fetchUnscheduledTasks();
    fetchProjects();
  }, [isAuthenticated, authLoading, router, currentDate]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 7);
      const endDate = new Date(currentDate);
      endDate.setDate(currentDate.getDate() + 7);

      // Get personal events and scheduled tasks
      const [eventsResult, tasksResult] = await Promise.all([
        supabase
          .from('personal_events')
          .select('*')
          .eq('user_id', parseInt(user?.id?.toString() || '0'))
          .gte('start_datetime', startDate.toISOString())
          .lte('start_datetime', endDate.toISOString())
          .order('start_datetime', { ascending: true }),
        
        supabase
          .from('personal_tasks')
          .select('*')
          .eq('user_id', parseInt(user?.id?.toString() || '0'))
          .not('scheduled_start', 'is', null)
          .gte('scheduled_start', startDate.toISOString())
          .lte('scheduled_start', endDate.toISOString())
          .order('scheduled_start', { ascending: true })
      ]);

      if (eventsResult.error) throw eventsResult.error;
      if (tasksResult.error) throw tasksResult.error;
      
      // Transform events
      const transformedEvents = (eventsResult.data || []).map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        start_datetime: event.start_datetime,
        end_datetime: event.end_datetime,
        all_day: event.all_day || false,
        location: event.location || '',
        event_type: event.event_type || 'personal',
        priority: event.priority || 'medium',
        status: event.status || 'confirmed',
        color: event.color || '#5884FD',
        item_type: 'event' as const,
        completion_percentage: undefined
      }));

      // Transform scheduled tasks
      const transformedTasks = (tasksResult.data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        start_datetime: task.scheduled_start,
        end_datetime: task.scheduled_end,
        all_day: false,
        location: '',
        event_type: 'task',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        color: task.color || '#FFB333',
        item_type: 'task' as const,
        completion_percentage: task.completion_percentage || 0
      }));
      
      setEvents([...transformedEvents, ...transformedTasks]);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnscheduledTasks = async () => {
    try {
        const supabase = (await import('@/lib/supabase')).supabase;
        const { data, error } = await supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', parseInt(user?.id?.toString() || '0'))
        .is('scheduled_start', null)
        .order('created_at', { ascending: false });
        
        if (error) {
        console.error('Supabase error:', error);
        return;
      }
      
      setUnscheduledTasks(data || []);
    } catch (err: any) {
      console.error('Error fetching unscheduled tasks:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const projectsData = await projectService.getProjects();
      setProjects(projectsData || []);
    } catch (err: any) {
      console.error('Error fetching projects:', err);
      setProjects([]);
    }
  };

  const createTask = async () => {
    try {
      if (!newTask.title.trim()) {
        setError('Please enter a task title');
        return;
      }
      
      const supabase = (await import('@/lib/supabase')).supabase;
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([{
          user_id: parseInt(user?.id?.toString() || '0'),
          title: newTask.title,
          description: newTask.description || '',
          priority: newTask.priority,
          status: 'todo',
          category: newTask.category || 'personal',
          color: newTask.color,
          tags: [],
          completion_percentage: 0
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      await fetchCalendarData();
      await fetchUnscheduledTasks();
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        color: '#FFB333'
      });
      
      setShowTaskModal(false);
      setError('');
      
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Failed to create task: ' + err.message);
    }
  };

  const handleTaskDragStart = (task: PersonalTask) => {
    setDraggedTask(task);
  };

  const handleTaskDragEnd = () => {
    setDraggedTask(null);
    setDragOverSlot(null);
  };

  const handleSlotDragOver = (e: React.DragEvent, date: Date, hour: number, minute: number = 0) => {
    e.preventDefault();
    if (draggedTask) {
      setDragOverSlot({ date, hour, minute });
    }
  };

  const handleSlotDrop = async (e: React.DragEvent, date: Date, hour: number, minute: number = 0) => {
    e.preventDefault();
    if (!draggedTask) return;

    try {
      const dropTime = new Date(date);
      dropTime.setHours(hour, minute, 0, 0);
      
      const supabase = (await import('@/lib/supabase')).supabase;
      const endTime = new Date(dropTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration
      await supabase
        .from('personal_tasks')
        .update({
          scheduled_start: dropTime.toISOString(),
          scheduled_end: endTime.toISOString(),
          auto_scheduled: false
        })
        .eq('id', draggedTask.id)
        .eq('user_id', parseInt(user?.id?.toString() || '0'));
      
      await fetchCalendarData();
      await fetchUnscheduledTasks();
      
    } catch (err: any) {
      console.error('Error scheduling task:', err);
      setError('Failed to schedule task: ' + err.message);
    } finally {
      setDraggedTask(null);
      setDragOverSlot(null);
    }
  };

  const render15MinView = () => {
    const allDayEvents = events;

    // Generate 15-minute time slots
    const fifteenMinSlots: { hour: number; minute: number }[] = [];
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        fifteenMinSlots.push({ hour, minute });
      }
    }

    const slotHeight = 40;
    const headerHeight = 100;

    return (
      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* Unscheduled Tasks Sidebar */}
        <div style={{ 
          width: '300px',
          background: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem', 
            fontWeight: '600',
            color: '#1a1a1a'
          }}>
            Unscheduled Tasks
          </h3>
          
          {unscheduledTasks.length === 0 ? (
            <p style={{ 
              color: '#666666', 
              fontSize: '0.9rem',
              fontStyle: 'italic',
              textAlign: 'center',
              margin: '2rem 0'
            }}>
              No unscheduled tasks
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleTaskDragStart(task)}
                  onDragEnd={handleTaskDragEnd}
                style={{
                    padding: '0.75rem',
                    background: task.color || '#FFB333',
                    color: '#ffffff',
                    borderRadius: '8px',
                    cursor: 'grab',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {task.title}
                </div>
                  {task.priority && (
                    <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      Priority: {task.priority}
                  </div>
                )}
                </div>
              ))}
                  </div>
                )}
        </div>

        {/* Calendar Grid */}
        <div style={{ 
          background: '#ffffff',
          border: '1px solid #e8e8e8',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
          flex: 1,
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex' }}>
            {/* Time column */}
            <div style={{ width: '80px', borderRight: '1px solid #e0e4e7', background: '#fafbfc' }}>
              <div style={{ height: `${headerHeight}px`, borderBottom: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Time</span>
              </div>
              
              {fifteenMinSlots.map((slot, index) => (
                <div key={`${slot.hour}-${slot.minute}`} style={{
                  height: `${slotHeight}px`,
                  borderBottom: slot.minute === 0 ? '2px solid #d1d5db' : '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
                  fontSize: slot.minute === 0 ? '0.8rem' : '0.7rem',
                  color: slot.minute === 0 ? '#1e293b' : '#64748b',
                  fontWeight: slot.minute === 0 ? '700' : '600',
                  background: slot.minute === 0 ? 'rgba(88, 132, 253, 0.05)' : 'transparent'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    {slot.minute === 0 ? `${slot.hour}:00` : `:${slot.minute.toString().padStart(2, '0')}`}
            </div>
            </div>
              ))}
          </div>

            {/* Main calendar column */}
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: `${headerHeight}px`, borderBottom: '2px solid #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafbfc' }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              
          {fifteenMinSlots.map((slot, index) => {
            const isWorkingHour = slot.hour >= 9 && slot.hour <= 17;
            
            return (
              <div 
                    key={`main-${slot.hour}-${slot.minute}`} 
                    onDragOver={(e) => handleSlotDragOver(e, currentDate, slot.hour, slot.minute)}
                    onDrop={(e) => handleSlotDrop(e, currentDate, slot.hour, slot.minute)}
                style={{
                  height: `${slotHeight}px`,
                  borderBottom: slot.minute === 0 ? '2px solid #e2e8f0' : '1px solid #e5e7eb',
                      borderRight: '1px solid #e5e7eb',
                  position: 'relative',
                      background: dragOverSlot && 
                        dragOverSlot.date.toDateString() === currentDate.toDateString() &&
                        dragOverSlot.hour === slot.hour && 
                        dragOverSlot.minute === slot.minute 
                        ? 'rgba(88, 132, 253, 0.2)' 
                        : isWorkingHour ? 'rgba(5, 150, 105, 0.02)' : '#ffffff',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                      cursor: draggedTask ? 'copy' : 'default'
                    }}
                  />
              );
            })}

              {/* Events overlay */}
              {allDayEvents.map((event) => {
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
                
                if (eventStart.toDateString() !== currentDate.toDateString()) return null;
                
                const startMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
                const endMinutes = eventEnd.getHours() * 60 + eventEnd.getMinutes();
                const duration = endMinutes - startMinutes;
                
                const topPosition = headerHeight + (startMinutes / 15) * slotHeight;
                const height = (duration / 15) * slotHeight;
            
            return (
              <div
                    key={event.id}
                style={{
                  position: 'absolute',
                  top: `${topPosition}px`,
                      left: '4px',
                      right: '4px',
                      height: `${height}px`,
                      background: event.color,
                  color: '#ffffff',
                      borderRadius: '4px',
                      padding: '4px 8px',
              fontSize: '0.75rem',
                      fontWeight: '500',
                overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                      zIndex: 10
                    }}
                  >
                    <div style={{ fontWeight: '600' }}>{event.title}</div>
                    {event.description && (
                      <div style={{ fontSize: '0.7rem', opacity: 0.9, marginTop: '2px' }}>
                  {event.description}
                </div>
              )}
      </div>
                  );
                })}
                    </div>
                  </div>
        </div>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={projects} onCreateProject={() => {}} />

        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          minHeight: '100vh'
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
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
              Personal Calendar - 15 Min Timeblocking
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
              Drag tasks from sidebar to time slots for scheduling
              </p>
            </div>

            <button
            onClick={() => setShowTaskModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
              background: '#FFB333',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
            New Task
            </button>
          </div>

          {error && (
            <div style={{ 
            background: '#fee2e2', 
            border: '1px solid #fecaca', 
            color: '#dc2626', 
              padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
            }}>
              {error}
            </div>
          )}

          {/* Calendar View */}
        {render15MinView()}

        {/* Task Creation Modal */}
        {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
            alignItems: 'center',
          justifyContent: 'center',
            zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
              borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
                Create New Task
              </h2>

              <form onSubmit={(e) => { e.preventDefault(); createTask(); }}>
                    <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    placeholder="Enter task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Description
                  </label>
                  <textarea
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                        fontSize: '1rem',
                      minHeight: '80px'
                      }}
                    placeholder="Enter task description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    />
                  </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Priority
                  </label>
                  <select
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Color
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['#FFB333', '#F87239', '#10b981', '#5884FD', '#C483D9', '#ef4444'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, color })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: color,
                          border: newTask.color === color ? '3px solid #1a1a1a' : '2px solid #e5e7eb',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: '#FFB333',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Task
                  </button>
                </div>
              </form>
                </div>
              </div>
            )}
          </div>
        </div>
  );
}
