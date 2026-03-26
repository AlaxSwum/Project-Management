// Handles Google OAuth callback, stores refresh token in Supabase
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';

const supabase = createClient(
  'https://bayyefskgflbyyuwrlgm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NTMxMTIsImV4cCI6MjA1MzUyOTExMn0.tFCddlHVMBVW0pgjMTqUDPJEwSRJHNAIX8cMnuDU6LY'
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`OAuth error: ${error}`);
  }

  if (!code) {
    return res.status(400).send('No authorization code received');
  }

  try {
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/google-drive/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.refresh_token) {
      return res.status(400).send('No refresh token received. Try revoking app access and reconnecting.');
    }

    // Store refresh token in Supabase
    await supabase.from('app_settings').upsert({
      key: 'google_drive_refresh_token',
      value: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // Also store access token temporarily
    await supabase.from('app_settings').upsert({
      key: 'google_drive_access_token',
      value: tokens.access_token,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    // Redirect back to my-checklists with success
    res.redirect('/my-checklists?drive=connected');
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.status(500).send('Failed to connect Google Drive');
  }
}
