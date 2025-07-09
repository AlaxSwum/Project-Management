'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  CheckCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
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

interface CalendarSettings {
  default_view: 'month' | 'week' | 'day' | 'agenda';
  time_format: '12h' | '24h';
  start_hour: number;
  end_hour: number;
  first_day_of_week: number;
  working_hours_start: string;
  working_hours_end: string;
  theme_color: string;
}

type ViewType = 'month' | 'week' | 'day';

export default function PersonalCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<CalendarSettings>({
    default_view: 'week',
    time_format: '12h', // 12-hour format for "12 AM, 1 AM, 2 AM" format
    start_hour: 0, // Start from 12 AM (midnight) - FIXED to include hour 0
    end_hour: 23, // End at 11 PM
    first_day_of_week: 0,
    working_hours_start: '09:00:00',
    working_hours_end: '17:00:00',
    theme_color: '#5884FD'
  });
  const [currentView, setCurrentView] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  
  // Drag-to-create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ date: Date; hour: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ date: Date; hour: number } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ startTime: Date; endTime: Date } | null>(null);
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_datetime: '',
    end_datetime: '',
    all_day: false,
    location: '',
    event_type: 'personal',
    priority: 'medium',
    color: '#5884FD',
    project_id: 0
  });

  // Location options for dropdown
  const locationOptions = [
    'Office',
    'Home',
    'Conference Room A',
    'Conference Room B',
    'Meeting Room 1',
    'Meeting Room 2',
    'Client Office',
    'Remote/Online',
    'Restaurant',
    'Coffee Shop',
    'Outdoor',
    'Training Center',
    'Other'
  ];

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchCalendarData();
    fetchProjects();
    fetchSettings();
  }, [isAuthenticated, authLoading, router, currentDate, currentView]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Calculate date range based on current view
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      // Fetch personal calendar events (RLS policies ensure user only sees their own events)
      const { data, error } = await supabase
        .from('projects_meeting')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      
      if (error) throw error;
      
      // Transform timetable data to calendar event format
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
          color: meeting.color || '#5884FD',
          item_type: 'event' as const,
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

  const fetchProjects = async () => {
    try {
      console.log('🔍 Fetching projects for personal calendar...');
      console.log('🔍 User:', user);
      
      try {
        // Use the same service as timetable for consistency
        const projectsData = await projectService.getProjects();
        
        console.log('✅ Projects fetched successfully:', projectsData);
        console.log('📊 Number of projects:', projectsData?.length || 0);
        
        if (projectsData && projectsData.length > 0) {
          console.log('📋 Project names:', projectsData.map(p => p.name));
          setProjects(projectsData);
          return;
        } else {
          console.warn('⚠️ No projects returned from projectService.getProjects()');
        }
      } catch (serviceError) {
        console.error('❌ projectService.getProjects() failed:', serviceError);
        console.log('🔄 Trying direct database query as fallback...');
        
        // Fallback to direct database query
        const supabase = (await import('@/lib/supabase')).supabase;
        
        const { data, error } = await supabase
          .from('projects_project')
          .select('id, name, status')
          .order('name', { ascending: true });
        
        if (error) {
          console.error('❌ Direct database query also failed:', error);
          throw error;
        }
        
        console.log('✅ Direct database query successful:', data);
        console.log('📊 All projects found:', data?.length || 0);
        
        // Try different status filters
        const activeProjects = data?.filter(p => p.status === 'active') || [];
        const allProjects = data || [];
        
        console.log('📈 Active projects:', activeProjects.length);
        console.log('📈 All projects:', allProjects.length);
        
        if (activeProjects.length > 0) {
          setProjects(activeProjects);
        } else if (allProjects.length > 0) {
          console.log('🔧 No active projects, using all projects');
          setProjects(allProjects);
        } else {
          console.warn('⚠️ No projects found at all');
          setProjects([]);
        }
        return;
      }
      
      // If we get here, projectService returned empty array
      setProjects([]);
      
    } catch (err: any) {
      console.error('❌ All project fetching methods failed:', err);
      setError('Failed to load projects: ' + err.message);
      setProjects([]);
    }
  };

  // Using hardcoded settings since we're not using personal_calendar_settings table
  const fetchSettings = async () => {
    // Settings are already initialized in state, no need to fetch from database
    console.log('Using default calendar settings');
  };

  const getViewStartDate = () => {
    const date = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        date.setDate(1);
        const firstDayOfWeek = settings.first_day_of_week;
        const currentDay = date.getDay();
        const diff = (currentDay - firstDayOfWeek + 7) % 7;
        date.setDate(date.getDate() - diff);
        break;
      case 'week':
        const startOfWeek = settings.first_day_of_week;
        const currentWeekDay = date.getDay();
        const weekDiff = (currentWeekDay - startOfWeek + 7) % 7;
        date.setDate(date.getDate() - weekDiff);
        break;
      case 'day':
        // Already the correct date
        break;
    }
    
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getViewEndDate = () => {
    const date = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        date.setMonth(date.getMonth() + 1, 0); // Last day of current month
        const lastDayOfWeek = (settings.first_day_of_week + 6) % 7;
        const currentLastDay = date.getDay();
        const lastDiff = (lastDayOfWeek - currentLastDay + 7) % 7;
        date.setDate(date.getDate() + lastDiff);
        break;
      case 'week':
        const startOfWeek = settings.first_day_of_week;
        const currentWeekDay = date.getDay();
        const weekDiff = (currentWeekDay - startOfWeek + 7) % 7;
        date.setDate(date.getDate() - weekDiff + 6);
        break;
      case 'day':
        // Same day
        break;
    }
    
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const formatTime = (dateString: string | number) => {
    const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Time';
    }
    
    if (settings.time_format === '12h') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    }
  };

  const formatHourSlot = (hour: number) => {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    if (settings.time_format === '12h') {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        hour12: true 
      }).replace(':00', ''); // Remove :00 for cleaner display
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        hour12: false 
      }).replace(':00', ''); // Remove :00 for cleaner display
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const deleteEvent = async () => {
    if (!selectedEvent) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)) {
      return;
    }
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('projects_meeting')
        .delete()
        .eq('id', selectedEvent.id);
      
      if (error) throw error;
      
      // Refresh calendar data
      await fetchCalendarData();
      
      // Close modal
      setShowEventModal(false);
      setSelectedEvent(null);
      setIsEditingEvent(false);
      
      console.log('✅ Event deleted successfully');
    } catch (err: any) {
      console.error('❌ Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleTimeSlotClick = (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    // Format for datetime-local input
    const formatForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setNewEvent({
      ...newEvent,
      start_datetime: formatForInput(startTime),
      end_datetime: formatForInput(endTime)
    });
    setShowCreateModal(true);
  };

  // Drag-to-create handlers
  const handleMouseDown = (date: Date, hour: number, event: React.MouseEvent) => {
    event.preventDefault();
    setIsDragging(true);
    setDragStart({ date, hour });
    setDragEnd({ date, hour });
    
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = new Date(date);
    endTime.setHours(hour + 1, 0, 0, 0);
    
    setDragPreview({ startTime, endTime });
  };

  const handleMouseEnter = (date: Date, hour: number) => {
    if (isDragging && dragStart) {
      setDragEnd({ date, hour });
      
      // Calculate the time range for preview
      const startHour = Math.min(dragStart.hour, hour);
      const endHour = Math.max(dragStart.hour, hour) + 1;
      
      const startTime = new Date(dragStart.date);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(dragStart.date);
      endTime.setHours(endHour, 0, 0, 0);
      
      setDragPreview({ startTime, endTime });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const startHour = Math.min(dragStart.hour, dragEnd.hour);
      const endHour = Math.max(dragStart.hour, dragEnd.hour) + 1;
      
      const startTime = new Date(dragStart.date);
      startTime.setHours(startHour, 0, 0, 0);
      const endTime = new Date(dragStart.date);
      endTime.setHours(endHour, 0, 0, 0);
      
      // Format for datetime-local input
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setNewEvent({
        ...newEvent,
        start_datetime: formatForInput(startTime),
        end_datetime: formatForInput(endTime)
      });
      setShowCreateModal(true);
    }
    
    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragPreview(null);
  };

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, dragStart, dragEnd]);

  // Helper function to check if a time slot is being dragged
  const isSlotInDragRange = (date: Date, hour: number) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    
    // Only highlight slots on the same day as drag start
    if (date.toDateString() !== dragStart.date.toDateString()) return false;
    
    const startHour = Math.min(dragStart.hour, dragEnd.hour);
    const endHour = Math.max(dragStart.hour, dragEnd.hour);
    
    return hour >= startHour && hour <= endHour;
  };

  const createEvent = async () => {
    try {
      if (!newEvent.title.trim() || !newEvent.start_datetime || !newEvent.project_id) {
        setError('Please fill in all required fields');
        return;
      }

      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Convert datetime-local format to date and time
      const startDate = new Date(newEvent.start_datetime);
      const endDate = new Date(newEvent.end_datetime);
      
      const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = startDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
      
      // Create a meeting in the timetable using the selected project
      const { data, error } = await supabase
        .from('projects_meeting')
        .insert([{
          title: newEvent.title,
          description: newEvent.description || '',
          date: dateStr,
          time: timeStr,
          duration: duration,
          location: newEvent.location || null,
          color: newEvent.color,
          event_type: newEvent.event_type,
          all_day: newEvent.all_day,
          project_id: newEvent.project_id, // Use selected project ID
          attendee_ids: [parseInt(user?.id?.toString() || '0')],
          created_by_id: parseInt(user?.id?.toString() || '0')
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh calendar data
      await fetchCalendarData();
      
      // Reset form and close modal
      setNewEvent({
        title: '',
        description: '',
        start_datetime: '',
        end_datetime: '',
        all_day: false,
        location: '',
        event_type: 'personal',
        priority: 'medium',
        color: '#5884FD',
        project_id: 0
      });
      setShowCreateModal(false);
      setError('');
      
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError('Failed to create event: ' + err.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#F87239';
      case 'medium': return '#FFB333';
      case 'low': return '#10b981';
      default: return '#C483D9';
    }
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = settings.start_hour; hour <= settings.end_hour; hour++) {
      slots.push(hour);
    }
    return slots;
  };

  const getEventsForTimeSlot = (hour: number, date: Date) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      return (eventStart < slotEnd && eventEnd > slotStart);
    });
  };

  // Get all events for a specific day with proper positioning for week view
  const getEventsForDayWeekView = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      return (eventStart < dayEnd && eventEnd > dayStart);
    }).map(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Calculate position and height
      const startHour = eventStart.getHours();
      const startMinutes = eventStart.getMinutes();
      const endHour = eventEnd.getHours();
      const endMinutes = eventEnd.getMinutes();
      
      const slotHeight = 40; // pixels per hour
      const weekViewDayHeaderHeight = 0; // No additional header offset needed - events position relative to time slots
      
      // Calculate position based on actual time slot index
      // Find which time slot this event belongs to
      const timeSlots = [];
      for (let hour = settings.start_hour; hour <= settings.end_hour; hour++) {
        timeSlots.push(hour);
      }
      
      const slotIndex = timeSlots.indexOf(startHour);
      const topPosition = weekViewDayHeaderHeight + (slotIndex * slotHeight) + (startMinutes * slotHeight / 60);
      

      
      // Calculate height based on duration
      const durationInMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      const height = Math.max(24, (durationInMinutes * slotHeight / 60)); // Minimum 24px
      
      return {
        ...event,
        topPosition,
        height,
        startHour,
        endHour,
        duration: durationInMinutes
      };
    });
  };

  // Get all events for a specific day with proper positioning
  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      return (eventStart < dayEnd && eventEnd > dayStart);
    }).map(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Calculate position and height
      const startHour = eventStart.getHours();
      const startMinutes = eventStart.getMinutes();
      const endHour = eventEnd.getHours();
      const endMinutes = eventEnd.getMinutes();
      
      const slotHeight = 40; // pixels per hour
      const headerHeight = 60;
      
      // Calculate position based on actual time slot index
      // Find which time slot this event belongs to
      const timeSlots = [];
      for (let hour = settings.start_hour; hour <= settings.end_hour; hour++) {
        timeSlots.push(hour);
      }
      
      const slotIndex = timeSlots.indexOf(startHour);
      const topPosition = headerHeight + (slotIndex * slotHeight) + (startMinutes * slotHeight / 60);
      
      // Calculate height based on duration
      const durationInMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      const height = Math.max(24, (durationInMinutes * slotHeight / 60)); // Minimum 24px
      
      return {
        ...event,
        topPosition,
        height,
        startHour,
        endHour,
        duration: durationInMinutes
      };
    });
  };

  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dayEvents = getEventsForDay(currentDate);

    // Calculate height based on visible time slots, not full 24 hours
    const slotHeight = 40;
    const headerHeight = 60;
    const totalHeight = timeSlots.length * slotHeight + headerHeight;

    return (
      <div style={{ display: 'flex', height: `${totalHeight}px`, overflow: 'auto', minHeight: '500px' }}>
        {/* Time column */}
        <div style={{ width: '80px', borderRight: '1px solid #e0e4e7', background: '#fafbfc' }}>
          <div style={{ height: `${headerHeight}px`, borderBottom: '1px solid #e0e4e7' }}></div>
          {timeSlots.map(hour => (
            <div key={hour} style={{
              height: `${slotHeight}px`,
              borderBottom: '1px solid #f0f1f2',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '2px',
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {formatHourSlot(hour)}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
          {/* Header */}
          <div style={{
            height: `${headerHeight}px`,
            borderBottom: '1px solid #e0e4e7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #5884FD, #6c91ff)',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '1rem',
            boxShadow: '0 2px 4px rgba(88, 132, 253, 0.1)'
          }}>
            {formatDate(currentDate)}
          </div>

          {/* Time slots */}
          {timeSlots.map((hour, index) => {
            const isInDragRange = isSlotInDragRange(currentDate, hour);
            const isWorkingHour = hour >= 9 && hour <= 17;
            
            return (
              <div 
                key={hour} 
                onClick={(e) => {
                  if (!isDragging) {
                    handleTimeSlotClick(currentDate, hour);
                  }
                }}
                onMouseDown={(e) => handleMouseDown(currentDate, hour, e)}
                onMouseEnter={(e) => {
                  handleMouseEnter(currentDate, hour);
                  if (!isDragging) {
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging) {
                    e.currentTarget.style.backgroundColor = isWorkingHour ? '#fafbfc' : '#ffffff';
                  }
                }}
                style={{
                  height: `${slotHeight}px`,
                  borderBottom: hour % 2 === 0 ? '1px solid #e0e4e7' : '1px solid #f0f1f2',
                  position: 'relative',
                  background: isInDragRange 
                    ? 'rgba(88, 132, 253, 0.15)' 
                    : isWorkingHour ? '#fafbfc' : '#ffffff',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  userSelect: 'none'
                }}
              />
            );
          })}

          {/* Events overlay - positioned absolutely to span multiple hours */}
          {dayEvents.map((event, index) => (
            <div
              key={event.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
                setShowEventModal(true);
                setIsEditingEvent(false);
              }}
              style={{
                position: 'absolute',
                left: `${index * 6 + 16}px`,
                right: '16px',
                top: `${event.topPosition}px`,
                height: `${event.height}px`,
                background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                color: '#ffffff',
                borderRadius: '10px',
                padding: event.height > 40 ? '10px 14px' : '6px 10px',
                fontSize: event.height > 50 ? '0.85rem' : '0.8rem',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
                zIndex: 10 + index,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.18), 0 4px 8px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)';
              }}
            >
              <div style={{ 
                fontWeight: '700', 
                marginBottom: event.height > 35 ? '6px' : '3px',
                lineHeight: '1.3',
                fontSize: event.height > 50 ? '0.9rem' : '0.85rem',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
              }}>
                {event.title}
              </div>
              {event.height > 40 && (
                <div style={{ 
                  opacity: 0.95, 
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '3px',
                  fontWeight: '500'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.7)'
                  }}></span>
                  {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                </div>
              )}
              {event.height > 65 && event.location && (
                <div style={{ 
                  opacity: 0.9, 
                  fontSize: '0.68rem', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '3px',
                  fontWeight: '500'
                }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.6)'
                  }}></span>
                  {event.location}
                </div>
              )}
              {event.height > 80 && event.description && (
                <div style={{ 
                  opacity: 0.85, 
                  fontSize: '0.68rem',
                  marginTop: '6px',
                  lineHeight: '1.4',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  fontWeight: '400'
                }}>
                  {event.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = getViewStartDate();
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      weekDays.push(day);
    }

    const timeSlots = getTimeSlots();
    
    // Calculate height based on visible time slots, not full 24 hours
    const slotHeight = 40;
    const headerHeight = 60;
    const totalHeight = timeSlots.length * slotHeight + headerHeight;

    return (
      <div style={{ display: 'flex', height: `${totalHeight}px`, overflow: 'auto', minHeight: '500px' }}>
        {/* Time column */}
        <div style={{ width: '80px', borderRight: '1px solid #e0e4e7', background: '#fafbfc' }}>
          <div style={{ height: `${headerHeight}px`, borderBottom: '1px solid #e0e4e7' }}></div>
          {timeSlots.map(hour => (
            <div key={hour} style={{
              height: `${slotHeight}px`,
              borderBottom: '1px solid #f0f1f2',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '2px',
              fontSize: '0.75rem',
              color: '#64748b',
              fontWeight: '500'
            }}>
              {formatHourSlot(hour)}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div style={{ flex: 1, display: 'flex' }}>
          {weekDays.map(day => (
            <div key={day.toISOString()} style={{ flex: 1, borderRight: '1px solid #e0e4e7' }}>
              {/* Day header */}
              <div style={{
                height: `${headerHeight}px`,
                borderBottom: '1px solid #e0e4e7',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: day.toDateString() === new Date().toDateString() 
                  ? 'linear-gradient(135deg, #5884FD, #6c91ff)' 
                  : 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                color: day.toDateString() === new Date().toDateString() ? '#ffffff' : '#475569',
                boxShadow: day.toDateString() === new Date().toDateString() 
                  ? '0 2px 4px rgba(88, 132, 253, 0.1)' 
                  : '0 1px 2px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '2px' }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                  {day.getDate()}
                </div>
              </div>

              {/* Time slots for this day */}
              <div style={{ position: 'relative', background: '#ffffff' }}>
                {timeSlots.map((hour, index) => {
                  const isInDragRange = isSlotInDragRange(day, hour);
                  const isWorkingHour = hour >= 9 && hour <= 17;
                  
                  return (
                    <div 
                      key={hour} 
                      onClick={(e) => {
                        if (!isDragging) {
                          handleTimeSlotClick(day, hour);
                        }
                      }}
                      onMouseDown={(e) => handleMouseDown(day, hour, e)}
                      onMouseEnter={(e) => {
                        handleMouseEnter(day, hour);
                        if (!isDragging) {
                          e.currentTarget.style.backgroundColor = '#f0f8ff';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDragging) {
                          e.currentTarget.style.backgroundColor = isWorkingHour ? '#fafbfc' : '#ffffff';
                        }
                      }}
                      style={{
                        height: `${slotHeight}px`,
                        borderBottom: hour % 2 === 0 ? '1px solid #e0e4e7' : '1px solid #f0f1f2',
                        background: isInDragRange 
                          ? 'rgba(88, 132, 253, 0.15)' 
                          : isWorkingHour ? '#fafbfc' : '#ffffff',
                        cursor: isDragging ? 'grabbing' : 'pointer',
                        transition: 'background-color 0.2s ease',
                        userSelect: 'none'
                      }}
                    />
                  );
                })}

                {/* Week Day Events - positioned absolutely with corrected positioning */}
                {getEventsForDayWeekView(day).map((event, index) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowEventModal(true);
                      setIsEditingEvent(false);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${index * 4 + 6}px`,
                      right: '6px',
                      top: `${event.topPosition}px`,
                      height: `${Math.max(24, event.height)}px`,
                      background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: event.height > 32 ? '4px 8px' : '2px 6px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)',
                      zIndex: 10 + index,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      transition: 'all 0.2s ease',
                      fontWeight: '600',
                      backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px) scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <div style={{ 
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: event.height > 32 ? '0.75rem' : '0.7rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}>
                      {event.title}
                    </div>
                    {event.height > 35 && (
                      <div style={{ 
                        fontSize: '0.6rem', 
                        opacity: 0.9,
                        marginTop: '2px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: '3px',
                          height: '3px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.7)'
                        }}></span>
                        {formatTime(event.start_datetime)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const startDate = getViewStartDate();
    const monthDays = [];
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      monthDays.push(day);
    }

    return (
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        {/* Week day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e8e8e8' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              padding: '1rem',
              textAlign: 'center',
              fontWeight: '500',
              color: '#666666',
              background: '#fafafa',
              borderRight: '1px solid #e8e8e8'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }}>
          {monthDays.map(day => {
            const dayEvents = events.filter(event => {
              const eventDate = new Date(event.start_datetime);
              return eventDate.toDateString() === day.toDateString();
            });

            const isToday = day.toDateString() === new Date().toDateString();
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div key={day.toISOString()} style={{
                border: '1px solid #e8e8e8',
                padding: '0.5rem',
                background: isCurrentMonth ? '#ffffff' : '#fafafa',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontSize: '0.9rem',
                  fontWeight: isToday ? '600' : '400',
                  color: isToday ? '#5884FD' : isCurrentMonth ? '#1a1a1a' : '#999999',
                  marginBottom: '0.25rem'
                }}>
                  {day.getDate()}
                </div>
                
                <div style={{ fontSize: '0.7rem' }}>
                  {dayEvents.slice(0, 3).map((event, index) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                        setShowEventModal(true);
                        setIsEditingEvent(false);
                      }}
                      style={{
                        background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                        color: '#ffffff',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        marginBottom: '2px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        fontSize: '0.65rem',
                        fontWeight: '500',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ 
                      color: '#666666', 
                      fontSize: '0.6rem', 
                      fontWeight: '500',
                      marginTop: '2px',
                      padding: '2px 4px',
                      background: 'rgba(107, 114, 128, 0.1)',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding-top: 2rem;
            z-index: 1000;
          }
          
          .modal-content {
            background: #ffffff;
            border-radius: 12px;
            padding: 0;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow: auto;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          }
          
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .modal-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          
          .modal-close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0.25rem;
            line-height: 1;
          }
          
          .modal-close-btn:hover {
            color: #374151;
          }
          
          .modal-form {
            padding: 2rem;
          }
          
          .form-group {
            margin-bottom: 1.5rem;
          }
          
          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          
          .form-input {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 1rem;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.2s ease;
            outline: none;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            box-sizing: border-box;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #000000;
          }
          
          .form-textarea {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 1rem;
            min-height: 100px;
            resize: vertical;
            transition: all 0.2s ease;
            box-sizing: border-box;
            background: rgba(255, 255, 255, 0.9);
            outline: none;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
          }
          
          .form-textarea:focus {
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          
          .form-select {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.9);
            cursor: pointer;
            transition: all 0.2s ease;
            box-sizing: border-box;
            outline: none;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
          }
          
          .form-select:focus {
            border-color: #000000;
            box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
          }
          
          .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 1rem;
          }
          
          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }
          
          .btn-primary {
            flex: 1;
            padding: 0.875rem 1.5rem;
            background: linear-gradient(135deg, #5884FD, #4F75FC);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(88, 132, 253, 0.3);
            font-family: 'Mabry Pro', 'Inter', sans-serif;
          }
          
          .btn-primary:hover {
            background: linear-gradient(135deg, #4F75FC, #4366FC);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(88, 132, 253, 0.4);
          }
          
          .btn-secondary {
            flex: 1;
            padding: 0.875rem 1.5rem;
            background: rgba(255, 255, 255, 0.9);
            color: #666666;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
          }
          
          .btn-secondary:hover {
            background: #ffffff;
            border-color: #000000;
            color: #000000;
            transform: translateY(-1px);
          }
        `
      }} />
      
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
                Personal Calendar
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage your schedule, tasks, and time blocks
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: '#5884FD',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
              }}
            >
              <PlusIcon style={{ width: '16px', height: '16px' }} />
              New Event
            </button>
          </div>

          {error && (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #F87239', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#F87239',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)'
            }}>
              {error}
              {error === 'Failed to load calendar data' && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>
                  Please run the database setup SQL scripts in your Supabase dashboard to create the necessary tables.
                </div>
              )}
            </div>
          )}



          {/* Calendar Controls */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              {/* View Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['month', 'week', 'day'] as ViewType[]).map(view => (
                    <button
                      key={view}
                      onClick={() => setCurrentView(view)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: currentView === view ? '#5884FD' : '#ffffff',
                        color: currentView === view ? '#ffffff' : '#666666',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textTransform: 'capitalize'
                      }}
                    >
                      {view}
                    </button>
                  ))}
                </div>

                <button
                  onClick={goToToday}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#ffffff',
                    color: '#5884FD',
                    border: '1px solid #5884FD',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Today
                </button>
              </div>

              {/* Date Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  onClick={() => navigateDate('prev')}
                  style={{
                    padding: '0.5rem',
                    background: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#666666',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronLeftIcon style={{ width: '16px', height: '16px' }} />
                </button>

                <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#1a1a1a', minWidth: '200px', textAlign: 'center' }}>
                  {currentView === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  {currentView === 'week' && `${getViewStartDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${getViewEndDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  {currentView === 'day' && formatDate(currentDate)}
                </div>

                <button
                  onClick={() => navigateDate('next')}
                  style={{
                    padding: '0.5rem',
                    background: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#666666',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
            position: 'relative'
          }}>
            {currentView === 'month' && renderMonthView()}
            {currentView === 'week' && renderWeekView()}
            {currentView === 'day' && renderDayView()}
            
            {/* Drag Preview Tooltip */}
            {isDragging && dragPreview && (
              <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#ffffff',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                zIndex: 1000,
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '0.25rem', opacity: 0.8 }}>Creating Event</div>
                                     <div>
                     {formatTime(dragPreview.startTime.toISOString())} - {formatTime(dragPreview.endTime.toISOString())}
                   </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    {Math.round((dragPreview.endTime.getTime() - dragPreview.startTime.getTime()) / (1000 * 60 * 60))} hour(s)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Meeting Modal - Timetable Style */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Event</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); createEvent(); }} className="modal-form">
              <div className="form-group">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Enter event title..."
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Enter event description..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project *</label>
                <select
                  required
                  className="form-select"
                  value={newEvent.project_id || 0}
                  onChange={(e) => setNewEvent({ ...newEvent, project_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a project</option>
                  {projects.length === 0 ? (
                    <option disabled>Loading projects...</option>
                  ) : (
                    projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))
                  )}
                </select>
                {projects.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>
                    Debug: {projects.length} projects loaded
                  </div>
                )}
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={newEvent.start_datetime.split('T')[0]}
                    onChange={(e) => {
                      const date = e.target.value;
                      const startTime = newEvent.start_datetime.split('T')[1] || '09:00';
                      const endTime = newEvent.end_datetime.split('T')[1] || '10:00';
                      setNewEvent({ 
                        ...newEvent, 
                        start_datetime: `${date}T${startTime}`,
                        end_datetime: `${date}T${endTime}`
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={newEvent.start_datetime.split('T')[1] || ''}
                    onChange={(e) => {
                      const date = newEvent.start_datetime.split('T')[0] || new Date().toISOString().split('T')[0];
                      const time = e.target.value;
                      const startDateTime = `${date}T${time}`;
                      const duration = newEvent.end_datetime ? 
                        Math.round((new Date(newEvent.end_datetime).getTime() - new Date(newEvent.start_datetime).getTime()) / (1000 * 60)) : 60;
                      const endDateTime = new Date(new Date(startDateTime).getTime() + duration * 60 * 1000).toISOString().slice(0, 16);
                      setNewEvent({ 
                        ...newEvent, 
                        start_datetime: startDateTime,
                        end_datetime: endDateTime
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    className="form-input"
                    placeholder="Minutes"
                    value={newEvent.start_datetime && newEvent.end_datetime ? 
                      Math.round((new Date(newEvent.end_datetime).getTime() - new Date(newEvent.start_datetime).getTime()) / (1000 * 60)) : 60}
                    onChange={(e) => {
                      if (newEvent.start_datetime) {
                        const duration = parseInt(e.target.value) || 60;
                        const startTime = new Date(newEvent.start_datetime);
                        const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
                        setNewEvent({ 
                          ...newEvent, 
                          end_datetime: endTime.toISOString().slice(0, 16)
                        });
                      }
                    }}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Create Event
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '5vh',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out',
            border: '1px solid #e8e8e8'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                margin: 0, 
                color: '#1a1a1a'
              }}>
                {isEditingEvent ? 'Edit Meeting' : 'Meeting Details'}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!isEditingEvent && (
                  <>
                    <button
                      onClick={() => setIsEditingEvent(true)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        color: '#374151',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#5884FD';
                        e.currentTarget.style.color = '#5884FD';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.color = '#374151';
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={deleteEvent}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        color: '#dc2626',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.borderColor = '#dc2626';
                        e.currentTarget.style.color = '#991b1b';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fef2f2';
                        e.currentTarget.style.borderColor = '#fecaca';
                        e.currentTarget.style.color = '#dc2626';
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                    setIsEditingEvent(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666666',
                    padding: '0.5rem',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {!isEditingEvent ? (
              // View Mode
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div style={{
                  background: '#fafafa',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  border: '1px solid #e8e8e8'
                }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0', color: '#1a1a1a' }}>
                    {selectedEvent.title}
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>Start Time</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>{formatTime(selectedEvent.start_datetime)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>End Time</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>{formatTime(selectedEvent.end_datetime)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>Duration</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                        {Math.round((new Date(selectedEvent.end_datetime).getTime() - new Date(selectedEvent.start_datetime).getTime()) / (1000 * 60))} min
                      </div>
                    </div>
                  </div>

                  {selectedEvent.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500', textTransform: 'uppercase' }}>Description</div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5', 
                        color: '#374151',
                        background: '#ffffff',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8'
                      }}>
                        {selectedEvent.description}
                      </div>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>Location</div>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ 
                          background: '#f3f4f6',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          {selectedEvent.location}
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>Type</div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.375rem 0.75rem', 
                        background: selectedEvent.color || '#5884FD',
                        color: '#ffffff',
                        borderRadius: '6px',
                        display: 'inline-block',
                        textTransform: 'capitalize',
                        fontWeight: '500'
                      }}>
                        {selectedEvent.event_type}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', fontWeight: '500', textTransform: 'uppercase' }}>Date</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                        {new Date(selectedEvent.start_datetime).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Edit Mode - Similar to timetable style
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    value={selectedEvent.title}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    placeholder="Enter meeting title"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5884FD';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 132, 253, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={selectedEvent.description}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, description: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      minHeight: '70px',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      transition: 'all 0.2s ease',
                      outline: 'none'
                    }}
                    placeholder="Meeting description"
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5884FD';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(88, 132, 253, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      Date *
                    </label>
                    <input
                      type="date"
                      value={selectedEvent.start_datetime.slice(0, 10)}
                      onChange={(e) => {
                        const date = e.target.value;
                        const startTime = selectedEvent.start_datetime.slice(11, 16);
                        const endTime = selectedEvent.end_datetime.slice(11, 16);
                        setSelectedEvent({ 
                          ...selectedEvent, 
                          start_datetime: `${date}T${startTime}:00.000Z`,
                          end_datetime: `${date}T${endTime}:00.000Z`
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      step="900"
                      value={selectedEvent.end_datetime.slice(0, 16)}
                      onChange={(e) => setSelectedEvent({ ...selectedEvent, end_datetime: e.target.value + ':00.000Z' })}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        boxSizing: 'border-box',
                        background: 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => setIsEditingEvent(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#666666',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      // Save changes logic here
                      setIsEditingEvent(false);
                      setShowEventModal(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#5884FD',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `
      }} />
    </>
  );
} 