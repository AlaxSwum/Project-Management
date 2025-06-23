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
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
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
      
      // Filter meetings for confidentiality - only show meetings where user is:
      // 1. The creator of the meeting, OR 
      // 2. Listed as an attendee, OR
      // 3. Has access to the project AND is specifically assigned
      const filteredMeetings = meetingsData.filter((meeting: Meeting) => {
        const projectId = meeting.project_id || meeting.project;
        
        // Must have project access first
        if (!projectId || !accessibleProjects.has(projectId)) {
          return false;
        }
        
        // Show if user created the meeting
        if (meeting.created_by?.id === user?.id) {
          return true;
        }
        
        // Show if user is in attendees list
        const attendeesList = meeting.attendees_list || 
          (meeting.attendees ? meeting.attendees.split(',').map(a => a.trim()) : []);
        
        // Check if user's name or email is in attendees
        const userInAttendees = attendeesList.some(attendee => 
          attendee.toLowerCase().includes(user?.name?.toLowerCase() || '') ||
          attendee.toLowerCase().includes(user?.email?.toLowerCase() || '')
        );
        
        if (userInAttendees) {
          return true;
        }
        
        // For additional security, don't show meetings where user is not explicitly involved
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
    const date = new Date(dateString);
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

  const filteredMeetings = selectedProject 
    ? meetings.filter(m => (m.project_id || m.project) === selectedProject)
    : meetings;

  const upcomingMeetings = filteredMeetings.filter(m => {
    const meetingDateTime = new Date(`${m.date}T${m.time}`);
    return meetingDateTime >= new Date();
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const pastMeetings = filteredMeetings.filter(m => {
    const meetingDateTime = new Date(`${m.date}T${m.time}`);
    return meetingDateTime < new Date();
  }).sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  // Calendar helper functions
  const getWeekDates = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getMonthCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        weekDays.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      calendar.push(weekDays);
      
      if (current > lastDay && weekDays[6].getMonth() !== month) break;
    }
    
    return calendar;
  };

  const getMeetingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredMeetings.filter(meeting => meeting.date === dateStr);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (calendarMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (calendarMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const formatCalendarTitle = () => {
    if (calendarMode === 'week') {
      const weekDates = getWeekDates(currentDate);
      const start = weekDates[0];
      const end = weekDates[6];
      
      if (start.getMonth() === end.getMonth()) {
        return `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
      } else {
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
      }
    } else if (calendarMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return '';
  };

  const getAttendeesList = (meeting: Meeting) => {
    if (meeting.attendees_list && meeting.attendees_list.length > 0) {
      return meeting.attendees_list;
    }
    if (meeting.attendees && typeof meeting.attendees === 'string') {
      return meeting.attendees.split(',').map(a => a.trim()).filter(a => a);
    }
    return [];
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cccccc', borderTop: '3px solid #000000', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #ffffff;
          }
          .timetable-container {
            min-height: 100vh;
            display: flex;
            background: #ffffff;
            max-width: 100vw;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .main-content {
            flex: 1;
            margin-left: 256px;
            background: #ffffff;
            max-width: calc(100vw - 256px);
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .header {
            background: #ffffff;
            border-bottom: 2px solid #000000;
            padding: 1.5rem 2rem;
            position: sticky;
            top: 0;
            z-index: 20;
            box-sizing: border-box;
            width: 100%;
            overflow-x: hidden;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
            box-sizing: border-box;
            width: 100%;
            max-width: 100%;
          }
          .header-title {
            font-size: 1.75rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .header-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            width: 100%;
            max-width: 100%;
          }
          .create-button {
            background: #000000;
            color: #ffffff;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s ease;
            height: 40px;
            box-sizing: border-box;
          }
          .create-button:hover {
            background: #333333;
            transform: translateY(-1px);
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
            max-width: 100%;
            box-sizing: border-box;
            min-height: calc(100vh - 200px);
            line-height: 1.6;
          }
          .error-message {
            background: #ffffff;
            border: 2px solid #000000;
            color: #000000;
            padding: 1rem;
            border-radius: 4px;
            margin-bottom: 1.5rem;
            font-weight: 500;
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
          }
          
          /* Tablet Portrait - Better layout */
          @media (max-width: 1024px) and (min-width: 769px) {
            .header-actions {
              display: grid;
              grid-template-columns: 2fr 3fr;
              gap: 1rem;
              align-items: end;
            }
            
            .filter-section {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }
            
            .action-buttons-row {
              display: flex;
              gap: 0.5rem;
              justify-content: flex-end;
            }
            
            .view-toggle {
              width: auto;
            }
            
            .create-button {
              width: auto;
              min-width: 140px;
            }
          }
          
          @media (max-width: 768px) {
            .main-content {
              margin-left: 0;
            }
            
            .header {
              padding: 0.75rem;
              position: relative;
            }
            
            /* Better space utilization */
            .main-content-area {
              padding: 0.75rem;
              max-width: 100%;
              min-height: calc(100vh - 150px);
            }
            
            /* Clean up header spacing */
            .header-content > div:first-child {
              margin-bottom: 0.5rem;
            }
            
            .header-title {
              font-size: 1.1rem;
              margin-bottom: 0.25rem;
            }
            
            .header-title p {
              font-size: 0.75rem;
              margin-top: 0.125rem;
            }
            
            .header-content {
              flex-direction: column;
              gap: 0.5rem;
              align-items: stretch;
            }
            
            .header-actions {
              display: grid;
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            
            .filter-section {
              display: grid;
              grid-template-columns: auto 1fr;
              align-items: center;
              gap: 0.5rem;
              width: 100%;
            }
            
            .filter-section label {
              font-size: 0.8rem;
              white-space: nowrap;
            }
            
            .filter-select {
              padding: 0 0.5rem;
              font-size: 0.85rem;
              width: 100%;
              height: 36px;
              box-sizing: border-box;
              line-height: 32px;
            }
            
            .action-buttons-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5rem;
              width: 100%;
              align-items: center;
            }
            
            .view-toggle {
              height: 36px !important;
              display: flex;
              width: 100%;
              box-sizing: border-box;
              align-self: center;
            }
            
            .view-toggle button {
              flex: 1;
              padding: 0.5rem 0.5rem !important;
              font-size: 0.75rem !important;
              height: 36px;
              box-sizing: border-box;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            
            .create-button {
              justify-content: center;
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              height: 36px;
              display: flex;
              align-items: center;
              gap: 0.25rem;
              width: 100%;
              box-sizing: border-box;
            }
            
            .main-content-area {
              padding: 0.75rem;
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
            .calendar-view > div {
              gap: 1px !important;
              border-radius: 4px !important;
              width: 100% !important;
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
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
            
            .meeting-description {
              font-size: 0.8rem;
              line-height: 1.3;
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
            max-width: 600px;
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
            grid-template-columns: 1fr 1fr 100px;
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
        <Sidebar projects={projects} onCreateProject={handleCreateProject} />

        <main className="main-content">
          <header className="header">
            <div className="header-content">
              <div style={{ marginBottom: '0.5rem' }}>
                <h1 className="header-title">
                  <ClockIcon style={{ width: '32px', height: '32px' }} />
                  Timetable & Meetings
                </h1>
                <p style={{ color: '#666666', marginTop: '0.25rem', margin: '0' }}>
                  Schedule and manage team meetings across all projects
                </p>
              </div>
              <div className="header-actions">
                <div className="filter-section">
                  <select
                    className="filter-select"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(Number(e.target.value))}
                  >
                    <option value={0}>All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="action-buttons-row">
                  <div className="view-toggle">
                    <button
                      onClick={() => setViewMode('list')}
                      className={viewMode === 'list' ? 'active' : ''}
                      style={{
                        background: viewMode === 'list' ? '#000000' : '#ffffff',
                        color: viewMode === 'list' ? '#ffffff' : '#000000'
                      }}
                    >
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={viewMode === 'calendar' ? 'active' : ''}
                      style={{
                        borderLeft: '2px solid #000000',
                        background: viewMode === 'calendar' ? '#000000' : '#ffffff',
                        color: viewMode === 'calendar' ? '#ffffff' : '#000000'
                      }}
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
                    onClick={() => navigateDate('prev')}
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
                    {formatCalendarTitle()}
                  </h2>

                  <button
                    onClick={() => navigateDate('next')}
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
                
                <div className="calendar-nav-row-2" style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%'
                }}>
                  <div className="calendar-mode-buttons" style={{ 
                    display: 'flex', 
                    gap: '0.25rem', 
                    border: '2px solid #000000', 
                    borderRadius: '6px', 
                    overflow: 'hidden',
                    background: '#f8f9fa'
                  }}>
                    <button
                      onClick={() => setCalendarMode('week')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: calendarMode === 'week' ? '#000000' : 'transparent',
                        color: calendarMode === 'week' ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarMode('month')}
                      style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        borderLeft: '1px solid #e0e0e0',
                        background: calendarMode === 'month' ? '#000000' : 'transparent',
                        color: calendarMode === 'month' ? '#ffffff' : '#000000',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Month
                    </button>
                  </div>
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
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(7, 1fr)', 
                    gap: '2px', 
                    border: '3px solid #000000',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#000000',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    width: '100%',
                    maxWidth: '100%'
                  }}>
                    {/* Day Headers */}
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <div key={day} className="calendar-day-header" style={{ 
                        padding: '1rem', 
                        background: '#f8f9fa', 
                        fontWeight: '700', 
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#000000',
                        borderBottom: '2px solid #000000'
                      }}>
                        {calendarMode === 'week' ? day : day.slice(0, 3)}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {(calendarMode === 'week' ? getWeekDates(currentDate) : getMonthCalendar(currentDate).flat()).map(date => {
                      const dayMeetings = getMeetingsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                      const isCurrentPeriod = calendarMode === 'week' || isCurrentMonth;
                      
                      return (
                        <div key={date.toISOString()} className="calendar-day-cell" style={{ 
                          minHeight: calendarMode === 'week' ? '150px' : '120px', 
                          padding: '0.75rem',
                          background: isToday ? '#e3f2fd' : '#ffffff',
                          border: isToday ? '3px solid #1976d2' : 'none',
                          borderRadius: isToday ? '4px' : '0',
                          opacity: isCurrentPeriod ? 1 : 0.4,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer'
                        }}
                        onMouseOver={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.background = '#f5f5f5';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.background = '#ffffff';
                          }
                        }}
                        onClick={() => {
                          const dateStr = date.toISOString().split('T')[0];
                          setNewMeeting({
                            ...newMeeting,
                            date: dateStr,
                            time: '09:00'
                          });
                          setShowCreateForm(true);
                        }}
                        >
                          <div className="calendar-day-number" style={{ 
                            fontWeight: '700', 
                            marginBottom: '0.75rem',
                            fontSize: calendarMode === 'week' ? '1.1rem' : '1rem',
                            color: isToday ? '#1976d2' : (isCurrentPeriod ? '#000000' : '#999999'),
                            textAlign: 'left'
                          }}>
                            {date.getDate()}
                            {calendarMode === 'week' && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '500', 
                                color: isToday ? '#1976d2' : '#666666' 
                              }}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', overflow: 'hidden', flex: 1 }}>
                            {dayMeetings.slice(0, calendarMode === 'week' ? 5 : 2).map(meeting => (
                              <div 
                                key={meeting.id} 
                                className="calendar-meeting-item"
                                style={{ 
                                  fontSize: calendarMode === 'week' ? '0.8rem' : '0.75rem', 
                                  padding: '0.375rem 0.5rem', 
                                  background: '#000000', 
                                  color: '#ffffff',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMeetingClick(meeting);
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = '#333333';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = '#000000';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                                title={`${meeting.title} - ${formatTime(meeting.time)} (${formatDuration(meeting.duration)})`}
                              >
                                {calendarMode === 'week' && (
                                  <div className="calendar-meeting-time" style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {formatTime(meeting.time)}
                                  </div>
                                )}
                                <div style={{ 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  fontWeight: '500'
                                }}>
                                  {meeting.title}
                                </div>
                                {calendarMode === 'week' && meeting.description && (
                                  <div style={{ 
                                    fontSize: '0.7rem', 
                                    opacity: 0.8, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis', 
                                    whiteSpace: 'nowrap' 
                                  }}>
                                    {meeting.description}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {dayMeetings.length > (calendarMode === 'week' ? 5 : 2) && (
                              <div className="calendar-more-meetings" style={{ 
                                fontSize: '0.7rem', 
                                color: '#666666',
                                fontWeight: '600',
                                textAlign: 'center',
                                padding: '0.25rem',
                                background: '#f0f0f0',
                                borderRadius: '4px'
                              }}>
                                +{dayMeetings.length - (calendarMode === 'week' ? 5 : 2)} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Calendar Legend */}
                  <div style={{ 
                    marginTop: '1.5rem', 
                    padding: '1rem', 
                    background: '#f8f9fa', 
                    border: '2px solid #e0e0e0', 
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#666666',
                    lineHeight: '1.5'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '2rem',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          background: '#e3f2fd', 
                          border: '2px solid #1976d2', 
                          borderRadius: '4px',
                          flexShrink: 0
                        }}></div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Today</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ 
                          width: '16px', 
                          height: '16px', 
                          background: '#000000', 
                          borderRadius: '4px',
                          flexShrink: 0
                        }}></div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Meeting</span>
                      </div>
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
        />
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
                  <label className="form-label">Duration (min)</label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    className="form-input"
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