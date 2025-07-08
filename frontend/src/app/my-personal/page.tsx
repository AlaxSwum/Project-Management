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
  const [settings, setSettings] = useState<CalendarSettings>({
    default_view: 'week',
    time_format: '24h',
    start_hour: 0,
    end_hour: 23,
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
    color: '#5884FD'
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    fetchCalendarData();
    fetchSettings();
  }, [isAuthenticated, authLoading, router, currentDate, currentView]);

  const fetchCalendarData = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Calculate date range based on current view
      const startDate = getViewStartDate();
      const endDate = getViewEndDate();
      
      const { data, error } = await supabase
        .from('personal_calendar_overview')
        .select('*')
        .eq('user_id', user?.id)
        .gte('start_datetime', startDate.toISOString())
        .lte('end_datetime', endDate.toISOString())
        .order('start_datetime');
      
      if (error) throw error;
      setEvents(data || []);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('personal_calendar_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          default_view: data.default_view,
          time_format: data.time_format,
          start_hour: data.start_hour,
          end_hour: data.end_hour,
          first_day_of_week: data.first_day_of_week,
          working_hours_start: data.working_hours_start,
          working_hours_end: data.working_hours_end,
          theme_color: data.theme_color
        });
        setCurrentView(data.default_view === 'agenda' ? 'week' : data.default_view);
      }
    } catch (err: any) {
      console.error('Error fetching settings:', err);
    }
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
      });
    } else {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit',
        hour12: false 
      });
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
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('personal_events')
        .insert([{
          user_id: user?.id,
          title: newEvent.title,
          description: newEvent.description,
          start_datetime: newEvent.start_datetime,
          end_datetime: newEvent.end_datetime,
          all_day: newEvent.all_day,
          location: newEvent.location,
          event_type: newEvent.event_type,
          priority: newEvent.priority,
          color: newEvent.color,
          status: 'confirmed'
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
        color: '#5884FD'
      });
      setShowCreateModal(false);
      
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError('Failed to create event');
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

  const renderDayView = () => {
    const timeSlots = getTimeSlots();
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate.toDateString() === currentDate.toDateString();
    });

    // Calculate height to fit all 24 hours (24 * 40px = 960px + 60px header = 1020px)
    const slotHeight = 40;
    const headerHeight = 60;
    const totalHeight = timeSlots.length * slotHeight + headerHeight;

    return (
      <div style={{ display: 'flex', height: `${totalHeight}px`, overflow: 'visible' }}>
        {/* Time column */}
        <div style={{ width: '80px', borderRight: '1px solid #e8e8e8' }}>
          <div style={{ height: `${headerHeight}px`, borderBottom: '1px solid #e8e8e8' }}></div>
          {timeSlots.map(hour => (
            <div key={hour} style={{
              height: `${slotHeight}px`,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '4px',
              fontSize: '0.75rem',
              color: '#666666'
            }}>
              {formatHourSlot(hour)}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Header */}
          <div style={{
            height: `${headerHeight}px`,
            borderBottom: '1px solid #e8e8e8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
            fontWeight: '500'
          }}>
            {formatDate(currentDate)}
          </div>

          {/* Time slots */}
          {timeSlots.map(hour => {
            const slotEvents = getEventsForTimeSlot(hour, currentDate);
            const isInDragRange = isSlotInDragRange(currentDate, hour);
            
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
                    e.currentTarget.style.backgroundColor = hour >= 9 && hour <= 17 ? '#fafafa' : '#ffffff';
                  }
                }}
                style={{
                  height: `${slotHeight}px`,
                  borderBottom: '1px solid #f0f0f0',
                  position: 'relative',
                  background: isInDragRange 
                    ? 'rgba(88, 132, 253, 0.2)' 
                    : hour >= 9 && hour <= 17 ? '#fafafa' : '#ffffff',
                  cursor: isDragging ? 'grabbing' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  userSelect: 'none'
                }}
              >
                {slotEvents.map((event, index) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${index * 5 + 4}px`,
                      right: '4px',
                      top: '2px',
                      bottom: '2px',
                      background: event.color,
                      color: '#ffffff',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '1px' }}>
                      {event.title}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '0.7rem' }}>
                      {formatTime(event.start_datetime)} - {formatTime(event.end_datetime)}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
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
    
    // Calculate height to fit all 24 hours (24 * 40px = 960px + 60px header = 1020px)
    const slotHeight = 40;
    const headerHeight = 60;
    const totalHeight = timeSlots.length * slotHeight + headerHeight;

    return (
      <div style={{ display: 'flex', height: `${totalHeight}px`, overflow: 'visible' }}>
        {/* Time column */}
        <div style={{ width: '80px', borderRight: '1px solid #e8e8e8' }}>
          <div style={{ height: `${headerHeight}px`, borderBottom: '1px solid #e8e8e8' }}></div>
          {timeSlots.map(hour => (
            <div key={hour} style={{
              height: `${slotHeight}px`,
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '4px',
              fontSize: '0.75rem',
              color: '#666666'
            }}>
              {formatHourSlot(hour)}
            </div>
          ))}
        </div>

        {/* Week columns */}
        <div style={{ flex: 1, display: 'flex' }}>
          {weekDays.map(day => (
            <div key={day.toISOString()} style={{ flex: 1, borderRight: '1px solid #e8e8e8' }}>
              {/* Day header */}
              <div style={{
                height: `${headerHeight}px`,
                borderBottom: '1px solid #e8e8e8',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: day.toDateString() === new Date().toDateString() ? '#5884FD' : '#fafafa',
                color: day.toDateString() === new Date().toDateString() ? '#ffffff' : '#1a1a1a'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                  {day.getDate()}
                </div>
              </div>

              {/* Time slots for this day */}
              {timeSlots.map(hour => {
                const slotEvents = getEventsForTimeSlot(hour, day);
                const isInDragRange = isSlotInDragRange(day, hour);
                
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
                        e.currentTarget.style.backgroundColor = hour >= 9 && hour <= 17 ? '#fafafa' : '#ffffff';
                      }
                    }}
                    style={{
                      height: `${slotHeight}px`,
                      borderBottom: '1px solid #f0f0f0',
                      position: 'relative',
                      background: isInDragRange 
                        ? 'rgba(88, 132, 253, 0.2)' 
                        : hour >= 9 && hour <= 17 ? '#fafafa' : '#ffffff',
                      cursor: isDragging ? 'grabbing' : 'pointer',
                      transition: 'background-color 0.2s ease',
                      userSelect: 'none'
                    }}
                  >
                    {slotEvents.map((event, index) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                        style={{
                          position: 'absolute',
                          left: '2px',
                          right: '2px',
                          top: `${index * 18 + 2}px`,
                          height: '16px',
                          background: event.color,
                          color: '#ffffff',
                          borderRadius: '3px',
                          padding: '1px 4px',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          overflow: 'hidden',
                          fontWeight: '500',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
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
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        background: event.color,
                        color: '#ffffff',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        marginBottom: '1px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div style={{ color: '#666666', fontSize: '0.6rem' }}>
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
        <Sidebar projects={[]} onCreateProject={() => {}} />
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
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />

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

          {/* Drag Instructions */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #5884FD, #C483D9)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              ✨
            </div>
            <div>
              <div style={{ fontWeight: '500', color: '#1a1a1a', marginBottom: '0.25rem' }}>
                Drag to Create Events
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666666' }}>
                Click and drag from 2 PM to 4 PM (or any time range) to create events seamlessly
              </div>
            </div>
          </div>

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

      {/* Create Event Modal */}
      {showCreateModal && (
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
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: '#1a1a1a' }}>
                Create New Event
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666666',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter event title"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Description
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter event description"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.start_datetime}
                    onChange={(e) => setNewEvent({ ...newEvent, start_datetime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={newEvent.end_datetime}
                    onChange={(e) => setNewEvent({ ...newEvent, end_datetime: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter event location"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Type
                  </label>
                  <select
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="personal">Personal</option>
                    <option value="meeting">Meeting</option>
                    <option value="appointment">Appointment</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Priority
                  </label>
                  <select
                    value={newEvent.priority}
                    onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#1a1a1a' }}>
                    Color
                  </label>
                  <input
                    type="color"
                    value={newEvent.color}
                    onChange={(e) => setNewEvent({ ...newEvent, color: e.target.value })}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0.25rem',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={newEvent.all_day}
                  onChange={(e) => setNewEvent({ ...newEvent, all_day: e.target.checked })}
                  style={{ width: '16px', height: '16px' }}
                />
                <label style={{ fontWeight: '500', color: '#1a1a1a' }}>
                  All Day Event
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
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
                  onClick={createEvent}
                  disabled={!newEvent.title || !newEvent.start_datetime || !newEvent.end_datetime}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    background: newEvent.title && newEvent.start_datetime && newEvent.end_datetime ? '#5884FD' : '#cccccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: newEvent.title && newEvent.start_datetime && newEvent.end_datetime ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Create Event
                </button>
              </div>
            </div>
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