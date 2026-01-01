const { app, BrowserWindow, Notification, Tray, Menu, ipcMain, nativeImage, shell, clipboard, screen } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Development mode check
const isDev = !app.isPackaged;

// Next.js server configuration
const NEXT_PORT = 3000;
const NEXT_URL = isDev ? `http://localhost:${NEXT_PORT}` : 'https://focus-project.co.uk';

// Notification windows tracking
let notificationWindows = [];
let pendingReminders = new Map(); // taskId -> reminder data
let snoozedTasks = new Map(); // taskId -> snooze timer

/**
 * Setup right-click context menu for a window
 */
function setupContextMenu(window) {
  window.webContents.on('context-menu', (event, params) => {
    const baseUrl = NEXT_URL || `http://localhost:${NEXT_PORT}`;
    
    const menuTemplate = [];
    
    // Text selection options
    if (params.selectionText) {
      menuTemplate.push(
        { label: 'Cut', role: 'cut', enabled: params.editFlags.canCut },
        { label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy },
        { type: 'separator' }
      );
    }
    
    // Paste option for editable fields
    if (params.isEditable) {
      menuTemplate.push(
        { label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' }
      );
    }
    
    // Link options
    if (params.linkURL) {
      menuTemplate.push(
        {
          label: 'Open Link in Browser',
          click: () => shell.openExternal(params.linkURL)
        },
        {
          label: 'Copy Link',
          click: () => clipboard.writeText(params.linkURL)
        },
        { type: 'separator' }
      );
    }
    
    // Image options
    if (params.hasImageContents) {
      menuTemplate.push(
        {
          label: 'Copy Image',
          click: () => window.webContents.copyImageAt(params.x, params.y)
        },
        {
          label: 'Save Image As...',
          click: () => {
            const { dialog } = require('electron');
            dialog.showSaveDialog(window, {
              defaultPath: 'image.png'
            }).then(result => {
              if (!result.canceled && result.filePath) {
                // Download and save the image
                const https = require('https');
                const http = require('http');
                const fs = require('fs');
                const url = params.srcURL;
                const protocol = url.startsWith('https') ? https : http;
                protocol.get(url, response => {
                  const file = fs.createWriteStream(result.filePath);
                  response.pipe(file);
                });
              }
            });
          }
        },
        { type: 'separator' }
      );
    }
    
    // Navigation options
    menuTemplate.push(
      {
        label: 'Back',
        enabled: window.webContents.canGoBack(),
        click: () => window.webContents.goBack()
      },
      {
        label: 'Forward',
        enabled: window.webContents.canGoForward(),
        click: () => window.webContents.goForward()
      },
      {
        label: 'Refresh',
        click: () => window.webContents.reload()
      },
      { type: 'separator' }
    );
    
    // Quick navigation
    menuTemplate.push(
      {
        label: 'Quick Navigation',
        submenu: [
          {
            label: 'Dashboard',
            click: () => window.loadURL(`${baseUrl}/dashboard`)
          },
          {
            label: 'My Tasks',
            click: () => window.loadURL(`${baseUrl}/my-tasks`)
          },
          {
            label: 'Calendar',
            click: () => window.loadURL(`${baseUrl}/calendar`)
          },
          {
            label: 'Personal',
            click: () => window.loadURL(`${baseUrl}/personal`)
          },
          {
            label: 'Timeline',
            click: () => window.loadURL(`${baseUrl}/timeline`)
          }
        ]
      }
    );
    
    // Developer tools (dev mode only)
    if (isDev) {
      menuTemplate.push(
        { type: 'separator' },
        {
          label: 'Inspect Element',
          click: () => window.webContents.inspectElement(params.x, params.y)
        }
      );
    }
    
    const contextMenu = Menu.buildFromTemplate(menuTemplate);
    contextMenu.popup(window);
  });
}

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Initialize store for settings
const store = new Store({
  defaults: {
    notifications: true,
    startMinimized: false,
    launchOnStartup: false,
    windowBounds: { width: 1400, height: 900 }
  }
});

// Keep references to prevent garbage collection
let mainWindow = null;
let tray = null;
let isQuitting = false;

/**
 * Create the main application window
 */
function createWindow() {
  const { width, height, x, y } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 1024,
    minHeight: 768,
    title: 'Project Management',
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      spellcheck: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#0f172a', // Match your app's dark theme
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL(NEXT_URL);
    // Open DevTools in development
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load from the live website
    mainWindow.loadURL('https://focus-project.co.uk');
  }

  // Setup right-click context menu
  setupContextMenu(mainWindow);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (!store.get('startMinimized')) {
      mainWindow.show();
    }
  });

  // Save window position on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification that app is still running
      if (store.get('notifications')) {
        showNotification('Project Management', 'App is still running in the system tray');
      }
    } else {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

/**
 * Start the Next.js server in production
 */
async function startNextServer() {
  if (isDev) return;

  const { spawn } = require('child_process');
  const appPath = path.join(process.resourcesPath, 'app');
  
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['next', 'start', '-p', NEXT_PORT], {
      cwd: appPath,
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    server.stdout.on('data', (data) => {
      log.info(`Next.js: ${data}`);
      if (data.toString().includes('Ready')) {
        resolve();
      }
    });

    server.stderr.on('data', (data) => {
      log.error(`Next.js Error: ${data}`);
    });

    server.on('error', reject);

    // Ensure server is killed when app closes
    app.on('before-quit', () => {
      server.kill();
    });

    // Timeout fallback
    setTimeout(resolve, 5000);
  });
}

