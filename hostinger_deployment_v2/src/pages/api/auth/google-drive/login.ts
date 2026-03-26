// Redirects admin to Google OAuth to connect their Drive
import { NextApiRequest, NextApiResponse } from 'next';

const CLIENT_ID = process.env.GOOGLE_DRIVE_CLIENT_ID || '';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const host = req.headers.host || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/api/auth/google-drive/callback`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file',
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
