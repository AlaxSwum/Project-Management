import { supabaseDb, supabaseAuth } from './supabase';

// Enhanced task data transformation
const transformTaskData = (task: any) => ({
  ...task,
  tags_list: task.tags ? task.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
});

// Transform array of tasks
const transformTasksData = (tasks: any[]) => tasks.map(transformTaskData);

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
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    const { data, error } = await supabaseDb.getProjects(userId);
    if (error) throw error;
    return data || [];
  },

  async getProject(id: number) {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    const { data, error } = await supabaseDb.getProject(id, userId);
    if (error) throw error;
    return data;
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
    const { data, error } = await supabaseDb.getUsers();
    if (error) throw error;
    return data || [];
  },

  getUserProjects: async () => {
    // This is the same as getProjects now with access control
    return await projectService.getProjects();
  },

  // Project Members - TODO: Implement properly
  getProjectMembers: async (projectId: number) => {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    const { data, error } = await supabaseDb.getProject(projectId, userId);
    if (error) throw error;
    return data?.project_members || [];
  },

  addProjectMember: async (projectId: number, userId: number) => {
    // TODO: Implement project member management
    throw new Error('Project member management not implemented with Supabase yet');
  },

  removeProjectMember: async (projectId: number, userId: number) => {
    // TODO: Implement project member management
    throw new Error('Project member management not implemented with Supabase yet');
  },
};

// Task service with automatic tags_list transformation
export const taskService = {
  async getTasks(projectId?: number) {
    // If projectId is provided, verify user has access to that project
    if (projectId) {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      // Verify access to the specific project
      await supabaseDb.getProject(projectId, userId); // This will throw if no access
    }
    
    const { data, error } = await supabaseDb.getTasks(projectId);
    if (error) throw error;
    return transformTasksData(data || []);
  },

  async getProjectTasks(projectId: number) {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    // Verify user has access to this project
    await supabaseDb.getProject(projectId, userId); // This will throw if no access
    
    const { data, error } = await supabaseDb.getTasks(projectId);
    if (error) throw error;
    return transformTasksData(data || []);
  },

  async getUserTasks() {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error('Authentication required');
    }
    
    const { data, error } = await supabaseDb.getUserTasks(userId);
    if (error) throw error;
    return transformTasksData(data || []);
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
    // TODO: Add task-level access control - verify user can see this task
    // Return empty array for now since comments aren't implemented
    return [];
  },

  async createTaskComment(taskId: number, commentData: any) {
    // TODO: Add task-level access control - verify user can comment on this task
    const userId = await getCurrentUserId();
    const user = await supabaseAuth.getUser();
    
    // Return mock comment that satisfies both Comment and TaskComment interfaces
    return {
      id: Date.now(),
      comment: commentData.comment,
      user: { 
        id: userId || 1, 
        name: user.user?.user_metadata?.name || 'Current User', 
        email: user.user?.email || 'user@example.com', 
        role: user.user?.user_metadata?.role || 'member' 
      },
      author: user.user?.user_metadata?.name || 'Current User',
      author_email: user.user?.email || 'user@example.com',
      created_at: new Date().toISOString(),
      task_id: taskId
    };
  },

  async getTaskAttachments(taskId: number) {
    // TODO: Add task-level access control - verify user can see this task
    // Return empty array for now since attachments aren't implemented
    return [];
  },

  async uploadTaskAttachment(taskId: number, file: File) {
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
  }
};

// Meeting service
export const meetingService = {
  async getMeetings() {
    const { data, error } = await supabaseDb.getMeetings();
    if (error) throw error;
    return data || [];
  },

  async getMeeting(id: number) {
    const { data, error } = await supabaseDb.getMeetings();
    if (error) throw new Error(error.message);
    const meeting = data?.find(m => m.id === id);
    if (!meeting) throw new Error('Meeting not found');
    return meeting;
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
    const { data, error } = await supabaseDb.getMeetings();
    if (error) throw new Error(error.message);
    return data?.filter(m => m.project_id === projectId) || [];
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

// Google Drive service - TODO: Implement
export const listDriveFiles = async (folderId: string | null = null) => {
  throw new Error('Google Drive integration not implemented with Supabase yet');
};

export const searchDriveFiles = async (query: string) => {
  throw new Error('Google Drive integration not implemented with Supabase yet');
};

export const uploadToDrive = async (file: File, folderId: string | null = null) => {
  throw new Error('Google Drive integration not implemented with Supabase yet');
};

export const createDriveFolder = async (name: string, parentId: string | null = null) => {
  throw new Error('Google Drive integration not implemented with Supabase yet');
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