'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, taskService } from '@/lib/api-compatibility';
import { supabase } from '@/lib/supabase';
import { 
  CalendarIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  StarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  TagIcon,
  XMarkIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ListBulletIcon,
  LinkIcon,
  BellIcon,
  ArrowPathIcon,
  FolderIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Sidebar from '@/components/Sidebar';
import MeetingDetailModal from '@/components/MeetingDetailModal';
import MobileHeader from '@/components/MobileHeader';
import { TIMEZONES, TIMEZONE_KEYS, convertToUK, convertTime, adjustDate, getDisplayTimes, type TimezoneKey } from '@/lib/timezone-utils';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
  members?: Array<{
    id: number;
    name: string;
    email: string;
    role?: string;
  }>;
}

interface Task {
  id: number;
  name: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  start_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  assignees: User[];  // Changed from single assignee to multiple assignees
  assignee?: User | null;  // Keep for backwards compatibility
  created_by: User;
  tags_list: string[];
  created_at: string;
  updated_at: string;
  project_id: number;
  project_name?: string;
  project_color?: string;
  is_important?: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [selectedOccurrenceDate, setSelectedOccurrenceDate] = useState<string | null>(null);
  const [showMeetingDetail, setShowMeetingDetail] = useState(false);
  const [showDayTasks, setShowDayTasks] = useState(false);
  const [selectedDayTasks, setSelectedDayTasks] = useState<Task[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '09:00',
    duration: 60,
    project_id: null as number | null,
    attendee_ids: [] as number[],
    agenda_items: [] as string[],
    meeting_link: '',
    reminder_time: '15',
    recurring: false,
    recurring_end_date: '',
    timezone: 'UK' as TimezoneKey,
    display_timezones: ['UK', 'MM'] as TimezoneKey[],
  });
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  
  // Calendar view state
  const [calendarView, setCalendarView] = useState<'month' | 'week'>('month');

  // Derive user's timezone from their location profile field
  const userTimezone = useMemo((): TimezoneKey => {
    const loc = (user?.location || '').toUpperCase();
    if (loc.includes('MM') || loc.includes('MYANMAR') || loc.includes('BURMA')) return 'MM';
    if (loc.includes('TH') || loc.includes('THAI')) return 'TH';
    return 'UK';
  }, [user?.location]);

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
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fast parallel fetch: meetings + user's assigned projects only
      const uid = user?.id;

      // Get user's project memberships first
      const { data: membershipData } = uid ? await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', uid) : { data: [] };

      const assignedProjectIds = (membershipData || []).map((m: any) => m.project_id);

      const [meetingsResult, projectsResult] = await Promise.all([
        supabase
          .from('projects_meeting')
          .select('*')
          .order('date', { ascending: true }),
        assignedProjectIds.length > 0
          ? supabase
              .from('projects_project')
              .select('id, name, color')
              .in('id', assignedProjectIds)
          : Promise.resolve({ data: [], error: null })
      ]);
      
      if (meetingsResult.error) {
        console.error('Error fetching meetings:', meetingsResult.error);
        setTasks([]);
        setIsLoading(false);
        return;
      }
      
      // Build project lookup map (O(1) lookups instead of O(n) find)
      const projectMap = new Map<number, { name: string; color: string }>();
      (projectsResult.data || []).forEach((p: any) => {
        projectMap.set(p.id, { name: p.name, color: p.color });
      });
      
      // Filter to user's meetings and transform in one pass
      const transformedMeetings = (meetingsResult.data || [])
        .filter((meeting: any) => {
          if (meeting.created_by_id === uid) return true;
          if (meeting.attendee_ids && Array.isArray(meeting.attendee_ids) && meeting.attendee_ids.includes(uid)) return true;
          return false;
        })
        .map((meeting: any) => {
          // Convert stored UK time to user's local timezone for correct calendar positioning
          const ukTime = meeting.time || '00:00';
          const { time: localTime, dateDelta } = convertTime(ukTime, 'UK', userTimezone);
          const localDate = meeting.date ? adjustDate(meeting.date, dateDelta) : null;

          const startDateTime = localDate && meeting.time
            ? `${localDate}T${localTime}`
            : localDate || null;

          let dueDateTime = startDateTime;
          if (meeting.duration && startDateTime) {
            const start = new Date(startDateTime);
            start.setMinutes(start.getMinutes() + meeting.duration);
            dueDateTime = start.toISOString();
          }

          const project = projectMap.get(meeting.project_id);

          return {
            id: meeting.id,
            name: meeting.title,
            description: meeting.description || '',
            status: 'todo',
            priority: 'medium',
            due_date: dueDateTime,
            start_date: startDateTime,
            estimated_hours: meeting.duration ? meeting.duration / 60 : null,
            actual_hours: null,
            assignees: [],
            assignee: null,
            created_by: { id: meeting.created_by_id, name: '', email: '', role: '' },
            tags_list: [],
            created_at: meeting.created_at,
            updated_at: meeting.updated_at,
            project_id: meeting.project_id,
            project_name: project?.name || 'Personal',
            project_color: project?.color || '#3B82F6',
            is_important: false,
            _meetingData: meeting
          };
        });
      
      setProjects(projectsResult.data || []);
      setTasks(transformedMeetings);
    } catch (err) {
      console.error('Calendar: Failed to fetch meetings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const filteredTasks = tasks.filter(task => {
      const taskStartDate = task.start_date ? task.start_date.split('T')[0] : null;
      const meetingData = (task as any)._meetingData;
      const excludedDates: string[] = meetingData?.excluded_dates || [];

      // Skip if this date has been excluded (single occurrence deleted)
      if (excludedDates.includes(dateString)) return false;

      // Direct match on start date
      if (taskStartDate === dateString) return true;

      // Daily recurring: show on every day from start date to recurring_end_date
      if (meetingData?.recurring && meetingData?.recurring_end_date && taskStartDate) {
        return dateString > taskStartDate && dateString <= meetingData.recurring_end_date;
      }

      return false;
    });
    
    // Sort by priority (urgent/high first) and then by name
    return filteredTasks.sort((a, b) => {
      if (a.is_important && !b.is_important) return -1;
      if (!a.is_important && b.is_important) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  const toggleTaskImportant = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      // Toggle between high/urgent and medium priority
      const newPriority = task.is_important ? 'medium' : 'high';
      
      await taskService.updateTask(taskId, { priority: newPriority });
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, priority: newPriority, is_important: !t.is_important }
          : t
      ));
    } catch (err) {
      console.error('Failed to update task importance:', err);
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDayDate(date);
    setNewMeeting({
      title: '',
      description: '',
      start_date: date.toISOString().split('T')[0],
      start_time: '09:00',
      duration: 60,
      project_id: null,
      attendee_ids: [],
      agenda_items: [],
      meeting_link: '',
      reminder_time: '15',
      recurring: false,
      recurring_end_date: '',
      timezone: 'UK' as TimezoneKey,
      display_timezones: ['UK', 'MM'] as TimezoneKey[],
    });
    setNewAgendaItem('');
    setProjectMembers([]);
    setShowCreateMeeting(true);
  };

  const handleProjectChange = async (projectId: number | null) => {
    setNewMeeting({ ...newMeeting, project_id: projectId, attendee_ids: [] });

    if (projectId) {
      try {
        // Fetch project members from database
        const { data: memberData } = await supabase
          .from('projects_project_members')
          .select('user_id')
          .eq('project_id', projectId);

        if (memberData && memberData.length > 0) {
          const userIds = memberData.map((m: any) => m.user_id);
          const { data: users } = await supabase
            .from('auth_user')
            .select('id, name, email, role')
            .in('id', userIds);

          setProjectMembers(users || []);
        } else {
          setProjectMembers([]);
        }
      } catch (err) {
        console.error('Error fetching project members:', err);
        setProjectMembers([]);
      }
    } else {
      setProjectMembers([]);
    }
  };

  const handleMeetingClick = (task: any, occurrenceDate?: string) => {
    if (task._meetingData) {
      setSelectedMeeting(task._meetingData);
      setSelectedOccurrenceDate(occurrenceDate || task.start_date?.split('T')[0] || null);
      setShowMeetingDetail(true);
    }
  };

  const [creatingMeeting, setCreatingMeeting] = useState(false);
  
  const createMeeting = async () => {
    if (!newMeeting.title.trim() || !newMeeting.start_date) return;
    if (creatingMeeting) return; // Prevent double submission
    setCreatingMeeting(true);
    
    try {
      // Convert to UK time from selected timezone
      const { time: ukTime, dateDelta } = convertToUK(newMeeting.start_time, newMeeting.timezone);
      const ukDate = adjustDate(newMeeting.start_date, dateDelta);

      // Insert into projects_meeting table (base fields only)
      const meetingInsert: any = {
        title: newMeeting.title.trim(),
        description: newMeeting.description.trim(),
        date: ukDate,
        time: ukTime,
        duration: newMeeting.duration,
        project_id: newMeeting.project_id,
        created_by_id: user?.id,
        attendee_ids: newMeeting.attendee_ids.length > 0 ? newMeeting.attendee_ids : [user?.id],
        agenda_items: newMeeting.agenda_items,
        meeting_link: newMeeting.meeting_link.trim() || null,
        reminder_time: newMeeting.reminder_time ? parseInt(newMeeting.reminder_time) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Try with all optional columns first, fall back if they don't exist
      const fullInsert = {
        ...meetingInsert,
        input_timezone: newMeeting.timezone,
        display_timezones: newMeeting.display_timezones,
        recurring: newMeeting.recurring || false,
        recurring_end_date: newMeeting.recurring ? (newMeeting.recurring_end_date || null) : null,
      };

      let { error } = await supabase
        .from('projects_meeting')
        .insert(fullInsert);

      // If columns don't exist in schema, retry with base fields only
      if (error && error.code === 'PGRST204') {
        const retryResult = await supabase
          .from('projects_meeting')
          .insert(meetingInsert);
        error = retryResult.error;
      }

      if (error) {
        console.error('Error creating meeting:', error);
        alert('Failed to create meeting: ' + error.message);
        setCreatingMeeting(false);
        return;
      }
      
      // Refresh meetings
      await fetchData();
      
      // Reset form
      setNewMeeting({
        title: '',
        description: '',
        start_date: '',
        start_time: '09:00',
        duration: 60,
        project_id: null,
        attendee_ids: [],
        agenda_items: [],
        meeting_link: '',
        reminder_time: '15',
        recurring: false,
        recurring_end_date: '',
        timezone: 'UK' as TimezoneKey,
        display_timezones: ['UK', 'MM'] as TimezoneKey[],
      });
      setNewAgendaItem('');
      setShowCreateMeeting(false);
    } catch (err) {
      console.error('Error creating meeting:', err);
      alert('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ExclamationTriangleIcon style={{ width: '12px', height: '12px', color: '#FFFFFF' }} />;
      case 'high':
        return <ExclamationTriangleIcon style={{ width: '12px', height: '12px', color: '#FFFFFF' }} />;
      case 'medium':
        return <ClockIcon style={{ width: '12px', height: '12px', color: '#FFFFFF' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return '#10B981';
      case 'in_progress':
        return '#3B82F6';
      case 'review':
        return '#A1A1AA';
      default:
        return '#3D3D3D';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      
      // Update local state
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: newStatus }
          : t
      ));
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleTaskModalOpen = (task: Task, occurrenceDate?: string) => {
    if (showMeetingDetail) return; // Prevent multiple modals
    handleMeetingClick(task, occurrenceDate);
  };

  const handleUpdateMeeting = async (meetingData: any) => {
    try {
      await supabase
        .from('projects_meeting')
        .update(meetingData)
        .eq('id', selectedMeeting.id);
      
      // Refresh meetings
      await fetchData();
      setShowMeetingDetail(false);
      setSelectedMeeting(null);
    } catch (err) {
      console.error('Failed to update meeting:', err);
    }
  };

  const handleDeleteMeeting = async (meetingId: number, mode: 'all' | 'this' = 'all', occurrenceDate?: string) => {
    try {
      if (mode === 'this' && occurrenceDate) {
        // Add this date to excluded_dates array
        const meeting = tasks.find(t => t.id === meetingId)?._meetingData || selectedMeeting;
        const currentExcluded = meeting?.excluded_dates || [];
        await supabase
          .from('projects_meeting')
          .update({ excluded_dates: [...currentExcluded, occurrenceDate] })
          .eq('id', meetingId);
      } else {
        // Delete the entire meeting
        await supabase
          .from('projects_meeting')
          .delete()
          .eq('id', meetingId);
      }

      // Refresh meetings
      await fetchData();
      setShowMeetingDetail(false);
      setSelectedMeeting(null);
      setSelectedOccurrenceDate(null);
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  const handleShowMoreTasks = (date: Date, tasks: Task[]) => {
    setSelectedDayDate(date);
    setSelectedDayTasks(tasks);
    setShowDayTasks(true);
  };



  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showMeetingDetail) {
        setShowMeetingDetail(false);
        setSelectedMeeting(null);
      }
    };

    if (showMeetingDetail) {
      document.addEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showMeetingDetail]);

  // Calculate calendar values dynamically
  const today = new Date();
  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDay = useMemo(() => getFirstDayOfMonth(currentDate), [currentDate]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #3D3D3D', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #3D3D3D', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <ExclamationTriangleIcon style={{ width: '48px', height: '48px', color: '#F87239' }} />
        <h2 style={{ color: '#FFFFFF', fontSize: '1.5rem', fontWeight: '600', textAlign: 'center' }}>Calendar Error</h2>
        <p style={{ color: '#71717A', textAlign: 'center', maxWidth: '400px' }}>{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchData();
          }}
          style={{
            background: '#3B82F6',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      
      <style dangerouslySetInnerHTML={{
        __html: `
        .calendar-container {
          min-height: 100vh;
          display: flex;
          background: #0D0D0D;
          width: 100%;
          ${isMobile ? 'flex-direction: column;' : ''}
        }
        

        .main-content {
          flex: 1;
          margin-left: ${isMobile ? '0' : '280px'};
          background: transparent;
          position: relative;
          z-index: 1;
          padding-top: ${isMobile ? '70px' : '0'};
          width: ${isMobile ? '100vw' : 'auto'};
          min-height: 100vh;
          ${isMobile ? 'margin-left: 0 !important; max-width: 100vw; overflow-x: hidden;' : ''}
        }
        
        .header {
          background: #141414;
          border-bottom: 1px solid #2D2D2D;
          padding: 2.5rem 2rem 1.5rem 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          max-width: ${isMobile ? 'none' : '1200px'};
          margin-left: auto;
          margin-right: auto;
          width: ${isMobile ? '100%' : 'auto'};
        }
        
        .header-controls {
          display: flex;
          align-items: center;
          gap: 2rem;
        }
        
        .filter-controls {
          display: flex;
          gap: 1rem;
        }
        
        .filter-btn {
          background: rgba(26, 26, 26, 0.9);
          backdrop-filter: blur(15px);
          color: #E4E4E7;
          border: 2px solid rgba(255, 179, 51, 0.3);
          padding: 0.75rem 1.5rem;
          border-radius: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 0.875rem;
          position: relative;
          overflow: hidden;
        }
        
        .filter-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 179, 51, 0.1), transparent);
          transition: left 0.6s ease;
        }
        
        .filter-btn:hover {
          background: rgba(255, 179, 51, 0.1);
          border-color: #FFB333;
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.25);
        }
        
        .filter-btn:hover::before {
          left: 100%;
        }
        
        .filter-btn.active {
          background: linear-gradient(135deg, #FFB333, #FFD480);
          color: #FFFFFF;
          border-color: #FFB333;
          box-shadow: 0 8px 25px rgba(255, 179, 51, 0.35);
        }
        .calendar-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          padding-top: 1.5rem;
          max-width: ${isMobile ? 'none' : '1000px'};
          margin: 0 auto;
          width: ${isMobile ? '100%' : 'auto'};
        }
        
        .calendar-stats .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          background: #1A1A1A;
          padding: 1.25rem 1rem;
          border-radius: 16px;
          border: 1px solid #2D2D2D;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        .calendar-stats .stat-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          border-color: #FFB333;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #71717A;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .stat-value {
          font-size: 1.875rem;
          font-weight: 700;
          color: #FFFFFF;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        
        .stat-value.overdue {
          color: #F87239;
          font-weight: 700;
        }
        .header-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #FFFFFF;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.02em;
          line-height: 1.2;
        }
        .calendar-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .nav-btn {
          background: #1A1A1A;
          color: #FFFFFF;
          border: 1px solid #2D2D2D;
          padding: 0.75rem;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .nav-btn:hover {
          background: #1F1F1F;
          border-color: #FFB333;
          color: #FFB333;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        
        .nav-btn:active {
          transform: translateY(0);
        }
        
        .month-year {
          font-size: 1.5rem;
          font-weight: 600;
          color: #FFFFFF;
          min-width: 200px;
          text-align: center;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          letter-spacing: -0.01em;
        }
        .calendar-content {
          padding: 2rem;
          max-width: ${isMobile ? 'none' : '1200px'};
          margin: 0 auto;
          display: block;
          visibility: visible;
          width: ${isMobile ? '100%' : 'auto'};
        }
        
        .calendar-grid {
          background: transparent;
          padding: 0.5rem 0;
        }
        
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.75rem;
          padding: 0 1rem 0.5rem 1rem;
        }
        
        .calendar-header-cell {
          padding: 0.5rem;
          text-align: center;
          font-weight: 600;
          color: #71717A;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
          .calendar-body {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.75rem;
            padding: 1rem;
          }
        .calendar-cell {
          min-height: 140px;
          padding: 1rem;
          background: #141414;
          border: 1px solid #2D2D2D;
          border-radius: 20px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .calendar-cell:hover {
          background: #1A1A1A;
          border-color: #3D3D3D;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .calendar-cell.other-month {
          background: #0D0D0D;
          color: #52525B;
          opacity: 0.6;
        }
        
        .calendar-cell.today {
          background: #141414;
          border: 2px solid #3B82F6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
          position: relative;
        }
        
        .day-number {
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 0.75rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
          font-size: 1.5rem;
        }
        
        .calendar-cell.other-month .day-number {
          color: #52525B;
        }
        
        .calendar-cell.today .day-number {
          color: #3B82F6;
          font-weight: 800;
        }
          .events-container {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
        .task-item {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          border: none;
          border-radius: 12px;
          padding: 0.625rem 0.75rem;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        
        .task-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .task-item.important {
          background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
        }
        
        .task-item.important:hover {
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .task-item.overdue {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        }
        
        .task-item.overdue:hover {
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
        }
          .task-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.25rem;
          }
        .task-name {
          font-weight: 500;
          color: #FFFFFF;
          line-height: 1.3;
          flex: 1;
          margin-right: 0.25rem;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
          .task-icons {
            display: flex;
            align-items: center;
            gap: 0.25rem;
          }

          .task-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.65rem;
          }
          .project-name {
            font-weight: 500;
            max-width: 60%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .assignee {
            display: flex;
            align-items: center;
            gap: 0.125rem;
            color: #71717A;
          }
        .more-tasks {
          background: #2D2D2D;
          border: 1px solid #3D3D3D;
          border-radius: 6px;
          padding: 0.375rem 0.5rem;
          font-size: 0.6875rem;
          color: #A1A1AA;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-family: 'Mabry Pro', 'Inter', sans-serif;
        }
        
        .more-tasks:hover {
          background: #3D3D3D;
          border-color: #FFB333;
        }
          

          
          /* Enhanced Task Modal */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            box-sizing: border-box;
          }
          .enhanced-task-modal {
            background: #1A1A1A;
            border: 2px solid #2D2D2D;
            border-radius: 12px;
            width: 100%;
            max-width: 900px;
            height: 85vh;
            max-height: 85vh;
            min-height: 600px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
            overflow: hidden;
          }
          .task-details-section {
            padding: 1.5rem;
            border-bottom: 2px solid #2D2D2D;
            flex-shrink: 0;
            max-height: 60%;
            overflow-y: auto;
          }
          .interaction-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 250px;
            background: #1A1A1A;
          }
          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 1.5rem;
            border-bottom: 2px solid #2D2D2D;
            background: #141414;
          }
          .modal-header h3 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0;
            flex: 1;
            line-height: 1.3;
          }
          .close-btn {
            background: none;
            border: none;
            font-size: 1.5rem;
            font-weight: bold;
            color: #71717A;
            cursor: pointer;
            padding: 0;
            margin-left: 1rem;
            transition: all 0.2s ease;
          }
          .close-btn:hover {
            color: #FFFFFF;
          }
          /* Tab Navigation */
          .tab-navigation {
            display: flex;
            border-bottom: 2px solid #2D2D2D;
            background: #141414;
            flex-shrink: 0;
            z-index: 1;
          }
          .tab-btn {
            flex: 1;
            padding: 1rem 1.5rem;
            background: none;
            border: none;
            border-right: 1px solid #2D2D2D;
            font-weight: 600;
            color: #71717A;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            min-height: 60px;
          }
          .tab-btn:last-child {
            border-right: none;
          }
          .tab-btn:hover {
            background: #2D2D2D;
            color: #FFFFFF;
          }
          .tab-btn.active {
            background: #1A1A1A;
            color: #FFFFFF;
            border-bottom: 3px solid #3B82F6;
            margin-bottom: -2px;
          }

          /* Comments Section */
          .comments-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .comments-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .empty-comments, .empty-files {
            text-align: center;
            padding: 2rem;
            color: #71717A;
          }
          .empty-comments p, .empty-files p {
            margin: 0.5rem 0;
          }
          .comment-item {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #2D2D2D;
          }
          .comment-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .comment-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.5rem;
          }
          .author-avatar, .current-user-avatar {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
            border: 2px solid #3B82F6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: 600;
            color: #FFFFFF;
            flex-shrink: 0;
          }
          .comment-meta {
            display: flex;
            flex-direction: column;
            gap: 0.125rem;
          }
          .author-name {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
          }
          .comment-time {
            font-size: 0.75rem;
            color: #71717A;
          }
          .comment-content {
            margin-left: 2.75rem;
            font-size: 0.875rem;
            color: #E4E4E7;
            line-height: 1.5;
          }
          .add-comment {
            border-top: 1px solid #2D2D2D;
            padding: 1.5rem;
            background: #141414;
          }
          .comment-input-container {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            padding: 0;
            margin: 0;
          }
          .comment-input {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #2D2D2D;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
            resize: vertical;
            min-height: 80px;
            max-width: 100%;
            width: 100%;
            box-sizing: border-box;
            transition: all 0.2s ease;
            background: #1A1A1A;
            color: #FFFFFF;
          }
          .comment-input:focus {
            outline: none;
            border-color: #3B82F6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
          .send-comment-btn {
            background: #3B82F6;
            color: #ffffff;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .send-comment-btn:hover:not(:disabled) {
            background: #2563EB;
            transform: translateY(-1px);
          }
          .send-comment-btn:disabled {
            background: #3D3D3D;
            cursor: not-allowed;
          }

          /* Files Section */
          .files-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #2D2D2D;
            background: #141414;
          }
          .files-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0;
          }
          .upload-btn {
            background: #3B82F6;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            font-size: 0.875rem;
          }
          .upload-btn:hover {
            background: #2563EB;
            transform: translateY(-1px);
          }
          .files-list {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            max-height: 300px;
          }
          .file-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid #2D2D2D;
            border-radius: 8px;
            margin-bottom: 0.75rem;
            transition: all 0.2s ease;
          }
          .file-item:hover {
            border-color: #3B82F6;
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          .file-item:last-child {
            margin-bottom: 0;
          }
          .file-icon {
            width: 40px;
            height: 40px;
            background: #2D2D2D;
            border: 1px solid #3D3D3D;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #71717A;
            flex-shrink: 0;
          }
          .file-info {
            flex: 1;
            min-width: 0;
          }
          .file-name {
            font-weight: 600;
            color: #FFFFFF;
            font-size: 0.875rem;
            margin-bottom: 0.25rem;
            word-break: break-all;
          }
          .file-meta {
            display: flex;
            gap: 1rem;
            font-size: 0.75rem;
            color: #71717A;
          }
          .file-actions {
            display: flex;
            gap: 0.5rem;
          }
          .download-btn {
            background: #1A1A1A;
            color: #71717A;
            border: 1px solid #3D3D3D;
            padding: 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
          }
          .download-btn:hover {
            color: #FFFFFF;
            border-color: #3B82F6;
            transform: translateY(-1px);
          }
          .task-status-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            border: 1px solid;
          }
          .status-todo { background: #2D2D2D; color: #FFFFFF; border-color: #3D3D3D; }
          .status-in_progress { background: #3D3D3D; color: #FFFFFF; border-color: #3B82F6; }
          .status-review { background: #52525B; color: #ffffff; border-color: #A1A1AA; }
          .status-done { background: #10B981; color: #ffffff; border-color: #10B981; }
          .priority-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            border: 1px solid;
          }
          .priority-low { background: #2D2D2D; color: #FFFFFF; border-color: #3D3D3D; }
          .priority-medium { background: #3D3D3D; color: #FFFFFF; border-color: #52525B; }
          .priority-high { background: #71717A; color: #ffffff; border-color: #A1A1AA; }
          .priority-urgent { background: #F87239; color: #ffffff; border-color: #F87239; }
          .description {
            margin-bottom: 1.5rem;
          }
          .description h4 {
            font-size: 0.9rem;
            font-weight: 600;
            color: #FFFFFF;
            margin: 0 0 0.5rem 0;
          }
          .description p {
            font-size: 0.875rem;
            color: #E4E4E7;
            line-height: 1.5;
            margin: 0;
          }
          .task-metadata {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            margin-bottom: 1.5rem;
          }
          .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .meta-item .label {
            font-size: 0.8rem;
            font-weight: 600;
            color: #71717A;
            min-width: 80px;
          }
          .meta-item .value {
            font-size: 0.8rem;
            color: #FFFFFF;
            text-align: right;
            flex: 1;
          }
          .meta-item .value.overdue {
            color: #F87239;
            font-weight: 600;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
            justify-content: flex-end;
          }
          .tag {
            background: #2D2D2D;
            color: #E4E4E7;
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            gap: 0.2rem;
            border: 1px solid #3D3D3D;
          }

          .status-change-section {
            background: #141414;
            border: 1px solid #2D2D2D;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1rem;
          }
          .status-change-title {
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 1rem;
            font-size: 0.875rem;
          }
          .status-change-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }
          .status-change-btn {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: 2px solid #3D3D3D;
            border-radius: 6px;
            background: #1A1A1A;
            color: #FFFFFF;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .status-change-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
            border-color: #3B82F6;
          }
          .status-change-btn.active {
            background: #3B82F6;
            color: #ffffff;
            border-color: #3B82F6;
          }
          .status-change-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          /* Modal Splitter Styles */
          .modal-splitter {
            height: 8px;
            background: linear-gradient(to bottom, #2D2D2D 0%, #3D3D3D 50%, #2D2D2D 100%);
            border-top: 1px solid #3D3D3D;
            border-bottom: 1px solid #3D3D3D;
            cursor: ns-resize;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            user-select: none;
          }
          .modal-splitter:hover {
            background: linear-gradient(to bottom, #3D3D3D 0%, #52525B 50%, #3D3D3D 100%);
            border-color: #52525B;
          }
          .modal-splitter.dragging {
            background: linear-gradient(to bottom, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%);
            border-color: #1d4ed8;
          }
          .splitter-handle {
            width: 40px;
            height: 4px;
            background: #52525B;
            border-radius: 2px;
            transition: all 0.2s ease;
          }
          .modal-splitter:hover .splitter-handle {
            background: #71717A;
            width: 60px;
          }
          .modal-splitter.dragging .splitter-handle {
            background: #ffffff;
            width: 80px;
            height: 3px;
          }
          
          .resizable-task-details {
            overflow-y: auto;
            flex: none;
          }
          
          .resizable-interaction-section {
            flex: none;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          
          /* Responsive Design */
          
          /* Large desktop styles */
          @media (max-width: 1400px) {
            .calendar-cell {
              min-height: 110px;
            }
          }
          
          /* Desktop styles */
          @media (max-width: 1200px) {
            .calendar-stats {
              grid-template-columns: repeat(3, 1fr);
            }
            .header-controls {
              flex-direction: column;
              gap: 1rem;
            }
            .calendar-cell {
              min-height: 100px;
              padding: 0.75rem;
            }
            .task-item {
              font-size: 0.65rem;
              padding: 0.4rem;
            }
          }
          
          /* Tablet styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
            }
            .header {
              padding: 1rem 1.5rem;
            }
            .calendar-content {
              padding: 1.5rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            .calendar-cell {
              min-height: 90px;
              padding: 0.625rem;
            }
            .calendar-header-cell {
              padding: 0.875rem;
            }
            .task-item {
              font-size: 0.7rem;
              padding: 0.5rem;
            }
            .task-name {
              font-size: 0.75rem;
            }
            .task-meta {
              font-size: 0.65rem;
            }
          }
          
          /* Mobile styles */
          @media (max-width: 768px) {
            * {
              box-sizing: border-box !important;
            }
            
            body, html {
              width: 100% !important;
              max-width: 100vw !important;
              overflow-x: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .calendar-container {
              min-height: 100vh;
              display: block !important;
              background: #0D0D0D;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
              margin: 0;
              padding: 0;
            }
            
            .main-content {
              margin-left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
              padding-top: 70px;
              margin: 0;
              padding-left: 0;
              padding-right: 0;
            }
            
            .header {
              padding: 0.875rem;
              position: relative;
              top: 0;
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
              z-index: 30;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .header-content {
              flex-direction: column;
              gap: 0.875rem;
              margin-bottom: 0.875rem;
            }
            .header-controls {
              width: 100%;
              max-width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 1rem;
            }
            .calendar-nav {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 1rem;
              flex: 1;
            }
            .today-nav {
              flex-shrink: 0;
            }
            .month-year {
              font-size: 1rem;
              font-weight: 700;
              color: #FFFFFF;
              text-align: center;
              flex: 1;
            }
            .nav-btn {
              padding: 0.75rem;
              min-width: 44px;
              min-height: 44px;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .filter-btn {
              display: none;
            }
            .calendar-stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 0.375rem;
              margin-top: 0.875rem;
              width: 100%;
              max-width: 100%;
              box-sizing: border-box;
            }
            .stat-item {
              padding: 0.625rem 0.25rem;
              border-radius: 6px;
              background: rgba(26, 26, 26, 0.95);
              border: 1px solid #2D2D2D;
              text-align: center;
              min-height: 50px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              box-sizing: border-box;
              overflow: hidden;
            }
            .stat-value {
              font-size: 1.125rem;
              font-weight: 800;
              margin-bottom: 0.125rem;
              line-height: 1;
            }
            .stat-label {
              font-size: 0.6rem;
              font-weight: 600;
              color: #71717A;
              line-height: 1.2;
              word-break: break-word;
            }
            .calendar-content {
              padding: 0.5rem !important;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              margin: 0 !important;
              overflow-x: hidden;
            }
            
            .calendar-grid {
              border-radius: 8px;
              overflow: visible;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
              border: 1px solid #2D2D2D;
              width: calc(100vw - 1rem) !important;
              max-width: calc(100vw - 1rem) !important;
              box-sizing: border-box;
              display: block !important;
              visibility: visible !important;
              margin: 0 !important;
            }
            
            /* Mobile Calendar Header */
            .calendar-header {
              background: #1A1A1A;
              padding: 0;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100% !important;
            }
            .calendar-header-cell {
              color: #E4E4E7;
              font-weight: 700;
              font-size: 0.75rem;
              text-align: center;
              padding: 0.75rem 0.125rem;
              border-right: 1px solid #2D2D2D;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-header-cell:last-child {
              border-right: none;
            }
            
            /* Mobile Calendar Body */
            .calendar-body {
              background: #141414;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: 100%;
              visibility: visible !important;
            }
            .calendar-cell {
              min-height: 85px;
              padding: 0.375rem;
              border-right: 1px solid #2D2D2D;
              border-bottom: 1px solid #2D2D2D;
              background: #141414;
              transition: all 0.2s ease;
              position: relative;
              display: flex;
              flex-direction: column;
              box-sizing: border-box;
              overflow: hidden;
            }
            .calendar-cell:hover {
              background: #1A1A1A;
              border-color: #3D3D3D;
            }
            .calendar-cell:nth-child(7n) {
              border-right: none;
            }
            .calendar-cell.other-month {
              background: #1A1A1A;
              opacity: 0.6;
            }
            .calendar-cell.other-month .day-number {
              color: #52525B;
            }
            .calendar-cell.today {
              background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
              border: 2px solid #FFB333;
              box-shadow: 0 0 0 1px rgba(255, 179, 51, 0.3);
            }
            .calendar-cell.today .day-number {
              color: #FFB333;
              font-weight: 800;
            }
            .day-number {
              font-size: 0.8rem;
              font-weight: 700;
              color: #FFFFFF;
              margin-bottom: 0.25rem;
              display: block;
              text-align: left;
            }
            .events-container {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
              overflow: hidden;
            }
            .task-item {
              font-size: 0.6rem;
              padding: 0.25rem;
              border-radius: 4px;
              margin-bottom: 0;
              min-height: auto;
              line-height: 1.2;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid transparent;
              position: relative;
              overflow: hidden;
            }
            .task-item:hover {
              transform: translateY(-1px);
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
              border-color: rgba(59, 130, 246, 0.3);
            }
            .task-header {
              margin-bottom: 0.125rem;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            }
            .task-name {
              font-size: 0.6rem;
              line-height: 1.2;
              font-weight: 600;
              color: #FFFFFF;
              flex: 1;
              margin-right: 0.125rem;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              word-break: break-word;
            }
            .task-icons {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              flex-shrink: 0;
            }
            .task-meta {
              font-size: 0.5rem;
              color: #71717A;
              line-height: 1.1;
              display: flex;
              flex-direction: column;
              gap: 0.125rem;
            }
            .project-name {
              font-weight: 500;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .assignee {
              display: flex;
              align-items: center;
              gap: 0.125rem;
              font-size: 0.5rem;
              color: #71717A;
            }
            .more-tasks {
              padding: 0.1875rem;
              font-size: 0.55rem;
              border-radius: 3px;
              background: linear-gradient(135deg, #2D2D2D 0%, #3D3D3D 100%);
              color: #71717A;
              text-align: center;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              border: 1px solid #3D3D3D;
              margin-top: 0.125rem;
            }
            .more-tasks:hover {
              background: linear-gradient(135deg, #3D3D3D 0%, #52525B 100%);
              color: #E4E4E7;
              transform: translateY(-1px);
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .header {
              padding: 0.75rem;
            }
            .header-title {
              font-size: 1.25rem;
            }
            .header-controls {
              flex-direction: column !important;
              gap: 0.75rem !important;
            }
            .calendar-nav {
              width: 100% !important;
              max-width: none !important;
              justify-content: space-between !important;
              flex: none !important;
            }
            .today-nav {
              width: 100% !important;
            }
            .today-btn {
              width: 100% !important;
              padding: 0.75rem !important;
              font-size: 0.875rem !important;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
              gap: 0.25rem;
            }
            .stat-item {
              padding: 0.5rem 0.125rem;
              min-height: 45px;
            }
            .stat-value {
              font-size: 1rem;
            }
            .stat-label {
              font-size: 0.55rem;
            }
            .month-year {
              font-size: 0.85rem;
              flex: 1;
              text-align: center;
            }
            .nav-btn {
              min-width: 36px;
              min-height: 36px;
              padding: 0.5rem;
            }
            .calendar-content {
              padding: 0.625rem;
            }
            .calendar-header-cell {
              font-size: 0.65rem;
              padding: 0.625rem 0.0625rem;
            }
            .calendar-cell {
              min-height: 70px;
              padding: 0.25rem;
            }
            .day-number {
              font-size: 0.75rem;
              margin-bottom: 0.1875rem;
            }
            .task-item {
              font-size: 0.55rem;
              padding: 0.1875rem;
              border-radius: 3px;
            }
            .task-name {
              font-size: 0.55rem;
              line-height: 1.1;
            }
            .task-meta {
              font-size: 0.45rem;
            }
            .project-name {
              width: 100%;
            }
            .assignee {
              font-size: 0.45rem;
            }
            .more-tasks {
              font-size: 0.5rem;
              padding: 0.125rem;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .calendar-cell {
              min-height: 60px;
            }
          }
            
            /* Mobile Modal Styles */
            .modal-overlay {
              padding: 0.75rem;
              align-items: center;
              justify-content: center;
              background: rgba(0, 0, 0, 0.8);
            }
            .enhanced-task-modal {
              margin: 0;
              width: 100%;
              max-width: calc(100vw - 1.5rem);
              max-height: calc(100vh - 1.5rem);
              height: auto;
              min-height: 80vh;
              border-radius: 12px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            .modal-header {
              padding: 1rem;
              border-bottom: 1px solid #2D2D2D;
              background: #141414;
              position: relative;
              flex-shrink: 0;
            }
            .modal-header h3 {
              font-size: 1rem;
              line-height: 1.3;
              padding-right: 2.5rem;
              margin: 0;
              font-weight: 600;
            }
            .close-btn {
              position: absolute;
              top: 0.75rem;
              right: 0.75rem;
              font-size: 1.125rem;
              padding: 0.375rem;
              background: #1A1A1A;
              border-radius: 50%;
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #2D2D2D;
            }
            .task-details-section {
              padding: 1rem;
              flex: 1;
              overflow-y: auto;
              background: #1A1A1A;
            }
            .task-status-row {
              display: flex;
              gap: 0.5rem;
              align-items: flex-start;
              margin-bottom: 1rem;
              flex-wrap: wrap;
            }
            .status-badge, .priority-badge {
              font-size: 0.7rem;
              padding: 0.375rem 0.75rem;
              border-radius: 20px;
              font-weight: 600;
            }
            .description {
              margin-bottom: 1rem;
            }
            .description h4 {
              font-size: 0.85rem;
              margin-bottom: 0.5rem;
            }
            .description p {
              font-size: 0.8rem;
              line-height: 1.4;
            }
            .task-metadata {
              gap: 0.75rem;
              margin-bottom: 1rem;
            }
            .meta-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0.5rem 0;
              border-bottom: 1px solid #2D2D2D;
            }
            .meta-item:last-child {
              border-bottom: none;
            }
            .meta-item .label {
              font-size: 0.7rem;
              color: #71717A;
              font-weight: 500;
              min-width: 60px;
            }
            .meta-item .value {
              font-size: 0.8rem;
              text-align: right;
              flex: 1;
              font-weight: 500;
            }
            .meta-item .value.overdue {
              color: #F87239;
              font-weight: 600;
            }
            .tags {
              justify-content: flex-end;
              flex-wrap: wrap;
              gap: 0.25rem;
            }
            .tag {
              font-size: 0.65rem;
              padding: 0.2rem 0.5rem;
              background: #2D2D2D;
              border-radius: 12px;
              border: 1px solid #3D3D3D;
            }
            .status-change-section {
              background: #141414;
              border: 1px solid #2D2D2D;
              border-radius: 8px;
              padding: 1rem;
              margin-top: 1rem;
            }
            .status-change-title {
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
              color: #FFFFFF;
            }
            .status-change-buttons {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem 0.5rem;
              font-size: 0.75rem;
              justify-content: center;
              min-height: 44px;
              border-radius: 6px;
              font-weight: 500;
            }
            
            /* Mobile Modal Splitter */
            .modal-splitter {
              height: 8px;
              touch-action: none;
              background: #2D2D2D;
              cursor: ns-resize;
            }
            .splitter-handle {
              width: 40px;
              height: 3px;
              background: #52525B;
            }
            
            /* Mobile Tab Navigation */
            .tab-navigation {
              overflow-x: auto;
              scrollbar-width: none;
              -ms-overflow-style: none;
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
              flex-shrink: 0;
            }
            .tab-navigation::-webkit-scrollbar {
              display: none;
            }
            .tab-btn {
              padding: 0.875rem 1rem;
              font-size: 0.8rem;
              min-width: 100px;
              white-space: nowrap;
              min-height: 48px;
              font-weight: 500;
            }
            
            /* Mobile Comments & Files */
            .comments-list, .files-list {
              max-height: 200px;
              padding: 0.875rem;
              overflow-y: auto;
            }
            .comment-item {
              margin-bottom: 1rem;
              padding-bottom: 0.75rem;
            }
            .comment-header {
              gap: 0.5rem;
              margin-bottom: 0.5rem;
            }
            .author-avatar, .current-user-avatar {
              width: 32px;
              height: 32px;
              font-size: 0.8rem;
            }
            .comment-content {
              margin-left: 2.5rem;
              font-size: 0.85rem;
              line-height: 1.4;
            }
            .add-comment {
              padding: 1rem;
              background: #141414;
              border-top: 1px solid #2D2D2D;
            }
            .comment-input-container {
              display: flex;
              flex-direction: column;
              gap: 0.75rem;
            }
            .comment-input {
              min-height: 80px;
              font-size: 0.9rem;
              padding: 0.875rem;
              border-radius: 8px;
              border: 2px solid #2D2D2D;
              resize: vertical;
            }
            .comment-input:focus {
              border-color: #3B82F6;
              outline: none;
            }
            .send-comment-btn {
              align-self: stretch;
              padding: 0.875rem;
              justify-content: center;
              font-size: 0.85rem;
              min-height: 44px;
              background: #3B82F6;
              color: #ffffff;
              border: none;
              border-radius: 8px;
              font-weight: 600;
            }
            .files-header {
              padding: 1rem;
              background: #141414;
              border-bottom: 1px solid #2D2D2D;
            }
            .files-header h4 {
              font-size: 0.9rem;
              font-weight: 600;
              margin: 0;
            }
            .upload-btn {
              padding: 0.625rem 1rem;
              font-size: 0.8rem;
              min-height: 40px;
              background: #3B82F6;
              color: #ffffff;
              border: none;
              border-radius: 6px;
              font-weight: 500;
            }
            .file-item {
              padding: 0.875rem;
              border-bottom: 1px solid #2D2D2D;
              display: flex;
              align-items: center;
              gap: 0.75rem;
            }
            .file-item:last-child {
              border-bottom: none;
            }
            .file-icon {
              width: 40px;
              height: 40px;
              background: #2D2D2D;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .file-info {
              flex: 1;
              min-width: 0;
            }
            .file-name {
              font-size: 0.85rem;
              font-weight: 500;
              margin-bottom: 0.25rem;
              word-break: break-word;
            }
            .file-meta {
              font-size: 0.7rem;
              color: #71717A;
              display: flex;
              gap: 0.5rem;
            }
            .file-actions {
              flex-shrink: 0;
            }
            .download-btn {
              padding: 0.5rem;
              font-size: 0.8rem;
              min-height: 36px;
              min-width: 36px;
              background: #1A1A1A;
              border: 1px solid #2D2D2D;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          
          /* Small mobile styles */
          @media (max-width: 480px) {
            .calendar-container,
            .main-content,
            .header,
            .header-content,
            .calendar-content,
            .calendar-grid,
            .calendar-header,
            .calendar-body {
              width: 100vw !important;
              max-width: 100vw !important;
              margin: 0 !important;
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
              box-sizing: border-box !important;
            }
            
            .header {
              padding: 0.875rem 0.5rem;
            }
            .header-title {
              font-size: 1.375rem;
            }
            .calendar-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .stat-item {
              padding: 0.75rem;
            }
            .calendar-nav {
              gap: 0.5rem;
              width: 100% !important;
            }
            .month-year {
              font-size: 0.9rem;
              flex: 1;
              text-align: center;
            }
            .calendar-content {
              padding: 0.5rem !important;
              width: 100vw !important;
              margin: 0 !important;
            }
            .calendar-grid {
              width: calc(100vw - 1rem) !important;
              margin: 0 !important;
            }
            .calendar-cell {
              padding: 0.875rem;
              flex-direction: column;
              align-items: flex-start;
            }
            .day-number {
              align-self: flex-start;
              margin-bottom: 0.75rem;
              margin-right: 0;
            }
            .events-container {
              width: 100%;
            }
            .important-tasks-sidebar {
              margin: 0.75rem;
            }
            .important-tasks-list {
              padding: 0.875rem;
            }
            .important-task-item {
              padding: 0.875rem;
              flex-direction: column;
              gap: 0.75rem;
            }
            .star-btn-large {
              align-self: flex-end;
            }
            .enhanced-task-modal {
              border-radius: 8px 8px 0 0;
              max-height: 95vh;
              height: 95vh;
            }
            .modal-header {
              padding: 0.875rem;
            }
            .modal-header h3 {
              font-size: 0.9rem;
              padding-right: 2rem;
            }
            .close-btn {
              width: 28px;
              height: 28px;
              top: 0.625rem;
              right: 0.625rem;
              font-size: 1rem;
            }
            .task-details-section {
              padding: 0.875rem;
            }
            .task-status-row {
              gap: 0.375rem;
            }
            .status-badge, .priority-badge {
              font-size: 0.65rem;
              padding: 0.3rem 0.6rem;
            }
            .meta-item .label {
              font-size: 0.65rem;
              min-width: 50px;
            }
            .meta-item .value {
              font-size: 0.75rem;
            }
            .status-change-section {
              padding: 0.875rem;
            }
            .status-change-title {
              font-size: 0.8rem;
            }
            .status-change-buttons {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            .status-change-btn {
              padding: 0.75rem;
              font-size: 0.7rem;
            }
            .tab-btn {
              min-width: 80px;
              padding: 0.75rem 0.75rem;
              font-size: 0.75rem;
              min-height: 44px;
            }
            .comment-input {
              min-height: 70px;
              font-size: 0.85rem;
              padding: 0.75rem;
            }
            .send-comment-btn {
              padding: 0.75rem;
              font-size: 0.8rem;
              min-height: 40px;
            }
          }
          
          /* Landscape mobile optimization */
          @media (max-width: 896px) and (orientation: landscape) {
            .enhanced-task-modal {
              height: 90vh;
              max-height: 90vh;
              align-items: center;
              border-radius: 12px;
            }
            .modal-overlay {
              align-items: center;
              padding: 1rem;
            }
            .calendar-stats {
              grid-template-columns: repeat(4, 1fr);
            }
            .important-tasks-sidebar {
              order: 0;
            }
          }
        `
      }} />
      
      <div className="calendar-container">
        <Sidebar 
          projects={projects} 
          onCreateProject={() => {}} 
        />
        
        <div className="page-main main-content">
          <header className="header">
            <div className="header-content">
              <h1 className="header-title">
                <CalendarIcon style={{ width: '32px', height: '32px' }} />
                Meeting Schedule
              </h1>
              
              <div className="header-controls">
                {/* Calendar View Toggle */}
                <div style={{
                  display: 'flex',
                  background: '#1A1A1A',
                  borderRadius: '8px',
                  padding: '4px',
                  border: '1px solid #2D2D2D',
                  gap: '2px'
                }}>
                  {[
                    { key: 'month', label: 'Month' },
                    { key: 'week', label: 'Week' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setCalendarView(key as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: calendarView === key ? '#3B82F6' : 'transparent',
                        color: calendarView === key ? '#FFFFFF' : '#71717A',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '70px'
                      }}
                      onMouseEnter={(e) => {
                        if (calendarView !== key) {
                          e.currentTarget.style.background = '#2D2D2D';
                          e.currentTarget.style.color = '#FFFFFF';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (calendarView !== key) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#71717A';
                        }
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                <div className="calendar-nav">
                  <button onClick={calendarView === 'week' ? previousWeek : previousMonth} className="nav-btn">
                    <ChevronLeftIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                  <div className="month-year">
                    {calendarView === 'week' ? `Week: ${monthNames[currentDate.getMonth()]}` : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                  </div>
                  <button onClick={calendarView === 'week' ? nextWeek : nextMonth} className="nav-btn">
                    <ChevronRightIcon style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
                
                <div className="today-nav">
                  <button 
                    onClick={() => setCurrentDate(new Date())} 
                    className="today-btn"
                    style={{
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Today
                  </button>
                </div>

              </div>
            </div>
            
            <div className="calendar-stats">
              <div className="stat-item">
                <span className="stat-label">Total Meetings</span>
                <span className="stat-value">{tasks.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">This Week</span>
                <span className="stat-value">
                  {tasks.filter(t => {
                    const taskDate = new Date(t.due_date || t.start_date || '');
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    return taskDate >= weekStart && taskDate <= weekEnd;
                  }).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today</span>
                <span className="stat-value">
                  {getTasksForDate(today).length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Upcoming</span>
                <span className="stat-value">
                  {tasks.filter(t => {
                    const taskDate = new Date(t.due_date || t.start_date || '');
                    return taskDate > today;
                  }).length}
                </span>
              </div>
            </div>
          </header>

          <main className="calendar-content">
            {calendarView === 'month' ? (
            <div className="calendar-grid">
              <div className="calendar-header">
                {daysOfWeek.map((day) => (
                  <div key={day} className="calendar-header-cell">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="calendar-body">
                {/* Empty cells for alignment only - no content */}
                {Array.from({ length: firstDay }, (_, index) => (
                  <div key={`empty-${index}`} style={{ minHeight: '140px' }} />
                ))}
                
                {/* Days of the current month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const dayNumber = index + 1;
                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                  const isToday = currentDate.getMonth() === today.getMonth() && 
                                  currentDate.getFullYear() === today.getFullYear() && 
                                  dayNumber === today.getDate();
                  
                  const dayTasks = getTasksForDate(cellDate);
                  
                  return (
                    <div 
                      key={dayNumber} 
                      className={`calendar-cell ${isToday ? 'today' : ''}`}
                      onClick={() => handleDayClick(cellDate)}
                    >
                      <div className="day-number">{dayNumber}</div>
                      <div className="events-container">
                        {(dayTasks || []).slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`task-item ${task.is_important ? 'important' : ''} ${isOverdue(task.due_date) ? 'overdue' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskModalOpen(task, cellDate.toISOString().split('T')[0]);
                            }}
                          >
                            <div className="task-header">
                              <span className="task-name">{task.name}</span>
                              <div className="task-icons">
                                {getPriorityIcon(task.priority)}
                              </div>
                            </div>
                            <div className="task-meta">
                              <span className="project-name" style={{ color: '#FFFFFF' }}>
                                {task.project_name}
                              </span>
                              {task.assignee && (
                                <span className="assignee">
                                  <UserIcon style={{ width: '10px', height: '10px' }} />
                                  {task.assignee.name ? task.assignee.name.split(' ')[0] : 'Unknown'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {(dayTasks || []).length > 3 && (
                          <div 
                            className="more-tasks"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowMoreTasks(cellDate, dayTasks || []);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            +{(dayTasks || []).length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            ) : calendarView === 'week' ? (
              // Week View - Large rounded boxes for each day
              <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const weekStart = new Date(currentDate);
                    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
                    const dayTasks = getTasksForDate(weekStart);
                    const isToday = weekStart.toDateString() === today.toDateString();
                    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayIndex];
                    const dayNumber = weekStart.getDate();
                  
                  return (
                      <div
                        key={dayIndex}
                        onClick={() => handleDayClick(weekStart)}
                        style={{
                          background: '#141414',
                          borderRadius: '24px',
                          padding: '1.5rem',
                          minHeight: '280px',
                          border: isToday ? '2px solid #3B82F6' : '1px solid #2D2D2D',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => {
                          if (!isToday) e.currentTarget.style.borderColor = '#3D3D3D';
                        }}
                        onMouseLeave={(e) => {
                          if (!isToday) e.currentTarget.style.borderColor = '#2D2D2D';
                        }}
                      >
                        {/* Day name */}
                        <div style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: '#71717A',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem'
                        }}>
                          {dayName.slice(0, 3)}
                        </div>
                        
                        {/* Day number */}
                        <div style={{ 
                          fontSize: '2rem', 
                          fontWeight: 700, 
                          color: isToday ? '#3B82F6' : '#FFFFFF',
                          marginBottom: '1rem'
                        }}>
                          {dayNumber}
                        </div>
                        
                        {/* Tasks */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                          {dayTasks.slice(0, 4).map((task) => (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskModalOpen(task, weekStart.toISOString().split('T')[0]);
                              }}
                              style={{
                                background: task.priority === 'high' ? 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' :
                                           task.priority === 'urgent' ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' :
                                           'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                                padding: '0.75rem',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ 
                                fontSize: '0.8125rem', 
                                fontWeight: 600, 
                                color: '#FFFFFF',
                                marginBottom: '0.25rem',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {task.name}
                              </div>
                              {task.start_date && (
                                <div style={{ 
                                  fontSize: '0.6875rem', 
                                  color: 'rgba(255,255,255,0.8)',
                                  fontWeight: 500
                                }}>
                                  @ {new Date(task.start_date).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                          {dayTasks.length > 4 && (
                            <div style={{
                              fontSize: '0.75rem',
                              color: '#71717A',
                              textAlign: 'center',
                              padding: '0.5rem',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowMoreTasks(weekStart, dayTasks);
                            }}
                            >
                              +{dayTasks.length - 4} more
                            </div>
                          )}
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
            ) : null}

            {/* Meeting Detail Modal */}
            {showMeetingDetail && selectedMeeting && (
              <MeetingDetailModal
                meeting={selectedMeeting}
                occurrenceDate={selectedOccurrenceDate}
                onClose={() => {
                  setShowMeetingDetail(false);
                  setSelectedMeeting(null);
                  setSelectedOccurrenceDate(null);
                }}
                onUpdate={handleUpdateMeeting}
                onDelete={handleDeleteMeeting}
                projectMembers={projectMembers}
                projects={projects}
                onProjectChange={handleProjectChange}
              />
            )}
            
            {/* Day Tasks Modal */}
            {showDayTasks && selectedDayDate && (
              <div className="modal-overlay" onClick={() => {
                setShowDayTasks(false);
                setSelectedDayDate(null);
                setSelectedDayTasks([]);
              }}>
                <div className="enhanced-task-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>
                      Tasks for {selectedDayDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDayTasks(false);
                        setSelectedDayDate(null);
                        setSelectedDayTasks([]);
                      }}
                      className="close-btn"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="task-details-section" style={{ maxHeight: '100%', overflow: 'auto' }}>
                    {selectedDayTasks.length === 0 ? (
                      <div className="empty-comments">
                        <p>No tasks scheduled for this day</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {selectedDayTasks.map(task => (
                          <div 
                            key={task.id} 
                            className="task-item"
                            style={{
                              padding: '1rem',
                              border: '2px solid #2D2D2D',
                              borderRadius: '8px',
                              background: '#1A1A1A',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              borderLeft: `4px solid ${getStatusColor(task.status)}`
                            }}
                            onClick={() => {
                              const dayDate = selectedDayDate ? selectedDayDate.toISOString().split('T')[0] : undefined;
                              setShowDayTasks(false);
                              setSelectedDayDate(null);
                              setSelectedDayTasks([]);
                              handleTaskModalOpen(task, dayDate);
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = '#1F1F1F';
                              e.currentTarget.style.borderColor = '#3B82F6';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = '#1A1A1A';
                              e.currentTarget.style.borderColor = '#2D2D2D';
                            }}
                          >
                            <div className="task-status-row">
                              <span className={`status-badge status-${task.status}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className={`priority-badge priority-${task.priority}`}>
                                {getPriorityIcon(task.priority)}
                                {task.priority}
                              </span>
                            </div>
                            
                            <div style={{ marginBottom: '0.75rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#FFFFFF' }}>
                                {task.name}
                              </h4>
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#A1A1AA' }}>
                                {task.project_name}
                              </p>
                            </div>
                            
                            {task.description && (
                              <p style={{ 
                                margin: '0.5rem 0', 
                                fontSize: '0.875rem', 
                                color: '#E4E4E7', 
                                lineHeight: '1.4' 
                              }}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="task-metadata">
                              {task.assignee && (
                                <div className="meta-item">
                                  <span className="label">Assigned to:</span>
                                  <span className="value">{task.assignee.name}</span>
                                </div>
                              )}
                              {task.estimated_hours && (
                                <div className="meta-item">
                                  <span className="label">Estimated:</span>
                                  <span className="value">{task.estimated_hours}h</span>
                                </div>
                              )}
                              {task.tags_list && task.tags_list.length > 0 && (
                                <div className="meta-item">
                                  <span className="label">Tags:</span>
                                  <div className="tags">
                                    {task.tags_list.map((tag, index) => (
                                      <span key={index} className="tag">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Meeting Modal */}
            {showCreateMeeting && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                }}
                onClick={() => setShowCreateMeeting(false)}
              >
                <div
                  style={{
                    background: '#1A1A1A',
                    borderRadius: '16px',
                    width: '600px',
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header with gradient */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, #FF9A6C 0%, #C77DFF 100%)',
                    padding: '24px',
                    position: 'relative',
                  }}>
                    <button
                      onClick={() => setShowCreateMeeting(false)}
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <XMarkIcon style={{ width: '24px', height: '24px' }} />
                    </button>
                    <h3 style={{ 
                      color: '#FFFFFF', 
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      marginBottom: '4px',
                      marginTop: 0,
                    }}>
                      Schedule Meeting
                    </h3>
                    {selectedDayDate && (
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: '#FFFFFF', 
                        opacity: 0.9,
                      }}>
                        {selectedDayDate.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                    )}
                  </div>

                  {/* Body - scrollable */}
                  <div style={{ 
                    padding: '24px',
                    overflowY: 'auto',
                    flex: 1,
                    background: '#141414',
                  }}>
                    {/* Meeting Title */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '8px' 
                      }}>
                        <DocumentTextIcon style={{ width: '18px', height: '18px', color: '#FF9A6C' }} />
                        Meeting Title *
                      </label>
                      <input
                        type="text"
                        value={newMeeting.title}
                        onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                        placeholder="Enter meeting title"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.9375rem',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                      />
                    </div>

                    {/* Project */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '8px' 
                      }}>
                        <FolderIcon style={{ width: '18px', height: '18px', color: '#FF9A6C' }} />
                        Project
                      </label>
                      <select
                        value={newMeeting.project_id || ''}
                        onChange={(e) => handleProjectChange(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.9375rem',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                      >
                        <option value="">Select a project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Description */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '8px' 
                      }}>
                        <ListBulletIcon style={{ width: '18px', height: '18px', color: '#FF9A6C' }} />
                        Description
                      </label>
                      <textarea
                        value={newMeeting.description}
                        onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                        placeholder="Add meeting description..."
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.9375rem',
                          outline: 'none',
                          resize: 'vertical',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                      />
                    </div>

                    {/* Date, Time, Duration Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#E4E4E7', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          marginBottom: '8px' 
                        }}>
                          <CalendarIcon style={{ width: '16px', height: '16px', color: '#C77DFF' }} />
                          Date
                        </label>
                        <input
                          type="date"
                          value={newMeeting.start_date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, start_date: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#141414',
                            border: '1px solid #3D3D3D',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            outline: 'none',
                            colorScheme: 'dark',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#E4E4E7', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          marginBottom: '8px' 
                        }}>
                          <ClockIcon style={{ width: '16px', height: '16px', color: '#C77DFF' }} />
                          Time
                        </label>
                        <input
                          type="time"
                          value={newMeeting.start_time}
                          onChange={(e) => setNewMeeting({ ...newMeeting, start_time: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#141414',
                            border: '1px solid #3D3D3D',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            outline: 'none',
                            colorScheme: 'dark',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                        />
                      </div>
                      <div>
                        <label style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#E4E4E7', 
                          fontSize: '0.875rem', 
                          fontWeight: 600,
                          marginBottom: '8px' 
                        }}>
                          <ClockIcon style={{ width: '16px', height: '16px', color: '#C77DFF' }} />
                          Duration
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number"
                            value={newMeeting.duration}
                            onChange={(e) => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) || 60 })}
                            min="15"
                            step="15"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              paddingRight: '45px',
                              background: '#141414',
                              border: '1px solid #3D3D3D',
                              borderRadius: '8px',
                              color: '#FFFFFF',
                              fontSize: '0.875rem',
                              outline: 'none',
                            }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                          />
                          <span style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#71717A',
                            fontSize: '0.875rem',
                            pointerEvents: 'none',
                          }}>
                            min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timezone Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                      <div>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginBottom: '8px'
                        }}>
                          <ClockIcon style={{ width: '16px', height: '16px', color: '#C77DFF' }} />
                          Input Timezone
                        </label>
                        <select
                          value={newMeeting.timezone}
                          onChange={(e) => setNewMeeting({ ...newMeeting, timezone: e.target.value as TimezoneKey })}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#141414',
                            border: '1px solid #3D3D3D',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                        >
                          {TIMEZONE_KEYS.map(tz => (
                            <option key={tz} value={tz}>{TIMEZONES[tz].label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginBottom: '8px',
                          display: 'block',
                        }}>
                          Also show in:
                        </label>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', padding: '10px 0' }}>
                          {TIMEZONE_KEYS.map(tz => (
                            <label key={tz} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#A1A1AA', fontSize: '0.875rem' }}>
                              <input
                                type="checkbox"
                                checked={newMeeting.display_timezones.includes(tz)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setNewMeeting(prev => ({
                                    ...prev,
                                    display_timezones: checked
                                      ? [...prev.display_timezones, tz]
                                      : prev.display_timezones.filter(t => t !== tz)
                                  }));
                                }}
                                style={{ cursor: 'pointer', accentColor: '#C77DFF' }}
                              />
                              <span style={{ color: TIMEZONES[tz].color, fontWeight: '600' }}>{TIMEZONES[tz].shortLabel}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Time Preview */}
                    {newMeeting.start_time && (
                      <div style={{
                        marginBottom: '20px',
                        padding: '12px 14px',
                        background: '#1A1A1A',
                        borderRadius: '8px',
                        border: '1px solid #3D3D3D',
                      }}>
                        {(() => {
                          const { time: ukTime } = convertToUK(newMeeting.start_time, newMeeting.timezone);
                          const displayTimes = getDisplayTimes(ukTime, newMeeting.display_timezones);
                          return displayTimes.map(dt => (
                            <div key={dt.timezone} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <span style={{ fontWeight: '700', color: dt.config.color, fontSize: '12px', minWidth: '24px' }}>{dt.config.shortLabel}</span>
                              <span style={{ color: dt.config.color, fontWeight: '500', fontSize: '13px' }}>{dt.formatted}</span>
                              {dt.dateLabel && <span style={{ color: '#EF4444', fontSize: '11px', fontWeight: '600' }}>{dt.dateLabel}</span>}
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Recurring Meeting Toggle */}
                    <div style={{ 
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      background: '#141414',
                      border: '1px solid #3D3D3D',
                      borderRadius: '8px',
                    }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                      }}>
                        <ArrowPathIcon style={{ width: '18px', height: '18px', color: '#FF9A6C' }} />
                        Recurring Meeting
                      </label>
                      <div
                        onClick={() => setNewMeeting({ ...newMeeting, recurring: !newMeeting.recurring })}
                        style={{
                          width: '48px',
                          height: '24px',
                          background: newMeeting.recurring ? '#C77DFF' : '#3D3D3D',
                          borderRadius: '12px',
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                        }}
                      >
                        <div style={{
                          width: '20px',
                          height: '20px',
                          background: '#FFFFFF',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: '2px',
                          left: newMeeting.recurring ? '26px' : '2px',
                          transition: 'left 0.2s',
                        }} />
                      </div>
                    </div>

                    {/* Recurring End Date - shown when recurring is enabled */}
                    {newMeeting.recurring && (
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          color: '#E4E4E7',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          marginBottom: '8px'
                        }}>
                          <CalendarIcon style={{ width: '18px', height: '18px', color: '#FF9A6C' }} />
                          End Date
                        </label>
                        <input
                          type="date"
                          value={newMeeting.recurring_end_date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, recurring_end_date: e.target.value })}
                          min={newMeeting.start_date || undefined}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            background: '#141414',
                            border: '1px solid #3D3D3D',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.9375rem',
                            outline: 'none',
                            colorScheme: 'dark',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                        />
                      </div>
                    )}

                    {/* Attendees Section */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '12px' 
                      }}>
                        <UserGroupIcon style={{ width: '18px', height: '18px', color: '#C77DFF' }} />
                        Attendees
                      </label>
                      <div style={{
                        background: '#141414',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        padding: '12px',
                      }}>
                        {!newMeeting.project_id ? (
                          <p style={{ 
                            color: '#71717A', 
                            fontSize: '0.875rem',
                            margin: 0,
                            fontStyle: 'italic',
                          }}>
                            Select a project first to see team members
                          </p>
                        ) : projectMembers.length === 0 ? (
                          <p style={{ 
                            color: '#71717A', 
                            fontSize: '0.875rem',
                            margin: 0,
                            fontStyle: 'italic',
                          }}>
                            No team members found for this project
                          </p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {projectMembers.map((member) => (
                              <label 
                                key={member.id}
                                style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  cursor: 'pointer',
                                  padding: '8px',
                                  borderRadius: '6px',
                                  transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2D2D2D'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <input
                                  type="checkbox"
                                  checked={newMeeting.attendee_ids.includes(member.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewMeeting({
                                        ...newMeeting,
                                        attendee_ids: [...newMeeting.attendee_ids, member.id]
                                      });
                                    } else {
                                      setNewMeeting({
                                        ...newMeeting,
                                        attendee_ids: newMeeting.attendee_ids.filter(id => id !== member.id)
                                      });
                                    }
                                  }}
                                  style={{
                                    width: '18px',
                                    height: '18px',
                                    cursor: 'pointer',
                                  }}
                                />
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '50%',
                                  background: '#C77DFF',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#FFFFFF',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                }}>
                                  {member.name?.charAt(0)?.toUpperCase() || member.email?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ 
                                    color: '#FFFFFF', 
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                  }}>
                                    {member.name || 'Unknown User'}
                                  </div>
                                  <div style={{ 
                                    color: '#71717A', 
                                    fontSize: '0.75rem',
                                  }}>
                                    {member.email}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meeting Agenda Section */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '12px' 
                      }}>
                        <ClipboardDocumentListIcon style={{ width: '18px', height: '18px', color: '#3B82F6' }} />
                        Meeting Agenda
                      </label>
                      
                      {/* Info banner */}
                      <div style={{
                        background: 'rgba(251, 191, 36, 0.1)',
                        border: '1px solid #FCD34D',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '12px',
                        fontSize: '0.875rem',
                        color: '#FCD34D',
                      }}>
                        💡 Add agenda items to keep your meeting focused
                      </div>

                      {/* Add agenda item */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="text"
                          value={newAgendaItem}
                          onChange={(e) => setNewAgendaItem(e.target.value)}
                          placeholder="Add an agenda item..."
                          style={{
                            flex: 1,
                            padding: '10px 12px',
                            background: '#141414',
                            border: '1px solid #3D3D3D',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            outline: 'none',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newAgendaItem.trim()) {
                              setNewMeeting({
                                ...newMeeting,
                                agenda_items: [...newMeeting.agenda_items, newAgendaItem.trim()]
                              });
                              setNewAgendaItem('');
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            if (newAgendaItem.trim()) {
                              setNewMeeting({
                                ...newMeeting,
                                agenda_items: [...newMeeting.agenda_items, newAgendaItem.trim()]
                              });
                              setNewAgendaItem('');
                            }
                          }}
                          style={{
                            padding: '10px 16px',
                            background: '#C77DFF',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#FFFFFF',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#B366FF'}
                          onMouseLeave={(e) => e.currentTarget.style.background = '#C77DFF'}
                        >
                          Add
                        </button>
                      </div>

                      {/* Agenda items list */}
                      {newMeeting.agenda_items.length > 0 && (
                        <div style={{
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          padding: '8px',
                        }}>
                          {newMeeting.agenda_items.map((item, index) => (
                            <div 
                              key={index}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px',
                                borderRadius: '6px',
                                background: '#2D2D2D',
                                marginBottom: index < newMeeting.agenda_items.length - 1 ? '6px' : 0,
                              }}
                            >
                              <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#E0E7FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#4F46E5',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                flexShrink: 0,
                              }}>
                                {index + 1}
                              </div>
                              <span style={{ 
                                flex: 1,
                                color: '#E4E4E7',
                                fontSize: '0.875rem',
                              }}>
                                {item}
                              </span>
                              <button
                                onClick={() => {
                                  setNewMeeting({
                                    ...newMeeting,
                                    agenda_items: newMeeting.agenda_items.filter((_, i) => i !== index)
                                  });
                                }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#EF4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <TrashIcon style={{ width: '16px', height: '16px' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meeting Link */}
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '8px' 
                      }}>
                        <VideoCameraIcon style={{ width: '18px', height: '18px', color: '#10B981' }} />
                        Meeting Link
                      </label>
                      <input
                        type="url"
                        value={newMeeting.meeting_link}
                        onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                        placeholder="https://zoom.us/j/... or meet.google.com/..."
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.9375rem',
                          outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                      />
                    </div>

                    {/* Email Reminder */}
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#E4E4E7', 
                        fontSize: '0.875rem', 
                        fontWeight: 600,
                        marginBottom: '8px' 
                      }}>
                        <BellIcon style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                        Email Reminder
                      </label>
                      <select
                        value={newMeeting.reminder_time}
                        onChange={(e) => setNewMeeting({ ...newMeeting, reminder_time: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          background: '#141414',
                          border: '1px solid #3D3D3D',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '0.9375rem',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#C77DFF'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#3D3D3D'}
                      >
                        <option value="15">15 min before</option>
                        <option value="30">30 min before</option>
                        <option value="60">1 hour before</option>
                        <option value="1440">1 day before</option>
                      </select>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div style={{ 
                    padding: '16px 24px',
                    background: '#141414',
                    borderTop: '1px solid #2D2D2D',
                    display: 'flex', 
                    gap: '12px', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      onClick={() => setShowCreateMeeting(false)}
                      style={{
                        padding: '10px 20px',
                        background: '#141414',
                        border: '1px solid #3D3D3D',
                        borderRadius: '8px',
                        color: '#E4E4E7',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#2D2D2D';
                        e.currentTarget.style.borderColor = '#71717A';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#141414';
                        e.currentTarget.style.borderColor = '#3D3D3D';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createMeeting}
                      disabled={!newMeeting.title.trim()}
                      style={{
                        padding: '10px 24px',
                        background: newMeeting.title.trim() 
                          ? 'linear-gradient(135deg, #FF9A6C 0%, #C77DFF 100%)' 
                          : '#3D3D3D',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: newMeeting.title.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (newMeeting.title.trim()) {
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newMeeting.title.trim()) {
                          e.currentTarget.style.opacity = '1';
                        }
                      }}
                    >
                      Schedule Meeting
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Meeting Detail Modal */}
            {showMeetingDetail && selectedMeeting && (
              <MeetingDetailModal
                meeting={selectedMeeting}
                occurrenceDate={selectedOccurrenceDate}
                onClose={() => {
                  setShowMeetingDetail(false);
                  setSelectedMeeting(null);
                  setSelectedOccurrenceDate(null);
                }}
                onUpdate={handleUpdateMeeting}
                onDelete={handleDeleteMeeting}
                projectMembers={projectMembers}
                projects={projects}
                onProjectChange={handleProjectChange}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
} 