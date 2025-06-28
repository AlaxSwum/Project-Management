'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  HomeIcon,
  FolderIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  CalendarDaysIcon,
  PlusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  InboxIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

interface Project {
  id: number;
  name: string;
  color?: string;
  task_count?: number;
  completed_task_count?: number;
}

interface SidebarProps {
  projects: Project[];
  onCreateProject: () => void;
}

/*
SUPABASE SCHEMA FOR LEAVE REQUESTS:

Table: leave_requests
- id (uuid, primary key)
- employee_id (uuid, foreign key to auth.users)
- employee_name (text)
- employee_email (text)
- start_date (date)
- end_date (date)
- leave_type (text: vacation, sick, personal, family, medical, other)
- reason (text)
- notes (text, nullable)
- days_requested (integer)
- status (text: pending, approved, rejected)
- created_at (timestamp with time zone)
- approved_by (uuid, foreign key to auth.users - HR only)
- approved_at (timestamp with time zone, nullable)

Table: employee_leave_balance
- id (uuid, primary key)
- employee_id (uuid, foreign key to auth.users)
- total_days (integer, default: 14)
- used_days (integer, default: 0)
- available_days (integer, calculated: total_days - used_days)
- year (integer, current year)
- created_at (timestamp with time zone)
- updated_at (timestamp with time zone)

HR APPROVAL WORKFLOW:
1. Employee submits leave request → Supabase stores with status: 'pending'
2. HR reviews request in HR dashboard
3. HR approves/rejects → Updates status and approved_by/approved_at
4. If approved → Days deducted from employee_leave_balance.available_days
5. Employee receives notification via Supabase realtime or email
*/

