'use client';

import React, { useState, useEffect } from 'react';
import { driveAccessControl } from '@/lib/google-drive-access-control';

interface AccessControlConfig {
  allowedFolderIds: string[];
  allowedFolderNames: string[];
  allowRootAccess: boolean;
  defaultFolderId?: string;
}

export default function GoogleDriveConfigPage() {
  const [config, setConfig] = useState<AccessControlConfig>({
    allowedFolderIds: [],
    allowedFolderNames: [],
    allowRootAccess: true,
    defaultFolderId: undefined
  });
  
  const [newFolderId, setNewFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load current configuration
    const currentConfig = driveAccessControl.getConfig();
    setConfig(currentConfig);
  }, []);

  const addFolderId = () => {
    if (newFolderId.trim() && !config.allowedFolderIds.includes(newFolderId.trim())) {
      setConfig(prev => ({
        ...prev,
        allowedFolderIds: [...prev.allowedFolderIds, newFolderId.trim()]
      }));
      setNewFolderId('');
    }
  };

  const removeFolderId = (folderId: string) => {
    setConfig(prev => ({
      ...prev,
      allowedFolderIds: prev.allowedFolderIds.filter(id => id !== folderId)
    }));
  };

  const addFolderName = () => {
    if (newFolderName.trim() && !config.allowedFolderNames.includes(newFolderName.trim())) {
      setConfig(prev => ({
        ...prev,
        allowedFolderNames: [...prev.allowedFolderNames, newFolderName.trim()]
      }));
      setNewFolderName('');
    }
  };

  const removeFolderName = (folderName: string) => {
    setConfig(prev => ({
      ...prev,
      allowedFolderNames: prev.allowedFolderNames.filter(name => name !== folderName)
    }));
  };

  const saveConfig = () => {
    driveAccessControl.updateConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Google Drive Access Control Configuration
          </h1>
          
          <div className="mb-6 p-4 bg-green-100 border border-green-400 rounded-lg">
            <h2 className="text-lg font-semibold text-green-800 mb-2">✅ Currently Configured for Internal Use</h2>
            <p className="text-green-700">
              <strong>Full Access Mode:</strong> All users can access the entire Google Drive, browse all folders, and upload files anywhere. 
              Perfect for internal team collaboration.
            </p>
          </div>

          {/* Root Access Control */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Root Access</h2>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allowRootAccess"
                checked={config.allowRootAccess}
                onChange={(e) => setConfig(prev => ({ ...prev, allowRootAccess: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="allowRootAccess" className="text-gray-700">
                Allow users to access the root Google Drive folder
              </label>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              If disabled, users will only see the folders you specify below.
            </p>
          </div>

          {/* Allowed Folder IDs */}
          <div className="mb-8 p-6 bg-green-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Allowed Folder IDs</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add specific Google Drive folder IDs that users can access. You can find folder IDs in the URL when viewing a folder in Google Drive.
            </p>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newFolderId}
                onChange={(e) => setNewFolderId(e.target.value)}
                placeholder="Enter folder ID (e.g., 1ABC123DEF456GHI789JKL0MNO)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addFolderId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {config.allowedFolderIds.map((folderId, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <span className="font-mono text-sm">{folderId}</span>
                  <button
                    onClick={() => removeFolderId(folderId)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {config.allowedFolderIds.length === 0 && (
                <p className="text-gray-500 text-sm italic">No folder IDs configured</p>
              )}
            </div>
          </div>

          {/* Allowed Folder Names */}
          <div className="mb-8 p-6 bg-yellow-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Allowed Folder Names</h2>
            <p className="text-sm text-gray-600 mb-4">
              Add folder names that users can access. This is easier than using IDs but less secure (folder names can change).
            </p>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name (e.g., Project Files)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addFolderName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {config.allowedFolderNames.map((folderName, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <span>{folderName}</span>
                  <button
                    onClick={() => removeFolderName(folderName)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {config.allowedFolderNames.length === 0 && (
                <p className="text-gray-500 text-sm italic">No folder names configured</p>
              )}
            </div>
          </div>

          {/* Default Folder */}
          <div className="mb-8 p-6 bg-purple-50 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Default Folder</h2>
            <p className="text-sm text-gray-600 mb-4">
              If root access is disabled, users will be redirected to this folder by default.
            </p>
            <input
              type="text"
              value={config.defaultFolderId || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, defaultFolderId: e.target.value || undefined }))}
              placeholder="Enter default folder ID (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Save Configuration */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p><strong>Current Policy:</strong></p>
              <p>
                {config.allowedFolderIds.length === 0 && config.allowedFolderNames.length === 0
                  ? "🔓 No restrictions - users can access all folders"
                  : "🔒 Restricted access - users can only access specified folders"
                }
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {saved && (
                <span className="text-green-600 font-medium">✅ Configuration saved!</span>
              )}
              <button
                onClick={saveConfig}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              >
                Save Configuration
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Find Google Drive Folder IDs</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Open Google Drive in your browser</li>
              <li>Navigate to the folder you want to allow access to</li>
              <li>Look at the URL - the folder ID is the part after "/folders/"</li>
              <li>Example: https://drive.google.com/drive/folders/<strong>1ABC123DEF456GHI789JKL0MNO</strong></li>
              <li>Copy the highlighted part and paste it in the "Allowed Folder IDs" section above</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 