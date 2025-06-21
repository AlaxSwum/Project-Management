// Google Drive Access Control Configuration
// Configure which folders users can access

interface AccessControlConfig {
  // Allowed folder IDs - users can only access these folders and their subfolders
  allowedFolderIds: string[];
  
  // Allowed folder names - alternative to IDs for easier configuration
  allowedFolderNames: string[];
  
  // Whether to allow root access (if false, users can't see root folder)
  allowRootAccess: boolean;
  
  // Default folder to redirect to if root access is denied
  defaultFolderId?: string;
}

// Configuration - For internal use with full access
const ACCESS_CONFIG: AccessControlConfig = {
  // No folder restrictions - everyone can access all folders
  allowedFolderIds: [],
  
  // No folder name restrictions - everyone can access all folders  
  allowedFolderNames: [],
  
  // Full root access - everyone can browse entire Google Drive
  allowRootAccess: true,
  
  // No default folder needed - full access
  defaultFolderId: undefined
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

export class GoogleDriveAccessControl {
  private config: AccessControlConfig;
  
  constructor(config?: Partial<AccessControlConfig>) {
    this.config = { ...ACCESS_CONFIG, ...config };
  }
  
  /**
   * Check if user can access a specific folder
   */
  canAccessFolder(folderId: string, folderName?: string): boolean {
    // Always allow access if no restrictions are set
    if (this.config.allowedFolderIds.length === 0 && this.config.allowedFolderNames.length === 0) {
      return true;
    }
    
    // Check root access
    if (folderId === 'root' || folderId === null) {
      return this.config.allowRootAccess;
    }
    
    // Check if folder ID is explicitly allowed
    if (this.config.allowedFolderIds.includes(folderId)) {
      return true;
    }
    
    // Check if folder name is allowed
    if (folderName && this.config.allowedFolderNames.includes(folderName)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Filter drive files to only show accessible ones
   */
  filterAccessibleFiles(files: DriveFile[]): DriveFile[] {
    return files.filter(file => {
      // Always show non-folder files in allowed directories
      if (file.mimeType !== 'application/vnd.google-apps.folder') {
        return true;
      }
      
      // For folders, check if they're accessible
      return this.canAccessFolder(file.id, file.name);
    });
  }
  
  /**
   * Get the folder ID to use (handles root access restrictions)
   */
  getAccessibleFolderId(requestedFolderId: string | null): string | null {
    // If root access is denied and no specific folder requested, use default
    if (!requestedFolderId && !this.config.allowRootAccess && this.config.defaultFolderId) {
      return this.config.defaultFolderId;
    }
    
    return requestedFolderId;
  }
  
  /**
   * Get user-friendly error message for access denied
   */
  getAccessDeniedMessage(folderId: string): string {
    if (folderId === 'root') {
      return 'Access to root folder is restricted. Please use the designated project folders.';
    }
    
    return 'Access to this folder is restricted. Please contact your project administrator.';
  }
  
  /**
   * Update access configuration
   */
  updateConfig(config: Partial<AccessControlConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get current configuration
   */
  getConfig(): AccessControlConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const driveAccessControl = new GoogleDriveAccessControl();

// Export configuration for easy modification
export { ACCESS_CONFIG }; 