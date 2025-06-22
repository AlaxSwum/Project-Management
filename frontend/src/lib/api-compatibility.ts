import { supabaseDb, supabaseAuth } from './supabase';
import googleDriveServiceAccount from './google-drive-service-account';
import { driveAccessControl } from './google-drive-access-control';

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
      return Array.isArray(data?.members) ? data.members : [];
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
      if (error) throw new Error(String(error) || 'Failed to fetch meetings');
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
      if (error) throw new Error(String(error) || 'Failed to fetch meetings');
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
    if (error) throw new Error(String(error) || 'Failed to fetch users');
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

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  modifiedTime: string;
  size?: string;
  webViewLink: string;
}

// Google Drive API functions using service account (no individual authentication required)
export async function listDriveFiles(folderId: string | null = null): Promise<DriveFile[]> {
  try {
    // Use service account - no individual authentication needed
    const files = await googleDriveServiceAccount.listFiles(folderId || 'root');
    
    // Apply access control filtering if restrictions are configured
    return driveAccessControl.filterAccessibleFiles(files);
  } catch (error) {
    console.error('Error listing drive files:', error);
    throw error;
  }
}

export async function searchDriveFiles(query: string): Promise<DriveFile[]> {
  try {
    // Use service account - no individual authentication needed
    const files = await googleDriveServiceAccount.searchFiles(query);
    
    // Filter search results based on access control rules
    return driveAccessControl.filterAccessibleFiles(files);
  } catch (error) {
    console.error('Error searching drive files:', error);
    throw error;
  }
}

export async function uploadToDrive(file: File, folderId: string): Promise<any> {
  try {
    // Use service account - no individual authentication needed
    return await googleDriveServiceAccount.uploadFile(file, folderId);
  } catch (error) {
    console.error('Error uploading to drive:', error);
    throw error;
  }
}

export async function createDriveFolder(name: string, parentId: string | null = null): Promise<any> {
  try {
    // Use service account - no individual authentication needed
    return await googleDriveServiceAccount.createFolder(name, parentId || 'root');
  } catch (error) {
    console.error('Error creating drive folder:', error);
    throw error;
  }
}

