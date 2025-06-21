import { supabaseDb } from '@/lib/supabase';

// Compatibility layer for existing components to use Supabase instead of Django backend
export const authService = {
  register: async (userData: {
    email: string;
    name: string;
    phone?: string;
    role?: string;
    position?: string;
    password: string;
    password_confirm: string;
  }) => {
    // This will be handled by AuthContext now
    throw new Error('Use AuthContext.register instead');
  },

  login: async (credentials: { email: string; password: string }) => {
    // This will be handled by AuthContext now
    throw new Error('Use AuthContext.login instead');
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
  getProjects: async () => {
    const { data, error } = await supabaseDb.getProjects();
    if (error) throw new Error(error.message);
    return data || [];
  },

  getProject: async (id: number) => {
    const { data, error } = await supabaseDb.getProject(id);
    if (error) throw new Error(error.message);
    return data;
  },

  createProject: async (projectData: {
    name: string;
    description?: string;
    project_type?: string;
    start_date?: string;
    due_date?: string;
    color?: string;
    member_ids?: number[];
  }) => {
    const { data, error } = await supabaseDb.createProject({
      name: projectData.name,
      description: projectData.description || '',
      project_type: projectData.project_type || 'general',
      start_date: projectData.start_date,
      due_date: projectData.due_date,
      color: projectData.color || '#3b82f6',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return data;
  },

  updateProject: async (
    id: number,
    projectData: {
      name?: string;
      description?: string;
      project_type?: string;
      status?: string;
      start_date?: string;
      due_date?: string;
      color?: string;
      member_ids?: number[];
    }
  ) => {
    const updateData = { 
      ...projectData, 
      updated_at: new Date().toISOString() 
    };
    const { data, error } = await supabaseDb.updateProject(id, updateData);
    if (error) throw new Error(error.message);
    return data;
  },

  deleteProject: async (id: number) => {
    const { data, error } = await supabaseDb.deleteProject(id);
    if (error) throw new Error(error.message);
    return data;
  },

  getUsers: async () => {
    const { data, error } = await supabaseDb.getUsers();
    if (error) throw new Error(error.message);
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

export const taskService = {
  getProjectTasks: async (projectId: number) => {
    const { data, error } = await supabaseDb.getTasks(projectId);
    if (error) throw new Error(error.message);
    return data || [];
  },

  getTask: async (id: number) => {
    const { data, error } = await supabaseDb.getTasks();
    if (error) throw new Error(error.message);
    const task = data?.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    return task;
  },

  createTask: async (projectId: number, taskData: {
    name: string;
    description?: string;
    assignee_id?: number;
    priority?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    parent_task?: number;
    tags?: string;
  }) => {
    const { data, error } = await supabaseDb.createTask({
      project_id: projectId,
      name: taskData.name,
      description: taskData.description || '',
      assignee_id: taskData.assignee_id,
      priority: taskData.priority || 'medium',
      status: 'todo',
      due_date: taskData.due_date,
      start_date: taskData.start_date,
      estimated_hours: taskData.estimated_hours || 0,
      actual_hours: 0,
      tags: taskData.tags || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return data;
  },

  updateTask: async (
    id: number,
    taskData: {
      name?: string;
      description?: string;
      assignee_id?: number;
      status?: string;
      priority?: string;
      due_date?: string;
      start_date?: string;
      estimated_hours?: number;
      actual_hours?: number;
      tags?: string;
      position?: number;
    }
  ) => {
    const updateData = { 
      ...taskData, 
      updated_at: new Date().toISOString() 
    };
    const { data, error } = await supabaseDb.updateTask(id, updateData);
    if (error) throw new Error(error.message);
    return data;
  },

  deleteTask: async (id: number) => {
    const { data, error } = await supabaseDb.deleteTask(id);
    if (error) throw new Error(error.message);
    return data;
  },

  updateTaskStatus: async (id: number, status: string) => {
    const { data, error } = await supabaseDb.updateTask(id, { 
      status,
      updated_at: new Date().toISOString() 
    });
    if (error) throw new Error(error.message);
    return data;
  },

  reorderTasks: async (taskOrders: { id: number; position: number }[]) => {
    // TODO: Implement task reordering
    throw new Error('Task reordering not implemented with Supabase yet');
  },

  getUserTasks: async () => {
    // TODO: Implement user-specific tasks filtering
    const { data, error } = await supabaseDb.getTasks();
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Task Comments - TODO: Implement
  getTaskComments: async (taskId: number) => {
    return [];
  },

  createTaskComment: async (taskId: number, commentData: { comment: string }) => {
    throw new Error('Task comments not implemented with Supabase yet');
  },

  updateTaskComment: async (commentId: number, commentData: { comment: string }) => {
    throw new Error('Task comments not implemented with Supabase yet');
  },

  deleteTaskComment: async (commentId: number) => {
    throw new Error('Task comments not implemented with Supabase yet');
  },

  // Task Attachments - TODO: Implement
  getTaskAttachments: async (taskId: number) => {
    return [];
  },

  uploadTaskAttachment: async (taskId: number, file: File) => {
    throw new Error('Task attachments not implemented with Supabase yet');
  },

  deleteTaskAttachment: async (attachmentId: number) => {
    throw new Error('Task attachments not implemented with Supabase yet');
  },
};

export const meetingService = {
  getMeetings: async () => {
    const { data, error } = await supabaseDb.getMeetings();
    if (error) throw new Error(error.message);
    return data || [];
  },

  getMeeting: async (id: number) => {
    const { data, error } = await supabaseDb.getMeetings();
    if (error) throw new Error(error.message);
    const meeting = data?.find(m => m.id === id);
    if (!meeting) throw new Error('Meeting not found');
    return meeting;
  },

  createMeeting: async (meetingData: {
    title: string;
    description?: string;
    project: number;
    date: string;
    time: string;
    duration?: number;
    attendees?: string;
    attendee_ids?: number[];
  }) => {
    const { data, error } = await supabaseDb.createMeeting({
      title: meetingData.title,
      description: meetingData.description || '',
      project_id: meetingData.project,
      date: meetingData.date,
      time: meetingData.time,
      duration: meetingData.duration || 60,
      attendees: meetingData.attendees || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    if (error) throw new Error(error.message);
    return data;
  },

  updateMeeting: async (
    id: number,
    meetingData: {
      title?: string;
      description?: string;
      project?: number;
      date?: string;
      time?: string;
      duration?: number;
      attendees?: string;
      attendee_ids?: number[];
    }
  ) => {
    const updateData = {
      ...(meetingData.title && { title: meetingData.title }),
      ...(meetingData.description && { description: meetingData.description }),
      ...(meetingData.project && { project_id: meetingData.project }),
      ...(meetingData.date && { date: meetingData.date }),
      ...(meetingData.time && { time: meetingData.time }),
      ...(meetingData.duration && { duration: meetingData.duration }),
      ...(meetingData.attendees && { attendees: meetingData.attendees }),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabaseDb.updateMeeting(id, updateData);
    if (error) throw new Error(error.message);
    return data;
  },

  deleteMeeting: async (id: number) => {
    const { data, error } = await supabaseDb.deleteMeeting(id);
    if (error) throw new Error(error.message);
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