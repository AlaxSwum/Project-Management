'use client';

import React, { useState } from 'react';

export default function DebugDrivePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [listResult, setListResult] = useState<any>(null);
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

            {/* Instructions */}
            <div className="p-6 bg-yellow-50 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Debug Instructions</h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p><strong>Service Account Email:</strong></p>
                <code className="bg-gray-100 px-2 py-1 rounded">
                  projectmanagement@projectmanagement-463423.iam.gserviceaccount.com
                </code>
                
                <p className="mt-4"><strong>To Fix "No folders found":</strong></p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure you shared your Google Drive folders with the service account email above</li>
                  <li>Set permission to "Editor" when sharing</li>
                  <li>The service account can only see folders/files that are explicitly shared with it</li>
                  <li>It cannot see your entire Google Drive by default</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 