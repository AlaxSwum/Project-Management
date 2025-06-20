import { supabaseDb, supabaseAuth } from './supabase';

// Enhanced task data transformation
const transformTaskData = (task: any) => {
  if (!task || typeof task !== 'object') {
    return {
      id: 0,
      name: 'Unknown Task',
      description: '',
      tags_list: []
    };
  }
  
  return {
    ...task,
    tags_list: task.tags ? task.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
  };
};

// Transform array of tasks - handle undefined/null data
const transformTasksData = (tasks: any[]) => {
  if (!tasks || !Array.isArray(tasks)) {
    return [];
  }
  return tasks.map(transformTaskData);
};

// Helper function to get current user ID
const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const { user } = await supabaseAuth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('Failed to get current user ID:', error);
    return null;
  }
};

// Compatibility layer for existing components to use Supabase instead of Django backend
export const authService = {
  async login(email: string, password: string) {
    const { user, error } = await supabaseAuth.signIn(email, password);
    if (error) throw error;
    return user;
  },

  async register(userData: any) {
    const { user, error } = await supabaseAuth.signUp(userData);
    if (error) throw error;
    return user;
  },

  async logout() {
    const { error } = await supabaseAuth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { user, error } = await supabaseAuth.getUser();
    if (error) throw error;
    return user;
  },

  getProfile: async () => {
    // This will be handled by AuthContext now
    throw new Error('Use AuthContext user instead');
  },

  updateProfile: async (userData: any) => {
    // TODO: Implement user profile updates in Supabase
    throw new Error('Profile updates not implemented with Supabase yet');
  },
};

export const projectService = {
  async getProjects() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log('No user ID found, returning empty array');
        return [];
      }
      const { data, error } = await supabaseDb.getProjects(userId);
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getProjects:', error);
      return []; // Return empty array on error to prevent crashes
    }
  },

  async getProject(id: number) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      const { data, error } = await supabaseDb.getProject(id, userId);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in getProject:', error);
      throw error; // Re-throw to maintain error handling in components
    }
  },

  async createProject(projectData: any) {
    const { data, error } = await supabaseDb.createProject(projectData);
    if (error) throw error;
    return data;
  },

  async updateProject(id: number, projectData: any) {
    const { data, error } = await supabaseDb.updateProject(id, projectData);
    if (error) throw error;
    return data;
  },

  async deleteProject(id: number) {
    const { data, error } = await supabaseDb.deleteProject(id);
    if (error) throw error;
    return data;
  },

  async getUsers() {
    try {
      const { data, error } = await supabaseDb.getUsers();
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getUsers:', error);
      return [];
    }
  },

  getUserProjects: async () => {
    // This is the same as getProjects now with access control
    return await projectService.getProjects();
  },

  // Project Members
  getProjectMembers: async (projectId: number) => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }
      const { data, error } = await supabaseDb.getProject(projectId, userId);
      if (error) return [];
      return Array.isArray(data?.project_members) ? data.project_members : [];
    } catch (error) {
      console.error('Error in getProjectMembers:', error);
      return [];
    }
  },

  addProjectMember: async (projectId: number, userId: number) => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Authentication required');
      }
      
      // Verify current user has access to this project
      await supabaseDb.getProject(projectId, currentUserId);
      
      const { data, error } = await supabaseDb.addProjectMember(projectId, userId);
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error in addProjectMember:', error);
      throw new Error(`Failed to add project member: ${error.message || error.toString()}`);
    }
  },

  removeProjectMember: async (projectId: number, userId: number) => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Authentication required');
      }
      
      // Verify current user has access to this project
      await supabaseDb.getProject(projectId, currentUserId);
      
      const { data, error } = await supabaseDb.removeProjectMember(projectId, userId);
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error in removeProjectMember:', error);
      throw new Error(`Failed to remove project member: ${error.message || error.toString()}`);
    }
  },
};

