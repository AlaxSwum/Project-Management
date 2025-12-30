import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://127.0.0.1:8000/api/auth';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create auth axios instance
const authApi = axios.create({
  baseURL: AUTH_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await authApi.post('/token/refresh/', {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('accessToken', access);
          
          // Update the authorization header for the retry
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API functions
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
    const response = await authApi.post('/register/', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await authApi.post('/login/', credentials);
    return response.data;
  },

  getProfile: async () => {
    // Use the main api instance which has the auth interceptor
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData: any) => {
    // Use the main api instance which has the auth interceptor
    const response = await api.put('/auth/profile/update/', userData);
    return response.data;
  },
};

// Project API functions
export const projectService = {
  getProjects: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  getProject: async (id: number) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
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
    const response = await api.post('/projects/', projectData);
    return response.data;
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
    const response = await api.put(`/projects/${id}/`, projectData);
    return response.data;
  },

  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  getUserProjects: async () => {
    const response = await api.get('/my-projects/');
    return response.data;
  },

  // Project Members
  getProjectMembers: async (projectId: number) => {
    const response = await api.get(`/projects/${projectId}/members/`);
    return response.data;
  },

  addProjectMember: async (projectId: number, userId: number) => {
    const response = await api.post(`/projects/${projectId}/members/`, { user_id: userId });
    return response.data;
  },

  removeProjectMember: async (projectId: number, userId: number) => {
    const response = await api.delete(`/projects/${projectId}/members/${userId}/`);
    return response.data;
  },
};

// Task API functions
export const taskService = {
  getProjectTasks: async (projectId: number) => {
    const response = await api.get(`/projects/${projectId}/tasks/`);
    return response.data;
  },

  getTask: async (id: number) => {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  createTask: async (projectId: number, taskData: {
    name: string;
    description?: string;
    assignee_ids?: number[];
    priority?: string;
    due_date?: string;
    start_date?: string;
    estimated_hours?: number;
    parent_task?: number;
    tags?: string;
  }) => {
    const response = await api.post(`/projects/${projectId}/tasks/`, taskData);
    return response.data;
  },

  updateTask: async (
    id: number,
    taskData: {
      name?: string;
      description?: string;
      assignee_ids?: number[];
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
    const response = await api.put(`/tasks/${id}/`, taskData);
    return response.data;
  },

  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },

  updateTaskStatus: async (id: number, status: string) => {
    const response = await api.post(`/tasks/${id}/status/`, { status });
    return response.data;
  },

  reorderTasks: async (taskOrders: { id: number; position: number }[]) => {
    const response = await api.post('/tasks/reorder/', { task_orders: taskOrders });
    return response.data;
  },

  getUserTasks: async () => {
    const response = await api.get('/my-tasks/');
    return response.data;
  },

  // Task Comments
  getTaskComments: async (taskId: number) => {
    const response = await api.get(`/tasks/${taskId}/comments/`);
    return response.data;
  },

  createTaskComment: async (taskId: number, commentData: { comment: string }) => {
    const response = await api.post(`/tasks/${taskId}/comments/`, commentData);
    return response.data;
  },

  updateTaskComment: async (commentId: number, commentData: { comment: string }) => {
    const response = await api.put(`/comments/${commentId}/`, commentData);
    return response.data;
  },

  deleteTaskComment: async (commentId: number) => {
    const response = await api.delete(`/comments/${commentId}/`);
    return response.data;
  },

  // Task Attachments
  getTaskAttachments: async (taskId: number) => {
    const response = await api.get(`/tasks/${taskId}/attachments/`);
    return response.data;
  },

  uploadTaskAttachment: async (taskId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    const response = await api.post(`/tasks/${taskId}/attachments/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteTaskAttachment: async (attachmentId: number) => {
    const response = await api.delete(`/attachments/${attachmentId}/`);
    return response.data;
  },
};

// Template API functions
export const templateService = {
  getTemplates: async () => {
    const response = await api.get('/templates/');
    return response.data;
  },

  createProjectFromTemplate: async (templateId: number, projectData: {
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    member_ids?: number[];
  }) => {
    const response = await api.post(`/templates/${templateId}/create-project/`, projectData);
    return response.data;
  },
};

// Google Drive API Functions
export const listDriveFiles = async (folderId: string | null = null) => {
  try {
    const response = await api.get(`/drive/files/${folderId ? `?folderId=${folderId}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error listing drive files:', error);
    throw error;
  }
};

export const searchDriveFiles = async (query: string) => {
  try {
    const response = await api.get(`/drive/search/?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching drive files:', error);
    throw error;
  }
};

export const uploadToDrive = async (file: File, folderId: string | null = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folderId', folderId);

  try {
    const response = await api.post('/drive/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading to drive:', error);
    throw error;
  }
};

export const createDriveFolder = async (name: string, parentId: string | null = null) => {
  try {
    const response = await api.post('/drive/create-folder/', { name, parentId });
    return response.data;
  } catch (error) {
    console.error('Error creating drive folder:', error);
    throw error;
  }
};

// Team Reporting API Functions
export const reportingService = {
  getTeamKpiReport: async () => {
    try {
      const response = await api.get('/reporting/team-kpi/');
      return response.data;
    } catch (error) {
      console.error('Error fetching team KPI report:', error);
      throw error;
    }
  },

  getMemberDetailedReport: async (userId: number) => {
    try {
      const response = await api.get(`/reporting/member/${userId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching member detailed report:', error);
      throw error;
    }
  },

  getTeamPerformanceAnalytics: async () => {
    try {
      const response = await api.get('/reporting/analytics/');
      return response.data;
    } catch (error) {
      console.error('Error fetching team performance analytics:', error);
      throw error;
    }
  }
};

// Meeting API Functions
export const meetingService = {
  getMeetings: async () => {
    try {
      const response = await api.get('/meetings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      throw error;
    }
  },

  getMeeting: async (id: number) => {
    try {
      const response = await api.get(`/meetings/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching meeting:', error);
      throw error;
    }
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
    try {
      const response = await api.post('/meetings/', meetingData);
      return response.data;
    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
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
    try {
      const response = await api.put(`/meetings/${id}/`, meetingData);
      return response.data;
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  },

  deleteMeeting: async (id: number) => {
    try {
      const response = await api.delete(`/meetings/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  },

  getProjectMeetings: async (projectId: number) => {
    try {
      const response = await api.get(`/projects/${projectId}/meetings/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching project meetings:', error);
      throw error;
    }
  },
};

// User service for compatibility
export const userService = {
  getUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  }
};

export default api; 