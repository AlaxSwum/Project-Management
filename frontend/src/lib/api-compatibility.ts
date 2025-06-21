import { supabaseDb, supabaseAuth } from './supabase';

// Enhanced task data transformation
const transformTaskData = (task: any) => ({
  ...task,
  tags_list: task.tags ? task.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
});

// Transform array of tasks
const transformTasksData = (tasks: any[]) => tasks.map(transformTaskData);

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
    const { data, error } = await supabaseDb.getProjects();
    if (error) throw error;
    return data || [];
  },

  async getProject(id: number) {
    const { data, error } = await supabaseDb.getProject(id);
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
    // TODO: Implement user-specific projects filtering
    const { data, error } = await supabaseDb.getProjects();
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Project Members - TODO: Implement properly
  getProjectMembers: async (projectId: number) => {
    const { data, error } = await supabaseDb.getProject(projectId);
    if (error) throw new Error(error.message);
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
    const { data, error } = await supabaseDb.getTasks(projectId);
    if (error) throw error;
    return transformTasksData(data || []);
  },

  async getProjectTasks(projectId: number) {
    const { data, error } = await supabaseDb.getTasks(projectId);
    if (error) throw error;
    return transformTasksData(data || []);
  },

  async getUserTasks() {
    const { data, error } = await supabaseDb.getUserTasks(1); // Using user ID 1 as fallback
    if (error) throw error;
    return transformTasksData(data || []);
  },

  async createTask(projectId: number, taskData: any) {
    const { data, error } = await supabaseDb.createTask({
      ...taskData,
      project_id: projectId
    });
    if (error) throw error;
    return transformTaskData(data);
  },

  async updateTask(id: number, taskData: any) {
    const { data, error } = await supabaseDb.updateTask(id, taskData);
    if (error) throw error;
    return transformTaskData(data);
  },

  async updateTaskStatus(id: number, status: string) {
    const { data, error } = await supabaseDb.updateTask(id, { status });
    if (error) throw error;
    return transformTaskData(data);
  },

  async deleteTask(id: number) {
    const { data, error } = await supabaseDb.deleteTask(id);
    if (error) throw error;
    return data;
  },

  async getTaskComments(taskId: number) {
    // Return empty array for now since comments aren't implemented
    return [];
  },

  async createTaskComment(taskId: number, commentData: any) {
    // Return mock comment that satisfies both Comment and TaskComment interfaces
    return {
      id: Date.now(),
      comment: commentData.comment,
      user: { id: 1, name: 'Current User', email: 'user@example.com', role: 'member' },
      author: 'Current User',
      author_email: 'user@example.com',
      created_at: new Date().toISOString(),
      task_id: taskId
    };
  },

  async getTaskAttachments(taskId: number) {
    // Return empty array for now since attachments aren't implemented
    return [];
  },

  async uploadTaskAttachment(taskId: number, file: File) {
    // Return mock attachment for now
    return {
      id: Date.now(),
      file: file.name,
      filename: file.name,
      user: { id: 1, name: 'Current User', email: 'user@example.com', role: 'member' },
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