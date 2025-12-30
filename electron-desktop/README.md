# Project Management Desktop Application

A native desktop application for the Project Management system with native notifications, system tray integration, and cross-platform support.

## Features

- 🖥️ **Native Desktop App** - Full desktop experience on macOS, Windows, and Linux
- 🔔 **Native Notifications** - System-level notifications for tasks and meetings
- 📌 **System Tray** - Quick access from the system tray/menu bar
- 🚀 **Auto-Updates** - Automatic updates when new versions are available
- ⌨️ **Keyboard Shortcuts** - Quick navigation with keyboard shortcuts
- 🌙 **Launch on Startup** - Optionally start the app when you log in

## Requirements

- Node.js 18+ 
- npm or yarn
- For macOS builds: Xcode Command Line Tools
- For Windows builds: Windows Build Tools

## Installation

1. **Install dependencies for the desktop app:**

```bash
cd electron-desktop
npm install
```

2. **Install dependencies for the frontend (if not already done):**

```bash
cd ../frontend
npm install
```

## Development

To run the app in development mode:

```bash
cd electron-desktop
npm run dev
```

This will:
1. Start the Next.js development server
2. Wait for it to be ready
3. Launch the Electron app

## Building for Production

### Build for your current platform:

```bash
npm run build
```

### Build for specific platforms:

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

Build outputs will be in the `dist/` folder.

## App Icons

Before building, you should add your app icons:

### Required Icon Files:

```
resources/
├── icon.png        # 512x512 PNG (used for notifications)
├── icon.icns       # macOS app icon
├── icon.ico        # Windows app icon
├── tray-icon.png   # 16x16 or 32x32 PNG for system tray
└── icons/          # Linux icons (multiple sizes)
    ├── 16x16.png
    ├── 32x32.png
    ├── 48x48.png
    ├── 64x64.png
    ├── 128x128.png
    ├── 256x256.png
    └── 512x512.png
```

### Generate Icons from a Source PNG:

You can use tools like:
- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png2icons](https://github.com/nicbou/png2icons)
- Online converters

```bash
# Install electron-icon-builder
npm install -g electron-icon-builder

# Generate icons from a 1024x1024 PNG
electron-icon-builder --input=./source-icon.png --output=./resources
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Go to Dashboard |
| `Cmd/Ctrl + 2` | Go to My Tasks |
| `Cmd/Ctrl + 3` | Go to Calendar |
| `Cmd/Ctrl + 4` | Go to Timeline |
| `Cmd/Ctrl + 5` | Go to Content Calendar |
| `Cmd/Ctrl + N` | New Task |
| `Cmd/Ctrl + P` | Password Vault |
| `Cmd/Ctrl + Q` | Quit (macOS) |

## System Tray Menu

Right-click (or left-click on macOS) the tray icon for quick access to:
- Open the main window
- Quick navigation to Dashboard, My Tasks, Calendar
- Toggle notifications
- Toggle startup settings
- Check for updates
- Quit the application

## Configuration

The app stores its configuration in:
- **macOS:** `~/Library/Application Support/project-management-desktop/`
- **Windows:** `%APPDATA%/project-management-desktop/`
- **Linux:** `~/.config/project-management-desktop/`

## Auto-Updates

The app uses `electron-updater` for automatic updates. To enable auto-updates:

1. Set up a GitHub releases repository
2. Update the `publish` section in `package.json`:

```json
"publish": {
  "provider": "github",
  "owner": "your-github-username",
  "repo": "project-management-desktop"
}
```

3. Create releases with the built artifacts

## Troubleshooting

### App won't start in development

Make sure the Next.js server is accessible at `http://localhost:3000`. Try running:

```bash
cd ../frontend
npm run dev
```

### Notifications not showing

1. Check if notifications are enabled in the app settings (tray menu)
2. Check your system notification settings
3. On macOS, make sure the app has notification permissions

### Build fails on macOS

If you get code signing errors:

```bash
# Skip code signing for local builds
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build:mac
```

### Build fails on Windows

Make sure you have Windows Build Tools installed:

```bash
npm install --global windows-build-tools
```

## Project Structure

```
electron-desktop/
├── main/
│   └── main.js           # Main Electron process
├── preload/
│   └── preload.js        # Preload script for IPC
├── resources/
│   ├── icon.png          # App icon
│   ├── icon.icns         # macOS icon
│   ├── icon.ico          # Windows icon
│   ├── tray-icon.png     # System tray icon
│   └── entitlements.mac.plist
├── dist/                 # Build output
├── package.json
└── README.md
```

## Security

The app uses Electron's security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Preload scripts for safe IPC
- Sandboxed renderer processes

## License

MIT

