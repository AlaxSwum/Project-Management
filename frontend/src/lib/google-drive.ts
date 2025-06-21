// Google Drive API integration service
// This provides direct Google Drive API access for file management

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink: string;
  parents?: string[];
}

class GoogleDriveService {
  private isInitialized = false;
  private gapi: any;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Check if gapi is already loaded
      if (typeof window !== 'undefined' && (window as any).gapi) {
        this.gapi = (window as any).gapi;
      } else {
        // Load Google API script if not already loaded
        await this.loadGoogleAPI();
      }

      await this.gapi.load('client', async () => {
        await this.gapi.client.init({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google API can only be loaded in browser environment'));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.gapi = (window as any).gapi;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.warn('Google Client ID not configured');
        return false;
      }

      // Ensure we're on client side
      if (typeof window === 'undefined') {
        console.warn('Authentication can only be performed on client side');
        return false;
      }

      // Wait for Google Identity Services to load
      let attempts = 0;
      while (!(window as any).google && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      if (!(window as any).google) {
        console.error('Google Identity Services not loaded');
        return false;
      }

      // Use Google Identity Services for authentication
      return new Promise((resolve) => {
        try {
          const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive',
            callback: (tokenResponse: any) => {
              console.log('Token response received:', tokenResponse);
              if (tokenResponse.access_token) {
                this.gapi.client.setToken(tokenResponse);
                console.log('Access token set successfully');
                resolve(true);
              } else if (tokenResponse.error) {
                console.error('OAuth error:', tokenResponse.error);
                resolve(false);
              } else {
                console.warn('No access token received');
                resolve(false);
              }
            },
          });
          
          console.log('Requesting access token...');
          tokenClient.requestAccessToken();
        } catch (error) {
          console.error('Token client initialization failed:', error);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async listFiles(folderId: string | null = null): Promise<DriveFile[]> {
    try {
      await this.initialize();

      let query = "trashed=false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      } else {
        query += " and 'root' in parents";
      }

      const response = await this.gapi.client.drive.files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents)',
        orderBy: 'folder,name',
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  async searchFiles(query: string): Promise<DriveFile[]> {
    try {
      await this.initialize();

      const searchQuery = `name contains '${query}' and trashed=false`;

      const response = await this.gapi.client.drive.files.list({
        q: searchQuery,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, parents)',
        orderBy: 'folder,name',
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  async uploadFile(file: File, parentId: string | null = null): Promise<DriveFile> {
    try {
      await this.initialize();

      const metadata: any = {
        name: file.name,
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.gapi.client.getToken().access_token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async createFolder(name: string, parentId: string | null = null): Promise<DriveFile> {
    try {
      await this.initialize();

      const metadata: any = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentId) {
        metadata.parents = [parentId];
      }

      const response = await this.gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id, name, mimeType, modifiedTime, webViewLink, parents',
      });

      return response.result;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.initialize();

      await this.gapi.client.drive.files.delete({
        fileId,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getFileMetadata(fileId: string): Promise<DriveFile> {
    try {
      await this.initialize();

      const response = await this.gapi.client.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, modifiedTime, size, webViewLink, parents',
      });

      return response.result;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const googleDriveService = new GoogleDriveService();
export default googleDriveService; 