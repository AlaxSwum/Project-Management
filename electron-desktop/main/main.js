const { app, BrowserWindow, Notification, Tray, Menu, ipcMain, nativeImage, shell, clipboard } = require('electron');
const path = require('path');
const log = require('electron-log');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');

// Development mode check
const isDev = !app.isPackaged;

// Next.js server configuration
const NEXT_PORT = 3000;
const NEXT_URL = isDev ? `http://localhost:${NEXT_PORT}` : null;

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
    // In production, start the Next.js server and load from it
    startNextServer().then(() => {
      mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);
    });
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
  showNotification(
    'Test Notification',
    'If you see this, notifications are working!',
    { urgency: 'normal' }
  );
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

  // Show task reminder notification
  ipcMain.handle('task-reminder', (event, task) => {
    showNotification('Task Reminder', `${task.title} is due soon!`, {
      url: `http://localhost:${NEXT_PORT}/my-tasks`,
      urgency: 'critical'
    });
  });

  // Show meeting reminder notification
  ipcMain.handle('meeting-reminder', (event, meeting) => {
    showNotification('Meeting Starting Soon', `${meeting.title} starts in ${meeting.minutesUntil} minutes`, {
      url: `http://localhost:${NEXT_PORT}/calendar`,
      urgency: 'critical'
    });
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

