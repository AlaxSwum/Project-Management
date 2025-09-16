'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { projectService, meetingService, userService, taskService } from '@/lib/api-compatibility';
import {
  ClockIcon,
  PlusIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import DatePicker from '@/components/DatePicker';
import MeetingDetailModal from '@/components/MeetingDetailModal';
import MobileHeader from '@/components/MobileHeader';

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // in minutes
  project?: number;
  project_id?: number;
  project_name: string;
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  attendees?: string;
  attendees_list?: string[];
  attendee_ids?: number[]; // Add this field for proper attendee assignment
  event_type?: string; // Add this field to distinguish personal vs project events
}

export default function TimetablePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [accessibleProjectIds, setAccessibleProjectIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showMeetingDetail, setShowMeetingDetail] = useState(false);
  const [selectedProject, setSelectedProject] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDayMeetings, setShowDayMeetings] = useState(false);
  const [selectedDayMeetings, setSelectedDayMeetings] = useState<Meeting[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    project_id: 0,
    attendees: '',
    attendee_ids: [] as number[],
  });

  useEffect(() => {
    // Don't redirect if auth is still loading
    if (authLoading) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, authLoading, router]);

  // Fetch project members when project changes in the form
  useEffect(() => {
    if (newMeeting.project_id > 0) {
      fetchProjectMembers(newMeeting.project_id);
      // Reset attendee selection when project changes
      setNewMeeting(prev => ({ ...prev, attendee_ids: [] }));
    } else {
      setProjectMembers([]);
    }
  }, [newMeeting.project_id]);

  const fetchData = async () => {
    try {
      const [projectsData, meetingsData, usersData, userTasks] = await Promise.all([
        projectService.getProjects(),
        meetingService.getMeetings(),
        projectService.getUsers(),
        taskService.getUserTasks()
      ]);
      
      // Use all projects the user has access to (same as dashboard)
      // The projectService.getProjects() already filters based on user access
      const accessibleProjects = new Set<number>();
      projectsData.forEach((project: any) => {
        accessibleProjects.add(project.id);
      });
      
      // Also track projects where user has task involvement for meeting access control
      userTasks.forEach((task: any) => {
        if (task.assignee?.id === user?.id || task.created_by?.id === user?.id) {
          accessibleProjects.add(task.project_id);
        }
      });
      
      // Filter meetings for visibility - show meetings where user is:
      // 1. The creator of the meeting, OR 
      // 2. Listed as an attendee by ID (attendee_ids), OR
      // 3. Listed as an attendee by name/email (attendees), OR  
      // 4. Has access to the project AND is specifically assigned
      const filteredMeetings = meetingsData.filter((meeting: Meeting) => {
        const projectId = meeting.project_id || meeting.project;
        
        // PERSONAL EVENTS (event_type === 'personal'): Only show to creator
        if (meeting.event_type === 'personal') {
          return meeting.created_by?.id === user?.id;
        }
        
        // PERSONAL EVENTS (no project_id): Only show to creator (legacy support)
        if (!projectId) {
          return meeting.created_by?.id === user?.id;
        }
        
        // PROJECT MEETINGS: Must have project access first
        if (!accessibleProjects.has(projectId)) {
          return false;
        }
        
        // Show if user created the meeting
        if (meeting.created_by?.id === user?.id) {
          return true;
        }
        
        // IMPORTANT: Check if user is assigned via attendee_ids (primary method)
        if (meeting.attendee_ids && Array.isArray(meeting.attendee_ids) && user?.id && meeting.attendee_ids.includes(user.id)) {
          return true;
        }
        
        // Fallback: Check if user is in attendees string/list (legacy method)
        const attendeesList = meeting.attendees_list || 
          (meeting.attendees ? meeting.attendees.split(',').map(a => a.trim()) : []);
        
        const userInAttendees = attendeesList.some(attendee => 
          attendee.toLowerCase().includes(user?.name?.toLowerCase() || '') ||
          attendee.toLowerCase().includes(user?.email?.toLowerCase() || '')
        );
        
        if (userInAttendees) {
          return true;
        }
        
        // Don't show meetings where user is not explicitly involved
        return false;
      });
      
      setAccessibleProjectIds(accessibleProjects);
      setProjects(projectsData);
      setMeetings(filteredMeetings);
      setUsers(usersData);
    } catch (err: any) {
      setError('Failed to fetch data');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectMembers = async (projectId: number) => {
    try {
      const members = await projectService.getProjectMembers(projectId);
      setProjectMembers(members);
    } catch (err: any) {
      console.error('Error fetching project members:', err);
      setProjectMembers([]);
    }
  };

  const handleCreateProject = () => {
    // This would typically open a create project modal
    console.log('Create project clicked');
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMeeting.title.trim() || !newMeeting.date || !newMeeting.time || !newMeeting.project_id) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if user has access to the selected project
    if (!accessibleProjectIds.has(newMeeting.project_id)) {
      setError('You do not have access to create meetings for this project');
      return;
    }

    try {
      const meetingData = {
        title: newMeeting.title.trim(),
        description: newMeeting.description.trim(),
        project: newMeeting.project_id,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: newMeeting.duration,
        attendees: newMeeting.attendees,
        attendee_ids: newMeeting.attendee_ids.length > 0 ? newMeeting.attendee_ids : undefined,
      };

      const createdMeeting = await meetingService.createMeeting(meetingData);
      setMeetings([createdMeeting, ...meetings]);
      
      setNewMeeting({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        project_id: 0,
        attendees: '',
        attendee_ids: [],
      });
      setShowCreateForm(false);
      setError('');
    } catch (err: any) {
      setError('Failed to create meeting');
    }
  };

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setShowMeetingDetail(true);
  };

  const handleUpdateMeetingFromDetail = async (meetingData: any) => {
    if (!selectedMeeting) return;

    // Check if user has access to update this meeting
    const projectId = selectedMeeting.project_id || selectedMeeting.project;
    if (!projectId || !accessibleProjectIds.has(projectId)) {
      setError('You do not have access to update this meeting');
      return;
    }

    try {
      const updatedMeeting = await meetingService.updateMeeting(selectedMeeting.id, {
        title: meetingData.title.trim(),
        description: meetingData.description.trim(),
        date: meetingData.date,
        time: meetingData.time,
        duration: meetingData.duration,
        attendees: meetingData.attendees,
      });
      
      setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
      setSelectedMeeting(updatedMeeting);
      setError('');
    } catch (err: any) {
      setError('Failed to update meeting');
    }
  };

  const handleDeleteMeetingFromDetail = async (meetingId: number) => {
    try {
      // Check access (already done in the main delete handler)
      await handleDeleteMeeting(meetingId);
      setShowMeetingDetail(false);
      setSelectedMeeting(null);
    } catch (err: any) {
      // Error already handled in handleDeleteMeeting
    }
  };

  const handleEditMeeting = (meeting: Meeting) => {
    // Check if user has access to edit this meeting
    const projectId = meeting.project_id || meeting.project;
    if (!projectId || !accessibleProjectIds.has(projectId)) {
      setError('You do not have access to edit this meeting');
      return;
    }

    setEditingMeeting(meeting);
    setNewMeeting({
      title: meeting.title,
      description: meeting.description,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      project_id: meeting.project_id || meeting.project || 0,
      attendees: meeting.attendees_list ? meeting.attendees_list.join(', ') : meeting.attendees || '',
      attendee_ids: [],
    });
    setShowCreateForm(true);
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMeeting) return;

    // Check if user has access to the selected project
    if (!accessibleProjectIds.has(newMeeting.project_id)) {
      setError('You do not have access to update meetings for this project');
      return;
    }

    try {
      const meetingData = {
        title: newMeeting.title.trim(),
        description: newMeeting.description.trim(),
        project: newMeeting.project_id,
        date: newMeeting.date,
        time: newMeeting.time,
        duration: newMeeting.duration,
        attendees: newMeeting.attendees,
        attendee_ids: newMeeting.attendee_ids.length > 0 ? newMeeting.attendee_ids : undefined,
      };

      const updatedMeeting = await meetingService.updateMeeting(editingMeeting.id, meetingData);
      setMeetings(meetings.map(m => m.id === editingMeeting.id ? updatedMeeting : m));
      
      setEditingMeeting(null);
      setNewMeeting({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        project_id: 0,
        attendees: '',
        attendee_ids: [],
      });
      setShowCreateForm(false);
      setError('');
    } catch (err: any) {
      setError('Failed to update meeting');
    }
  };

  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      // Find the meeting to check access
      const meeting = meetings.find(m => m.id === meetingId);
      if (!meeting) {
        setError('Meeting not found');
        return;
      }

      const projectId = meeting.project_id || meeting.project;
      if (!projectId || !accessibleProjectIds.has(projectId)) {
        setError('You do not have access to delete this meeting');
        return;
      }

      await meetingService.deleteMeeting(meetingId);
      setMeetings(meetings.filter(m => m.id !== meetingId));
    } catch (err: any) {
      setError('Failed to delete meeting');
    }
  };

  const formatDate = (dateString: string) => {
    // Parse date string manually to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const filteredMeetings = meetings;

  const upcomingMeetings = filteredMeetings.filter(m => {
    // Parse date and time manually to avoid timezone issues
    const [year, month, day] = m.date.split('-').map(Number);
    const [hours, minutes] = m.time.split(':').map(Number);
    const meetingDateTime = new Date(year, month - 1, day, hours, minutes);
    return meetingDateTime >= new Date();
  }).sort((a, b) => {
    const [yearA, monthA, dayA] = a.date.split('-').map(Number);
    const [hoursA, minutesA] = a.time.split(':').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
    
    const [yearB, monthB, dayB] = b.date.split('-').map(Number);
    const [hoursB, minutesB] = b.time.split(':').map(Number);
    const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
    
    return dateA.getTime() - dateB.getTime();
  });

  const pastMeetings = filteredMeetings.filter(m => {
    // Parse date and time manually to avoid timezone issues
    const [year, month, day] = m.date.split('-').map(Number);
    const [hours, minutes] = m.time.split(':').map(Number);
    const meetingDateTime = new Date(year, month - 1, day, hours, minutes);
    return meetingDateTime < new Date();
  }).sort((a, b) => {
    const [yearA, monthA, dayA] = a.date.split('-').map(Number);
    const [hoursA, minutesA] = a.time.split(':').map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA, hoursA, minutesA);
    
    const [yearB, monthB, dayB] = b.date.split('-').map(Number);
    const [hoursB, minutesB] = b.time.split(':').map(Number);
    const dateB = new Date(yearB, monthB - 1, dayB, hoursB, minutesB);
    
    return dateB.getTime() - dateA.getTime();
  });

  // Calendar helper functions
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

  const getMeetingsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return filteredMeetings.filter(meeting => meeting.date === dateStr);
  };



  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

  const getAttendeesList = (meeting: Meeting) => {
    if (meeting.attendees_list && meeting.attendees_list.length > 0) {
      return meeting.attendees_list;
    }
    if (meeting.attendees && typeof meeting.attendees === 'string') {
      return meeting.attendees.split(',').map(a => a.trim()).filter(a => a);
    }
    return [];
  };

  const handleShowMoreMeetings = (date: Date, meetings: Meeting[]) => {
    setSelectedDayDate(date);
    setSelectedDayMeetings(meetings);
    setShowDayMeetings(true);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <MobileHeader title="Timetable" isMobile={isMobile} />
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #F5F5ED;
          }
          .timetable-container {
            min-height: 100vh;
            display: flex;
            background: #F5F5ED;
            max-width: 100vw;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .main-content {
            flex: 1;
            margin-left: ${isMobile ? '0' : '280px'};
            background: transparent;
            max-width: ${isMobile ? '100vw' : 'calc(100vw - 280px)'};
            overflow-x: hidden;
            box-sizing: border-box;
            position: relative;
            z-index: 1;
            padding-top: ${isMobile ? '70px' : '0'};
            padding-left: ${isMobile ? '12px' : '0'};
            padding-right: ${isMobile ? '12px' : '0'};
          }
          .header {
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(30px);
            border-bottom: none;
            padding: 2.5rem 2rem 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 20;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            box-sizing: border-box;
            width: 100%;
            overflow-x: hidden;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            max-width: 1200px;
            margin-left: auto;
            margin-right: auto;
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
          }
          .header-title {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1F2937;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            letter-spacing: -0.02em;
            line-height: 1.2;
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
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            color: #1F2937;
            border: 2px solid rgba(196, 131, 217, 0.3);
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
            background: linear-gradient(90deg, transparent, rgba(196, 131, 217, 0.1), transparent);
            transition: left 0.6s ease;
          }
          
          .filter-btn:hover {
            background: rgba(196, 131, 217, 0.1);
            border-color: #C483D9;
            transform: translateY(-3px) scale(1.02);
            box-shadow: 0 8px 25px rgba(196, 131, 217, 0.25);
          }
          
          .filter-btn:hover::before {
            left: 100%;
          }
          
          .filter-btn.active {
            background: linear-gradient(135deg, #C483D9, #E5A3F0);
            color: #FFFFFF;
            border-color: #C483D9;
            box-shadow: 0 8px 25px rgba(196, 131, 217, 0.35);
          }
          .create-button {
            background: linear-gradient(135deg, #5884FD, #7BA3FF);
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 16px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: all 0.3s ease;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            font-size: 0.875rem;
            box-shadow: 0 4px 16px rgba(88, 132, 253, 0.3);
          }
          .create-button:hover {
            background: linear-gradient(135deg, #4A6CF7, #5884FD);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(88, 132, 253, 0.4);
          }
          .filter-section {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          .filter-select {
            padding: 0 0.5rem;
            border: 2px solid #000000;
            border-radius: 4px;
            background: #ffffff;
            color: #000000;
            font-weight: 500;
            height: 40px;
            box-sizing: border-box;
            line-height: 36px;
          }
          .main-content-area {
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
            box-sizing: border-box;
            min-height: calc(100vh - 200px);
            line-height: 1.6;
          }
          .error-message {
            background: #ffffff;
            border: 1px solid #F87239;
            color: #F87239;
            padding: 1rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(248, 114, 57, 0.1);
          }
          
          .timetable-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            padding-top: 1.5rem;
            max-width: 1000px;
            margin: 0 auto;
          }
          
          .timetable-stats .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            background: #FFFFFF;
            padding: 1.25rem 1rem;
            border-radius: 16px;
            border: 1px solid #E5E7EB;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .timetable-stats .stat-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-color: #5884FD;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #6B7280;
            font-weight: 500;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .stat-value {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1F2937;
            font-family: 'Mabry Pro', 'Inter', sans-serif;
            letter-spacing: -0.01em;
          }
          
          .stat-value.upcoming {
            color: #5884FD;
          }
          
          .stat-value.total {
            color: #FFB333;
          }
          .meetings-section {
            margin-bottom: 2rem;
          }
          .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #000000;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .meetings-grid {
            display: grid;
            gap: 1rem;
          }
          /* Desktop Styles */
          @media (min-width: 1025px) {
            .header {
              padding: 2rem 2.5rem;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border-bottom: 3px solid #000000;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .header-content {
              max-width: 1400px;
              margin: 0 auto;
              align-items: flex-start;
              gap: 1.5rem;
            }
            
            .header-title {
              font-size: 2rem;
              gap: 1rem;
              margin-bottom: 0.5rem;
            }
            
            .header-title + p {
              font-size: 1rem;
              color: #666666;
              margin: 0;
              font-weight: 500;
            }
            
            .header-actions {
              display: flex;
              gap: 1.5rem;
              align-items: center;
              max-width: none;
              width: auto;
              margin-left: auto;
            }
            
            .filter-section {
              display: flex;
              align-items: center;
              min-width: 200px;
            }
            
            .filter-select {
              padding: 0 1rem;
              font-size: 0.9rem;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              background: #ffffff;
              transition: all 0.2s ease;
              min-width: 180px;
              height: 48px;
              box-sizing: border-box;
              font-weight: 600;
              line-height: 1;
            }
            
            .filter-select:hover {
              border-color: #6b7280;
            }
            
            .filter-select:focus {
              outline: none;
              border-color: #000000;
              box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
            }
            
            .action-buttons-row {
              display: flex;
              gap: 1rem;
              align-items: center;
            }
            
            .view-toggle {
              display: flex;
              background: #f8f9fa;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              transition: all 0.2s ease;
              height: 48px;
              box-sizing: border-box;
            }
            
            .view-toggle:hover {
              border-color: #6b7280;
            }
            
            .view-toggle button {
              padding: 0 1.25rem;
              border: none;
              background: transparent;
              font-size: 0.9rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              color: #6b7280;
              height: 44px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-sizing: border-box;
            }
            
            .view-toggle button:hover {
              background: rgba(0, 0, 0, 0.05);
            }
            
            .view-toggle button.active {
              background: #000000;
              color: #ffffff;
            }
            
            .create-button {
              padding: 0 1.75rem;
              font-size: 0.9rem;
              border-radius: 8px;
              background: linear-gradient(135deg, #000000 0%, #333333 100%);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              transition: all 0.2s ease;
              gap: 0.75rem;
              height: 48px;
              font-weight: 600;
            }
            
            .create-button:hover {
              background: linear-gradient(135deg, #333333 0%, #000000 100%);
              transform: translateY(-1px);
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }
            
            .main-content-area {
              padding: 2.5rem 2.5rem;
              max-width: 1400px;
              margin: 0 auto;
            }
            
            /* Desktop Calendar Navigation */
            .calendar-navigation {
              flex-direction: column !important;
              gap: 1.5rem !important;
              padding: 2rem !important;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .calendar-nav-row-1 {
              width: 100% !important;
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            
            .calendar-nav-row-2 {
              display: flex !important;
              justify-content: center !important;
            }
            
            .calendar-navigation h2 {
              font-size: 1.75rem !important;
              font-weight: 700 !important;
              color: #000000 !important;
            }
            
            .nav-button {
              padding: 0.875rem 1.5rem !important;
              font-size: 1rem !important;
              border: 2px solid #e5e7eb !important;
              background: #ffffff !important;
              border-radius: 8px !important;
              transition: all 0.2s ease !important;
              font-weight: 600 !important;
            }
            
            .nav-button:hover {
              border-color: #000000 !important;
              background: #f8f9fa !important;
              transform: translateY(-1px) !important;
            }
            
            .calendar-mode-buttons {
              border: 2px solid #e5e7eb !important;
              border-radius: 8px !important;
              background: #ffffff !important;
              overflow: hidden !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.75rem 1.5rem !important;
              font-size: 0.95rem !important;
              font-weight: 600 !important;
              transition: all 0.2s ease !important;
            }
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 1024px) {
            .main-content {
              margin-left: 0;
              max-width: 100vw;
            }
            
            .header-controls {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            
            .filter-controls {
              justify-content: center;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          /* Tablet Portrait - Better layout */
          @media (max-width: 1024px) and (min-width: 769px) {
            .header-content {
              flex-direction: column;
              gap: 1.5rem;
            }
            
            .header-controls {
              flex-direction: row;
              justify-content: center;
              gap: 2rem;
            }
            
            .filter-controls {
              gap: 0.5rem;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .header {
              padding: 1rem;
              position: relative;
            }
            
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            
            .header-title {
              font-size: 1.75rem;
              text-align: center;
            }
            
            .header-title + p {
              font-size: 0.9rem;
              text-align: center;
            }
            
            .header-controls {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
            }
            
            .filter-controls {
              display: flex;
              gap: 0.5rem;
              justify-content: center;
            }
            
            .filter-btn {
              flex: 1;
              padding: 0.5rem 1rem;
              font-size: 0.8rem;
            }
            
            .create-button {
              justify-content: center;
              padding: 0.75rem 1rem;
              font-size: 0.8rem;
              align-self: center;
              min-width: 200px;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
              padding-top: 1rem;
            }
            
            .timetable-stats .stat-item {
              padding: 1rem 0.75rem;
            }
            
            .stat-value {
              font-size: 1.5rem;
            }
            
            .main-content-area {
              padding: 1rem;
              max-width: 100%;
              min-height: calc(100vh - 150px);
            }
            
            /* Calendar Navigation Mobile - 2 Row Layout */
            .calendar-navigation {
              display: flex !important;
              flex-direction: column !important;
              gap: 0.75rem !important;
              padding: 0.75rem !important;
              margin-bottom: 1rem !important;
              align-items: center !important;
              width: 100% !important;
              box-sizing: border-box !important;
            }
            
            .calendar-nav-row-1 {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              width: 100% !important;
            }
            
            .calendar-navigation h2 {
              font-size: 1rem !important;
              text-align: center !important;
              margin: 0 !important;
              flex: 1 !important;
            }
            
            .calendar-nav-row-2 {
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
            }
            
            .calendar-mode-buttons {
              width: 200px !important;
              height: 32px !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.4rem 0.75rem !important;
              font-size: 0.75rem !important;
            }
            
            .nav-button {
              padding: 0.6rem 1rem !important;
              font-size: 0.8rem !important;
              min-width: 80px !important;
            }
            
            /* Calendar Grid Mobile - Fixed Column Widths */
            .calendar-view,
            .calendar-view > div,
            [class*="calendar-grid"],
            .calendar-container > div {
              gap: 2px !important;
              border-radius: 8px !important;
              width: 100% !important;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              overflow-x: auto !important;
              max-width: 100vw !important;
            }
            
            /* Calendar Day Cells Mobile */
            .calendar-day,
            [class*="calendar-day"] {
              min-height: 60px !important;
              padding: 4px !important;
              font-size: 11px !important;
              overflow: hidden !important;
            }
            
            /* Calendar Headers Mobile */
            .calendar-header,
            [class*="calendar-header"] {
              padding: 8px 4px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
            }
            
            /* Calendar Legend Mobile */
            .calendar-view > div:last-child {
              padding: 0.75rem !important;
              margin-top: 1rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 1rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            .calendar-day-header {
              padding: 0.4rem 0.125rem !important;
              font-size: 0.65rem !important;
              text-align: center !important;
            }
            
            .calendar-day-cell {
              min-height: 70px !important;
              max-height: 70px !important;
              padding: 0.25rem 0.125rem !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
            }
            
            .calendar-day-number {
              font-size: 0.8rem !important;
              margin-bottom: 0.25rem !important;
              flex-shrink: 0 !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.5rem !important;
              padding: 0.125rem 0.25rem !important;
              margin-bottom: 0.125rem !important;
              line-height: 1.2 !important;
              border-radius: 2px !important;
            }
            
            .calendar-meeting-time {
              display: none !important;
            }
            
            .calendar-more-meetings {
              font-size: 0.45rem !important;
              padding: 0.1rem !important;
              margin-top: auto !important;
            }
            
            /* Meeting Cards Mobile */
            .meetings-grid {
              gap: 1rem;
            }
            
            .meeting-card {
              padding: 1rem;
              position: relative;
            }
            
            .meeting-header {
              flex-direction: column;
              gap: 0.75rem;
              align-items: flex-start;
              position: relative;
              padding-right: 4rem;
            }
            
            .meeting-actions {
              position: absolute;
              top: 0;
              right: 0;
              display: flex;
              gap: 0.375rem;
              z-index: 10;
            }
            
            .meeting-actions .action-btn {
              width: 32px;
              height: 32px;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 6px;
              font-size: 0.75rem;
            }
            
            .meeting-details {
              grid-template-columns: 1fr;
              gap: 0.75rem;
            }
            
            .detail-item {
              font-size: 0.875rem;
            }
            
            .attendees-list {
              gap: 0.375rem;
            }
            
            .attendee-tag {
              font-size: 0.7rem;
              padding: 0.25rem 0.375rem;
            }
            
            /* Modal Mobile */
            .modal-overlay {
              padding: 0.5rem;
            }
            
            .modal-content {
              max-width: calc(100vw - 1rem);
              max-height: calc(100vh - 1rem);
              margin: 0;
            }
            
            .modal-header {
              padding: 1rem;
            }
            
            .modal-title {
              font-size: 1.1rem;
            }
            
            .modal-form {
              padding: 1rem;
            }
            
            .form-group {
              margin-bottom: 1rem;
            }
            
            .form-grid, .form-grid-3 {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            
            .form-actions {
              flex-direction: column;
              gap: 0.75rem;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 0.5rem;
            }
            
            .header-title {
              font-size: 1rem;
              text-align: center;
            }
            
            .header-title p {
              font-size: 0.7rem;
              line-height: 1.3;
            }
            
            .main-content-area {
              padding: 0.75rem;
              min-height: calc(100vh - 120px);
            }
            
            .header-actions {
              gap: 0.5rem;
            }
            
            .filter-section {
              gap: 0.375rem;
            }
            
            .filter-section label {
              font-size: 0.7rem;
            }
            
            .filter-select {
              padding: 0 0.45rem;
              font-size: 0.75rem;
              height: 32px;
              box-sizing: border-box;
              line-height: 28px;
            }
            
            .action-buttons-row {
              gap: 0.375rem;
              grid-template-columns: 1fr 1fr;
              align-items: center;
            }
            
            .view-toggle {
              height: 32px !important;
              box-sizing: border-box;
              align-self: center;
            }
            
            .view-toggle button {
              font-size: 0.7rem !important;
              padding: 0.35rem 0.4rem !important;
              height: 32px;
              box-sizing: border-box;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .create-button {
              padding: 0.35rem 0.4rem;
              font-size: 0.7rem;
              height: 32px;
              gap: 0.2rem;
              box-sizing: border-box;
            }
            
            .section-title {
              font-size: 1rem;
              gap: 0.25rem;
            }
            
            .meeting-card {
              padding: 0.75rem;
              position: relative;
            }
            
            .meeting-header {
              padding-right: 3.5rem;
            }
            
            .meeting-actions .action-btn {
              width: 28px;
              height: 28px;
              font-size: 0.7rem;
            }
            
            .meeting-title {
              font-size: 0.9rem;
            }
            
            .meeting-project {
              font-size: 0.75rem;
            }
            
            /* Ultra-compact Calendar for Small Screens */
            .calendar-navigation {
              padding: 0.5rem !important;
              margin-bottom: 0.75rem !important;
            }
            
            .calendar-nav-row-1 {
              margin-bottom: 0.25rem !important;
            }
            
            .calendar-navigation h2 {
              font-size: 0.9rem !important;
            }
            
            .calendar-mode-buttons {
              width: 160px !important;
              height: 28px !important;
            }
            
            .calendar-mode-buttons button {
              padding: 0.3rem 0.5rem !important;
              font-size: 0.7rem !important;
            }
            
            .nav-button {
              padding: 0.5rem 0.75rem !important;
              font-size: 0.75rem !important;
              min-width: 60px !important;
            }
            
            .calendar-day-cell {
              min-height: 60px !important;
              max-height: 60px !important;
              padding: 0.125rem !important;
            }
            
            .calendar-day-header {
              padding: 0.3rem 0.1rem !important;
              font-size: 0.6rem !important;
            }
            
            .calendar-day-number {
              font-size: 0.75rem !important;
              margin-bottom: 0.2rem !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.45rem !important;
              padding: 0.1rem 0.15rem !important;
              margin-bottom: 0.1rem !important;
              line-height: 1.1 !important;
            }
            
            .calendar-more-meetings {
              font-size: 0.4rem !important;
              padding: 0.05rem !important;
            }
            
            /* Calendar Legend Mobile */
            .calendar-view > div:last-child {
              padding: 0.6rem !important;
              margin-top: 0.75rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 0.75rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            /* Modal Ultra-Mobile */
            .modal-overlay {
              padding: 0.25rem;
            }
            
            .modal-content {
              max-width: calc(100vw - 0.5rem);
              max-height: calc(100vh - 0.5rem);
              border-radius: 6px;
            }
            
            .modal-header {
              padding: 0.75rem;
            }
            
            .modal-title {
              font-size: 0.9rem;
            }
            
            .modal-form {
              padding: 0.75rem;
            }
            
            .form-input, .form-textarea, .form-select {
              padding: 0.75rem;
              font-size: 0.9rem;
            }
            
            .form-actions button {
              padding: 0.875rem;
              font-size: 0.9rem;
            }
          }
          
          @media (max-width: 380px) {
            .header {
              padding: 0.4rem;
            }
            
            .header-title {
              font-size: 0.9rem;
            }
            
            .header-title p {
              font-size: 0.65rem;
            }
            
            .main-content-area {
              padding: 0.6rem;
              min-height: calc(100vh - 100px);
            }
            
            .header-actions {
              gap: 0.4rem;
            }
            
            .action-buttons-row {
              gap: 0.3rem;
              grid-template-columns: 1fr 1fr;
              align-items: center;
            }
            
            .filter-section {
              gap: 0.3rem;
            }
            
            .filter-section label {
              font-size: 0.65rem;
            }
            
            .filter-select {
              padding: 0 0.4rem;
              font-size: 0.7rem;
              height: 28px;
              box-sizing: border-box;
              line-height: 24px;
            }
            
            .view-toggle {
              height: 28px !important;
              box-sizing: border-box;
              align-self: center;
            }
            
            .view-toggle button {
              font-size: 0.65rem !important;
              padding: 0.3rem 0.3rem !important;
              height: 28px;
              box-sizing: border-box;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .create-button {
              padding: 0.3rem 0.3rem;
              font-size: 0.65rem;
              height: 28px;
              gap: 0.15rem;
              box-sizing: border-box;
            }
            
            .calendar-navigation {
              padding: 0.4rem !important;
            }
            
            .calendar-nav-row-1 {
              margin-bottom: 0.25rem !important;
            }
            
            .calendar-navigation h2 {
              font-size: 0.85rem !important;
            }
            
            .calendar-mode-buttons {
              width: 140px !important;
              height: 26px !important;
            }
            
            .nav-button {
              min-width: 50px !important;
              font-size: 0.7rem !important;
              padding: 0.4rem 0.6rem !important;
            }
            
            .calendar-day-cell {
              min-height: 50px !important;
              max-height: 50px !important;
              padding: 0.1rem !important;
            }
            
            .calendar-day-header {
              padding: 0.25rem 0.05rem !important;
              font-size: 0.55rem !important;
            }
            
            .calendar-day-number {
              font-size: 0.7rem !important;
              margin-bottom: 0.15rem !important;
            }
            
            .calendar-meeting-item {
              font-size: 0.4rem !important;
              padding: 0.05rem 0.1rem !important;
              margin-bottom: 0.05rem !important;
            }
            
                                     .calendar-more-meetings {
              font-size: 0.35rem !important;
            }
            
            /* Calendar Legend Ultra Mobile */
            .calendar-view > div:last-child {
              padding: 0.5rem !important;
              margin-top: 0.5rem !important;
            }
            
            .calendar-view > div:last-child > div:first-child {
              gap: 0.5rem !important;
              flex-wrap: nowrap !important;
              justify-content: center !important;
            }
            
            /* Ultra Small Meeting Cards */
            .meeting-card {
              padding: 0.5rem;
            }
            
            .meeting-header {
              padding-right: 3rem;
            }
            
            .meeting-actions .action-btn {
              width: 24px;
              height: 24px;
              font-size: 0.65rem;
            }
            
            .meeting-title {
              font-size: 0.85rem;
            }
            
            .meeting-project {
              font-size: 0.7rem;
            }
           }
           
           /* Landscape mobile optimization */
           @media (max-width: 768px) and (orientation: landscape) {
             .calendar-day-cell {
               min-height: 50px !important;
               max-height: 50px !important;
             }
             
             .calendar-day-number {
               font-size: 0.7rem !important;
               margin-bottom: 0.15rem !important;
             }
             
             .calendar-meeting-item {
               font-size: 0.4rem !important;
               padding: 0.08rem 0.15rem !important;
               margin-bottom: 0.08rem !important;
             }
           }
          
          .meeting-card {
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 4px;
            padding: 1.5rem;
            transition: all 0.2s ease;
            position: relative;
          }
          .meeting-card:hover {
            transform: translateY(-2px);
            box-shadow: 4px 4px 0px #000000;
          }
          .meeting-header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            margin-bottom: 1rem;
          }
          
          /* Desktop Meeting Actions */
          @media (min-width: 1025px) {
            .meeting-actions {
              position: static;
              flex-direction: row;
              gap: 0.5rem;
            }
            
            .meeting-actions .action-btn {
              width: auto;
              height: auto;
              padding: 0.25rem;
            }
          }
          .meeting-title {
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }
          .meeting-project {
            font-size: 0.875rem;
            color: #666666;
            font-weight: 500;
          }
          .meeting-actions {
            display: flex;
            gap: 0.5rem;
          }
          .action-btn {
            padding: 0.25rem;
            border: 1px solid #000000;
            background: #ffffff;
            color: #000000;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .action-btn:hover {
            background: #f0f0f0;
          }
          .action-btn.delete:hover {
            background: #fef2f2;
            border-color: #ef4444;
            color: #ef4444;
          }
          .meeting-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
          }
          .detail-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #666666;
          }
          .meeting-description {
            color: #000000;
            line-height: 1.5;
            margin-bottom: 1rem;
          }
          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          .attendee-tag {
            background: #f0f0f0;
            border: 1px solid #000000;
            padding: 0.25rem 0.5rem;
            border-radius: 2px;
            font-size: 0.75rem;
            color: #000000;
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
            animation: fadeIn 0.2s ease-out;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .modal-content {
            background: #ffffff;
            border: 2px solid #000000;
            width: 100%;
            max-width: 800px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            border-radius: 8px;
            animation: slideIn 0.3s ease-out;
            overflow: hidden;
          }
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 1.5rem 1rem 1.5rem;
            border-bottom: 1px solid #e5e7eb;
            flex-shrink: 0;
            background: #ffffff;
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .modal-close-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: #f3f4f6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            font-weight: bold;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .modal-close-btn:hover {
            background: #e5e7eb;
            color: #374151;
          }
          .modal-form {
            padding: 1.5rem;
            overflow-y: auto;
            flex: 1;
            min-height: 0;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          .form-label {
            display: block;
            font-weight: 600;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-input:focus {
            outline: none;
            border-color: #000000;
            background: #f9f9f9;
          }
          .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }
          .form-select {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 4px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .form-grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 140px;
            gap: 1rem;
          }
          .form-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
          }
          .btn-primary {
            flex: 1;
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-primary:hover {
            background: #333333;
            transform: translateY(-1px);
          }
          .btn-secondary {
            flex: 1;
            background: #ffffff;
            color: #000000;
            border: 2px solid #000000;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-secondary:hover {
            background: #f0f0f0;
            transform: translateY(-1px);
          }
          .empty-state {
            text-align: center;
            padding: 3rem 0;
            color: #666666;
          }
          .empty-icon {
            width: 64px;
            height: 64px;
            background: #f0f0f0;
            border: 2px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
          }
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: start;
            }
            .form-grid {
              grid-template-columns: 1fr;
            }
            .form-grid-3 {
              grid-template-columns: 1fr;
            }
          }
        `
      }} />

      <div className="timetable-container">
        {!isMobile && <Sidebar projects={projects} onCreateProject={handleCreateProject} />}

        <main className="main-content">
          <header className="header">
            <div className="header-content">
              <div>
                <h1 className="header-title">
                  <ClockIcon style={{ width: '32px', height: '32px' }} />
                  Timetable & Meetings
                </h1>
                <p style={{ color: '#666666', fontSize: '1.1rem', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                  Schedule and manage team meetings across all projects
                </p>
              </div>
              
              <div className="header-controls">
                <div className="filter-controls">
                    <button
                      onClick={() => setViewMode('list')}
                    className={`filter-btn ${viewMode === 'list' ? 'active' : ''}`}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                    className={`filter-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                    >
                      Calendar View
                    </button>
                  </div>
                
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="create-button"
                  >
                    <PlusIcon style={{ width: '20px', height: '20px' }} />
                    Schedule Meeting
                  </button>
                </div>
            </div>
            
            <div className="timetable-stats">
              <div className="stat-item">
                <div className="stat-label">Total Meetings</div>
                <div className="stat-value total">{meetings.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Upcoming</div>
                <div className="stat-value upcoming">{upcomingMeetings.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Past Meetings</div>
                <div className="stat-value">{pastMeetings.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Active Projects</div>
                <div className="stat-value">{projects.length}</div>
              </div>
            </div>
          </header>

          <div className="main-content-area">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Calendar Navigation and Controls */}
            {viewMode === 'calendar' && (
              <div className="calendar-navigation" style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                marginBottom: '2rem',
                padding: '1.5rem',
                border: '2px solid #000000',
                borderRadius: '8px',
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                gap: '1rem'
              }}>
                <div className="calendar-nav-row-1" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <button
                    onClick={() => previousMonth()}
                    className="nav-button"
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #000000',
                      background: '#ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    ← Previous
                  </button>
                  
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: '#000000',
                    textAlign: 'center',
                    flex: 1
                  }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>

                  <button
                    onClick={() => nextMonth()}
                    className="nav-button"
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #000000',
                      background: '#ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#f0f0f0';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Next →
                  </button>
                </div>
                

              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <>
                {/* Upcoming Meetings */}
                <div className="meetings-section">
                  <h2 className="section-title">
                    <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#10b981' }} />
                    Upcoming Meetings ({upcomingMeetings.length})
                  </h2>
              
              {upcomingMeetings.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <ClockIcon style={{ width: '32px', height: '32px', color: '#666666' }} />
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#000000', margin: '0 0 0.5rem 0' }}>
                    No upcoming meetings
                  </h3>
                  <p>Schedule your first meeting to get started</p>
                </div>
              ) : (
                <div className="meetings-grid">
                  {upcomingMeetings.map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="meeting-card"
                      onClick={() => handleMeetingClick(meeting)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="meeting-header">
                        <div>
                          <h3 className="meeting-title">{meeting.title}</h3>
                          <p className="meeting-project">{meeting.project_name}</p>
                        </div>
                        <div className="meeting-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMeeting(meeting);
                            }}
                            className="action-btn"
                            title="Edit meeting"
                          >
                            <PencilIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting.id);
                            }}
                            className="action-btn delete"
                            title="Delete meeting"
                          >
                            <TrashIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>

                      <div className="meeting-details">
                        <div className="detail-item">
                          <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                          <span>{formatDate(meeting.date)}</span>
                        </div>
                        <div className="detail-item">
                          <ClockIcon style={{ width: '16px', height: '16px' }} />
                          <span>{formatTime(meeting.time)} ({formatDuration(meeting.duration)})</span>
                        </div>
                        <div className="detail-item">
                          <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                          <span>Organized by {meeting.created_by.name}</span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="meeting-description">{meeting.description}</p>
                      )}

                      {getAttendeesList(meeting).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>
                            Attendees:
                          </div>
                          <div className="attendees-list">
                            {getAttendeesList(meeting).map((attendee, index) => (
                              <span key={index} className="attendee-tag">{attendee}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Meetings */}
            {pastMeetings.length > 0 && (
              <div className="meetings-section">
                <h2 className="section-title">
                  <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  Past Meetings ({pastMeetings.length})
                </h2>
                
                <div className="meetings-grid">
                  {pastMeetings.map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="meeting-card" 
                      onClick={() => handleMeetingClick(meeting)}
                      style={{ opacity: '0.7', cursor: 'pointer' }}
                    >
                      <div className="meeting-header">
                        <div>
                          <h3 className="meeting-title">{meeting.title}</h3>
                          <p className="meeting-project">{meeting.project_name}</p>
                        </div>
                        <div className="meeting-actions">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting.id);
                            }}
                            className="action-btn delete"
                            title="Delete meeting"
                          >
                            <TrashIcon style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>

                      <div className="meeting-details">
                        <div className="detail-item">
                          <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                          <span>{formatDate(meeting.date)}</span>
                        </div>
                        <div className="detail-item">
                          <ClockIcon style={{ width: '16px', height: '16px' }} />
                          <span>{formatTime(meeting.time)} ({formatDuration(meeting.duration)})</span>
                        </div>
                        <div className="detail-item">
                          <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                          <span>Organized by {meeting.created_by.name}</span>
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="meeting-description">{meeting.description}</p>
                      )}

                      {getAttendeesList(meeting).length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#000000', marginBottom: '0.5rem' }}>
                            Attendees:
                          </div>
                          <div className="attendees-list">
                            {getAttendeesList(meeting).map((attendee, index) => (
                              <span key={index} className="attendee-tag">{attendee}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
                </>
              )}

              {/* Calendar View (Week/Month) */}
              {viewMode === 'calendar' && (
                <div className="calendar-view" style={{ 
                  width: '100%', 
                  maxWidth: '100%', 
                  overflow: 'hidden',
                  padding: '0',
                  margin: '0 auto'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Calendar Header */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                      background: '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB'
                  }}>
                      {daysOfWeek.map((day) => (
                        <div key={day} style={{
                        padding: '1rem', 
                        textAlign: 'center',
                          fontWeight: '600',
                          color: '#374151',
                          borderRight: '1px solid #E5E7EB',
                          fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                          fontSize: '0.75rem',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                      }}>
                          {day}
                      </div>
                    ))}
                    </div>
                    
                    {/* Calendar Body */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)'
                    }}>
                    
                    {/* Empty cells for days before the first day of the month */}
                    {Array.from({ length: firstDay }, (_, index) => {
                      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                      const prevMonthDays = getDaysInMonth(prevMonth);
                      const dayNumber = prevMonthDays - firstDay + index + 1;
                      
                      return (
                        <div key={`prev-${index}`} className="calendar-cell other-month" style={{
                          minHeight: '120px',
                          padding: '0.75rem',
                          borderRight: '1px solid #E5E7EB',
                          borderBottom: '1px solid #E5E7EB',
                          background: '#F9FAFB',
                          color: '#9CA3AF'
                        }}>
                          <div style={{
                            fontWeight: '600',
                            color: '#9CA3AF',
                            marginBottom: '0.5rem',
                            fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                            fontSize: '1rem'
                          }}>{dayNumber}</div>
                        </div>
                      );
                    })}
                    
                    {/* Days of the current month */}
                    {Array.from({ length: daysInMonth }, (_, index) => {
                      const dayNumber = index + 1;
                      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
                      const isToday = currentDate.getMonth() === today.getMonth() && 
                                      currentDate.getFullYear() === today.getFullYear() && 
                                      dayNumber === today.getDate();
                      
                      const dayMeetings = getMeetingsForDate(cellDate);
                      
                      return (
                        <div 
                          key={dayNumber} 
                          className={`calendar-cell ${isToday ? 'today' : ''}`}
                          style={{
                            minHeight: '120px',
                            padding: '0.75rem',
                            borderRight: '1px solid #E5E7EB',
                            borderBottom: '1px solid #E5E7EB',
                            background: isToday ? 'rgba(88, 132, 253, 0.05)' : '#FFFFFF',
                          transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            ...(isToday && {
                              borderRight: '1px solid #5884FD',
                              borderBottom: '1px solid #5884FD',
                              position: 'relative'
                            })
                        }}
                          onMouseEnter={(e) => {
                          if (!isToday) {
                              e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                          onMouseLeave={(e) => {
                          if (!isToday) {
                              e.currentTarget.style.background = '#FFFFFF';
                          }
                        }}
                        onClick={() => {
                            const year = cellDate.getFullYear();
                            const month = String(cellDate.getMonth() + 1).padStart(2, '0');
                            const day = String(cellDate.getDate()).padStart(2, '0');
                          const dateStr = `${year}-${month}-${day}`;
                          setNewMeeting({
                            ...newMeeting,
                            date: dateStr,
                            time: '09:00'
                          });
                          setShowCreateForm(true);
                        }}
                        >
                          {isToday && (
                              <div style={{ 
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              background: '#5884FD'
                            }}></div>
                          )}
                          
                          <div style={{
                            fontWeight: isToday ? '700' : '600',
                            color: isToday ? '#5884FD' : '#1F2937',
                            marginBottom: '0.5rem',
                            fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                            fontSize: '1rem'
                              }}>
                            {dayNumber}
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                          }}>
                            {(dayMeetings || []).slice(0, 3).map((meeting) => (
                              <div 
                                key={meeting.id} 
                                style={{ 
                                  background: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: '8px',
                                  padding: '0.5rem',
                                  fontSize: '0.75rem',
                                  marginBottom: '0.25rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  borderLeft: '3px solid #5884FD'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMeetingClick(meeting);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#F1F5F9';
                                  e.currentTarget.style.borderColor = '#5884FD';
                                  e.currentTarget.style.borderLeftColor = '#5884FD';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#F8FAFC';
                                  e.currentTarget.style.borderColor = '#E2E8F0';
                                  e.currentTarget.style.borderLeftColor = '#5884FD';
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  marginBottom: '0.25rem'
                                }}>
                                  <div style={{
                                    fontWeight: '500',
                                    color: '#1F2937',
                                    lineHeight: '1.3',
                                    flex: 1,
                                    marginRight: '0.25rem',
                                    fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                                  }}>
                                    {meeting.title}
                                  </div>
                                </div>
                                <div style={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.65rem'
                                }}>
                                  <div style={{
                                    fontWeight: '500',
                                    maxWidth: '60%',
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                    color: '#6B7280'
                                }}>
                                    {formatTime(meeting.time)}
                                </div>
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.125rem',
                                    color: '#6B7280'
                                  }}>
                                    <UserGroupIcon style={{ width: '10px', height: '10px' }} />
                                    {meeting.created_by.name.split(' ')[0]}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(dayMeetings || []).length > 3 && (
                              <div 
                                style={{ 
                                  background: '#EEF2FF',
                                  border: '1px solid #C7D2FE',
                                  borderRadius: '6px',
                                  padding: '0.375rem 0.5rem',
                                  fontSize: '0.6875rem',
                                  color: '#5B21B6',
                                  textAlign: 'center',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  fontWeight: '500',
                                  fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShowMoreMeetings(cellDate, dayMeetings || []);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#E0E7FF';
                                  e.currentTarget.style.borderColor = '#A5B4FC';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#EEF2FF';
                                  e.currentTarget.style.borderColor = '#C7D2FE';
                                }}
                              >
                                +{(dayMeetings || []).length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  
                    {/* Fill remaining cells with next month's days */}
                    {Array.from({ length: 42 - (firstDay + daysInMonth) }, (_, index) => {
                      const dayNumber = index + 1;
                      
                      return (
                        <div key={`next-${index}`} className="calendar-cell other-month" style={{
                          minHeight: '120px',
                          padding: '0.75rem',
                          borderRight: '1px solid #E5E7EB',
                          borderBottom: '1px solid #E5E7EB',
                          background: '#F9FAFB',
                          color: '#9CA3AF'
                  }}>
                    <div style={{
                            fontWeight: '600',
                            color: '#9CA3AF',
                            marginBottom: '0.5rem',
                            fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                            fontSize: '1rem'
                          }}>{dayNumber}</div>
                      </div>
                      );
                    })}
                      </div>
                    </div>
                  

                </div>
              )}
          </div>
        </main>
      </div>

      {/* Meeting Detail Modal */}
      {showMeetingDetail && selectedMeeting && (
        <MeetingDetailModal
          meeting={selectedMeeting}
          onClose={() => {
            setShowMeetingDetail(false);
            setSelectedMeeting(null);
          }}
          onUpdate={handleUpdateMeetingFromDetail}
          onDelete={handleDeleteMeetingFromDetail}
          projectMembers={projectMembers}
          projects={projects}
          onProjectChange={(projectId: number) => {
            fetchProjectMembers(projectId);
          }}
        />
      )}

      {/* Day Meetings Modal */}
      {showDayMeetings && selectedDayDate && (
        <div className="modal-overlay" onClick={() => {
          setShowDayMeetings(false);
          setSelectedDayDate(null);
          setSelectedDayMeetings([]);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                Meetings for {selectedDayDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowDayMeetings(false);
                  setSelectedDayDate(null);
                  setSelectedDayMeetings([]);
                }}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedDayMeetings.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666666', padding: '2rem' }}>
                  No meetings scheduled for this day
                </p>
              ) : (
                <div className="meetings-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedDayMeetings.map(meeting => (
                    <div 
                      key={meeting.id} 
                      className="meeting-item"
                      style={{
                        padding: '1rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        background: '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setShowDayMeetings(false);
                        setSelectedDayDate(null);
                        setSelectedDayMeetings([]);
                        handleMeetingClick(meeting);
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f5f5f5';
                        e.currentTarget.style.borderColor = '#000000';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#e0e0e0';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#000000' }}>
                            {meeting.title}
                          </h4>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#666666' }}>
                            {meeting.project_name}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDayMeetings(false);
                              setSelectedDayDate(null);
                              setSelectedDayMeetings([]);
                              handleEditMeeting(meeting);
                            }}
                            style={{
                              padding: '0.25rem',
                              border: '1px solid #e0e0e0',
                              background: '#ffffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                            title="Edit meeting"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMeeting(meeting.id);
                              setSelectedDayMeetings(selectedDayMeetings.filter(m => m.id !== meeting.id));
                            }}
                            style={{
                              padding: '0.25rem',
                              border: '1px solid #e0e0e0',
                              background: '#ffffff',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem'
                            }}
                            title="Delete meeting"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#666666' }}>
                        <span>🕐 {formatTime(meeting.time)}</span>
                        <span>⏱️ {formatDuration(meeting.duration)}</span>
                        <span>👤 {meeting.created_by.name}</span>
                      </div>
                      
                      {meeting.description && (
                        <p style={{ 
                          margin: '0.5rem 0 0 0', 
                          fontSize: '0.875rem', 
                          color: '#333333', 
                          lineHeight: '1.4' 
                        }}>
                          {meeting.description}
                        </p>
                      )}
                      
                      {getAttendeesList(meeting).length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666666' }}>
                            Attendees: 
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#333333' }}>
                            {getAttendeesList(meeting).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Meeting Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateForm(false);
          setEditingMeeting(null);
          setNewMeeting({
            title: '',
            description: '',
            date: '',
            time: '',
            duration: 60,
            project_id: 0,
            attendees: '',
            attendee_ids: [],
          });
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingMeeting(null);
                  setNewMeeting({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    duration: 60,
                    project_id: 0,
                    attendees: '',
                    attendee_ids: [],
                  });
                }}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            <form onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting} className="modal-form">
              <div className="form-group">
                <label className="form-label">Meeting Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Enter meeting title..."
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="What will be discussed in this meeting?"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project *</label>
                <select
                  required
                  className="form-select"
                  value={newMeeting.project_id}
                  onChange={(e) => setNewMeeting({ ...newMeeting, project_id: Number(e.target.value) })}
                >
                  <option value={0}>Select a project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
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
                    value={newMeeting.duration}
                    onChange={(e) => setNewMeeting({ ...newMeeting, duration: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Invite Attendees (Optional)</label>
                
                {/* Selected Attendees Display */}
                {newMeeting.attendee_ids.length > 0 && (
                <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '0.5rem', 
                    marginBottom: '0.75rem',
                  padding: '0.75rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                }}>
                    {newMeeting.attendee_ids.map(memberId => {
                      const member = projectMembers.find(m => m.id === memberId);
                      return member ? (
                        <span key={memberId} style={{
                          display: 'inline-flex',
                          alignItems: 'center', 
                          gap: '0.5rem',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          borderRadius: '20px',
                          fontSize: '0.875rem'
                        }}>
                          {member.name}
                          <button
                            type="button"
                            onClick={() => setNewMeeting(prev => ({
                              ...prev,
                              attendee_ids: prev.attendee_ids.filter(id => id !== memberId)
                            }))}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ffffff',
                          cursor: 'pointer',
                              fontSize: '1rem',
                              lineHeight: '1'
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Member Selection */}
                {projectMembers.length > 0 ? (
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {projectMembers.map(member => {
                      const isSelected = newMeeting.attendee_ids.includes(member.id);
                      return (
                        <div
                          key={member.id}
                          onClick={() => {
                            setNewMeeting(prev => ({
                              ...prev,
                              attendee_ids: isSelected 
                                ? prev.attendee_ids.filter(id => id !== member.id)
                                : [...prev.attendee_ids, member.id]
                            }));
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f0f9ff' : '#ffffff',
                            borderLeft: isSelected ? '4px solid #000000' : '4px solid transparent'
                        }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500', color: '#000000' }}>
                              {member.name}
                    </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                              {member.email}
                    </div>
                </div>
                </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#6b7280',
                    border: '2px dashed #e5e7eb',
                    borderRadius: '6px'
                  }}>
                    Select a project first to see available members
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                </button>
                <button type="button" onClick={() => {
                  setShowCreateForm(false);
                  setEditingMeeting(null);
                  setNewMeeting({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    duration: 60,
                    project_id: 0,
                    attendees: '',
                    attendee_ids: [],
                  });
                }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 