# 🖥️ Desktop Application Quick Start Guide

Your Project Management system now has a full **Electron desktop application** with native notifications!

---

## 📁 Project Structure

```
project_management/
├── frontend/                    # Your Next.js web app
│   └── src/
│       ├── components/
│       │   ├── ElectronProvider.tsx    # NEW - Electron context provider
│       │   └── ElectronSettings.tsx    # NEW - Desktop settings modal
│       ├── lib/
│       │   └── electron-notifications.ts   # NEW - Notification service
│       └── hooks/
│           └── useNotifications.ts     # NEW - Notification hook
│
└── electron-desktop/            # NEW - Desktop application
    ├── main/
    │   └── main.js              # Main Electron process
    ├── preload/
    │   └── preload.js           # Secure IPC bridge
    ├── resources/               # App icons
    ├── scripts/                 # Build scripts
    ├── package.json             # Electron dependencies
    └── README.md                # Full documentation
```

---

## 🚀 Running the Desktop App

### Development Mode

```bash
# Option 1: Run everything at once
cd electron-desktop
npm run dev

# Option 2: Run separately
# Terminal 1 - Start Next.js
cd frontend
npm run dev

# Terminal 2 - Start Electron
cd electron-desktop
npm start
```

### What You'll See

1. **Native Window** - Your app in a dedicated desktop window
2. **System Tray** - Quick access from the menu bar/taskbar
3. **Native Notifications** - Real desktop notifications for tasks and meetings
4. **Keyboard Shortcuts** - Navigate with Cmd/Ctrl+1-5

---

## 🔔 Native Notification Features

### Automatic Reminders
- **Task Reminders** - Get notified 15 minutes before due dates
- **Meeting Reminders** - Get notified 10 minutes before meetings

### Using Notifications in Your Code

```tsx
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { notify, notifyTask, notifyMeeting } = useNotifications({
    tasks: myTasks,        // Tasks to monitor
    meetings: myMeetings,  // Meetings to monitor
    enabled: true
  });

  // Manual notification
  const handleClick = () => {
    notify('Hello!', 'This is a desktop notification', {
      urgency: 'critical'
    });
  };

  return <button onClick={handleClick}>Notify Me</button>;
}
```

### Checking if Running in Electron

```tsx
import { useElectronOptional } from '@/components/ElectronProvider';

function MyComponent() {
  const electron = useElectronOptional();
  
  if (electron?.isElectronApp) {
    // Desktop-specific features
  }
  
  return <div>Platform: {electron?.platform || 'web'}</div>;
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Dashboard |
| `Cmd/Ctrl + 2` | My Tasks |
| `Cmd/Ctrl + 3` | Calendar |
| `Cmd/Ctrl + 4` | Timeline |
| `Cmd/Ctrl + 5` | Content Calendar |
| `Cmd/Ctrl + N` | New Task |
| `Cmd/Ctrl + P` | Password Vault |

---

## 📌 System Tray Features

Right-click the tray icon to:
- Open the main window
- Quick navigate to pages
- Toggle notifications
- Enable/disable launch on startup
- Check for updates
- Quit the application

---

## 🏗️ Building for Production

### Build for macOS
```bash
cd electron-desktop
npm run build:mac
```
Output: `dist/Project Management-1.0.0-arm64.dmg`

### Build for Windows
```bash
npm run build:win
```
Output: `dist/Project Management Setup 1.0.0.exe`

### Build for Linux
```bash
npm run build:linux
```
Output: `dist/Project Management-1.0.0.AppImage`

---

## 🎨 Custom App Icons

Before distributing, replace the placeholder icons:

1. Create a 1024x1024 PNG of your app icon
2. Generate all formats:

```bash
cd electron-desktop
npx electron-icon-builder --input=./your-icon.png --output=./resources
```

---

## ⚙️ Settings

The desktop app stores settings in:
- **macOS:** `~/Library/Application Support/project-management-desktop/`
- **Windows:** `%APPDATA%/project-management-desktop/`
- **Linux:** `~/.config/project-management-desktop/`

Available settings:
- `notifications` - Enable/disable notifications
- `startMinimized` - Start in system tray
- `launchOnStartup` - Auto-start on login

---

## 🔄 Auto-Updates

The app supports automatic updates via GitHub Releases:

1. Update version in `electron-desktop/package.json`
2. Build the app
3. Create a GitHub Release with the build artifacts
4. Users will be notified of updates automatically

---

## 🛠️ Troubleshooting

### App doesn't start
```bash
# Make sure Next.js is running first
cd frontend
npm run dev

# Then start Electron
cd ../electron-desktop
npm start
```

### No notifications on macOS
1. Open System Preferences → Notifications
2. Find "Project Management" 
3. Enable notifications

### Build fails on macOS (code signing)
```bash
# Skip code signing for local builds
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:mac
```

---

## 📱 What's Next?

Now that your desktop app is ready, you can:

1. **Add more notification types** - Extend `electron-notifications.ts`
2. **Add global shortcuts** - Register system-wide hotkeys
3. **Add offline support** - Cache data locally with electron-store
4. **Distribute** - Share the built app with your team

For the iOS/mobile version, consider:
- **Capacitor** - Wrap your web app (fastest)
- **React Native** - Build native screens (best UX)

---

## 📚 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder](https://www.electron.build/)
- [electron-store](https://github.com/sindresorhus/electron-store)
- [electron-updater](https://www.electron.build/auto-update)

---

**Your desktop app is ready!** 🎉

Run `cd electron-desktop && npm run dev` to start developing!