/**
 * Create system tray
 */
function createTray() {
  const iconPath = path.join(__dirname, '../resources/tray-icon.png');
  
  // Create a simple tray icon if the file doesn't exist
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    if (trayIcon.isEmpty()) {
      throw new Error('Icon not found');
    }
  } catch {
    // Create a simple colored icon as fallback
    trayIcon = nativeImage.createFromDataURL(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABQUlEQVQ4jY2TMU4CQRSG/5ndZRFWJRGNhRYWFtpYaKeJB/ACeAIPoIWVHsADaGdhoYWNJhY2RiMxBmJYd2dmLYhZwrK6/8z3z/+SmYG6EEKAbQBgZuZPa+1dKeXtwQDg3JMSQnQB/EwAXAJonwHYBjAC0E9aIYtAAQCz7McYE5vvNHDOTQDcJMQvawGstXdCiJvZvQQ+ADwuBZjZczqd3gkhrgDMAHwnBXDO9YnoOgGGAPoAAudc7/j4+GIpgHPuNxKi2Z/rvr+/p1Kp1DvL7/9hpLq/v29UKpVvAMEKQODn5yclpfxIuV1dXT22trb2c7ncpJq8vr5+3tjYOF9YWPA9z9PA1dXV8/Pz8/10Op2/XwBkMhmv0Wh8vby8dLa3t0OpVLJRFEkiMkopHQRBaIxhKWUYhuH4pxHA36YBYFACVTMAQQAAAABJRU5ErkJggg=='
    );
  }
  
  // Resize for macOS menu bar
  if (process.platform === 'darwin') {
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Project Management');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Project Management',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'My Tasks',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL(`${NEXT_URL || 'http://localhost:3000'}/my-tasks`);
        }
      }
    },
    {
      label: 'Calendar',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL(`${NEXT_URL || 'http://localhost:3000'}/calendar`);
        }
      }
    },
    {
      label: 'Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.loadURL(`${NEXT_URL || 'http://localhost:3000'}/dashboard`);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Notifications',
      type: 'checkbox',
      checked: store.get('notifications'),
      click: (menuItem) => {
        store.set('notifications', menuItem.checked);
      }
    },
    {
      label: 'Start Minimized',
      type: 'checkbox',
      checked: store.get('startMinimized'),
      click: (menuItem) => {
        store.set('startMinimized', menuItem.checked);
      }
    },
    {
      label: 'Launch on Startup',
      type: 'checkbox',
      checked: store.get('launchOnStartup'),
      click: (menuItem) => {
        store.set('launchOnStartup', menuItem.checked);
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: store.get('startMinimized')
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Test Notification',
      click: () => {
        sendTestNotification();
      }
    },
    {
      label: 'Check for Updates',
      click: () => {
        autoUpdater.checkForUpdatesAndNotify();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Double-click to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * Show native notification
 */
function showNotification(title, body, options = {}) {
  if (!store.get('notifications')) {
    log.info('Notifications disabled, skipping:', title);
    return;
  }

  // Check if notifications are supported
  if (!Notification.isSupported()) {
    log.warn('Notifications not supported on this system');
    return;
  }

  log.info('Showing notification:', title, body);

  const iconPath = path.join(__dirname, '../resources/icon.png');
  
  const notification = new Notification({
    title,
    body,
    icon: iconPath,
    silent: options.silent || false,
    hasReply: false,
    timeoutType: 'default', // 'default' or 'never'
    urgency: options.urgency || 'normal',
  });

  notification.on('click', () => {
    log.info('Notification clicked:', title);
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      
      if (options.url) {
        const baseUrl = NEXT_URL || `http://localhost:${NEXT_PORT}`;
        mainWindow.loadURL(`${baseUrl}${options.url}`);
      }
    }
  });

  notification.on('show', () => {
    log.info('Notification shown successfully:', title);
  });

  notification.on('failed', (event, error) => {
    log.error('Notification failed:', error);
  });

  notification.show();
  return notification;
}

// Test notification function - can be called from menu or IPC
function sendTestNotification() {
  log.info('Sending test notification...');
  
  // Try Rize-style notification first
  const rizeWindow = showRizeNotification({
    title: 'Welcome to Focus',
    message: 'Your beautiful notifications are now active! Complete tasks and stay productive.',
    type: 'task',
    dueIn: 'Test notification',
    duration: 10000
  });
  
  // If Rize notification failed, use native
  if (!rizeWindow) {
    log.info('Rize notification failed, using native notification');
    showNotification('Focus - Test', 'Notifications are working! This is a native notification.');
  }
}

/**
 * Show Rize-style custom notification popup
 */
function showRizeNotification(data) {
  if (!store.get('notifications')) {
    log.info('Notifications disabled, skipping Rize notification');
    return null;
  }

  log.info('Showing Rize-style notification:', data.title);

  try {
    // Always use primary display for notifications
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;
    
    // Calculate position (top-right corner with padding)
    const notificationWidth = 400;
    const notificationHeight = 280;
    const padding = 20;
    const stackOffset = notificationWindows.length * (notificationHeight + 10);
    
    // Position in top-right corner of primary display
    const x = workArea.x + workArea.width - notificationWidth - padding;
    const y = workArea.y + padding + stackOffset;

    log.info(`Primary display work area: ${JSON.stringify(workArea)}`);
    log.info(`Creating notification window at position: ${x}, ${y}`);

    // Create notification window
    const notificationWindow = new BrowserWindow({
      width: notificationWidth,
      height: notificationHeight,
      x,
      y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: true,
      focusable: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Load notification HTML - handle both dev and production paths
    const fs = require('fs');
    let notificationPath = path.join(__dirname, '../notification/notification.html');
    
    // In production, try multiple paths
    if (!fs.existsSync(notificationPath)) {
      const altPaths = [
        path.join(app.getAppPath(), 'notification/notification.html'),
        path.join(process.resourcesPath, 'app/notification/notification.html'),
        path.join(__dirname, 'notification/notification.html')
      ];
      
      for (const altPath of altPaths) {
        log.info('Trying path:', altPath);
        if (fs.existsSync(altPath)) {
          notificationPath = altPath;
          break;
        }
      }
    }
    
    log.info('Loading notification from:', notificationPath);
    
    // Check if file exists
    if (!fs.existsSync(notificationPath)) {
      log.error('Notification HTML file not found, using native notification');
      // Fallback to native notification
      showNotification(data.title, data.message);
      return null;
    }

    notificationWindow.loadFile(notificationPath);

    // Handle load errors
    notificationWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log.error('Failed to load notification:', errorCode, errorDescription);
    });

    // Send data to notification window
    notificationWindow.webContents.once('did-finish-load', () => {
      log.info('Notification window loaded, sending data');
      notificationWindow.webContents.send('notification-data', {
        ...data,
        windowId: notificationWindow.id
      });
      notificationWindow.showInactive();
      log.info('Notification window shown');
    });

    // Track window
    notificationWindows.push(notificationWindow);

    // Handle window close
    notificationWindow.on('closed', () => {
      notificationWindows = notificationWindows.filter(w => w !== notificationWindow);
      repositionNotifications();
    });

    return notificationWindow;
  } catch (error) {
    log.error('Error showing Rize notification:', error);
    // Fallback to native notification
    showNotification(data.title, data.message);
    return null;
  }
}

/**
 * Reposition notification windows after one closes
 */
function repositionNotifications() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const notificationWidth = 400;
  const notificationHeight = 280;
  const padding = 20;

  notificationWindows.forEach((win, index) => {
    if (win && !win.isDestroyed()) {
      const x = screenWidth - notificationWidth - padding;
      const y = padding + index * (notificationHeight + 10);
      win.setPosition(x, y, true);
    }
  });
}

/**
 * Handle notification actions (complete, snooze, dismiss)
 */
function setupNotificationActions() {
  ipcMain.on('notification-action', (event, { action, taskId, snoozeMinutes, data }) => {
    log.info(`Notification action: ${action} for task ${taskId}`);
    
    // Find and close the notification window
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (senderWindow && !senderWindow.isDestroyed()) {
      senderWindow.close();
    }

    switch (action) {
      case 'complete':
        handleTaskComplete(taskId, data);
        break;
      case 'snooze':
        handleTaskSnooze(taskId, data, snoozeMinutes || 15);
        break;
      case 'dismiss':
        handleTaskDismiss(taskId, data);
        break;
    }
  });
}

/**
 * Handle task completion
 */
function handleTaskComplete(taskId, data) {
  log.info(`Task ${taskId} marked as complete`);
  
  // Remove from pending reminders
  pendingReminders.delete(taskId);
  
  // Clear any snooze timers
  if (snoozedTasks.has(taskId)) {
    clearTimeout(snoozedTasks.get(taskId));
    snoozedTasks.delete(taskId);
  }

  // Send completion to main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('task-completed', { taskId, data });
  }

  // Show completion confirmation
  showNotification('Task Complete', `"${data.title}" has been marked as done!`, {
    silent: true
  });
}

