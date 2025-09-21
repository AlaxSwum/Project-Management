// API proxy for Google Drive operations using service account
// This handles all Google Drive operations on the server side
// No individual user authentication required

import { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

// Configure body parser for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb', // Allow much larger file uploads
    },
  },
};

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
      
      case 'uploadFile':
        return handleUploadFile(req, res);
      
      case 'getAccessToken':
        return handleGetAccessToken(req, res);
      
      case 'testAuth':
        return handleTestAuth(req, res);
      
      case 'listSharedDrives':
        return handleListSharedDrives(req, res);
      
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
    console.log('🔍 DEBUG: Attempting to list files for folder:', folderId || 'root');
    
    let query;
    let listOptions: any = {
      fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents, shared, ownedByMe, driveId)',
      orderBy: 'folder,name'
    };

    if (!folderId || folderId === 'root') {
      // For root folder, show both owned files and shared files, including shared drives
      query = `trashed=false and (sharedWithMe=true or 'root' in parents)`;
      console.log('🔍 DEBUG: Using root query to include shared folders and drives');
      listOptions.includeItemsFromAllDrives = true;
      listOptions.supportsAllDrives = true;
    } else {
      // For specific folder, list its contents
      query = `'${folderId}' in parents and trashed=false`;
      
      // Check if this folder is in a shared drive
      try {
        const folderInfo = await drive.files.get({ 
          fileId: folderId,
          fields: 'driveId',
          supportsAllDrives: true
        });
        
        if (folderInfo.data.driveId) {
          console.log('🔍 DEBUG: Listing files in shared drive:', folderInfo.data.driveId);
          listOptions.includeItemsFromAllDrives = true;
          listOptions.supportsAllDrives = true;
        }
      } catch (folderError) {
        console.log('🔍 DEBUG: Folder not in shared drive or not accessible');
      }
    }
    
    listOptions.q = query;
    console.log('🔍 DEBUG: Using query:', query);
    console.log('🔍 DEBUG: List options:', listOptions);
    
    const response = await drive.files.list(listOptions);

    const files = response.data.files || [];
    console.log('🔍 DEBUG: Found', files.length, 'files');
    console.log('🔍 DEBUG: Files:', files.map(f => ({ 
      name: f.name, 
      type: f.mimeType, 
      shared: f.shared, 
      ownedByMe: f.ownedByMe,
      driveId: f.driveId 
    })));
    
    return res.status(200).json({ files });
  } catch (error) {
    console.error('❌ ERROR listing files:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ ERROR details:', errorMessage);
    return res.status(500).json({ 
      error: 'Failed to list files',
      details: errorMessage,
      debug: true 
    });
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

    let createOptions: any = {
      requestBody: metadata,
      fields: 'id, name, mimeType, modifiedTime, webViewLink, parents, driveId',
    };

    if (parentId && parentId !== 'root') {
      metadata.parents = [parentId];
      
      // Check if parent is in a shared drive
      try {
        const parentInfo = await drive.files.get({ 
          fileId: parentId,
          fields: 'driveId',
          supportsAllDrives: true
        });
        
        if (parentInfo.data.driveId) {
          console.log('🔍 DEBUG: Creating folder in shared drive:', parentInfo.data.driveId);
          createOptions.supportsAllDrives = true;
        }
      } catch (parentError) {
        console.log('🔍 DEBUG: Parent not in shared drive or not accessible');
      }
    }

    const response = await drive.files.create(createOptions);

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error creating folder:', error);
    
    // Check for storage quota error
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      if (apiError.response?.status === 403 && 
          apiError.response?.data?.error?.errors?.some((e: any) => 
            e.reason === 'storageQuotaExceeded' || e.reason === 'quotaExceeded'
          )) {
        return res.status(403).json({
          error: 'Service Account Storage Limitation',
          details: 'Service accounts cannot create folders in regular Google Drive. Please use Google Shared Drives instead.',
          solution: 'Convert your Google Drive folders to Shared Drives (Team Drives) to enable folder creation.',
          documentation: 'https://developers.google.com/workspace/drive/api/guides/about-shareddrives'
        });
      }
    }
    
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

