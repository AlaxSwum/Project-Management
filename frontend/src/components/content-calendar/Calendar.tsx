'use client';

import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { CalendarPost, Platform, STATUS_CONFIG, PLATFORM_CONFIG } from '@/types/content-calendar';

interface CalendarProps {
  currentMonth: Date;
  posts: CalendarPost[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectPost: (postId: number) => void;
  onSelectDate: (date: Date) => void;
  selectedPostId?: number | null;
}

export default function Calendar({
  currentMonth,
  posts,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectPost,
  onSelectDate,
  selectedPostId
}: CalendarProps) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
    
    // Add days from previous month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isToday: false });
    }
    
    // Add days of current month
    const today = new Date();
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      days.push({ date, isCurrentMonth: true, isToday });
    }
    
    // Add days from next month
    const remainingDays = 42 - days.length; // 6 weeks
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false });
    }
    
    return days;
  }, [currentMonth]);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const grouped: Record<string, CalendarPost[]> = {};
    posts.forEach(post => {
      const dateKey = new Date(post.planned_publish_at).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    });
    return grouped;
  }, [posts]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full flex flex-col bg-[#1A1A1A] rounded-xl shadow-sm border border-[#2D2D2D]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D]">
        <h2 className="text-xl font-semibold text-white">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm font-medium text-[#A1A1AA] hover:bg-[#1F1F1F] rounded-lg transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-[#2D2D2D] rounded-lg">
            <button
              onClick={onPreviousMonth}
              className="p-2 hover:bg-[#1F1F1F] rounded-l-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-[#A1A1AA]" />
            </button>
            <button
              onClick={onNextMonth}
              className="p-2 hover:bg-[#1F1F1F] rounded-r-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-[#A1A1AA]" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-[#2D2D2D]">
        {weekDays.map(day => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-medium text-[#71717A]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {calendarDays.map((day, index) => {
          const dateKey = day.date.toDateString();
          const dayPosts = postsByDate[dateKey] || [];
          
          return (
            <div
              key={index}
              onClick={() => onSelectDate(day.date)}
              className={`
                min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer
                transition-colors hover:bg-[#141414]
                ${!day.isCurrentMonth ? 'bg-[#141414]' : 'bg-[#1A1A1A]'}
              `}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${day.isToday ? 'bg-blue-600 text-white' : ''}
                    ${!day.isCurrentMonth ? 'text-[#52525B]' : 'text-white'}
                  `}
                >
                  {day.date.getDate()}
                </span>
                {dayPosts.length > 3 && (
                  <span className="text-xs text-[#71717A]">+{dayPosts.length - 3}</span>
                )}
              </div>

              {/* Posts */}
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => (
                  <CalendarPostItem
                    key={post.post_id}
                    post={post}
                    isSelected={post.post_id === selectedPostId}
                    onClick={() => onSelectPost(post.post_id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Calendar Post Item Component
function CalendarPostItem({ 
  post, 
  isSelected, 
  onClick 
}: { 
  post: CalendarPost; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = STATUS_CONFIG[post.status];
  
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        group px-2 py-1 rounded text-xs cursor-pointer transition-all
        ${isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-1' 
          : 'hover:ring-1 hover:ring-gray-300'
        }
      `}
      style={{ 
        backgroundColor: statusConfig.bgColor,
        borderLeft: `3px solid ${statusConfig.color}`
      }}
    >
      <div className="flex items-center gap-1.5">
        {/* Platform Icons */}
        <div className="flex -space-x-1">
          {post.platforms.slice(0, 2).map((platform, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: PLATFORM_CONFIG[platform]?.color || '#6B7280' }}
              title={PLATFORM_CONFIG[platform]?.name}
            >
              <span className="text-[8px] font-bold">
                {platform.charAt(0).toUpperCase()}
              </span>
            </div>
          ))}
          {post.platforms.length > 2 && (
            <div className="w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center text-white text-[8px]">
              +{post.platforms.length - 2}
            </div>
          )}
        </div>
        
        {/* Title */}
        <span className="truncate text-[#A1A1AA] font-medium flex-1">
          {post.title}
        </span>
      </div>
    </div>
  );
}

// Platform Badge Component
export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: config.color }}
    >
      {config.name}
    </span>
  );
}

// Status Badge Component
export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.idea;
  
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ 
        backgroundColor: config.bgColor,
        color: config.color
      }}
    >
      {config.label}
    </span>
  );
}
