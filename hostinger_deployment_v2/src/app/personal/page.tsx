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
import MobileHeader from '@/components/MobileHeader';
import { projectService } from '@/lib/api-compatibility';

interface ChecklistItem {
  id?: number;
  item_text: string;
  is_completed: boolean;
  item_order: number;
}

interface PersonalTask {
  id: number;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  color: string;
  category?: string;
  checklist_items?: ChecklistItem[];
}

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

export default function PersonalTaskManager() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [unscheduledTasks, setUnscheduledTasks] = useState<PersonalTask[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  // Layout and view options
  const [layoutType, setLayoutType] = useState<'list' | 'calendar' | '15min'>('15min');
  
  // Drag and drop state for 15-minute timeblocking
  const [draggedTask, setDraggedTask] = useState<PersonalTask | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<{date: Date, hour: number, minute: number} | null>(null);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    category: '',
    color: '#3B82F6',
    duration: 30, // Default 30 minutes
    start_date: new Date().toISOString().split('T')[0], // Today's date
    start_time: '09:00', // Default start time
    due_date: new Date().toISOString().split('T')[0], // Today's date
    due_time: '10:00' // Default due time
  });

  // Checklist state
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

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
      
      const { data, error } = await supabase
        .from('projects_meeting')
        .select('*')
        .or(`created_by_id.eq.${parseInt(user?.id?.toString() || '0')},attendee_ids.cs.{${parseInt(user?.id?.toString() || '0')}}`)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      const transformedEvents = (data || []).map(meeting => {
        const startDateTime = new Date(`${meeting.date}T${meeting.time}`);
        const endDateTime = new Date(startDateTime.getTime() + (meeting.duration * 60000));
        
        return {
          id: meeting.id,
          title: meeting.title,
          description: meeting.description || '',
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          all_day: meeting.all_day || false,
          location: meeting.location || '',
          event_type: meeting.event_type || 'meeting',
          priority: 'medium' as const,
          status: 'confirmed' as const,
          color: meeting.color || '#3B82F6',
          item_type: (meeting.event_type === 'task' ? 'task' : 'event') as 'event' | 'task' | 'time_block',
          completion_percentage: undefined
        };
      });
      
      setEvents(transformedEvents);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnscheduledTasks = async () => {
    try {
      console.log('🔍 Fetching unscheduled tasks for user:', user?.id);
      const supabase = (await import('@/lib/supabase')).supabase;
      const userId = parseInt(user?.id?.toString() || '0');
      console.log('🔍 Using integer user ID:', userId);
      
      const { data, error } = await supabase
        .from('projects_meeting')
        .select('*')
        .eq('created_by_id', userId)
        .eq('event_type', 'task')
        .order('created_at', { ascending: false });

      console.log('📊 Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      const tasks: PersonalTask[] = (data || []).map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description || '',
        priority: 'medium' as const,
        status: 'todo' as const,
        color: meeting.color || '#3B82F6',
        category: 'personal'
      }));

      console.log('✅ Transformed tasks:', tasks);
      setUnscheduledTasks(tasks);
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
        .from('projects_meeting')
        .insert([{
          title: newTask.title,
          description: newTask.description,
          date: newTask.start_date, // Use selected start date
          time: newTask.start_time, // Use selected start time
          duration: newTask.duration, // Use dynamic duration
          event_type: 'task',
          color: newTask.color,
          created_by_id: parseInt(user?.id?.toString() || '0'),
          attendee_ids: [parseInt(user?.id?.toString() || '0')]
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Save checklist items if any
      if (checklistItems.length > 0 && data) {
        const checklistInserts = checklistItems.map((item, index) => ({
          task_id: data.id,
          user_id: parseInt(user?.id?.toString() || '0'),
          item_text: item.item_text,
          is_completed: item.is_completed,
          item_order: index
        }));

        const { error: checklistError } = await supabase
          .from('task_checklist_items')
          .insert(checklistInserts);

        if (checklistError) {
          console.error('Error saving checklist items:', checklistError);
        }
      }
      
      await fetchCalendarData();
      await fetchUnscheduledTasks();
      
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        category: '',
        color: '#3B82F6',
        duration: 30,
        start_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        due_date: new Date().toISOString().split('T')[0],
        due_time: '10:00'
      });
      setChecklistItems([]);
      setNewChecklistItem('');
      
      setShowTaskModal(false);
      setSuccessMessage('Task created successfully!');
      setError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError('Failed to create task: ' + err.message);
    }
  };

  // Checklist functions
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([
        ...checklistItems,
        {
          item_text: newChecklistItem.trim(),
          is_completed: false,
          item_order: checklistItems.length
        }
      ]);
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const toggleChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.map((item, i) => 
      i === index ? { ...item, is_completed: !item.is_completed } : item
    ));
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
      await supabase
        .from('projects_meeting')
        .update({
          date: dropTime.toISOString().split('T')[0],
          time: dropTime.toISOString().split('T')[1].substring(0, 5),
          duration: 60
        })
        .eq('id', draggedTask.id)
        .eq('created_by_id', parseInt(user?.id?.toString() || '0'));
      
      await fetchCalendarData();
      await fetchUnscheduledTasks();
      
      setSuccessMessage('Task scheduled successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err: any) {
      console.error('Error scheduling task:', err);
      setError('Failed to schedule task: ' + err.message);
    } finally {
      setDraggedTask(null);
      setDragOverSlot(null);
    }
  };

  const renderListView = () => {
    return (
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1F2937' }}>
          All Tasks ({unscheduledTasks.length})
        </h2>
        
        {unscheduledTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <ClockIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No tasks found</p>
            <p style={{ fontSize: '0.9rem' }}>Create your first task to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                className={`task-card priority-${task.priority} status-${task.status}`}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: `2px solid ${task.color}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 className="task-title" style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1F2937' }}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p style={{ margin: '0 0 0.75rem 0', color: '#6B7280', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        {task.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        background: task.color,
                        color: '#ffffff',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {task.priority}
                      </span>
                      <span style={{
                        background: '#F3F4F6',
                        color: '#6B7280',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    return (
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#1F2937' }}>
          Calendar View
        </h2>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
          <CalendarIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>Calendar view coming soon</p>
          <p style={{ fontSize: '0.9rem' }}>Use 15 Min view for timeblocking</p>
        </div>
      </div>
    );
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
          width: isMobile ? '100%' : '300px',
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            fontSize: '1.1rem', 
            fontWeight: '600',
            color: '#1F2937'
          }}>
            📋 Unscheduled Tasks
          </h3>
          
          {unscheduledTasks.length === 0 ? (
            <p style={{ 
              color: '#6B7280', 
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
                    background: task.color || '#3B82F6',
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

        {/* Calendar Grid - Only show if not mobile or if mobile is in timeblocking mode */}
        {(!isMobile || layoutType === '15min') && (
          <div style={{
            background: '#ffffff',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            flex: 1,
            maxHeight: '600px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex' }}>
              {/* Time column */}
              <div style={{ width: '80px', borderRight: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                <div style={{ 
                  height: `${headerHeight}px`, 
                  borderBottom: '2px solid #D1D5DB', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#F3F4F6'
                }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#374151' }}>Time</span>
                </div>
                
                {fifteenMinSlots.map((slot, index) => (
                  <div key={`${slot.hour}-${slot.minute}`} style={{
                    height: `${slotHeight}px`,
                    borderBottom: slot.minute === 0 ? '2px solid #D1D5DB' : '1px solid #E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: slot.minute === 0 ? '0.8rem' : '0.7rem',
                    color: slot.minute === 0 ? '#1F2937' : '#6B7280',
                    fontWeight: slot.minute === 0 ? '700' : '600',
                    background: slot.minute === 0 ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      {slot.minute === 0 ? `${slot.hour}:00` : `:${slot.minute.toString().padStart(2, '0')}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Main calendar column */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ 
                  height: `${headerHeight}px`, 
                  borderBottom: '2px solid #D1D5DB', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: '#F3F4F6'
                }}>
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
                        borderBottom: slot.minute === 0 ? '2px solid #E5E7EB' : '1px solid #F3F4F6',
                        borderRight: '1px solid #E5E7EB',
                        position: 'relative',
                        background: dragOverSlot && 
                          dragOverSlot.date.toDateString() === currentDate.toDateString() &&
                          dragOverSlot.hour === slot.hour && 
                          dragOverSlot.minute === slot.minute 
                          ? 'rgba(59, 130, 246, 0.2)' 
                          : isWorkingHour ? 'rgba(16, 185, 129, 0.02)' : '#ffffff',
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
        )}
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {!isMobile && <Sidebar projects={projects} onCreateProject={() => {}} />}
        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '1rem' : '2rem', 
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
            border: '4px solid #E5E7EB', 
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
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          }
          
          .priority-high { border-left-color: #EF4444; }
          .priority-medium { border-left-color: #F59E0B; }
          .priority-low { border-left-color: #10B981; }
          .priority-urgent { border-left-color: #8B5CF6; }
          
          .status-completed { opacity: 0.7; }
          .status-completed .task-title { text-decoration: line-through; }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
        {!isMobile && <Sidebar projects={projects} onCreateProject={() => {}} />}
        {isMobile && <MobileHeader title="Personal Tasks" isMobile={isMobile} />}

        <div style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '1rem' : '2rem', 
          background: '#F8FAFC', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: isMobile ? '2rem' : '2.5rem', 
                fontWeight: '700', 
                margin: '0', 
                color: '#1F2937',
                letterSpacing: '-0.02em'
              }}>
              Personal Task Management
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#6B7280', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
              Manage your personal tasks with 15-minute timeblocking - Build 2024
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Layout Type Selector */}
              <div style={{ display: 'flex', background: '#ffffff', borderRadius: '12px', padding: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {[
                  { type: 'list', icon: '📋', label: 'List' },
                  { type: 'calendar', icon: '📅', label: 'Calendar' },
                  { type: '15min', icon: '⏰', label: '15 Min' }
                ].map(({ type, icon, label }) => (
                  <button
                    key={type}
                    onClick={() => setLayoutType(type as any)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: layoutType === type ? '#3B82F6' : 'transparent',
                      color: layoutType === type ? '#ffffff' : '#6B7280',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>{icon}</span>
                    {!isMobile && <span>{label}</span>}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowTaskModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  background: '#3B82F6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                {!isMobile && 'New Task'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ 
              background: '#FEE2E2', 
              border: '1px solid #FECACA', 
              color: '#DC2626', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div style={{ 
              background: '#D1FAE5', 
              border: '1px solid #A7F3D0', 
              color: '#065F46', 
              padding: '1rem', 
              borderRadius: '12px', 
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {successMessage}
            </div>
          )}

          {/* Content Area - Different layouts based on selection */}
          {layoutType === '15min' && render15MinView()}
          {layoutType === 'list' && renderListView()}
          {layoutType === 'calendar' && renderCalendarView()}

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
                borderRadius: '16px',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
                  Create New Task
                </h2>

                <form onSubmit={(e) => { e.preventDefault(); createTask(); }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Task Title *
                    </label>
                    <input
                      type="text"
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s ease'
                      }}
                      placeholder="Enter task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Description
                    </label>
                    <textarea
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        minHeight: '80px',
                        transition: 'border-color 0.2s ease',
                        resize: 'vertical'
                      }}
                      placeholder="Enter task description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Priority
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        background: '#ffffff'
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s ease'
                      }}
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Due Time
                    </label>
                    <input
                      type="time"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s ease'
                      }}
                      value={newTask.due_time}
                      onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #E5E7EB',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        transition: 'border-color 0.2s ease'
                      }}
                      placeholder="30"
                      value={newTask.duration}
                      onChange={(e) => setNewTask({ ...newTask, duration: parseInt(e.target.value) || 30 })}
                      onFocus={(e) => e.target.style.borderColor = '#3B82F6'}
                      onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewTask({ ...newTask, color })}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: color,
                            border: newTask.color === color ? '3px solid #1F2937' : '2px solid #E5E7EB',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                      To-Do List (Optional)
                    </label>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addChecklistItem();
                            }
                          }}
                          placeholder="Add a checklist item..."
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '2px solid #E5E7EB',
                            borderRadius: '6px',
                            fontSize: '0.875rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={addChecklistItem}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#10B981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    {checklistItems.length > 0 && (
                      <div style={{
                        background: '#F9FAFB',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {checklistItems.map((item, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.5rem',
                              background: '#ffffff',
                              borderRadius: '6px',
                              marginBottom: index < checklistItems.length - 1 ? '0.5rem' : '0',
                              border: '1px solid #E5E7EB'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={item.is_completed}
                              onChange={() => toggleChecklistItem(index)}
                              style={{
                                width: '16px',
                                height: '16px',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{
                              flex: 1,
                              fontSize: '0.875rem',
                              color: item.is_completed ? '#9CA3AF' : '#1F2937',
                              textDecoration: item.is_completed ? 'line-through' : 'none'
                            }}>
                              {item.item_text}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeChecklistItem(index)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                background: '#FEE2E2',
                                color: '#DC2626',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: '#3B82F6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
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
    </>
  );
}
