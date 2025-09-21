'use client';

import React, { useState } from 'react';

export default function DebugDrivePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [listResult, setListResult] = useState<any>(null);
  const [sharedDrivesResult, setSharedDrivesResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'testAuth'
        })
      });

      const data = await response.json();
      setTestResult(data);
      console.log('🔍 Test Auth Result:', data);
    } catch (error) {
      console.error('❌ Test Auth Error:', error);
      setTestResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testListFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listFiles',
          folderId: 'root'
        })
      });

      const data = await response.json();
      setListResult(data);
      console.log('🔍 List Files Result:', data);
    } catch (error) {
      console.error('❌ List Files Error:', error);
      setListResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testListSharedDrives = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listSharedDrives'
        })
      });

      const data = await response.json();
      setSharedDrivesResult(data);
      console.log('🔍 Shared Drives Result:', data);
    } catch (error) {
      console.error('❌ Shared Drives Error:', error);
      setSharedDrivesResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🔍 Google Drive API Debug
          </h1>

          <div className="space-y-6">
            {/* Test Authentication */}
            <div className="p-6 bg-blue-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Authentication</h2>
              <button
                onClick={testAuth}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Service Account Auth'}
              </button>
              
              {testResult && (
                <div className="mt-4 p-4 bg-white rounded border">
                  <h3 className="font-semibold mb-2">Auth Test Result:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Test List Files */}
            <div className="p-6 bg-green-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test List Files</h2>
              <button
                onClick={testListFiles}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test List Root Files'}
              </button>
              
              {listResult && (
                <div className="mt-4 p-4 bg-white rounded border">
                  <h3 className="font-semibold mb-2">List Files Result:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(listResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Test List Shared Drives */}
            <div className="p-6 bg-purple-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test List Shared Drives</h2>
              <button
                onClick={testListSharedDrives}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'List Available Shared Drives'}
              </button>
              
              {sharedDrivesResult && (
                <div className="mt-4 p-4 bg-white rounded border">
                  <h3 className="font-semibold mb-2">Shared Drives Result:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(sharedDrivesResult, null, 2)}
                  </pre>
                  {sharedDrivesResult.drives && sharedDrivesResult.drives.length > 0 && (
                    <div className="mt-2 text-green-600">
                      ✅ Found {sharedDrivesResult.drives.length} shared drive(s) - uploads should work in these!
                    </div>
                  )}
                  {sharedDrivesResult.drives && sharedDrivesResult.drives.length === 0 && (
                    <div className="mt-2 text-red-600">
                      ❌ No shared drives found - you need to create shared drives for uploads to work
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Upload Issue Alert */}
            <div className="p-6 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <h2 className="text-xl font-semibold text-red-800 mb-4">⚠️ Upload Issue Identified</h2>
              <div className="text-sm text-red-700 space-y-3">
                <p><strong>Problem:</strong> "Internal Server Error" when uploading files</p>
                <p><strong>Root Cause:</strong> Service accounts cannot upload to regular Google Drive folders due to storage quota limitations</p>
                
                <div className="bg-red-100 p-3 rounded border">
                  <p><strong>Google API Error:</strong></p>
                  <code className="text-xs">Service Accounts do not have storage quota. Use shared drives instead.</code>
                </div>
              </div>
            </div>

            {/* Solution Instructions */}
            <div className="p-6 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Solution: Use Google Shared Drives</h2>
              <div className="text-sm text-green-700 space-y-3">
                <p><strong>Service Account Email:</strong></p>
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-900">
                  projectmanagement@projectmanagement-463423.iam.gserviceaccount.com
                </code>
                
                <p className="mt-4"><strong>Step-by-Step Fix:</strong></p>
                <ol className="list-decimal list-inside space-y-2">
                  <li><strong>Create a Shared Drive:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Go to <a href="https://drive.google.com" target="_blank" className="text-blue-600 underline">Google Drive</a></li>
                      <li>Click "New" → "Shared drive"</li>
                      <li>Name it (e.g., "Project Management Files")</li>
                      <li>Click "Create"</li>
                    </ul>
                  </li>
                  <li><strong>Add Service Account to Shared Drive:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Open your new shared drive</li>
                      <li>Right-click → "Manage members"</li>
                      <li>Click "Add members"</li>
                      <li>Add: <code className="bg-gray-100 px-1 rounded">projectmanagement@projectmanagement-463423.iam.gserviceaccount.com</code></li>
                      <li>Set permission to <strong>"Manager"</strong> or <strong>"Content manager"</strong></li>
                      <li>Click "Send"</li>
                    </ul>
                  </li>
                  <li><strong>Create Folders in Shared Drive:</strong>
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                      <li>Create folders like "Operations", "Marketing", etc. inside the shared drive</li>
                      <li>These folders will now support file uploads from the service account</li>
                    </ul>
                  </li>
                  <li><strong>Test:</strong> Use the "List Available Shared Drives" button above to verify setup</li>
                </ol>

                <div className="bg-green-100 p-3 rounded border mt-4">
                  <p><strong>💡 Why This Works:</strong></p>
                  <p className="text-xs">Shared drives have their own storage quota and allow service accounts to upload files, unlike regular Google Drive folders which are tied to individual user accounts.</p>
                </div>
              </div>
            </div>

            {/* Legacy Instructions */}
            <div className="p-6 bg-yellow-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📂 For File Browsing (Already Working)</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>To share regular folders for browsing only:</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Share your Google Drive folders with the service account email above</li>
                  <li>Set permission to "Editor" when sharing</li>
                  <li>The service account can see and list these folders (but cannot upload to them)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 