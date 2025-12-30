'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  isElectron,
  showNotification,
  showTaskReminder,
  showMeetingReminder,
  notificationScheduler,
  requestNotificationPermission
} from '@/lib/electron-notifications';

interface Task {
  id: string;
  title: string;
  due_date?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  meeting_link?: string;
}

interface UseNotificationsOptions {
  tasks?: Task[];
  meetings?: Meeting[];
  taskReminderMinutes?: number;
  meetingReminderMinutes?: number;
  enabled?: boolean;
}

/**
 * Hook to manage desktop notifications for tasks and meetings
 * Works in both Electron and web browsers
 */
export function useNotifications({
  tasks = [],
  meetings = [],
  taskReminderMinutes = 15,
  meetingReminderMinutes = 10,
  enabled = true
}: UseNotificationsOptions = {}) {
  const scheduledTasks = useRef<Set<string>>(new Set());
  const scheduledMeetings = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if (!initialized.current) {
      requestNotificationPermission();
      initialized.current = true;
    }
  }, []);

  // Schedule task reminders
  useEffect(() => {
    if (!enabled) return;

    tasks.forEach(task => {
      if (task.due_date && !scheduledTasks.current.has(task.id)) {
        const dueDate = new Date(task.due_date);
        const now = new Date();
        
        // Only schedule future reminders
        if (dueDate > now) {
          notificationScheduler.scheduleTaskReminder(
            {
              id: task.id,
              title: task.title,
              dueDate: task.due_date
            },
            taskReminderMinutes
          );
          scheduledTasks.current.add(task.id);
        }
      }
    });

    // Cleanup removed tasks
    const taskIds = new Set(tasks.map(t => t.id));
    scheduledTasks.current.forEach(id => {
      if (!taskIds.has(id)) {
        notificationScheduler.cancelReminder(id);
        scheduledTasks.current.delete(id);
      }
    });
  }, [tasks, taskReminderMinutes, enabled]);

  // Schedule meeting reminders
  useEffect(() => {
    if (!enabled) return;

    meetings.forEach(meeting => {
      if (meeting.start_time && !scheduledMeetings.current.has(meeting.id)) {
        const startTime = new Date(meeting.start_time);
        const now = new Date();
        
        // Only schedule future reminders
        if (startTime > now) {
          notificationScheduler.scheduleMeetingReminder(
            {
              id: meeting.id,
              title: meeting.title,
              startTime: meeting.start_time
            },
            meetingReminderMinutes
          );
          scheduledMeetings.current.add(meeting.id);
        }
      }
    });

    // Cleanup removed meetings
    const meetingIds = new Set(meetings.map(m => m.id));
    scheduledMeetings.current.forEach(id => {
      if (!meetingIds.has(id)) {
        notificationScheduler.cancelReminder(id);
        scheduledMeetings.current.delete(id);
      }
    });
  }, [meetings, meetingReminderMinutes, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationScheduler.cancelAll();
      scheduledTasks.current.clear();
      scheduledMeetings.current.clear();
    };
  }, []);

  /**
   * Manually show a notification
   */
  const notify = useCallback(async (title: string, body: string, options?: {
    silent?: boolean;
    urgency?: 'low' | 'normal' | 'critical';
    url?: string;
  }) => {
    if (!enabled) return;
    await showNotification(title, body, options);
  }, [enabled]);

  /**
   * Show an immediate task reminder
   */
  const notifyTask = useCallback(async (task: Task) => {
    if (!enabled) return;
    await showTaskReminder({
      id: task.id,
      title: task.title,
      dueDate: task.due_date || new Date().toISOString()
    });
  }, [enabled]);

  /**
   * Show an immediate meeting reminder
   */
  const notifyMeeting = useCallback(async (meeting: Meeting, minutesUntil: number = 5) => {
    if (!enabled) return;
    await showMeetingReminder({
      id: meeting.id,
      title: meeting.title,
      startTime: meeting.start_time,
      minutesUntil
    });
  }, [enabled]);

  /**
   * Cancel all scheduled reminders
   */
  const cancelAll = useCallback(() => {
    notificationScheduler.cancelAll();
    scheduledTasks.current.clear();
    scheduledMeetings.current.clear();
  }, []);

  return {
    notify,
    notifyTask,
    notifyMeeting,
    cancelAll,
    isElectron: isElectron(),
    scheduledTaskCount: scheduledTasks.current.size,
    scheduledMeetingCount: scheduledMeetings.current.size
  };
}

export default useNotifications;

