'use client';

import { useState, useEffect } from 'react';

export default function OAuthTestPage() {
  const [status, setStatus] = useState('Initializing...');
  const [logs, setLogs] = useState<string[]>([]);
  const [tokenInfo, setTokenInfo] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testGoogleAPI = async () => {
    try {
      addLog('🔍 Testing Google API configuration...');
      
      // Check environment variables
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
      
      addLog(`Client ID: ${clientId ? 'Found' : 'Missing'}`);
      addLog(`API Key: ${apiKey ? 'Found' : 'Missing'}`);
      
      if (!clientId || !apiKey) {
        setStatus('❌ Environment variables missing');
        return;
      }

      // Check if Google Identity Services is loaded
      if (typeof window !== 'undefined' && (window as any).google) {
        addLog('✅ Google Identity Services loaded');
        
        try {
          // Initialize token client
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/drive.readonly',
            callback: (tokenResponse: any) => {
              addLog('📊 Token Response received');
              setTokenInfo(tokenResponse);
              
              if (tokenResponse.access_token) {
                addLog('✅ Access token received successfully');
                setStatus('✅ OAuth working correctly');
              } else if (tokenResponse.error) {
                addLog(`❌ OAuth error: ${tokenResponse.error}`);
                setStatus(`❌ OAuth failed: ${tokenResponse.error}`);
              }
            },
          });

          addLog('🚀 Token client initialized, requesting access...');
          tokenClient.requestAccessToken();
          
        } catch (error: any) {
          addLog(`❌ Token client error: ${error.message}`);
          setStatus(`❌ Token client failed: ${error.message}`);
        }
        
      } else {
        addLog('❌ Google Identity Services not loaded');
        setStatus('❌ Google scripts not loaded');
      }
      
    } catch (error: any) {
      addLog(`❌ Test error: ${error.message}`);
      setStatus(`❌ Test failed: ${error.message}`);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      addLog('✅ Google Identity Services script already loaded');
      setStatus('✅ Ready for testing');
      return;
    }

    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      addLog('✅ Google Identity Services script loaded');
      setStatus('✅ Ready for testing');
    };
    script.onerror = () => {
      addLog('❌ Failed to load Google Identity Services');
      setStatus('❌ Script loading failed');
    };
    document.head.appendChild(script);

    return () => {
      // Only remove if we added it
      const scriptToRemove = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptToRemove && document.head.contains(scriptToRemove)) {
        document.head.removeChild(scriptToRemove);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Google OAuth Test & Diagnostics
          </h1>
          
          {/* Status */}
          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Status</h2>
            <p className="text-blue-800">{status}</p>
          </div>

          {/* Environment Info */}
          <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Environment Configuration</h2>
            <div className="space-y-1 text-sm font-mono">
              <p><strong>Client ID:</strong> {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'Not set'}</p>
              <p><strong>API Key:</strong> {process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY ? 'Set (hidden)' : 'Not set'}</p>
              <p><strong>Current Domain:</strong> {typeof window !== 'undefined' ? window.location.hostname : 'Unknown'}</p>
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Unknown'}</p>
            </div>
          </div>

          {/* Test Button */}
          <div className="mb-6">
            <button
              onClick={testGoogleAPI}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              🧪 Test Google OAuth
            </button>
          </div>

          {/* Token Information */}
          {tokenInfo && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
              <h2 className="text-lg font-semibold text-green-900 mb-2">Token Information</h2>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(tokenInfo, null, 2)}
              </pre>
            </div>
          )}

          {/* Logs */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Test Logs</h2>
            <div className="max-h-64 overflow-y-auto bg-black text-green-400 p-3 rounded font-mono text-sm">
              {logs.length === 0 ? (
                <p>No logs yet...</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">📋 Required Google Cloud Console Settings</h2>
            <div className="text-yellow-800 space-y-2 text-sm">
              <p><strong>1. OAuth 2.0 Client IDs:</strong></p>
              <ul className="ml-4 list-disc">
                <li>Type: Web application</li>
                <li>Authorized JavaScript origins: <code>https://srv875725.hstgr.cloud</code></li>
                <li>Authorized redirect URIs: <code>https://srv875725.hstgr.cloud</code></li>
              </ul>
              
              <p><strong>2. OAuth Consent Screen:</strong></p>
              <ul className="ml-4 list-disc">
                <li>Status: Published (not in testing)</li>
                <li>User type: External or Internal</li>
                <li>Scopes: Google Drive API</li>
              </ul>
              
              <p><strong>3. APIs & Services:</strong></p>
              <ul className="ml-4 list-disc">
                <li>Google Drive API: Enabled</li>
                <li>Google Identity Services: Enabled</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 