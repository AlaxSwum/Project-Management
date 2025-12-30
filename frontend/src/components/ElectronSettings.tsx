'use client';

import React, { Fragment } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import {
  XMarkIcon,
  BellIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useElectronOptional } from './ElectronProvider';

interface ElectronSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ElectronSettings({ isOpen, onClose }: ElectronSettingsProps) {
  const electron = useElectronOptional();

  // Only render if running in Electron
  if (!electron?.isElectronApp) {
    return null;
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl font-semibold text-white flex items-center gap-2">
                    <ComputerDesktopIcon className="w-6 h-6 text-blue-400" />
                    Desktop Settings
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Platform Info */}
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <InformationCircleIcon className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm text-slate-400">Platform</p>
                        <p className="text-white font-medium capitalize">{electron.platform}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <ArrowPathIcon className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-sm text-slate-400">Version</p>
                        <p className="text-white font-medium">{electron.appVersion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <BellIcon className="w-4 h-4" />
                      Notifications
                    </h3>
                    
                    <SettingsToggle
                      label="Enable Notifications"
                      description="Show native desktop notifications for tasks and meetings"
                      enabled={electron.notificationsEnabled}
                      onChange={electron.setNotificationsEnabled}
                    />
                  </div>

                  {/* Startup */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <ComputerDesktopIcon className="w-4 h-4" />
                      Startup
                    </h3>
                    
                    <SettingsToggle
                      label="Launch on Startup"
                      description="Automatically start the app when you log in"
                      enabled={electron.launchOnStartup}
                      onChange={electron.setLaunchOnStartup}
                    />
                    
                    <SettingsToggle
                      label="Start Minimized"
                      description="Start in the system tray instead of showing the window"
                      enabled={electron.startMinimized}
                      onChange={electron.setStartMinimized}
                    />
                  </div>

                  {/* Keyboard Shortcuts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                      Keyboard Shortcuts
                    </h3>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘1' : 'Ctrl+1'} action="Dashboard" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘2' : 'Ctrl+2'} action="My Tasks" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘3' : 'Ctrl+3'} action="Calendar" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘4' : 'Ctrl+4'} action="Timeline" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘5' : 'Ctrl+5'} action="Content Calendar" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘N' : 'Ctrl+N'} action="New Task" />
                      <ShortcutRow shortcut={electron.platform === 'mac' ? '⌘P' : 'Ctrl+P'} action="Password Vault" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700">
                  <button
                    onClick={onClose}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

interface SettingsToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => Promise<void>;
}

function SettingsToggle({ label, description, enabled, onChange }: SettingsToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 mr-4">
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <Switch
        checked={enabled}
        onChange={onChange}
        className={`${
          enabled ? 'bg-blue-600' : 'bg-slate-700'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
      >
        <span
          className={`${
            enabled ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  );
}

interface ShortcutRowProps {
  shortcut: string;
  action: string;
}

function ShortcutRow({ shortcut, action }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300">{action}</span>
      <kbd className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 font-mono">
        {shortcut}
      </kbd>
    </div>
  );
}

