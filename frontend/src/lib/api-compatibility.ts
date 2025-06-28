import { supabaseDb, supabaseAuth, supabase } from './supabase';
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
    const { user, error } = await supabaseAuth.getUser();
    if (error) {
      console.error('Authentication error:', error);
      return null;
    }
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
      throw new Error(`Failed to add project member: ${String(error)}`);
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
      throw new Error(`Failed to remove project member: ${String(error)}`);
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
    try {
    const { data, error } = await supabaseDb.deleteTask(id);
      if (error) {
        console.error('Error in deleteTask:', error);
        
        // Provide more specific error messages
        const errorMessage = String(error);
        if (errorMessage.includes('not found')) {
          throw new Error('Task not found or already deleted');
        } else if (errorMessage.includes('Permission denied')) {
          throw new Error('You do not have permission to delete this task');
        } else if (errorMessage.includes('Authentication required')) {
          throw new Error('Please log in to delete tasks');
        } else {
          throw new Error(`Failed to delete task: ${errorMessage}`);
        }
      }
    return data;
    } catch (error) {
      console.error('Exception in taskService.deleteTask:', error);
      throw error;
    }
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

export async function uploadMultipleToDrive(
  files: File[], 
  folderId: string, 
  onProgress?: (uploaded: number, total: number, currentFile: string) => void
): Promise<any[]> {
  try {
    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Call progress callback if provided
      if (onProgress) {
        onProgress(i, files.length, file.name);
      }
      
      const result = await googleDriveServiceAccount.uploadFile(file, folderId);
      results.push(result);
    }
    
    // Final progress callback
    if (onProgress) {
      onProgress(files.length, files.length, 'Complete');
    }
    
    return results;
  } catch (error) {
    console.error('Error uploading multiple files to drive:', error);
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

// Todo service for managing project todo items
export const todoService = {
  async getTodos(projectId: number) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return [];
      }
      
      // Verify user has access to this project
      await supabaseDb.getProject(projectId, userId);
      
      // Query todo_items table (simplified schema)
      const { data, error } = await supabase.from('todo_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match component interface (simplified)
      return (data || []).map((todo: any) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        due_date: todo.due_date,
        created_at: todo.created_at,
        updated_at: todo.updated_at,
        project_id: todo.project_id,
        created_by: {
          id: todo.created_by,
          name: 'User',
          email: 'user@example.com'
        }
      }));
    } catch (error) {
      console.error('Error in getTodos:', error);
      return [];
    }
  },

  async createTodo(projectId: number, todoData: any) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      // Verify user has access to this project
      await supabaseDb.getProject(projectId, userId);
      
      const { data, error } = await supabase.from('todo_items')
        .insert([{
          project_id: projectId,
          title: todoData.title,
          description: todoData.description || null,
          due_date: todoData.due_date || null,
          created_by: userId,
          completed: false
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        project_id: data.project_id,
        created_by: {
          id: userId,
          name: 'Current User',
          email: 'user@example.com'
        }
      };
    } catch (error) {
      console.error('Error in createTodo:', error);
      throw error;
    }
  },

  async updateTodo(todoId: number, todoData: any) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase.from('todo_items')
        .update({
          title: todoData.title,
          description: todoData.description || null,
          due_date: todoData.due_date || null,
          completed: todoData.completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)
        .eq('created_by', userId) // Only allow updating own todos
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        project_id: data.project_id,
        created_by: {
          id: userId,
          name: 'Current User',
          email: 'user@example.com'
        }
      };
    } catch (error) {
      console.error('Error in updateTodo:', error);
      throw error;
    }
  },

  async deleteTodo(todoId: number) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      // First check if the todo exists and user owns it
      const { data: existingTodo, error: fetchError } = await supabase.from('todo_items')
        .select('id, created_by')
        .eq('id', todoId)
        .single();
      
      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Todo item not found or already deleted');
        }
        throw new Error(`Failed to find todo: ${fetchError.message}`);
      }
      
      if (existingTodo.created_by !== userId) {
        throw new Error('You can only delete your own todo items');
      }
      
      const { error } = await supabase.from('todo_items')
        .delete()
        .eq('id', todoId)
        .eq('created_by', userId); // Double check ownership
      
      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete todo: ${error.message}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in deleteTodo:', error);
      throw error;
    }
  },

  async toggleTodoComplete(todoId: number, completed: boolean) {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('Authentication required');
      }
      
      const { data, error } = await supabase.from('todo_items')
        .update({
          completed: completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', todoId)
        .eq('created_by', userId) // Only allow updating own todos
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description,
        completed: data.completed,
        due_date: data.due_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        project_id: data.project_id,
        created_by: {
          id: userId,
          name: 'Current User',
          email: 'user@example.com'
        }
      };
    } catch (error) {
      console.error('Error in toggleTodoComplete:', error);
      throw error;
    }
  }
};

