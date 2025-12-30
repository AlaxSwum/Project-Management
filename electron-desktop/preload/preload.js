const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - exposes safe Electron APIs to the renderer process
 * Uses contextBridge for security (contextIsolation is enabled)
 */

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  
  /**
   * Show a native desktop notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body text
   * @param {object} options - Additional options (silent, urgency, url)
   */
  showNotification: (title, body, options = {}) => {
    return ipcRenderer.invoke('show-notification', { title, body, options });
  },

  /**
   * Get current notification permission status
   */
  getNotificationStatus: () => {
    return ipcRenderer.invoke('get-notification-status');
  },

  /**
   * Set notification permission
   * @param {boolean} enabled - Whether notifications are enabled
   */
  setNotificationStatus: (enabled) => {
    return ipcRenderer.invoke('set-notification-status', enabled);
  },

  /**
   * Send a task reminder notification
   * @param {object} task - Task object with title and due date
   */
  taskReminder: (task) => {
    return ipcRenderer.invoke('task-reminder', task);
  },

  /**
   * Send a meeting reminder notification
   * @param {object} meeting - Meeting object with title and start time
   */
  meetingReminder: (meeting) => {
    return ipcRenderer.invoke('meeting-reminder', meeting);
  },

  // ==========================================
  // WINDOW MANAGEMENT
  // ==========================================

  /**
   * Show the main window
   */
  showWindow: () => {
    return ipcRenderer.invoke('show-window');
  },

  /**
   * Minimize window to system tray
   */
  minimizeToTray: () => {
    return ipcRenderer.invoke('minimize-to-tray');
  },

  /**
   * Navigate to a specific URL
   * @param {string} url - URL to navigate to
   */
  navigate: (url) => {
    return ipcRenderer.invoke('navigate', url);
  },

  // ==========================================
  // APP INFO & UPDATES
  // ==========================================

  /**
   * Get the application version
   */
  getAppVersion: () => {
    return ipcRenderer.invoke('get-app-version');
  },

  /**
   * Set badge count on dock/taskbar icon (macOS)
   * @param {number} count - Number to display as badge
   */
  setBadgeCount: (count) => {
    return ipcRenderer.invoke('set-badge-count', count);
  },

  // ==========================================
  // SETTINGS
  // ==========================================

  /**
   * Get all app settings
   */
  getSettings: () => {
    return ipcRenderer.invoke('get-settings');
  },

  /**
   * Update app settings
   * @param {object} settings - Settings object to update
   */
  updateSettings: (settings) => {
    return ipcRenderer.invoke('update-settings', settings);
  },

  // ==========================================
  // EVENT LISTENERS
  // ==========================================

  /**
   * Listen for keyboard shortcuts from main process
   * @param {function} callback - Callback function to handle shortcut
   */
  onShortcut: (callback) => {
    ipcRenderer.on('shortcut', (event, action) => callback(action));
  },

  /**
   * Listen for navigation events from main process
   * @param {function} callback - Callback function to handle navigation
   */
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  /**
   * Remove all listeners for a channel
   * @param {string} channel - Channel name to remove listeners from
   */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // ==========================================
  // PLATFORM INFO
  // ==========================================

  /**
   * Check if running in Electron
   */
  isElectron: true,

  /**
   * Get the current platform
   */
  platform: process.platform,

  /**
   * Check if running on macOS
   */
  isMac: process.platform === 'darwin',

  /**
   * Check if running on Windows
   */
  isWindows: process.platform === 'win32',

  /**
   * Check if running on Linux
   */
  isLinux: process.platform === 'linux'
});

// Also expose a simplified notification API for compatibility
contextBridge.exposeInMainWorld('DesktopNotifications', {
  /**
   * Request notification permission (always granted in Electron)
   */
  requestPermission: async () => {
    return 'granted';
  },

  /**
   * Check if notifications are supported (always true in Electron)
   */
  isSupported: () => true,

  /**
   * Show a notification
   * @param {string} title - Notification title
   * @param {object} options - Notification options (body, icon, etc.)
   */
  show: async (title, options = {}) => {
    return ipcRenderer.invoke('show-notification', {
      title,
      body: options.body || '',
      options: {
        silent: options.silent,
        urgency: options.tag === 'urgent' ? 'critical' : 'normal',
        url: options.data?.url
      }
    });
  }
});

console.log('🖥️ Electron preload script loaded');
console.log(`📱 Platform: ${process.platform}`);

