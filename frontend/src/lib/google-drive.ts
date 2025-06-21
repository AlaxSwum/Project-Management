// Google Drive API integration using Google APIs JavaScript SDK
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

class GoogleDriveService {
  private initialized = false;
  private accessToken: string | null = null;

  // Google API configuration
  private readonly CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  private readonly API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || '';
  private readonly DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
  private readonly SCOPES = 'https://www.googleapis.com/auth/drive.file';

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load Google API library
      if (!window.gapi) {
        await this.loadGoogleAPI();
      }

      // Initialize gapi
      await new Promise((resolve, reject) => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: this.API_KEY,
              clientId: this.CLIENT_ID,
              discoveryDocs: this.DISCOVERY_DOCS,
              scope: this.SCOPES
            });
            
            this.initialized = true;
            resolve(void 0);
          } catch (error) {
            reject(error);
          }
        });
      });

      console.log('Google Drive API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<void> {
    await this.initialize();
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn();
    this.accessToken = user.getAuthResponse().access_token;
    
    console.log('Google Drive authentication successful');
  }

  async signOut(): Promise<void> {
    if (!this.initialized) return;
    
    const authInstance = window.gapi.auth2.getAuthInstance();
    await authInstance.signOut();
    this.accessToken = null;
    
    console.log('Google Drive sign out successful');
  }

  async isSignedIn(): Promise<boolean> {
    try {
      await this.initialize();
      const authInstance = window.gapi.auth2.getAuthInstance();
      return authInstance.isSignedIn.get();
    } catch (error) {
      return false;
    }
  }

  async listFiles(folderId: string | null = null): Promise<DriveFile[]> {
    try {
      await this.initialize();
      
      if (!await this.isSignedIn()) {
        await this.signIn();
      }

      let query = "trashed = false";
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      const response = await window.gapi.client.drive.files.list({
        q: query,
        pageSize: 100,
        fields: 'nextPageToken, files(id, name, mimeType, parents, modifiedTime, size, webViewLink)',
        orderBy: 'folder,name'
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
      
      if (!await this.isSignedIn()) {
        await this.signIn();
      }

      const searchQuery = `name contains '${query}' and trashed = false`;

      const response = await window.gapi.client.drive.files.list({
        q: searchQuery,
        pageSize: 50,
        fields: 'files(id, name, mimeType, parents, modifiedTime, size, webViewLink)',
        orderBy: 'folder,name'
      });

      return response.result.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }

  async createFolder(name: string, parentId: string | null = null): Promise<DriveFile> {
    try {
      await this.initialize();
      
      if (!await this.isSignedIn()) {
        await this.signIn();
      }

      const fileMetadata: any = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentId) {
        fileMetadata.parents = [parentId];
      }

      const response = await window.gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, mimeType, parents, modifiedTime, webViewLink'
      });

      return response.result;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async uploadFile(file: File, folderId: string | null = null): Promise<DriveFile> {
    try {
      await this.initialize();
      
      if (!await this.isSignedIn()) {
        await this.signIn();
      }

      const fileMetadata: any = {
        name: file.name,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,parents,modifiedTime,size,webViewLink', {
        method: 'POST',
        headers: new Headers({
          'Authorization': `Bearer ${this.accessToken}`
        }),
        body: form
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
}

// Create a singleton instance
const googleDriveService = new GoogleDriveService();

export default googleDriveService; 