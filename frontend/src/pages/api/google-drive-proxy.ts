// API proxy for Google Drive operations using service account
// This handles all Google Drive operations on the server side
// No individual user authentication required

import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

// Service Account Credentials
const serviceAccountKey = {
  type: "service_account",
  project_id: "projectmanagement-463423",
  private_key_id: "2e9d0fa21fdbccbbf898c71b84dcdd1cdd36cc41",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCNVwL5DsRCIzF9\nvCbRlN+On1+D4T9F91mf9gB854anNLOjA9lxaPHI0gaOt4bRFyW7ZgzhcCB2WR/z\n/iSR71eJDtIPRMWajEwBpjj746pxjrMSU50orBC8RSFlkXTfqE/NgvxntrXy3u1r\niIUDj/1pdiESKkFvLcXxupmUKn2cVN+kgOE5XYqRyvsL1pH6yId4VTaJO8lpjPRw\ncJO6HqjvlblUUre90kdcpNQYFdVhyO9ofosgpZoaCn9IOtloqFdxxkyKz4JoMy8h\nV4CTskH/3eSzDZgSrGsQQI7JkYbCmtD2GxqHmRjtc1XALiqWRZzaJHNvK2Tgh0Ir\nSWetVgTLAgMBAAECggEAH00v2VyN1l/Y7BGpPy0LPZjKHHjb/HDFJonincbgqVMg\nnW+Szm0BbwokbaLzdob70j7Nh3e/mLYwP2b/TlqFNlNT7hG6+XkstAjOAervqmqB\n+gMOgR1qL2fX95h5G7c4xTjHEWkDbqA0UGZRnvJamuqQdGdrSmYGunwq2wd1/hLx\nikOQ8lfXXdtXX28EHP9z342oj3Cge2TjouVukaf7pkscT9a5JCPekb8flgWTe5WV\n2zGxCCpMxLC4IEPRkZwTHGkywgqtkdEX0YyjXJOuC8nt67KGVaPeixyH8V/j/3GI\n11K54K77/AzCzW6f00+ioTF80VJ/AhdQQLj53pjdwQKBgQDF/fSFaTSZOAw4a0ff\nypsJ6To9MMHIXK065QR1FuRdMlad97qd/TBeLBjy5/Rk/bkbpcK3ptuwR/FOUJfh\n/wZ/mHvcZ6nuVVOAQGqOiRqYHe1azgU9VET8cY8lfLD9Ny6AsdJCp8eaQVxlFWMM\nDISDks8wvv28Efp0TJq/u63tOwKBgQC2v/aE106feslbUxV1nlpqxjcWUsayNRmY\nUXHO//WXA5Lyq+CBagvwW4Sx7tBP85UKUcBxexIJcjDz/hfW9/Fp61jGXa4av/Z6\nYEzYetvFaE6yONda6tAzDmTg43l4lqYyaGpDlUyz/eHVklJhtI3O3cjKRqTRHgWV\niHIBcosNsQKBgFBg7xoSQeZKGLv24bD64cI+SwR4fNNIvJMCUrLuXjtvqjZrUfm9\nxhsVL/O9MzykvLd6rfg850dDjbVLhr2a+Rpn3zD1bMlzHnkcraW8B23mCGwq43mo\ncnFB8Ok5G+lQs7JPfprM3n3DNy1aZ2GG221G9pJFl2D4s4LvbouUN+HtAoGAAZQK\n1v7dCPeQgZ9oEgn6Ee4AT8sLOELJI82gQ/9l6ZX4UOw3FicKT1sa/EZpuicKZHps\nRQ6hCz/XOGQ7ZHnjtdx4ec4ZUNXTlR77yurUtxG9jEB9a6WXgrlfGaodRHNYoBrS\nwB6r+On6Z1PKLlnW17CGqWiOx9eQiMgS4/xPQyECgYBsfZIjrJsi7dM8xB+tTBHN\nUu7mLzSDoG9QZJDeBHqi+6Bd1R0Pwjranyau1/yrOyZ4cDcsriEr6P4H8IHyGPun\nz/VShJuu8jY0ndPgwn4gwRTwjUVbt6biWsQkoBj+qDzuwo8Ha6rxKds6DSspIt+r\nqbbLIT98XGf2E+hII8aLGQ==\n-----END PRIVATE KEY-----\n",
  client_email: "projectmanagement@projectmanagement-463423.iam.gserviceaccount.com",
  client_id: "107482587586285536651",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/projectmanagement%40projectmanagement-463423.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Google Drive API
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, folderId, query, name, parentId } = req.body;

    switch (action) {
      case 'listFiles':
        return handleListFiles(req, res, folderId);
      
      case 'searchFiles':
        return handleSearchFiles(req, res, query);
      
      case 'createFolder':
        return handleCreateFolder(req, res, name, parentId);
      
      case 'getAccessToken':
        return handleGetAccessToken(req, res);
      
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Google Drive proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleListFiles(req: NextApiRequest, res: NextApiResponse, folderId: string) {
  try {
    const response = await drive.files.list({
      q: folderId && folderId !== 'root' ? `'${folderId}' in parents and trashed=false` : `'root' in parents and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents)',
      orderBy: 'folder,name'
    });

    const files = response.data.files || [];
    
    return res.status(200).json({ files });
  } catch (error) {
    console.error('Error listing files:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
}

async function handleSearchFiles(req: NextApiRequest, res: NextApiResponse, query: string) {
  try {
    const response = await drive.files.list({
      q: `name contains '${query}' and trashed=false`,
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents)',
      orderBy: 'folder,name'
    });

    const files = response.data.files || [];
    
    return res.status(200).json({ files });
  } catch (error) {
    console.error('Error searching files:', error);
    return res.status(500).json({ error: 'Failed to search files' });
  }
}

async function handleCreateFolder(req: NextApiRequest, res: NextApiResponse, name: string, parentId: string) {
  try {
    const metadata: any = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId && parentId !== 'root') {
      metadata.parents = [parentId];
    }

    const response = await drive.files.create({
      requestBody: metadata,
      fields: 'id, name, mimeType, modifiedTime, webViewLink, parents',
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    return res.status(500).json({ error: 'Failed to create folder' });
  }
}

async function handleGetAccessToken(req: NextApiRequest, res: NextApiResponse) {
  // Service account handles authentication automatically
  return res.status(200).json({
    access_token: 'service_account_authenticated',
    expires_in: 3600,
    token_type: 'Bearer'
  });
}

/* 
🎉 REAL GOOGLE DRIVE INTEGRATION ACTIVE!

This API now connects directly to your Google Drive using the service account:
projectmanagement@projectmanagement-463423.iam.gserviceaccount.com

Features:
✅ List files and folders from your actual Google Drive
✅ Search files across your Drive
✅ Create new folders
✅ No individual user authentication required
✅ Everyone accesses the same shared Google Drive

To add more functionality, you can extend this API with:
- File upload (drive.files.create with media)
- File download (drive.files.get with alt='media')
- File deletion (drive.files.delete)
- Permission management (drive.permissions)

*/ 