/**
 * Handle task snooze - will remind again after snoozeMinutes
 */
function handleTaskSnooze(taskId, data, snoozeMinutes) {
  log.info(`Task ${taskId} snoozed for ${snoozeMinutes} minutes`);
  
  // Clear existing snooze timer
  if (snoozedTasks.has(taskId)) {
    clearTimeout(snoozedTasks.get(taskId));
  }

  // Set new reminder
  const timer = setTimeout(() => {
    snoozedTasks.delete(taskId);
    
    // Show notification again
    showRizeNotification({
      ...data,
      title: data.title,
      message: `Reminder: This task was snoozed ${snoozeMinutes} minutes ago. Is it complete now?`,
      dueIn: 'Snoozed reminder',
      urgent: true,
      taskId
    });
  }, snoozeMinutes * 60 * 1000);

  snoozedTasks.set(taskId, timer);

  // Show snooze confirmation
  showNotification('Task Snoozed', `Will remind you about "${data.title}" in ${snoozeMinutes} minutes`, {
    silent: true
  });
}

/**
 * Handle task dismiss (don't remind again for this session)
 */
function handleTaskDismiss(taskId, data) {
  log.info(`Task ${taskId} dismissed`);
  
  // Remove from pending reminders for this session
  pendingReminders.delete(taskId);
  
  // Clear any snooze timers
  if (snoozedTasks.has(taskId)) {
    clearTimeout(snoozedTasks.get(taskId));
    snoozedTasks.delete(taskId);
  }
}

