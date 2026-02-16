'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import { projectService, taskService, meetingService } from '@/lib/api-compatibility';
import { supabase } from '@/lib/supabase';
import { showNotification, notificationScheduler } from '@/lib/electron-notifications';
import { goalsService, Goal, GoalCompletion } from '@/lib/goals-service';
import {
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  LinkIcon,
  TrashIcon,
  CheckIcon,
  CalendarDaysIcon,
  ClockIcon,
  VideoCameraIcon,
  SparklesIcon,
  UserIcon,
  BellIcon,
  Squares2X2Icon,
  ListBulletIcon,
  FlagIcon,
  FolderIcon,
  ArrowPathIcon,
  TagIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  BriefcaseIcon,
  RocketLaunchIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

// Types for external data integration
interface ProjectTask {
  id: number;
  name: string;
  description?: string;
  status: string;
  priority: string;
  due_date?: string;
  project_id: number;
  project_name?: string;
  project_color?: string;
  assignees?: { id: number; name: string }[];
}

interface TimelineItem {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: string;
  category_name?: string;
  team_leader_id?: number;
  team_member_ids?: number[];
}

interface Meeting {
  id: number;
  title: string;
  description?: string;
  date: string;
  time: string;
  duration: number;
  project_name?: string;
  attendees_list?: string[];
  meeting_link?: string;
  agenda_items?: string[];
  notes?: string;
  location?: string;
}

// Content Calendar Post type
interface ContentPost {
  id: string;
  company_id: string;
  company_name?: string;
  title: string;
  description?: string;
  content_type: string;
  category?: string;
  status: string;
  planned_date: string;
  planned_time?: string;
  owner_id?: string;
  owner_name?: string;
  designer_id?: string;
  designer_name?: string;
  editor_id?: string;
  editor_name?: string;
  hashtags?: string;
  visual_concept?: string;
  key_points?: string;
  platforms?: string[];
  targets?: {
    platform: string;
    platform_status: string;
    publish_at?: string;
  }[];
  isAssigned?: boolean; // Whether user is assigned as owner/designer/editor
}

// Personal To-Do Item type (quick tasks from conversations)
interface PersonalTodoItem {
  id: string;
  user_id?: string | number;
  task_name: string;
  start_date: string;
  deadline: string;
  duration: number; // hours
  description?: string;
  priority: 'urgent' | 'important' | 'normal';
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

// Types
interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TimeBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  type: 'focus' | 'meeting' | 'personal' | 'goal' | 'project';
  checklist: ChecklistItem[];
  meetingLink?: string;
  notificationTime?: number; // minutes before
  color?: string;
  category?: string; // e.g., "Workout", "Study", "Work"
  isRecurring?: boolean;
  recurringDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  recurringStartDate?: string; // Start date for recurring
  recurringEndDate?: string; // End date for recurring
  excludedDates?: string[]; // Dates to skip for this recurring block (YYYY-MM-DD format)
  completed?: boolean; // Main task completion status
  completedDates?: string[]; // Dates where this recurring block is completed (YYYY-MM-DD format)
  created_at?: string;
  updated_at?: string;
}

// User custom category
interface CustomCategory {
  id: string;
  name: string;
  color: string;
}

type ViewMode = 'day' | 'week' | 'month';

// Days of week for recurring tasks
const DAYS_OF_WEEK = [
  { id: 0, name: 'Sun', fullName: 'Sunday' },
  { id: 1, name: 'Mon', fullName: 'Monday' },
  { id: 2, name: 'Tue', fullName: 'Tuesday' },
  { id: 3, name: 'Wed', fullName: 'Wednesday' },
  { id: 4, name: 'Thu', fullName: 'Thursday' },
  { id: 5, name: 'Fri', fullName: 'Friday' },
  { id: 6, name: 'Sat', fullName: 'Saturday' },
];

// Default categories (no emojis, clean design)
const DEFAULT_CATEGORIES = [
  { id: 'work', name: 'Work', color: '#3b82f6' },
  { id: 'study', name: 'Study', color: '#8b5cf6' },
  { id: 'workout', name: 'Workout', color: '#ef4444' },
  { id: 'health', name: 'Health', color: '#10b981' },
  { id: 'creative', name: 'Creative', color: '#f59e0b' },
  { id: 'social', name: 'Social', color: '#ec4899' },
  { id: 'errands', name: 'Errands', color: '#6366f1' },
  { id: 'rest', name: 'Rest', color: '#64748b' },
];

// Category colors for custom categories
const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', 
  '#f59e0b', '#ec4899', '#6366f1', '#64748b',
  '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

// Color palette for block types
const blockTypeColors: Record<string, { bg: string; border: string; text: string; solid: string }> = {
  focus: { bg: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: '#3B82F6', text: '#FFFFFF', solid: '#3b82f6' },
  meeting: { bg: 'linear-gradient(135deg, #A855F7, #9333EA)', border: '#A855F7', text: '#FFFFFF', solid: '#a855f7' },
  personal: { bg: 'linear-gradient(135deg, #10B981, #059669)', border: '#10B981', text: '#FFFFFF', solid: '#22c55e' },
  goal: { bg: 'linear-gradient(135deg, #F59E0B, #D97706)', border: '#F59E0B', text: '#FFFFFF', solid: '#fb923c' },
  project: { bg: 'linear-gradient(135deg, #EC4899, #DB2777)', border: '#EC4899', text: '#FFFFFF', solid: '#ec4899' },
};

// Hours for the day view
const hours = Array.from({ length: 24 }, (_, i) => i);

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

const slideIn = {
  initial: { opacity: 0, x: 400 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 400 },
};

// Utility functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add padding for days before the first day
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Add all days in the month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add padding to complete the last week
  const endPadding = 42 - days.length;
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
};

const getWeekDays = (date: Date): Date[] => {
  const day = date.getDay();
  // Adjust to start from Monday (day 1), if Sunday (day 0), go back 6 days
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const diff = date.getDate() + mondayOffset;
  const days: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), diff + i));
  }
  
  return days;
};

