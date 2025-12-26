'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
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
  type: 'focus' | 'meeting' | 'personal';
  checklist: ChecklistItem[];
  meetingLink?: string;
  notificationTime?: number; // minutes before
  color?: string;
  created_at?: string;
  updated_at?: string;
}

type ViewMode = 'day' | 'week' | 'month';

// Color palette for block types
const blockTypeColors = {
  focus: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.2)', text: '#3b82f6', solid: '#3b82f6' },
  meeting: { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)', text: '#a855f7', solid: '#a855f7' },
  personal: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.2)', text: '#22c55e', solid: '#22c55e' },
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

// Database column mapping (snake_case <-> camelCase)
interface DbTimeBlock {
  id: string;
  user_id?: string | number;
  date: string;
  start_time: string;
  end_time: string;
  title: string;
  description?: string;
  type: 'focus' | 'meeting' | 'personal';
  checklist: ChecklistItem[];
  meeting_link?: string;
  notification_time?: number;
  color?: string;
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
  });

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
    return blocks.filter(block => block.date === formatDate(date));
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fafafa 0%, #f5f5f7 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif',
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
                  <div style={{ position: 'relative' }}>
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
                    
                    {/* Time Blocks */}
                    {getBlocksForDate(currentDate).map((block) => {
                      const { top, height } = getBlockPosition(block);
                      const colors = blockTypeColors[block.type];
                      
                      return (
                        <motion.div
                          key={block.id}
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
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {block.type === 'focus' && <SparklesIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'meeting' && <VideoCameraIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            {block.type === 'personal' && <UserIcon style={{ width: '14px', height: '14px', color: colors.text }} />}
                            <span
                  style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#1d1d1f',
                              }}
                            >
                              {block.title}
                            </span>
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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '4px',
                                fontSize: '11px',
                                color: '#86868b',
                              }}
                            >
                              <ListBulletIcon style={{ width: '12px', height: '12px' }} />
                              {block.checklist.filter(i => i.completed).length}/{block.checklist.length}
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
                      gridTemplateColumns: '80px repeat(7, 1fr)',
                      minHeight: '600px',
                    }}
                  >
                    <div style={{ borderRight: '1px solid rgba(0, 0, 0, 0.04)' }}>
                      {hours.slice(6, 22).map((hour) => (
                        <div
                          key={hour}
                          style={{
                            height: '37.5px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            color: '#86868b',
                            textAlign: 'right',
                            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                          }}
                        >
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
                      ))}
          </div>
                    {getWeekDays(currentDate).map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                          style={{ 
                          borderLeft: '1px solid rgba(0, 0, 0, 0.04)',
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode('day');
                        }}
                      >
                        {hours.slice(6, 22).map((hour) => (
                          <div
                            key={hour}
                            style={{
                              height: '37.5px',
                              borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                            }}
                          />
                        ))}
                        
                        {/* Blocks for this day */}
                        {getBlocksForDate(day).map((block) => {
                          const [startHour] = block.startTime.split(':').map(Number);
                          const [endHour] = block.endTime.split(':').map(Number);
                          if (startHour < 6 || startHour >= 22) return null;
                          
                          const top = (startHour - 6) * 37.5;
                          const height = Math.max((endHour - startHour) * 37.5, 20);
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
                                left: '4px',
                                right: '4px',
                                height: `${height}px`,
                                background: colors.bg,
                                borderLeft: `2px solid ${colors.solid}`,
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                fontSize: '10px',
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
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['focus', 'meeting', 'personal'] as const).map((type) => {
                      const colors = blockTypeColors[type];
                      const icons = {
                        focus: SparklesIcon,
                        meeting: VideoCameraIcon,
                        personal: UserIcon,
                      };
                      const Icon = icons[type];
                      
                      return (
                        <motion.button
                          key={type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setBlockForm({ ...blockForm, type })}
                      style={{
                            flex: 1,
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            border: blockForm.type === type ? `2px solid ${colors.solid}` : '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '12px',
                            background: blockForm.type === type ? colors.bg : '#fff',
                    cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <Icon style={{ width: '20px', height: '20px', color: colors.text }} />
                          <span
                            style={{
                              fontSize: '12px',
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

      {/* Side Panel for Block Details */}
      <AnimatePresence>
        {showPanel && selectedBlock && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPanel(false)}
        style={{ 
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.2)',
                zIndex: 200,
              }}
            />
            <motion.div
              {...slideIn}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '420px',
                maxWidth: '100%',
                background: '#fff',
                boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.1)',
                zIndex: 300,
                display: 'flex',
                flexDirection: 'column',
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
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
