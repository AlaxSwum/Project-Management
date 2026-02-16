/**
 * Electron Native Notifications Service
 * 
 * This service provides a unified API for notifications that works both
 * in the browser (using Web Notifications) and in Electron (using native notifications)
 */

// Type definitions for the Electron API exposed via preload
declare global {
  interface Window {
    electronAPI?: {
      showNotification: (title: string, body: string, options?: NotificationOptions) => Promise<void>;
      getNotificationStatus: () => Promise<boolean>;
      setNotificationStatus: (enabled: boolean) => Promise<boolean>;
      taskReminder: (task: TaskReminder) => Promise<void>;
      meetingReminder: (meeting: MeetingReminder) => Promise<void>;
      showWindow: () => Promise<void>;
      minimizeToTray: () => Promise<void>;
      navigate: (url: string) => Promise<void>;
      getAppVersion: () => Promise<string>;
      setBadgeCount: (count: number) => Promise<void>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
      onShortcut: (callback: (action: string) => void) => void;
      onNavigate: (callback: (path: string) => void) => void;
      removeAllListeners: (channel: string) => void;
      isElectron: boolean;
      platform: string;
      isMac: boolean;
      isWindows: boolean;
      isLinux: boolean;
    };
    DesktopNotifications?: {
      requestPermission: () => Promise<string>;
      isSupported: () => boolean;
      show: (title: string, options?: { body?: string; silent?: boolean; tag?: string; data?: { url?: string } }) => Promise<void>;
    };
  }
}

interface NotificationOptions {
  silent?: boolean;
  urgency?: 'low' | 'normal' | 'critical';
  url?: string;
}

interface TaskReminder {
  id: string;
  title: string;
  dueDate: string;
}

interface MeetingReminder {
  id: string;
  title: string;
  startTime: string;
  minutesUntil: number;
}

interface AppSettings {
  notifications: boolean;
  startMinimized: boolean;
  launchOnStartup: boolean;
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/**
 * Get the current platform
 */
export function getPlatform(): 'mac' | 'windows' | 'linux' | 'web' {
  if (!isElectron()) return 'web';
  if (window.electronAPI?.isMac) return 'mac';
  if (window.electronAPI?.isWindows) return 'windows';
  if (window.electronAPI?.isLinux) return 'linux';
  return 'web';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isElectron()) {
    // Electron always has permission
    return true;
  }
  
  // Web fallback
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
}

/**
 * Show a native notification
 */
export async function showNotification(
  title: string,
  body: string,
  options: NotificationOptions = {}
): Promise<void> {
  console.log('🔔 showNotification called:', title, body, 'isElectron:', isElectron());
  
  if (isElectron() && window.electronAPI) {
    console.log('🔔 Sending to Electron main process...');
    try {
      await window.electronAPI.showNotification(title, body, options);
      console.log('🔔 Notification sent to Electron');
    } catch (err) {
      console.error('🔔 Error sending notification to Electron:', err);
    }
    return;
  }
  
  // Web fallback - also try to show notification even in non-Electron
  console.log('🔔 Using web notification fallback');
  
  if ('Notification' in window) {
    // Request permission if not granted
    if (Notification.permission === 'default') {
      console.log('🔔 Requesting notification permission...');
      await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
      console.log('🔔 Permission granted, showing web notification');
      const notification = new Notification(title, {
        body,
        silent: options.silent,
        tag: options.urgency === 'critical' ? 'urgent' : undefined,
        icon: '/favicon.png'
      });
      
      if (options.url) {
        notification.onclick = () => {
          window.focus();
          window.location.href = options.url!;
        };
      }
    } else {
      console.log('🔔 Notification permission denied');
    }
  } else {
    console.log('🔔 Notifications not supported in this browser');
  }
}

/**
 * Show a task reminder notification
 */
export async function showTaskReminder(task: TaskReminder): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.taskReminder(task);
    return;
  }
  
  await showNotification('Task Reminder', `${task.title} is due soon!`, {
    urgency: 'critical',
    url: '/my-tasks'
  });
}

/**
 * Show a meeting reminder notification
 */
export async function showMeetingReminder(meeting: MeetingReminder): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.meetingReminder(meeting);
    return;
  }
  
  await showNotification(
    'Meeting Starting Soon',
    `${meeting.title} starts in ${meeting.minutesUntil} minutes`,
    {
      urgency: 'critical',
      url: '/calendar'
    }
  );
}

/**
 * Set the app badge count (macOS dock, Windows taskbar)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.setBadgeCount(count);
  }
}

/**
 * Get app settings
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getSettings();
  }
  return null;
}

/**
 * Update app settings
 */
export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings | null> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.updateSettings(settings);
  }
  return null;
}

/**
 * Get app version
 */
export async function getAppVersion(): Promise<string> {
  if (isElectron() && window.electronAPI) {
    return window.electronAPI.getAppVersion();
  }
  return '1.0.0 (Web)';
}

/**
 * Minimize app to system tray
 */
export async function minimizeToTray(): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.minimizeToTray();
  }
}

/**
 * Show app window
 */
export async function showWindow(): Promise<void> {
  if (isElectron() && window.electronAPI) {
    await window.electronAPI.showWindow();
  }
}

/**
 * Listen for keyboard shortcuts
 */
export function onShortcut(callback: (action: string) => void): () => void {
  if (isElectron() && window.electronAPI) {
    window.electronAPI.onShortcut(callback);
    return () => window.electronAPI?.removeAllListeners('shortcut');
  }
  return () => {};
}

/**
 * Notification scheduler for recurring reminders
 */
class NotificationScheduler {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Schedule a task reminder
   */
  scheduleTaskReminder(task: TaskReminder, minutesBefore: number = 15): void {
    const dueDate = new Date(task.dueDate);
    const reminderTime = new Date(dueDate.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        showTaskReminder(task);
        this.intervals.delete(task.id);
      }, delay);

      this.intervals.set(task.id, timeoutId);
    }
  }

  /**
   * Schedule a meeting reminder
   */
  scheduleMeetingReminder(meeting: Omit<MeetingReminder, 'minutesUntil'>, minutesBefore: number = 10): void {
    const startTime = new Date(meeting.startTime);
    const reminderTime = new Date(startTime.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        showMeetingReminder({ ...meeting, minutesUntil: minutesBefore });
        this.intervals.delete(meeting.id);
      }, delay);

      this.intervals.set(meeting.id, timeoutId);
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelReminder(id: string): void {
    const timeoutId = this.intervals.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.intervals.delete(id);
    }
  }

  /**
   * Cancel all scheduled reminders
   */
  cancelAll(): void {
    this.intervals.forEach((timeoutId) => clearTimeout(timeoutId));
    this.intervals.clear();
  }
}

export const notificationScheduler = new NotificationScheduler();

export default {
  isElectron,
  getPlatform,
  requestNotificationPermission,
  showNotification,
  showTaskReminder,
  showMeetingReminder,
  setBadgeCount,
  getAppSettings,
  updateAppSettings,
  getAppVersion,
  minimizeToTray,
  showWindow,
  onShortcut,
  notificationScheduler
};