const generateId = (): string => {
  // Generate a proper UUID v4 for database compatibility
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Calculate checklist completion percentage
const getChecklistProgress = (checklist: ChecklistItem[]): number => {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
};

// Calculate daily progress across all blocks (including recurring)
const getDailyProgress = (blocks: TimeBlock[], date: Date): { total: number; completed: number; percentage: number } => {
  const dateStr = formatDate(date);
  const dayOfWeek = date.getDay();
  
  // Get blocks for this date (including recurring ones)
  const dayBlocks = blocks.filter(block => {
    // Direct date match
    if (block.date === dateStr) return true;
    
    // Recurring block check
    if (block.isRecurring && block.recurringDays && block.recurringDays.includes(dayOfWeek)) {
      const startDate = block.recurringStartDate || block.date;
      const endDate = block.recurringEndDate;
      if (dateStr >= startDate && (!endDate || dateStr <= endDate)) {
        return true;
      }
    }
    return false;
  });
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  dayBlocks.forEach(block => {
    // Count the main block as 1 task
    totalTasks += 1;
    // Per-date completion for recurring blocks
    const isDayDone = block.isRecurring
      ? (block.completedDates || []).includes(dateStr)
      : !!block.completed;
    if (isDayDone) {
      completedTasks += 1;
    }
    
    // Also count checklist items
    if (block.checklist && block.checklist.length > 0) {
      totalTasks += block.checklist.length;
      completedTasks += block.checklist.filter(item => item.completed).length;
    }
  });
  
  const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return { total: totalTasks, completed: completedTasks, percentage };
};

// Database column mapping (snake_case <-> camelCase)
interface DbTimeBlock {
  id: string;
  user_id?: string | number;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  type: 'focus' | 'meeting' | 'personal' | 'goal' | 'project';
  checklist: ChecklistItem[];
  meeting_link?: string;
  notification_time?: number;
  color?: string;
  category?: string;
  is_recurring?: boolean;
  recurring_days?: number[];
  recurring_start_date?: string;
  recurring_end_date?: string;
  excluded_dates?: string[];
  completed?: boolean;
  completed_dates?: string[];
  created_at?: string;
  updated_at?: string;
}

const mapDbToBlock = (db: DbTimeBlock): TimeBlock => ({
  id: db.id,
  date: db.date,
  startTime: db.start_time,
  endTime: db.end_time,
  title: db.title,
  description: db.description,
  type: db.type,
  checklist: db.checklist || [],
  meetingLink: db.meeting_link,
  notificationTime: db.notification_time,
  color: db.color,
  category: db.category,
  isRecurring: db.is_recurring,
  recurringDays: db.recurring_days,
  recurringStartDate: db.recurring_start_date,
  recurringEndDate: db.recurring_end_date,
  excludedDates: db.excluded_dates,
  completed: db.completed,
  completedDates: db.completed_dates || [],
  created_at: db.created_at,
  updated_at: db.updated_at,
});

const mapBlockToDb = (block: TimeBlock, userId?: string | number): DbTimeBlock => ({
  id: block.id,
  user_id: userId,
  date: block.date,
  start_time: block.startTime,
  end_time: block.endTime,
  title: block.title,
  description: block.description,
  type: block.type,
  checklist: block.checklist || [],
  meeting_link: block.meetingLink,
  notification_time: block.notificationTime,
  color: block.color,
  category: block.category,
  is_recurring: block.isRecurring,
  recurring_days: block.recurringDays,
  recurring_start_date: block.recurringStartDate,
  recurring_end_date: block.recurringEndDate,
  excluded_dates: block.excludedDates,
  completed: block.completed,
  completed_dates: block.completedDates || [],
  created_at: block.created_at,
  updated_at: block.updated_at,
});

export default function PersonalPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null); // Track if editing an existing block
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetBlock, setDeleteTargetBlock] = useState<TimeBlock | null>(null);
  const [deleteTargetDate, setDeleteTargetDate] = useState<string>('');
  
  
  // Form state for new/edit block
  const [blockForm, setBlockForm] = useState<Partial<TimeBlock>>({
    title: '',
    description: '',
    type: 'focus',
    startTime: '09:00',
    endTime: '10:00',
    checklist: [],
    meetingLink: '',
    notificationTime: 10,
    category: '',
    isRecurring: false,
    recurringDays: [],
    recurringStartDate: '',
    recurringEndDate: '',
  });

  // Custom categories (stored per user)
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // External data integration - Projects, Tasks, Timeline, Meetings, Content Posts
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  const [personalTodos, setPersonalTodos] = useState<PersonalTodoItem[]>([]);
  const [showAddTodoModal, setShowAddTodoModal] = useState(false);
  const [todoForm, setTodoForm] = useState<Partial<PersonalTodoItem>>({
    task_name: '',
    start_date: formatDate(new Date()),
    deadline: formatDate(new Date()),
    duration: 1,
    description: '',
    priority: 'normal',
  });
  const [personalGoals, setPersonalGoals] = useState<Goal[]>([]);
  const [goalCompletions, setGoalCompletions] = useState<GoalCompletion[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'tasks' | 'timeline' | 'content' | 'todo'>('tasks');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  
  // Detail view modals for external items
  const [selectedExternalTask, setSelectedExternalTask] = useState<ProjectTask | null>(null);
  const [selectedExternalTimeline, setSelectedExternalTimeline] = useState<TimelineItem | null>(null);
  const [selectedExternalMeeting, setSelectedExternalMeeting] = useState<Meeting | null>(null);
  const [selectedContentPost, setSelectedContentPost] = useState<ContentPost | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
    
  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Listen for sidebar collapse changes
    const handleSidebarChange = (e: CustomEvent) => {
      setSidebarCollapsed(e.detail.isCollapsed);
    };
    window.addEventListener('sidebarCollapsedChange', handleSidebarChange as EventListener);
    
    // Check localStorage for initial state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
      setSidebarCollapsed(true);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('sidebarCollapsedChange', handleSidebarChange as EventListener);
    };
  }, []);

  // Load custom categories from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCategories = localStorage.getItem('personal_custom_categories');
      if (savedCategories) {
        try {
          setCustomCategories(JSON.parse(savedCategories));
        } catch (e) {
          console.error('Error loading custom categories:', e);
        }
      }
    }
  }, []);

  // Save custom categories to localStorage
  const saveCustomCategories = (categories: CustomCategory[]) => {
    setCustomCategories(categories);
    if (typeof window !== 'undefined') {
      localStorage.setItem('personal_custom_categories', JSON.stringify(categories));
    }
  };

  // Add new custom category
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: CustomCategory = {
      id: `custom_${generateId()}`,
      name: newCategoryName.trim(),
      color: newCategoryColor,
    };
    
    saveCustomCategories([...customCategories, newCategory]);
    setNewCategoryName('');
    setShowAddCategory(false);
  };

  // Delete custom category
  const handleDeleteCategory = (id: string) => {
    saveCustomCategories(customCategories.filter(c => c.id !== id));
  };

  // Get all categories (default + custom)
  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  // Drag to create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ hour: number; minute: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ hour: number; minute: number } | null>(null);
  const [dragDate, setDragDate] = useState<Date | null>(null);
  const dayViewRef = React.useRef<HTMLDivElement>(null);
  const weekViewRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  
  // Block drag-to-move state (Apple Calendar style)
  const [movingBlock, setMovingBlock] = useState<TimeBlock | null>(null);
  const [moveStartY, setMoveStartY] = useState<number>(0);
  const [moveStartTime, setMoveStartTime] = useState<{ hour: number; minute: number } | null>(null);
  const [moveCurrentY, setMoveCurrentY] = useState<number>(0);
  
  // Block resize state (Apple Calendar style)
  const [resizingBlock, setResizingBlock] = useState<TimeBlock | null>(null);
  const [resizeStartY, setResizeStartY] = useState<number>(0);
  const [resizeStartEndTime, setResizeStartEndTime] = useState<string>('');

  // Context menu state (right-click menu)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; block: TimeBlock } | null>(null);

  // Convert Y position to time
  const getTimeFromY = (y: number, containerTop: number): { hour: number; minute: number } => {
    const relativeY = y - containerTop;
    const hourHeight = 80; // 80px per hour for larger calendar boxes
    const totalMinutes = Math.max(0, Math.min(24 * 60 - 1, (relativeY / hourHeight) * 60));
    const hour = Math.floor(totalMinutes / 60);
    const minute = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15-min intervals
    return { hour: Math.min(23, hour), minute: minute >= 60 ? 0 : minute };
  };

  // Format time from hour/minute
  const formatTimeFromParts = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Handle drag start on day view
  const handleDragStart = (e: React.MouseEvent, date: Date) => {
    if (!dayViewRef.current) return;
    const rect = dayViewRef.current.getBoundingClientRect();
    const time = getTimeFromY(e.clientY, rect.top);
    setIsDragging(true);
    setDragStart(time);
    setDragEnd(time);
    setDragDate(date);
    e.preventDefault();
  };

  // Handle drag move
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    // Check day view ref first
    if (dayViewRef.current) {
      const rect = dayViewRef.current.getBoundingClientRect();
      if (e.clientX >= rect.left && e.clientX <= rect.right && 
          e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const time = getTimeFromY(e.clientY, rect.top);
        setDragEnd(time);
        return;
      }
    }
    
    // Check week view refs
    for (const ref of weekViewRefs.current) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right && 
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const relativeY = e.clientY - rect.top;
          const hourHeight = 50; // 50px per hour in week view
          const totalMinutes = Math.max(0, Math.min(24 * 60 - 1, (relativeY / hourHeight) * 60));
          const hour = Math.floor(totalMinutes / 60);
          const minute = Math.round((totalMinutes % 60) / 15) * 15;
          setDragEnd({ hour: Math.min(23, hour), minute: minute >= 60 ? 0 : minute });
          return;
        }
      }
    }
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging || !dragStart || !dragEnd || !dragDate) {
      setIsDragging(false);
        return;
      }

    // Calculate start and end times
    const startMinutes = dragStart.hour * 60 + dragStart.minute;
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
    
    const actualStart = Math.min(startMinutes, endMinutes);
    const actualEnd = Math.max(startMinutes, endMinutes);
    
    // Minimum 15 minutes
    const finalEnd = actualEnd <= actualStart ? actualStart + 60 : actualEnd;
    
    const startHour = Math.floor(actualStart / 60);
    const startMin = actualStart % 60;
    const endHour = Math.floor(finalEnd / 60);
    const endMin = finalEnd % 60;

    // Set form with the dragged times
    setBlockForm({
      title: '',
      description: '',
      type: 'focus',
      startTime: formatTimeFromParts(startHour, startMin),
      endTime: formatTimeFromParts(Math.min(23, endHour), endMin),
      checklist: [],
      meetingLink: '',
      notificationTime: 10,
    });
    
    setCurrentDate(dragDate);
    setShowAddModal(true);
    
    // Reset drag state
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setDragDate(null);
  }, [isDragging, dragStart, dragEnd, dragDate]);

  // Add global mouse listeners for drag
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);


  // Get drag preview position
  const getDragPreview = () => {
    if (!isDragging || !dragStart || !dragEnd) return null;
    
    const startMinutes = dragStart.hour * 60 + dragStart.minute;
    const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
    
    const top = Math.min(startMinutes, endMinutes);
    const bottom = Math.max(startMinutes, endMinutes);
    const height = Math.max(bottom - top, 15);
    
    return {
      top: (top / 60) * 60,
      height: (height / 60) * 60,
    };
  };

  // Auth check and data fetching
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchBlocks();
    fetchExternalData();
  }, [isAuthenticated, authLoading, router, user]);

  // Automatic notification sender - checks every minute for upcoming blocks
  useEffect(() => {
    if (!user?.email || blocks.length === 0) return;

    const checkAndSendReminders = async () => {
      const now = new Date();
      const todayStr = formatDate(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Get sent reminders from localStorage to avoid duplicates
      const sentRemindersKey = 'sent_reminders';
      const sentRemindersStr = localStorage.getItem(sentRemindersKey) || '{}';
      const sentReminders: Record<string, boolean> = JSON.parse(sentRemindersStr);
      
      // Clean old entries (older than 1 day)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      Object.keys(sentReminders).forEach(key => {
        const timestamp = parseInt(key.split('_').pop() || '0');
        if (timestamp < oneDayAgo) delete sentReminders[key];
      });
      
      // Get blocks for today (including recurring)
      const todayBlocks = blocks.filter(block => {
        if (block.date === todayStr) return true;
        
        if (block.isRecurring && block.recurringDays && block.recurringDays.includes(now.getDay())) {
          const startDate = block.recurringStartDate || block.date;
          const endDate = block.recurringEndDate;
          if (todayStr >= startDate && (!endDate || todayStr <= endDate)) {
            return true;
          }
        }
        return false;
      });
      
      // Check each block
      for (const block of todayBlocks) {
        if (!block.notificationTime || block.notificationTime <= 0) continue;
        
        const [hours, minutes] = block.startTime.split(':').map(Number);
        const blockStartMinutes = hours * 60 + minutes;
        const reminderMinutes = blockStartMinutes - block.notificationTime;
        
        // Create unique reminder key
        const reminderKey = `${block.id}_${todayStr}_${Date.now()}`;
        const blockReminderKey = `${block.id}_${todayStr}`;
        
        // Check if reminder should be sent (within 1 minute of reminder time)
        if (currentMinutes >= reminderMinutes && 
            currentMinutes < reminderMinutes + 2 && 
            currentMinutes < blockStartMinutes &&
            !sentReminders[blockReminderKey]) {
          
          console.log(`Sending reminder for: ${block.title}`);
            
          // Send desktop notification FIRST - don't depend on API
          showNotification(
            `${block.title} starting soon`,
            `Your ${block.type} block starts in ${block.notificationTime} minutes at ${block.startTime}`,
            { urgency: 'critical', url: '/personal' }
          );
          
          // Mark as sent immediately
          sentReminders[blockReminderKey] = true;
          localStorage.setItem(sentRemindersKey, JSON.stringify(sentReminders));
          
          // Try to send email reminder (optional, don't block on this)
          try {
            fetch('/api/time-block-reminders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                block: {
                  id: block.id,
                  title: block.title,
                  description: block.description,
                  date: todayStr,
                  startTime: block.startTime,
                  endTime: block.endTime,
                  type: block.type,
                  meetingLink: block.meetingLink,
                  notificationTime: block.notificationTime,
                  checklist: block.checklist,
                  category: block.category,
                },
                userEmail: user.email,
              }),
            }).catch(() => {});
          } catch (error) {
            // Silently ignore email errors
          }
        }
      }
    };

    // Check immediately
    checkAndSendReminders();

    // Then check every minute
    const interval = setInterval(checkAndSendReminders, 60000);
    
    return () => clearInterval(interval);
  }, [user?.email, blocks]);

  // Automatic meeting reminder sender - checks for upcoming project meetings
  useEffect(() => {
    if (!user?.email || meetings.length === 0) return;

    const checkAndSendMeetingReminders = async () => {
      const now = new Date();
      const todayStr = formatDate(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Get sent meeting reminders from localStorage
      const sentRemindersKey = 'sent_meeting_reminders';
      const sentRemindersStr = localStorage.getItem(sentRemindersKey) || '{}';
      const sentReminders: Record<string, boolean> = JSON.parse(sentRemindersStr);
      
      // Clean old entries (older than 1 day)
      Object.keys(sentReminders).forEach(key => {
        if (!key.includes(todayStr)) delete sentReminders[key];
      });
      
      // Check meetings for today
      for (const meeting of meetings) {
        if (meeting.date !== todayStr) continue;
        
        const reminderTime = (meeting as any).reminder_time || 15; // Default 15 minutes
        if (reminderTime <= 0) continue;
        
        const [hours, minutes] = meeting.time.split(':').map(Number);
        const meetingStartMinutes = hours * 60 + minutes;
        const reminderMinutes = meetingStartMinutes - reminderTime;
        
        const meetingReminderKey = `meeting_${meeting.id}_${todayStr}`;
        
        // Check if reminder should be sent (within 1 minute of reminder time)
        if (currentMinutes >= reminderMinutes && 
            currentMinutes < reminderMinutes + 2 && 
            currentMinutes < meetingStartMinutes &&
            !sentReminders[meetingReminderKey]) {
          
          console.log(`Sending meeting reminder for: ${meeting.title}`);
            
          // Send desktop notification FIRST - don't depend on API
          showNotification(
            `Meeting: ${meeting.title}`,
            `Starting in ${reminderTime} minutes at ${meeting.time}${meeting.project_name ? ` - ${meeting.project_name}` : ''}`,
            { urgency: 'critical', url: '/personal' }
          );
          
          // Mark as sent immediately
          sentReminders[meetingReminderKey] = true;
          localStorage.setItem(sentRemindersKey, JSON.stringify(sentReminders));
          
          // Try to send email reminder (optional, don't block on this)
          try {
            fetch('/api/meeting-reminders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                meeting: {
          id: meeting.id,
          title: meeting.title,
                  description: meeting.description,
                  date: meeting.date,
                  time: meeting.time,
                  duration: meeting.duration,
                  project_name: meeting.project_name,
                  meeting_link: meeting.meeting_link,
                  agenda_items: meeting.agenda_items,
                  attendees_list: meeting.attendees_list,
                  reminder_time: reminderTime,
                },
                attendeeEmails: [user.email],
              }),
            }).catch(() => {});
          } catch (error) {
            // Silently ignore email errors
          }
        }
      }
    };

    // Check immediately
    checkAndSendMeetingReminders();

    // Then check every minute
    const interval = setInterval(checkAndSendMeetingReminders, 60000);
    
    return () => clearInterval(interval);
  }, [user?.email, meetings]);

  // Check for today's deadline tasks and send desktop notifications
  useEffect(() => {
    if (projectTasks.length === 0) return;
    
    const checkDeadlineTasks = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // Get already notified tasks from localStorage
      const notifiedKey = 'deadline_notified_tasks';
      const notifiedStr = localStorage.getItem(notifiedKey) || '{}';
      const notifiedTasks: Record<string, boolean> = JSON.parse(notifiedStr);
      
      // Clean old entries
      Object.keys(notifiedTasks).forEach(key => {
        if (!key.includes(todayStr)) delete notifiedTasks[key];
      });
      
      // Check for tasks due today that haven't been notified
      const todaysTasks = projectTasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = task.due_date.split('T')[0];
        return dueDate === todayStr && task.status !== 'done';
      });
      
      todaysTasks.forEach(task => {
        const taskKey = `${task.id}_${todayStr}`;
        if (!notifiedTasks[taskKey]) {
          // Send desktop notification for deadline today
          showNotification(
            `Task Due Today: ${task.name}`,
            `This task is due today${task.project_name ? ` - Project: ${task.project_name}` : ''}`,
            { urgency: 'critical', url: '/my-tasks' }
          );
          notifiedTasks[taskKey] = true;
        }
      });
      
      localStorage.setItem(notifiedKey, JSON.stringify(notifiedTasks));
    };
    
    // Check immediately
    checkDeadlineTasks();
    
    // Check every 5 minutes for new tasks
    const interval = setInterval(checkDeadlineTasks, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [projectTasks]);

  // Check for timeline items due today
  useEffect(() => {
    if (timelineItems.length === 0) return;
    
    const checkTimelineDeadlines = () => {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const notifiedKey = 'timeline_notified_items';
      const notifiedStr = localStorage.getItem(notifiedKey) || '{}';
      const notifiedItems: Record<string, boolean> = JSON.parse(notifiedStr);
      
      // Clean old entries
      Object.keys(notifiedItems).forEach(key => {
        if (!key.includes(todayStr)) delete notifiedItems[key];
      });
      
      // Check for timeline items ending today
      const todaysItems = timelineItems.filter(item => {
        if (!item.end_date) return false;
        const endDate = item.end_date.split('T')[0];
        return endDate === todayStr && item.status !== 'completed';
      });
      
      todaysItems.forEach(item => {
        const itemKey = `${item.id}_${todayStr}`;
        if (!notifiedItems[itemKey]) {
          showNotification(
            `Timeline Deadline Today: ${item.title}`,
            `This timeline item ends today${item.category_name ? ` - Category: ${item.category_name}` : ''}`,
            { urgency: 'normal', url: '/timeline' }
          );
          notifiedItems[itemKey] = true;
        }
      });
      
      localStorage.setItem(notifiedKey, JSON.stringify(notifiedItems));
    };
    
    checkTimelineDeadlines();
    const interval = setInterval(checkTimelineDeadlines, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [timelineItems]);

  // Fetch external data - Projects Tasks, Timeline Items, Meetings
  const fetchExternalData = async () => {
    if (!user?.id) return;
    
    try {
      // Fetch user's assigned project tasks
      const [tasksData, meetingsData, projectsData] = await Promise.all([
        taskService.getUserTasks(),
        meetingService.getMeetings(),
        projectService.getProjects()
      ]);

      // Map tasks with project info
      const tasksWithProjects = (tasksData || []).map((task: any) => {
        const project = (projectsData || []).find((p: any) => p.id === task.project_id);
        return {
          ...task,
          project_name: project?.name || 'Unknown Project',
          project_color: project?.color || '#6b7280',
        };
      });
      setProjectTasks(tasksWithProjects);

      // Filter meetings where user is involved
      const userMeetings = (meetingsData || []).filter((m: any) => {
        const isCreator = m.created_by?.id === user.id;
        const isAttendee = m.attendee_ids?.includes(user.id);
        return isCreator || isAttendee;
      }).map((m: any) => {
        const project = (projectsData || []).find((p: any) => p.id === (m.project_id || m.project));
        return {
          ...m,
          project_name: project?.name || 'Unknown Project',
        };
      });
      setMeetings(userMeetings);

      // Fetch timeline items assigned to user
      const { data: timelineData, error: timelineError } = await supabase
        .from('timeline_items')
        .select(`*, timeline_categories (name, color)`)
        .neq('status', 'cancelled')
        .order('start_date', { ascending: true });

      if (!timelineError && timelineData) {
        const userId = parseInt(user.id?.toString() || '0');
        const userTimeline = timelineData
          .filter((item: any) => 
            item.team_leader_id === userId || 
            (item.team_member_ids || []).includes(userId)
          )
          .map((item: any) => ({
            ...item,
            category_name: item.timeline_categories?.name
          }));
        setTimelineItems(userTimeline);
      }

      // Fetch personal goals
      try {
        const { data: goalsData } = await goalsService.getGoals(user.id);
        if (goalsData) {
          setPersonalGoals(goalsData);
        }
        
        // Fetch today's goal completions
        const today = new Date().toISOString().split('T')[0];
        const { data: completionsData } = await goalsService.getCompletions(user.id, undefined, today, today);
        if (completionsData) {
          setGoalCompletions(completionsData);
        }
      } catch (goalError) {
        console.log('Goals not available (table may not exist):', goalError);
      }

      // Fetch content posts from calendars the user is a member of
      // Check multiple tables to find user's company memberships
      
      // 1. First try company_members table (direct membership)
      const { data: directMembershipData } = await supabase
        .from('company_members')
        .select('company_id')
        .eq('user_id', user.id?.toString());

      // 2. Also try content_calendar_members (content calendar specific)
      const { data: ccMembershipData } = await supabase
        .from('content_calendar_members')
        .select('id, role')
        .eq('user_id', user.id);

      // 3. Try content_calendar_folder_members
      const { data: folderMembershipData } = await supabase
        .from('content_calendar_folder_members')
        .select('id, role')
        .eq('user_id', user.id);

      console.log('📅 Content Calendar - Direct memberships:', directMembershipData?.length || 0);
      console.log('📅 Content Calendar - CC memberships:', ccMembershipData?.length || 0);
      console.log('📅 Content Calendar - Folder memberships:', folderMembershipData?.length || 0);

      // Combine company IDs from direct memberships
      let companyIds = (directMembershipData || []).map((m: any) => m.company_id);
      
      // If user is a content calendar member, fetch ALL companies they might have access to
      const hasContentCalendarAccess = (ccMembershipData && ccMembershipData.length > 0) || 
                                        (folderMembershipData && folderMembershipData.length > 0);

      if (hasContentCalendarAccess && companyIds.length === 0) {
        // User has content calendar access but no direct company membership
        // Fetch all companies (they likely have broad access)
        const { data: allCompaniesData } = await supabase
          .from('companies')
          .select('id')
          .eq('is_active', true);
        companyIds = (allCompaniesData || []).map((c: any) => c.id);
        console.log('📅 Content Calendar - User has CC access, fetching all companies:', companyIds.length);
      }

      console.log('📅 Content Calendar - Total company IDs:', companyIds);

      if (companyIds.length > 0) {
        // Fetch companies info
        const { data: companiesData } = await supabase
          .from('companies')
          .select('id, name')
          .in('id', companyIds);

        const companyMap = new Map((companiesData || []).map((c: any) => [c.id, c.name]));

        // Fetch ALL posts from user's calendars
        const { data: postsData, error: postsError } = await supabase
          .from('content_posts')
          .select(`*, content_post_targets (platform, platform_status, publish_at)`)
          .in('company_id', companyIds)
          .order('planned_date', { ascending: true });

        console.log('📅 Content Calendar - Posts found:', postsData?.length || 0, postsError);

        if (!postsError && postsData) {
          const userIdStr = user.id?.toString();
          const postsWithCompany = postsData.map((post: any) => {
            // Check if user is assigned to this post
            const isAssigned = post.owner_id?.toString() === userIdStr || 
                              post.designer_id?.toString() === userIdStr || 
                              post.editor_id?.toString() === userIdStr;
            return {
              ...post,
              company_name: companyMap.get(post.company_id) || 'Unknown Company',
              platforms: (post.content_post_targets || []).map((t: any) => t.platform),
              targets: post.content_post_targets || [],
              isAssigned,
            };
          });
          setContentPosts(postsWithCompany);
          console.log('📅 Content Calendar - Posts loaded:', postsWithCompany.length);
        }
      } else {
        console.log('📅 Content Calendar - No company access found');
      }

      // Fetch personal todos
      try {
        const { data: todosData, error: todosError } = await supabase
          .from('personal_todos')
          .select('*')
          .eq('user_id', user.id)
          .order('deadline', { ascending: true });

        if (!todosError && todosData) {
          setPersonalTodos(todosData);
          console.log('📝 Personal Todos - Loaded:', todosData.length);
        } else if (todosError?.code === '42P01') {
          console.log('📝 Personal Todos - Table does not exist yet');
          // Try localStorage fallback
          const storedTodos = localStorage.getItem('personalTodos');
          if (storedTodos) {
            setPersonalTodos(JSON.parse(storedTodos));
          }
        }
      } catch (todoErr) {
        console.log('📝 Personal Todos - Error fetching:', todoErr);
        // Try localStorage fallback
        const storedTodos = localStorage.getItem('personalTodos');
        if (storedTodos) {
          setPersonalTodos(JSON.parse(storedTodos));
        }
      }
    } catch (err) {
      console.error('Error fetching external data:', err);
    }
  };

  const fetchBlocks = async () => {
    try {
      setIsLoading(true);
      const supabase = (await import('@/lib/supabase')).supabase;

      const { data, error } = await supabase
        .from('time_blocks')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) {
        if (error.code === '42P01' || error.code === '42703') {
          // Table doesn't exist or column error, use local storage fallback
          console.log('Database table not ready, using localStorage');
          const stored = localStorage.getItem('timeBlocks');
          if (stored) {
            setBlocks(JSON.parse(stored));
          }
        return;
      }
        throw error;
      }
      
      // Map database records to frontend format
      const mappedBlocks = (data || []).map((record: DbTimeBlock) => mapDbToBlock(record));
      setBlocks(mappedBlocks);
    } catch (err: any) {
      console.error('Error fetching blocks:', err);
      // Fallback to localStorage
      const stored = localStorage.getItem('timeBlocks');
      if (stored) {
        setBlocks(JSON.parse(stored));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveBlock = async (block: TimeBlock) => {
    // Always update local state first for responsive UI
    const newBlocks = blocks.some(b => b.id === block.id)
      ? blocks.map(b => b.id === block.id ? block : b)
      : [...blocks, block];
    setBlocks(newBlocks);
    localStorage.setItem('timeBlocks', JSON.stringify(newBlocks));
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Map to database format
      const dbRecord = mapBlockToDb(block, user?.id);
      dbRecord.updated_at = new Date().toISOString();
      
      console.log('Saving block to database:', dbRecord);
      
      const { data, error } = await supabase
        .from('time_blocks')
        .upsert(dbRecord)
        .select();

      if (error) {
        console.error('Database save error:', error);
        console.log('Block data that failed:', dbRecord);
        return;
      }

      console.log('Block saved successfully:', data);
      // Refresh from database
      await fetchBlocks();
    } catch (err) {
      console.error('Error saving block:', err);
    }
  };

  // =============================================
  // PERSONAL TODO CRUD FUNCTIONS
  // =============================================

  const saveTodo = async (todo: PersonalTodoItem) => {
    // Update local state first for responsive UI
    const newTodos = personalTodos.some(t => t.id === todo.id)
      ? personalTodos.map(t => t.id === todo.id ? todo : t)
      : [...personalTodos, todo];
    setPersonalTodos(newTodos);
    localStorage.setItem('personalTodos', JSON.stringify(newTodos));

    try {
      const dbRecord = {
        ...todo,
        user_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('personal_todos')
        .upsert(dbRecord);

      if (error && error.code !== '42P01') {
        console.error('Database save error for todo:', error);
      }
    } catch (err) {
      console.error('Error saving todo:', err);
    }
  };

  const handleAddTodo = async () => {
    if (!todoForm.task_name?.trim()) return;

    const newTodo: PersonalTodoItem = {
      id: generateId(),
      user_id: user?.id,
      task_name: todoForm.task_name.trim(),
      start_date: todoForm.start_date || formatDate(new Date()),
      deadline: todoForm.deadline || formatDate(new Date()),
      duration: todoForm.duration || 1,
      description: todoForm.description || '',
      priority: todoForm.priority || 'normal',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveTodo(newTodo);
    
    // Reset form
    setTodoForm({
      task_name: '',
      start_date: formatDate(new Date()),
      deadline: formatDate(new Date()),
      duration: 1,
      description: '',
      priority: 'normal',
    });
    setShowAddTodoModal(false);
  };

  const toggleTodoComplete = async (todoId: string) => {
    const todo = personalTodos.find(t => t.id === todoId);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };
    await saveTodo(updatedTodo);
  };

  const deleteTodo = async (todoId: string) => {
    const newTodos = personalTodos.filter(t => t.id !== todoId);
    setPersonalTodos(newTodos);
    localStorage.setItem('personalTodos', JSON.stringify(newTodos));

    try {
      const { error } = await supabase
        .from('personal_todos')
        .delete()
        .eq('id', todoId);

      if (error && error.code !== '42P01') {
        console.error('Error deleting todo:', error);
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  // Filter todos based on current view and date range
  const getFilteredTodos = () => {
    const today = formatDate(currentDate);
    
    return personalTodos.filter(todo => {
      // Show todos where current date falls between start_date and deadline
      if (viewMode === 'day') {
        return today >= todo.start_date && today <= todo.deadline;
      } else if (viewMode === 'week') {
        const weekDays = getWeekDays(currentDate);
        const weekStart = formatDate(weekDays[0]);
        const weekEnd = formatDate(weekDays[6]);
        // Check if todo date range overlaps with current week
        return todo.start_date <= weekEnd && todo.deadline >= weekStart;
      } else {
        // Month view
        const monthDays = getDaysInMonth(currentDate);
        const monthStart = formatDate(monthDays[0]);
        const monthEnd = formatDate(monthDays[monthDays.length - 1]);
        return todo.start_date <= monthEnd && todo.deadline >= monthStart;
      }
    });
  };

  // =============================================
  // BLOCK MOVE HANDLERS (Apple Calendar style)
  // =============================================
  
  const handleBlockMoveStart = (e: React.MouseEvent, block: TimeBlock) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Don't allow moving goals or meetings (only time blocks)
    if (block.id.startsWith('goal-') || block.id.startsWith('meeting-')) return;
    
    const [h, m] = block.startTime.split(':').map(Number);
    setMovingBlock(block);
    setMoveStartY(e.clientY);
    setMoveCurrentY(e.clientY);
    setMoveStartTime({ hour: h, minute: m });
  };
  
  const handleBlockMoveMove = useCallback((e: MouseEvent) => {
    if (!movingBlock) return;
    setMoveCurrentY(e.clientY);
  }, [movingBlock]);
  
  const handleBlockMoveEnd = useCallback(() => {
    if (!movingBlock || !moveStartTime) {
      setMovingBlock(null);
        return;
      }

    // Calculate time difference based on Y movement (60px = 1 hour)
    const deltaY = moveCurrentY - moveStartY;
    const deltaMinutes = Math.round((deltaY / 60) * 60 / 15) * 15; // Snap to 15-minute increments
    
    // Calculate new start and end times
    const startMinutes = moveStartTime.hour * 60 + moveStartTime.minute + deltaMinutes;
    const [endH, endM] = movingBlock.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (moveStartTime.hour * 60 + moveStartTime.minute);
    
    // Clamp to valid range (0:00 - 23:59)
    const clampedStart = Math.max(0, Math.min(23 * 60 + 45, startMinutes));
    const clampedEnd = Math.max(15, Math.min(24 * 60 - 1, clampedStart + duration));
    
    const newStartHour = Math.floor(clampedStart / 60);
    const newStartMin = clampedStart % 60;
    const newEndHour = Math.floor(clampedEnd / 60);
    const newEndMin = clampedEnd % 60;
    
    const updatedBlock = {
      ...movingBlock,
      startTime: `${newStartHour.toString().padStart(2, '0')}:${newStartMin.toString().padStart(2, '0')}`,
      endTime: `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`,
    };
    
    saveBlock(updatedBlock);
    setMovingBlock(null);
    setMoveStartTime(null);
  }, [movingBlock, moveStartTime, moveStartY, moveCurrentY, saveBlock]);
  
  // =============================================
  // BLOCK RESIZE HANDLERS (Apple Calendar style)
  // =============================================
  
  const handleBlockResizeStart = (e: React.MouseEvent, block: TimeBlock) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Don't allow resizing goals or meetings
    if (block.id.startsWith('goal-') || block.id.startsWith('meeting-')) return;
    
    setResizingBlock(block);
    setResizeStartY(e.clientY);
    setResizeStartEndTime(block.endTime);
  };
  
  const handleBlockResizeMove = useCallback((e: MouseEvent) => {
    if (!resizingBlock) return;
    
    // Calculate new end time based on Y movement
    const deltaY = e.clientY - resizeStartY;
    const deltaMinutes = Math.round((deltaY / 60) * 60 / 15) * 15; // Snap to 15-minute increments
    
    const [endH, endM] = resizeStartEndTime.split(':').map(Number);
    const newEndMinutes = endH * 60 + endM + deltaMinutes;
    
    // Minimum 15 minutes duration
    const [startH, startM] = resizingBlock.startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const minEnd = startMinutes + 15;
    const maxEnd = 24 * 60 - 1;
    
    const clampedEnd = Math.max(minEnd, Math.min(maxEnd, newEndMinutes));
    const newEndHour = Math.floor(clampedEnd / 60);
    const newEndMin = clampedEnd % 60;
    
    // Update the block preview (we'll save on mouseup)
    setResizingBlock({
      ...resizingBlock,
      endTime: `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`,
    });
  }, [resizingBlock, resizeStartY, resizeStartEndTime]);
  
  const handleBlockResizeEnd = useCallback(() => {
    if (!resizingBlock) return;
    
    saveBlock(resizingBlock);
    setResizingBlock(null);
    setResizeStartEndTime('');
  }, [resizingBlock, saveBlock]);
  
  // Add global mouse listeners for block move and resize
  useEffect(() => {
    if (movingBlock) {
      window.addEventListener('mousemove', handleBlockMoveMove);
      window.addEventListener('mouseup', handleBlockMoveEnd);
      return () => {
        window.removeEventListener('mousemove', handleBlockMoveMove);
        window.removeEventListener('mouseup', handleBlockMoveEnd);
      };
    }
  }, [movingBlock, handleBlockMoveMove, handleBlockMoveEnd]);
  
  useEffect(() => {
    if (resizingBlock) {
      window.addEventListener('mousemove', handleBlockResizeMove);
      window.addEventListener('mouseup', handleBlockResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleBlockResizeMove);
        window.removeEventListener('mouseup', handleBlockResizeEnd);
      };
    }
  }, [resizingBlock, handleBlockResizeMove, handleBlockResizeEnd]);
  
  // Calculate move preview offset
  const getMoveOffset = () => {
    if (!movingBlock) return 0;
    const deltaY = moveCurrentY - moveStartY;
    return Math.round((deltaY / 60) * 60 / 15) * 15 / 60 * 60; // Convert to pixels (snapped)
  };

  const deleteBlock = async (blockId: string) => {
    console.log('deleteBlock called with id:', blockId);
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      const { error } = await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error('Supabase delete error:', error);
      } else {
        console.log('Block deleted from database successfully');
      }

      const newBlocks = blocks.filter(b => b.id !== blockId);
      console.log('Updating local state, blocks count:', blocks.length, '->', newBlocks.length);
      setBlocks(newBlocks);
      localStorage.setItem('timeBlocks', JSON.stringify(newBlocks));
      setShowPanel(false);
      setSelectedBlock(null);
    } catch (err) {
      console.error('Error deleting block:', err);
      // Still update local state even if database fails
      const newBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(newBlocks);
      localStorage.setItem('timeBlocks', JSON.stringify(newBlocks));
      setShowPanel(false);
      setSelectedBlock(null);
    }
  };

  // Duplicate a block (Apple Calendar style - double-click to duplicate)
  const duplicateBlock = async (block: TimeBlock) => {
    // Don't duplicate goals or meetings
    if (block.id.startsWith('goal-') || block.id.startsWith('meeting-')) return;
    
    // Calculate new time (shift by 30 minutes or to next available slot)
    const [startH, startM] = block.startTime.split(':').map(Number);
    const [endH, endM] = block.endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    
    // New block starts 30 minutes after original ends (or shift by 1 hour if that exceeds day)
    let newStartMinutes = (endH * 60 + endM) + 30;
    if (newStartMinutes + duration > 24 * 60) {
      // Shift earlier instead - 1 hour before original start
      newStartMinutes = Math.max(0, (startH * 60 + startM) - 60);
    }
    
    const newStartH = Math.floor(newStartMinutes / 60);
    const newStartMin = newStartMinutes % 60;
    const newEndMinutes = newStartMinutes + duration;
    const newEndH = Math.floor(newEndMinutes / 60);
    const newEndMin = newEndMinutes % 60;
    
    const duplicatedBlock: TimeBlock = {
      ...block,
      id: generateId(),
      title: `${block.title} (copy)`,
      startTime: `${newStartH.toString().padStart(2, '0')}:${newStartMin.toString().padStart(2, '0')}`,
      endTime: `${newEndH.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`,
      completed: false,
      isRecurring: false, // Don't duplicate as recurring
      recurringDays: [],
    };
    
    console.log('Duplicating block:', block.title, '-> New time:', duplicatedBlock.startTime, '-', duplicatedBlock.endTime);
    
    await saveBlock(duplicatedBlock);
    
    // Open the duplicated block for editing
    setSelectedBlock(duplicatedBlock);
    setBlockForm(duplicatedBlock);
    setShowPanel(true);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, block: TimeBlock) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't show context menu for goals or meetings
    if (block.id.startsWith('goal-') || block.id.startsWith('meeting-')) return;
    setContextMenu({ x: e.clientX, y: e.clientY, block });
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on outside click
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Delete a single occurrence of a recurring block (add date to excluded list)
  const deleteSingleOccurrence = async (block: TimeBlock, dateToExclude: string) => {
    const updatedBlock = {
      ...block,
      excludedDates: [...(block.excludedDates || []), dateToExclude],
    };
    await saveBlock(updatedBlock);
    setShowDeleteConfirm(false);
    setDeleteTargetBlock(null);
    setDeleteTargetDate('');
    setShowPanel(false);
    setSelectedBlock(null);
  };

  // Delete a goal
  const deleteGoal = async (goalId: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      // Refresh goals list
      if (user) {
        const result = await goalsService.getGoals(user.id);
        if (result.data) {
          setPersonalGoals(result.data);
        }
      }
      setShowPanel(false);
      setSelectedBlock(null);
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  // Handler for delete button click - shows confirmation for recurring blocks
  const handleDeleteClick = (block: TimeBlock) => {
    // Check if this is a goal block (type === 'goal')
    if (block.type === 'goal') {
      // Goals are always recurring, so show delete confirmation
      setDeleteTargetBlock(block);
      setDeleteTargetDate(formatDate(currentDate));
      setShowDeleteConfirm(true);
    } else if (block.isRecurring) {
      setDeleteTargetBlock(block);
      setDeleteTargetDate(formatDate(currentDate));
      setShowDeleteConfirm(true);
    } else {
      deleteBlock(block.id);
    }
  };

  // Handler for delete confirmation choice
  const handleDeleteConfirm = async (deleteAll: boolean) => {
    console.log('handleDeleteConfirm called:', { deleteAll, deleteTargetBlock });
    if (deleteTargetBlock) {
      if (deleteTargetBlock.type === 'goal') {
        // For goals, deleteAll means delete the goal entirely
        // Otherwise, we don't support single occurrence deletion for goals yet
        if (deleteAll) {
          console.log('Deleting goal:', deleteTargetBlock.id);
          await deleteGoal(deleteTargetBlock.id);
        } else {
          // For goals, skip today by marking completion as skipped (or just close for now)
          // Goals don't have excludedDates, so we'll just close the modal
          console.log('Single occurrence skip for goals not yet implemented');
          setShowPanel(false);
          setSelectedBlock(null);
        }
      } else {
        if (deleteAll) {
          console.log('Deleting all occurrences of block:', deleteTargetBlock.id);
          await deleteBlock(deleteTargetBlock.id);
        } else {
          console.log('Deleting single occurrence:', deleteTargetBlock.id, deleteTargetDate);
          await deleteSingleOccurrence(deleteTargetBlock, deleteTargetDate);
        }
      }
    }
    setShowDeleteConfirm(false);
    setDeleteTargetBlock(null);
    setDeleteTargetDate('');
  };

  const handleAddBlock = () => {
    // For recurring blocks, use the start date or current date
    const blockDate = blockForm.isRecurring && blockForm.recurringStartDate 
      ? blockForm.recurringStartDate 
      : formatDate(currentDate);
    
    // Check if we're editing an existing block
    const existingBlock = editingBlockId ? blocks.find(b => b.id === editingBlockId) : null;
    
    const newBlock: TimeBlock = {
      id: editingBlockId || generateId(), // Use existing ID if editing, otherwise generate new
      date: existingBlock?.date || blockDate, // Preserve original date if editing
      startTime: blockForm.startTime || '09:00',
      endTime: blockForm.endTime || '10:00',
      title: blockForm.title || 'New Block',
      description: blockForm.description,
      type: blockForm.type || 'focus',
      checklist: blockForm.checklist || [],
      meetingLink: blockForm.meetingLink,
      notificationTime: blockForm.notificationTime,
      category: blockForm.category,
      isRecurring: blockForm.isRecurring || false,
      recurringDays: blockForm.recurringDays || [],
      recurringStartDate: blockForm.isRecurring ? (blockForm.recurringStartDate || formatDate(currentDate)) : undefined,
      recurringEndDate: blockForm.isRecurring ? blockForm.recurringEndDate : undefined,
      excludedDates: existingBlock?.excludedDates, // Preserve excluded dates
      created_at: existingBlock?.created_at || new Date().toISOString(), // Preserve original created_at
      updated_at: new Date().toISOString(),
    };
    
    saveBlock(newBlock);
    setShowAddModal(false);
    setEditingBlockId(null); // Clear editing state
    setBlockForm({
        title: '',
        description: '',
      type: 'focus',
      startTime: '09:00',
      endTime: '10:00',
      checklist: [],
      meetingLink: '',
      notificationTime: 10,
        category: '',
      isRecurring: false,
      recurringDays: [],
      recurringStartDate: '',
      recurringEndDate: '',
    });
  };

  const handleBlockClick = (block: TimeBlock) => {
    setSelectedBlock(block);
    setBlockForm(block);
    setShowPanel(true);
  };

  const handleUpdateBlock = () => {
    if (!selectedBlock) return;
    
    const updatedBlock: TimeBlock = {
      ...selectedBlock,
      ...blockForm,
      checklist: blockForm.checklist || selectedBlock.checklist,
      updated_at: new Date().toISOString(),
    };
    
    saveBlock(updatedBlock);
    setSelectedBlock(updatedBlock);
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!selectedBlock) return;
    
    const updatedChecklist = selectedBlock.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    const updatedBlock = { ...selectedBlock, checklist: updatedChecklist };
    setSelectedBlock(updatedBlock);
    setBlockForm({ ...blockForm, checklist: updatedChecklist });
    saveBlock(updatedBlock);
  };

  // Toggle main task completion
  const toggleMainTaskCompletion = () => {
    if (!selectedBlock) return;
    
    const updatedBlock = { ...selectedBlock, completed: !selectedBlock.completed };
    setSelectedBlock(updatedBlock);
    saveBlock(updatedBlock);
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !selectedBlock) return;
    
    const newItem: ChecklistItem = {
      id: generateId(),
      text: newChecklistItem,
      completed: false,
    };
    
    const updatedChecklist = [...(selectedBlock.checklist || []), newItem];
    const updatedBlock = { ...selectedBlock, checklist: updatedChecklist };
    
    setSelectedBlock(updatedBlock);
    setBlockForm({ ...blockForm, checklist: updatedChecklist });
      setNewChecklistItem('');
    saveBlock(updatedBlock);
  };

  const removeChecklistItem = (itemId: string) => {
    if (!selectedBlock) return;
    
    const updatedChecklist = selectedBlock.checklist.filter(item => item.id !== itemId);
    const updatedBlock = { ...selectedBlock, checklist: updatedChecklist };
    
    setSelectedBlock(updatedBlock);
    setBlockForm({ ...blockForm, checklist: updatedChecklist });
    saveBlock(updatedBlock);
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  // Get goals scheduled for a specific date
  const getGoalsForDate = (date: Date): Goal[] => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay();
    
    return personalGoals.filter(goal => {
      if (!goal.is_active) return false;
      
      // Check date range
      if (goal.start_date && dateStr < goal.start_date) return false;
      if (goal.end_date && dateStr > goal.end_date) return false;
      
      // Check frequency
      if (goal.target_frequency === 'daily') return true;
      if (goal.target_frequency === 'weekly' || goal.target_frequency === 'custom') {
        return goal.target_days?.includes(dayOfWeek) || false;
      }
      
      return false;
    });
  };

  // Check if a goal is completed for today
  const isGoalCompletedToday = (goalId: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return goalCompletions.some(c => c.goal_id === goalId && c.completed_date === today);
  };

  // Calculate overlap positions for blocks that occur at the same time
  const calculateOverlapPositions = (blocksForDay: TimeBlock[]): Map<string, { column: number; totalColumns: number }> => {
    const positions = new Map<string, { column: number; totalColumns: number }>();
    
    // Convert time to minutes for easier comparison
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Sort blocks by start time
    const sortedBlocks = [...blocksForDay].sort((a, b) => 
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
    );
    
    // Track columns: each entry is { blockId, endMinutes }
    const columns: { blockId: string; endMinutes: number }[] = [];
    
    for (const block of sortedBlocks) {
      const startMin = timeToMinutes(block.startTime);
      const endMin = timeToMinutes(block.endTime);
      
      // Find the first column where this block can fit (no overlap)
      let columnIndex = 0;
      while (columnIndex < columns.length && columns[columnIndex].endMinutes > startMin) {
        columnIndex++;
      }
      
      // Place the block in this column
      if (columnIndex < columns.length) {
        columns[columnIndex] = { blockId: block.id, endMinutes: endMin };
      } else {
        columns.push({ blockId: block.id, endMinutes: endMin });
      }
      
      positions.set(block.id, { column: columnIndex, totalColumns: 1 }); // totalColumns updated later
    }
    
    // Now find overlapping groups and update totalColumns
    for (const block of sortedBlocks) {
      const startMin = timeToMinutes(block.startTime);
      const endMin = timeToMinutes(block.endTime);
      
      // Find all blocks that overlap with this one
      const overlappingBlocks = sortedBlocks.filter(other => {
        const otherStart = timeToMinutes(other.startTime);
        const otherEnd = timeToMinutes(other.endTime);
        // Check if they overlap
        return startMin < otherEnd && endMin > otherStart;
      });
      
      // Get the maximum column index among overlapping blocks
      let maxColumn = 0;
      for (const overlapping of overlappingBlocks) {
        const pos = positions.get(overlapping.id);
        if (pos && pos.column > maxColumn) {
          maxColumn = pos.column;
        }
      }
      
      // Update totalColumns for all overlapping blocks
      const totalColumns = maxColumn + 1;
      for (const overlapping of overlappingBlocks) {
        const pos = positions.get(overlapping.id);
        if (pos) {
          positions.set(overlapping.id, { ...pos, totalColumns: Math.max(pos.totalColumns, totalColumns) });
        }
      }
    }
    
    return positions;
  };

  const getBlocksForDate = (date: Date): TimeBlock[] => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Helper to compare dates as strings (YYYY-MM-DD format)
    const compareDates = (d1: string, d2: string): number => {
      return d1.localeCompare(d2);
    };
    
    // Get regular time blocks
    const regularBlocks = blocks.filter(block => {
      // Exact date match (non-recurring blocks)
      if (!block.isRecurring && block.date === dateStr) return true;
      
      // For recurring blocks, check if this date should show the block
      if (block.isRecurring && block.recurringDays && block.recurringDays.length > 0) {
        // Check if this day of week is selected
        if (!block.recurringDays.includes(dayOfWeek)) return false;
        
        // Check if this date is excluded (deleted single occurrence)
        if (block.excludedDates && block.excludedDates.includes(dateStr)) return false;
        
        // Get the start and end dates for the recurring range
        const startDateStr = block.recurringStartDate || block.date;
        const endDateStr = block.recurringEndDate || '';
        
        // Date must be >= start date
        if (compareDates(dateStr, startDateStr) < 0) return false;
        
        // Date must be <= end date (if end date is specified)
        if (endDateStr && compareDates(dateStr, endDateStr) > 0) return false;
        
        return true;
      }
      
      return false;
    });

    // Convert goals to blocks for display
    const goalsAsBlocks: TimeBlock[] = getGoalsForDate(date)
      .filter(goal => goal.target_time) // Only goals with a time
      .map(goal => {
        const endTime = goal.target_time ? 
          (() => {
            const [h, m] = goal.target_time!.split(':').map(Number);
            const endMinutes = h * 60 + m + (goal.duration_minutes || 30);
            const endH = Math.floor(endMinutes / 60) % 24;
            const endM = endMinutes % 60;
            return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
          })() : goal.target_time;
        
        return {
          id: `goal-${goal.id}`,
          date: dateStr,
          startTime: goal.target_time || '09:00',
          endTime: endTime || '09:30',
          title: goal.title,
          description: goal.description,
          type: 'goal' as const,
          checklist: [],
          color: goal.color,
          category: goal.category,
          completed: isGoalCompletedToday(goal.id),
        };
      });

    // Convert meetings to blocks for display
    const meetingsAsBlocks: TimeBlock[] = meetings
      .filter(meeting => meeting.date === dateStr && meeting.time) // Only meetings for this date with a time
      .map(meeting => {
        const startTime = meeting.time; // Format: HH:MM
        const duration = meeting.duration || 60; // Default 60 minutes
        
        // Calculate end time
        const [h, m] = startTime.split(':').map(Number);
        const endMinutes = h * 60 + m + duration;
        const endH = Math.floor(endMinutes / 60) % 24;
        const endM = endMinutes % 60;
        const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
        
        return {
          id: `meeting-${meeting.id}`,
          date: dateStr,
          startTime: startTime,
          endTime: endTime,
          title: meeting.title,
          description: meeting.description,
          type: 'meeting' as const,
          checklist: [],
          meetingLink: meeting.meeting_link,
          color: '#8b5cf6', // Purple for meetings
          category: meeting.project_name,
          completed: false,
        };
      });
    
    return [...regularBlocks, ...goalsAsBlocks, ...meetingsAsBlocks];
  };

  const getBlockPosition = (block: TimeBlock): { top: number; height: number } => {
    const [startHour, startMin] = block.startTime.split(':').map(Number);
    const [endHour, endMin] = block.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    
    return {
      top: (startMinutes / 60) * 80 + 40, // 80px per hour + header offset
      height: Math.max((duration / 60) * 80, 40), // minimum 40px
    };
  };

  if (!isAuthenticated) return null;

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDaysMap: { [key: number]: string } = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
    <>
      {/* Sidebar */}
      <Sidebar 
        projects={[]} 
        onCreateProject={() => {}} 
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="page-main main-content personal-main personal-page"
        style={{
          minHeight: '100vh',
          marginLeft: '280px',
          marginRight: isMobile ? '0' : (showRightPanel ? '380px' : '0'),
          background: '#0D0D0D',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Premium Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
              style={{
            padding: '20px 32px',
            background: '#141414',
            borderBottom: '1px solid #2D2D2D',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Title & Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div>
                <motion.h1
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    letterSpacing: '-0.025em',
                    margin: 0,
                  }}
                >
                  Focus
                </motion.h1>
          </div>
              
              {/* Daily Progress - Inline */}
              {(() => {
                const progress = getDailyProgress(blocks, currentDate);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 16px',
                      background: progress.percentage >= 100 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      borderRadius: '24px',
                    }}
                  >
        <div style={{ 
                      width: '100px', 
                      height: '6px', 
                      background: 'rgba(255,255,255,0.1)', 
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                        style={{
                          height: '100%',
                          background: progress.percentage >= 100 ? '#22c55e' : '#3b82f6',
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                      <span style={{
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: progress.percentage >= 100 ? '#16a34a' : '#2563eb' 
                    }}>
                      {progress.completed}/{progress.total}
                      </span>
                  </motion.div>
                );
              })()}
                    </div>
              
            {/* Right: View Mode & Add Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* View Mode Switcher with Sliding Indicator */}
              <div
                style={{
                  display: 'flex',
                  background: '#1F1F1F',
                  borderRadius: '10px',
                  padding: '3px',
                  position: 'relative',
                  border: '1px solid #2D2D2D',
                }}
              >
                {/* Sliding Background Indicator */}
                <motion.div
                  layout
                  layoutId="viewModeIndicator"
                  style={{
                    position: 'absolute',
                    top: '3px',
                    bottom: '3px',
                    width: 'calc(33.33% - 2px)',
                    background: '#3B82F6',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }}
                  animate={{
                    left: viewMode === 'day' ? '3px' : viewMode === 'week' ? 'calc(33.33% + 1px)' : 'calc(66.66% - 1px)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
                {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '9px 20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: 'transparent',
                      color: viewMode === mode ? '#FFFFFF' : '#71717A',
                      textTransform: 'capitalize',
                      position: 'relative',
                      zIndex: 1,
                      transition: 'color 0.15s ease',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {mode}
                  </motion.button>
            ))}
          </div>

              {/* To-Do List Button */}
              <motion.button
                onClick={() => setShowAddTodoModal(true)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListBulletIcon style={{ width: '16px', height: '16px' }} />
                Add To-Do
              </motion.button>

              {/* Add Block Button */}
              <motion.button
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.03, y: -1, boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)' }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <PlusIcon style={{ width: '18px', height: '18px', strokeWidth: 2.5 }} />
                Add Block
              </motion.button>
        </div>
      </div>

          {/* Navigation */}
          <div
            style={{
            display: 'flex', 
              alignItems: 'center',
            justifyContent: 'space-between', 
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #2D2D2D',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <motion.button
                onClick={() => navigate('prev')}
                whileHover={{ scale: 1.08, background: 'linear-gradient(135deg, #2D2D2D, #1F1F1F)', borderColor: '#3B82F6' }}
                whileTap={{ scale: 0.92 }}
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px solid #2D2D2D',
                  borderRadius: '10px',
                  background: '#1A1A1A',
                  cursor: 'pointer',
                  color: '#E4E4E7',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <ChevronLeftIcon style={{ width: '18px', height: '18px', strokeWidth: 2.5 }} />
              </motion.button>
              
              <motion.h2
                key={currentDate.toISOString()}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#FFFFFF',
                  margin: 0,
                  minWidth: '200px',
                  textAlign: 'center',
                  letterSpacing: '0.01em',
                }}
              >
                {viewMode === 'day' && (
                  <>
                    {weekDaysMap[currentDate.getDay()]}, {monthNames[currentDate.getMonth()]} {currentDate.getDate()}
                </>
              )}
                {viewMode === 'week' && (
                  <>
                    {monthNames[currentDate.getMonth()]} {getWeekDays(currentDate)[0].getDate()} - {getWeekDays(currentDate)[6].getDate()}
                  </>
                )}
                {viewMode === 'month' && (
                  <>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </>
                )}
              </motion.h2>
              
              <motion.button
                onClick={() => navigate('next')}
                whileHover={{ scale: 1.08, background: 'linear-gradient(135deg, #2D2D2D, #1F1F1F)', borderColor: '#3B82F6' }}
                whileTap={{ scale: 0.92 }}
                style={{
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #2D2D2D',
                  borderRadius: '10px',
                  background: '#1A1A1A',
                  cursor: 'pointer',
                  color: '#E4E4E7',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                }}
              >
                <ChevronRightIcon style={{ width: '18px', height: '18px', strokeWidth: 2.5 }} />
              </motion.button>
            </div>

            <motion.button
              onClick={() => setCurrentDate(new Date())}
              whileHover={{ scale: 1.03, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '9px 18px',
                fontSize: '13px',
            fontWeight: '600',
                border: 'none',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                cursor: 'pointer',
                color: '#FFFFFF',
                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Today
            </motion.button>
              </div>
        </motion.header>

      {/* Main Content */}
      <main style={{ padding: '32px 48px', maxWidth: '1800px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid #f0f0f0',
                  borderTopColor: '#0071e3',
                  borderRadius: '50%',
                }}
              />
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {/* Day View */}
              {viewMode === 'day' && (
                <motion.div
                  key="day-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    background: '#1A1A1A',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    border: '1px solid #2D2D2D',
                    overflow: 'hidden',
                  }}
                >
                  <div 
                    ref={dayViewRef}
                    style={{ position: 'relative', cursor: isDragging ? 'ns-resize' : 'crosshair' }}
                    onMouseDown={(e) => {
                      // Only start drag if clicking on empty space (not on a block)
                      if ((e.target as HTMLElement).closest('[data-block]')) return;
                      handleDragStart(e, currentDate);
                    }}
                  >
                    {/* Time Column */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                  style={{
                          display: 'flex',
                          borderBottom: '1px solid #2D2D2D',
                          minHeight: '80px',
                        }}
                      >
                        <div
                          style={{
                            width: '80px',
                            padding: '8px 16px',
                            fontSize: '12px',
                    fontWeight: '500',
                            color: '#71717A',
                            textAlign: 'right',
                            flexShrink: 0,
                            pointerEvents: 'none',
                          }}
                        >
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                        <div
                          style={{
                            flex: 1,
                            borderLeft: '1px solid #2D2D2D',
                            position: 'relative',
                          }}
                        />
                    </div>
                    ))}
                    
                    {/* Drag Preview */}
                    {isDragging && getDragPreview() && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          position: 'absolute',
                          top: `${getDragPreview()!.top}px`,
                          left: '96px',
                          right: '16px',
                          height: `${Math.max(getDragPreview()!.height, 30)}px`,
                          background: 'rgba(59, 130, 246, 0.15)',
                          borderLeft: '3px solid #3b82f6',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          pointerEvents: 'none',
                          zIndex: 5,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <SparklesIcon style={{ width: '14px', height: '14px', color: '#3b82f6' }} />
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1d1d1f' }}>
                            New Block
                          </span>
                </div>
                        {dragStart && dragEnd && (
                          <div style={{ fontSize: '11px', color: '#86868b', marginTop: '4px' }}>
                            {formatTime(formatTimeFromParts(
                              Math.min(dragStart.hour, dragEnd.hour),
                              Math.min(dragStart.hour, dragEnd.hour) === dragStart.hour ? dragStart.minute : dragEnd.minute
                            ))} - {formatTime(formatTimeFromParts(
                              Math.max(dragStart.hour, dragEnd.hour),
                              Math.max(dragStart.hour, dragEnd.hour) === dragStart.hour ? dragStart.minute : dragEnd.minute
              ))}
            </div>
          )}
                      </motion.div>
                    )}
                    
                    {/* Time Blocks */}
                    {(() => {
                      const dayBlocks = getBlocksForDate(currentDate);
                      const overlapPositions = calculateOverlapPositions(dayBlocks);
                      
                      return dayBlocks.map((block) => {
                      const { top, height } = getBlockPosition(block);
                      const colors = blockTypeColors[block.type] || blockTypeColors.focus;
                      const progress = getChecklistProgress(block.checklist);
                      const category = [...DEFAULT_CATEGORIES, ...customCategories].find(c => c.id === block.category);
                      
                      // Get overlap positioning
                      const overlapInfo = overlapPositions.get(block.id);
                      const column = overlapInfo?.column || 0;
                      const totalColumns = overlapInfo?.totalColumns || 1;
                      // Calculate width: available space is (100% - 112px), divide by totalColumns
                      // Each column gets equal width with 4px gap
                      const availableWidth = `calc((100% - 112px) / ${totalColumns} - 4px)`;
                      const leftOffset = `calc(96px + (100% - 112px) * ${column} / ${totalColumns})`;
                      
                      // Check if this block is being moved or resized
                      const isMoving = movingBlock?.id === block.id;
                      const isResizing = resizingBlock?.id === block.id;
                      const moveOffset = isMoving ? getMoveOffset() : 0;
                      const displayBlock = isResizing ? resizingBlock : block;
                      const displayHeight = isResizing ? (() => {
                        const [sh, sm] = displayBlock.startTime.split(':').map(Number);
                        const [eh, em] = displayBlock.endTime.split(':').map(Number);
                        return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60 * 60, 30);
                      })() : height;
                      
                      const canDrag = !block.id.startsWith('goal-') && !block.id.startsWith('meeting-');
                      
                      return (
                        <motion.div
                          key={block.id}
                          data-block="true"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1,
                            y: moveOffset,
                          }}
                          whileHover={{ scale: canDrag ? 1.01 : 1, zIndex: 10 }}
                          onClick={() => !isMoving && !isResizing && handleBlockClick(block)}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (!isMoving && !isResizing && canDrag) {
                              duplicateBlock(block);
                            }
                          }}
                          onContextMenu={(e) => handleContextMenu(e, block)}
                          onMouseDown={(e) => canDrag && handleBlockMoveStart(e, block)}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            left: leftOffset,
                            width: availableWidth,
                            height: `${displayHeight}px`,
                            background: colors.bg,
                            borderLeft: `5px solid ${colors.border}`,
                            borderRadius: '12px',
                            padding: '10px 14px',
                            cursor: isMoving ? 'grabbing' : (canDrag ? 'grab' : 'pointer'),
            overflow: 'hidden',
                            transition: isMoving || isResizing ? 'none' : 'all 0.2s ease',
                            zIndex: isMoving || isResizing ? 100 : column + 2,
                            boxShadow: isMoving ? '0 8px 25px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
                            opacity: isMoving ? 0.9 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Quick Complete Checkbox - per-date for recurring */}
                            {(() => {
                              const dayStr = formatDate(currentDate);
                              const isDayComplete = block.isRecurring 
                                ? (block.completedDates || []).includes(dayStr)
                                : !!block.completed;
                              return (
                            <motion.div
                              data-checkbox="true"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (block.isRecurring) {
                                  const dates = block.completedDates || [];
                                  const newDates = dates.includes(dayStr)
                                    ? dates.filter(d => d !== dayStr)
                                    : [...dates, dayStr];
                                  saveBlock({ ...block, completedDates: newDates });
                                } else {
                                  saveBlock({ ...block, completed: !block.completed });
                                }
                              }}
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '6px',
                                border: isDayComplete ? 'none' : '2.5px solid rgba(255,255,255,0.8)',
                                background: isDayComplete ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.15)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                                cursor: 'pointer',
                                flexShrink: 0,
                                boxShadow: isDayComplete ? '0 2px 6px rgba(16,185,129,0.4)' : 'none',
                              }}
                            >
                              {isDayComplete && <CheckIcon style={{ width: '13px', height: '13px', color: '#FFFFFF', strokeWidth: 3 }} />}
                            </motion.div>
                              );
                            })()}
                            {block.type === 'focus' && <SparklesIcon style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)' }} />}
                            {block.type === 'meeting' && <VideoCameraIcon style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)' }} />}
                            {block.type === 'personal' && <UserIcon style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)' }} />}
                            {block.type === 'goal' && <FlagIcon style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)' }} />}
                            {block.type === 'project' && <FolderIcon style={{ width: '16px', height: '16px', color: 'rgba(255,255,255,0.9)' }} />}
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: block.completed ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
                                textDecoration: block.completed ? 'line-through' : 'none',
                                flex: 1,
                              }}
                            >
                              {block.title}
                            </span>
                            {category && (
                              <div 
                                style={{ 
                                  padding: '3px 8px',
                                  borderRadius: '6px', 
                                  background: 'rgba(255,255,255,0.2)',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: '#FFFFFF',
                                  flexShrink: 0,
                                }} 
                                title={category.name}
                              >
                                {category.name}
                </div>
                            )}
                            {block.checklist.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.85)' }}>
                                <ListBulletIcon style={{ width: '14px', height: '14px' }} />
                                <span style={{ fontSize: '11px', fontWeight: '600' }}>{block.checklist.filter(i => i.completed).length}/{block.checklist.length}</span>
                  </div>
                            )}
                            {block.isRecurring && (
                              <ArrowPathIcon style={{ width: '14px', height: '14px', color: 'rgba(255,255,255,0.85)' }} />
              )}
            </div>
                          <div
                            style={{
                              fontSize: '12px',
                              color: 'rgba(255,255,255,0.75)',
                              marginTop: '6px',
                              fontWeight: 500,
                            }}
                          >
                            {formatTime(block.startTime)} - {formatTime(block.endTime)}
            </div>
                          {block.checklist.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <div
                                style={{
                    display: 'flex',
                    alignItems: 'center',
              justifyContent: 'space-between',
                                  marginBottom: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#86868b' }}>
                                  <ListBulletIcon style={{ width: '12px', height: '12px' }} />
                                  {block.checklist.filter(i => i.completed).length}/{block.checklist.length}
                    </div>
                                <span 
                    style={{
                                    fontSize: '10px', 
                                    fontWeight: '600', 
                                    color: progress >= 100 ? '#34c759' : colors.text,
                                  }}
                                >
                                  {progress}%
                                </span>
                  </div>
                              {/* Mini progress bar */}
                              <div
                  style={{
                                  height: '3px',
                                  background: 'rgba(0, 0, 0, 0.08)',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                }}
                              >
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                  style={{
                                    height: '100%',
                                    background: progress >= 100 ? '#34c759' : colors.solid,
                                    borderRadius: '2px',
                                  }}
                                />
              </div>
            </div>
          )}
                          
                          {/* Resize Handle - Apple Calendar style */}
                          {canDrag && (
                            <div
                              onMouseDown={(e) => handleBlockResizeStart(e, block)}
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: '8px',
                                cursor: 'ns-resize',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                                borderBottomLeftRadius: '8px',
                                borderBottomRightRadius: '8px',
                                background: 'transparent',
                              }}
                              className="resize-handle"
                            >
                              <div style={{
                                width: '30px',
                                height: '3px',
                                borderRadius: '2px',
                                background: 'rgba(0,0,0,0.15)',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                              }} className="resize-indicator" />
                </div>
          )}
                        </motion.div>
                      );
                    });
                    })()}
                    
                    {/* Meetings are now included in the main blocks via getBlocksForDate() */}
            </div>
                </motion.div>
              )}

              {/* Week View */}
              {viewMode === 'week' && (
                <motion.div
                  key="week-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    background: 'linear-gradient(180deg, #1A1A1A 0%, #141414 100%)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    border: '1px solid #2D2D2D',
                    overflow: 'auto',
                    maxHeight: 'calc(100vh - 180px)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Week Header - Sticky with larger dates */}
                  <div
                      style={{
                      display: 'grid',
                      gridTemplateColumns: '80px repeat(7, 1fr)',
                      borderBottom: '1px solid #2D2D2D',
                      background: '#0D0D0D',
                      position: 'sticky',
                      top: 0,
                      zIndex: 20,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ padding: '20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '11px', color: '#52525B', fontWeight: 500 }}>GMT+5</span>
                    </div>
                    {getWeekDays(currentDate).map((day, index) => {
                      const isToday = formatDate(day) === formatDate(new Date());
                      const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                      return (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          style={{
                            padding: '18px 10px 22px',
                            textAlign: 'center',
                            borderLeft: '1px solid #2D2D2D',
                            background: isToday ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)' : 'transparent',
                            borderRadius: isToday ? '12px 12px 0 0' : '0',
                        transition: 'all 0.2s ease',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: '600',
                              color: isToday ? '#3B82F6' : '#71717A',
                              textTransform: 'lowercase',
                              letterSpacing: '0.8px',
                              marginBottom: '10px',
                            }}
                          >
                            {dayNames[day.getDay()]}
                          </div>
                          <div
                            style={{
                              fontSize: '36px',
                              fontWeight: '800',
                              color: isToday ? '#3B82F6' : '#FFFFFF',
                              lineHeight: 1,
                              textShadow: isToday ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none',
                            }}
                          >
                            {day.getDate()}
                          </div>
                        </motion.div>
                  );
                })}
                  </div>
                  
                  {/* Week Grid - Scrollable */}
                  <div
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '80px repeat(7, 1fr)',
                      minHeight: '1840px',
                    }}
                  >
                    {/* Time labels column */}
                    <div style={{ borderRight: '1px solid #1F1F1F' }}>
                      {hours.filter(h => h >= 1 && h <= 23).map((hour) => (
                        <div
                          key={hour}
                          style={{
                            height: '80px',
                            padding: '10px 14px',
                            fontSize: '13px',
                            fontWeight: 500,
                            color: '#71717A',
                            textAlign: 'right',
                            borderBottom: '1px solid #1F1F1F',
                          }}
                        >
                          {hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`}
                        </div>
                      ))}
                    </div>
                  
                    {/* Day columns with drag-to-create */}
                    {getWeekDays(currentDate).map((day, dayIndex) => {
                      const isToday = formatDate(day) === formatDate(new Date());
                      return (
                        <div 
                          key={dayIndex}
                          ref={(el) => { weekViewRefs.current[dayIndex] = el; }}
                          style={{
                            borderLeft: '1px solid #1F1F1F',
                            position: 'relative',
                            cursor: isDragging ? 'ns-resize' : 'crosshair',
                            background: isToday ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                          }}
                          onMouseDown={(e) => {
                            // Don't start drag-to-create if clicking on a block or checkbox
                            const target = e.target as HTMLElement;
                            if (target.closest('[data-checkbox]') || target.closest('[data-block]')) return;
                            const rect = weekViewRefs.current[dayIndex]?.getBoundingClientRect();
                            if (!rect) return;
                            const relativeY = e.clientY - rect.top;
                            const hourHeight = 80;
                            const totalMinutes = Math.max(0, Math.min(24 * 60 - 1, (relativeY / hourHeight) * 60));
                            const hour = Math.floor(totalMinutes / 60) + 1;
                            const minute = Math.round((totalMinutes % 60) / 15) * 15;
                            const time = { hour: Math.min(23, hour), minute: minute >= 60 ? 0 : minute };
                            setIsDragging(true);
                            setDragStart(time);
                            setDragEnd(time);
                            setDragDate(day);
                            e.preventDefault();
                          }}
                        >
                          {/* Hour grid lines */}
                          {hours.filter(h => h >= 1 && h <= 23).map((hour) => (
                            <div
                              key={hour}
                              style={{
                                height: '80px',
                                borderBottom: '1px solid #1F1F1F',
                              }}
                            />
                          ))}
                        
                          {/* Drag preview for this day */}
                          {isDragging && dragDate && formatDate(dragDate) === formatDate(day) && dragStart && dragEnd && (() => {
                            const startMinutes = (dragStart.hour - 1) * 60 + dragStart.minute;
                            const endMinutes = (dragEnd.hour - 1) * 60 + dragEnd.minute;
                            const pxPerMinute = 80 / 60;
                            const top = Math.min(startMinutes, endMinutes) * pxPerMinute;
                            const height = Math.max(Math.abs(endMinutes - startMinutes) * pxPerMinute, 30);
                  return (
                    <div
                      style={{
                        position: 'absolute',
                                  top: `${top}px`,
                        left: '4px',
                        right: '4px',
                        height: `${height}px`,
                                  background: 'rgba(59, 130, 246, 0.2)',
                                  border: '2px dashed #3B82F6',
                                  borderRadius: '8px',
                                  pointerEvents: 'none',
                                }}
                              />
                            );
                          })()}
                        
                          {/* Blocks for this day */}
                          {(() => {
                            const dayBlocks = getBlocksForDate(day);
                            const overlapPositions = calculateOverlapPositions(dayBlocks);
                            
                            // Vibrant colorful block colors matching Kanban design
                            const calendarColors = [
                              { bg: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', border: '#8B5CF6', text: '#FFFFFF' }, // Purple
                              { bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: '#10B981', text: '#FFFFFF' }, // Green
                              { bg: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', border: '#06B6D4', text: '#FFFFFF' }, // Cyan
                              { bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', border: '#F59E0B', text: '#FFFFFF' }, // Orange
                              { bg: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)', border: '#EC4899', text: '#FFFFFF' }, // Pink
                              { bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', border: '#EF4444', text: '#FFFFFF' }, // Red
                              { bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', border: '#3B82F6', text: '#FFFFFF' }, // Blue
                            ];
                            
                            const dayDateStr = formatDate(day);
                            return dayBlocks.map((block, blockIdx) => {
                              const [startHour, startMin] = block.startTime.split(':').map(Number);
                              const [endHour, endMin] = block.endTime.split(':').map(Number);
                              const pxPerMinute = 80 / 60;
                              const top = ((startHour - 1) * 60 + startMin) * pxPerMinute;
                              const height = Math.max(((endHour * 60 + endMin) - (startHour * 60 + startMin)) * pxPerMinute, 50);
                              
                              // Per-date completion for recurring blocks
                              const isCompletedForDay = block.isRecurring 
                                ? (block.completedDates || []).includes(dayDateStr)
                                : !!block.completed;
                              
                              // Use colorful palette based on block type or index
                              const colorIndex = block.type ? 
                                ['work', 'meeting', 'personal', 'health', 'learning', 'creative', 'other'].indexOf(block.type) : 
                                blockIdx;
                              const colors = calendarColors[Math.abs(colorIndex) % calendarColors.length];
                              
                              const overlapInfo = overlapPositions.get(block.id);
                              const column = overlapInfo?.column || 0;
                              const totalColumns = overlapInfo?.totalColumns || 1;
                              const widthPercent = (100 - 8) / totalColumns;
                              const leftOffset = 4 + column * widthPercent;
                              
                              return (
                                <motion.div
                                  key={block.id}
                                  data-block="true"
                                  whileHover={{ scale: 1.02, zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Don't open edit panel if clicking on checkbox
                                    const target = e.target as HTMLElement;
                                    if (target.closest('[data-checkbox]')) return;
                                    handleBlockClick(block);
                                  }}
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (!block.id.startsWith('goal-') && !block.id.startsWith('meeting-')) {
                                      duplicateBlock(block);
                                    }
                                  }}
                                  onContextMenu={(e) => handleContextMenu(e, block)}
                                  style={{
                                    position: 'absolute',
                                    top: `${Math.max(0, top)}px`,
                                    left: `${leftOffset}%`,
                                    width: `${widthPercent - 2}%`,
                                    height: `${height}px`,
                                    background: colors.bg,
                                    borderLeft: `5px solid ${colors.border}`,
                                    borderRadius: '14px',
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                        overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    zIndex: column + 1,
                                    boxShadow: `0 6px 16px rgba(0,0,0,0.25), 0 0 0 1px ${colors.border}40`,
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <motion.div
                                      data-checkbox="true"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (block.isRecurring) {
                                          // Per-date completion for recurring blocks
                                          const dates = block.completedDates || [];
                                          const newDates = dates.includes(dayDateStr)
                                            ? dates.filter(d => d !== dayDateStr)
                                            : [...dates, dayDateStr];
                                          const updatedBlock = { ...block, completedDates: newDates };
                                          saveBlock(updatedBlock);
                                        } else {
                                          const updatedBlock = { ...block, completed: !block.completed };
                                          saveBlock(updatedBlock);
                                        }
                                      }}
                                      whileHover={{ scale: 1.15 }}
                                      whileTap={{ scale: 0.85 }}
                                      style={{
                                        width: '22px',
                                        height: '22px',
                                        borderRadius: '6px',
                                        border: isCompletedForDay ? 'none' : `2.5px solid rgba(255,255,255,0.8)`,
                                        background: isCompletedForDay ? `linear-gradient(135deg, #10B981, #059669)` : 'rgba(255,255,255,0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        boxShadow: isCompletedForDay ? '0 2px 8px rgba(16,185,129,0.4)' : 'none',
                                        transition: 'all 0.2s ease',
                                        marginTop: '1px',
                                      }}
                                    >
                                      {isCompletedForDay && <CheckIcon style={{ width: '13px', height: '13px', color: '#FFFFFF', strokeWidth: 3 }} />}
                                    </motion.div>
                                    <span style={{ 
                                      fontSize: '13px', 
                                      fontWeight: 700, 
                                      color: '#FFFFFF',
                                      textDecoration: isCompletedForDay ? 'line-through' : 'none',
                                      lineHeight: 1.4,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                    }}>{block.title}</span>
                        </div>
                                  <span style={{ fontSize: '11px', color: '#FFFFFF', opacity: 0.85, fontWeight: 600 }}>
                                    {(() => {
                                      const formatTime12 = (time: string) => {
                                        const [h, m] = time.split(':').map(Number);
                                        const ampm = h >= 12 ? 'pm' : 'am';
                                        const hour12 = h % 12 || 12;
                                        return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
                                      };
                                      return `${formatTime12(block.startTime)} - ${formatTime12(block.endTime)}`;
                                    })()}
                                  </span>
                                </motion.div>
                              );
                            });
                          })()}
                    </div>
                  );
                })}
              </div>
                </motion.div>
              )}

              {/* Month View */}
              {viewMode === 'month' && (
                <motion.div
                  key="month-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{
                    background: 'linear-gradient(180deg, #1A1A1A 0%, #141414 100%)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    border: '1px solid #2D2D2D',
                    overflow: 'hidden',
                  }}
                >
                  {/* Month Header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      borderBottom: '1px solid #2D2D2D',
                      background: '#141414',
                    }}
                  >
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        style={{
                          padding: '16px',
                          textAlign: 'center',
                          fontSize: '12px',
                        fontWeight: '600',
                          color: '#71717A',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {day}
            </div>
                    ))}
          </div>

                  {/* Month Grid */}
                  <div
                          style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                    }}
                  >
                    {getDaysInMonth(currentDate).map((day, index) => {
                      const isToday = formatDate(day) === formatDate(new Date());
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const dayBlocks = getBlocksForDate(day);
                      
                      return (
                        <motion.div
                          key={index}
                          whileHover={{ background: 'rgba(255, 255, 255, 0.03)' }}
                          onClick={() => {
                            setCurrentDate(day);
                            setViewMode('day');
                          }}
                          style={{ 
                            minHeight: '100px',
                            padding: '8px',
                            borderRight: (index + 1) % 7 !== 0 ? '1px solid #2D2D2D' : 'none',
                            borderBottom: '1px solid #2D2D2D',
                            cursor: 'pointer',
                            opacity: isCurrentMonth ? 1 : 0.4,
                          }}
                        >
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: isToday ? '#fff' : '#FFFFFF',
                              background: isToday ? '#3B82F6' : 'transparent',
                              borderRadius: '50%',
                              width: '28px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '4px',
                            }}
                          >
                            {day.getDate()}
      </div>

                          {dayBlocks.slice(0, 3).map((block) => {
                            const colors = blockTypeColors[block.type];
    return (
                              <div
                                key={block.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockClick(block);
                                }}
                                style={{ 
                                  fontSize: '11px',
                                  padding: '6px 8px',
                                  marginBottom: '4px',
                                  background: colors.bg,
                                  borderLeft: `3px solid ${colors.border}`,
                                  borderRadius: '6px',
                                  color: block.completed ? 'rgba(255,255,255,0.5)' : '#FFFFFF',
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                  cursor: 'pointer',
                                }}
                              >
                                {(() => {
                                  const monthDayStr = formatDate(day);
                                  const isMonthDayComplete = block.isRecurring
                                    ? (block.completedDates || []).includes(monthDayStr)
                                    : !!block.completed;
                                  return (
                                    <>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (block.isRecurring) {
                                      const dates = block.completedDates || [];
                                      const newDates = dates.includes(monthDayStr)
                                        ? dates.filter(d => d !== monthDayStr)
                                        : [...dates, monthDayStr];
                                      saveBlock({ ...block, completedDates: newDates });
                                    } else {
                                      saveBlock({ ...block, completed: !block.completed });
                                    }
                                  }}
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '3px',
                                    border: isMonthDayComplete ? 'none' : '2px solid rgba(255,255,255,0.8)',
                                    background: isMonthDayComplete ? 'linear-gradient(135deg, #10B981, #059669)' : 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isMonthDayComplete && <CheckIcon style={{ width: '7px', height: '7px', color: '#FFFFFF', strokeWidth: 3 }} />}
                      </div>
                                <span style={{ textDecoration: isMonthDayComplete ? 'line-through' : 'none', color: '#FFFFFF', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{block.title}</span>
                                    </>
                                  );
                                })()}
      </div>
    );
                          })}
                          
                          {dayBlocks.length > 3 && (
                            <div
                        style={{ 
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.6)',
                                fontWeight: '600',
                                marginTop: '2px',
                              }}
                            >
                              +{dayBlocks.length - 3} more
                    </div>
                  )}
                        </motion.div>
                      );
                    })}
                </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </AnimatePresence>
      </main>

      {/* Right Sidebar - Tasks, Timeline & Meetings */}
      {!isMobile && showRightPanel && (() => {
        // Filter tasks and meetings based on view mode
        const getFilteredTasks = () => {
          if (viewMode === 'day') {
            const dateStr = formatDate(currentDate);
            return projectTasks.filter(task => {
              if (!task.due_date) return false;
              return formatDate(new Date(task.due_date)) === dateStr;
            });
          } else if (viewMode === 'week') {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return projectTasks.filter(task => {
              if (!task.due_date) return false;
              const taskDate = new Date(task.due_date);
              return taskDate >= weekStart && taskDate <= weekEnd;
            });
          }
          return projectTasks; // Month view shows all
        };

        const getFilteredMeetings = () => {
          if (viewMode === 'day') {
            const dateStr = formatDate(currentDate);
            return meetings.filter(m => formatDate(new Date(m.date)) === dateStr);
          } else if (viewMode === 'week') {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return meetings.filter(m => {
              const meetingDate = new Date(m.date);
              return meetingDate >= weekStart && meetingDate <= weekEnd;
            });
          }
          return meetings; // Month view shows all
        };

        const getFilteredTimeline = () => {
          if (viewMode === 'day') {
            const dateStr = formatDate(currentDate);
            return timelineItems.filter(item => {
              const startDate = formatDate(new Date(item.start_date));
              const endDate = item.end_date ? formatDate(new Date(item.end_date)) : startDate;
              return dateStr >= startDate && dateStr <= endDate;
            });
          } else if (viewMode === 'week') {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return timelineItems.filter(item => {
              const itemStart = new Date(item.start_date);
              const itemEnd = item.end_date ? new Date(item.end_date) : itemStart;
              return itemStart <= weekEnd && itemEnd >= weekStart;
            });
          }
          return timelineItems; // Month view shows all
        };

        // Filter content posts based on view mode
        const getFilteredContentPosts = () => {
          if (viewMode === 'day') {
            const dateStr = formatDate(currentDate);
            return contentPosts.filter(post => post.planned_date === dateStr);
          } else if (viewMode === 'week') {
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return contentPosts.filter(post => {
              const postDate = new Date(post.planned_date);
              return postDate >= weekStart && postDate <= weekEnd;
            });
          }
          return contentPosts; // Month view shows all
        };

        const filteredTasks = getFilteredTasks();
        const filteredMeetings = getFilteredMeetings();
        const filteredTimeline = getFilteredTimeline();
        const filteredContentPosts = getFilteredContentPosts();

        const viewLabel = viewMode === 'day' ? 'Today' : viewMode === 'week' ? 'This Week' : 'This Month';

        return (
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            right: 0,
            top: '0',
            width: '380px',
            height: '100vh',
            background: '#141414',
            borderLeft: '1px solid #2D2D2D',
            overflowY: 'auto',
            zIndex: 100,
            padding: '0',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div style={{ 
            padding: '16px 20px',
            background: '#1A1A1A',
            borderBottom: '1px solid #2D2D2D',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFFFFF', margin: 0 }}>
                {viewMode === 'day' ? 'Today\'s Focus' : viewMode === 'week' ? 'This Week' : 'This Month'}
              </h3>
              <p style={{ fontSize: '11px', color: '#71717A', margin: '2px 0 0' }}>
                Projects & Schedules
              </p>
            </div>
                  <button
              onClick={() => setShowRightPanel(false)}
                    style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                border: '1px solid #2D2D2D',
                background: '#1F1F1F',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                    }}
                  >
              <ChevronRightIcon style={{ width: '16px', height: '16px', color: '#71717A' }} />
                  </button>
              </div>

          {/* Tasks & Timeline Box */}
          <div style={{ padding: '16px' }}>
            <div
              style={{
                background: '#1A1A1A',
                borderRadius: '16px',
                border: '1px solid #2D2D2D',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  padding: '3px',
                  background: '#0D0D0D',
                  margin: '8px',
                  borderRadius: '8px',
                  gap: '3px',
                }}
              >
              <button
                  onClick={() => setSidebarTab('tasks')}
                style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                            border: 'none', 
                    borderRadius: '6px',
                    background: sidebarTab === 'tasks' ? '#3B82F6' : 'transparent',
                    color: sidebarTab === 'tasks' ? '#FFFFFF' : '#71717A',
                            cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: sidebarTab === 'tasks' ? '0 2px 4px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  <BriefcaseIcon style={{ width: '12px', height: '12px' }} />
                  Tasks
                        </button>
                        <button
                  onClick={() => setSidebarTab('timeline')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                  border: 'none',
                    borderRadius: '6px',
                    background: sidebarTab === 'timeline' ? '#8B5CF6' : 'transparent',
                    color: sidebarTab === 'timeline' ? '#FFFFFF' : '#71717A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: sidebarTab === 'timeline' ? '0 2px 4px rgba(139,92,246,0.3)' : 'none',
                  }}
                >
                  <RocketLaunchIcon style={{ width: '12px', height: '12px' }} />
                  Timeline
                        </button>
                        <button
                  onClick={() => setSidebarTab('content')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                  fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    background: sidebarTab === 'content' ? '#EC4899' : 'transparent',
                    color: sidebarTab === 'content' ? '#FFFFFF' : '#71717A',
                  cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  transition: 'all 0.2s ease',
                    boxShadow: sidebarTab === 'content' ? '0 2px 4px rgba(236,72,153,0.3)' : 'none',
                  }}
                >
                  <Squares2X2Icon style={{ width: '12px', height: '12px' }} />
                  Content
                        </button>
                        <button
                  onClick={() => setSidebarTab('todo')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '6px',
                    background: sidebarTab === 'todo' ? '#10B981' : 'transparent',
                    color: sidebarTab === 'todo' ? '#FFFFFF' : '#71717A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    boxShadow: sidebarTab === 'todo' ? '0 2px 4px rgba(16,185,129,0.3)' : 'none',
                  }}
                >
                  <ListBulletIcon style={{ width: '12px', height: '12px' }} />
                  To-Do
              </button>
          </div>

              {/* Content */}
              <div style={{ padding: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {sidebarTab === 'tasks' ? (
                  filteredTasks.length === 0 ? (
            <div style={{ 
                      textAlign: 'center', 
                      padding: '24px 16px', 
                      color: '#71717A',
                      background: '#0D0D0D',
                      borderRadius: '8px',
                      border: '1px dashed #2D2D2D',
                    }}>
                      <BriefcaseIcon style={{ width: '20px', height: '20px', color: '#52525B', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: '#71717A' }}>No tasks {viewMode === 'day' ? 'due today' : viewMode === 'week' ? 'this week' : 'this month'}</p>
            </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredTasks.map((task) => {
                        const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
                        const isDueToday = task.due_date && formatDate(new Date(task.due_date)) === formatDate(currentDate);
                        return (
                          <motion.div
                            key={task.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedExternalTask(task)}
                            style={{ 
                              padding: '8px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${task.project_color || '#6b7280'}`,
                              background: isDueToday ? 'rgba(59, 130, 246, 0.15)' : '#0D0D0D',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#FFFFFF', marginBottom: '4px', lineHeight: '1.3' }}>
                              {task.name}
            </div>
                            <div style={{ fontSize: '10px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: task.project_color, fontWeight: '500' }}>{task.project_name}</span>
                              {task.due_date && (
                                <span style={{ color: isOverdue ? '#EF4444' : isDueToday ? '#3B82F6' : '#71717A' }}>
                                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )
                ) : sidebarTab === 'timeline' ? (
                  filteredTimeline.length === 0 ? (
            <div style={{ 
                      textAlign: 'center', 
                      padding: '24px 16px', 
                      color: '#8B5CF6',
                      background: '#0D0D0D',
                      borderRadius: '8px',
                      border: '1px dashed #2D2D2D',
                    }}>
                      <RocketLaunchIcon style={{ width: '20px', height: '20px', color: '#8B5CF6', margin: '0 auto 8px', opacity: 0.6 }} />
                      <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: '#71717A' }}>No timeline items {viewMode === 'day' ? 'today' : viewMode === 'week' ? 'this week' : 'this month'}</p>
            </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredTimeline.map((item) => {
                        const isDueToday = item.start_date && formatDate(new Date(item.start_date)) === formatDate(currentDate);
                        return (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedExternalTimeline(item)}
                        style={{ 
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              borderLeft: '3px solid #8B5CF6',
                              background: isDueToday ? 'rgba(139, 92, 246, 0.1)' : '#0D0D0D',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ fontSize: '12px', fontWeight: '500', color: '#FFFFFF', marginBottom: '4px', lineHeight: '1.3' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '10px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {item.category_name && <span style={{ color: '#8B5CF6', fontWeight: '500' }}>{item.category_name}</span>}
                              <span>
                                {new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {item.end_date && ` - ${new Date(item.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )
                ) : sidebarTab === 'content' ? (
                  /* Content Posts Tab */
                  filteredContentPosts.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px 16px', 
                      color: '#EC4899',
                      background: '#0D0D0D',
                      borderRadius: '8px',
                      border: '1px dashed #2D2D2D',
                    }}>
                      <Squares2X2Icon style={{ width: '20px', height: '20px', color: '#EC4899', margin: '0 auto 8px', opacity: 0.6 }} />
                      <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: '#71717A' }}>No posts scheduled {viewMode === 'day' ? 'today' : viewMode === 'week' ? 'this week' : 'this month'}</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {filteredContentPosts.map((post) => {
                        const isToday = post.planned_date === formatDate(currentDate);
                        const platformColors: Record<string, string> = {
                          facebook: '#1877F2',
                          instagram: '#E4405F',
                          tiktok: '#000000',
                          linkedin: '#0A66C2',
                        };
                        const statusColors: Record<string, { bg: string; text: string }> = {
                          idea: { bg: '#F3E8FF', text: '#9333EA' },
                          draft: { bg: '#2D2D2D', text: '#A1A1AA' },
                          design: { bg: '#FEF3C7', text: '#D97706' },
                          review: { bg: '#DBEAFE', text: '#3B82F6' },
                          approved: { bg: '#D1FAE5', text: '#10B981' },
                          scheduled: { bg: '#E0E7FF', text: '#4F46E5' },
                          published: { bg: '#DCFCE7', text: '#16A34A' },
                        };
                        const statusStyle = statusColors[post.status] || { bg: '#2D2D2D', text: '#71717A' };
                        return (
                          <motion.div
                            key={post.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setSelectedContentPost(post)}
                            style={{ 
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${post.isAssigned ? '#EC4899' : '#52525B'}`,
                              background: isToday ? 'rgba(236, 72, 153, 0.1)' : '#0D0D0D',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <div style={{ fontSize: '12px', fontWeight: '500', color: '#FFFFFF', lineHeight: '1.3', flex: 1 }}>
                                {post.title}
                              </div>
                              {post.isAssigned && (
                                <span style={{ 
                                  fontSize: '8px', 
                                  fontWeight: '700', 
                                  padding: '2px 5px', 
                                  background: '#EC4899', 
                                  color: '#fff', 
                                  borderRadius: '4px',
                                  marginLeft: '6px',
                                  flexShrink: 0,
                                }}>
                                  ASSIGNED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '10px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                              <span style={{ color: '#EC4899', fontWeight: '500' }}>{post.company_name}</span>
                              <span style={{ 
                                fontSize: '9px',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                background: statusStyle.bg,
                                color: statusStyle.text,
                                fontWeight: '600',
                                textTransform: 'capitalize',
                              }}>
                                {post.status}
                              </span>
                              <span>
                                {new Date(post.planned_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {/* Platform badges */}
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(post.platforms || []).map((platform) => (
                                <span
                                  key={platform}
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    background: platformColors[platform] || '#6b7280',
                                    color: '#fff',
                                    textTransform: 'capitalize',
                                  }}
                                >
                                  {platform}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )
                ) : sidebarTab === 'todo' ? (
                  /* To-Do List Tab */
                  (() => {
                    const filteredTodos = getFilteredTodos();
                    return filteredTodos.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '24px 16px', 
                      color: '#10B981',
                      background: '#0D0D0D',
                      borderRadius: '8px',
                      border: '1px dashed #2D2D2D',
                    }}>
                      <ListBulletIcon style={{ width: '20px', height: '20px', color: '#10B981', margin: '0 auto 8px', opacity: 0.6 }} />
                        <p style={{ fontSize: '11px', fontWeight: '500', margin: '0 0 8px 0', color: '#71717A' }}>No to-dos {viewMode === 'day' ? 'for today' : viewMode === 'week' ? 'this week' : 'this month'}</p>
                        <button
                          onClick={() => setShowAddTodoModal(true)}
                          style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#10B981',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <PlusIcon style={{ width: '10px', height: '10px' }} />
                          Add To-Do
                        </button>
                    </div>
                  ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Add Todo Button */}
                        <button
                          onClick={() => setShowAddTodoModal(true)}
                          style={{
                            width: '100%',
                            padding: '8px 10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            border: '1px dashed #2D2D2D',
                            borderRadius: '8px',
                            background: '#0D0D0D',
                            color: '#10B981',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            marginBottom: '4px',
                          }}
                        >
                          <PlusIcon style={{ width: '12px', height: '12px' }} />
                          Add To-Do
                        </button>
                        {filteredTodos.map((todo) => {
                        const isOverdue = new Date(todo.deadline) < new Date() && !todo.completed;
                        const priorityColors = {
                          urgent: { bg: '#DC262620', border: '#DC2626', text: '#EF4444' },
                          important: { bg: '#D9770620', border: '#D97706', text: '#F59E0B' },
                          normal: { bg: '#10B98120', border: '#10B981', text: '#10B981' },
                        };
                        const pColor = priorityColors[todo.priority];
                        return (
                          <motion.div
                            key={todo.id}
                            whileHover={{ x: 2 }}
                            whileTap={{ scale: 0.99 }}
                            style={{ 
                              padding: '10px 12px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              borderLeft: `3px solid ${pColor.text}`,
                              background: todo.completed ? '#1A1A1A' : '#0D0D0D',
                              transition: 'all 0.15s ease',
                              opacity: todo.completed ? 0.7 : 1,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                              {/* Checkbox */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTodoComplete(todo.id);
                                }}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '4px',
                                  border: todo.completed ? 'none' : `2px solid ${pColor.text}`,
                                  background: todo.completed ? '#10B981' : 'transparent',
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {todo.completed && <CheckIcon style={{ width: '10px', height: '10px', color: '#fff' }} />}
                              </button>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: '500', 
                                  color: todo.completed ? '#71717A' : '#FFFFFF', 
                                  marginBottom: '4px', 
                                  lineHeight: '1.3',
                                  textDecoration: todo.completed ? 'line-through' : 'none',
                                }}>
                                  {todo.task_name}
                                </div>
                                <div style={{ fontSize: '10px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ 
                                    fontSize: '9px',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    background: pColor.bg,
                                    color: pColor.text,
                                    fontWeight: '600',
                                    textTransform: 'capitalize',
                                  }}>
                                    {todo.priority}
                                  </span>
                                  <span style={{ color: isOverdue ? '#EF4444' : '#71717A' }}>
                                    Due: {new Date(todo.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  <span>
                                    {todo.duration}h
                                  </span>
                                </div>
                                {todo.description && (
                                  <div style={{ fontSize: '10px', color: '#52525B', marginTop: '4px', lineHeight: '1.3' }}>
                                    {todo.description.substring(0, 60)}{todo.description.length > 60 ? '...' : ''}
                                  </div>
                                )}
                              </div>
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm('Delete this to-do?')) {
                                    deleteTodo(todo.id);
                                  }
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  padding: '2px',
                                  opacity: 0.6,
                                }}
                              >
                                <TrashIcon style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    );
                  })()
                ) : null}
              </div>
            </div>

            {/* Meetings Box */}
            <div
                        style={{ 
                background: '#1A1A1A',
                marginTop: '16px',
                borderRadius: '16px',
                border: '1px solid #2D2D2D',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  background: '#1F1F1F',
                  borderBottom: '1px solid #2D2D2D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
            <div style={{
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '10px', 
                  background: '#F59E0B20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                }}>
                  <UsersIcon style={{ width: '18px', height: '18px', color: '#F59E0B' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#F59E0B' }}>Meetings</span>
                </div>
                        <span style={{ 
                          fontSize: '12px', 
                  fontWeight: '700', 
                  color: '#F59E0B', 
                  background: '#F59E0B20', 
                  padding: '4px 10px', 
                  borderRadius: '12px',
                }}>
                  {filteredMeetings.length}
                        </span>
              </div>

              <div style={{ padding: '12px', maxHeight: '250px', overflowY: 'auto', background: '#1A1A1A' }}>
                {filteredMeetings.length === 0 ? (
              <div style={{
                    textAlign: 'center', 
                    padding: '24px 16px', 
                    color: '#F59E0B',
                    background: '#0D0D0D',
                    borderRadius: '8px',
                    border: '1px dashed #2D2D2D',
                  }}>
                    <UsersIcon style={{ width: '20px', height: '20px', color: '#F59E0B', margin: '0 auto 8px', opacity: 0.6 }} />
                    <p style={{ fontSize: '11px', fontWeight: '500', margin: 0, color: '#71717A' }}>No meetings {viewMode === 'day' ? 'today' : viewMode === 'week' ? 'this week' : 'this month'}</p>
                    </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filteredMeetings.map((meeting) => {
                      const isToday = formatDate(new Date(meeting.date)) === formatDate(currentDate);
                      return (
                        <motion.div
                          key={meeting.id}
                          whileHover={{ x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => setSelectedExternalMeeting(meeting)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            borderLeft: '3px solid #F59E0B',
                            background: isToday ? 'rgba(245, 158, 11, 0.1)' : '#0D0D0D',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '500', color: '#FFFFFF', marginBottom: '4px', lineHeight: '1.3' }}>
                            {meeting.title}
                  </div>
                          <div style={{ fontSize: '10px', color: '#71717A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#F59E0B', fontWeight: '600' }}>{meeting.time}</span>
                            <span>{meeting.duration}min</span>
                            <span>{new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
                        </motion.div>
                      );
                    })}
            </div>
          )}
        </div>
      </div>
          </div>
        </motion.aside>
        );
      })()}

      {/* Toggle Right Panel Button (when hidden) - More subtle */}
      {!isMobile && !showRightPanel && (
        <motion.button
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowRightPanel(true)}
                      style={{
              position: 'fixed',
            right: '12px',
            top: '140px',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid #2D2D2D',
            background: '#1F1F1F',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            zIndex: 50,
          }}
        >
          <ChevronLeftIcon style={{ width: '14px', height: '14px', color: '#71717A' }} />
        </motion.button>
      )}

      {/* Add Block Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowAddModal(false); setEditingBlockId(null); }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
          zIndex: 1000,
              padding: '24px',
            }}
          >
            <motion.div
              {...scaleIn}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
                      style={{
                background: '#1A1A1A',
                borderRadius: '20px',
                        width: '100%',
                maxWidth: '480px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                    margin: 0,
                  }}
                >
                  {editingBlockId ? 'Edit Time Block' : 'New Time Block'}
              </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { setShowAddModal(false); setEditingBlockId(null); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                        borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    color: '#86868b',
                  }}
                >
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                </motion.button>
                  </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Title */}
                <div>
                  <label
                    style={{
                display: 'block', 
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Title
                    </label>
                    <input
                      type="text"
                    value={blockForm.title}
                    onChange={(e) => setBlockForm({ ...blockForm, title: e.target.value })}
                    placeholder="What are you working on?"
                      style={{
                        width: '100%',
                      padding: '12px 16px',
                  fontSize: '15px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                    />
                  </div>

                {/* Type */}
                <div>
                  <label
                    style={{
                display: 'block', 
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Type
                    </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {(['focus', 'meeting', 'personal', 'goal', 'project'] as const).map((type) => {
                      const colors = blockTypeColors[type];
                      const icons: Record<string, React.ComponentType<{ style?: React.CSSProperties }>> = {
                        focus: SparklesIcon,
                        meeting: VideoCameraIcon,
                        personal: UserIcon,
                        goal: FlagIcon,
                        project: FolderIcon,
                      };
                      const Icon = icons[type];
                      
                      return (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBlockForm({ ...blockForm, type })}
                      style={{
                            flex: '1 1 calc(33.333% - 6px)',
                            minWidth: '80px',
                            padding: '10px 8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            border: blockForm.type === type ? `2px solid ${colors.solid}` : '1px solid #2D2D2D',
                  borderRadius: '12px',
                            background: blockForm.type === type ? colors.bg : '#1F1F1F',
                            cursor: 'pointer',
                  transition: 'all 0.2s ease',
                          }}
                        >
                          <Icon style={{ width: '18px', height: '18px', color: colors.text }} />
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '500',
                              color: blockForm.type === type ? colors.text : '#86868b',
                              textTransform: 'capitalize',
                            }}
                          >
                            {type}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                  </div>

                {/* Category */}
              <div>
                  <label
                    style={{
                  display: 'block', 
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Category (optional)
                    </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {allCategories.map((cat) => {
                      const isCustom = cat.id.startsWith('custom_');
                      return (
                        <motion.button
                          key={cat.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBlockForm({ ...blockForm, category: blockForm.category === cat.id ? '' : cat.id })}
                      style={{
                            padding: '8px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            border: blockForm.category === cat.id ? `2px solid ${cat.color}` : '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '20px',
                            background: blockForm.category === cat.id ? `${cat.color}15` : '#1F1F1F',
                    cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                          }}
                        >
                          <div 
                            style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              background: cat.color,
                            }} 
                          />
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              color: blockForm.category === cat.id ? cat.color : '#86868b',
                            }}
                          >
                            {cat.name}
                          </span>
                          {isCustom && blockForm.category !== cat.id && (
                            <motion.span
                              whileHover={{ scale: 1.2 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(cat.id);
                              }}
                              style={{
                                marginLeft: '4px',
                                color: '#ff3b30',
                                fontSize: '12px',
                                cursor: 'pointer',
                              }}
                            >
                              ×
                            </motion.span>
                          )}
                        </motion.button>
                      );
                    })}
                    
                    {/* Add Category Button */}
                    {!showAddCategory ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAddCategory(true)}
                          style={{
                          padding: '8px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px dashed rgba(0, 0, 0, 0.2)',
                          borderRadius: '20px',
                          background: '#1A1A1A',
                            cursor: 'pointer',
                          color: '#86868b',
                          fontSize: '12px',
                          fontWeight: '500',
                        }}
                      >
                        <PlusIcon style={{ width: '12px', height: '12px' }} />
                        Add
                      </motion.button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          background: 'rgba(0, 0, 0, 0.02)',
                          borderRadius: '20px',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {CATEGORY_COLORS.slice(0, 6).map((color) => (
                        <button
                          key={color}
                              onClick={() => setNewCategoryColor(color)}
                          style={{
                                width: '16px',
                                height: '16px',
                            borderRadius: '50%',
                            background: color,
                                border: newCategoryColor === color ? '2px solid #1d1d1f' : 'none',
                            cursor: 'pointer',
                          }}
                        />
                      ))}
                        </div>
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                          placeholder="Name"
                          autoFocus
                          style={{
                            width: '80px',
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            borderRadius: '8px',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleAddCategory}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                    fontWeight: '600',
                            background: '#0071e3',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCategory(false);
                            setNewCategoryName('');
                          }}
                          style={{
                            padding: '4px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#86868b',
                          }}
                        >
                          <XMarkIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                      </motion.div>
                    )}
                    </div>
                  </div>

                {/* Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                    <label
                      style={{
                  display: 'block', 
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#86868b',
                        marginBottom: '8px',
                      }}
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={blockForm.startTime}
                      onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                    fontSize: '15px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        outline: 'none',
                      }}
                    />
                  </div>
              <div>
                    <label
                      style={{
                  display: 'block', 
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#86868b',
                        marginBottom: '8px',
                      }}
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      value={blockForm.endTime}
                      onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                    fontSize: '15px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        outline: 'none',
                      }}
                    />
                    </div>
                  </div>

                {/* Description */}
              <div>
                  <label
                    style={{
                  display: 'block', 
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Description (optional)
                    </label>
                  <textarea
                    value={blockForm.description}
                    onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                    placeholder="Add notes or details..."
                    rows={3}
                  style={{
                    width: '100%',
                      padding: '12px 16px',
                    fontSize: '15px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                      resize: 'none',
                  }}
                />
              </div>

                {/* Meeting Link (if meeting type) */}
                {blockForm.type === 'meeting' && (
              <div>
                    <label
                      style={{
                  display: 'block', 
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#86868b',
                        marginBottom: '8px',
                      }}
                    >
                      Meeting Link
                    </label>
                    <div style={{ position: 'relative' }}>
                      <LinkIcon
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '18px',
                          height: '18px',
                          color: '#86868b',
                        }}
                      />
                    <input
                        type="url"
                        value={blockForm.meetingLink}
                        onChange={(e) => setBlockForm({ ...blockForm, meetingLink: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                      style={{
                        width: '100%',
                          padding: '12px 16px 12px 42px',
                    fontSize: '15px',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                          outline: 'none',
                  }}
                    />
                  </div>
            </div>
                )}
                
                {/* Notification */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Reminder
                  </label>
                  <select
                    value={blockForm.notificationTime}
                    onChange={(e) => setBlockForm({ ...blockForm, notificationTime: Number(e.target.value) })}
                          style={{ 
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                      background: '#1A1A1A',
                            cursor: 'pointer',
                    }}
                  >
                    <option value={0}>No reminder</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                  </select>
            </div>
            
                {/* Recurring Days */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setBlockForm({ 
                        ...blockForm, 
                        isRecurring: !blockForm.isRecurring,
                        recurringDays: !blockForm.isRecurring ? [] : blockForm.recurringDays 
                      })}
                      style={{
                        width: '44px',
                        height: '26px',
                        borderRadius: '13px',
                        border: 'none',
                        background: blockForm.isRecurring ? '#34c759' : 'rgba(0, 0, 0, 0.1)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      <motion.div
                        animate={{ x: blockForm.isRecurring ? 18 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '11px',
                          background: '#1A1A1A',
                          position: 'absolute',
                          top: '2px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                      />
                    </motion.button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowPathIcon style={{ width: '16px', height: '16px', color: '#86868b' }} />
                      <span style={{ fontSize: '14px', color: '#1d1d1f' }}>Repeat on specific days</span>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {blockForm.isRecurring && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        {/* Days of week selection */}
                        <div style={{ paddingTop: '12px' }}>
                          <label style={{ fontSize: '12px', fontWeight: '500', color: '#86868b', marginBottom: '8px', display: 'block' }}>
                            Repeat on
                          </label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {DAYS_OF_WEEK.map((day) => {
                              const isSelected = blockForm.recurringDays?.includes(day.id);
                              return (
                                <motion.button
                                  key={day.id}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const days = blockForm.recurringDays || [];
                                    const newDays = isSelected 
                                      ? days.filter(d => d !== day.id)
                                      : [...days, day.id];
                                    setBlockForm({ ...blockForm, recurringDays: newDays });
                                  }}
                      style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '20px',
                        border: 'none',
                                    background: isSelected ? '#3B82F6' : '#2D2D2D',
                                    color: isSelected ? '#fff' : '#71717A',
                                    fontSize: '12px',
                  fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                >
                                  {day.name}
                                </motion.button>
          );
        })}
                          </div>
      </div>
      
                        {/* Date range selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '16px' }}>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#86868b', marginBottom: '6px', display: 'block' }}>
                              Start Date
                    </label>
                    <input
                              type="date"
                              value={blockForm.recurringStartDate || ''}
                              onChange={(e) => setBlockForm({ ...blockForm, recurringStartDate: e.target.value })}
                      style={{
                        width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '10px',
                                outline: 'none',
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '500', color: '#86868b', marginBottom: '6px', display: 'block' }}>
                              End Date
                            </label>
                            <input
                              type="date"
                              value={blockForm.recurringEndDate || ''}
                              onChange={(e) => setBlockForm({ ...blockForm, recurringEndDate: e.target.value })}
                              min={blockForm.recurringStartDate || ''}
              style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                borderRadius: '10px',
                                outline: 'none',
                              }}
                            />
                </div>
                </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>

                {/* Checklist */}
                <div>
                  <label
                  style={{
                      display: 'block',
                      fontSize: '13px',
                    fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Checklist / Mini-tasks
                    </label>
                  
                  {/* Add checklist item input */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <input
                          type="text"
                          value={newChecklistItem}
                          onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newChecklistItem.trim()) {
                          const newItem: ChecklistItem = {
                            id: generateId(),
                            text: newChecklistItem.trim(),
                            completed: false,
                          };
                          setBlockForm({
                            ...blockForm,
                            checklist: [...(blockForm.checklist || []), newItem],
                          });
                          setNewChecklistItem('');
                        }
                      }}
                      placeholder="Add a task or goal..."
                          style={{
                            flex: 1,
                        padding: '10px 14px',
                        fontSize: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        outline: 'none',
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (newChecklistItem.trim()) {
                          const newItem: ChecklistItem = {
                            id: generateId(),
                            text: newChecklistItem.trim(),
                            completed: false,
                          };
                          setBlockForm({
                            ...blockForm,
                            checklist: [...(blockForm.checklist || []), newItem],
                          });
                          setNewChecklistItem('');
                      }
                    }}
                          style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                            border: 'none',
                        borderRadius: '10px',
                        background: '#0071e3',
                        color: '#fff',
                        cursor: 'pointer',
                    }}
                  >
                      <PlusIcon style={{ width: '20px', height: '20px' }} />
                    </motion.button>
                  </div>
                  
                  {/* Checklist items */}
                  {(blockForm.checklist?.length ?? 0) > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {blockForm.checklist?.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
        style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            background: 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '10px',
                          }}
                        >
                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => {
                              setBlockForm({
                                ...blockForm,
                                checklist: blockForm.checklist?.map(i =>
                                  i.id === item.id ? { ...i, completed: !i.completed } : i
                                ),
                              });
                    }}
                    style={{
                              width: '22px',
                              height: '22px',
                            borderRadius: '6px',
                              border: item.completed ? 'none' : '2px solid rgba(0, 0, 0, 0.2)',
                              background: item.completed ? '#34c759' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                      cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            {item.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <CheckIcon style={{ width: '14px', height: '14px', color: '#fff' }} />
                              </motion.div>
                            )}
                          </motion.button>
                          <span
                            style={{
                              flex: 1,
                              fontSize: '14px',
                              color: item.completed ? '#86868b' : '#1d1d1f',
                              textDecoration: item.completed ? 'line-through' : 'none',
                            }}
                          >
                            {item.text}
                          </span>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setBlockForm({
                                ...blockForm,
                                checklist: blockForm.checklist?.filter(i => i.id !== item.id),
                              });
                            }}
                            style={{
                              width: '24px',
                              height: '24px',
                display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: '#ff3b30',
                              opacity: 0.6,
                            }}
                          >
                            <TrashIcon style={{ width: '14px', height: '14px' }} />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
                <div
                  style={{
                  padding: '16px 24px 24px',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setShowAddModal(false); setEditingBlockId(null); }}
                    style={{ 
                    flex: 1,
                    padding: '14px',
                    fontSize: '15px',
                            fontWeight: '500',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                    background: '#1A1A1A',
                            cursor: 'pointer',
                    color: '#FFFFFF',
                      }}
                    >
                      Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddBlock}
                    style={{ 
                    flex: 1,
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '500',
                      border: 'none',
                    borderRadius: '12px',
                    background: '#0071e3',
                      cursor: 'pointer',
                    color: '#fff',
                    }}
                  >
                  {editingBlockId ? 'Save Changes' : 'Create Block'}
                </motion.button>
                  </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu (Right-click menu) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              background: '#1A1A1A',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              padding: '6px',
              minWidth: '180px',
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                handleBlockClick(contextMenu.block);
                closeContextMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: '#FFFFFF',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <PencilSquareIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              Edit Block
                        </button>
            
            <button
              onClick={() => {
                duplicateBlock(contextMenu.block);
                closeContextMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: '#FFFFFF',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <DocumentTextIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              Duplicate
            </button>
            
            <button
              onClick={() => {
                const updatedBlock = { ...contextMenu.block, completed: !contextMenu.block.completed };
                saveBlock(updatedBlock);
                closeContextMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: contextMenu.block.completed ? '#f59e0b' : '#22c55e',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f7')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <CheckCircleIcon style={{ width: '16px', height: '16px' }} />
              {contextMenu.block.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            
            <div style={{ height: '1px', background: '#e5e7eb', margin: '6px 0' }} />
            
            <button
              onClick={() => {
                if (contextMenu.block.isRecurring) {
                  setDeleteTargetBlock(contextMenu.block);
                  setDeleteTargetDate(contextMenu.block.date);
                  setShowDeleteConfirm(true);
                } else {
                  deleteBlock(contextMenu.block.id);
                }
                closeContextMenu();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                background: 'transparent',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                color: '#ef4444',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <TrashIcon style={{ width: '16px', height: '16px' }} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal for Recurring Tasks */}
      <AnimatePresence>
        {showDeleteConfirm && deleteTargetBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteConfirm(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1A1A1A',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '400px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ExclamationTriangleIcon style={{ width: '24px', height: '24px', color: '#ef4444' }} />
                      </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                    Delete Recurring Task
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
                    {deleteTargetBlock.title}
                  </p>
                    </div>
              </div>
              
              <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#4b5563', lineHeight: '1.5' }}>
                This is a recurring task. Would you like to delete just this occurrence on <strong>{deleteTargetDate}</strong>, or delete all occurrences?
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDeleteConfirm(false)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#1F1F1F',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#E4E4E7',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CalendarDaysIcon style={{ width: '18px', height: '18px' }} />
                  Delete This Occurrence Only
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#dc2626',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <TrashIcon style={{ width: '18px', height: '18px' }} />
                  Delete All Occurrences
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </motion.button>
                  </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Details Popup Modal - Clean Minimal Design */}
      <AnimatePresence>
        {showPanel && selectedBlock && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
                    style={{
                width: '100%',
                maxWidth: '480px',
                maxHeight: '85vh',
                background: '#1A1A1A',
                borderRadius: '20px',
                boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Minimal Header */}
              <div
                style={{
                  padding: '20px 20px 16px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                }}
              >
                {/* Top row: Type badge + Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 10px',
                        borderRadius: '16px',
                        background: blockTypeColors[selectedBlock.type].bg,
                      }}
                    >
                      {selectedBlock.type === 'focus' && <SparklesIcon style={{ width: '12px', height: '12px', color: blockTypeColors.focus.text }} />}
                      {selectedBlock.type === 'meeting' && <VideoCameraIcon style={{ width: '12px', height: '12px', color: blockTypeColors.meeting.text }} />}
                      {selectedBlock.type === 'personal' && <UserIcon style={{ width: '12px', height: '12px', color: blockTypeColors.personal.text }} />}
                      {selectedBlock.type === 'goal' && <FlagIcon style={{ width: '12px', height: '12px', color: blockTypeColors.goal.text }} />}
                      {selectedBlock.type === 'project' && <FolderIcon style={{ width: '12px', height: '12px', color: blockTypeColors.project.text }} />}
                      <span style={{ fontSize: '11px', fontWeight: '600', color: blockTypeColors[selectedBlock.type].text, textTransform: 'capitalize' }}>
                        {selectedBlock.type}
                      </span>
                  </div>
                    {selectedBlock.isRecurring && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', borderRadius: '16px', background: 'rgba(139, 92, 246, 0.1)' }}>
                        <ArrowPathIcon style={{ width: '11px', height: '11px', color: '#8b5cf6' }} />
                        <span style={{ fontSize: '11px', fontWeight: '500', color: '#8b5cf6' }}>Recurring</span>
              </div>
                      )}
            </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setShowPanel(false);
                        setEditingBlockId(selectedBlock.id); // Track that we're editing this block
                        setBlockForm({
                          title: selectedBlock.title,
                          description: selectedBlock.description,
                          type: selectedBlock.type,
                          startTime: selectedBlock.startTime,
                          endTime: selectedBlock.endTime,
                          checklist: selectedBlock.checklist,
                          meetingLink: selectedBlock.meetingLink,
                          notificationTime: selectedBlock.notificationTime,
                          category: selectedBlock.category,
                          isRecurring: selectedBlock.isRecurring,
                          recurringDays: selectedBlock.recurringDays,
                          recurringStartDate: selectedBlock.recurringStartDate,
                          recurringEndDate: selectedBlock.recurringEndDate,
                        });
                        setShowAddModal(true);
                      }}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'rgba(0, 113, 227, 0.08)', cursor: 'pointer', color: '#0071e3' }}
                    >
                      <PencilSquareIcon style={{ width: '15px', height: '15px' }} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteClick(selectedBlock)}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <TrashIcon style={{ width: '15px', height: '15px' }} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPanel(false)}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'rgba(0, 0, 0, 0.04)', cursor: 'pointer', color: '#86868b' }}
                    >
                      <XMarkIcon style={{ width: '15px', height: '15px' }} />
                    </motion.button>
        </div>
      </div>
      
                {/* Task Title with Checkbox */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={toggleMainTaskCompletion}
                    style={{
                      width: '26px',
                      height: '26px',
                      marginTop: '2px',
                        borderRadius: '8px',
                      border: selectedBlock.completed ? 'none' : '2px solid rgba(0, 0, 0, 0.2)',
                      background: selectedBlock.completed ? '#22c55e' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {selectedBlock.completed && <CheckIcon style={{ width: '14px', height: '14px', color: '#fff' }} />}
                  </motion.button>
                  <div style={{ flex: 1 }}>
                    <h2 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: selectedBlock.completed ? '#86868b' : '#1d1d1f',
                      textDecoration: selectedBlock.completed ? 'line-through' : 'none',
                      margin: 0,
                      lineHeight: 1.3,
                    }}>
                      {selectedBlock.title}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '13px', color: '#86868b' }}>
                      <ClockIcon style={{ width: '13px', height: '13px' }} />
                      <span>{formatTime(selectedBlock.startTime)} - {formatTime(selectedBlock.endTime)}</span>
                      <span style={{ margin: '0 4px' }}>·</span>
                      <span>{new Date(selectedBlock.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
    </div>
                </div>
              </div>
              
              {/* Content - Scrollable */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
                {/* Meeting Link - only if meeting type */}
                {selectedBlock.type === 'meeting' && selectedBlock.meetingLink && (
                  <motion.a
                    href={selectedBlock.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.01 }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      background: 'rgba(0, 113, 227, 0.06)',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      color: '#0071e3',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    <LinkIcon style={{ width: '14px', height: '14px' }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedBlock.meetingLink}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', padding: '4px 10px', background: '#0071e3', color: '#fff', borderRadius: '8px' }}>Join</span>
                  </motion.a>
                )}
                
                {/* Notes - only show if has content */}
                {selectedBlock.description && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#86868b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</div>
                    <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#FFFFFF', whiteSpace: 'pre-wrap' }}>
                      {selectedBlock.description}
                    </div>
                  </div>
                )}
                
                {/* Checklist Section - Always show */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Checklist {selectedBlock.checklist.length > 0 && `(${selectedBlock.checklist.filter(i => i.completed).length}/${selectedBlock.checklist.length})`}
                    </span>
                    {selectedBlock.checklist.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '4px', borderRadius: '2px', background: 'rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(selectedBlock.checklist.filter(i => i.completed).length / selectedBlock.checklist.length) * 100}%` }}
                            style={{ height: '100%', background: '#22c55e', borderRadius: '2px' }}
                          />
          </div>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#22c55e' }}>
                          {Math.round((selectedBlock.checklist.filter(i => i.completed).length / selectedBlock.checklist.length) * 100)}%
                        </span>
                      </div>
                    )}
      </div>
      
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selectedBlock.checklist.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ background: 'rgba(0, 0, 0, 0.03)' }}
                        onClick={() => toggleChecklistItem(item.id)}
              style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                cursor: 'pointer',
                        }}
                      >
                        <div
                  style={{
                            width: '20px',
                            height: '20px',
                              borderRadius: '6px',
                            border: item.completed ? 'none' : '2px solid rgba(0, 0, 0, 0.15)',
                            background: item.completed ? '#22c55e' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {item.completed && <CheckIcon style={{ width: '12px', height: '12px', color: '#fff' }} />}
                </div>
                        <span style={{
                          flex: 1,
                          fontSize: '14px',
                          color: item.completed ? '#86868b' : '#1d1d1f',
                          textDecoration: item.completed ? 'line-through' : 'none',
                        }}>
                          {item.text}
                        </span>
                        <motion.button
                          whileHover={{ opacity: 1 }}
                          onClick={(e) => { e.stopPropagation(); removeChecklistItem(item.id); }}
                          style={{ opacity: 0.3, border: 'none', background: 'none', cursor: 'pointer', color: '#86868b', padding: '4px' }}
                        >
                          <XMarkIcon style={{ width: '14px', height: '14px' }} />
                        </motion.button>
                      </motion.div>
                    ))}
                    
                    {/* Add checklist item */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: '2px dashed rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />
                            <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newChecklistItem.trim()) addChecklistItem(); }}
                        placeholder="Add item..."
                        style={{ flex: 1, fontSize: '14px', border: 'none', outline: 'none', background: 'transparent', color: '#1d1d1f' }}
                      />
                      {newChecklistItem && (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={addChecklistItem}
                          style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', border: 'none', borderRadius: '6px', background: '#0071e3', color: '#fff', cursor: 'pointer' }}
                        >
                          Add
                        </motion.button>
              )}
            </div>
      </div>
    </div>
                
                {/* Email Reminder - only show if set */}
                {selectedBlock.notificationTime && selectedBlock.notificationTime > 0 && (
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(249, 115, 22, 0.06)', borderRadius: '10px', fontSize: '13px', color: '#f97316' }}>
                    <BellIcon style={{ width: '14px', height: '14px' }} />
                    <span>Reminder {selectedBlock.notificationTime} min before</span>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPanel(false)}
                  style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '10px', background: '#1d1d1f', color: '#fff', cursor: 'pointer' }}
                >
                  Done
                </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* External Task Detail Modal */}
      <AnimatePresence>
        {selectedExternalTask && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedExternalTask(null)}
                              style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1A1A1A',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: selectedExternalTask.project_color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {selectedExternalTask.project_name}
                    </span>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: '4px 0 0' }}>
                      {selectedExternalTask.name}
                    </h2>
                  </div>
                  <button onClick={() => setSelectedExternalTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <XMarkIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  </button>
                </div>
              </div>
              
              <div style={{ padding: '20px' }}>
                {selectedExternalTask.description && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Description</label>
                    <p style={{ fontSize: '14px', color: '#E4E4E7', marginTop: '6px', lineHeight: '1.5' }}>{selectedExternalTask.description}</p>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  {selectedExternalTask.due_date && (
                    <div style={{ padding: '12px', background: '#0D0D0D', borderRadius: '10px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Due Date</label>
                      <p style={{ fontSize: '13px', color: '#FFFFFF', marginTop: '4px', fontWeight: '600' }}>
                        {new Date(selectedExternalTask.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {selectedExternalTask.priority && (
                    <div style={{ padding: '12px', background: '#0D0D0D', borderRadius: '10px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Priority</label>
                      <p style={{ fontSize: '13px', color: selectedExternalTask.priority === 'high' ? '#ef4444' : selectedExternalTask.priority === 'medium' ? '#f59e0b' : '#22c55e', marginTop: '4px', fontWeight: '600', textTransform: 'capitalize' }}>
                        {selectedExternalTask.priority}
                      </p>
                    </div>
                  )}
                  {selectedExternalTask.status && (
                    <div style={{ padding: '12px', background: '#0D0D0D', borderRadius: '10px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</label>
                      <p style={{ fontSize: '13px', color: '#FFFFFF', marginTop: '4px', fontWeight: '600', textTransform: 'capitalize' }}>
                        {selectedExternalTask.status?.replace('_', ' ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    // Set the date to the task's due date if available
                    if (selectedExternalTask.due_date) {
                      setCurrentDate(new Date(selectedExternalTask.due_date));
                    }
                    setBlockForm({
                      title: selectedExternalTask.name,
                      description: selectedExternalTask.description || `From: ${selectedExternalTask.project_name}`,
                      type: 'project',
                      startTime: '09:00',
                      endTime: '10:00',
                      checklist: [],
                      category: 'Work',
                    });
                    setSelectedExternalTask(null);
                    setShowAddModal(true);
                  }}
                  style={{ flex: 1, padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' }}
                >
                  Add to Calendar
                </button>
                <button
                  onClick={() => setSelectedExternalTask(null)}
                  style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: '1px solid #2D2D2D', borderRadius: '10px', background: '#1A1A1A', color: '#E4E4E7', cursor: 'pointer' }}
                >
                  Close
                </button>
                          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* External Timeline Detail Modal */}
      <AnimatePresence>
        {selectedExternalTimeline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedExternalTimeline(null)}
                            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
                              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
                              style={{
                background: '#1A1A1A',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '480px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    {selectedExternalTimeline.category_name && (
                      <span style={{ fontSize: '10px', fontWeight: '600', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {selectedExternalTimeline.category_name}
                      </span>
                    )}
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', margin: '4px 0 0' }}>
                      {selectedExternalTimeline.title}
                    </h2>
                              </div>
                  <button onClick={() => setSelectedExternalTimeline(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <XMarkIcon style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                  </button>
                                </div>
                            </div>
              
              <div style={{ padding: '20px' }}>
                {selectedExternalTimeline.description && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Description</label>
                    <p style={{ fontSize: '14px', color: '#E4E4E7', marginTop: '6px', lineHeight: '1.5' }}>{selectedExternalTimeline.description}</p>
                          </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#0D0D0D', borderRadius: '10px' }}>
                    <label style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Start Date</label>
                    <p style={{ fontSize: '13px', color: '#FFFFFF', marginTop: '4px', fontWeight: '600' }}>
                      {new Date(selectedExternalTimeline.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                </div>
                  {selectedExternalTimeline.end_date && (
                    <div style={{ padding: '12px', background: '#0D0D0D', borderRadius: '10px' }}>
                      <label style={{ fontSize: '10px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>End Date</label>
                      <p style={{ fontSize: '13px', color: '#FFFFFF', marginTop: '4px', fontWeight: '600' }}>
                        {new Date(selectedExternalTimeline.end_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
              </div>
                  )}
        </div>
      </div>
      
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
                  <button
                  onClick={() => {
                    // Set the date to the timeline's start date
                    setCurrentDate(new Date(selectedExternalTimeline.start_date));
                    setBlockForm({
                      title: selectedExternalTimeline.title,
                      description: selectedExternalTimeline.description || '',
                      type: 'goal',
                      startTime: '09:00',
                      endTime: '10:00',
                      checklist: [],
                      category: selectedExternalTimeline.category_name || '',
                    });
                    setSelectedExternalTimeline(null);
                    setShowAddModal(true);
                  }}
                  style={{ flex: 1, padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)' }}
                >
                  Add to Calendar
                  </button>
                  <button
                  onClick={() => setSelectedExternalTimeline(null)}
                  style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', border: '1px solid #2D2D2D', borderRadius: '10px', background: '#1A1A1A', color: '#E4E4E7', cursor: 'pointer' }}
                >
                  Close
                  </button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* External Meeting Detail Modal - View Only */}
      <AnimatePresence>
        {selectedExternalMeeting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedExternalMeeting(null)}
            style={{ 
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1A1A1A',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Header with gradient */}
              <div style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                borderRadius: '20px 20px 0 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {selectedExternalMeeting.project_name && (
                            <span style={{
                        display: 'inline-block',
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: '#fff', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        background: '#f59e0b',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                      }}>
                        {selectedExternalMeeting.project_name}
                            </span>
                    )}
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#78350f', margin: 0, lineHeight: '1.3' }}>
                      {selectedExternalMeeting.title}
                    </h2>
                  </div>
                            <button
                    onClick={() => setSelectedExternalMeeting(null)} 
                              style={{
                      background: 'rgba(255,255,255,0.8)', 
                                border: 'none',
                                cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '10px',
                      marginLeft: '12px',
                              }}
                            >
                    <XMarkIcon style={{ width: '18px', height: '18px', color: '#78350f' }} />
                            </button>
                </div>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Date & Time Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', background: '#fef3c7', borderRadius: '12px', textAlign: 'center' }}>
                    <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#d97706', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>
                      {new Date(selectedExternalMeeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: '#fef3c7', borderRadius: '12px', textAlign: 'center' }}>
                    <ClockIcon style={{ width: '20px', height: '20px', color: '#d97706', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>
                      {selectedExternalMeeting.time}
                    </p>
                  </div>
                  <div style={{ padding: '14px', background: '#fef3c7', borderRadius: '12px', textAlign: 'center' }}>
                    <SparklesIcon style={{ width: '20px', height: '20px', color: '#d97706', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', margin: 0 }}>
                      {selectedExternalMeeting.duration} min
                    </p>
                  </div>
                </div>

                {/* Meeting Link */}
                {selectedExternalMeeting.meeting_link && (
                  <div style={{ marginBottom: '20px' }}>
                    <a 
                      href={selectedExternalMeeting.meeting_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      <VideoCameraIcon style={{ width: '20px', height: '20px' }} />
                      Join Meeting
                    </a>
                  </div>
                )}

                {/* Description */}
                {selectedExternalMeeting.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Description
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#E4E4E7', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '14px',
                      background: '#0D0D0D',
                      borderRadius: '10px',
                      borderLeft: '3px solid #f59e0b',
                    }}>
                      {selectedExternalMeeting.description}
                    </p>
                  </div>
                )}

                {/* Agenda Items */}
                {selectedExternalMeeting.agenda_items && selectedExternalMeeting.agenda_items.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Meeting Agenda
                    </h4>
                    <div style={{ 
                      background: '#0D0D0D', 
                      borderRadius: '12px', 
                      padding: '12px',
                      borderLeft: '3px solid #10b981',
                    }}>
                      {selectedExternalMeeting.agenda_items.map((item, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '10px',
                            padding: '8px 0',
                            borderBottom: idx < selectedExternalMeeting.agenda_items!.length - 1 ? '1px solid #e5e7eb' : 'none',
                          }}
                        >
                          <span style={{ 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            background: '#10b981', 
                            color: '#fff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '11px', 
                            fontWeight: '700',
                            flexShrink: 0,
                          }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '13px', color: '#E4E4E7', lineHeight: '1.4' }}>{item}</span>
                          </div>
                        ))}
                    </div>
                      </div>
                    )}

                {/* Attendees */}
                {selectedExternalMeeting.attendees_list && selectedExternalMeeting.attendees_list.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Attendees ({selectedExternalMeeting.attendees_list.length})
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedExternalMeeting.attendees_list.map((attendee, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            background: '#1F1F1F',
                            borderRadius: '20px',
                          }}
                        >
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#fff',
                          }}>
                            {attendee.charAt(0).toUpperCase()}
                  </div>
                          <span style={{ fontSize: '12px', color: '#E4E4E7', fontWeight: '500' }}>{attendee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedExternalMeeting.notes && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Notes
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#6b7280', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '12px',
                      background: '#1A1A1A',
                      borderRadius: '10px',
                      fontStyle: 'italic',
                    }}>
                      {selectedExternalMeeting.notes}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Footer Actions */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
                    <button
                  onClick={() => {
                    const [h, m] = (selectedExternalMeeting.time || '09:00').split(':').map(Number);
                    const endMinutes = h * 60 + m + (selectedExternalMeeting.duration || 60);
                    const endH = Math.floor(endMinutes / 60) % 24;
                    const endM = endMinutes % 60;
                    setCurrentDate(new Date(selectedExternalMeeting.date));
                    setBlockForm({
                      title: selectedExternalMeeting.title,
                      description: selectedExternalMeeting.description || '',
                      type: 'meeting',
                      startTime: selectedExternalMeeting.time || '09:00',
                      endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`,
                      checklist: [],
                      category: 'Work',
                    });
                    setSelectedExternalMeeting(null);
                    setShowAddModal(true);
                  }}
                      style={{
                    flex: 1, 
                    padding: '14px 20px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                        border: 'none',
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
                    color: '#fff', 
                        cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                  Add to My Calendar
                    </button>
                    <button
                  onClick={() => setSelectedExternalMeeting(null)}
                      style={{
                    padding: '14px 20px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    border: '1px solid #2D2D2D', 
                    borderRadius: '12px', 
                    background: '#1A1A1A', 
                    color: '#E4E4E7', 
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Post Detail Modal - View Only */}
      <AnimatePresence>
        {selectedContentPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedContentPost(null)}
            style={{ 
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1A1A1A',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '85vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Header with gradient */}
              <div style={{ 
                padding: '24px', 
                background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
                borderRadius: '20px 20px 0 0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {selectedContentPost.company_name && (
                      <span style={{ 
                        display: 'inline-block',
                        fontSize: '10px', 
                        fontWeight: '700', 
                        color: '#fff', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        background: '#ec4899',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                      }}>
                        {selectedContentPost.company_name}
                      </span>
                    )}
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#831843', margin: 0, lineHeight: '1.3' }}>
                      {selectedContentPost.title}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedContentPost(null)} 
                    style={{ 
                      background: 'rgba(255,255,255,0.8)', 
                        border: 'none',
                        cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '10px',
                      marginLeft: '12px',
                      }}
                    >
                    <XMarkIcon style={{ width: '18px', height: '18px', color: '#831843' }} />
                    </button>
                  </div>
              </div>
              
              <div style={{ padding: '24px' }}>
                {/* Post Info Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ padding: '14px', background: '#fdf2f8', borderRadius: '12px', textAlign: 'center' }}>
                    <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#db2777', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#9d174d', fontWeight: '600', margin: 0 }}>
                      {new Date(selectedContentPost.planned_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    {selectedContentPost.planned_time && (
                      <p style={{ fontSize: '11px', color: '#be185d', margin: '4px 0 0' }}>{selectedContentPost.planned_time}</p>
                    )}
            </div>
                  <div style={{ padding: '14px', background: '#fdf2f8', borderRadius: '12px', textAlign: 'center' }}>
                    <TagIcon style={{ width: '20px', height: '20px', color: '#db2777', margin: '0 auto 6px' }} />
                    <p style={{ fontSize: '12px', color: '#9d174d', fontWeight: '600', margin: 0, textTransform: 'capitalize' }}>
                      {selectedContentPost.content_type}
                    </p>
                    <p style={{ fontSize: '11px', color: '#be185d', margin: '4px 0 0', textTransform: 'capitalize' }}>{selectedContentPost.status}</p>
                  </div>
                </div>

                {/* Platforms */}
                {selectedContentPost.platforms && selectedContentPost.platforms.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Platforms
                    </h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedContentPost.platforms.map((platform) => {
                        const platformColors: Record<string, { bg: string; color: string }> = {
                          facebook: { bg: '#1877F2', color: '#fff' },
                          instagram: { bg: 'linear-gradient(45deg, #f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)', color: '#fff' },
                          tiktok: { bg: '#000000', color: '#fff' },
                          linkedin: { bg: '#0A66C2', color: '#fff' },
                        };
                        const target = selectedContentPost.targets?.find((t) => t.platform === platform);
                        return (
                          <div 
                            key={platform}
                            style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 14px',
                              background: platformColors[platform]?.bg || '#6b7280',
                              borderRadius: '10px',
                              color: '#fff',
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize' }}>{platform}</span>
                            {target && (
                              <span style={{ 
                                fontSize: '10px', 
                                padding: '2px 6px', 
                                background: 'rgba(255,255,255,0.2)', 
                                borderRadius: '4px',
                                textTransform: 'capitalize',
                              }}>
                                {target.platform_status}
                              </span>
          )}
      </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                {selectedContentPost.description && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Description
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#E4E4E7', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '14px',
                      background: '#0D0D0D',
                      borderRadius: '10px',
                      borderLeft: '3px solid #ec4899',
                    }}>
                      {selectedContentPost.description}
                    </p>
                  </div>
                )}

                {/* Key Points */}
                {selectedContentPost.key_points && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Key Points
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#E4E4E7', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '12px',
                      background: '#f0fdf4',
                      borderRadius: '10px',
                      borderLeft: '3px solid #22c55e',
                    }}>
                      {selectedContentPost.key_points}
                    </p>
                  </div>
                )}

                {/* Visual Concept */}
                {selectedContentPost.visual_concept && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Visual Concept
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#E4E4E7', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '12px',
                      background: '#faf5ff',
                      borderRadius: '10px',
                      borderLeft: '3px solid #a855f7',
                    }}>
                      {selectedContentPost.visual_concept}
                    </p>
                  </div>
                )}

                {/* Hashtags */}
                {selectedContentPost.hashtags && (
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                      Hashtags
                    </h4>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#3b82f6', 
                      lineHeight: '1.6',
                      margin: 0,
                      padding: '12px',
                      background: '#eff6ff',
                      borderRadius: '10px',
                    }}>
                      {selectedContentPost.hashtags}
                    </p>
                  </div>
                )}

                {/* Team */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                    Team
                  </h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedContentPost.owner_name && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: '#dbeafe',
                        borderRadius: '20px',
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#fff',
                        }}>
                          {selectedContentPost.owner_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: '500' }}>{selectedContentPost.owner_name}</span>
                          <span style={{ fontSize: '9px', color: '#60a5fa', display: 'block' }}>Owner</span>
                        </div>
                      </div>
                    )}
                    {selectedContentPost.designer_name && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: '#fce7f3',
                        borderRadius: '20px',
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ec4899',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#fff',
                        }}>
                          {selectedContentPost.designer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#be185d', fontWeight: '500' }}>{selectedContentPost.designer_name}</span>
                          <span style={{ fontSize: '9px', color: '#f472b6', display: 'block' }}>Designer</span>
                        </div>
                      </div>
                    )}
                    {selectedContentPost.editor_name && (
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: '#f3e8ff',
                        borderRadius: '20px',
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#a855f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#fff',
                        }}>
                          {selectedContentPost.editor_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: '500' }}>{selectedContentPost.editor_name}</span>
                          <span style={{ fontSize: '9px', color: '#c084fc', display: 'block' }}>Editor</span>
                        </div>
                      </div>
                    )}
                    {!selectedContentPost.owner_name && !selectedContentPost.designer_name && !selectedContentPost.editor_name && (
                      <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>No team members assigned</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setCurrentDate(new Date(selectedContentPost.planned_date));
                    setBlockForm({
                      title: `📱 ${selectedContentPost.title}`,
                      description: `${selectedContentPost.description || ''}\n\nPlatforms: ${(selectedContentPost.platforms || []).join(', ')}\nCompany: ${selectedContentPost.company_name || 'Unknown'}`,
                      type: 'project',
                      startTime: selectedContentPost.planned_time || '09:00',
                      endTime: selectedContentPost.planned_time ? 
                        (() => {
                          const [h, m] = selectedContentPost.planned_time!.split(':').map(Number);
                          return `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        })() : '10:00',
                      checklist: [],
                      category: 'Work',
                    });
                    setSelectedContentPost(null);
                    setShowAddModal(true);
                  }}
                  style={{ 
                    flex: 1, 
                    padding: '14px 20px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    border: 'none', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #ec4899, #db2777)', 
                    color: '#fff', 
                    cursor: 'pointer', 
                    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.3)',
                  }}
                >
                  Add to My Calendar
                </button>
                <button
                  onClick={() => setSelectedContentPost(null)}
                  style={{ 
                    padding: '14px 20px', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    border: '1px solid #2D2D2D', 
                    borderRadius: '12px', 
                    background: '#1A1A1A', 
                    color: '#E4E4E7', 
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add To-Do Modal */}
      <AnimatePresence>
        {showAddTodoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddTodoModal(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '24px',
            }}
          >
            <motion.div
              {...scaleIn}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#1A1A1A',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '480px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '24px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <ListBulletIcon style={{ width: '20px', height: '20px', color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#065f46', margin: 0 }}>
                    Add To-Do
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddTodoModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    color: '#065f46',
                  }}
                >
                  <XMarkIcon style={{ width: '18px', height: '18px' }} />
                </motion.button>
              </div>

              {/* Form */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Task Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={todoForm.task_name || ''}
                    onChange={(e) => setTodoForm({ ...todoForm, task_name: e.target.value })}
                    placeholder="What do you need to do?"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '15px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Date Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={todoForm.start_date || ''}
                      onChange={(e) => setTodoForm({ ...todoForm, start_date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={todoForm.deadline || ''}
                      onChange={(e) => setTodoForm({ ...todoForm, deadline: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                    Duration (hours to complete)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={todoForm.duration || 1}
                    onChange={(e) => setTodoForm({ ...todoForm, duration: parseFloat(e.target.value) || 1 })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                    Priority
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {([
                      { value: 'urgent', label: 'Urgent', color: '#dc2626', bg: '#fef2f2' },
                      { value: 'important', label: 'Important', color: '#d97706', bg: '#fef3c7' },
                      { value: 'normal', label: 'Normal', color: '#10b981', bg: '#ecfdf5' },
                    ] as const).map((p) => (
                      <motion.button
                        key={p.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTodoForm({ ...todoForm, priority: p.value })}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: todoForm.priority === p.value ? `2px solid ${p.color}` : '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '10px',
                          background: todoForm.priority === p.value ? p.bg : '#fff',
                          color: todoForm.priority === p.value ? p.color : '#6b7280',
                          cursor: 'pointer',
                        }}
                      >
                        {p.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#E4E4E7', marginBottom: '8px' }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={todoForm.description || ''}
                    onChange={(e) => setTodoForm({ ...todoForm, description: e.target.value })}
                    placeholder="Add any notes or details..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0, 0, 0, 0.06)', display: 'flex', gap: '12px' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddTodo}
                  disabled={!todoForm.task_name?.trim()}
                  style={{
                    flex: 1,
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    borderRadius: '12px',
                    background: todoForm.task_name?.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : '#d1d5db',
                    color: '#fff',
                    cursor: todoForm.task_name?.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: todoForm.task_name?.trim() ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  }}
                >
                  Add To-Do
                </motion.button>
                <button
                  onClick={() => setShowAddTodoModal(false)}
                  style={{
                    padding: '14px 20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '1px solid #2D2D2D',
                    borderRadius: '12px',
                    background: '#1A1A1A',
                    color: '#E4E4E7',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      </motion.div>
    </>
  );
}