/**
 * Schedule a task reminder
 */
function scheduleTaskReminder(task) {
  const { id, title, dueDate, dueTime } = task;
  
  if (pendingReminders.has(id)) {
    return; // Already scheduled
  }

  const dueDateTime = new Date(`${dueDate}T${dueTime || '09:00'}`);
  const now = new Date();
  const timeUntilDue = dueDateTime.getTime() - now.getTime();

  // Remind 15 minutes before due
  const reminderTime = timeUntilDue - (15 * 60 * 1000);

  if (reminderTime > 0) {
    const timer = setTimeout(() => {
      showRizeNotification({
        taskId: id,
        title: title,
        message: 'This task is due soon. Would you like to mark it as complete?',
        type: 'task',
        dueIn: 'Due in 15 minutes',
        duration: 15000
      });
    }, reminderTime);

    pendingReminders.set(id, { task, timer });
  } else if (timeUntilDue > 0) {
    // Task is due within 15 minutes, remind immediately
    showRizeNotification({
      taskId: id,
      title: title,
      message: 'This task is due very soon! Is it complete?',
      type: 'task',
      dueIn: `Due in ${Math.round(timeUntilDue / 60000)} minutes`,
      urgent: true,
      duration: 15000
    });
  }
}

/**
 * Schedule a meeting reminder
 */