export default function Sidebar({ projects, onCreateProject }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceFormData, setAbsenceFormData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    leaveType: 'vacation',
    notes: '',
    projectId: 0
  });
  const [availableLeave, setAvailableLeave] = useState(14); // 14 days per employee
  const [usedLeave, setUsedLeave] = useState(0);

  // Fetch leave balance on component mount and user change
  const fetchLeaveBalance = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data: balanceData, error } = await supabase
        .from('employee_leave_balance')
        .select('available_days, used_days, total_days')
        .eq('employee_id', user.id)
        .single();
      
      if (error) {
        console.log('No leave balance record found, using defaults');
        setAvailableLeave(14);
        setUsedLeave(0);
      } else {
        setAvailableLeave(balanceData.available_days || 14);
        setUsedLeave(balanceData.used_days || 0);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      // Use defaults if error
      setAvailableLeave(14);
      setUsedLeave(0);
    }
  };

  // Fetch balance when user changes
  useEffect(() => {
    if (user?.id) {
      fetchLeaveBalance();
    }
  }, [user?.id]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Weekly Report state
  const [showWeeklyReportForm, setShowWeeklyReportForm] = useState(false);
  const [weeklyReportData, setWeeklyReportData] = useState({
    projectId: 0,
    weekNumber: 0,
    year: new Date().getFullYear(),
    weekStartDate: '',
    weekEndDate: '',
    dateRangeDisplay: '',
    keyActivities: [''],
    ongoingTasks: [''],
    challenges: [''],
    teamPerformance: [''],
    nextWeekPriorities: [''],
    otherNotes: ''
  });
  
  // Inbox/Notifications state
  const [showInbox, setShowInbox] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const handleAbsenceForm = async () => {
    setShowAbsenceForm(true);
    closeDropdown();
    
    // Refresh leave balance to get latest data
    await fetchLeaveBalance();
  };

  const handleAbsenceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate number of days requested
    const startDate = new Date(absenceFormData.startDate);
    const endDate = new Date(absenceFormData.endDate);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end date
    
    if (daysDiff > availableLeave) {
      alert(`You only have ${availableLeave} days available. You requested ${daysDiff} days.`);
      return;
    }
    
    try {
      // Check if user is available
      if (!user?.id) {
        alert('User not found. Please log in again.');
        return;
      }

      // Get project name if project is selected
      const selectedProject = projects.find(p => p.id === absenceFormData.projectId);

      // Submit leave request to database
      const leaveRequest = {
        start_date: absenceFormData.startDate,
        end_date: absenceFormData.endDate,
        leave_type: absenceFormData.leaveType,
        reason: absenceFormData.reason,
        notes: absenceFormData.notes || '',
        project_id: absenceFormData.projectId || null,
        project_name: selectedProject?.name || null
      };
      
      console.log('Submitting leave request:', leaveRequest);
      console.log('Auth token exists:', !!localStorage.getItem('accessToken'));
      console.log('Auth token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
      console.log('User data:', user);
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      });

      // Store in Supabase database directly
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([{
          employee_id: user.id,
          employee_name: user.name || user.email?.split('@')[0] || 'Unknown',
          employee_email: user.email,
          project_id: leaveRequest.project_id,
          project_name: leaveRequest.project_name,
          start_date: leaveRequest.start_date,
          end_date: leaveRequest.end_date,
          leave_type: leaveRequest.leave_type,
          reason: leaveRequest.reason,
          notes: leaveRequest.notes,
          days_requested: daysDiff,
          status: 'pending'
        }])
        .select();

      if (!error) {
        // Reset form and close modal
        setAbsenceFormData({
          startDate: '',
          endDate: '',
          reason: '',
          leaveType: 'vacation',
          notes: '',
          projectId: 0
        });
        setShowAbsenceForm(false);
        
        // Create notifications for HR users
        try {
          // Get all HR/admin users
          const { data: hrUsers, error: hrError } = await supabase
            .from('auth_user')
            .select('id, first_name, last_name, email')
            .or('is_staff.eq.true,is_superuser.eq.true');
          
          if (!hrError && hrUsers && hrUsers.length > 0) {
            // Create notifications for each HR user
            const notifications = hrUsers.map(hrUser => ({
              recipient_id: hrUser.id,
              sender_id: user.id,
              type: 'leave_request_submitted',
              title: 'New Leave Request',
              message: `${user.name || user.email?.split('@')[0]} has submitted a ${daysDiff}-day leave request for ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
              data: {
                leave_request_id: data[0]?.id,
                employee_name: user.name || user.email?.split('@')[0],
                employee_email: user.email,
                days: daysDiff,
                start_date: absenceFormData.startDate,
                end_date: absenceFormData.endDate,
                leave_type: absenceFormData.leaveType
              }
            }));
            
            const { error: notifyError } = await supabase
              .from('notifications')
              .insert(notifications);
            
            if (notifyError) {
              console.error('Error creating HR notifications:', notifyError);
            }
          }
        } catch (notifyError) {
          console.error('Error notifying HR users:', notifyError);
        }
        
        // Refresh leave balance after submission
        await fetchLeaveBalance();
        
        alert(`Leave request submitted successfully! 
        
Your request for ${daysDiff} days has been sent to HR for approval.
        
Status: Pending Approval
Days Requested: ${daysDiff}
Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}

You will be notified once HR reviews your request.`);
      } else {
        console.error('Error submitting leave request:', error);
        throw new Error(error.message || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Failed to submit leave request. Please try again.');
    }
  };

  const handleAbsenceFormClose = () => {
    setShowAbsenceForm(false);
    setAbsenceFormData({
      startDate: '',
      endDate: '',
      reason: '',
      leaveType: 'vacation',
      notes: '',
      projectId: 0
    });
  };

  const calculateRequestedDays = () => {
    if (!absenceFormData.startDate || !absenceFormData.endDate) return 0;
    const startDate = new Date(absenceFormData.startDate);
    const endDate = new Date(absenceFormData.endDate);
    if (endDate < startDate) return 0;
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  };

  const handleWeeklyReport = () => {
    setShowWeeklyReportForm(true);
    closeDropdown();
    
    // Calculate current week details
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const { start: weekStart, end: weekEnd } = getWeekDateRange(now);
    const dateRangeDisplay = formatWeekDisplay(weekNumber, weekStart, weekEnd, now.getFullYear());
    
    setWeeklyReportData(prev => ({
      ...prev,
      weekNumber,
      year: now.getFullYear(),
      weekStartDate: weekStart.toISOString().split('T')[0],
      weekEndDate: weekEnd.toISOString().split('T')[0],
      dateRangeDisplay
    }));
  };

  // Week calculation utilities
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  const getWeekDateRange = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday is first day
    const start = new Date(d.setDate(diff));
    const end = new Date(d.setDate(diff + 6));
    return { start, end };
  };

  const formatWeekDisplay = (weekNumber: number, startDate: Date, endDate: Date, year: number) => {
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    return `Week ${weekNumber} – ${startFormatted} to ${endFormatted}, ${year}`;
  };

  const handleWeeklyReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keyActivitiesText = weeklyReportData.keyActivities.filter(item => item.trim()).join('\n• ');
    if (!keyActivitiesText || !weeklyReportData.projectId) {
      alert('Please fill in the required fields: Key Activities and Project.');
      return;
    }

    try {
      if (!user?.id) {
        alert('User not found. Please log in again.');
        return;
      }

      const selectedProject = projects.find(p => p.id === weeklyReportData.projectId);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Convert arrays to formatted text
      const formatArrayField = (array: string[]) => {
        const filtered = array.filter(item => item.trim());
        return filtered.length > 0 ? '• ' + filtered.join('\n• ') : null;
      };
      
      const { data, error } = await supabase
        .from('weekly_reports')
        .insert([{
          employee_id: user.id,
          employee_name: user.name || user.email?.split('@')[0] || 'Unknown',
          employee_email: user.email,
          project_id: weeklyReportData.projectId,
          project_name: selectedProject?.name || null,
          week_number: weeklyReportData.weekNumber,
          year: weeklyReportData.year,
          week_start_date: weeklyReportData.weekStartDate,
          week_end_date: weeklyReportData.weekEndDate,
          date_range_display: weeklyReportData.dateRangeDisplay,
          key_activities: formatArrayField(weeklyReportData.keyActivities),
          ongoing_tasks: formatArrayField(weeklyReportData.ongoingTasks),
          challenges: formatArrayField(weeklyReportData.challenges),
          team_performance: formatArrayField(weeklyReportData.teamPerformance),
          next_week_priorities: formatArrayField(weeklyReportData.nextWeekPriorities),
          other_notes: weeklyReportData.otherNotes.trim() || null
        }])
        .select();
      
      if (!error) {
        // Reset form and close modal
        setWeeklyReportData({
          projectId: 0,
          weekNumber: 0,
          year: new Date().getFullYear(),
          weekStartDate: '',
          weekEndDate: '',
          dateRangeDisplay: '',
          keyActivities: [''],
          ongoingTasks: [''],
          challenges: [''],
          teamPerformance: [''],
          nextWeekPriorities: [''],
          otherNotes: ''
        });
        setShowWeeklyReportForm(false);
        
        alert(`Weekly report submitted successfully! 
        
Your report for ${weeklyReportData.dateRangeDisplay} has been saved.

Project: ${selectedProject?.name || 'Unknown'}
Key Activities: ${keyActivitiesText.substring(0, 100)}${keyActivitiesText.length > 100 ? '...' : ''}

Your report is now available in the system.`);
      } else {
        console.error('Error submitting weekly report:', error);
        if (error.code === '23505') {
          alert('You have already submitted a weekly report for this week and project. Please edit the existing report or choose a different project.');
        } else {
          throw new Error(error.message || 'Failed to submit weekly report');
        }
      }
    } catch (error) {
      console.error('Error submitting weekly report:', error);
      alert('Failed to submit weekly report. Please try again.');
    }
  };

  const handleWeeklyReportClose = () => {
    setShowWeeklyReportForm(false);
    setWeeklyReportData({
      projectId: 0,
      weekNumber: 0,
      year: new Date().getFullYear(),
      weekStartDate: '',
      weekEndDate: '',
      dateRangeDisplay: '',
      keyActivities: [''],
      ongoingTasks: [''],
      challenges: [''],
      teamPerformance: [''],
      nextWeekPriorities: [''],
      otherNotes: ''
    });
  };

  // Dynamic field management for weekly report
  const addReportField = (fieldName: string) => {
    setWeeklyReportData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName as keyof typeof prev] as string[], '']
    }));
  };

  const removeReportField = (fieldName: string, index: number) => {
    setWeeklyReportData(prev => {
      const currentArray = prev[fieldName as keyof typeof prev] as string[];
      if (currentArray.length > 1) {
        const newArray = currentArray.filter((_, i) => i !== index);
        return {
          ...prev,
          [fieldName]: newArray
        };
      }
      return prev;
    });
  };

  const updateReportField = (fieldName: string, index: number, value: string) => {
    setWeeklyReportData(prev => {
      const currentArray = [...(prev[fieldName as keyof typeof prev] as string[])];
      currentArray[index] = value;
      return {
        ...prev,
        [fieldName]: currentArray
      };
    });
  };

  // Notification/Inbox functions using Supabase
  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setIsLoadingNotifications(true);
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
      console.error('Error fetching notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(notificationsData || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('is_read', false);
      
      if (error) {
        console.error('Error fetching unread count:', error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleInboxToggle = async () => {
    setShowInbox(!showInbox);
    if (!showInbox) {
      await fetchNotifications();
    }
  };

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        // Update local state
        setNotifications(notifications.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        ));
        
        // Update unread count
        fetchUnreadCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return <ExclamationCircleIcon style={{ width: '16px', height: '16px', color: '#f59e0b' }} />;
      case 'leave_status_update':
        return <CheckCircleIcon style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      default:
        return <BellIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />;
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Fetch unread count on component mount and periodically
  useEffect(() => {
    if (user?.id) {
    const fetchData = async () => {
      await fetchUnreadCount();
    };
    
    fetchData();
    
    // Fetch unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const mainNavItems = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'My Tasks', href: '/my-tasks', icon: FolderIcon },
    { name: 'Calendar', href: '/calendar', icon: CalendarIcon },
    { name: 'Timetable', href: '/timetable', icon: ClockIcon },
    { name: 'Reporting', href: '/reporting', icon: ChartBarIcon },
    { name: 'Content Calendar', href: '/content-calendar', icon: TableCellsIcon },
  ];

  // HR-only navigation items (will be blank pages for now)
  const hrNavItems = [
    { name: 'Inbox', href: '/inbox', icon: InboxIcon },
    { name: 'Weekly Report', href: '/weekly-report', icon: ClipboardDocumentListIcon },
    { name: 'Absence Management', href: '/employee-absent', icon: CalendarDaysIcon },
  ];

  const inboxItem = { 
    name: 'Inbox', 
    icon: InboxIcon, 
    onClick: handleInboxToggle,
    badge: unreadCount > 0 ? unreadCount : null
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 256px;
            height: 100vh;
            background: #ffffff;
            border-right: 2px solid #000000;
            display: flex;
            flex-direction: column;
          }
          .sidebar-header {
            padding: 1.5rem;
            border-bottom: 1px solid #000000;
          }
          .sidebar-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
          }
          .sidebar-title {
            font-size: 1.25rem;
            font-weight: bold;
            color: #000000;
            margin: 0;
          }
          .sidebar-add-container {
            position: relative;
          }
          .sidebar-add-btn {
            padding: 0.5rem;
            color: #666666;
            background: none;
            border: 1px solid #000000;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .sidebar-add-btn:hover {
            color: #000000;
            background: #f0f0f0;
          }
          .sidebar-add-btn.active {
            color: #000000;
            background: #f0f0f0;
          }
          .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            z-index: 100;
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            min-width: 180px;
            margin-top: 0.5rem;
            padding: 0.5rem 0;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
          }
          .dropdown-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
          }
          .dropdown-item:hover {
            background: #f9fafb;
            color: #000000;
          }
          .dropdown-item:active {
            background: #f3f4f6;
          }
          .dropdown-icon {
            width: 16px;
            height: 16px;
            color: #6b7280;
          }
          .dropdown-item:hover .dropdown-icon {
            color: #000000;
          }
          
          /* Absence Form Modal Styles */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 1000;
            animation: fadeIn 0.4s ease-out;
          }
          
          .modal-content {
            background: #ffffff;
            border: 3px solid #000000;
            border-radius: 12px;
            padding: 0;
            width: 100%;
            max-width: 450px;
            max-height: 85vh;
            overflow: hidden;
            box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1.5rem 2rem 1rem 2rem;
            border-bottom: 3px solid #000000;
            background: #000000;
            position: relative;
          }
          
          .modal-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #ffffff;
            margin: 0;
            letter-spacing: -0.025em;
          }
          
          .modal-close-btn {
            background: #ffffff;
            border: 2px solid #ffffff;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
            color: #000000;
            transition: all 0.3s ease;
          }
          
          .modal-close-btn:hover {
            background: #000000;
            color: #ffffff;
            transform: scale(1.05);
          }
          
          .modal-body {
            padding: 1.5rem;
            max-height: 65vh;
            overflow-y: auto;
          }
          
          .leave-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 0;
            background: transparent;
            border: none;
          }
          
          .stat-card {
            text-align: center;
            padding: 1.25rem 1rem;
            background: #ffffff;
            border-radius: 8px;
            border: 2px solid #000000;
            position: relative;
            transition: all 0.3s ease;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
          }
          
          .stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: #000000;
            border-radius: 10px 10px 0 0;
          }
          
          .stat-number {
            font-size: 2rem;
            font-weight: 900;
            margin-bottom: 0.25rem;
            color: #000000;
            letter-spacing: -0.025em;
          }
          
          .stat-label {
            font-size: 0.7rem;
            color: #666666;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.1em;
          }
          

          
          .form-group {
            margin-bottom: 1.25rem;
          }
          
          .form-label {
            display: block;
            font-weight: 700;
            color: #000000;
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .form-input, .form-select, .form-textarea {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #000000;
            border-radius: 6px;
            font-size: 0.9rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
            transition: all 0.3s ease;
            font-weight: 500;
          }
          
          .form-input:focus, .form-select:focus, .form-textarea:focus {
            outline: none;
            border-color: #000000;
            box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
          }
          
          .form-textarea {
            resize: vertical;
            min-height: 100px;
            font-family: inherit;
          }
          
          .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }
          
          .form-buttons {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            margin-top: 1.5rem;
            padding-top: 1.25rem;
            border-top: 2px solid #000000;
          }
          
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.85rem;
            border: 2px solid #000000;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          
          .btn-primary {
            background: #000000;
            color: #ffffff;
          }
          
          .btn-primary:hover {
            background: #ffffff;
            color: #000000;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .btn-primary:disabled {
            background: #666666;
            border-color: #666666;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          
          .btn-secondary {
            background: #ffffff;
            color: #000000;
          }
          
          .btn-secondary:hover {
            background: #000000;
            color: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .error-message {
            color: #000000;
            background: #f0f0f0;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 1rem;
            font-size: 0.9rem;
            margin-top: 1rem;
            font-weight: 600;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .sidebar-search {
            width: 100%;
            padding: 0.75rem;
            background: #f9f9f9;
            border: 1px solid #000000;
            border-radius: 4px;
            font-size: 0.9rem;
            color: #000000;
            box-sizing: border-box;
          }
          .sidebar-search:focus {
            outline: none;
            background: #ffffff;
            border-color: #000000;
          }
          .sidebar-search::placeholder {
            color: #666666;
          }
          .sidebar-nav {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
          }
          .nav-section {
            margin-bottom: 1.5rem;
          }
          .nav-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            font-size: 0.9rem;
            font-weight: 500;
            border-radius: 4px;
            transition: all 0.2s ease;
            text-decoration: none;
            color: #666666;
            margin-bottom: 0.25rem;
          }
          .nav-item:hover {
            background: #f0f0f0;
            color: #000000;
          }
          .nav-item.active {
            background: #f0f0f0;
            color: #000000;
            border: 1px solid #000000;
          }
          .nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.75rem;
          }
          .projects-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 0.75rem;
            font-size: 0.9rem;
            font-weight: 500;
            color: #666666;
            background: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 0.25rem;
          }
          .projects-toggle:hover {
            background: #f0f0f0;
            color: #000000;
          }
          .projects-list {
            margin-left: 0.5rem;
          }
          .project-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem;
            font-size: 0.9rem;
            border-radius: 4px;
            transition: all 0.2s ease;
            text-decoration: none;
            color: #666666;
            margin-bottom: 0.25rem;
          }
          .project-item:hover {
            background: #f0f0f0;
            color: #000000;
          }
          .project-item.active {
            background: #f0f0f0;
            color: #000000;
            border: 1px solid #000000;
          }
          .project-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 0;
            flex: 1;
          }
          .project-color {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
            border: 1px solid #000000;
          }
          .project-name {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .project-count {
            font-size: 0.75rem;
            color: #666666;
          }
          .sidebar-footer {
            padding: 1rem;
            border-top: 1px solid #000000;
          }
          .user-profile {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .user-avatar {
            width: 32px;
            height: 32px;
            background: #f0f0f0;
            border: 1px solid #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .user-avatar-text {
            font-size: 0.9rem;
            font-weight: 500;
            color: #000000;
          }
          .user-info {
            min-width: 0;
            flex: 1;
          }
          .user-name {
            font-size: 0.9rem;
            font-weight: 500;
            color: #000000;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .user-email {
            font-size: 0.75rem;
            color: #666666;
            margin: 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .logout-btn {
            padding: 0.25rem;
            color: #666666;
            background: none;
            border: 1px solid #000000;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .logout-btn:hover {
            color: #000000;
            background: #f0f0f0;
          }
          
          /* Mobile Menu Toggle */
          .mobile-menu-button {
            position: fixed;
            top: 1.25rem;
            left: 1.25rem;
            z-index: 60;
            background: #ffffff;
            border: 2px solid #000000;
            border-radius: 8px;
            padding: 0.75rem;
            cursor: pointer;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.2s ease;
          }
          
          .mobile-menu-button:hover {
            background: #f8f9fa;
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }
          
          .mobile-menu-button:active {
            transform: translateY(0);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          }
          
          .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 40;
            display: none;
          }
          
          @media (max-width: 768px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.3s ease;
              z-index: 50;
              width: 280px;
            }
            
            .sidebar.open {
              transform: translateX(0);
            }
            
            .mobile-menu-button {
              display: block;
            }
            
            .mobile-overlay.show {
              display: block;
            }
            
            .sidebar-header {
              padding: 1rem;
            }
            
            .sidebar-nav {
              padding: 0.75rem;
            }
            
            .dropdown-menu {
              min-width: 200px;
              right: -1rem;
            }
            
            .nav-item, .project-item {
              padding: 0.875rem 0.75rem;
              font-size: 1rem;
            }
            
            .nav-icon {
              width: 22px;
              height: 22px;
              margin-right: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .sidebar {
              width: 100vw;
            }
            
            .mobile-menu-button {
              top: 1rem;
              left: 1rem;
              padding: 0.625rem;
            }
            
            .sidebar-header {
              padding: 0.75rem;
            }
            
            .sidebar-title {
              font-size: 1.125rem;
            }
            
            .sidebar-nav {
              padding: 0.5rem;
            }
            
            .nav-item, .project-item {
              padding: 1rem 0.75rem;
              font-size: 1.1rem;
            }
            
            .projects-toggle {
              padding: 1rem 0.75rem;
              font-size: 1rem;
            }
            
            .dropdown-menu {
              min-width: 220px;
              right: -0.75rem;
            }
            
            .dropdown-item {
              padding: 1rem;
              font-size: 1rem;
            }
            
            /* Mobile Modal Styles */
            .modal-content {
              max-width: 95vw;
              margin: 0.5rem;
            }
            
            .modal-header {
              padding: 1rem 1.25rem;
            }
            
            .modal-title {
              font-size: 1.25rem;
            }
            
            .modal-body {
              padding: 1.25rem;
            }
            
            .leave-stats {
              grid-template-columns: 1fr;
              gap: 0.75rem;
              padding: 1rem;
            }
            
            .stat-card {
              padding: 0.75rem;
            }
            
            .stat-number {
              font-size: 1.25rem;
            }
            
            .form-grid {
              grid-template-columns: 1fr;
              gap: 0;
            }
            
            .form-group {
              margin-bottom: 1.25rem;
            }
            
            .form-input, .form-select, .form-textarea {
              padding: 1rem;
              font-size: 1rem;
            }
            
            .form-buttons {
              flex-direction: column;
              gap: 0.75rem;
            }
            
            .btn {
              padding: 1rem;
              font-size: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .modal-overlay {
              padding: 0.5rem;
              align-items: flex-end;
            }
            
            .modal-content {
              max-width: 100%;
              max-height: 95vh;
              border-radius: 12px 12px 0 0;
              margin: 0;
            }
            
            .modal-header {
              padding: 0.75rem 1rem;
            }
            
            .modal-title {
              font-size: 1.125rem;
            }
            
            .modal-body {
              padding: 1rem;
            }
            
            .leave-stats {
              padding: 0.75rem;
              margin-bottom: 1.5rem;
            }
            
            .stat-card {
              padding: 0.625rem;
            }
            
            .stat-number {
              font-size: 1.125rem;
            }
            
            .stat-label {
              font-size: 0.75rem;
            }
            
            .form-group {
              margin-bottom: 1rem;
            }
            
            .form-label {
              font-size: 0.85rem;
              margin-bottom: 0.375rem;
            }
            
            .form-input, .form-select, .form-textarea {
              padding: 0.875rem;
              font-size: 1rem;
            }
            
            .form-buttons {
              margin-top: 1.5rem;
              padding-top: 1rem;
            }
            
            .btn {
              padding: 0.875rem;
              font-size: 0.9rem;
            }
          }
        `
      }} />
      
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon style={{ width: '24px', height: '24px' }} />
        ) : (
          <Bars3Icon style={{ width: '24px', height: '24px' }} />
        )}
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={closeMobileMenu}
      />
      
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <h1 className="sidebar-title">Projects</h1>
            <div className="sidebar-add-container" ref={dropdownRef}>
              <button
                onClick={toggleDropdown}
                className={`sidebar-add-btn ${isDropdownOpen ? 'active' : ''}`}
                title="Create new..."
              >
                <PlusIcon style={{ width: '20px', height: '20px' }} />
              </button>
              <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                <button onClick={handleAbsenceForm} className="dropdown-item">
                  <DocumentTextIcon className="dropdown-icon" />
                  Absence Form
                </button>
                <button onClick={handleWeeklyReport} className="dropdown-item">
                  <ClipboardDocumentListIcon className="dropdown-icon" />
                  Weekly Report Form
                </button>
              </div>
            </div>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            className="sidebar-search"
          />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Main Navigation */}
          <div className="nav-section">
            {mainNavItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <item.icon className="nav-icon" />
                {item.name}
              </Link>
            ))}
            
            {/* HR Navigation Items */}
            {(user?.role === 'hr' || user?.role === 'admin' || (user as any)?.user_metadata?.role === 'hr' || (user as any)?.user_metadata?.role === 'admin') ? (
              <>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>HR Tools</span>
                </div>
                {hrNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <item.icon className="nav-icon" />
                    {item.name}
                  </Link>
                ))}
              </>
            ) : (
              <>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>Personal</span>
                </div>
                {hrNavItems.slice(0, 2).map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <item.icon className="nav-icon" />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
            
            {/* Inbox Item - Hidden for first prototype */}
            {/* <button
              onClick={inboxItem.onClick}
              className={`nav-item ${showInbox ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
            >
              <inboxItem.icon className="nav-icon" />
              {inboxItem.name}
              {inboxItem.badge && (
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  borderRadius: '50%',
                  minWidth: '18px',
                  height: '18px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: '1'
                }}>
                  {inboxItem.badge}
                </span>
              )}
            </button> */}
          </div>

          {/* Projects List */}
          <div className="nav-section">
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="projects-toggle"
            >
              <span>My Projects</span>
              {isProjectsExpanded ? (
                <ChevronUpIcon style={{ width: '16px', height: '16px' }} />
              ) : (
                <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
              )}
            </button>

            {isProjectsExpanded && (
              <div className="projects-list">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className={`project-item ${isActive(`/projects/${project.id}`) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <div className="project-info">
                      <div
                        className="project-color"
                        style={{ backgroundColor: project.color || '#000000' }}
                      />
                      <span className="project-name">{project.name}</span>
                    </div>
                    <span className="project-count">
                      {project.completed_task_count || 0}/{project.task_count || 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User Profile */}
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              <span className="user-avatar-text">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="user-info">
              <p className="user-name">
                {user?.name}
              </p>
              <p className="user-email">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="logout-btn"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Absence Form Modal */}
      {showAbsenceForm && (
        <div className="modal-overlay" onClick={handleAbsenceFormClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Employee Leave Request</h2>
              <button
                onClick={handleAbsenceFormClose}
                className="modal-close-btn"
                title="Close"
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Leave Statistics */}
              <div className="leave-stats">
                <div className="stat-card stat-available">
                  <div className="stat-number">{availableLeave}</div>
                  <div className="stat-label">Available Days</div>
                </div>
                <div className="stat-card stat-used">
                  <div className="stat-number">{usedLeave}</div>
                  <div className="stat-label">Used Days</div>
                </div>
                <div className="stat-card stat-requested">
                  <div className="stat-number">{calculateRequestedDays()}</div>
                  <div className="stat-label">Requested Days</div>
                </div>
              </div>

              {/* Leave Request Form */}
              <form onSubmit={handleAbsenceFormSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={absenceFormData.startDate}
                      onChange={(e) => setAbsenceFormData({
                        ...absenceFormData,
                        startDate: e.target.value
                      })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={absenceFormData.endDate}
                      onChange={(e) => setAbsenceFormData({
                        ...absenceFormData,
                        endDate: e.target.value
                      })}
                      min={absenceFormData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select
                    className="form-select"
                    value={absenceFormData.leaveType}
                    onChange={(e) => setAbsenceFormData({
                      ...absenceFormData,
                      leaveType: e.target.value
                    })}
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="family">Family Emergency</option>
                    <option value="medical">Medical Appointment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Related Project (Optional)</label>
                  <select
                    className="form-select"
                    value={absenceFormData.projectId}
                    onChange={(e) => setAbsenceFormData({
                      ...absenceFormData,
                      projectId: Number(e.target.value)
                    })}
                  >
                    <option value={0}>Select a project (if applicable)</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.75rem', color: '#666666', marginTop: '0.25rem' }}>
                    Select the project this leave affects, if any
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Leave</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Brief reason for your leave request..."
                    value={absenceFormData.reason}
                    onChange={(e) => setAbsenceFormData({
                      ...absenceFormData,
                      reason: e.target.value
                    })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Any additional information or special instructions..."
                    value={absenceFormData.notes}
                    onChange={(e) => setAbsenceFormData({
                      ...absenceFormData,
                      notes: e.target.value
                    })}
                  />
                </div>

                {calculateRequestedDays() > availableLeave && (
                  <div className="error-message">
                    WARNING: You are requesting {calculateRequestedDays()} days but only have {availableLeave} days available.
                  </div>
                )}

                <div className="form-buttons">
                  <button
                    type="button"
                    onClick={handleAbsenceFormClose}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={calculateRequestedDays() > availableLeave || calculateRequestedDays() === 0}
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report Form Modal */}
      {showWeeklyReportForm && (
        <div className="weekly-report-overlay" onClick={handleWeeklyReportClose}>
          <div className="weekly-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="weekly-report-header">
              <h1 className="weekly-report-title">Weekly Report</h1>
              <button
                onClick={handleWeeklyReportClose}
                className="weekly-close-btn"
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="weekly-report-body">
              {/* Week Info Display */}
              <div className="week-info-banner">
                <h2 className="week-title">{weeklyReportData.dateRangeDisplay}</h2>
                <p className="week-subtitle">Submit your weekly progress report</p>
              </div>

              {/* Weekly Report Form */}
              <form onSubmit={handleWeeklyReportSubmit} className="weekly-report-form">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">Project / Team *</label>
                    <select
                      className="weekly-select"
                      required
                      value={weeklyReportData.projectId}
                      onChange={(e) => setWeeklyReportData({
                        ...weeklyReportData,
                        projectId: Number(e.target.value)
                      })}
                    >
                      <option value={0}>Choose your project or team...</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">KEY ACTIVITIES COMPLETED *</label>
                    <div className="weekly-field-container">
                      {weeklyReportData.keyActivities.map((activity, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            required={index === 0}
                            placeholder={index === 0 ? "Main task or deliverable completed..." : "Additional activity..."}
                            value={activity}
                            onChange={(e) => updateReportField('keyActivities', index, e.target.value)}
                          />
                          {weeklyReportData.keyActivities.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeReportField('keyActivities', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addReportField('keyActivities')}
                      >
                        Add another activity
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="weekly-label">ONGOING TASKS</label>
                    <div className="weekly-field-container">
                      {weeklyReportData.ongoingTasks.map((task, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Task in progress..." : "Additional ongoing task..."}
                            value={task}
                            onChange={(e) => updateReportField('ongoingTasks', index, e.target.value)}
                          />
                          {weeklyReportData.ongoingTasks.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeReportField('ongoingTasks', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addReportField('ongoingTasks')}
                      >
                        Add ongoing task
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="weekly-label">CHALLENGES / ISSUES</label>
                    <div className="weekly-field-container">
                      {weeklyReportData.challenges.map((challenge, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Any blocker or challenge..." : "Additional challenge..."}
                            value={challenge}
                            onChange={(e) => updateReportField('challenges', index, e.target.value)}
                          />
                          {weeklyReportData.challenges.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeReportField('challenges', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addReportField('challenges')}
                      >
                        Add challenge
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="weekly-label">TEAM PERFORMANCE / KPIS</label>
                    <div className="weekly-field-container">
                      {weeklyReportData.teamPerformance.map((kpi, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Performance metric or KPI..." : "Additional KPI..."}
                            value={kpi}
                            onChange={(e) => updateReportField('teamPerformance', index, e.target.value)}
                          />
                          {weeklyReportData.teamPerformance.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeReportField('teamPerformance', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addReportField('teamPerformance')}
                      >
                        Add KPI
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="weekly-label">NEXT WEEK'S PRIORITIES</label>
                    <div className="weekly-field-container">
                      {weeklyReportData.nextWeekPriorities.map((priority, index) => (
                        <div key={index} className="weekly-field-row">
                          <input
                            type="text"
                            className="weekly-input"
                            placeholder={index === 0 ? "Key priority for next week..." : "Additional priority..."}
                            value={priority}
                            onChange={(e) => updateReportField('nextWeekPriorities', index, e.target.value)}
                          />
                          {weeklyReportData.nextWeekPriorities.length > 1 && (
                            <button
                              type="button"
                              className="weekly-remove-btn"
                              onClick={() => removeReportField('nextWeekPriorities', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="weekly-add-btn"
                        onClick={() => addReportField('nextWeekPriorities')}
                      >
                        Add priority
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="weekly-label">OTHER NOTES</label>
                    <textarea
                      className="weekly-textarea"
                      placeholder="Additional observations, suggestions, or miscellaneous notes..."
                      value={weeklyReportData.otherNotes}
                      onChange={(e) => setWeeklyReportData({
                        ...weeklyReportData,
                        otherNotes: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="weekly-form-buttons">
                  <button
                    type="button"
                    onClick={handleWeeklyReportClose}
                    className="weekly-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="weekly-btn-submit"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Inbox/Notifications Modal */}
      {showInbox && (
        <div className="modal-overlay" onClick={() => setShowInbox(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Inbox</h2>
              <button
                onClick={() => setShowInbox(false)}
                className="modal-close-btn"
                title="Close"
              >
                <XMarkIcon style={{ width: '24px', height: '24px' }} />
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {isLoadingNotifications ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    border: '3px solid #cccccc', 
                    borderTop: '3px solid #000000', 
                    borderRadius: '50%', 
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto'
                  }}></div>
                  <p style={{ marginTop: '1rem', color: '#666666' }}>Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <InboxIcon style={{ width: '48px', height: '48px', color: '#cccccc', margin: '0 auto 1rem' }} />
                  <h3 style={{ color: '#666666', marginBottom: '0.5rem' }}>No notifications</h3>
                  <p style={{ color: '#999999', fontSize: '0.9rem' }}>You're all caught up!</p>
                </div>
              ) : (
                <div>
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      style={{
                        display: 'flex',
                        gap: '1rem',
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        background: notification.is_read ? '#ffffff' : '#f9f9f9',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <h4 style={{ 
                            color: '#000000', 
                            fontSize: '0.9rem', 
                            fontWeight: notification.is_read ? 'normal' : 'bold',
                            margin: 0
                          }}>
                            {notification.title}
                          </h4>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: '#666666',
                            flexShrink: 0
                          }}>
                            {formatNotificationTime(notification.created_at)}
                          </span>
                        </div>
                        
                        <p style={{ 
                          color: '#374151', 
                          fontSize: '0.85rem',
                          lineHeight: '1.4',
                          margin: 0
                        }}>
                          {notification.message}
                        </p>
                        
                        {!notification.is_read && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            background: '#ef4444',
                            borderRadius: '50%',
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)'
                          }} />
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
      
      {/* Enhanced Weekly Report Form Styles */}
      <style jsx>{`
        .weekly-report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
                 .weekly-report-modal {
           background: #ffffff;
           border: 3px solid #000000;
           border-radius: 0;
           width: 100%;
           max-width: 1200px;
           max-height: 95vh;
           overflow: hidden;
           box-shadow: 8px 8px 0px #000000;
           display: flex;
           flex-direction: column;
         }
        
        .weekly-report-header {
          background: #000000;
          color: #ffffff;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #000000;
        }
        
        .weekly-report-title {
          font-size: 2rem;
          font-weight: bold;
          margin: 0;
          letter-spacing: -0.025em;
        }
        
        .weekly-close-btn {
          background: #ffffff;
          color: #000000;
          border: 2px solid #ffffff;
          width: 40px;
          height: 40px;
          border-radius: 0;
          cursor: pointer;
          font-size: 24px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .weekly-close-btn:hover {
          background: #f5f5f5;
          transform: scale(1.1);
        }
        
                 .weekly-report-body {
           padding: 2rem 3rem 3rem 3rem;
           flex: 1;
           overflow-y: auto;
           overflow-x: hidden;
           background: #ffffff;
           scroll-behavior: smooth;
         }
        
        .week-info-banner {
          background: #f8f9fa;
          border: 3px solid #000000;
          padding: 2rem;
          text-align: center;
          margin-bottom: 3rem;
          border-radius: 0;
        }
        
        .week-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #000000;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }
        
        .week-subtitle {
          font-size: 1rem;
          color: #666666;
          margin: 0;
        }
        
                 .weekly-report-form {
           display: flex;
           flex-direction: column;
           gap: 2.5rem;
           padding-bottom: 2rem;
         }
        
        .form-row {
          display: flex;
          gap: 2rem;
          width: 100%;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .form-group.full-width {
          flex: 1;
        }
        
        .form-group.half-width {
          flex: 1;
        }
        
        .weekly-label {
          font-size: 0.9rem;
          font-weight: bold;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0;
          padding-bottom: 0.5rem;
        }
        
        .weekly-select {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 3px solid #000000;
          border-radius: 0;
          font-size: 1rem;
          background: #ffffff;
          color: #000000;
          transition: all 0.2s ease;
        }
        
        .weekly-select:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 4px 4px 0px #e5e5e5;
        }
        
        .weekly-field-container {
          background: #ffffff;
          border: 3px solid #000000;
          padding: 1.5rem;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .weekly-field-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .weekly-input {
          flex: 1;
          padding: 0.875rem 1.125rem;
          border: 2px solid #000000;
          border-radius: 0;
          font-size: 0.95rem;
          background: #ffffff;
          color: #000000;
          transition: all 0.2s ease;
        }
        
        .weekly-input:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 2px 2px 0px #e5e5e5;
        }
        
        .weekly-input::placeholder {
          color: #888888;
        }
        
        .weekly-remove-btn {
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
          width: 32px;
          height: 32px;
          border-radius: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .weekly-remove-btn:hover {
          background: #f5f5f5;
          transform: scale(1.1);
        }
        
        .weekly-add-btn {
          background: #f8f9fa;
          color: #000000;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 0.75rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          align-self: flex-start;
        }
        
        .weekly-add-btn:hover {
          background: #e9ecef;
          transform: translateY(-2px);
          box-shadow: 2px 2px 0px #000000;
        }
        
        .weekly-textarea {
          width: 100%;
          min-height: 120px;
          padding: 1rem 1.25rem;
          border: 3px solid #000000;
          border-radius: 0;
          font-size: 0.95rem;
          background: #ffffff;
          color: #000000;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: all 0.2s ease;
        }
        
        .weekly-textarea:focus {
          outline: none;
          border-color: #000000;
          box-shadow: 4px 4px 0px #e5e5e5;
        }
        
        .weekly-textarea::placeholder {
          color: #888888;
        }
        
                 .weekly-form-buttons {
           display: flex;
           gap: 1.5rem;
           justify-content: flex-end;
           padding: 2rem 0 1rem 0;
           margin-top: 2rem;
           border-top: 2px solid #e5e5e5;
         }
        
        .weekly-btn-cancel {
          background: #ffffff;
          color: #000000;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .weekly-btn-cancel:hover {
          background: #f5f5f5;
          transform: translateY(-2px);
          box-shadow: 3px 3px 0px #000000;
        }
        
        .weekly-btn-submit {
          background: #000000;
          color: #ffffff;
          border: 2px solid #000000;
          border-radius: 0;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        
        .weekly-btn-submit:hover {
          background: #333333;
          transform: translateY(-2px);
          box-shadow: 3px 3px 0px #666666;
        }
        
                 @media (max-width: 768px) {
           .weekly-report-overlay {
             padding: 1rem;
           }
           
           .weekly-report-modal {
             max-width: 100%;
             max-height: 98vh;
           }
           
           .weekly-report-header {
             padding: 1.5rem;
           }
           
           .weekly-report-title {
             font-size: 1.5rem;
           }
           
           .weekly-report-body {
             padding: 1.5rem;
           }
           
           .form-row {
             flex-direction: column;
             gap: 1.5rem;
           }
           
           .weekly-form-buttons {
             flex-direction: column;
             gap: 1rem;
           }
           
           .weekly-btn-cancel,
           .weekly-btn-submit {
             width: 100%;
             text-align: center;
           }
         }

      `}</style>
    </div>
  );
} 