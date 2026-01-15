/**
 * Focus Desktop Application - Preload Script
 * 
 * This script runs in the renderer process before web content loads.
 * It provides a secure bridge between the renderer and main processes
 * using Electron's contextBridge API.
 * 
 * @author Focus Project
 * @version 1.0.0
 * @platform darwin (macOS only)
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Primary API exposed to the renderer process.
 * Provides secure access to Electron functionality.
 */
const electronAPI = {
  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /**
   * Authenticate user with email and password.
   * @param {string} email - User email address
   * @param {string} password - User password
   * @param {boolean} [rememberMe=true] - Persist credentials for future sessions
   * @returns {Promise<{success: boolean, error?: string}>} Authentication result
   */
  login: (email, password, rememberMe = true) => {
    return ipcRenderer.invoke('login', { email, password, rememberMe });
  },

  /**
   * Check if saved login credentials exist.
   * @returns {Promise<{hasSavedCredentials: boolean, email?: string}>}
   */
  checkSavedLogin: () => {
    return ipcRenderer.invoke('check-saved-login');
  },

  /**
   * Sign out current user and clear session.
   * @returns {Promise<{success: boolean}>}
   */
  logout: () => {
    return ipcRenderer.invoke('logout');
  },

  // ===========================================================================
  // NOTIFICATIONS
  // ===========================================================================

  /**
   * Display a notification popup.
   * @param {string} title - Notification title
   * @param {string} body - Notification message body
   * @param {Object} [options] - Additional options
   * @param {string} [options.type] - Notification type: 'info', 'task', 'meeting', 'success'
   * @param {number} [options.duration] - Auto-dismiss duration in milliseconds
   * @returns {Promise<void>}
   */
  showNotification: (title, body, options = {}) => {
    return ipcRenderer.invoke('show-notification', { title, body, options });
  },

  /**
   * Display an actionable notification with buttons.
   * @param {Object} data - Notification configuration
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Type: 'task', 'meeting', 'info', 'success'
   * @param {string} [data.dueIn] - Time indicator text
   * @param {boolean} [data.urgent] - Mark as urgent
   * @param {string} [data.taskId] - Associated task/meeting ID
   * @param {number} [data.duration] - Auto-dismiss duration
   * @returns {Promise<void>}
   */
  showActionableNotification: (data) => {
    return ipcRenderer.invoke('show-rize-notification', data);
  },

  /**
   * Get current notification permission status.
   * @returns {Promise<boolean>} True if notifications are enabled
   */
  getNotificationStatus: () => {
    return ipcRenderer.invoke('get-notification-status');
  },

  /**
   * Set notification permission status.
   * @param {boolean} enabled - Enable or disable notifications
   * @returns {Promise<boolean>} Updated status
   */
  setNotificationStatus: (enabled) => {
    return ipcRenderer.invoke('set-notification-status', enabled);
  },

  /**
   * Send a task reminder notification.
   * @param {Object} task - Task information
   * @param {string} task.id - Task identifier
   * @param {string} task.title - Task title
   * @param {string} [task.message] - Custom message
   * @param {string} [task.dueIn] - Due time text
   * @param {boolean} [task.urgent] - Mark as urgent
   * @returns {Promise<void>}
   */
  taskReminder: (task) => {
    return ipcRenderer.invoke('show-rize-notification', {
      title: task.title,
      message: task.message || 'Task is due soon. Would you like to mark it as complete?',
      type: 'task',
      dueIn: task.dueIn || 'Due soon',
      urgent: task.urgent || false,
      taskId: task.id,
      duration: 15000
    });
  },

  /**
   * Send a meeting reminder notification.
   * @param {Object} meeting - Meeting information
   * @param {string} meeting.id - Meeting identifier
   * @param {string} meeting.title - Meeting title
   * @param {string} [meeting.message] - Custom message
   * @param {number} [meeting.minutesUntil] - Minutes until meeting starts
   * @returns {Promise<void>}
   */
  meetingReminder: (meeting) => {
    return ipcRenderer.invoke('show-rize-notification', {
      title: meeting.title,
      message: meeting.message || 'Your meeting is about to start.',
      type: 'meeting',
      dueIn: `In ${meeting.minutesUntil || 5} minutes`,
      urgent: (meeting.minutesUntil || 5) <= 5,
      taskId: meeting.id,
      duration: 30000
    });
  },

  // ===========================================================================
  // NAVIGATION
  // ===========================================================================

  /**
   * Navigate to a specific page.
   * @param {string} page - Page identifier: 'timetable' or 'personal'
   * @returns {Promise<void>}
   */
  navigate: (page) => {
    return ipcRenderer.invoke('navigate', page);
  },

  /**
   * Navigate to Meeting Schedule page.
   * @returns {Promise<void>}
   */
  goToMeetingSchedule: () => {
    return ipcRenderer.invoke('navigate', 'timetable');
  },

  /**
   * Navigate to Personal page.
   * @returns {Promise<void>}
   */
  goToPersonal: () => {
    return ipcRenderer.invoke('navigate', 'personal');
  },

  // ===========================================================================
  // WINDOW MANAGEMENT
  // ===========================================================================

  /**
   * Show and focus the main window.
   * @returns {Promise<void>}
   */
  showWindow: () => {
    return ipcRenderer.invoke('show-window');
  },

  /**
   * Hide window to menu bar.
   * @returns {Promise<void>}
   */
  minimizeToTray: () => {
    return ipcRenderer.invoke('minimize-to-tray');
  },

  // ===========================================================================
  // APPLICATION INFORMATION
  // ===========================================================================

  /**
   * Get application version.
   * @returns {Promise<string>} Version string
   */
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },

  /**
   * Set dock badge count (macOS).
   * @param {number} count - Badge count (0 to clear)
   * @returns {Promise<void>}
   */
  setBadgeCount: (count) => {
    return ipcRenderer.invoke('set-badge-count', count);
  },

  // ===========================================================================
  // SETTINGS
  // ===========================================================================

  /**
   * Get all application settings.
   * @returns {Promise<Object>} Settings object
   */
  getSettings: () => {
    return ipcRenderer.invoke('get-settings');
  },

  /**
   * Update application settings.
   * @param {Object} settings - Settings to update
   * @param {boolean} [settings.notifications] - Enable notifications
   * @param {boolean} [settings.startMinimized] - Start minimized to tray
   * @param {boolean} [settings.launchOnStartup] - Launch at login
   * @returns {Promise<Object>} Updated settings
   */
  updateSettings: (settings) => {
    return ipcRenderer.invoke('update-settings', settings);
  },

  // ===========================================================================
  // EVENT LISTENERS
  // ===========================================================================

  /**
   * Register callback for task completion events.
   * @param {Function} callback - Callback function receiving {taskId, data}
   */
  onTaskCompleted: (callback) => {
    ipcRenderer.on('task-completed', (event, data) => callback(data));
  },

  /**
   * Register callback for keyboard shortcut events.
   * @param {Function} callback - Callback function receiving action string
   */
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut', (event, action) => callback(action));
  },

  /**
   * Remove all listeners for a specific channel.
   * @param {string} channel - IPC channel name
   */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // ===========================================================================
  // PLATFORM INFORMATION
  // ===========================================================================

  /** Indicates running in Electron environment */
  isElectron: true,

  /** Current platform identifier */
  platform: process.platform,

  /** Running on macOS */
  isMac: process.platform === 'darwin',

  /** Running on Windows (always false for this app) */
  isWindows: false,

  /** Running on Linux (always false for this app) */
  isLinux: false
};