function scheduleMeetingReminder(meeting) {
  const { id, title, startTime, startDate } = meeting;
  
  const meetingDateTime = new Date(`${startDate}T${startTime}`);
  const now = new Date();
  const timeUntilMeeting = meetingDateTime.getTime() - now.getTime();

  // Remind 5 minutes before meeting
  const reminderTime = timeUntilMeeting - (5 * 60 * 1000);

  if (reminderTime > 0) {
    setTimeout(() => {
      showRizeNotification({
        taskId: id,
        title: title,
        message: 'Your meeting is about to start. Get ready!',
        type: 'meeting',
        dueIn: 'Starting in 5 minutes',
        duration: 60000 // 1 minute notification
      });
    }, reminderTime);
  }
}

/**
 * Setup IPC handlers for renderer communication
 */
function setupIPC() {
  // Show notification from renderer
  ipcMain.handle('show-notification', (event, { title, body, options }) => {
    log.info('IPC: show-notification requested:', title);
    return showNotification(title, body, options);
  });

  // Get notification permission status
  ipcMain.handle('get-notification-status', () => {
    return store.get('notifications');
  });

  // Set notification permission
  ipcMain.handle('set-notification-status', (event, enabled) => {
    store.set('notifications', enabled);
    return enabled;
  });

  // Get app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Show window
  ipcMain.handle('show-window', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Minimize to tray
  ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
  });

  // Navigate to URL
  ipcMain.handle('navigate', (event, url) => {
    if (mainWindow) {
      mainWindow.loadURL(url);
    }
  });

  // Get settings
  ipcMain.handle('get-settings', () => {
    return {
      notifications: store.get('notifications'),
      startMinimized: store.get('startMinimized'),
      launchOnStartup: store.get('launchOnStartup')
    };
  });

  // Update settings
  ipcMain.handle('update-settings', (event, settings) => {
    Object.keys(settings).forEach(key => {
      store.set(key, settings[key]);
    });

    if (settings.launchOnStartup !== undefined) {
      app.setLoginItemSettings({
        openAtLogin: settings.launchOnStartup,
        openAsHidden: store.get('startMinimized')
      });
    }

    return store.store;
  });

  // Badge count (macOS)
  ipcMain.handle('set-badge-count', (event, count) => {
    if (process.platform === 'darwin') {
      app.dock.setBadge(count > 0 ? String(count) : '');
    }
  });

  // Show Rize-style task reminder notification
  ipcMain.handle('task-reminder', (event, task) => {
    showRizeNotification({
      taskId: task.id || Date.now().toString(),
      title: task.title,
      message: task.message || 'This task is due soon. Would you like to mark it as complete?',
      type: 'task',
      dueIn: task.dueIn || 'Due soon',
      urgent: task.urgent || false,
      duration: 15000
    });
  });

  // Show Rize-style meeting reminder notification
  ipcMain.handle('meeting-reminder', (event, meeting) => {
    showRizeNotification({
      taskId: meeting.id || Date.now().toString(),
      title: meeting.title,
      message: meeting.message || 'Your meeting is about to start!',
      type: 'meeting',
      dueIn: `Starts in ${meeting.minutesUntil || 5} minutes`,
      urgent: meeting.minutesUntil <= 5,
      duration: 30000
    });
  });

  // Schedule a task reminder from renderer
  ipcMain.handle('schedule-task-reminder', (event, task) => {
    scheduleTaskReminder(task);
    return true;
  });

  // Schedule a meeting reminder from renderer
  ipcMain.handle('schedule-meeting-reminder', (event, meeting) => {
    scheduleMeetingReminder(meeting);
    return true;
  });

  // Show custom Rize notification
  ipcMain.handle('show-rize-notification', (event, data) => {
    showRizeNotification(data);
    return true;
  });

  // Clear all pending reminders
  ipcMain.handle('clear-reminders', () => {
    pendingReminders.forEach(({ timer }) => clearTimeout(timer));
    pendingReminders.clear();
    snoozedTasks.forEach(timer => clearTimeout(timer));
    snoozedTasks.clear();
    return true;
  });
}