// Task service with automatic tags_list transformation
export const taskService = {
  async getTasks(projectId?: number) {
    try {
      // If projectId is provided, verify user has access to that project
      if (projectId) {
        const userId = await getCurrentUserId();
        if (!userId) {
          return [];
        }
        // Verify access to the specific project
        await supabaseDb.getProject(projectId, userId); // This will throw if no access
      }
      
      const { data, error } = await supabaseDb.getTasks(projectId);
      if (error) throw error;
      return transformTasksData(data || []);
    } catch (error) {
      console.error('Error in getTasks:', error);
      return []; // Return empty array on error
    }
  },

  async getProjectTasks(projectId: number) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }
      
      // Verify user has access to this project
      await supabaseDb.getProject(projectId, userId); // This will throw if no access
      
      const { data, error } = await supabaseDb.getTasks(projectId);
      if (error) throw error;
      return transformTasksData(data || []);
    } catch (error) {
      console.error('Error in getProjectTasks:', error);
      return []; // Return empty array on error
    }
  },

  async getUserTasks() {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }
      
      const { data, error } = await supabaseDb.getUserTasks(userId);
      if (error) throw error;
      return transformTasksData(data || []);
    } catch (error) {
      console.error('Error in getUserTasks:', error);
      return []; // Return empty array on error
    }
  },

  async createTask(projectId: number, taskData: any) {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    // Verify user has access to this project
    await supabaseDb.getProject(projectId, userId); // This will throw if no access
    
    const { data, error } = await supabaseDb.createTask({
      ...taskData,
      project_id: projectId
    });
    if (error) throw error;
    return transformTaskData(data);
  },

  async updateTask(id: number, taskData: any) {
    // TODO: Add task-level access control - verify user can edit this task
    const { data, error } = await supabaseDb.updateTask(id, taskData);
    if (error) throw error;
    return transformTaskData(data);
  },

  async updateTaskStatus(id: number, status: string) {
    // TODO: Add task-level access control - verify user can edit this task
    const { data, error } = await supabaseDb.updateTask(id, { status });
    if (error) throw error;
    return transformTaskData(data);
  },

  async deleteTask(id: number) {
    // TODO: Add task-level access control - verify user can delete this task
    const { data, error } = await supabaseDb.deleteTask(id);
    if (error) throw error;
    return data;
  },

  async getTaskComments(taskId: number) {
    try {
      // TODO: Add task-level access control - verify user can see this task
      const { data, error } = await supabaseDb.getTaskComments(taskId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getTaskComments:', error);
      return [];
    }
  },

  async createTaskComment(taskId: number, commentData: any) {
    try {
      // TODO: Add task-level access control - verify user can comment on this task
      const { data, error } = await supabaseDb.createTaskComment(taskId, commentData);
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in createTaskComment:', error);
      throw error;
    }
  },

  async getTaskAttachments(taskId: number) {
    // TODO: Add task-level access control - verify user can see this task
    // Return empty array for now since attachments aren't implemented
    return [];
  },

  async uploadTaskAttachment(taskId: number, file: File) {
    try {
      // TODO: Add task-level access control - verify user can upload to this task
      const userId = await getCurrentUserId();
      const user = await supabaseAuth.getUser();
      
      // Return mock attachment for now
      return {
        id: Date.now(),
        file: file.name,
        filename: file.name,
        user: { 
          id: userId || 1, 
          name: user.user?.user_metadata?.name || 'Current User', 
          email: user.user?.email || 'user@example.com', 
          role: user.user?.user_metadata?.role || 'member' 
        },
        created_at: new Date().toISOString(),
        file_size: file.size
      };
    } catch (error) {
      console.error('Error in uploadTaskAttachment:', error);
      throw error;
    }
  }
};

// Meeting service
export const meetingService = {
  async getMeetings() {
    try {
      const { data, error } = await supabaseDb.getMeetings();
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error in getMeetings:', error);
      return [];
    }
  },

  async getMeeting(id: number) {
    try {
      const { data, error } = await supabaseDb.getMeetings();
      if (error) throw new Error(error.message);
      const meeting = Array.isArray(data) ? data.find(m => m.id === id) : null;
      if (!meeting) throw new Error('Meeting not found');
      return meeting;
    } catch (error) {
      console.error('Error in getMeeting:', error);
      throw error;
    }
  },

  async createMeeting(meetingData: any) {
    const { data, error } = await supabaseDb.createMeeting(meetingData);
    if (error) throw error;
    return data;
  },

  async updateMeeting(id: number, meetingData: any) {
    const { data, error } = await supabaseDb.updateMeeting(id, meetingData);
    if (error) throw error;
    return data;
  },

  async deleteMeeting(id: number) {
    const { data, error } = await supabaseDb.deleteMeeting(id);
    if (error) throw error;
    return data;
  },

  getProjectMeetings: async (projectId: number) => {
    try {
      const { data, error } = await supabaseDb.getMeetings();
      if (error) throw new Error(error.message);
      return Array.isArray(data) ? data.filter(m => m.project_id === projectId) : [];
    } catch (error) {
      console.error('Error in getProjectMeetings:', error);
      return [];
    }
  },
};

