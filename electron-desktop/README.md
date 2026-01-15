# Focus Desktop

A native macOS desktop application for productivity and meeting management. Built with Electron, featuring a glassmorphism design inspired by Apple's design language.

## Features

### Authentication
- Secure login with email and password
- Persistent session storage (one-time login)
- Encrypted credential storage

### Native macOS Experience
- Native window vibrancy and transparency
- Menu bar integration for quick access
- Background operation when window is closed
- Launch at login support
- Native notification system

### Pages
- **Meeting Schedule**: View and manage your meetings
- **Personal**: Manage personal tasks and to-do items

### Notifications
- Glass-style notification popups
- Actionable notifications with buttons (Done, Snooze, Dismiss)
- Progress indicator for auto-dismiss
- Dark mode support

## System Requirements

- macOS 10.15 (Catalina) or later
- Apple Silicon (M1/M2/M3) or Intel processor

## Installation

### From DMG (Recommended)
1. Download the latest `.dmg` file from Releases
2. Open the DMG file
3. Drag Focus to your Applications folder
4. Launch Focus from Applications

### From Source

```bash
# Clone the repository
git clone https://github.com/focus-project/focus-desktop.git
cd focus-desktop

# Install dependencies
npm install

# Run in development mode
npm start
```

## Building

### Build for Current Architecture

```bash
npm run build
```

### Build DMG Only

```bash
npm run build:dmg
```

### Build for Specific Architecture

```bash
# Apple Silicon (M1/M2/M3)
npm run build:arm64

# Intel
npm run build:x64

# Universal (both architectures)
npm run build:universal
```

### Output

Built files are located in the `dist/` directory:
- `Focus-1.0.0-mac-arm64.dmg` - Apple Silicon installer
- `Focus-1.0.0-mac-x64.dmg` - Intel installer
- `Focus-1.0.0-mac-arm64.zip` - Apple Silicon archive
- `Focus-1.0.0-mac-x64.zip` - Intel archive

## Development

### Project Structure

```
focus-desktop/
├── main/
│   └── main.js              # Main process
├── preload/
│   └── preload.js           # Preload script (IPC bridge)
├── renderer/
│   └── login.html           # Login page
├── notification/
│   └── notification.html    # Notification popup
├── resources/
│   ├── icon.png             # Application icon
│   ├── tray-icon.png        # Menu bar icon
│   ├── entitlements.mac.plist
│   └── icons/               # Icon set
├── scripts/
│   └── notarize.js          # Notarization script
├── package.json
└── README.md
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Launch the application |
| `npm run dev` | Launch in development mode |
| `npm run build` | Build for macOS |
| `npm run build:dmg` | Build DMG installer |
| `npm run build:zip` | Build ZIP archive |
| `npm run build:universal` | Build universal binary |
| `npm run build:arm64` | Build for Apple Silicon |
| `npm run build:x64` | Build for Intel |
| `npm run clean` | Remove build artifacts |
| `npm run rebuild` | Clean and rebuild |

### Configuration Storage

Application settings are stored in:
```
~/Library/Application Support/focus-desktop/focus-config.json
```

Settings include:
- `preferences.notifications` - Enable/disable notifications
- `preferences.startMinimized` - Start minimized to menu bar
- `preferences.launchOnStartup` - Launch at system login
- `navigation.currentPage` - Last viewed page
- `auth` - Authentication state (encrypted)

## Code Signing and Notarization

For production distribution, set environment variables:

```bash
export APPLE_ID="your-apple-id@email.com"
export APPLE_ID_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="your-team-id"
```

The notarization script (`scripts/notarize.js`) runs automatically during the build process if credentials are configured.

## Auto-Updates

The application supports automatic updates via GitHub Releases:
1. Checks for updates on startup (10 seconds after launch)
2. Downloads updates in the background
3. Prompts user to restart to apply updates

## API Reference

### electronAPI

Available in the renderer process via `window.electronAPI`:

```javascript
// Authentication
await electronAPI.login(email, password, rememberMe);
await electronAPI.logout();
await electronAPI.checkSavedLogin();

// Notifications
await electronAPI.showNotification(title, body, options);
await electronAPI.showActionableNotification(data);
await electronAPI.taskReminder(task);
await electronAPI.meetingReminder(meeting);

// Navigation
await electronAPI.navigate('timetable');
await electronAPI.navigate('personal');

// Window
await electronAPI.showWindow();
await electronAPI.minimizeToTray();

// Settings
await electronAPI.getSettings();
await electronAPI.updateSettings(settings);

// Platform
electronAPI.isElectron // true
electronAPI.isMac      // true
electronAPI.platform   // 'darwin'
```

### FocusApp

Simplified API available via `window.FocusApp`:

```javascript
// Navigation
await FocusApp.showMeetingSchedule();
await FocusApp.showPersonal();

// Notifications
await FocusApp.notifyTask(title, dueIn, urgent);
await FocusApp.notifyMeeting(title, startsIn);

// Badge
await FocusApp.updateBadge(count);

// Auth
await FocusApp.isLoggedIn();
```

## Security

- Credentials are encrypted using electron-store
- Authentication via Supabase with secure HTTPS
- Hardened runtime enabled for macOS
- Context isolation enabled
- Remote module disabled

## Troubleshooting

### Application not starting
1. Ensure macOS 10.15 or later
2. Check Console.app for error logs
3. Try removing `~/Library/Application Support/focus-desktop/`

### Notifications not appearing
1. Check System Preferences > Notifications > Focus
2. Verify notifications are enabled in the app preferences

### Login issues
1. Verify internet connection
2. Check credentials are correct
3. Try signing out and signing back in

## License

MIT License - see LICENSE file for details.

## Support

For support inquiries:
- Email: support@focus-project.co.uk
- Website: https://focus-project.co.uk

---

Focus Desktop - Professional Productivity Management for macOS