/**
 * Setup auto-updater
 */
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    showNotification('Update Available', `Version ${info.version} is available. Downloading...`);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info(`Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    showNotification('Update Ready', 'A new version has been downloaded. Restart to apply the update.');
    
    // Prompt user to restart
    const { dialog } = require('electron');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Ready',
      message: 'A new version has been downloaded. Would you like to restart now?',
      buttons: ['Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'Cmd+,',
          click: () => {
            // Open preferences
          }
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Task',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('shortcut', 'new-task');
            }
          }
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => navigateTo('/dashboard')
        },
        {
          label: 'My Tasks',
          accelerator: 'CmdOrCtrl+2',
          click: () => navigateTo('/my-tasks')
        },
        {
          label: 'Calendar',
          accelerator: 'CmdOrCtrl+3',
          click: () => navigateTo('/calendar')
        },
        {
          label: 'Timeline',
          accelerator: 'CmdOrCtrl+4',
          click: () => navigateTo('/timeline')
        },
        {
          label: 'Content Calendar',
          accelerator: 'CmdOrCtrl+5',
          click: () => navigateTo('/content-calendar')
        },
        { type: 'separator' },
        {
          label: 'Password Vault',
          accelerator: 'CmdOrCtrl+P',
          click: () => navigateTo('/password-vault')
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://your-docs-url.com')
        },
        {
          label: 'Check for Updates',
          click: () => autoUpdater.checkForUpdatesAndNotify()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function navigateTo(path) {
  const baseUrl = isDev ? NEXT_URL : `http://localhost:${NEXT_PORT}`;
  if (mainWindow) {
    mainWindow.show();
    mainWindow.loadURL(`${baseUrl}${path}`);
  }
}

// App ready handler
app.whenReady().then(() => {
  createWindow();
  createTray();
  createMenu();
  setupIPC();
  setupNotificationActions();
  setupAutoUpdater();

  // Check for updates after startup (in production)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 10000);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Quit handler
app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors (for self-signed certs in development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

log.info('Project Management Desktop App Started');

// Send a welcome notification on startup (only in development to test)
if (isDev) {
  setTimeout(() => {
    log.info('Sending startup test notification...');
    if (Notification.isSupported()) {
      log.info('Notifications ARE supported on this system');
      sendTestNotification();
    } else {
      log.warn('Notifications NOT supported on this system');
    }
  }, 3000);
}