// User service for compatibility
export const userService = {
  getUsers: async () => {
    const { data, error } = await supabaseDb.getUsers();
    if (error) throw new Error(error.message);
    return data || [];
  }
};

// Template service - TODO: Implement with Supabase
export const templateService = {
  getTemplates: async () => {
    return [];
  },

  createProjectFromTemplate: async (templateId: number, projectData: {
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    member_ids?: number[];
  }) => {
    throw new Error('Templates not implemented with Supabase yet');
  },
};

// Google Drive service - Google Drive API integration
import googleDriveService from './google-drive';

export const listDriveFiles = async (folderId: string | null = null) => {
  try {
    // Check if Google API credentials are configured
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY) {
      console.warn('Google Drive API credentials not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY environment variables.');
      
      // Return mock data when credentials are not configured
      return [
        {
          id: 'mock_folder1',
          name: 'Documents (Demo)',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: new Date().toISOString(),
          webViewLink: '#',
          parents: folderId ? [folderId] : undefined
        },
        {
          id: 'mock_file1',
          name: 'Sample Document.pdf (Demo)',
          mimeType: 'application/pdf',
          modifiedTime: new Date().toISOString(),
          size: '1024000',
          webViewLink: '#',
          parents: folderId ? [folderId] : undefined
        }
      ];
    }

    return await googleDriveService.listFiles(folderId);
  } catch (error) {
    console.error('Error listing drive files:', error);
    
    // Fallback to mock data on error
    return [
      {
        id: 'error_folder',
        name: 'Error: Could not connect to Google Drive',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date().toISOString(),
        webViewLink: '#',
        parents: folderId ? [folderId] : undefined
      }
    ];
  }
};

export const searchDriveFiles = async (query: string) => {
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY) {
      console.warn('Google Drive API credentials not configured');
      const mockFiles = await listDriveFiles();
      return mockFiles.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    return await googleDriveService.searchFiles(query);
  } catch (error) {
    console.error('Error searching drive files:', error);
    throw error;
  }
};

export const uploadToDrive = async (file: File, folderId: string | null = null) => {
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY) {
      console.warn('Google Drive API credentials not configured');
      
      // Return mock success response
      return {
        id: 'mock_uploaded_' + Date.now(),
        name: file.name + ' (Demo Upload)',
        mimeType: file.type,
        modifiedTime: new Date().toISOString(),
        size: file.size.toString(),
        webViewLink: '#',
        parents: folderId ? [folderId] : undefined
      };
    }

    return await googleDriveService.uploadFile(file, folderId);
  } catch (error) {
    console.error('Error uploading to drive:', error);
    throw error;
  }
};

export const createDriveFolder = async (name: string, parentId: string | null = null) => {
  try {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || !process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY) {
      console.warn('Google Drive API credentials not configured');
      
      // Return mock folder creation response
      return {
        id: 'mock_folder_' + Date.now(),
        name: name + ' (Demo Folder)',
        mimeType: 'application/vnd.google-apps.folder',
        modifiedTime: new Date().toISOString(),
        webViewLink: '#',
        parents: parentId ? [parentId] : undefined
      };
    }

    return await googleDriveService.createFolder(name, parentId);
  } catch (error) {
    console.error('Error creating drive folder:', error);
    throw error;
  }
};

// Reporting service - TODO: Implement with Supabase
export const reportingService = {
  getTeamKpiReport: async () => {
    return {
      total_projects: 0,
      active_projects: 0,
      completed_projects: 0,
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      team_members: 0
    };
  },

  getMemberDetailedReport: async (userId: number) => {
    return {
      user_id: userId,
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      overdue_tasks: 0,
      projects: []
    };
  },

  getTeamPerformanceAnalytics: async () => {
    return {
      performance_trend: [],
      productivity_metrics: {},
      team_workload: []
    };
  }
}; 