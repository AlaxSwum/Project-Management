// Google Drive Service Account Integration
// This allows everyone to access Google Drive without individual authentication
// Uses a service account instead of user OAuth

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

class GoogleDriveServiceAccount {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  // Service account credentials (will be configured via environment variables)
  private getCredentials(): ServiceAccountCredentials | null {
    try {
      // Check if service account credentials are configured
      const serviceAccountJson = process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_JSON;
      if (serviceAccountJson) {
        return JSON.parse(serviceAccountJson);
      }
      
      // Fallback: check individual environment variables
      const privateKey = process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY;
      const clientEmail = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL;
      const projectId = process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID;
      
      if (privateKey && clientEmail && projectId) {
        return {
          type: "service_account",
          project_id: projectId,
          private_key_id: "",
          private_key: privateKey.replace(/\\n/g, '\n'),
          client_email: clientEmail,
          client_id: "",
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing service account credentials:', error);
      return null;
    }
  }

  // Get access token using service account
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = this.getCredentials();
    if (!credentials) {
      throw new Error('Service account credentials not configured. Please set up Google Service Account.');
    }

    try {
      // Create JWT assertion
      const header = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const now = Math.floor(Date.now() / 1000);
      const payload = {
        iss: credentials.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // For now, we'll use the simpler approach with API key
      // In production, you would implement proper JWT signing
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getAccessToken',
          credentials: credentials
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early

      return this.accessToken || '';
    } catch (error) {
      console.error('Error getting service account access token:', error);
      throw error;
    }
  }

  // List files using service account
  async listFiles(folderId: string = 'root'): Promise<DriveFile[]> {
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'listFiles',
          folderId: folderId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to list files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Search files using service account
  async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'searchFiles',
          query: query
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to search files: ${response.statusText}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  // Upload file using service account
  async uploadFile(file: File, parentId: string = 'root'): Promise<DriveFile> {
    try {
      // Convert file to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'uploadFile',
          fileName: file.name,
          fileData: base64Data,
          mimeType: file.type,
          parentId: parentId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Create folder using service account
  async createFolder(name: string, parentId: string = 'root'): Promise<DriveFile> {
    try {
      const response = await fetch('/api/google-drive-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createFolder',
          name: name,
          parentId: parentId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create folder: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  // List shared drives using service account
  async listSharedDrives(): Promise<any[]> {
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

      if (!response.ok) {
        throw new Error(`Failed to list shared drives: ${response.statusText}`);
      }

      const data = await response.json();
      return data.drives || [];
    } catch (error) {
      console.error('Error listing shared drives:', error);
      throw error;
    }
  }

  // Check if service account is configured
  isConfigured(): boolean {
    const credentials = this.getCredentials();
    return credentials !== null;
  }

  // Get setup instructions
  getSetupInstructions(): string {
    return `
To set up Google Drive Service Account access:

1. Go to Google Cloud Console (https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create a Service Account:
   - Go to IAM & Admin > Service Accounts
   - Create Service Account
   - Download the JSON key file
5. Share your Google Drive folders with the service account email
6. Configure environment variables:
   - NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_JSON=[full JSON content]
   OR
   - NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL=[service account email]
   - NEXT_PUBLIC_GOOGLE_PRIVATE_KEY=[private key]
   - NEXT_PUBLIC_GOOGLE_PROJECT_ID=[project ID]

This allows everyone to access Google Drive without individual authentication.
    `.trim();
  }
}

// Export singleton instance
export const googleDriveServiceAccount = new GoogleDriveServiceAccount();
export default googleDriveServiceAccount; 