/**
 * Desktop notifications compatibility layer.
 * Provides a simplified interface for showing notifications.
 */
const desktopNotifications = {
  /**
   * Request notification permission.
   * Always returns 'granted' in Electron.
   * @returns {Promise<string>}
   */
  requestPermission: async () => 'granted',

  /**
   * Check if notifications are supported.
   * @returns {boolean}
   */
  isSupported: () => true,

  /**
   * Show a notification.
   * @param {string} title - Notification title
   * @param {Object} [options] - Notification options
   * @param {string} [options.body] - Notification body
   * @param {boolean} [options.silent] - Silent notification
   * @param {string} [options.tag] - Notification tag
   * @returns {Promise<void>}
   */
  show: async (title, options = {}) => {
    return ipcRenderer.invoke('show-notification', {
      title,
      body: options.body || '',
      options: {
        type: options.tag === 'urgent' ? 'task' : 'info',
        duration: 5000
      }
    });
  }
};

/**
 * Focus application-specific API.
 * Provides high-level methods for common operations.
 */
const focusApp = {
  /**
   * Quick navigation to Meeting Schedule.
   * @returns {Promise<void>}
   */
  showMeetingSchedule: () => ipcRenderer.invoke('navigate', 'timetable'),

  /**
   * Quick navigation to Personal page.
   * @returns {Promise<void>}
   */
  showPersonal: () => ipcRenderer.invoke('navigate', 'personal'),

  /**
   * Send a task notification.
   * @param {string} title - Task title
   * @param {string} dueIn - Due time text
   * @param {boolean} [urgent=false] - Mark as urgent
   * @returns {Promise<void>}
   */
  notifyTask: (title, dueIn, urgent = false) => {
    return ipcRenderer.invoke('show-rize-notification', {
      title,
      message: 'Would you like to mark this as complete?',
      type: 'task',
      dueIn,
      urgent,
      duration: 15000
    });
  },

  /**
   * Send a meeting notification.
   * @param {string} title - Meeting title
   * @param {string} startsIn - Time until meeting text
   * @returns {Promise<void>}
   */
  notifyMeeting: (title, startsIn) => {
    return ipcRenderer.invoke('show-rize-notification', {
      title,
      message: 'Your meeting is about to start.',
      type: 'meeting',
      dueIn: startsIn,
      urgent: true,
      duration: 30000
    });
  },

  /**
   * Update dock badge count.
   * @param {number} count - Badge count
   * @returns {Promise<void>}
   */
  updateBadge: (count) => ipcRenderer.invoke('set-badge-count', count),

  /**
   * Check if user is currently authenticated.
   * @returns {Promise<boolean>}
   */
  isLoggedIn: async () => {
    try {
      const settings = await ipcRenderer.invoke('get-settings');
      return settings.isAuthenticated || false;
    } catch {
      return false;
    }
  }
};

// Expose APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
contextBridge.exposeInMainWorld('DesktopNotifications', desktopNotifications);
contextBridge.exposeInMainWorld('FocusApp', focusApp);

// Log initialization
console.log('[Focus Desktop] Preload script initialized');
console.log('[Focus Desktop] Platform:', process.platform);