// Reporting service - Implemented with Supabase data
export const reportingService = {
  getTeamKpiReport: async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }

      // Get projects user has access to
      const { data: projects, error: projectsError } = await supabaseDb.getProjects(userId);
      if (projectsError) throw projectsError;

      // Get all tasks from accessible projects
      const { data: allTasks, error: tasksError } = await supabaseDb.getTasks();
      if (tasksError) throw tasksError;

      // Get all users
      const { data: users, error: usersError } = await supabaseDb.getUsers();
      if (usersError) throw usersError;

      const accessibleProjects = projects || [];
      const tasks = allTasks || [];
      const allUsers = users || [];

      // Calculate summary metrics
      const totalProjects = accessibleProjects.length;
      const activeProjects = accessibleProjects.filter((p: any) => !p.is_archived).length;
      const completedProjects = accessibleProjects.filter((p: any) => p.status === 'completed').length;

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
      const inProgressTasks = tasks.filter((t: any) => t.status === 'in-progress').length;
      const overdueCount = tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const now = new Date();
        return dueDate < now && t.status !== 'done';
      }).length;

      // Calculate team report by user
      const teamReport = allUsers.map((user: any) => {
        const userTasks = tasks.filter((t: any) => 
          t.assignee_id === user.id || t.created_by === user.id
        );
        
        const finishedTasks = userTasks.filter((t: any) => t.status === 'done').length;
        const unfinishedTasks = userTasks.filter((t: any) => t.status !== 'done').length;
        const overdueTasks = userTasks.filter((t: any) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          const now = new Date();
          return dueDate < now && t.status !== 'done';
        }).length;

        const userProjects = new Set();
        userTasks.forEach((task: any) => {
          if (task.project_id) userProjects.add(task.project_id);
        });

        const completionRate = userTasks.length > 0 
          ? Math.round((finishedTasks / userTasks.length) * 100) 
          : 0;

        return {
          user_id: user.id,
          user_name: user.name || user.email?.split('@')[0] || 'Unknown User',
          user_email: user.email,
          user_role: user.role || 'member',
          user_position: user.position || user.role || 'Team Member',
          finished_tasks: finishedTasks,
          unfinished_tasks: unfinishedTasks,
          overdue_tasks: overdueTasks,
          active_projects: userProjects.size,
          completion_rate: completionRate,
          total_tasks: userTasks.length
        };
      });

      const averageCompletionRate = teamReport.length > 0
        ? Math.round(teamReport.reduce((sum, member) => sum + member.completion_rate, 0) / teamReport.length)
        : 0;

      return {
        summary: {
          total_team_members: allUsers.length,
          average_completion_rate: averageCompletionRate,
          total_tasks_across_team: totalTasks,
          total_finished_tasks: completedTasks,
          total_projects: totalProjects,
          active_projects: activeProjects,
          completed_projects: completedProjects,
          overdue_tasks: overdueCount
        },
        team_report: teamReport
      };
    } catch (error) {
      console.error('Error in getTeamKpiReport:', error);
      // Return fallback data to prevent crashes
      return {
        summary: {
          total_team_members: 0,
          average_completion_rate: 0,
          total_tasks_across_team: 0,
          total_finished_tasks: 0,
          total_projects: 0,
          active_projects: 0,
          completed_projects: 0,
          overdue_tasks: 0
        },
        team_report: []
      };
    }
  },

  getMemberDetailedReport: async (userId: number) => {
    try {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Authentication required');
      }

      // Get user info
      const { data: users, error: usersError } = await supabaseDb.getUsers();
      if (usersError) throw usersError;
      
      const user = (users || []).find((u: any) => u.id === userId);
      if (!user) throw new Error('User not found');

      // Get all tasks for this user
      const { data: allTasks, error: tasksError } = await supabaseDb.getTasks();
      if (tasksError) throw tasksError;

      const userTasks = (allTasks || []).filter((t: any) => 
        t.assignee_id === userId || t.created_by === userId
      );

      // Separate overdue tasks for detailed view
      const overdueTasks = userTasks.filter((t: any) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const now = new Date();
        return dueDate < now && t.status !== 'done';
      });

      // Get projects info
      const { data: projects, error: projectsError } = await supabaseDb.getProjects(currentUserId);
      if (projectsError) throw projectsError;

      const userProjects = (projects || []).filter((p: any) => {
        return userTasks.some((t: any) => t.project_id === p.id);
      });

      return {
        user_info: {
          id: user.id,
          name: user.name || user.email?.split('@')[0] || 'Unknown User',
          email: user.email,
          role: user.role || 'member',
          position: user.position || user.role || 'Team Member'
        },
        task_summary: {
          total_tasks: userTasks.length,
          completed_tasks: userTasks.filter((t: any) => t.status === 'done').length,
          in_progress_tasks: userTasks.filter((t: any) => t.status === 'in-progress').length,
          todo_tasks: userTasks.filter((t: any) => t.status === 'todo').length,
          overdue_tasks: overdueTasks.length
        },
        overdue_task_details: overdueTasks.map((task: any) => ({
          id: task.id,
          name: task.name,
          project_name: userProjects.find((p: any) => p.id === task.project_id)?.name || 'Unknown Project',
          due_date: task.due_date,
          priority: task.priority || 'medium',
          days_overdue: Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
        })),
        project_involvement: userProjects.map((project: any) => ({
          id: project.id,
          name: project.name,
          task_count: userTasks.filter((t: any) => t.project_id === project.id).length,
          completed_in_project: userTasks.filter((t: any) => 
            t.project_id === project.id && t.status === 'done'
          ).length
        }))
      };
    } catch (error) {
      console.error('Error in getMemberDetailedReport:', error);
      throw error;
    }
  },

  getTeamPerformanceAnalytics: async () => {
    try {
      // Return basic analytics structure for now
      return {
        performance_trend: [],
        productivity_metrics: {},
        team_workload: []
      };
    } catch (error) {
      console.error('Error in getTeamPerformanceAnalytics:', error);
      return {
        performance_trend: [],
        productivity_metrics: {},
        team_workload: []
      };
    }
  }
}; 