// Reporting service - Implemented with Supabase data - Project-based access control
export const reportingService = {
  getTeamKpiReport: async () => {
    try {
      // Get current user to check their project access
      const userId = await getCurrentUserId();
      if (!userId) {
        console.log('No authentication found, returning empty report');
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

      console.log('Fetching team KPI report for user:', userId);

      // Get projects user has access to
      const { data: userProjects, error: projectsError } = await supabaseDb.getProjects(userId);
      if (projectsError) {
        console.error('Projects error:', projectsError);
        throw projectsError;
      }

      const accessibleProjects = userProjects || [];
      const accessibleProjectIds = accessibleProjects.map(p => p.id);

      if (accessibleProjectIds.length === 0) {
        console.log('User has no accessible projects');
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

      // Get tasks only from accessible projects
      const { data: allTasks, error: tasksError } = await supabaseDb.getTasks();
      if (tasksError) {
        console.error('Tasks error:', tasksError);
        throw tasksError;
      }

      // Filter tasks to only those from accessible projects
      const accessibleTasks = (allTasks || []).filter(task => 
        accessibleProjectIds.includes(task.project_id)
      );

             // Get all team members from accessible projects
       const accessibleTeamMemberIds = new Set();
       accessibleProjects.forEach((project: any) => {
         if (project.members) {
           project.members.forEach((member: any) => accessibleTeamMemberIds.add(member.id));
         }
       });

      // Get user details for accessible team members
      const { data: allUsers, error: usersError } = await supabaseDb.getUsers();
      if (usersError) {
        console.error('Users error:', usersError);
        throw usersError;
      }

      // Filter users to only those who are members of accessible projects
      const accessibleUsers = (allUsers || []).filter(user => 
        accessibleTeamMemberIds.has(user.id)
      );

      // Calculate summary metrics for accessible projects only
      const totalProjects = accessibleProjects.length;
      const activeProjects = accessibleProjects.filter((p: any) => !p.is_archived).length;
      const completedProjects = accessibleProjects.filter((p: any) => p.status === 'completed').length;

      const totalTasks = accessibleTasks.length;
      const completedTasks = accessibleTasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
      const inProgressTasks = accessibleTasks.filter((t: any) => t.status === 'in-progress' || t.status === 'in_progress').length;
      const overdueCount = accessibleTasks.filter((t: any) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const now = new Date();
        return dueDate < now && t.status !== 'done' && t.status !== 'completed';
      }).length;

      // Calculate team report by accessible users only
      const teamReport = accessibleUsers.map((user: any) => {
              const userTasks = accessibleTasks.filter((t: any) => {
        // Handle multiple assignees (assignee_ids array)
        if (t.assignee_ids && Array.isArray(t.assignee_ids)) {
          return t.assignee_ids.includes(user.id);
        }
        // Fallback: check if user created the task
        return t.created_by === user.id || t.created_by_id === user.id;
      });
        
        const finishedTasks = userTasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
        const unfinishedTasks = userTasks.filter((t: any) => t.status !== 'done' && t.status !== 'completed').length;
        const overdueTasks = userTasks.filter((t: any) => {
          if (!t.due_date) return false;
          const dueDate = new Date(t.due_date);
          const now = new Date();
          return dueDate < now && t.status !== 'done' && t.status !== 'completed';
        }).length;

        // Count projects from accessible projects only
        const userAccessibleProjects = new Set();
        userTasks.forEach((task: any) => {
          if (task.project_id && accessibleProjectIds.includes(task.project_id)) {
            userAccessibleProjects.add(task.project_id);
          }
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
          active_projects: userAccessibleProjects.size,
          completion_rate: completionRate,
          total_tasks: userTasks.length
        };
      });

      const averageCompletionRate = teamReport.length > 0
        ? Math.round(teamReport.reduce((sum, member) => sum + member.completion_rate, 0) / teamReport.length)
        : 0;

      const result = {
        summary: {
          total_team_members: accessibleUsers.length,
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

      console.log('Successfully generated project-filtered team KPI report:', result);
      return result;
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
      console.log('Fetching member detailed report for user:', userId);

      // Get current user to check their project access
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        throw new Error('Authentication required to view member details');
      }

      // Get projects current user has access to
      const { data: userProjects, error: projectsError } = await supabaseDb.getProjects(currentUserId);
      if (projectsError) throw projectsError;

      const accessibleProjects = userProjects || [];
      const accessibleProjectIds = accessibleProjects.map(p => p.id);

      if (accessibleProjectIds.length === 0) {
        throw new Error('You have no accessible projects to view team member details');
      }

             // Verify the target user is in accessible projects
       const targetUserInAccessibleProjects = accessibleProjects.some((project: any) => 
         project.members && project.members.some((member: any) => member.id === userId)
       );

      if (!targetUserInAccessibleProjects) {
        throw new Error('You can only view details for team members in your shared projects');
      }

      // Get user info using existing method
      const { data: users, error: usersError } = await supabaseDb.getUsers();
      if (usersError) throw usersError;
      
      const user = (users || []).find((u: any) => u.id === userId);
      if (!user) throw new Error('User not found');

      // Get all tasks using existing method
      const { data: allTasks, error: tasksError } = await supabaseDb.getTasks();
      if (tasksError) throw tasksError;

      // Filter tasks to only those from accessible projects
      const accessibleTasks = (allTasks || []).filter(task => 
        accessibleProjectIds.includes(task.project_id)
      );

      const userTasks = accessibleTasks.filter((t: any) => {
        // Handle multiple assignees (assignee_ids array)
        if (t.assignee_ids && Array.isArray(t.assignee_ids)) {
          return t.assignee_ids.includes(userId);
        }
        // Fallback: check if user created the task
        return t.created_by === userId || t.created_by_id === userId;
      });

      // Separate overdue tasks for detailed view
      const overdueTasks = userTasks.filter((t: any) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        const now = new Date();
        return dueDate < now && t.status !== 'done' && t.status !== 'completed';
      });

      // Use accessible projects for project involvement
      const userProjectInvolvement = accessibleProjects.filter((p: any) => {
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
          completed_tasks: userTasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length,
          in_progress_tasks: userTasks.filter((t: any) => t.status === 'in-progress' || t.status === 'in_progress').length,
          todo_tasks: userTasks.filter((t: any) => t.status === 'todo' || t.status === 'pending').length,
          overdue_tasks: overdueTasks.length
        },
        overdue_task_details: overdueTasks.map((task: any) => ({
          id: task.id,
          name: task.name,
          project_name: accessibleProjects.find((p: any) => p.id === task.project_id)?.name || 'Unknown Project',
          due_date: task.due_date,
          priority: task.priority || 'medium',
          days_overdue: Math.ceil((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
        })),
        project_involvement: userProjectInvolvement.map((project: any) => ({
          id: project.id,
          name: project.name,
          task_count: userTasks.filter((t: any) => t.project_id === project.id).length,
          completed_in_project: userTasks.filter((t: any) => 
            t.project_id === project.id && (t.status === 'done' || t.status === 'completed')
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