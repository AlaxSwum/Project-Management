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

type ViewType = 'month' | 'week' | 'day' | '5min';

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
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [moreModalData, setMoreModalData] = useState<{ date: Date; events: CalendarEvent[] }>({ date: new Date(), events: [] });
  
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

  // Location options for the dropdown
  const locationOptions = [
    'Conference Room A',
    'Conference Room B',
    'Meeting Room 1',
    'Meeting Room 2',
    'Main Office',
    'Client Office',
    'Online/Virtual',
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
      
      // Fetch ALL events where user is assigned (personal events + events from different projects)
      const { data, error } = await supabase
        .from('projects_meeting')
        .select('*')
        .or(`created_by_id.eq.${parseInt(user?.id?.toString() || '0')},attendee_ids.cs.{${parseInt(user?.id?.toString() || '0')}}`)
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

  const handleShowMoreEvents = (date: Date, events: CalendarEvent[]) => {
    setMoreModalData({ date, events });
    setShowMoreModal(true);
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

      // Save current scroll position before refresh
      const scrollContainer = document.querySelector('.calendar-5min-container');
      const scrollPosition = scrollContainer ? scrollContainer.scrollTop : 0;

      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Convert datetime-local format to date and time
      const startDate = new Date(newEvent.start_datetime);
      const endDate = new Date(newEvent.end_datetime);
      
      // FIXED: Use local date/time to avoid timezone conversion issues
      const dateStr = newEvent.start_datetime.split('T')[0]; // Get date directly from input (YYYY-MM-DD)
      const timeStr = newEvent.start_datetime.split('T')[1]; // Get time directly from input (HH:MM)
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
      
      // Create a PERSONAL event (associated with project but marked as personal)
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
          event_type: 'personal', // Mark as personal - this is the key for privacy
          all_day: newEvent.all_day,
          project_id: newEvent.project_id, // Associate with selected project
          attendee_ids: [parseInt(user?.id?.toString() || '0')],
          created_by_id: parseInt(user?.id?.toString() || '0')
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      // Refresh calendar data
      await fetchCalendarData();
      
      // Restore scroll position after refresh
      setTimeout(() => {
        const scrollContainer = document.querySelector('.calendar-5min-container');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollPosition;
        }
      }, 100);
      
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
      
      // Exclude micro-tasks from Day/Week/Month views
      const isMicroTask = event.description?.includes('[MICRO-TASK]');
      
      return (eventStart < slotEnd && eventEnd > slotStart) && !isMicroTask;
    });
  };

  // Helper function to detect overlapping events
  const getOverlappingEvents = (dayEvents: any[], targetEvent: any) => {
    const targetStart = new Date(targetEvent.start_datetime).getTime();
    const targetEnd = new Date(targetEvent.end_datetime).getTime();
    
    return dayEvents.filter(event => {
      if (event.id === targetEvent.id) return false;
      
      const eventStart = new Date(event.start_datetime).getTime();
      const eventEnd = new Date(event.end_datetime).getTime();
      
      // Check if events overlap
      return (eventStart < targetEnd && eventEnd > targetStart);
    });
  };

  // Get all events for a specific day with proper positioning for week view
  const getEventsForDayWeekView = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Exclude micro-tasks from Day/Week/Month views
      const isMicroTask = event.description?.includes('[MICRO-TASK]');
      
      return (eventStart < dayEnd && eventEnd > dayStart) && !isMicroTask;
    });
    
    return dayEvents.map((event, index) => {
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
      
      // Calculate overlap positioning
      const overlappingEvents = getOverlappingEvents(dayEvents, event);
      const totalOverlapping = overlappingEvents.length + 1; // +1 for current event
      const currentPosition = overlappingEvents.filter(e => 
        new Date(e.start_datetime).getTime() <= new Date(event.start_datetime).getTime()
      ).length;
      
      const eventWidth = totalOverlapping > 1 ? `${95 / totalOverlapping}%` : 'calc(100% - 16px)';
      const eventLeft = totalOverlapping > 1 ? `${(currentPosition * 95) / totalOverlapping + 2}%` : '8px';
      
      return {
        ...event,
        topPosition,
        height,
        startHour,
        endHour,
        duration: durationInMinutes,
        eventWidth,
        eventLeft,
        totalOverlapping
      };
    });
  };

  // Get all events for a specific day with proper positioning
  const getEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayEvents = events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      // Exclude micro-tasks from Day/Week/Month views
      const isMicroTask = event.description?.includes('[MICRO-TASK]');
      
      return (eventStart < dayEnd && eventEnd > dayStart) && !isMicroTask;
    });
    
    return dayEvents.map((event, index) => {
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
      
      // Calculate overlap positioning
      const overlappingEvents = getOverlappingEvents(dayEvents, event);
      const totalOverlapping = overlappingEvents.length + 1; // +1 for current event
      const currentPosition = overlappingEvents.filter(e => 
        new Date(e.start_datetime).getTime() <= new Date(event.start_datetime).getTime()
      ).length;
      
      const eventWidth = totalOverlapping > 1 ? `${90 / totalOverlapping}%` : 'calc(100% - 32px)';
      const eventLeft = totalOverlapping > 1 ? `${(currentPosition * 90) / totalOverlapping + 5}%` : '16px';
      
      return {
        ...event,
        topPosition,
        height,
        startHour,
        endHour,
        duration: durationInMinutes,
        eventWidth,
        eventLeft,
        totalOverlapping
      };
    });
  };

  // Special function for 5-Min view that includes ALL events (main tasks + micro-tasks)
  const getAllEventsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventStart = new Date(event.start_datetime);
      const eventEnd = new Date(event.end_datetime);
      
      return (eventStart < dayEnd && eventEnd > dayStart);
    });
  };

  const render5MinView = () => {
    const allDayEvents = getAllEventsForDay(currentDate);
    
    // Separate main tasks from micro-tasks
    const mainTasks = allDayEvents.filter(event => 
      !event.description?.includes('[MICRO-TASK]')
    );
    
    const microTasks = allDayEvents.filter(event => 
      event.description?.includes('[MICRO-TASK]')
    );
    
    // Debug logging
    console.log('5-Min View Debug:', {
      currentDate: currentDate.toISOString(),
      allEvents: events.length,
      allDayEvents: allDayEvents.length,
      mainTasks: mainTasks.length,
      microTasks: microTasks.length
    });

    // Generate 5-minute time slots (show every 15 minutes for cleaner look, but maintain 5-min precision)
    const fiveMinSlots: { hour: number; minute: number; isMainSlot: boolean }[] = [];
    for (let hour = settings.start_hour; hour <= settings.end_hour; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        fiveMinSlots.push({ 
          hour, 
          minute, 
          isMainSlot: minute === 0 || minute === 15 || minute === 30 || minute === 45 
        });
      }
    }

    const slotHeight = 30; // Much larger for better visibility
    const headerHeight = 100;
    const totalHeight = fiveMinSlots.length * slotHeight + headerHeight;

    return (
      <div className="calendar-5min-container" style={{ 
        display: 'flex', 
        height: `${Math.min(totalHeight, 800)}px`, 
        overflow: 'auto', 
        minHeight: '600px',
        maxHeight: '800px',
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        background: '#ffffff',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}>
        {/* Time column */}
        <div style={{ 
          width: '120px', 
          borderRight: '2px solid #e0e4e7', 
          background: 'linear-gradient(180deg, #fafbfc 0%, #f1f5f9 100%)',
          borderTopLeftRadius: '12px',
          borderBottomLeftRadius: '12px'
        }}>
          <div style={{ 
            height: `${headerHeight}px`, 
            borderBottom: '2px solid #e0e4e7', 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            color: '#ffffff',
            borderTopLeftRadius: '12px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '2px' }}>TIME</div>
            <div style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: '500' }}>5-Min Precision</div>
          </div>
          {fiveMinSlots.map((slot, index) => {
            if (!slot.isMainSlot) return null; // Only show 15-minute intervals in sidebar for cleaner look
            
            return (
              <div key={`${slot.hour}-${slot.minute}`} style={{
                height: `${slotHeight * 3}px`, // 3 slots height (15 minutes)
                borderBottom: slot.minute === 0 ? '2px solid #d1d5db' : '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: slot.minute === 0 ? '0.8rem' : '0.7rem',
                color: slot.minute === 0 ? '#1e293b' : '#64748b',
                fontWeight: slot.minute === 0 ? '700' : '600',
                background: slot.minute === 0 ? 'rgba(88, 132, 253, 0.05)' : 'transparent',
                position: 'relative'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div>{slot.minute === 0 ? formatHourSlot(slot.hour) : `:${slot.minute.toString().padStart(2, '0')}`}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Tasks Column */}
        <div style={{ 
          flex: 1, 
          borderRight: '2px solid #e0e4e7', 
          background: '#ffffff',
          position: 'relative'
        }}>
          {/* Header */}
          <div style={{
            height: `${headerHeight}px`,
            borderBottom: '2px solid #e0e4e7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            fontWeight: '600'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
              MAIN TASKS
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: '500', textAlign: 'center' }}>
              Events from Week/Day/Month
            </div>
          </div>

          {/* Main task time slots */}
          {fiveMinSlots.map((slot, index) => {
            const isWorkingHour = slot.hour >= 9 && slot.hour <= 17;
            const isQuarterHour = slot.minute % 15 === 0;
            
            return (
              <div 
                key={`main-${slot.hour}-${slot.minute}`} 
                style={{
                  height: `${slotHeight}px`,
                  borderBottom: slot.minute === 0 ? '2px solid #e2e8f0' : isQuarterHour ? '1px solid #e5e7eb' : '1px solid #f1f5f9',
                  borderRight: isQuarterHour ? '1px solid #e5e7eb' : 'none',
                  position: 'relative',
                  background: isWorkingHour ? 'rgba(5, 150, 105, 0.02)' : '#ffffff',
                  transition: 'all 0.2s ease',
                  userSelect: 'none'
                }}
              />
            );
          })}

          {/* Main task events overlay */}
          {mainTasks.map((event, index) => {
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
            const startHour = eventStart.getHours();
            const startMinutes = eventStart.getMinutes();
            
            // Calculate position based on 5-minute slots
            const totalMinutesFromStart = (startHour - settings.start_hour) * 60 + startMinutes;
            const slotIndex = Math.floor(totalMinutesFromStart / 5);
            
            // Calculate duration in 5-minute slots
            const durationInMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
            const durationInSlots = Math.ceil(durationInMinutes / 5);
            
            const topPosition = headerHeight + (slotIndex * slotHeight);
            const eventHeight = Math.max(slotHeight, durationInSlots * slotHeight);
            
            return (
              <div
                key={`main-event-${event.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventModal(true);
                  setIsEditingEvent(false);
                }}
                style={{
                  position: 'absolute',
                  left: '8px',
                  width: 'calc(100% - 16px)',
                  top: `${topPosition}px`,
                  height: `${eventHeight}px`,
                  background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: eventHeight > 50 ? '10px 12px' : eventHeight > 30 ? '6px 10px' : '4px 8px',
                  fontSize: eventHeight > 60 ? '0.85rem' : eventHeight > 40 ? '0.75rem' : '0.7rem',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: '0 3px 10px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)',
                  zIndex: 10 + index,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: eventHeight > 40 ? 'flex-start' : 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: '600',
                  minHeight: '20px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)';
                  
                  // Show tooltip with duration
                  const durationMinutes = (new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / (1000 * 60);
                  const hours = Math.floor(durationMinutes / 60);
                  const minutes = durationMinutes % 60;
                  const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                  
                  e.currentTarget.setAttribute('title', `${event.title}\n${formatTime(event.start_datetime)} - ${formatTime(event.end_datetime)}\nDuration: ${durationText}`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.removeAttribute('title');
                }}
              >
                {/* Task name - always prioritized */}
                <div style={{ 
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: eventHeight > 40 ? 'normal' : 'nowrap',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                  fontWeight: '700',
                  fontSize: eventHeight > 60 ? '0.85rem' : eventHeight > 40 ? '0.75rem' : eventHeight > 25 ? '0.7rem' : '0.65rem',
                  marginBottom: eventHeight > 35 ? '4px' : eventHeight > 25 ? '2px' : '0px',
                  flex: 1
                }}>
                  {event.title}
                </div>
                
                {/* Time display - only when there's enough space */}
                {eventHeight > 35 && (
                  <div style={{ 
                    fontSize: eventHeight > 50 ? '0.65rem' : '0.6rem', 
                    opacity: 0.9,
                    fontWeight: '400',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    marginTop: 'auto'
                  }}>
                    <span style={{ 
                      display: 'inline-block',
                      width: '2px',
                      height: '2px',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.7)'
                    }}></span>
                    {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                  </div>
                )}
                
                {/* For small blocks (20-35px), show just start time */}
                {eventHeight > 20 && eventHeight <= 35 && (
                  <div style={{ 
                    fontSize: '0.55rem', 
                    opacity: 0.85,
                    fontWeight: '500',
                    marginTop: '1px'
                  }}>
                    {formatTime(event.start_datetime)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Micro-Tasks Column */}
        <div style={{ 
          flex: 1, 
          background: '#ffffff',
          position: 'relative',
          borderTopRightRadius: '12px',
          borderBottomRightRadius: '12px'
        }}>
          {/* Header */}
          <div style={{
            height: `${headerHeight}px`,
            borderBottom: '2px solid #e0e4e7',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
            color: '#ffffff',
            fontWeight: '600',
            borderTopRightRadius: '12px'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
              MICRO-TASKS
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9, fontWeight: '500', textAlign: 'center' }}>
              5-Minute Focus Blocks
            </div>
          </div>

          {/* Micro-task time slots */}
          {fiveMinSlots.map((slot, index) => {
            const isWorkingHour = slot.hour >= 9 && slot.hour <= 17;
            const isQuarterHour = slot.minute % 15 === 0;
            
            return (
              <div 
                key={`micro-${slot.hour}-${slot.minute}`} 
                onClick={(e) => {
                  const startTime = new Date(currentDate);
                  startTime.setHours(slot.hour, slot.minute, 0, 0);
                  const endTime = new Date(startTime);
                  endTime.setMinutes(startTime.getMinutes() + 5);
                  
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
                    title: '',
                    description: '[MICRO-TASK] ', // Add prefix to identify micro-tasks
                    start_datetime: formatForInput(startTime),
                    end_datetime: formatForInput(endTime),
                    color: '#8b5cf6' // Purple for micro-tasks
                  });
                  setShowCreateModal(true);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3e8ff';
                  e.currentTarget.style.borderLeft = '4px solid #8b5cf6';
                  e.currentTarget.style.transform = 'scale(1.01)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = isWorkingHour ? 'rgba(124, 58, 237, 0.02)' : '#ffffff';
                  e.currentTarget.style.borderLeft = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                style={{
                  height: `${slotHeight}px`,
                  borderBottom: slot.minute === 0 ? '2px solid #e2e8f0' : isQuarterHour ? '1px solid #e5e7eb' : '1px solid #f1f5f9',
                  position: 'relative',
                  background: isWorkingHour ? 'rgba(124, 58, 237, 0.02)' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: '12px'
                }}
              >
                {/* Show time labels for quarter hours */}
                {isQuarterHour && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#94a3b8',
                    fontWeight: '500',
                    opacity: 0.7
                  }}>
                    {slot.minute === 0 ? formatHourSlot(slot.hour) : `:${slot.minute.toString().padStart(2, '0')}`}
                  </div>
                )}
                
                {/* Plus icon for micro-task creation */}
                {!isQuarterHour && (
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    fontSize: '0.7rem',
                    color: '#8b5cf6',
                    opacity: 0.4,
                    fontWeight: '700'
                  }}>
                    +
                  </div>
                                  )}
                </div>
              );
            })}

          {/* Micro-task events overlay */}
          {microTasks.map((event, index) => {
            const eventStart = new Date(event.start_datetime);
            const eventEnd = new Date(event.end_datetime);
            const startHour = eventStart.getHours();
            const startMinutes = eventStart.getMinutes();
            
            // Calculate position based on 5-minute slots
            const totalMinutesFromStart = (startHour - settings.start_hour) * 60 + startMinutes;
            const slotIndex = Math.floor(totalMinutesFromStart / 5);
            
            // Calculate duration in 5-minute slots
            const durationInMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
            const durationInSlots = Math.ceil(durationInMinutes / 5);
            
            const topPosition = headerHeight + (slotIndex * slotHeight);
            const eventHeight = Math.max(slotHeight, durationInSlots * slotHeight);
            
            return (
              <div
                key={`micro-event-${event.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setShowEventModal(true);
                  setIsEditingEvent(false);
                }}
                style={{
                  position: 'absolute',
                  left: '8px',
                  width: 'calc(100% - 16px)',
                  top: `${topPosition}px`,
                  height: `${eventHeight}px`,
                  background: `linear-gradient(135deg, #8b5cf6, #7c3aed)`,
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: eventHeight > 30 ? '6px 10px' : '4px 8px',
                  fontSize: eventHeight > 40 ? '0.75rem' : '0.7rem',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3), 0 1px 4px rgba(139, 92, 246, 0.2)',
                  zIndex: 10 + index,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontWeight: '600',
                  minHeight: '16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4), 0 2px 6px rgba(139, 92, 246, 0.3)';
                  
                  // Show tooltip with duration for micro-tasks
                  const durationMinutes = (new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / (1000 * 60);
                  const taskName = event.title.replace('[MICRO-TASK] ', '');
                  const durationText = durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m` : `${durationMinutes}m`;
                  
                  e.currentTarget.setAttribute('title', `${taskName}\n${formatTime(event.start_datetime)} - ${formatTime(event.end_datetime)}\nDuration: ${durationText}`);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3), 0 1px 4px rgba(139, 92, 246, 0.2)';
                  e.currentTarget.removeAttribute('title');
                }}
              >
                <div style={{ 
                  lineHeight: '1.2',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: eventHeight > 25 ? 'normal' : 'nowrap',
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                  fontWeight: '700',
                  fontSize: eventHeight > 30 ? '0.75rem' : '0.7rem'
                }}>
                  {event.title.replace('[MICRO-TASK] ', '')}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
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
                left: event.eventLeft,
                width: event.eventWidth,
                top: `${event.topPosition}px`,
                height: `${event.height}px`,
                background: `linear-gradient(135deg, ${event.color}f0, ${event.color}dd)`,
                color: '#ffffff',
                borderRadius: '12px',
                padding: event.height > 40 ? '10px 14px' : '8px 12px',
                fontSize: event.height > 50 ? '0.85rem' : '0.8rem',
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                zIndex: 10 + index,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                
                // Show tooltip with duration for Day view
                const durationMinutes = (new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / (1000 * 60);
                const hours = Math.floor(durationMinutes / 60);
                const minutes = durationMinutes % 60;
                const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                
                e.currentTarget.setAttribute('title', `${event.title}\n${formatTime(event.start_datetime)} - ${formatTime(event.end_datetime)}\nDuration: ${durationText}`);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.removeAttribute('title');
              }}
            >
              {/* Task name - ALWAYS prioritized, no time display */}
              <div style={{ 
                fontWeight: '700', 
                lineHeight: '1.3',
                fontSize: event.height > 60 ? '0.9rem' : event.height > 40 ? '0.85rem' : event.height > 25 ? '0.8rem' : '0.75rem',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: event.height > 60 ? 'normal' : 'nowrap',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                padding: '4px'
              }}>
                {event.title}
              </div>
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
                      left: event.eventLeft,
                      width: event.eventWidth,
                      top: `${event.topPosition}px`,
                      height: `${Math.max(24, event.height)}px`,
                      background: `linear-gradient(135deg, ${event.color}f0, ${event.color}dd)`,
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: event.height > 32 ? '8px 12px' : '4px 8px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
                      zIndex: 10 + index,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontWeight: '600',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                      
                      // Show tooltip with duration for Week view
                      const durationMinutes = (new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / (1000 * 60);
                      const hours = Math.floor(durationMinutes / 60);
                      const minutes = durationMinutes % 60;
                      const durationText = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                      
                      e.currentTarget.setAttribute('title', `${event.title}\n${formatTime(event.start_datetime)} - ${formatTime(event.end_datetime)}\nDuration: ${durationText}`);
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.removeAttribute('title');
                    }}
                  >
                    {/* Task name - ALWAYS prioritized, no time display */}
                    <div style={{ 
                      lineHeight: '1.3',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: event.height > 50 ? 'normal' : 'nowrap',
                      fontSize: event.height > 50 ? '0.8rem' : event.height > 32 ? '0.75rem' : '0.7rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      padding: '2px'
                    }}>
                      {event.title}
                    </div>
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
              const isDateMatch = eventDate.toDateString() === day.toDateString();
              
              // Exclude micro-tasks from Month view
              const isMicroTask = event.description?.includes('[MICRO-TASK]');
              
              return isDateMatch && !isMicroTask;
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
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowMoreEvents(day, dayEvents);
                      }}
                      style={{ 
                        color: '#5884FD', 
                        fontSize: '0.6rem', 
                        fontWeight: '600',
                        marginTop: '2px',
                        padding: '3px 6px',
                        background: 'linear-gradient(135deg, #f0f4ff, #e6f2ff)',
                        borderRadius: '6px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '1px solid rgba(88, 132, 253, 0.2)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #5884FD, #4F75FC)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(88, 132, 253, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #f0f4ff, #e6f2ff)';
                        e.currentTarget.style.color = '#5884FD';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
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
          
          /* Custom scrollbar for modal */
          .modal-content::-webkit-scrollbar {
            width: 8px;
          }
          
          .modal-content::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
          }
          
          .modal-content::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #5884FD, #4F75FC);
            border-radius: 4px;
          }
          
          .modal-content::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #4F75FC, #4366FC);
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
                  {(['month', 'week', 'day', '5min'] as ViewType[]).map(view => (
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
                        textTransform: view === '5min' ? 'none' : 'capitalize'
                      }}
                    >
                      {view === '5min' ? '5-Min Time-Blocking' : view}
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
                  {currentView === '5min' && formatDate(currentDate)}
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
            {currentView === '5min' && render5MinView()}
            
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

      {/* Show More Events Modal */}
      {showMoreModal && (
        <div className="modal-overlay" onClick={() => setShowMoreModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxWidth: '600px',
            background: '#F5F5ED',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div className="modal-header" style={{
              background: 'linear-gradient(135deg, #5884FD, #4F75FC)',
              color: '#ffffff',
              borderBottom: 'none'
            }}>
              <h2 className="modal-title" style={{ color: '#ffffff' }}>
                Events for {moreModalData.date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                <span style={{ 
                  fontSize: '0.8rem', 
                  opacity: 0.8, 
                  marginLeft: '0.5rem',
                  fontWeight: '400'
                }}>
                  ({moreModalData.events.length} events)
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="modal-close-btn"
                style={{ color: '#ffffff' }}
              >
                ×
              </button>
            </div>

            <div style={{ 
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              maxHeight: 'calc(80vh - 120px)', // Account for header height
              scrollbarWidth: 'thin',
              scrollbarColor: '#5884FD #f1f5f9'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {moreModalData.events.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setShowEventModal(true);
                      setIsEditingEvent(false);
                      setShowMoreModal(false);
                    }}
                    style={{
                      background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                      color: '#ffffff',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                    }}
                  >
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: '700', 
                      marginBottom: '0.5rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}>
                      {event.title}
                    </div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      opacity: 0.9,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: event.description ? '0.5rem' : '0'
                    }}>
                      <span style={{ 
                        display: 'inline-block',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.8)'
                      }}></span>
                      {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                    </div>
                    {event.description && !event.description.includes('[MICRO-TASK]') && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        opacity: 0.85,
                        lineHeight: '1.4'
                      }}>
                        {event.description}
                      </div>
                    )}
                    {event.location && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        opacity: 0.8,
                        marginTop: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: '3px',
                          height: '3px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.7)'
                        }}></span>
                        {event.location}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Meeting Modal - Timetable Style */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
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

              <div className="form-group">
                <label className="form-label">Location</label>
                <select
                  className="form-select"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                >
                  <option value="">Select location (optional)</option>
                  {locationOptions.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Event Color</label>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(6, 1fr)', 
                  gap: '0.5rem',
                  marginTop: '0.5rem'
                }}>
                  {[
                    { name: 'Ocean Blue', value: '#5884FD' },
                    { name: 'Emerald', value: '#10B981' },
                    { name: 'Amber', value: '#F59E0B' },
                    { name: 'Rose', value: '#F43F5E' },
                    { name: 'Purple', value: '#8B5CF6' },
                    { name: 'Pink', value: '#EC4899' },
                    { name: 'Teal', value: '#14B8A6' },
                    { name: 'Orange', value: '#F97316' },
                    { name: 'Indigo', value: '#6366F1' },
                    { name: 'Green', value: '#22C55E' },
                    { name: 'Cyan', value: '#06B6D4' },
                    { name: 'Gray', value: '#6B7280' }
                  ].map((color) => (
                    <div
                      key={color.value}
                      onClick={() => setNewEvent({ ...newEvent, color: color.value })}
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: color.value,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        border: newEvent.color === color.value ? '3px solid #1a1a1a' : '2px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={color.name}
                    >
                      {newEvent.color === color.value && (
                        <div style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: color.value,
                            borderRadius: '50%'
                          }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#6B7280', 
                  marginTop: '0.5rem',
                  textAlign: 'center'
                }}>
                  Selected: {[
                    { name: 'Ocean Blue', value: '#5884FD' },
                    { name: 'Emerald', value: '#10B981' },
                    { name: 'Amber', value: '#F59E0B' },
                    { name: 'Rose', value: '#F43F5E' },
                    { name: 'Purple', value: '#8B5CF6' },
                    { name: 'Pink', value: '#EC4899' },
                    { name: 'Teal', value: '#14B8A6' },
                    { name: 'Orange', value: '#F97316' },
                    { name: 'Indigo', value: '#6366F1' },
                    { name: 'Green', value: '#22C55E' },
                    { name: 'Cyan', value: '#06B6D4' },
                    { name: 'Gray', value: '#6B7280' }
                  ].find(c => c.value === newEvent.color)?.name || 'Ocean Blue'}
                </div>
              </div>

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
                <label className="form-label">Start Time *</label>
                <input
                  type="time"
                  required
                  step="300"
                  className="form-input"
                  value={newEvent.start_datetime.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = newEvent.start_datetime.split('T')[0] || new Date().toISOString().split('T')[0];
                    const startTime = e.target.value;
                    const startDateTime = `${date}T${startTime}`;
                    
                    // Keep the same duration when changing start time
                    const currentDuration = newEvent.end_datetime ? 
                      Math.round((new Date(newEvent.end_datetime).getTime() - new Date(newEvent.start_datetime).getTime()) / (1000 * 60)) : 60;
                    const endDateTime = new Date(new Date(startDateTime).getTime() + currentDuration * 60 * 1000).toISOString().slice(0, 16);
                    
                    setNewEvent({ 
                      ...newEvent, 
                      start_datetime: startDateTime,
                      end_datetime: endDateTime
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time *</label>
                <input
                  type="time"
                  required
                  step="300"
                  className="form-input"
                  value={newEvent.end_datetime.split('T')[1] || ''}
                  onChange={(e) => {
                    const date = newEvent.start_datetime.split('T')[0] || new Date().toISOString().split('T')[0];
                    const endTime = e.target.value;
                    const endDateTime = `${date}T${endTime}`;
                    setNewEvent({ 
                      ...newEvent, 
                      end_datetime: endDateTime
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  type="number"
                  min="5"
                  max="480"
                  step="5"
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
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      step="300"
                      value={(() => {
                        const date = new Date(selectedEvent.start_datetime);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })()}
                      onChange={(e) => {
                        const newStartDateTime = new Date(e.target.value);
                        const currentDuration = new Date(selectedEvent.end_datetime).getTime() - new Date(selectedEvent.start_datetime).getTime();
                        const newEndDateTime = new Date(newStartDateTime.getTime() + currentDuration);
                        
                        setSelectedEvent({ 
                          ...selectedEvent, 
                          start_datetime: newStartDateTime.toISOString(),
                          end_datetime: newEndDateTime.toISOString()
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
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '0.875rem'
                    }}>
                      End Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      step="300"
                      value={(() => {
                        const date = new Date(selectedEvent.end_datetime);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        const hours = String(date.getHours()).padStart(2, '0');
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                      })()}
                      onChange={(e) => {
                        const newEndDateTime = new Date(e.target.value);
                        setSelectedEvent({ 
                          ...selectedEvent, 
                          end_datetime: newEndDateTime.toISOString()
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
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Location
                  </label>
                  <select
                    value={selectedEvent.location || ''}
                    onChange={(e) => setSelectedEvent({ ...selectedEvent, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.875rem 1rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      boxSizing: 'border-box',
                      background: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">Select location (optional)</option>
                    {locationOptions.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '0.875rem'
                  }}>
                    Event Color
                  </label>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(6, 1fr)', 
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    {[
                      { name: 'Ocean Blue', value: '#5884FD' },
                      { name: 'Emerald', value: '#10B981' },
                      { name: 'Amber', value: '#F59E0B' },
                      { name: 'Rose', value: '#F43F5E' },
                      { name: 'Purple', value: '#8B5CF6' },
                      { name: 'Pink', value: '#EC4899' },
                      { name: 'Teal', value: '#14B8A6' },
                      { name: 'Orange', value: '#F97316' },
                      { name: 'Indigo', value: '#6366F1' },
                      { name: 'Green', value: '#22C55E' },
                      { name: 'Cyan', value: '#06B6D4' },
                      { name: 'Gray', value: '#6B7280' }
                    ].map((color) => (
                      <div
                        key={color.value}
                        onClick={() => setSelectedEvent({ ...selectedEvent, color: color.value })}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color.value,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: selectedEvent.color === color.value ? '3px solid #1a1a1a' : '2px solid #e5e7eb',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={color.name}
                      >
                        {selectedEvent.color === color.value && (
                          <div style={{
                            width: '16px',
                            height: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: color.value,
                              borderRadius: '50%'
                            }} />
                          </div>
                        )}
                      </div>
                    ))}
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
                    onClick={async () => {
                      try {
                        if (!selectedEvent.title.trim()) {
                          alert('Please enter a title for the event');
                          return;
                        }

                        // Save current scroll position before refresh
                        const scrollContainer = document.querySelector('.calendar-5min-container');
                        const scrollPosition = scrollContainer ? scrollContainer.scrollTop : 0;

                        const supabase = (await import('@/lib/supabase')).supabase;
                        
                        // Convert datetime to date and time for database
                        const startDate = new Date(selectedEvent.start_datetime);
                        const endDate = new Date(selectedEvent.end_datetime);
                        
                        const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
                        const timeStr = startDate.toTimeString().slice(0, 8); // HH:MM:SS format
                        const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)); // minutes
                        
                        const { error } = await supabase
                          .from('projects_meeting')
                          .update({
                            title: selectedEvent.title,
                            description: selectedEvent.description || '',
                            date: dateStr,
                            time: timeStr,
                            duration: duration,
                            location: selectedEvent.location || null,
                            color: selectedEvent.color || '#5884FD'
                          })
                          .eq('id', selectedEvent.id);
                        
                        if (error) throw error;
                        
                        // Refresh calendar data
                        await fetchCalendarData();
                        
                        // Restore scroll position after refresh
                        setTimeout(() => {
                          const scrollContainer = document.querySelector('.calendar-5min-container');
                          if (scrollContainer) {
                            scrollContainer.scrollTop = scrollPosition;
                          }
                        }, 100);
                        
                        // Close modal
                        setIsEditingEvent(false);
                        setShowEventModal(false);
                        setSelectedEvent(null);
                        
                        console.log('✅ Event updated successfully');
                        
                      } catch (err: any) {
                        console.error('❌ Error updating event:', err);
                        alert('Failed to update event. Please try again.');
                      }
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