async function handleTestAuth(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 DEBUG: Testing service account authentication...');
    
    // Test 1: Get user info (should return service account info)
    const aboutResponse = await drive.about.get({ fields: 'user' });
    console.log('🔍 DEBUG: Service account user:', aboutResponse.data.user);
    
    // Test 2: Try to list all files (including shared ones)
    const allFilesResponse = await drive.files.list({
      q: 'trashed=false',
      fields: 'files(id, name, mimeType, parents, shared, ownedByMe)',
      pageSize: 10
    });
    
    console.log('🔍 DEBUG: Found', allFilesResponse.data.files?.length, 'total files');
    console.log('🔍 DEBUG: Files:', allFilesResponse.data.files?.map(f => ({ 
      name: f.name, 
      type: f.mimeType, 
      shared: f.shared, 
      ownedByMe: f.ownedByMe 
    })));
    
    return res.status(200).json({
      success: true,
      serviceAccount: aboutResponse.data.user,
      totalFiles: allFilesResponse.data.files?.length || 0,
      files: allFilesResponse.data.files?.slice(0, 5) // First 5 files for debugging
    });
  } catch (error) {
    console.error('❌ ERROR testing auth:', error);
    return res.status(500).json({ 
      error: 'Auth test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

async function handleUploadFile(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { fileName, fileData, mimeType, parentId } = req.body;
    
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'File name and data are required' });
    }

    console.log('🔍 DEBUG: Upload file request:', { 
      fileName, 
      mimeType, 
      parentId,
      dataSize: fileData.length 
    });

    // Create file metadata
    const metadata: any = {
      name: fileName,
    };

    if (parentId && parentId !== 'root') {
      metadata.parents = [parentId];
    }

    // Convert base64 to buffer
    const fileBuffer = Buffer.from(fileData, 'base64');
    
    console.log('🔍 DEBUG: File buffer size:', fileBuffer.length);

    // Create a proper readable stream from the buffer
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    console.log('🔍 DEBUG: About to upload to Google Drive...');

    // Validate parent folder exists if specified
    if (parentId && parentId !== 'root') {
      try {
        const folderInfo = await drive.files.get({ 
          fileId: parentId,
          fields: 'id, name, mimeType, parents, driveId'
        });
        console.log('🔍 DEBUG: Parent folder info:', folderInfo.data);
        
        // Check if this is a shared drive
        if (folderInfo.data.driveId) {
          console.log('🔍 DEBUG: Uploading to shared drive:', folderInfo.data.driveId);
          metadata.driveId = folderInfo.data.driveId;
        }
      } catch (folderError) {
        console.error('❌ ERROR: Parent folder not accessible:', folderError);
        return res.status(400).json({ 
          error: 'Parent folder not found or not accessible',
          details: 'Please make sure the folder is shared with the service account',
          parentId 
        });
      }
    }

    // Upload to Google Drive with timeout
    const uploadTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000);
    });

    const uploadOptions: any = {
      requestBody: metadata,
      media: {
        mimeType: mimeType || 'application/octet-stream',
        body: bufferStream,
      },
      fields: 'id, name, mimeType, modifiedTime, size, webViewLink, parents',
    };

    // If uploading to a shared drive, add the supportsAllDrives parameter
    if (metadata.driveId) {
      uploadOptions.supportsAllDrives = true;
    }

    const uploadPromise = drive.files.create(uploadOptions);

    const response: any = await Promise.race([uploadPromise, uploadTimeout]);

    console.log('✅ File uploaded successfully:', response.data);
    return res.status(200).json(response.data);
    
  } catch (error) {
    console.error('❌ ERROR uploading file:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    
    // Check for specific Google API errors
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as any;
      console.error('❌ Google API Error:', apiError.response?.data);
      console.error('❌ Google API Status:', apiError.response?.status);
      console.error('❌ Google API Headers:', apiError.response?.headers);
      
      // Check for storage quota error
      if (apiError.response?.status === 403 && 
          apiError.response?.data?.error?.errors?.some((e: any) => 
            e.reason === 'storageQuotaExceeded' || e.reason === 'quotaExceeded'
          )) {
        return res.status(403).json({
          error: 'Service Account Storage Limitation',
          details: 'Service accounts cannot upload to regular Google Drive folders. Please use Google Shared Drives instead.',
          solution: 'Convert your Google Drive folders to Shared Drives (Team Drives) to enable uploads.',
          documentation: 'https://developers.google.com/workspace/drive/api/guides/about-shareddrives'
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to upload file',
      details: error instanceof Error ? error.message : String(error),
      debug: {
        fileName: req.body.fileName,
        mimeType: req.body.mimeType,
        parentId: req.body.parentId,
        bufferSize: req.body.fileData ? Buffer.from(req.body.fileData, 'base64').length : 0
      }
    });
  }
}

async function handleListSharedDrives(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('🔍 DEBUG: Listing shared drives...');
    
    const response = await drive.drives.list({
      fields: 'nextPageToken, drives(id, name, createdTime, capabilities)'
    });

    const drives = response.data.drives || [];
    console.log('🔍 DEBUG: Found', drives.length, 'shared drives');
    console.log('🔍 DEBUG: Shared drives:', drives.map(d => ({ name: d.name, id: d.id })));
    
    return res.status(200).json({ drives });
  } catch (error) {
    console.error('❌ ERROR listing shared drives:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ ERROR details:', errorMessage);
    return res.status(500).json({ 
      error: 'Failed to list shared drives',
      details: errorMessage,
      debug: true 
    });
  }
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