'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  isElectron,
  getPlatform,
  requestNotificationPermission,
  showNotification,
  getAppSettings,
  updateAppSettings,
  getAppVersion,
  onShortcut,
  setBadgeCount
} from '@/lib/electron-notifications';

interface ElectronContextType {
  isElectronApp: boolean;
  platform: 'mac' | 'windows' | 'linux' | 'web';
  appVersion: string;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  startMinimized: boolean;
  setStartMinimized: (enabled: boolean) => Promise<void>;
  launchOnStartup: boolean;
  setLaunchOnStartup: (enabled: boolean) => Promise<void>;
  showNotification: (title: string, body: string, options?: { silent?: boolean; urgency?: 'low' | 'normal' | 'critical'; url?: string }) => Promise<void>;
  setBadgeCount: (count: number) => Promise<void>;
}

const ElectronContext = createContext<ElectronContextType | null>(null);

export function useElectron() {
  const context = useContext(ElectronContext);
  if (!context) {
    throw new Error('useElectron must be used within an ElectronProvider');
  }
  return context;
}

// Safe hook that doesn't throw if used outside provider
export function useElectronOptional() {
  return useContext(ElectronContext);
}

interface ElectronProviderProps {
  children: ReactNode;
}

export function ElectronProvider({ children }: ElectronProviderProps) {
  const [isElectronApp, setIsElectronApp] = useState(false);
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux' | 'web'>('web');
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [notificationsEnabled, setNotificationsEnabledState] = useState(true);
  const [startMinimized, setStartMinimizedState] = useState(false);
  const [launchOnStartup, setLaunchOnStartupState] = useState(false);

  useEffect(() => {
    // Initialize on client side only
    const init = async () => {
      const electron = isElectron();
      setIsElectronApp(electron);
      setPlatform(getPlatform());

      if (electron) {
        // Get app version
        const version = await getAppVersion();
        setAppVersion(version);

        // Get settings
        const settings = await getAppSettings();
        if (settings) {
          setNotificationsEnabledState(settings.notifications);
          setStartMinimizedState(settings.startMinimized);
          setLaunchOnStartupState(settings.launchOnStartup);
        }

        // Request notification permission
        await requestNotificationPermission();

        // Listen for keyboard shortcuts
        const cleanup = onShortcut((action) => {
          console.log('Keyboard shortcut:', action);
          // Handle shortcuts here
          if (action === 'new-task') {
            // Trigger new task modal
            window.dispatchEvent(new CustomEvent('electron-shortcut', { detail: { action } }));
          }
        });

        return cleanup;
      }
    };

    init();
  }, []);

  const setNotificationsEnabled = async (enabled: boolean) => {
    setNotificationsEnabledState(enabled);
    if (isElectronApp) {
      await updateAppSettings({ notifications: enabled });
    }
  };

  const setStartMinimized = async (enabled: boolean) => {
    setStartMinimizedState(enabled);
    if (isElectronApp) {
      await updateAppSettings({ startMinimized: enabled });
    }
  };

  const setLaunchOnStartup = async (enabled: boolean) => {
    setLaunchOnStartupState(enabled);
    if (isElectronApp) {
      await updateAppSettings({ launchOnStartup: enabled });
    }
  };

  const value: ElectronContextType = {
    isElectronApp,
    platform,
    appVersion,
    notificationsEnabled,
    setNotificationsEnabled,
    startMinimized,
    setStartMinimized,
    launchOnStartup,
    setLaunchOnStartup,
    showNotification,
    setBadgeCount
  };

  return (
    <ElectronContext.Provider value={value}>
      {children}
    </ElectronContext.Provider>
  );
}

/**
 * Hook to listen for electron shortcuts
 */
export function useElectronShortcuts(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleShortcut = (event: CustomEvent) => {
      const action = event.detail?.action;
      if (action && handlers[action]) {
        handlers[action]();
      }
    };

    window.addEventListener('electron-shortcut', handleShortcut as EventListener);
    return () => window.removeEventListener('electron-shortcut', handleShortcut as EventListener);
  }, [handlers]);
}

export default ElectronProvider;

