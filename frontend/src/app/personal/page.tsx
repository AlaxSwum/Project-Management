'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
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
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

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
  focus: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', solid: '#3b82f6' },
  meeting: { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)', text: '#a855f7', solid: '#a855f7' },
  personal: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', solid: '#22c55e' },
  goal: { bg: 'rgba(251, 146, 60, 0.08)', border: 'rgba(251, 146, 60, 0.2)', text: '#fb923c', solid: '#fb923c' },
  project: { bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)', text: '#ec4899', solid: '#ec4899' },
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
  const diff = date.getDate() - day;
  const days: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    days.push(new Date(date.getFullYear(), date.getMonth(), diff + i));
  }
  
  return days;
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Calculate checklist completion percentage
const getChecklistProgress = (checklist: ChecklistItem[]): number => {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.completed).length;
  return Math.round((completed / checklist.length) * 100);
};

// Calculate daily progress across all blocks
const getDailyProgress = (blocks: TimeBlock[], date: Date): { total: number; completed: number; percentage: number } => {
  const dateStr = formatDate(date);
  const dayBlocks = blocks.filter(b => b.date === dateStr);
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  dayBlocks.forEach(block => {
    if (block.checklist && block.checklist.length > 0) {
      totalTasks += block.checklist.length;
      completedTasks += block.checklist.filter(item => item.completed).length;
        } else {
      // Count blocks without checklists as single tasks
      totalTasks += 1;
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
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  
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
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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

  // Convert Y position to time
  const getTimeFromY = (y: number, containerTop: number): { hour: number; minute: number } => {
    const relativeY = y - containerTop;
    const hourHeight = 60; // 60px per hour
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
          const hourHeight = 30; // 30px per hour in week view
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

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push('/login');
        return;
      }
    fetchBlocks();
  }, [isAuthenticated, authLoading, router, user]);

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
      
      const { error } = await supabase
        .from('time_blocks')
        .upsert(dbRecord);

      if (error) {
        console.log('Database save error, using localStorage:', error.message);
        return;
      }

      // Refresh from database
      await fetchBlocks();
    } catch (err) {
      console.error('Error saving block:', err);
    }
  };

  const deleteBlock = async (blockId: string) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      await supabase
        .from('time_blocks')
        .delete()
        .eq('id', blockId);
      
      const newBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(newBlocks);
      localStorage.setItem('timeBlocks', JSON.stringify(newBlocks));
      setShowPanel(false);
      setSelectedBlock(null);
    } catch (err) {
      console.error('Error deleting block:', err);
      const newBlocks = blocks.filter(b => b.id !== blockId);
      setBlocks(newBlocks);
      localStorage.setItem('timeBlocks', JSON.stringify(newBlocks));
      setShowPanel(false);
      setSelectedBlock(null);
    }
  };

  const handleAddBlock = () => {
    const newBlock: TimeBlock = {
      id: generateId(),
      date: formatDate(currentDate),
      startTime: blockForm.startTime || '09:00',
      endTime: blockForm.endTime || '10:00',
      title: blockForm.title || 'New Block',
      description: blockForm.description,
      type: blockForm.type || 'focus',
      checklist: blockForm.checklist || [],
      meetingLink: blockForm.meetingLink,
      notificationTime: blockForm.notificationTime,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    saveBlock(newBlock);
    setShowAddModal(false);
    setBlockForm({
      title: '',
      description: '',
      type: 'focus',
      startTime: '09:00',
      endTime: '10:00',
      checklist: [],
      meetingLink: '',
      notificationTime: 10,
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

  const getBlocksForDate = (date: Date): TimeBlock[] => {
    const dateStr = formatDate(date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return blocks.filter(block => {
      // Exact date match
      if (block.date === dateStr) return true;
      
      // Check for recurring blocks
      if (block.isRecurring && block.recurringDays && block.recurringDays.length > 0) {
        // Check if this day of week is selected
        if (!block.recurringDays.includes(dayOfWeek)) return false;
        
        // Check if within date range (if specified)
        const blockStartDate = new Date(block.recurringStartDate || block.date);
        const blockEndDate = block.recurringEndDate ? new Date(block.recurringEndDate) : null;
        
        // Date must be >= start date
        if (date < blockStartDate) return false;
        
        // Date must be <= end date (if end date is specified)
        if (blockEndDate && date > blockEndDate) return false;
        
        return true;
      }
      
      return false;
    });
  };

  const getBlockPosition = (block: TimeBlock): { top: number; height: number } => {
    const [startHour, startMin] = block.startTime.split(':').map(Number);
    const [endHour, endMin] = block.endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    
    return {
      top: (startMinutes / 60) * 60 + 40, // 60px per hour + header offset
      height: Math.max((duration / 60) * 60, 30), // minimum 30px
    };
  };

  if (!isAuthenticated) return null;

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return (
    <>
      {/* Sidebar - only on desktop */}
      {!isMobile && (
        <Sidebar 
          projects={[]} 
          onCreateProject={() => {}} 
        />
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="main-content"
        style={{
          minHeight: '100vh',
          marginLeft: isMobile ? '0' : '280px',
          background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
          transition: 'margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* Header */}
        <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          padding: '24px 40px',
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: '28px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  letterSpacing: '-0.02em',
                  margin: 0,
                }}
              >
                Focus
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                style={{
                  fontSize: '15px',
                  color: '#86868b',
                  margin: '4px 0 0 0',
                  fontWeight: '400',
                }}
              >
                Plan your time. Achieve your goals.
              </motion.p>
              
              {/* Daily Progress Tracker */}
              {(() => {
                const progress = getDailyProgress(blocks, currentDate);
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{
                      marginTop: '16px',
          display: 'flex',
          alignItems: 'center',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1, maxWidth: '200px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: '#86868b' }}>
                          Today&apos;s Progress
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: progress.percentage >= 100 ? '#34c759' : '#1d1d1f' }}>
                          {progress.percentage}%
                        </span>
              </div>
                      <div
                        style={{
                          height: '6px',
                          background: 'rgba(0, 0, 0, 0.06)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percentage}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                          style={{
                            height: '100%',
                            background: progress.percentage >= 100 
                              ? 'linear-gradient(90deg, #34c759, #30d158)' 
                              : progress.percentage >= 50 
                                ? 'linear-gradient(90deg, #ff9f0a, #ff9500)'
                                : 'linear-gradient(90deg, #0071e3, #5ac8fa)',
                            borderRadius: '3px',
                          }}
                        />
              </div>
              </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircleIconSolid 
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          color: progress.percentage >= 100 ? '#34c759' : '#86868b' 
                        }} 
                      />
                      <span style={{ fontSize: '13px', color: '#86868b' }}>
                        {progress.completed}/{progress.total} tasks
                      </span>
                </div>
                  </motion.div>
                );
              })()}
              </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* View Mode Switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: '10px',
                  padding: '4px',
                }}
              >
                {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                  <motion.button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
              style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: '500',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: viewMode === mode ? '#fff' : 'transparent',
                      color: viewMode === mode ? '#1d1d1f' : '#86868b',
                      boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {mode}
                  </motion.button>
                ))}
          </div>
              
              {/* Add Block Button */}
              <motion.button
                onClick={() => setShowAddModal(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: '#0071e3',
                  color: '#fff',
                  transition: 'all 0.2s ease',
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
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
              marginTop: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <motion.button
                onClick={() => navigate('prev')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '36px',
                  height: '36px',
              display: 'flex', 
            alignItems: 'center', 
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  color: '#1d1d1f',
                }}
              >
                <ChevronLeftIcon style={{ width: '18px', height: '18px' }} />
              </motion.button>
              
              <motion.h2
                key={currentDate.toISOString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1d1d1f',
                  margin: 0,
                  minWidth: '200px',
                  textAlign: 'center',
                }}
              >
                {viewMode === 'day' && (
                  <>
                    {weekDays[currentDate.getDay()]}, {monthNames[currentDate.getMonth()]} {currentDate.getDate()}
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer',
                  color: '#1d1d1f',
                }}
              >
                <ChevronRightIcon style={{ width: '18px', height: '18px' }} />
              </motion.button>
            </div>

            <motion.button
              onClick={() => setCurrentDate(new Date())}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '500',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
                background: '#fff',
                cursor: 'pointer',
                color: '#1d1d1f',
              }}
            >
              Today
            </motion.button>
              </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main style={{ padding: '32px 40px', maxWidth: '1400px', margin: '0 auto' }}>
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
            <>
              {/* Day View */}
              {viewMode === 'day' && (
                <motion.div
                  key="day"
                  {...fadeInUp}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
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
                          borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                          minHeight: '60px',
                        }}
                      >
                        <div
                          style={{
                            width: '80px',
                            padding: '8px 16px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#86868b',
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
                            borderLeft: '1px solid rgba(0, 0, 0, 0.04)',
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
                    {getBlocksForDate(currentDate).map((block) => {
                      const { top, height } = getBlockPosition(block);
                      const colors = blockTypeColors[block.type] || blockTypeColors.focus;
                      const progress = getChecklistProgress(block.checklist);
                      const category = [...DEFAULT_CATEGORIES, ...customCategories].find(c => c.id === block.category);
                      
                      return (
                        <motion.div
                          key={block.id}
                          data-block="true"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.01, zIndex: 10 }}
                          onClick={() => handleBlockClick(block)}
                          style={{
                            position: 'absolute',
                            top: `${top}px`,
                            left: '96px',
                            right: '16px',
                            height: `${height}px`,
                            background: colors.bg,
                            borderLeft: `3px solid ${colors.solid}`,
                            borderRadius: '8px',
                            padding: '8px 12px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            zIndex: 2,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {block.type === 'focus' && <SparklesIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'meeting' && <VideoCameraIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'personal' && <UserIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'goal' && <FlagIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'project' && <FolderIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1d1d1f',
                                flex: 1,
                              }}
                            >
                              {block.title}
                            </span>
                            {category && (
                              <div 
                                style={{ 
                                  width: '8px', 
                                  height: '8px', 
                                  borderRadius: '50%', 
                                  background: category.color,
                                  flexShrink: 0,
                                }} 
                                title={category.name}
                              />
                            )}
                            {block.isRecurring && (
                              <ArrowPathIcon style={{ width: '12px', height: '12px', color: '#86868b' }} />
              )}
            </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#86868b',
                              marginTop: '4px',
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
                        </motion.div>
                      );
                    })}
            </div>
                </motion.div>
              )}

              {/* Week View */}
              {viewMode === 'week' && (
                <motion.div
                  key="week"
                  {...fadeInUp}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Week Header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px repeat(7, 1fr)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                    }}
                  >
                    <div style={{ padding: '16px' }} />
                    {getWeekDays(currentDate).map((day, index) => {
                      const isToday = formatDate(day) === formatDate(new Date());
                      return (
                        <div
                          key={index}
                style={{
                            padding: '16px',
                            textAlign: 'center',
                            borderLeft: '1px solid rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: '500',
                              color: '#86868b',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}
                          >
                            {weekDays[day.getDay()]}
                          </div>
                          <div
                            style={{
                              fontSize: '24px',
                  fontWeight: '600',
                              color: isToday ? '#fff' : '#1d1d1f',
                              background: isToday ? '#0071e3' : 'transparent',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              margin: '8px auto 0',
                            }}
                          >
                            {day.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Week Grid */}
                  <div
                    style={{ 
                      display: 'grid',
                      gridTemplateColumns: '60px repeat(7, 1fr)',
                      minHeight: '720px',
                      maxHeight: '720px',
                      overflow: 'auto',
                    }}
                  >
                    {/* Time labels column */}
                    <div style={{ borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          style={{
                            height: '30px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            color: '#86868b',
                            textAlign: 'right',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                      ))}
                    </div>
                    
                    {/* Day columns with drag-to-create */}
                    {getWeekDays(currentDate).map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        ref={(el) => { weekViewRefs.current[dayIndex] = el; }}
                        style={{ 
                          borderLeft: '1px solid rgba(0, 0, 0, 0.04)',
                          position: 'relative',
                          cursor: isDragging ? 'ns-resize' : 'crosshair',
                        }}
                        onMouseDown={(e) => {
                          const rect = weekViewRefs.current[dayIndex]?.getBoundingClientRect();
                          if (!rect) return;
                          const relativeY = e.clientY - rect.top;
                          const hourHeight = 30;
                          const totalMinutes = Math.max(0, Math.min(24 * 60 - 1, (relativeY / hourHeight) * 60));
                          const hour = Math.floor(totalMinutes / 60);
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
                        {hours.map((hour) => (
                          <div
                            key={hour}
                            style={{
                              height: '30px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                            }}
                          />
                        ))}
                        
                        {/* Drag preview for this day */}
                        {isDragging && dragDate && formatDate(dragDate) === formatDate(day) && dragStart && dragEnd && (() => {
                          const startMinutes = dragStart.hour * 60 + dragStart.minute;
                          const endMinutes = dragEnd.hour * 60 + dragEnd.minute;
                          const top = Math.min(startMinutes, endMinutes) / 2;
                          const height = Math.max(Math.abs(endMinutes - startMinutes) / 2, 15);
                          return (
                            <div
                              style={{
                                position: 'absolute',
                                top: `${top}px`,
                                left: '2px',
                                right: '2px',
                                height: `${height}px`,
                                background: 'rgba(0, 113, 227, 0.2)',
                                border: '2px dashed #0071e3',
                                borderRadius: '4px',
                                pointerEvents: 'none',
                              }}
                            />
                          );
                        })()}
                        
                        {/* Blocks for this day */}
                        {getBlocksForDate(day).map((block) => {
                          const [startHour, startMin] = block.startTime.split(':').map(Number);
                          const [endHour, endMin] = block.endTime.split(':').map(Number);
                          
                          const top = (startHour * 60 + startMin) / 2; // 30px per hour = 0.5px per minute
                          const height = Math.max(((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 2, 15);
                          const colors = blockTypeColors[block.type];
                          
                          return (
                            <motion.div
                              key={block.id}
                              whileHover={{ scale: 1.02 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBlockClick(block);
                              }}
                              style={{
                                position: 'absolute',
                                top: `${top}px`,
                                left: '2px',
                                right: '2px',
                                height: `${height}px`,
                                background: colors.bg,
                                borderLeft: `2px solid ${colors.solid}`,
                                borderRadius: '4px',
                                padding: '2px 4px',
                                cursor: 'pointer',
                                fontSize: '9px',
                                fontWeight: '500',
                                color: '#1d1d1f',
                                overflow: 'hidden',
                              }}
                            >
                              {block.title}
                            </motion.div>
                          );
                        })}
                    </div>
                  ))}
                    </div>
                </motion.div>
              )}

              {/* Month View */}
              {viewMode === 'month' && (
                <motion.div
                  key="month"
                  {...fadeInUp}
                  transition={{ duration: 0.4 }}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Month Header */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
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
                          color: '#86868b',
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
                          whileHover={{ background: 'rgba(0, 0, 0, 0.02)' }}
                          onClick={() => {
                            setCurrentDate(day);
                            setViewMode('day');
                          }}
                          style={{
                            minHeight: '100px',
                            padding: '8px',
                            borderRight: (index + 1) % 7 !== 0 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer',
                            opacity: isCurrentMonth ? 1 : 0.4,
                          }}
                        >
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: isToday ? '#fff' : '#1d1d1f',
                              background: isToday ? '#0071e3' : 'transparent',
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
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  marginBottom: '2px',
                                  background: colors.bg,
                                  borderLeft: `2px solid ${colors.solid}`,
                                  borderRadius: '3px',
                                  color: '#1d1d1f',
                                  fontWeight: '500',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {block.title}
                              </div>
                            );
                          })}
                          
                          {dayBlocks.length > 3 && (
                            <div
                        style={{ 
                                fontSize: '10px',
                                color: '#86868b',
                                fontWeight: '500',
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
            </>
          )}
        </AnimatePresence>
      </main>

      {/* Add Block Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAddModal(false)}
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
                background: '#fff',
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
                    color: '#1d1d1f',
                    margin: 0,
                  }}
                >
                  New Time Block
              </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)}
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
            
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            border: blockForm.type === type ? `2px solid ${colors.solid}` : '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                            background: blockForm.type === type ? colors.bg : '#fff',
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
                            background: blockForm.category === cat.id ? `${cat.color}15` : '#fff',
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
                          background: '#fff',
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
                      background: '#fff',
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
                          background: '#fff',
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
                                    background: isSelected ? '#0071e3' : 'rgba(0, 0, 0, 0.05)',
                                    color: isSelected ? '#fff' : '#86868b',
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
                  onClick={() => setShowAddModal(false)}
                    style={{ 
                    flex: 1,
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '500',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                    background: '#fff',
                        cursor: 'pointer',
                    color: '#1d1d1f',
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
                  Create Block
                </motion.button>
                    </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block Details Popup Modal */}
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
              {...scaleIn}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Panel Header */}
              <div
                  style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{ 
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: blockTypeColors[selectedBlock.type].bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {selectedBlock.type === 'focus' && <SparklesIcon style={{ width: '18px', height: '18px', color: blockTypeColors.focus.text }} />}
                    {selectedBlock.type === 'meeting' && <VideoCameraIcon style={{ width: '18px', height: '18px', color: blockTypeColors.meeting.text }} />}
                    {selectedBlock.type === 'personal' && <UserIcon style={{ width: '18px', height: '18px', color: blockTypeColors.personal.text }} />}
                    {selectedBlock.type === 'goal' && <FlagIcon style={{ width: '18px', height: '18px', color: blockTypeColors.goal.text }} />}
                    {selectedBlock.type === 'project' && <FolderIcon style={{ width: '18px', height: '18px', color: blockTypeColors.project.text }} />}
                  </div>
                  <span
                    style={{ 
                      fontSize: '12px',
                      fontWeight: '600', 
                      color: blockTypeColors[selectedBlock.type].text,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {selectedBlock.type}
                  </span>
                  </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => deleteBlock(selectedBlock.id)}
                    style={{
                      width: '36px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: 'none',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      cursor: 'pointer',
                      color: '#ef4444',
                    }}
                  >
                    <TrashIcon style={{ width: '18px', height: '18px' }} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPanel(false)}
                    style={{
                      width: '36px',
                      height: '36px',
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
      </div>
      
              {/* Panel Content */}
              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                {/* Title */}
                <input
                  type="text"
                  value={blockForm.title}
                  onChange={(e) => {
                    setBlockForm({ ...blockForm, title: e.target.value });
                  }}
                  onBlur={handleUpdateBlock}
                  style={{
                    width: '100%',
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#1d1d1f',
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    marginBottom: '16px',
                  }}
                />
                
                {/* Time */}
                <div
              style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    color: '#86868b',
                    fontSize: '14px',
                  }}
                >
                  <ClockIcon style={{ width: '18px', height: '18px' }} />
                  <span>
                    {formatTime(selectedBlock.startTime)} - {formatTime(selectedBlock.endTime)}
                  </span>
                  <span>•</span>
                  <span>{new Date(selectedBlock.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              
                {/* Meeting Link */}
                {selectedBlock.type === 'meeting' && (
                  <div style={{ marginBottom: '24px' }}>
                    <label
                  style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                    fontWeight: '500',
                        color: '#86868b',
                        marginBottom: '8px',
                      }}
                    >
                      <LinkIcon style={{ width: '14px', height: '14px' }} />
                      Meeting Link
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="url"
                        value={blockForm.meetingLink || ''}
                        onChange={(e) => setBlockForm({ ...blockForm, meetingLink: e.target.value })}
                        onBlur={handleUpdateBlock}
                        placeholder="Add meeting link..."
                    style={{
                          flex: 1,
                          padding: '10px 14px',
                          fontSize: '14px',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                          borderRadius: '8px',
                          outline: 'none',
                        }}
                      />
                      {selectedBlock.meetingLink && (
                        <motion.a
                          href={selectedBlock.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            padding: '10px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                      border: 'none',
                            borderRadius: '8px',
                            background: '#0071e3',
                            color: '#fff',
                            textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <VideoCameraIcon style={{ width: '16px', height: '16px' }} />
                          Join
                        </motion.a>
              )}
            </div>
      </div>
      )}
                
                {/* Description */}
                <div style={{ marginBottom: '24px' }}>
                  <label
              style={{
                      display: 'block',
                      fontSize: '13px',
                  fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '8px',
                    }}
                  >
                    Notes
                  </label>
                  <textarea
                    value={blockForm.description || ''}
                    onChange={(e) => setBlockForm({ ...blockForm, description: e.target.value })}
                    onBlur={handleUpdateBlock}
                    placeholder="Add notes..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: '14px',
                      border: '1px solid rgba(0, 0, 0, 0.1)',
                      borderRadius: '10px',
                      outline: 'none',
                      resize: 'none',
                      lineHeight: '1.6',
                    }}
                  />
                </div>
                
                {/* Checklist */}
                <div>
                  <label
                  style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                    fontWeight: '500',
                      color: '#86868b',
                      marginBottom: '12px',
                    }}
                  >
                    <ListBulletIcon style={{ width: '14px', height: '14px' }} />
                    Checklist
                    {selectedBlock.checklist.length > 0 && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#22c55e',
                          fontWeight: '600',
                        }}
                      >
                        {selectedBlock.checklist.filter(i => i.completed).length}/{selectedBlock.checklist.length}
                      </span>
                    )}
                  </label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedBlock.checklist.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                  display: 'flex',
                  alignItems: 'center',
                gap: '12px',
                          padding: '10px 12px',
                          background: item.completed ? 'rgba(34, 197, 94, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                        }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleChecklistItem(item.id)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '6px',
                            border: item.completed ? 'none' : '2px solid rgba(0, 0, 0, 0.15)',
                            background: item.completed ? '#22c55e' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}
                        >
                          {item.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', damping: 15 }}
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
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {item.text}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeChecklistItem(item.id)}
                          style={{
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            borderRadius: '6px',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#86868b',
                            opacity: 0.5,
                          }}
                        >
                          <XMarkIcon style={{ width: '14px', height: '14px' }} />
                        </motion.button>
                      </motion.div>
                    ))}
                    
                    {/* Add new item */}
                    <div
                            style={{
                              display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                      }}
                    >
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '6px',
                          border: '2px dashed rgba(0, 0, 0, 0.1)',
                          flexShrink: 0,
                        }}
                      />
                            <input
                        type="text"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            addChecklistItem();
                          }
                        }}
                        placeholder="Add an item..."
                              style={{
                          flex: 1,
                          fontSize: '14px',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          color: '#1d1d1f',
                        }}
                      />
                      {newChecklistItem && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={addChecklistItem}
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            border: 'none',
                            borderRadius: '6px',
                            background: '#0071e3',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          Add
                        </motion.button>
                              )}
                            </div>
                          </div>
        </div>
      </div>
      
              {/* Notification Settings */}
              <div
              style={{ 
                  padding: '16px 24px',
                  borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <BellIcon style={{ width: '18px', height: '18px', color: '#86868b' }} />
                <select
                  value={blockForm.notificationTime || 0}
                  onChange={(e) => {
                    setBlockForm({ ...blockForm, notificationTime: Number(e.target.value) });
                    handleUpdateBlock();
                  }}
                  style={{ 
                    flex: 1,
                    padding: '10px 14px',
                    fontSize: '14px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 min before</option>
                  <option value={10}>10 min before</option>
                  <option value={15}>15 min before</option>
                  <option value={30}>30 min before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </>
  );
}
