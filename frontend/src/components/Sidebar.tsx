'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import WorldClock from './WorldClock';
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
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  InboxIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TableCellsIcon,
  UserIcon,
  ShieldCheckIcon,
  KeyIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [hasClassScheduleAccess, setHasClassScheduleAccess] = useState(false);
  const [hasContentCalendarAccess, setHasContentCalendarAccess] = useState(false);
  const [hasClassesAccess, setHasClassesAccess] = useState(false);
  const [hasCompanyOutreachAccess, setHasCompanyOutreachAccess] = useState(false);
  const [hasPayrollAccess, setHasPayrollAccess] = useState(false);
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

  // Check Class Schedule access
  const checkClassScheduleAccess = async () => {
    if (!user?.id) {
      setHasClassScheduleAccess(false);
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      console.log('🔍 Checking Class Schedule access for user:', user.id, user.email);
      
      // Check if user is a class schedule member
      const { data: memberData, error: memberError } = await supabase
        .from('class_schedule_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      console.log('Class Schedule member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('SUCCESS: Class Schedule access granted: User is a member');
        setHasClassScheduleAccess(true);
        return;
      }

      // Check if user is admin/HR
      const { data: userData, error: userError } = await supabase
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single();

      console.log('USER: User data check:', userData);

      if (userError) {
        console.log('ERROR: Class Schedule access denied: User data error');
        setHasClassScheduleAccess(false);
        return;
      }

      const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr';
      console.log('🔐 Class Schedule admin/HR check:', {
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        role: userData.role,
        hasPermission
      });
      
      setHasClassScheduleAccess(hasPermission);
    } catch (err) {
      console.error('Error checking class schedule access:', err);
      setHasClassScheduleAccess(false);
    }
  };

  // Check Content Calendar access
  const checkContentCalendarAccess = async () => {
    if (!user?.id) {
      setHasContentCalendarAccess(false);
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      console.log('🔍 Checking Content Calendar access for user:', user.id, user.email);
      
      // Check if user is a content calendar member
      const { data: memberData, error: memberError } = await supabase
        .from('content_calendar_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      console.log('INFO: Content Calendar member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('SUCCESS: Content Calendar access granted: User is a member');
        setHasContentCalendarAccess(true);
        return;
      }

      // Check if user is a member of any folder
      const { data: folderMemberData, error: folderMemberError } = await supabase
        .from('content_calendar_folder_members')
        .select('id, role')
        .eq('user_id', user.id)
        .limit(1);

      console.log('FOLDER: Folder member check:', { folderMemberData, folderMemberError });

      if (folderMemberData && folderMemberData.length > 0 && !folderMemberError) {
        console.log('SUCCESS: Content Calendar access granted: User is a folder member');
        setHasContentCalendarAccess(true);
        return;
      }

      // Only assigned members can access Content Calendar
      console.log('INFO: Content Calendar access denied: User is not an assigned member');
      setHasContentCalendarAccess(false);
    } catch (err) {
      console.error('Error checking content calendar access:', err);
      setHasContentCalendarAccess(false);
    }
  };

  // Check Classes access
  const checkClassesAccess = async () => {
    if (!user?.id) {
      setHasClassesAccess(false);
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      console.log('🔍 Checking Classes access for user:', user.id, user.email);
      
      // Check if user is a classes member
      const { data: memberData, error: memberError } = await supabase
        .from('classes_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      console.log('INFO: Classes member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('SUCCESS: Classes access granted: User is a member');
        setHasClassesAccess(true);
        return;
      }

      // Check if user is admin/HR
      const { data: userData, error: userError } = await supabase
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single();

      console.log('USER: Classes user data check:', userData);

      if (userError) {
        console.log('ERROR: Classes access denied: User data error');
        setHasClassesAccess(false);
        return;
      }

      const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr';
      console.log('🔐 Classes admin/HR check:', {
        is_superuser: userData.is_superuser,
        is_staff: userData.is_staff,
        role: userData.role,
        hasPermission
      });
      
      setHasClassesAccess(hasPermission);
    } catch (err) {
      console.error('Error checking classes access:', err);
      setHasClassesAccess(false);
    }
  };

  // Check Company Outreach access
  const checkCompanyOutreachAccess = async () => {
    if (!user?.id) {
      setHasCompanyOutreachAccess(false);
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      console.log('🔍 Checking Company Outreach access for user:', user.id, user.email, user);
      
      // First check user role - instructors should NOT have access to company outreach
      const contextRole = user.role || (user as any)?.user_metadata?.role;
      if (contextRole === 'instructor') {
        console.log('ERROR: Company Outreach access denied: User is instructor (restricted)');
        setHasCompanyOutreachAccess(false);
        return;
      }
      
      // First check if user is a company outreach member
      const { data: memberData, error: memberError } = await supabase
        .from('company_outreach_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      console.log('INFO: Company Outreach member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('SUCCESS: Company Outreach access granted: User is a member');
        setHasCompanyOutreachAccess(true);
        return;
      }

      // Check user properties from auth context first
      const isAdmin = contextRole === 'admin' || contextRole === 'hr' || contextRole === 'superuser';
      
      console.log('🔍 Auth context check:', {
        contextRole,
        isAdmin,
        userRole: user.role,
        userMetadata: (user as any)?.user_metadata
      });

      if (isAdmin) {
        console.log('SUCCESS: Company Outreach access granted: Admin from context');
        setHasCompanyOutreachAccess(true);
        return;
      }

      // Check auth_user table for admin privileges
      const { data: userData, error: userError } = await supabase
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single();

      console.log('USER: Company Outreach database user check:', userData, userError);

      if (!userError && userData) {
        // Double-check role in database - no access for instructors
        if (userData.role === 'instructor') {
          console.log('ERROR: Company Outreach access denied: Database role is instructor');
          setHasCompanyOutreachAccess(false);
          return;
        }
        
        const hasAdminPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr';
        console.log('🔐 Company Outreach admin/HR check:', {
          is_superuser: userData.is_superuser,
          is_staff: userData.is_staff,
          role: userData.role,
          hasAdminPermission
        });
        
        if (hasAdminPermission) {
          console.log('SUCCESS: Company Outreach access granted: Admin from database');
          setHasCompanyOutreachAccess(true);
          return;
        }
      }

      // If we get here, user doesn't have access
      console.log('ERROR: Company Outreach access denied: User not in member table and not admin');
      setHasCompanyOutreachAccess(false);
      
    } catch (err) {
      console.error('Error checking company outreach access:', err);
      setHasCompanyOutreachAccess(false);
    }
  };

  // Check Payroll access
  const checkPayrollAccess = async () => {
    if (!user?.id) {
      setHasPayrollAccess(false);
      return;
    }

    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      console.log('🔍 Checking Payroll access for user:', user.id, user.email);
      
      // First check if user is a payroll member
      const { data: memberData, error: memberError } = await supabase
        .from('payroll_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single();

      console.log('INFO: Payroll member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('SUCCESS: Payroll access granted: User is a member');
        setHasPayrollAccess(true);
        return;
      }

      // Check user properties from auth context
      const contextRole = user.role || (user as any)?.user_metadata?.role;
      const isAdmin = contextRole === 'admin' || contextRole === 'hr' || contextRole === 'superuser';
      
      if (isAdmin) {
        console.log('SUCCESS: Payroll access granted: Admin from context');
        setHasPayrollAccess(true);
        return;
      }

      // Check auth_user table for admin privileges
      const { data: userData, error: userError } = await supabase
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single();

      if (!userError && userData) {
        const hasAdminPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr';
        
        if (hasAdminPermission) {
          console.log('SUCCESS: Payroll access granted: Admin from database');
          setHasPayrollAccess(true);
          return;
        }
      }

      // If we get here, user doesn't have access
      console.log('ERROR: Payroll access denied: User not in member table and not admin');
      setHasPayrollAccess(false);
      
    } catch (err) {
      console.error('Error checking payroll access:', err);
      setHasPayrollAccess(false);
    }
  };

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

  // Fetch balance and check access when user changes
  useEffect(() => {
    if (user?.id) {
      fetchLeaveBalance();
      checkClassScheduleAccess();
      checkContentCalendarAccess();
      checkClassesAccess();
      checkCompanyOutreachAccess();
      checkPayrollAccess();
    } else {
      setHasClassScheduleAccess(false);
      setHasContentCalendarAccess(false);
      setHasClassesAccess(false);
      setHasCompanyOutreachAccess(false);
      setHasPayrollAccess(false);
    }
  }, [user?.id]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Daily Report state
  const [showDailyReportForm, setShowDailyReportForm] = useState(false);
  const [dailyReportData, setDailyReportData] = useState({
    projectId: 0,
    reportDate: new Date().toISOString().split('T')[0],
    dateDisplay: '',
    keyActivities: [''],
    ongoingTasks: [''],
    challenges: [''],
    teamPerformance: [''],
    nextDayPriorities: [''],
    meetingMinutes: '',
    hasMeetingMinutes: false,
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
    console.log('DEBUG: Toggle mobile menu clicked! Current state:', isMobileMenuOpen);
    setIsMobileMenuOpen(!isMobileMenuOpen);
    console.log('DEBUG: Setting mobile menu state to:', !isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    console.log('DEBUG: Toggle dropdown clicked! Current state:', isDropdownOpen);
    setIsDropdownOpen(!isDropdownOpen);
    console.log('DEBUG: Setting dropdown state to:', !isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    closeDropdown(); // Close dropdown when toggling sidebar
    
    // Dynamically adjust content margin
    setTimeout(() => {
      const contentElements = document.querySelectorAll('[style*="marginLeft: 256px"]');
      contentElements.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.marginLeft) {
          htmlElement.style.marginLeft = !isCollapsed ? '64px' : '256px';
        }
      });
    }, 0);
  };

  const handleAbsenceForm = async () => {
    console.log('DEBUG: handleAbsenceForm called');
    console.log('DEBUG: Setting showAbsenceForm to true');
    setShowAbsenceForm(true);
    closeDropdown();
    
    console.log('DEBUG: Fetching leave balance...');
    // Refresh leave balance to get latest data
    await fetchLeaveBalance();
    console.log('DEBUG: Leave balance fetched, modal should be visible');
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

  const handleDailyReport = () => {
    setShowDailyReportForm(true);
    closeDropdown();
    
    // Calculate current date details
    const now = new Date();
    const dateDisplay = formatDateDisplay(now);
    
    setDailyReportData(prev => ({
      ...prev,
      reportDate: now.toISOString().split('T')[0],
      dateDisplay
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

  const formatDateDisplay = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleDailyReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keyActivitiesText = dailyReportData.keyActivities.filter(item => item.trim()).join('\n• ');
    if (!keyActivitiesText || !dailyReportData.projectId) {
      alert('Please fill in the required fields: Key Activities and Project.');
      return;
    }

    try {
      if (!user?.id) {
        alert('User not found. Please log in again.');
        return;
      }

      const selectedProject = projects.find(p => p.id === dailyReportData.projectId);
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Convert arrays to formatted text
      const formatArrayField = (array: string[]) => {
        const filtered = array.filter(item => item.trim());
        return filtered.length > 0 ? '• ' + filtered.join('\n• ') : null;
      };
      
      const { data, error } = await supabase
        .from('daily_reports')
        .insert([{
          employee_id: user.id,
          employee_name: user.name || user.email?.split('@')[0] || 'Unknown',
          employee_email: user.email,
          project_id: dailyReportData.projectId,
          project_name: selectedProject?.name || null,
          report_date: dailyReportData.reportDate,
          date_display: dailyReportData.dateDisplay,
          key_activities: formatArrayField(dailyReportData.keyActivities),
          ongoing_tasks: formatArrayField(dailyReportData.ongoingTasks),
          challenges: formatArrayField(dailyReportData.challenges),
          team_performance: formatArrayField(dailyReportData.teamPerformance),
          next_day_priorities: formatArrayField(dailyReportData.nextDayPriorities),
          meeting_minutes: dailyReportData.meetingMinutes.trim() || null,
          has_meeting_minutes: dailyReportData.hasMeetingMinutes,
          other_notes: dailyReportData.otherNotes.trim() || null
        }])
        .select();
      
      if (!error) {
        // Reset form and close modal
        setDailyReportData({
          projectId: 0,
          reportDate: new Date().toISOString().split('T')[0],
          dateDisplay: '',
          keyActivities: [''],
          ongoingTasks: [''],
          challenges: [''],
          teamPerformance: [''],
          nextDayPriorities: [''],
          meetingMinutes: '',
          hasMeetingMinutes: false,
          otherNotes: ''
        });
        setShowDailyReportForm(false);
        
        alert(`Daily report submitted successfully! 
        
Your report for ${dailyReportData.dateDisplay} has been saved.

Project: ${selectedProject?.name || 'Unknown'}
Key Activities: ${keyActivitiesText.substring(0, 100)}${keyActivitiesText.length > 100 ? '...' : ''}

Your report is now available in the system.`);
      } else {
        console.error('Error submitting daily report:', error);
        if (error.code === '23505') {
          alert('You have already submitted a daily report for this date and project. Please edit the existing report or choose a different project.');
        } else {
          throw new Error(error.message || 'Failed to submit daily report');
        }
      }
    } catch (error) {
      console.error('Error submitting daily report:', error);
      alert('Failed to submit daily report. Please try again.');
    }
  };

  const handleDailyReportClose = () => {
    setShowDailyReportForm(false);
    setDailyReportData({
      projectId: 0,
      reportDate: new Date().toISOString().split('T')[0],
      dateDisplay: '',
      keyActivities: [''],
      ongoingTasks: [''],
      challenges: [''],
      teamPerformance: [''],
      nextDayPriorities: [''],
      meetingMinutes: '',
      hasMeetingMinutes: false,
      otherNotes: ''
    });
  };

  // Dynamic field management for daily report
  const addReportField = (fieldName: string) => {
    setDailyReportData(prev => ({
      ...prev,
      [fieldName]: [...prev[fieldName as keyof typeof prev] as string[], '']
    }));
  };

  const removeReportField = (fieldName: string, index: number) => {
    setDailyReportData(prev => {
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
    setDailyReportData(prev => {
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
      const target = event.target as Element;
      
      // Check if click is outside both the dropdown button and the dropdown portal
      const isOutsideDropdownButton = dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideDropdownPortal = !target.closest || !target.closest('[data-dropdown-portal]');
      
      if (isOutsideDropdownButton && isOutsideDropdownPortal) {
        console.log('DEBUG: Closing dropdown due to outside click');
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

  // Base navigation items available to all users
  const baseNavItems = [
    { name: 'Home', href: '/dashboard', icon: HomeIcon },
    { name: 'My Tasks', href: '/my-tasks', icon: FolderIcon },
    { name: 'Timeline & Roadmap', href: '/timeline', icon: ChartBarIcon },
    { name: 'Password Vault', href: '/password-vault', icon: KeyIcon },
    { name: 'Meeting Schedule', href: '/timetable', icon: ClockIcon },
    { name: 'Reporting', href: '/reporting', icon: ChartBarIcon },
  ];

  // Conditionally add Content Calendar and Class Schedule based on user access
  const mainNavItems = [
    ...baseNavItems,
    // Content Calendar is now available to all authenticated users (access control happens within the page)
    { name: 'Content Calendar', href: '/content-calendar', icon: TableCellsIcon },
    ...(hasClassScheduleAccess ? [{ name: 'Class Schedule', href: '/class-schedule', icon: AcademicCapIcon }] : []),
    ...(hasClassesAccess ? [{ name: 'Classes', href: '/classes', icon: UserIcon }] : [])
  ];

  // Idea Lounge navigation items (access-controlled)
  const ideaLoungeNavItems = [
    ...(hasCompanyOutreachAccess ? [{ name: 'Company Outreach', href: '/company-outreach', icon: BuildingOfficeIcon }] : []),
    ...(hasPayrollAccess ? [{ name: 'Payroll', href: '/payroll', icon: DocumentTextIcon }] : [])
  ];

  // Admin-only navigation
  const isAdminUser = (user?.role === 'admin') || (user as any)?.user_metadata?.role === 'admin';
  const adminNavItems = isAdminUser ? [
    { name: 'Admin', href: '/admin', icon: ShieldCheckIcon }
  ] : [];

  // Instructor-only navigation
  const isInstructorUser = (user?.role === 'instructor') || (user as any)?.user_metadata?.role === 'instructor';
  const instructorNavItems = isInstructorUser ? [
    { name: 'Instructor', href: '/instructor', icon: AcademicCapIcon }
  ] : [];

  // If instructor, limit the main nav to only the allowed items
  const filteredMainNavItems = isInstructorUser
    ? [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'My Tasks', href: '/my-tasks', icon: FolderIcon },
        { name: 'Meeting Schedule', href: '/timetable', icon: ClockIcon },
      ]
    : mainNavItems;

  // HR-only navigation items (will be blank pages for now)
  const hrNavItems = [
    { name: 'Inbox', href: '/inbox', icon: InboxIcon },
    { name: 'Daily Reports', href: '/daily-reports', icon: ClipboardDocumentListIcon },
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
          /* Professional Sidebar Theme */
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            border-right: 1px solid rgba(196, 131, 217, 0.2);
            display: flex;
            flex-direction: column;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 100;
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
            backdrop-filter: blur(10px);
            overflow: hidden;
          }
          
          .sidebar.collapsed {
            width: 72px;
          }
          
          .sidebar::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
            animation: shimmer 3s ease-in-out infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .sidebar-header {
            padding: 1.5rem 1.25rem;
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            overflow: hidden;
          }
          
          .sidebar-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
            animation: headerShine 4s ease-in-out infinite;
          }
          
          @keyframes headerShine {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          .sidebar.collapsed .sidebar-header {
            padding: 1rem 0.75rem;
          }
          
          .sidebar-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.25rem;
            position: relative;
            z-index: 2;
          }
          
          .sidebar.collapsed .sidebar-header-content {
            margin-bottom: 0.75rem;
            justify-content: center;
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .sidebar-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1F2937;
            margin: 0;
            text-shadow: none;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            letter-spacing: -0.025em;
          }
          
          .sidebar.collapsed .sidebar-title {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-toggle {
            padding: 0.75rem;
            background: rgba(255, 179, 51, 0.1);
            border: 1px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            color: #F87239;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            min-width: 44px;
            min-height: 44px;
          }
          
          .sidebar-toggle:hover {
            background: rgba(255, 179, 51, 0.2);
            border-color: rgba(255, 179, 51, 0.4);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .sidebar-toggle:active {
            transform: translateY(-1px) scale(0.98);
          }
          
          .sidebar-add-container {
            position: relative;
            transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed .sidebar-add-container {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-add-btn {
            padding: 0.75rem;
            color: #F87239;
            background: rgba(255, 179, 51, 0.1);
            border: 1px solid rgba(255, 179, 51, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 44px;
            min-height: 44px;
          }
          
          .sidebar-add-btn:hover {
            background: rgba(255, 179, 51, 0.2);
            border-color: rgba(255, 179, 51, 0.4);
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .sidebar-add-btn.active {
            background: rgba(255, 179, 51, 0.3);
            border-color: rgba(255, 179, 51, 0.5);
            transform: translateY(-1px);
          }
          
          .dropdown-menu {
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 99999;
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            min-width: 200px;
            padding: 0.75rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.2s ease;
            backdrop-filter: blur(15px);
            overflow: visible;
          }
          
          .sidebar.collapsed .dropdown-menu {
            position: fixed;
            top: 120px;
            left: 80px;
            right: auto;
          }
          
          .dropdown-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0) scale(1);
          }
          
          .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1rem;
            font-size: 0.875rem;
            color: #374151;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            border-radius: 12px;
            font-weight: 500;
            position: relative;
            overflow: hidden;
          }
          
          .dropdown-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, #FFB333, #C483D9);
            opacity: 0;
            transition: opacity 0.2s ease;
          }
          
          .dropdown-item:hover::before {
            opacity: 0.1;
          }
          
          .dropdown-item:hover {
            color: #FFB333;
            transform: translateX(4px);
          }
          
          .dropdown-item:active {
            transform: translateX(2px) scale(0.98);
          }
          
          .dropdown-icon {
            width: 18px;
            height: 18px;
            color: #6B7280;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
          }
          
          .dropdown-item:hover .dropdown-icon {
            color: #FFB333;
          }
          

          
          .sidebar-nav {
            flex: 1;
            padding: 1.5rem 1rem;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(196, 131, 217, 0.3) transparent;
          }
          
          .sidebar-nav::-webkit-scrollbar {
            width: 6px;
          }
          
          .sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .sidebar-nav::-webkit-scrollbar-thumb {
            background: rgba(196, 131, 217, 0.3);
            border-radius: 3px;
          }
          
          .sidebar-nav::-webkit-scrollbar-thumb:hover {
            background: rgba(196, 131, 217, 0.5);
          }
          
          .nav-section {
            margin-bottom: 2rem;
          }
          
          .nav-section-header {
            padding: 0.5rem 1rem;
            margin-bottom: 0.75rem;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
          }
          
          .nav-section-header span {
            font-size: 0.75rem;
            color: #9CA3AF;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          
          .sidebar.collapsed .nav-section-header {
            opacity: 0;
            pointer-events: none;
            height: 0;
            padding: 0;
            margin: 0;
            border: none;
            transform: scale(0.8);
          }
          
          .nav-item {
            display: flex;
            align-items: center;
            padding: 0.875rem 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            color: #374151;
            text-decoration: none;
            margin-bottom: 0.5rem;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
          }
          
          .nav-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #F87239);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .nav-item:hover::before {
            opacity: 0.1;
          }
          
          .nav-item.active::before {
            opacity: 0.15;
          }
          
          .nav-item:hover {
            color: #FFB333;
            transform: translateX(4px);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.2);
          }
          
          .nav-item.active {
            color: #FFB333;
            background: rgba(255, 179, 51, 0.1);
            border-left: 3px solid #FFB333;
            transform: translateX(3px);
          }
          
          .nav-item:active {
            transform: translateX(2px) scale(0.98);
          }
          
          .nav-icon {
            width: 20px;
            height: 20px;
            margin-right: 0.875rem;
            color: inherit;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          
          .nav-text {
            position: relative;
            z-index: 1;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed .nav-text {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar.collapsed .nav-icon {
            margin-right: 0;
          }
          
          .projects-section {
            margin-top: 2rem;
          }
          
          .projects-toggle {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border-radius: 12px;
            margin: 0.5rem 0 1rem 0;
            position: relative;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          }
          
          .projects-toggle::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #F87239);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .projects-toggle:hover::before {
            opacity: 0.08;
          }
          
          .projects-toggle:hover {
            color: #F87239;
            background: rgba(255, 255, 255, 0.8);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.15);
          }
          
          .projects-toggle span {
            position: relative;
            z-index: 1;
            font-weight: 500;
            letter-spacing: 0.025em;
          }
          
          .projects-toggle svg {
            width: 16px;
            height: 16px;
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
            opacity: 0.7;
          }
          
          .projects-toggle:hover svg {
            opacity: 1;
          }
          
          .projects-toggle.expanded svg {
            transform: rotate(180deg);
          }
          
          .projects-list {
            margin-left: 1rem;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .project-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            font-size: 0.875rem;
            color: #6B7280;
            border-radius: 12px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            margin-bottom: 0.25rem;
            position: relative;
            overflow: hidden;
          }
          
          .project-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #5884FD, #C483D9);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .project-item:hover::before {
            opacity: 0.1;
          }
          
          .project-item:hover {
            color: #5884FD;
            transform: translateX(4px);
          }
          
          .project-item.active {
            color: #5884FD;
            background: rgba(88, 132, 253, 0.1);
            border-left: 3px solid #5884FD;
            transform: translateX(3px);
          }
          
          .project-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 0;
            flex: 1;
            position: relative;
            z-index: 1;
          }
          
          .project-color {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            border: 2px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
          }
          
          .project-item:hover .project-color {
            transform: scale(1.2);
            box-shadow: 0 0 8px rgba(88, 132, 253, 0.4);
          }
          
          .project-name {
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            hyphens: auto;
            font-weight: 500;
            line-height: 1.3;
          }
          
          .project-count {
            font-size: 0.75rem;
            color: #9CA3AF;
            background: rgba(156, 163, 175, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed .project-count {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .sidebar-footer {
            padding: 1.5rem 1rem;
            border-top: 1px solid rgba(196, 131, 217, 0.2);
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            margin-top: auto;
          }
          
          .user-profile {
            display: flex;
            align-items: center;
            gap: 0.875rem;
            padding: 0.875rem;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(196, 131, 217, 0.2);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(10px);
          }
          
          .user-profile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #FFB333, #C483D9);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .user-profile:hover::before {
            opacity: 0.1;
          }
          
          .user-profile:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(196, 131, 217, 0.2);
          }
          
          .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #FFB333, #F87239);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(255, 179, 51, 0.3);
            transition: all 0.3s ease;
            position: relative;
            z-index: 1;
          }
          
          .user-avatar:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(255, 179, 51, 0.4);
          }
          
          .user-avatar-text {
            font-size: 0.875rem;
            font-weight: 700;
            color: #FFFFFF;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          
          .user-info {
            min-width: 0;
            flex: 1;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
            z-index: 1;
          }
          
          .sidebar.collapsed .user-info {
            opacity: 0;
            pointer-events: none;
            transform: scale(0.8);
          }
          
          .user-name {
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            line-height: 1.3;
          }
          
          .user-email {
            font-size: 0.75rem;
            color: #9CA3AF;
            margin: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            line-height: 1.3;
          }
          
          .logout-btn {
            padding: 0.5rem;
            color: #9CA3AF;
            background: rgba(156, 163, 175, 0.1);
            border: 1px solid rgba(156, 163, 175, 0.2);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            position: relative;
            z-index: 1;
          }
          
          .logout-btn:hover {
            color: #F87239;
            background: rgba(248, 114, 57, 0.1);
            border-color: rgba(248, 114, 57, 0.2);
            transform: translateY(-1px);
          }
          
          .logout-btn:active {
            transform: translateY(0) scale(0.98);
          }
          
          /* Tooltip for collapsed nav items */
          .nav-item.tooltip-container {
            position: relative;
          }
          
          .nav-tooltip {
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%) translateX(-10px);
            background: linear-gradient(135deg, #374151, #1F2937);
            color: #FFFFFF;
            padding: 0.5rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            z-index: 1000;
            margin-left: 0.5rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font-weight: 500;
          }
          
          .nav-item:hover .nav-tooltip {
            opacity: 1;
            visibility: visible;
            transform: translateY(-50%) translateX(0);
          }
          
          /* Mobile Menu Toggle */
          .mobile-menu-button {
            position: fixed;
            top: 1.5rem;
            left: 1.5rem;
            z-index: 1100;
            background: linear-gradient(135deg, #FFB333, #F87239);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            padding: 0.875rem;
            cursor: pointer;
            display: none;
            box-shadow: 0 4px 16px rgba(255, 179, 51, 0.3);
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            color: #FFFFFF;
            min-width: 48px;
            min-height: 48px;
            align-items: center;
            justify-content: center;
          }
          
          .mobile-menu-button:hover {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 8px 24px rgba(255, 179, 51, 0.4);
          }
          
          .mobile-menu-button:active {
            transform: translateY(-1px) scale(0.98);
          }
          
          .mobile-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 999;
            display: none;
            backdrop-filter: blur(4px);
          }
          
          /* Global content adjustment for sidebar */
          body {
            margin: 0;
            padding: 0;
          }
          
          .sidebar ~ * {
            margin-left: 280px;
            transition: margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .sidebar.collapsed ~ * {
            margin-left: 72px;
          }
          
          [style*="marginLeft: 256px"] {
            margin-left: 280px !important;
            transition: margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          /* Enhanced Modal Styles */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            z-index: 1000;
            animation: fadeIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
          
          .modal-content {
            background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
            border: 1px solid rgba(196, 131, 217, 0.2);
            border-radius: 24px;
            padding: 0;
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            position: relative;
          }
          
          .modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
          }
          
          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid rgba(196, 131, 217, 0.2);
            background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
            position: relative;
          }
          
          .modal-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1F2937;
            margin: 0;
            letter-spacing: -0.025em;
          }
          
          .modal-close-btn {
            background: rgba(156, 163, 175, 0.1);
            border: 1px solid rgba(156, 163, 175, 0.2);
              padding: 0.75rem;
            border-radius: 12px;
            cursor: pointer;
            color: #6B7280;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-close-btn:hover {
            background: rgba(248, 114, 57, 0.1);
            border-color: rgba(248, 114, 57, 0.2);
            color: #F87239;
            transform: scale(1.05);
          }
          
          .modal-body {
            padding: 2rem;
            max-height: 75vh;
            overflow-y: auto;
          }
          
          .leave-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }
          
          .stat-card {
            text-align: center;
            padding: 1.5rem 1rem;
            background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
            border-radius: 16px;
            border: 1px solid rgba(196, 131, 217, 0.2);
            position: relative;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FFB333, #C483D9, #5884FD, #F87239);
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
          }
          
          .stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
            color: #1F2937;
            letter-spacing: -0.025em;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #6B7280;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.1em;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes slideIn {
            from { transform: translateY(-20px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
          
          /* Responsive Design */
          @media (max-width: 1024px) {
            .sidebar {
              transform: translateX(-100%);
              transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              z-index: 1000;
              width: 320px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            }
            
            .sidebar.open {
              transform: translateX(0);
            }
            
            .sidebar-toggle {
              display: none;
            }
            
            .mobile-menu-button {
              display: block !important;
            }
            
            .mobile-overlay.show {
              display: block;
            }
            
            .sidebar ~ * {
              margin-left: 0 !important;
            }
          }
          
          /* Tablet specific adjustments */
          @media (max-width: 768px) and (min-width: 481px) {
            .sidebar {
              width: 320px;
            }
            
            .mobile-menu-button {
              top: 1.25rem;
              left: 1.25rem;
              padding: 1rem;
              min-width: 52px;
              min-height: 52px;
            }
          }
          
          @media (max-width: 768px) {
            .sidebar {
              width: 300px;
            }
            
            .modal-content {
              max-width: 95vw;
              margin: 1rem;
            }
            
            .modal-header {
              padding: 1.5rem 1.5rem 1rem 1.5rem;
            }
            
            .modal-title {
              font-size: 1.5rem;
            }
            
            .modal-body {
              padding: 1.5rem;
            }
            
            .leave-stats {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .sidebar {
              width: 100vw;
            }
            
            .mobile-menu-button {
              top: 1rem;
              left: 1rem;
              padding: 0.75rem;
            }
            
            .modal-overlay {
              padding: 1rem;
            }
            
            .modal-content {
              border-radius: 16px;
              max-height: 95vh;
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
      
      <div className={`sidebar ${isMobileMenuOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Bars3Icon style={{ width: '20px', height: '20px' }} />
            </button>
            <h1 className="sidebar-title">Projects</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <NotificationDropdown />
              <div className="sidebar-add-container" ref={dropdownRef}>
                <button
                  onClick={(e) => {
                    console.log('DEBUG: Plus (+) button clicked!', e);
                    e.preventDefault();
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  className={`sidebar-add-btn ${isDropdownOpen ? 'active' : ''}`}
                  title="Create new..."
                >
                  <PlusIcon style={{ width: '20px', height: '20px' }} />
                  </button>
              </div>
            </div>
          </div>

          <WorldClock isCollapsed={isCollapsed} />
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {/* Main Navigation */}
          <div className="nav-section">
            {(isInstructorUser ? filteredMainNavItems : mainNavItems).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <item.icon className="nav-icon" />
                <span className="nav-text">{item.name}</span>
              </Link>
            ))}
            
          {/* HR Navigation Items */}
          {!isInstructorUser && (user?.role === 'hr' || user?.role === 'admin' || (user as any)?.user_metadata?.role === 'hr' || (user as any)?.user_metadata?.role === 'admin') ? (
              <>
                <div className="nav-section-header" style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
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
                    <span className="nav-text">{item.name}</span>
                  </Link>
                ))}
              </>
            ) : (
            !isInstructorUser && (
              <>
                <div className="nav-section-header" style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
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
                    <span className="nav-text">{item.name}</span>
                  </Link>
                ))}
              </>
            )
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

            {/* Idea Lounge Section */}
            {ideaLoungeNavItems.length > 0 && (
              <>
                <div className="nav-section-header" style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>Idea Lounge</span>
                </div>
                {ideaLoungeNavItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={closeMobileMenu}
                  >
                    <item.icon className="nav-icon" />
                    <span className="nav-text">{item.name}</span>
                  </Link>
                ))}
              </>
            )}

          {/* Admin Section */}
          {!isInstructorUser && adminNavItems.length > 0 && (
            <>
              <div className="nav-section-header" style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>Admin</span>
              </div>
              {adminNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <item.icon className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </Link>
              ))}
            </>
          )}

          {/* Instructor Section */}
          {instructorNavItems.length > 0 && (
            <>
              <div className="nav-section-header" style={{ borderTop: '1px solid #e5e7eb', margin: '1rem 0 0.5rem 0', paddingTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#666666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.75rem' }}>Instructor</span>
              </div>
              {instructorNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <item.icon className="nav-icon" />
                  <span className="nav-text">{item.name}</span>
                </Link>
              ))}
            </>
          )}
          </div>

          {/* Projects List */}
          <div className="nav-section">
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="projects-toggle"
            >
              <span className="projects-toggle-text">My Projects</span>
              <span className="projects-toggle-icon">
                {isProjectsExpanded ? (
                  <ChevronUpIcon style={{ width: '16px', height: '16px' }} />
                ) : (
                  <ChevronDownIcon style={{ width: '16px', height: '16px' }} />
                )}
              </span>
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
                      <span className="project-name" style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        lineHeight: '1.3'
                      }}>{project.name}</span>
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

      {/* Dropdown Portal - Render outside sidebar */}
      {isDropdownOpen && (() => {
        console.log('DEBUG: Rendering dropdown portal, isDropdownOpen =', isDropdownOpen);
        return true;
      })() && typeof window !== 'undefined' && createPortal(
        <div 
          data-dropdown-portal
          style={{
            position: 'fixed',
            top: isCollapsed ? '120px' : '120px',
            left: isCollapsed ? '80px' : '240px',
            zIndex: 9999999,
            background: '#FFFFFF',
            border: '2px solid #5884FD',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            minWidth: '200px',
            padding: '0.75rem',
            backdropFilter: 'blur(15px)',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            console.log('DEBUG: Dropdown container clicked!', e);
            e.stopPropagation();
          }}
        >
          <button 
            onClick={(e) => {
              console.log('DEBUG: Absence Form button clicked!', e);
              e.preventDefault();
              e.stopPropagation();
              handleAbsenceForm();
              closeDropdown();
            }} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              fontSize: '0.875rem',
              color: '#374151',
              cursor: 'pointer',
              border: '2px solid transparent',
              background: '#f9fafb',
              width: '100%',
              textAlign: 'left',
              borderRadius: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10000000,
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFB333';
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.background = 'rgba(255, 179, 51, 0.1)';
            }} 
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <DocumentTextIcon style={{ width: '18px', height: '18px' }} />
            Absence Form
          </button>
          <button 
            onClick={(e) => {
              console.log('DEBUG: Daily Report button clicked!', e);
              e.preventDefault();
              e.stopPropagation();
              handleDailyReport();
              closeDropdown();
            }} 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              fontSize: '0.875rem',
              color: '#374151',
              cursor: 'pointer',
              border: '2px solid transparent',
              background: '#f9fafb',
              width: '100%',
              textAlign: 'left',
              borderRadius: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10000000,
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#FFB333';
              e.currentTarget.style.transform = 'translateX(4px)';
              e.currentTarget.style.background = 'rgba(255, 179, 51, 0.1)';
            }} 
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#374151';
              e.currentTarget.style.transform = 'translateX(0)';
              e.currentTarget.style.background = 'none';
            }}
          >
            <ClipboardDocumentListIcon style={{ width: '18px', height: '18px' }} />
            Daily Report Form
          </button>
        </div>,
        document.body
      )}

      {/* Absence Form Modal */}
      {showAbsenceForm && (() => {
        console.log('DEBUG: Rendering Absence Form Modal, showAbsenceForm =', showAbsenceForm);
        return true;
      })() && (
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

      {/* Daily Report Form Modal */}
      {showDailyReportForm && (
        <div className="daily-report-overlay" onClick={handleDailyReportClose}>
          <div className="daily-report-modal" onClick={(e) => e.stopPropagation()}>
            <div className="daily-report-header">
              <h1 className="daily-report-title">Daily Report</h1>
              <button
                onClick={handleDailyReportClose}
                className="daily-close-btn"
                title="Close"
              >
                ×
              </button>
            </div>
            
            <div className="daily-report-body">
              {/* Date Info Display */}
              <div className="date-info-banner">
                <h2 className="date-title">{dailyReportData.dateDisplay}</h2>
                <p className="date-subtitle">Submit your daily progress report</p>
              </div>

              {/* Daily Report Form */}
              <form onSubmit={handleDailyReportSubmit} className="daily-report-form">
                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="daily-label">Project / Team *</label>
                    <select
                      className="daily-select"
                      required
                      value={dailyReportData.projectId}
                      onChange={(e) => setDailyReportData({
                        ...dailyReportData,
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
                    <label className="daily-label">KEY ACTIVITIES COMPLETED *</label>
                    <div className="daily-field-container">
                      {dailyReportData.keyActivities.map((activity, index) => (
                        <div key={index} className="daily-field-row">
                          <input
                            type="text"
                            className="daily-input"
                            required={index === 0}
                            placeholder={index === 0 ? "Main task or deliverable completed..." : "Additional activity..."}
                            value={activity}
                            onChange={(e) => updateReportField('keyActivities', index, e.target.value)}
                          />
                          {dailyReportData.keyActivities.length > 1 && (
                            <button
                              type="button"
                              className="daily-remove-btn"
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
                        className="daily-add-btn"
                        onClick={() => addReportField('keyActivities')}
                      >
                        Add another activity
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="daily-label">ONGOING TASKS</label>
                    <div className="daily-field-container">
                      {dailyReportData.ongoingTasks.map((task, index) => (
                        <div key={index} className="daily-field-row">
                          <input
                            type="text"
                            className="daily-input"
                            placeholder={index === 0 ? "Task in progress..." : "Additional ongoing task..."}
                            value={task}
                            onChange={(e) => updateReportField('ongoingTasks', index, e.target.value)}
                          />
                          {dailyReportData.ongoingTasks.length > 1 && (
                            <button
                              type="button"
                              className="daily-remove-btn"
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
                        className="daily-add-btn"
                        onClick={() => addReportField('ongoingTasks')}
                      >
                        Add ongoing task
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="daily-label">CHALLENGES / ISSUES</label>
                    <div className="daily-field-container">
                      {dailyReportData.challenges.map((challenge, index) => (
                        <div key={index} className="daily-field-row">
                          <input
                            type="text"
                            className="daily-input"
                            placeholder={index === 0 ? "Any blocker or challenge..." : "Additional challenge..."}
                            value={challenge}
                            onChange={(e) => updateReportField('challenges', index, e.target.value)}
                          />
                          {dailyReportData.challenges.length > 1 && (
                            <button
                              type="button"
                              className="daily-remove-btn"
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
                        className="daily-add-btn"
                        onClick={() => addReportField('challenges')}
                      >
                        Add challenge
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half-width">
                    <label className="daily-label">TEAM PERFORMANCE / KPIS</label>
                    <div className="daily-field-container">
                      {dailyReportData.teamPerformance.map((kpi, index) => (
                        <div key={index} className="daily-field-row">
                          <input
                            type="text"
                            className="daily-input"
                            placeholder={index === 0 ? "Performance metric or KPI..." : "Additional KPI..."}
                            value={kpi}
                            onChange={(e) => updateReportField('teamPerformance', index, e.target.value)}
                          />
                          {dailyReportData.teamPerformance.length > 1 && (
                            <button
                              type="button"
                              className="daily-remove-btn"
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
                        className="daily-add-btn"
                        onClick={() => addReportField('teamPerformance')}
                      >
                        Add KPI
                      </button>
                    </div>
                  </div>

                  <div className="form-group half-width">
                    <label className="daily-label">TOMORROW'S PRIORITIES</label>
                    <div className="daily-field-container">
                      {dailyReportData.nextDayPriorities.map((priority, index) => (
                        <div key={index} className="daily-field-row">
                          <input
                            type="text"
                            className="daily-input"
                            placeholder={index === 0 ? "Key priority for tomorrow..." : "Additional priority..."}
                            value={priority}
                            onChange={(e) => updateReportField('nextDayPriorities', index, e.target.value)}
                          />
                          {dailyReportData.nextDayPriorities.length > 1 && (
                            <button
                              type="button"
                              className="daily-remove-btn"
                              onClick={() => removeReportField('nextDayPriorities', index)}
                              title="Remove this item"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        className="daily-add-btn"
                        onClick={() => addReportField('nextDayPriorities')}
                      >
                        Add priority
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="daily-label">MEETING MINUTES</label>
                    <textarea
                      className="daily-textarea"
                      placeholder="Meeting minutes, discussions, decisions made (if any)..."
                      value={dailyReportData.meetingMinutes}
                      onChange={(e) => setDailyReportData({
                        ...dailyReportData,
                        meetingMinutes: e.target.value,
                        hasMeetingMinutes: e.target.value.trim().length > 0
                      })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group full-width">
                    <label className="daily-label">OTHER NOTES</label>
                    <textarea
                      className="daily-textarea"
                      placeholder="Additional observations, suggestions, or miscellaneous notes..."
                      value={dailyReportData.otherNotes}
                      onChange={(e) => setDailyReportData({
                        ...dailyReportData,
                        otherNotes: e.target.value
                      })}
                    />
                  </div>
                </div>

                <div className="daily-form-buttons">
                  <button
                    type="button"
                    onClick={handleDailyReportClose}
                    className="daily-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="daily-btn-submit"
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
      
      {/* Enhanced Daily Report Form Styles */}
      <style jsx>{`
        .daily-report-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .daily-report-modal {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          width: 100%;
          max-width: 1200px;
          max-height: 95vh;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
        }
        
        .daily-report-header {
          background: #ffffff;
          color: #111827;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .daily-report-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.025em;
        }
        
        .daily-close-btn {
          background: #ffffff;
          color: #6b7280;
          border: 1px solid #d1d5db;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 20px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .daily-close-btn:hover {
          background: #f9fafb;
          color: #374151;
        }
        
        .daily-report-body {
          padding: 2rem 3rem 3rem 3rem;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          background: #ffffff;
          scroll-behavior: smooth;
        }
        
        .date-info-banner {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 2rem;
          text-align: center;
          margin-bottom: 3rem;
          border-radius: 12px;
        }
        
        .date-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.025em;
        }
        
        .date-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }
        
        .daily-report-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
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
          gap: 0.75rem;
        }
        
        .form-group.full-width {
          flex: 1;
        }
        
        .form-group.half-width {
          flex: 1;
        }
        
        .daily-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
          padding-bottom: 0.25rem;
        }
        
        .daily-select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: #ffffff;
          color: #111827;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .daily-select:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .daily-field-container {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .daily-field-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .daily-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          background: #ffffff;
          color: #111827;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .daily-input:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .daily-input:hover {
          border-color: #9ca3af;
        }
        
        .daily-input::placeholder {
          color: #9ca3af;
        }
        
        .daily-remove-btn {
          background: #ffffff;
          color: #6b7280;
          border: 1px solid #d1d5db;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        
        .daily-remove-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        .daily-add-btn {
          background: #f9fafb;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.75rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          align-self: flex-start;
        }
        
        .daily-add-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .daily-textarea {
          width: 100%;
          min-height: 120px;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          background: #ffffff;
          color: #111827;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .daily-textarea:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .daily-textarea:hover {
          border-color: #9ca3af;
        }
        
        .daily-textarea::placeholder {
          color: #9ca3af;
        }
        
        .daily-form-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding: 2rem 0 1rem 0;
          margin-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .daily-btn-cancel {
          background: #ffffff;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .daily-btn-cancel:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .daily-btn-submit {
          background: #111827;
          color: #ffffff;
          border: 1px solid #111827;
          border-radius: 8px;
          padding: 0.875rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .daily-btn-submit:hover {
          background: #1f2937;
          border-color: #1f2937;
        }
        
        @media (max-width: 768px) {
          .weekly-report-overlay {
            padding: 1rem;
          }
          
          .daily-report-modal {
            max-width: 100%;
            max-height: 98vh;
          }
          
          .daily-report-header {
            padding: 1.5rem;
          }
          
          .daily-report-title {
            font-size: 1.5rem;
          }
          
          .daily-report-body {
            padding: 1.5rem;
          }
          
          .form-row {
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .daily-form-buttons {
            flex-direction: column;
            gap: 1rem;
          }
          
          .daily-btn-cancel,
          .daily-btn-submit {
            width: 100%;
            text-align: center;
          }
        }

        /* Enhanced Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }
        
        .modal-content {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 0;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease;
          position: relative;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2rem 1rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
          position: relative;
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.025em;
        }
        
        .modal-close-btn {
          background: #ffffff;
          border: 1px solid #d1d5db;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-close-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          color: #374151;
        }
        
        .modal-body {
          padding: 2rem;
          max-height: 75vh;
          overflow-y: auto;
        }
        
        .leave-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .stat-card {
          text-align: center;
          padding: 1.5rem 1rem;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          position: relative;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: #111827;
          letter-spacing: -0.025em;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        
        .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .form-input:hover {
          border-color: #9ca3af;
        }
        
        .form-input::placeholder {
          color: #9ca3af;
        }
        
        .form-select {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          box-sizing: border-box;
          cursor: pointer;
        }
        
        .form-select:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .form-select:hover {
          border-color: #9ca3af;
        }
        
        .form-textarea {
          width: 100%;
          min-height: 100px;
          padding: 0.875rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          background: #ffffff;
          color: #111827;
          resize: vertical;
          font-family: inherit;
          line-height: 1.5;
          box-sizing: border-box;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #374151;
          box-shadow: 0 0 0 3px rgba(55, 65, 81, 0.1);
        }
        
        .form-textarea:hover {
          border-color: #9ca3af;
        }
        
        .form-textarea::placeholder {
          color: #9ca3af;
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .form-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn {
          padding: 0.875rem 1.5rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid;
        }
        
        .btn-secondary {
          background: #ffffff;
          color: #374151;
          border-color: #d1d5db;
        }
        
        .btn-secondary:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }
        
        .btn-primary {
          background: #111827;
          color: #ffffff;
          border-color: #111827;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #1f2937;
          border-color: #1f2937;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from { transform: translateY(-20px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        
        @media (max-width: 768px) {
          .modal-content {
            max-width: 95vw;
            margin: 1rem;
          }
          
          .modal-header {
            padding: 1.5rem 1.5rem 1rem 1.5rem;
          }
          
          .modal-title {
            font-size: 1.25rem;
          }
          
          .modal-body {
            padding: 1.5rem;
          }
          
          .leave-stats {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-buttons {
            flex-direction: column;
          }

          .btn {
            width: 100%;
            text-align: center;
          }
        }
        
        @media (max-width: 480px) {
          .modal-overlay {
            padding: 1rem;
          }
          
          .modal-content {
            border-radius: 12px;
            max-height: 95vh;
          }
        }
      `}</style>
    </div>
  );
} 