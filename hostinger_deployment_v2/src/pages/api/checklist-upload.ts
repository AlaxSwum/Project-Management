// Checklist file upload to Google Drive using OAuth (user's own Drive)
// Auto-creates: Root / Category / Checklist Title / Date / Employee Name /

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
};

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const ROOT_FOLDER_ID = '1fxmBE20t-2XSpIydPm4ogyU7lhEbLVS1';

const supabase = createClient(
  'https://bayyefskgflbyyuwrlgm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NTMxMTIsImV4cCI6MjA1MzUyOTExMn0.tFCddlHVMBVW0pgjMTqUDPJEwSRJHNAIX8cMnuDU6LY'
);

// Get valid access token (refresh if needed)
async function getAccessToken(): Promise<string> {
  // Try stored access token first
  const { data: atData } = await supabase.from('app_settings').select('value, updated_at').eq('key', 'google_drive_access_token').single();

  // Check if token is still fresh (less than 50 minutes old)
  if (atData?.value && atData?.updated_at) {
    const age = Date.now() - new Date(atData.updated_at).getTime();
    if (age < 50 * 60 * 1000) return atData.value;
  }

  // Refresh the token
  const { data: rtData } = await supabase.from('app_settings').select('value').eq('key', 'google_drive_refresh_token').single();
  if (!rtData?.value) throw new Error('Google Drive not connected. Please connect via /api/auth/google-drive/login');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: rtData.value,
      grant_type: 'refresh_token',
    }),
  });

  const tokens = await res.json();
  if (!tokens.access_token) throw new Error('Failed to refresh Google Drive token');

  // Store new access token
  await supabase.from('app_settings').upsert({
    key: 'google_drive_access_token',
    value: tokens.access_token,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' });

  return tokens.access_token;
}

// Find or create folder by name inside parent
async function findOrCreateFolder(name: string, parentId: string, accessToken: string): Promise<string> {
  // Search for existing
  const searchQ = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQ)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const searchData = await searchRes.json();
  if (searchData.files?.length > 0) return searchData.files[0].id;

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    }),
  });
  const folder = await createRes.json();
  return folder.id;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // DELETE: Remove file from Google Drive
  if (req.method === 'DELETE') {
    try {
      const { driveFileId } = req.body;
      if (!driveFileId) return res.status(400).json({ error: 'driveFileId required' });
      const accessToken = await getAccessToken();
      await fetch(`https://www.googleapis.com/drive/v3/files/${driveFileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Check if Drive is connected
  if (req.method === 'GET') {
    const { data } = await supabase.from('app_settings').select('value').eq('key', 'google_drive_refresh_token').single();
    return res.status(200).json({ connected: !!data?.value });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, fileData, mimeType, categoryName, checklistTitle, employeeName } = req.body;
    if (!fileName || !fileData) return res.status(400).json({ error: 'fileName and fileData required' });

    const accessToken = await getAccessToken();
    const today = new Date().toISOString().split('T')[0];

    // Build folder path: Root / Category / Checklist Title / Date / Employee
    let currentParent = ROOT_FOLDER_ID;
    if (categoryName) currentParent = await findOrCreateFolder(categoryName, currentParent, accessToken);
    if (checklistTitle) currentParent = await findOrCreateFolder(checklistTitle, currentParent, accessToken);
    currentParent = await findOrCreateFolder(today, currentParent, accessToken);
    if (employeeName) currentParent = await findOrCreateFolder(employeeName, currentParent, accessToken);

    // Upload file using multipart upload
    const boundary = '-------314159265358979323846';
    const metadata = JSON.stringify({
      name: fileName,
      parents: [currentParent],
    });

    const fileBuffer = Buffer.from(fileData, 'base64');

    const multipartBody = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType || 'application/octet-stream'}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
      ),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}--`),
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,size',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartBody.length),
        },
        body: multipartBody,
      }
    );

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
      return res.status(500).json({ error: 'Upload failed', details: uploadData });
    }

    // Make file viewable by anyone with link
    await fetch(`https://www.googleapis.com/drive/v3/files/${uploadData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    return res.status(200).json({
      id: uploadData.id,
      name: uploadData.name,
      webViewLink: uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`,
      size: uploadData.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Upload failed' });
  }
}
