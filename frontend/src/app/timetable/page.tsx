'use client';

import { useState, useEffect, useMemo } from 'react';
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
  ArrowPathIcon,
  EnvelopeIcon,
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
  attendee_ids?: number[];
  event_type?: string;
  agenda_items?: string[];
  meeting_link?: string;
  reminder_time?: number; // in minutes before meeting
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
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

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
    agenda_items: [] as string[],
    meeting_link: '',
    reminder_time: 15, // default 15 minutes before
    // Recurring meeting options
    isRecurring: false,
    endDate: '',
    repeatDays: [] as number[], // 0=Sun, 1=Mon, 2=Tue, etc.
    // Timezone selection
    timezone: 'UK' as 'UK' | 'MM',
  });
  const [newAgendaItem, setNewAgendaItem] = useState('');
  
  // Follow-up meeting modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpMeeting, setFollowUpMeeting] = useState<Meeting | null>(null);
  const [followUpForm, setFollowUpForm] = useState({
    date: '',
    time: '',
    duration: 60,
    attendee_ids: [] as number[],
    agenda_items: [] as string[],
    meeting_link: '',
    reminder_time: 15,
    notes: '',
  });
  const [followUpAgendaItem, setFollowUpAgendaItem] = useState('');
  const [isCreatingFollowUp, setIsCreatingFollowUp] = useState(false);
  
  // Cache for meetings data
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

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

  const fetchData = async (forceRefresh = false) => {
    // Use cache if available and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && lastFetchTime > 0 && (now - lastFetchTime) < CACHE_DURATION && meetings.length > 0) {
      setIsLoading(false);
      return;
    }
    
    try {
      setError('');
      
      // Fetch projects first (usually smaller dataset)
      const projectsData = await projectService.getProjects();
      setProjects(projectsData || []);
      
      // Build accessible projects set
      const accessibleProjects = new Set<number>();
      projectsData.forEach((project: any) => {
        accessibleProjects.add(project.id);
      });
      setAccessibleProjectIds(accessibleProjects);
      
      // Fetch meetings (this is usually the large dataset)
      const meetingsData = await meetingService.getMeetings();
      
      // Filter meetings efficiently
      const filteredMeetings = meetingsData.filter((meeting: Meeting) => {
        const projectId = meeting.project_id || meeting.project;
        
        // Personal events: only show to creator
        if (meeting.event_type === 'personal' || !projectId) {
          return meeting.created_by?.id === user?.id;
        }
        
        // Project meetings: must have project access
        if (!accessibleProjects.has(projectId)) {
          return false;
        }
        
        // Show if user created it
        if (meeting.created_by?.id === user?.id) return true;
        
        // Check attendee_ids
        if (meeting.attendee_ids && user?.id && meeting.attendee_ids.includes(user.id)) return true;
        
        // Check attendees string
        const attendeesList = meeting.attendees_list || 
          (meeting.attendees ? meeting.attendees.split(',').map((a: string) => a.trim().toLowerCase()) : []);
        const userName = (user?.name || '').toLowerCase();
        const userEmail = (user?.email || '').toLowerCase();
        
        return attendeesList.some((a: string) => a.includes(userName) || a.includes(userEmail));
      });
      
      setMeetings(filteredMeetings || []);
      setLastFetchTime(now);
      
      // Fetch users in background (not blocking)
      projectService.getUsers().then(usersData => setUsers(usersData || []));
      
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
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

    // Validate recurring meeting settings
    if (newMeeting.isRecurring) {
      if (!newMeeting.endDate) {
        setError('Please select an end date for recurring meetings');
        return;
      }
      if (newMeeting.repeatDays.length === 0) {
        setError('Please select at least one day for recurring meetings');
        return;
      }
      if (new Date(newMeeting.endDate) <= new Date(newMeeting.date)) {
        setError('End date must be after start date');
        return;
      }
    }

    // Check if user has access to the selected project
    if (!accessibleProjectIds.has(newMeeting.project_id)) {
      setError('You do not have access to create meetings for this project');
      return;
    }

    try {
      const createdMeetings: Meeting[] = [];
      
      // Convert to UK time if entered in Myanmar timezone (always store as UK time)
      const ukTime = newMeeting.timezone === 'MM' ? convertMyanmarToUK(newMeeting.time) : newMeeting.time;
      
      if (newMeeting.isRecurring && newMeeting.endDate && newMeeting.repeatDays.length > 0) {
        // Create multiple meetings for recurring schedule
        const startDate = new Date(newMeeting.date);
        const endDate = new Date(newMeeting.endDate);
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dayOfWeek = currentDate.getDay();
          
          if (newMeeting.repeatDays.includes(dayOfWeek)) {
            const dateStr = currentDate.toISOString().split('T')[0];
            
            const meetingData = {
              title: newMeeting.title.trim(),
              description: newMeeting.description.trim(),
              project: newMeeting.project_id,
              date: dateStr,
              time: ukTime,
              duration: newMeeting.duration,
              attendees: newMeeting.attendees,
              attendee_ids: newMeeting.attendee_ids.length > 0 ? newMeeting.attendee_ids : undefined,
              agenda_items: newMeeting.agenda_items.length > 0 ? newMeeting.agenda_items : undefined,
              meeting_link: newMeeting.meeting_link.trim() || undefined,
              reminder_time: newMeeting.reminder_time || undefined,
            };

            const createdMeeting = await meetingService.createMeeting(meetingData);
            createdMeetings.push(createdMeeting);
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        setMeetings([...createdMeetings, ...meetings]);
        alert(`Created ${createdMeetings.length} recurring meetings!`);
      } else {
        // Single meeting creation
      const meetingData = {
        title: newMeeting.title.trim(),
        description: newMeeting.description.trim(),
        project: newMeeting.project_id,
        date: newMeeting.date,
          time: ukTime,
        duration: newMeeting.duration,
        attendees: newMeeting.attendees,
        attendee_ids: newMeeting.attendee_ids.length > 0 ? newMeeting.attendee_ids : undefined,
        agenda_items: newMeeting.agenda_items.length > 0 ? newMeeting.agenda_items : undefined,
        meeting_link: newMeeting.meeting_link.trim() || undefined,
        reminder_time: newMeeting.reminder_time || undefined,
      };

      const createdMeeting = await meetingService.createMeeting(meetingData);
      setMeetings([createdMeeting, ...meetings]);
      }
      
      setNewMeeting({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        project_id: 0,
        attendees: '',
        attendee_ids: [],
        agenda_items: [],
        meeting_link: '',
        reminder_time: 15,
        isRecurring: false,
        endDate: '',
        repeatDays: [],
        timezone: 'UK',
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
    // Fetch project members for the meeting's project
    const projectId = meeting.project_id || meeting.project;
    if (projectId) {
      fetchProjectMembers(projectId);
    }
  };

  const handleUpdateMeetingFromDetail = async (meetingData: any) => {
    if (!selectedMeeting) return;

    // Check if user has access to update this meeting
    const projectId = meetingData.project || selectedMeeting.project_id || selectedMeeting.project;
    if (!projectId || !accessibleProjectIds.has(projectId)) {
      setError('You do not have access to update this meeting');
      return;
    }

    try {
      const updatedMeeting = await meetingService.updateMeeting(selectedMeeting.id, {
        title: meetingData.title.trim(),
        description: meetingData.description?.trim() || '',
        date: meetingData.date,
        time: meetingData.time,
        duration: meetingData.duration,
        project: meetingData.project || projectId,
        attendees: meetingData.attendees,
        attendee_ids: meetingData.attendee_ids,
      });
      
      setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
      setSelectedMeeting(updatedMeeting);
      setError('');
    } catch (err: any) {
      setError('Failed to update meeting');
      console.error('Update meeting error:', err);
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
    
    // Parse agenda_items - handle different formats
    let agendaItems: string[] = [];
    if (Array.isArray(meeting.agenda_items) && meeting.agenda_items.length > 0) {
      agendaItems = meeting.agenda_items;
    } else if (typeof (meeting as any).agenda === 'string' && (meeting as any).agenda.trim()) {
      agendaItems = (meeting as any).agenda.split('\n').filter((a: string) => a.trim());
    }
    
    setNewMeeting({
      title: meeting.title,
      description: meeting.description || '',
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      project_id: meeting.project_id || meeting.project || 0,
      attendees: meeting.attendees_list ? meeting.attendees_list.join(', ') : meeting.attendees || '',
      attendee_ids: meeting.attendee_ids || [],
      agenda_items: agendaItems,
      meeting_link: meeting.meeting_link || '',
      reminder_time: meeting.reminder_time || 15,
      isRecurring: false,
      endDate: '',
      repeatDays: [],
      timezone: 'UK',
    });
    setNewAgendaItem('');
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
        agenda_items: newMeeting.agenda_items.length > 0 ? newMeeting.agenda_items : undefined,
        meeting_link: newMeeting.meeting_link.trim() || undefined,
        reminder_time: newMeeting.reminder_time || undefined,
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
        agenda_items: [],
        meeting_link: '',
        reminder_time: 15,
        isRecurring: false,
        endDate: '',
        repeatDays: [],
        timezone: 'UK',
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

  // Open follow-up meeting modal
  const handleOpenFollowUp = (meeting: Meeting) => {
    // Set the next day as default date for follow-up
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7); // Default to 1 week later
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    // Pre-fill with original meeting data and pre-select original attendees
    setFollowUpMeeting(meeting);
    setFollowUpForm({
      date: dateStr,
      time: meeting.time || '10:00',
      duration: meeting.duration || 60,
      attendee_ids: meeting.attendee_ids || [], // Pre-select original attendees
      agenda_items: [`Follow-up from: ${meeting.title}`],
      meeting_link: meeting.meeting_link || '',
      reminder_time: meeting.reminder_time || 15,
      notes: '',
    });
    setFollowUpAgendaItem('');
    
    // Fetch project members for attendee selection
    const projectId = meeting.project_id || meeting.project;
    if (projectId) {
      fetchProjectMembers(projectId);
    }
    
    setShowFollowUpModal(true);
  };

  // Create follow-up meeting
  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!followUpMeeting || !followUpForm.date || !followUpForm.time) {
      setError('Please fill in date and time for the follow-up meeting');
      return;
    }

    setIsCreatingFollowUp(true);
    
    try {
      const projectId = followUpMeeting.project_id || followUpMeeting.project;
      
      // Strip any existing "Follow-up: " prefix to avoid "Follow-up: Follow-up: ..."
      const baseTitle = followUpMeeting.title.replace(/^(Follow-up:\s*)+/i, '');
      
      const meetingData = {
        title: `Follow-up: ${baseTitle}`,
        description: followUpForm.notes || `Follow-up meeting for: ${baseTitle}\n\nOriginal meeting date: ${followUpMeeting.date}`,
        project: projectId,
        date: followUpForm.date,
        time: followUpForm.time,
        duration: followUpForm.duration,
        attendees: projectMembers
          .filter(m => followUpForm.attendee_ids.includes(m.user_id))
          .map(m => m.name || m.email)
          .join(', '),
        attendee_ids: followUpForm.attendee_ids.length > 0 ? followUpForm.attendee_ids : undefined,
        agenda_items: followUpForm.agenda_items.length > 0 ? followUpForm.agenda_items : undefined,
        meeting_link: followUpForm.meeting_link.trim() || undefined,
        reminder_time: followUpForm.reminder_time || undefined,
      };

      const createdMeeting = await meetingService.createMeeting(meetingData);
      setMeetings([createdMeeting, ...meetings]);
      
      // Send email notifications to attendees
      await sendFollowUpNotifications(createdMeeting, followUpForm.attendee_ids);
      
      // Reset and close
      setShowFollowUpModal(false);
      setFollowUpMeeting(null);
      setFollowUpForm({
        date: '',
        time: '',
        duration: 60,
        attendee_ids: [],
        agenda_items: [],
        meeting_link: '',
        reminder_time: 15,
        notes: '',
      });
      
      alert('✅ Follow-up meeting created and notifications sent to all attendees!');
      
    } catch (err: any) {
      console.error('Error creating follow-up meeting:', err);
      setError('Failed to create follow-up meeting');
    } finally {
      setIsCreatingFollowUp(false);
    }
  };

  // Send email notifications for follow-up meeting
  const sendFollowUpNotifications = async (meeting: any, attendeeIds: number[]) => {
    try {
      // Get attendee emails
      const attendeeEmails: string[] = [];
      for (const id of attendeeIds) {
        const member = projectMembers.find(m => m.user_id === id);
        if (member?.email) {
          attendeeEmails.push(member.email);
        }
      }
      
      // Also add the creator's email
      if (user?.email) {
        attendeeEmails.push(user.email);
      }
      
      if (attendeeEmails.length === 0) return;

      // Call the meeting reminders API to send notifications
      const response = await fetch('/api/meeting-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting: {
            ...meeting,
            project_name: followUpMeeting?.project_name || 'Unknown Project',
            attendees_list: projectMembers
              .filter(m => attendeeIds.includes(m.user_id))
              .map(m => m.name || m.email),
          },
          attendeeEmails,
          isFollowUp: true,
        }),
      });

      if (!response.ok) {
        console.error('Failed to send follow-up notifications');
      }
    } catch (err) {
      console.error('Error sending follow-up notifications:', err);
    }
  };

  // Add agenda item to follow-up
  const addFollowUpAgendaItem = () => {
    if (followUpAgendaItem.trim()) {
      setFollowUpForm(prev => ({
        ...prev,
        agenda_items: [...prev.agenda_items, followUpAgendaItem.trim()],
      }));
      setFollowUpAgendaItem('');
    }
  };

  // Remove agenda item from follow-up
  const removeFollowUpAgendaItem = (index: number) => {
    setFollowUpForm(prev => ({
      ...prev,
      agenda_items: prev.agenda_items.filter((_, i) => i !== index),
    }));
  };

  // Toggle attendee in follow-up
  const toggleFollowUpAttendee = (userId: number) => {
    setFollowUpForm(prev => ({
      ...prev,
      attendee_ids: prev.attendee_ids.includes(userId)
        ? prev.attendee_ids.filter(id => id !== userId)
        : [...prev.attendee_ids, userId],
    }));
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

  // Convert UK time to Myanmar time (Myanmar is UTC+6:30, UK is UTC+0/+1)
  const convertUKToMyanmar = (ukTime: string): string => {
    if (!ukTime) return '';
    const [hours, minutes] = ukTime.split(':').map(Number);
    
    // Myanmar is 5:30 hours ahead of UK (GMT) or 4:30 ahead during BST
    // Using 5:30 as a general offset (UK winter time)
    let myanmarHours = hours + 5;
    let myanmarMinutes = minutes + 30;
    
    if (myanmarMinutes >= 60) {
      myanmarMinutes -= 60;
      myanmarHours += 1;
    }
    
    if (myanmarHours >= 24) {
      myanmarHours -= 24;
    }
    
    return `${String(myanmarHours).padStart(2, '0')}:${String(myanmarMinutes).padStart(2, '0')}`;
  };

  // Convert Myanmar time to UK time (reverse: Myanmar - 5:30 = UK)
  const convertMyanmarToUK = (mmTime: string): string => {
    if (!mmTime) return '';
    const [hours, minutes] = mmTime.split(':').map(Number);
    
    // UK is 5:30 hours behind Myanmar
    let ukHours = hours - 5;
    let ukMinutes = minutes - 30;
    
    if (ukMinutes < 0) {
      ukMinutes += 60;
      ukHours -= 1;
    }
    
    if (ukHours < 0) {
      ukHours += 24;
    }
    
    return `${String(ukHours).padStart(2, '0')}:${String(ukMinutes).padStart(2, '0')}`;
  };

  // Format time with both UK and Myanmar
  const formatTimeWithTimezones = (timeString: string) => {
    const ukTime = formatTime(timeString);
    const myanmarTimeStr = convertUKToMyanmar(timeString);
    const myanmarTime = formatTime(myanmarTimeStr);
    return { uk: ukTime, myanmar: myanmarTime };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // Use meetings directly since filtering is done in fetchMeetings

  const upcomingMeetings = meetings.filter(m => {
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

  const pastMeetings = meetings.filter(m => {
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

  // Memoized meetings grouped by date for faster lookups
  const meetingsByDate = useMemo(() => {
    const grouped: Record<string, Meeting[]> = {};
    meetings.forEach(meeting => {
      if (!grouped[meeting.date]) {
        grouped[meeting.date] = [];
      }
      grouped[meeting.date].push(meeting);
    });
    return grouped;
  }, [meetings]);

  const getMeetingsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayMeetings = meetingsByDate[dateStr] || [];
    // Sort by time (earliest first)
    return dayMeetings.sort((a, b) => {
      const [hoursA, minutesA] = a.time.split(':').map(Number);
      const [hoursB, minutesB] = b.time.split(':').map(Number);
      return (hoursA * 60 + minutesA) - (hoursB * 60 + minutesB);
    });
  };

  // Helper functions for week and day views
  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + i);
      weekDates.push(weekDate);
    }
    return weekDates;
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const previousPeriod = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    } else if (calendarView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 7);
      setCurrentDate(newDate);
    } else if (calendarView === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (calendarView === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    } else if (calendarView === 'week') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 7);
      setCurrentDate(newDate);
    } else if (calendarView === 'day') {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };



  // Calculate calendar values dynamically
  const today = new Date();
  const daysInMonth = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const firstDay = useMemo(() => getFirstDayOfMonth(currentDate), [currentDate]);

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
      <div style={{ minHeight: '100vh', background: '#F5F5ED' }}>
        {isMobile && <MobileHeader title="Meeting Schedule" isMobile={isMobile} />}
        <div style={{ display: 'flex' }}>
          {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
          <div className="page-main" style={{ flex: 1, marginLeft: isMobile ? 0 : '280px', padding: '2rem' }}>
            {/* Skeleton Header */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ height: '32px', width: '250px', background: '#E5E7EB', borderRadius: '8px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '20px', width: '350px', background: '#E5E7EB', borderRadius: '6px', animation: 'pulse 1.5s infinite' }}></div>
            </div>
            {/* Skeleton Calendar Grid */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '16px' }}>
                {[1,2,3,4,5,6,7].map(i => (
                  <div key={i} style={{ height: '40px', background: '#F3F4F6', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                {Array.from({length: 35}, (_, i) => (
                  <div key={i} style={{ height: '100px', background: '#F9FAFB', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {isMobile && <MobileHeader title="Meeting Schedule" isMobile={isMobile} />}
      
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
            background: #f8fafc;
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
              width: 100%;
              overflow-x: hidden;
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
              gap: 0.75rem;
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
            * {
              box-sizing: border-box;
            }
            
            body, html {
              width: 100%;
              max-width: 100vw;
              overflow-x: hidden;
            }
            
            .main-content {
              margin-left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
            }
            
            .header {
              padding: 1rem;
              position: relative;
              width: 100vw !important;
              max-width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
            }
            
            .header-content {
              flex-direction: column;
              gap: 1rem;
              align-items: stretch;
              width: 100%;
              max-width: 100%;
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
              width: 100%;
            }
            
            .filter-controls {
              display: flex;
              gap: 0.5rem;
              justify-content: center;
              flex-wrap: wrap;
            }
            
            .filter-btn {
              flex: 1;
              padding: 0.5rem 1rem;
              font-size: 0.8rem;
              min-width: 120px;
            }
            
            .create-button {
              justify-content: center;
              padding: 0.75rem 1rem;
              font-size: 0.8rem;
              align-self: center;
              min-width: 200px;
              width: 100%;
              max-width: 300px;
            }
            
            .timetable-stats {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
              padding-top: 1rem;
              width: 100%;
              box-sizing: border-box;
            }
            
            .timetable-stats .stat-item {
              padding: 1rem 0.75rem;
              min-height: 80px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            
            .stat-value {
              font-size: 1.5rem;
            }
            
            .stat-label {
              font-size: 0.7rem;
              text-align: center;
            }
            
            .main-content-area {
              padding: 1rem;
              max-width: 100vw !important;
              min-height: calc(100vh - 150px);
              width: 100vw !important;
              box-sizing: border-box;
              margin: 0;
              overflow-x: hidden;
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
            
            /* ULTRA-AGGRESSIVE CALENDAR GRID FIXES */
            .calendar-header-grid,
            .calendar-body-grid,
            .calendar-view div[style*="grid-template-columns"],
            .calendar-view > div:first-child,
            .calendar-view > div:last-child,
            .calendar-view > div > div {
              display: grid !important;
              grid-template-columns: repeat(7, 1fr) !important;
              width: calc(100vw - 2rem) !important;
              min-width: calc(100vw - 2rem) !important;
              gap: 1px !important;
              max-width: calc(100vw - 2rem) !important;
              overflow-x: hidden !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* FORCE ALL CALENDAR ELEMENTS */
            .calendar-view,
            .calendar-view * {
              box-sizing: border-box !important;
              max-width: calc(100vw - 2rem) !important;
            }
            
            .calendar-view > div {
              width: calc(100vw - 2rem) !important;
              max-width: calc(100vw - 2rem) !important;
              margin: 0 !important;
            }
            
            /* OVERRIDE ANY CONFLICTING GRID STYLES */
            .calendar-view div {
              grid-column: unset !important;
              grid-row: unset !important;
            }
            
            /* Calendar Day Cells Mobile */
            .calendar-day,
            [class*="calendar-day"],
            .calendar-view div[style*="border-right"] {
              min-height: 100px !important;
              padding: 8px !important;
              font-size: 12px !important;
              overflow: hidden !important;
              border: 1px solid #E5E7EB !important;
              background: white !important;
              box-sizing: border-box !important;
            }

            /* Week and Day View Mobile Adjustments */
            .calendar-view div[style*="gridTemplateColumns"] {
              grid-template-columns: repeat(7, 1fr) !important;
              gap: 1px !important;
            }

            .calendar-view div[style*="minHeight: 500px"] {
              min-height: 300px !important;
            }

            .calendar-view div[style*="minHeight: 700px"] {
              min-height: 400px !important;
            }
            
            /* FORCE CALENDAR STRUCTURE */
            .calendar-view {
              width: calc(100vw - 2rem) !important;
              max-width: calc(100vw - 2rem) !important;
              overflow-x: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
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
              padding: 0.75rem;
            }
            
            .header-title {
              font-size: 1.25rem;
              text-align: center;
            }
            
            .header-title p {
              font-size: 0.8rem;
              line-height: 1.3;
            }
            
            .main-content-area {
              padding: 0.75rem;
              min-height: calc(100vh - 120px);
            }
            
            .timetable-stats {
              grid-template-columns: 1fr;
              gap: 0.5rem;
            }
            
            .stat-item {
              padding: 0.75rem;
              min-height: 60px;
            }
            
            .stat-value {
              font-size: 1.25rem;
            }
            
            .stat-label {
              font-size: 0.65rem;
            }
            
            .filter-btn {
              padding: 0.5rem 0.75rem;
              font-size: 0.75rem;
              min-width: 100px;
            }
            
            .create-button {
              padding: 0.75rem;
              font-size: 0.8rem;
              width: 100%;
              max-width: none;
            }
            
            .meeting-card {
              padding: 0.75rem;
            }
            
            .meeting-title {
              font-size: 1rem;
            }
            
            .meeting-project {
              font-size: 0.8rem;
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
            
            /* FORCE CALENDAR TABLE LAYOUT */
            .calendar-view table {
              width: 100% !important;
              table-layout: fixed !important;
              border-collapse: collapse !important;
            }
            
            .calendar-view th,
            .calendar-view td {
              width: 14.285% !important;
              min-width: 40px !important;
              box-sizing: border-box !important;
              padding: 4px !important;
              font-size: 10px !important;
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
                  Meeting Schedule
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
                    onClick={() => previousPeriod()}
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, justifyContent: 'center' }}>
                    <button
                      onClick={goToToday}
                      style={{
                        padding: '0.5rem 1rem',
                        border: '1px solid #6b7280',
                        background: '#ffffff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#6b7280',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#374151';
                        e.currentTarget.style.color = '#374151';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#6b7280';
                        e.currentTarget.style.color = '#6b7280';
                      }}
                    >
                      Today
                    </button>
                    
                    <h2 style={{ 
                      margin: 0, 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      color: '#000000',
                      textAlign: 'center'
                    }}>
                      {calendarView === 'month' 
                        ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                        : calendarView === 'week'
                        ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                        : currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                      }
                    </h2>
                  </div>

                  <button
                    onClick={() => nextPeriod()}
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
                
                {/* Calendar View Selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCalendarView('month')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: calendarView === 'month' ? '2px solid #5884FD' : '1px solid #d1d5db',
                      background: calendarView === 'month' ? '#5884FD' : '#ffffff',
                      color: calendarView === 'month' ? '#ffffff' : '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (calendarView !== 'month') {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (calendarView !== 'month') {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: calendarView === 'week' ? '2px solid #5884FD' : '1px solid #d1d5db',
                      background: calendarView === 'week' ? '#5884FD' : '#ffffff',
                      color: calendarView === 'week' ? '#ffffff' : '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (calendarView !== 'week') {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (calendarView !== 'week') {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('day')}
                    style={{
                      padding: '0.5rem 1rem',
                      border: calendarView === 'day' ? '2px solid #5884FD' : '1px solid #d1d5db',
                      background: calendarView === 'day' ? '#5884FD' : '#ffffff',
                      color: calendarView === 'day' ? '#ffffff' : '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (calendarView !== 'day') {
                        e.currentTarget.style.background = '#f9fafb';
                        e.currentTarget.style.borderColor = '#9ca3af';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (calendarView !== 'day') {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }
                    }}
                  >
                    Day
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
                              handleOpenFollowUp(meeting);
                            }}
                            className="action-btn"
                            title="Schedule follow-up"
                            style={{ background: '#dbeafe', color: '#2563eb' }}
                          >
                            <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
                          </button>
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="detail-item">
                          <ClockIcon style={{ width: '16px', height: '16px' }} />
                            <span style={{ fontWeight: '600', fontSize: '11px', color: '#6B7280', minWidth: '24px' }}>UK</span>
                            <span>{formatTime(meeting.time)}</span>
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>({formatDuration(meeting.duration)})</span>
                          </div>
                          <div className="detail-item" style={{ paddingLeft: '22px' }}>
                            <span style={{ fontWeight: '600', fontSize: '11px', color: '#D97706', minWidth: '24px' }}>MM</span>
                            <span style={{ color: '#B45309' }}>{formatTime(convertUKToMyanmar(meeting.time))}</span>
                          </div>
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

                      {/* Follow-up button for quick access */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFollowUp(meeting);
                        }}
                        style={{
                          marginTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                        Schedule Follow-up Meeting
                      </button>
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
                              handleOpenFollowUp(meeting);
                            }}
                            className="action-btn"
                            title="Schedule follow-up"
                            style={{ background: '#dbeafe', color: '#2563eb' }}
                          >
                            <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div className="detail-item">
                          <ClockIcon style={{ width: '16px', height: '16px' }} />
                            <span style={{ fontWeight: '600', fontSize: '11px', color: '#6B7280', minWidth: '24px' }}>UK</span>
                            <span>{formatTime(meeting.time)}</span>
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>({formatDuration(meeting.duration)})</span>
                          </div>
                          <div className="detail-item" style={{ paddingLeft: '22px' }}>
                            <span style={{ fontWeight: '600', fontSize: '11px', color: '#D97706', minWidth: '24px' }}>MM</span>
                            <span style={{ color: '#B45309' }}>{formatTime(convertUKToMyanmar(meeting.time))}</span>
                          </div>
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

                      {/* Follow-up button for past meetings */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFollowUp(meeting);
                        }}
                        style={{
                          marginTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          width: '100%',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ArrowPathIcon style={{ width: '14px', height: '14px' }} />
                        Schedule Follow-up Meeting
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </>
              )}

              {/* Calendar Views */}
              {viewMode === 'calendar' && (
                <>
                  {/* Month View */}
                  {calendarView === 'month' && (
                <div className="calendar-view" style={{ 
                  width: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                  maxWidth: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                  overflow: 'hidden',
                  padding: '0',
                  margin: '0 auto',
                  boxSizing: 'border-box'
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                  }}>
                    {/* Calendar Header */}
                  <div 
                    className="calendar-header-grid"
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(7, 1fr)', 
                      background: '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB',
                      width: '100%',
                      minWidth: '100%'
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
                    <div 
                      className="calendar-body-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        width: '100%',
                        minWidth: '100%',
                        gap: '0'
                      }}>
                    
                    {/* Empty cells for days before the first day of the month */}
                    {Array.from({ length: firstDay }, (_, index) => {
                      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
                      const prevMonthDays = getDaysInMonth(prevMonth);
                      const dayNumber = prevMonthDays - firstDay + index + 1;
                      
                      return (
                        <div key={`prev-${index}`} className="calendar-cell other-month" style={{
                          minHeight: '150px',
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
                            minHeight: '150px',
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
                                  flexDirection: 'column',
                                  gap: '2px',
                                  fontSize: '0.625rem'
                                }}>
                                <div style={{ 
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      <span style={{ fontWeight: '600', color: '#1E3A5F', fontSize: '9px' }}>UK</span>
                                      <span style={{ color: '#0369A1', fontWeight: '500' }}>{formatTime(meeting.time)}</span>
                                </div>
                                  <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                      gap: '2px',
                                    color: '#6B7280'
                                  }}>
                                      <UserGroupIcon style={{ width: '9px', height: '9px' }} />
                                      <span style={{ fontSize: '9px' }}>{meeting.created_by.name.split(' ')[0]}</span>
                                    </div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <span style={{ fontWeight: '600', color: '#92400E', fontSize: '9px' }}>MM</span>
                                    <span style={{ color: '#B45309', fontWeight: '500' }}>{formatTime(convertUKToMyanmar(meeting.time))}</span>
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
                          minHeight: '150px',
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

                  {/* Week View */}
                  {calendarView === 'week' && (
                    <div className="calendar-view" style={{ 
                      width: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                      maxWidth: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                      overflow: 'hidden',
                      padding: '0',
                      margin: '0 auto',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        minHeight: '600px'
                      }}>
                        {/* Week Header */}
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(7, 1fr)', 
                          background: '#F9FAFB',
                          borderBottom: '1px solid #E5E7EB'
                        }}>
                          {getWeekDates(currentDate).map((date, index) => (
                            <div key={index} style={{
                              padding: '1rem', 
                              textAlign: 'center',
                              fontWeight: '600',
                              color: '#374151',
                              borderRight: index < 6 ? '1px solid #E5E7EB' : 'none',
                              fontFamily: "'Mabry Pro', 'Inter', sans-serif",
                              fontSize: '0.875rem'
                            }}>
                              <div>{formatDateHeader(date)}</div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Week Body */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          minHeight: '500px'
                        }}>
                          {getWeekDates(currentDate).map((date, index) => {
                            const dayMeetings = getMeetingsForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            
                            return (
                              <div key={index} style={{
                                padding: '1rem',
                                borderRight: index < 6 ? '1px solid #E5E7EB' : 'none',
                                background: isToday ? 'rgba(88, 132, 253, 0.05)' : '#FFFFFF',
                                minHeight: '500px',
                                position: 'relative'
                              }}>
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
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {dayMeetings.map((meeting) => (
                                    <div 
                                      key={meeting.id}
                                      onClick={() => handleMeetingClick(meeting)}
                                      style={{ 
                                        background: '#F8FAFC',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        borderLeft: '3px solid #5884FD'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#F1F5F9';
                                        e.currentTarget.style.borderColor = '#5884FD';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#F8FAFC';
                                        e.currentTarget.style.borderColor = '#E2E8F0';
                                      }}
                                    >
                                      <div style={{
                                        fontWeight: '600',
                                        color: '#1F2937',
                                        marginBottom: '0.25rem'
                                      }}>
                                        {meeting.title}
                                      </div>
                                      <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        fontSize: '0.7rem',
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ fontWeight: '600', color: '#1E3A5F', fontSize: '10px' }}>UK</span>
                                          <span style={{ color: '#0369A1' }}>{formatTime(meeting.time)}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ fontWeight: '600', color: '#92400E', fontSize: '10px' }}>MM</span>
                                          <span style={{ color: '#B45309' }}>{formatTime(convertUKToMyanmar(meeting.time))}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Day View */}
                  {calendarView === 'day' && (
                    <div className="calendar-view" style={{ 
                      width: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                      maxWidth: isMobile ? 'calc(100vw - 2rem)' : '100%', 
                      overflow: 'hidden',
                      padding: '0',
                      margin: '0 auto',
                      boxSizing: 'border-box'
                    }}>
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        minHeight: '700px'
                      }}>
                        {/* Day Header */}
                        <div style={{ 
                          background: '#F9FAFB',
                          borderBottom: '1px solid #E5E7EB',
                          padding: '1.5rem',
                          textAlign: 'center'
                        }}>
                          <h3 style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#1F2937',
                            fontFamily: "'Mabry Pro', 'Inter', sans-serif"
                          }}>
                            {currentDate.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </h3>
                        </div>
                        
                        {/* Day Body - Time Grid */}
                        <div style={{ padding: '1rem' }}>
                          {Array.from({ length: 24 }, (_, hour) => {
                            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                            const hourMeetings = getMeetingsForDate(currentDate).filter(meeting => 
                              meeting.time.startsWith(hour.toString().padStart(2, '0'))
                            );
                            
                            return (
                              <div key={hour} style={{
                                display: 'flex',
                                borderBottom: '1px solid #F3F4F6',
                                minHeight: '60px',
                                alignItems: 'flex-start'
                              }}>
                                <div style={{
                                  width: '80px',
                                  padding: '0.5rem',
                                  fontSize: '0.875rem',
                                  color: '#6B7280',
                                  fontWeight: '500',
                                  textAlign: 'right',
                                  borderRight: '1px solid #F3F4F6'
                                }}>
                                  {timeStr}
                                </div>
                                <div style={{
                                  flex: 1,
                                  padding: '0.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.25rem'
                                }}>
                                  {hourMeetings.map((meeting) => (
                                    <div 
                                      key={meeting.id}
                                      onClick={() => handleMeetingClick(meeting)}
                                      style={{ 
                                        background: '#EEF2FF',
                                        border: '1px solid #C7D2FE',
                                        borderRadius: '8px',
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        borderLeft: '4px solid #5884FD'
                                      }}
                                      onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#E0E7FF';
                                        e.currentTarget.style.borderColor = '#A5B4FC';
                                      }}
                                      onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#EEF2FF';
                                        e.currentTarget.style.borderColor = '#C7D2FE';
                                      }}
                                    >
                                      <div style={{
                                        fontWeight: '600',
                                        color: '#1F2937',
                                        marginBottom: '0.25rem',
                                        fontSize: '1rem'
                                      }}>
                                        {meeting.title}
                                      </div>
                                      <div style={{
                                        fontSize: '0.875rem',
                                        marginBottom: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                      }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ fontWeight: '600', color: '#1E3A5F', fontSize: '11px' }}>UK</span>
                                          <span style={{ color: '#0369A1' }}>{formatTime(meeting.time)}</span>
                                        </div>
                                        <span style={{ color: '#D1D5DB' }}>|</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span style={{ fontWeight: '600', color: '#92400E', fontSize: '11px' }}>MM</span>
                                          <span style={{ color: '#B45309' }}>{formatTime(convertUKToMyanmar(meeting.time))}</span>
                                        </div>
                                        <span style={{ color: '#D1D5DB' }}>•</span>
                                        <span style={{ color: '#6B7280' }}>{meeting.project_name}</span>
                                      </div>
                                      {meeting.description && (
                                        <div style={{
                                          fontSize: '0.75rem',
                                          color: '#9CA3AF'
                                        }}>
                                          {meeting.description}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
          onFollowUp={(meeting) => {
            setShowMeetingDetail(false);
            setSelectedMeeting(null);
            handleOpenFollowUp(meeting as any);
          }}
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
            agenda_items: [],
            meeting_link: '',
            reminder_time: 15,
            isRecurring: false,
            endDate: '',
            repeatDays: [],
            timezone: 'UK',
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
                    agenda_items: [],
                    meeting_link: '',
                    reminder_time: 15,
                    isRecurring: false,
                    endDate: '',
                    repeatDays: [],
                    timezone: 'UK',
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
                  <label className="form-label">Timezone</label>
                  <select
                    className="form-select"
                    value={newMeeting.timezone}
                    onChange={(e) => setNewMeeting({ ...newMeeting, timezone: e.target.value as 'UK' | 'MM' })}
                    style={{ marginBottom: '8px' }}
                  >
                    <option value="UK">UK (GMT/BST)</option>
                    <option value="MM">Myanmar (MMT)</option>
                  </select>
                  <label className="form-label">Time *</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={newMeeting.time}
                    onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                  />
                  {newMeeting.time && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '10px 12px', 
                      background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)', 
                      borderRadius: '8px',
                      border: '1px solid #BAE6FD',
                      fontSize: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', color: '#1E3A5F', fontSize: '11px' }}>UK</span>
                          <span style={{ color: '#0369A1', fontWeight: '500' }}>
                            {formatTime(newMeeting.timezone === 'UK' ? newMeeting.time : convertMyanmarToUK(newMeeting.time))}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '700', color: '#92400E', fontSize: '11px' }}>MM</span>
                          <span style={{ color: '#B45309', fontWeight: '500' }}>
                            {formatTime(newMeeting.timezone === 'MM' ? newMeeting.time : convertUKToMyanmar(newMeeting.time))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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

              {/* Recurring Meeting Options */}
              {!editingMeeting && (
                <div style={{
                  padding: '16px',
                  background: newMeeting.isRecurring ? '#EFF6FF' : '#F9FAFB',
                  borderRadius: '12px',
                  border: newMeeting.isRecurring ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                  marginBottom: '16px'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      checked={newMeeting.isRecurring}
                      onChange={(e) => setNewMeeting({ ...newMeeting, isRecurring: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: '#3B82F6' }}
                    />
                    <span>Recurring Meeting</span>
                  </label>
                  
                  {newMeeting.isRecurring && (
                    <div style={{ marginTop: '16px' }}>
                      {/* End Date */}
                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                          End Date *
                        </label>
                        <input
                          type="date"
                          className="form-input"
                          value={newMeeting.endDate}
                          min={newMeeting.date}
                          onChange={(e) => setNewMeeting({ ...newMeeting, endDate: e.target.value })}
                          style={{ width: '100%' }}
                        />
                      </div>
                      
                      {/* Day Selection */}
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                          Repeat on Days *
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { day: 0, label: 'Sun' },
                            { day: 1, label: 'Mon' },
                            { day: 2, label: 'Tue' },
                            { day: 3, label: 'Wed' },
                            { day: 4, label: 'Thu' },
                            { day: 5, label: 'Fri' },
                            { day: 6, label: 'Sat' },
                          ].map(({ day, label }) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const newDays = newMeeting.repeatDays.includes(day)
                                  ? newMeeting.repeatDays.filter(d => d !== day)
                                  : [...newMeeting.repeatDays, day];
                                setNewMeeting({ ...newMeeting, repeatDays: newDays });
                              }}
                              style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: newMeeting.repeatDays.includes(day) ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                                background: newMeeting.repeatDays.includes(day) ? '#3B82F6' : 'white',
                                color: newMeeting.repeatDays.includes(day) ? 'white' : '#374151',
                                fontWeight: '600',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {newMeeting.repeatDays.length > 0 && (
                          <p style={{ marginTop: '8px', fontSize: '13px', color: '#6B7280' }}>
                            Meeting will repeat every {newMeeting.repeatDays.sort((a, b) => a - b).map(d => 
                              ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]
                            ).join(', ')} from {newMeeting.date || 'start date'} to {newMeeting.endDate || 'end date'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              {/* Meeting Agenda */}
              <div className="form-group">
                <label className="form-label">Meeting Agenda</label>
                
                {/* Add new agenda item */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Add agenda item..."
                    value={newAgendaItem}
                    onChange={(e) => setNewAgendaItem(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newAgendaItem.trim()) {
                        e.preventDefault();
                        setNewMeeting({
                          ...newMeeting,
                          agenda_items: [...newMeeting.agenda_items, newAgendaItem.trim()]
                        });
                        setNewAgendaItem('');
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
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
                      background: '#10B981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: '600'
                    }}
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add
                  </button>
                </div>

                {/* Agenda items list */}
                {newMeeting.agenda_items.length > 0 ? (
                  <div style={{ 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    background: '#F9FAFB'
                  }}>
                    {newMeeting.agenda_items.map((item, index) => (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderBottom: index < newMeeting.agenda_items.length - 1 ? '1px solid #E5E7EB' : 'none',
                          background: 'white'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#5884FD',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {index + 1}
                          </span>
                          <span style={{ fontSize: '14px', color: '#374151' }}>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewMeeting({
                              ...newMeeting,
                              agenda_items: newMeeting.agenda_items.filter((_, i) => i !== index)
                            });
                          }}
                          style={{
                            padding: '4px 8px',
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: '#9CA3AF',
                    border: '2px dashed #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}>
                    No agenda items yet. Add items to keep your meeting focused.
                  </div>
                )}
              </div>

              {/* Meeting Link */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#3b82f6' }}>
                    <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Meeting Link (Zoom/Google Meet/Teams)
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={newMeeting.meeting_link}
                  onChange={(e) => setNewMeeting({ ...newMeeting, meeting_link: e.target.value })}
                  style={{ 
                    borderColor: newMeeting.meeting_link ? '#3b82f6' : undefined,
                    background: newMeeting.meeting_link ? '#eff6ff' : undefined
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Add a video call link for remote attendees
                </p>
              </div>

              {/* Email Reminder */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '18px', height: '18px', color: '#f59e0b' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                  </svg>
                  Email Reminder
                </label>
                <select
                  className="form-select"
                  value={newMeeting.reminder_time}
                  onChange={(e) => setNewMeeting({ ...newMeeting, reminder_time: Number(e.target.value) })}
                  style={{ 
                    borderColor: '#f59e0b',
                    background: '#fffbeb'
                  }}
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
                <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                  Send an email notification to all attendees before the meeting starts
                </p>
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
                    agenda_items: [],
                    meeting_link: '',
                    reminder_time: 15,
                    isRecurring: false,
                    endDate: '',
                    repeatDays: [],
                    timezone: 'UK',
                  });
                }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-Up Meeting Modal */}
      {showFollowUpModal && followUpMeeting && (
        <div 
          className="modal-overlay"
          onClick={() => setShowFollowUpModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            {/* Header */}
            <div style={{
              background: '#1F2937',
              padding: '24px',
              color: '#fff',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Schedule Follow-up
                  </p>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#fff' }}>
                    {followUpMeeting.title.replace(/^(Follow-up:\s*)+/i, '')}
                  </h2>
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
                      <CalendarDaysIcon style={{ width: '14px', height: '14px' }} />
                      {formatDate(followUpMeeting.date)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF' }}>
                      <ClockIcon style={{ width: '14px', height: '14px' }} />
                      {formatTime(followUpMeeting.time)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFollowUpModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  <XMarkIcon style={{ width: '20px', height: '20px', color: '#fff' }} />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateFollowUp} style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
              {/* Date and Time Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={followUpForm.date}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Time (UK)
                  </label>
                  <input
                    type="time"
                    value={followUpForm.time}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, time: e.target.value }))}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  {followUpForm.time && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#D97706', fontWeight: '500' }}>
                      MM: {formatTime(convertUKToMyanmar(followUpForm.time))}
                </div>
                  )}
              </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Duration
                  </label>
                  <select
                    value={followUpForm.duration}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {/* Meeting Link and Reminder Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={followUpForm.meeting_link}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, meeting_link: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reminder
                  </label>
                  <select
                    value={followUpForm.reminder_time}
                    onChange={(e) => setFollowUpForm(prev => ({ ...prev, reminder_time: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={0}>None</option>
                    <option value={5}>5 min</option>
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>
              </div>

              {/* Attendees - Show original meeting attendees */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Attendees
                </label>
                {(() => {
                  // Get original meeting attendees - from attendee_ids or attendees_list
                  const originalAttendeeIds = followUpMeeting?.attendee_ids || [];
                  const originalAttendeeNames = followUpMeeting?.attendees_list || 
                    (followUpMeeting?.attendees ? followUpMeeting.attendees.split(',').map((a: string) => a.trim()).filter((a: string) => a) : []);
                  
                  // Get user objects for original attendees
                  const originalAttendees = originalAttendeeIds.length > 0
                    ? users.filter(u => originalAttendeeIds.includes(u.id))
                    : originalAttendeeNames.map((name: string, idx: number) => ({ id: idx, name, email: '' }));
                  
                  if (originalAttendees.length === 0 && originalAttendeeNames.length > 0) {
                    // Fallback: show names as tags if we can't match to user objects
                    return (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px', 
                        padding: '12px', 
                        background: '#f9fafb', 
                        borderRadius: '8px'
                      }}>
                        {originalAttendeeNames.map((name: string, idx: number) => (
                          <div
                            key={idx}
                  style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              background: '#dbeafe',
                              border: '2px solid #3b82f6',
                              borderRadius: '20px',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              {name.charAt(0).toUpperCase()}
                            </span>
                            {name}
                            <CheckIcon style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
              </div>
                        ))}
                      </div>
                    );
                  }
                  
                  if (originalAttendees.length > 0) {
                    return (
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px', 
                        padding: '12px', 
                        background: '#f9fafb', 
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}>
                        {originalAttendees.map((member: any) => {
                          const userId = member.id || member.user_id;
                          const isSelected = followUpForm.attendee_ids.includes(userId);
                        return (
                          <div
                              key={userId}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                                toggleFollowUpAttendee(userId);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 10px',
                              background: isSelected ? '#dbeafe' : '#fff',
                              border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                              borderRadius: '20px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              transition: 'all 0.2s ease',
                              userSelect: 'none',
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: isSelected ? '#3b82f6' : '#e5e7eb',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}>
                              {(member.name || member.email || '?').charAt(0).toUpperCase()}
                            </span>
                            {member.name || member.email}
                            {isSelected && (
                              <CheckIcon style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                            )}
                          </div>
                        );
                      })}
                  </div>
                    );
                  }
                  
                  return (
                  <p style={{ fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
                      No attendees in original meeting
                  </p>
                  );
                })()}
              </div>

              {/* Agenda Items */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Agenda
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={followUpAgendaItem}
                    onChange={(e) => setFollowUpAgendaItem(e.target.value)}
                    placeholder="Add agenda item..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFollowUpAgendaItem())}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      background: '#F9FAFB',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={addFollowUpAgendaItem}
                    style={{
                      padding: '12px 20px',
                      background: '#1F2937',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#1F2937'}
                  >
                    Add
                  </button>
                </div>
                {followUpForm.agenda_items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {followUpForm.agenda_items.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f3f4f6',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}
                      >
                        <span>{index + 1}. {item}</span>
                        <button
                          type="button"
                          onClick={() => removeFollowUpAgendaItem(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <XMarkIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notes
                </label>
                <textarea
                  value={followUpForm.notes}
                  onChange={(e) => setFollowUpForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional context for this follow-up..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none',
                    background: '#F9FAFB',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #E5E7EB'
              }}>
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  style={{
                    padding: '14px 24px',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFollowUp}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    background: isCreatingFollowUp ? '#9CA3AF' : '#1F2937',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isCreatingFollowUp ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => !isCreatingFollowUp && (e.currentTarget.style.background = '#374151')}
                  onMouseLeave={(e) => !isCreatingFollowUp && (e.currentTarget.style.background = '#1F2937')}
                >
                  {isCreatingFollowUp ? (
                    <>
                      <svg className="animate-spin" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }} />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Schedule Follow-up'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 