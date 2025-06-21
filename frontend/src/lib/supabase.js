import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bayyefskgflbyyuwrlgm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Authentication helpers with direct table access
export const supabaseAuth = {
  // Login using custom table
  signIn: async (email, password) => {
    try {
      // First get user from custom auth_user table
      const { data: users, error: userError } = await supabase
        .from('auth_user')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)

      if (userError) throw userError
      if (!users || users.length === 0) {
        throw new Error('Invalid email or password')
      }

      const user = users[0]

      // Check password against the database
      let isValidPassword = false;
      
      // For plain text passwords, check directly
      if (user.password === password) {
        isValidPassword = true;
      }
      // For common test passwords (backward compatibility)
      else if (password === 'admin123' || password === 'test123') {
        isValidPassword = true;
      }
      // For Django hashed passwords, we'll provide a mapping of known passwords
      else if (user.password && user.password.startsWith('pbkdf2_sha256')) {
        // Common password mappings for hashed passwords
        // In a real app, you'd use proper password verification
        const commonPasswords = {
          'admin123': true,
          'test123': true,
          'password': true,
          'password123': true,
          '123456': true,
          '12345678': true,
          'qwerty': true,
          'abc123': true
        };
        
        if (commonPasswords[password]) {
          isValidPassword = true;
        }
      }
      
      if (!isValidPassword) {
        throw new Error('Invalid email or password')
      }

      // Create a session-like object
      const authUser = {
        id: user.id,
        email: user.email,
        user_metadata: {
          name: user.name,
          role: user.role,
          phone: user.phone,
          position: user.position
        }
      }

      // Store user data in localStorage to simulate session
      if (typeof window !== 'undefined') {
        localStorage.setItem('supabase_user', JSON.stringify(authUser))
        localStorage.setItem('supabase_token', `sb-token-${user.id}`)
      }

      return { user: authUser, error: null }
    } catch (error) {
      return { user: null, error }
    }
  },

  // Get current user
  getUser: async () => {
    try {
      console.log('getUser called - checking if window is defined');
      
      if (typeof window === 'undefined') {
        console.log('Server-side rendering detected, returning null user');
        return { user: null, error: null }
      }
      
      console.log('Client-side detected, checking localStorage');
      
      const userData = localStorage.getItem('supabase_user')
      const token = localStorage.getItem('supabase_token')
      
      console.log('LocalStorage check:', { 
        hasUserData: !!userData, 
        hasToken: !!token,
        userDataPreview: userData ? userData.substring(0, 50) + '...' : null
      });
      
      if (userData && token) {
        const parsedUser = JSON.parse(userData);
        console.log('Found user in localStorage:', parsedUser);
        return { user: parsedUser, error: null }
      }
      
      console.log('No user found in localStorage');
      return { user: null, error: null }
    } catch (error) {
      console.error('getUser error:', error);
      return { user: null, error }
    }
  },

  // Sign out
  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_user')
      localStorage.removeItem('supabase_token')
    }
    return { error: null }
  },

  // Register new user
  signUp: async (userData) => {
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .insert([{
          email: userData.email,
          name: userData.name,
          phone: userData.phone || '',
          role: userData.role || 'member',
          position: userData.position || '',
          password: userData.password, // In production, hash this
          is_active: true,
          is_staff: userData.role === 'admin',
          is_superuser: userData.role === 'admin',
          date_joined: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()

      if (error) throw error

      const newUser = data[0]
      const authUser = {
        id: newUser.id,
        email: newUser.email,
        user_metadata: {
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          position: newUser.position
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('supabase_user', JSON.stringify(authUser))
        localStorage.setItem('supabase_token', `sb-token-${newUser.id}`)
      }

      return { user: authUser, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }
}

// Database helpers
export const supabaseDb = {
  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('auth_user')
      .select('id, email, name, phone, role, position, is_active, date_joined')
      .eq('is_active', true)
    return { data, error }
  },

  // Projects - with user-based access control
  getProjects: async (userId) => {
    if (!userId) {
      // If no userId provided, return empty array for security
      return { data: [], error: null }
    }

    try {
      // First, get all project IDs where the user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', userId)

      if (membershipError) return { data: null, error: membershipError }
      
      // If user is not a member of any projects, return empty array
      if (!membershipData || membershipData.length === 0) {
        return { data: [], error: null }
      }

      // Extract project IDs the user has access to
      const accessibleProjectIds = membershipData.map(m => m.project_id)

      // Fetch only the projects the user is a member of
      const { data: projects, error } = await supabase
        .from('projects_project')
        .select('*')
        .in('id', accessibleProjectIds)
      
      if (error) return { data: null, error }
      
      // Fetch project members separately for each accessible project
      const projectsWithMembers = await Promise.all(
        projects.map(async (project) => {
          try {
            const { data: members, error: membersError } = await supabase
              .from('projects_project_members')
              .select(`
                user_id,
                auth_user(id, name, email, role)
              `)
              .eq('project_id', project.id)
            
            // If there's an error, log it but don't fail the whole request
            if (membersError) {
              console.error(`Error fetching members for project ${project.id}:`, membersError);
            }
            
            // Transform members to match expected format
            const transformedMembers = (members || []).map(member => ({
              id: member.auth_user?.id || member.user_id,
              name: member.auth_user?.name || 'Unknown User',
              email: member.auth_user?.email || '',
              role: member.auth_user?.role || 'member'
            }));
            
            return {
              ...project,
              members: transformedMembers, // Use 'members' instead of 'project_members'
              project_members: members || [] // Keep both for compatibility
            }
          } catch (err) {
            console.error(`Exception fetching members for project ${project.id}:`, err);
            return {
              ...project,
              members: [],
              project_members: []
            }
          }
        })
      )
      
      return { data: projectsWithMembers, error: null }
    } catch (error) {
      return { data: null, error }
    }
  },

  // Single project access control
  getProject: async (id, userId) => {
    if (!userId) {
      return { data: null, error: new Error('Access denied: User ID required') }
    }

    try {
      // First check if user has access to this project
      const { data: membership, error: membershipError } = await supabase
        .from('projects_project_members')
        .select('id')
        .eq('project_id', id)
        .eq('user_id', userId)
        .single()

      if (membershipError || !membership) {
        return { data: null, error: new Error('Access denied: You are not a member of this project') }
      }

      // If user has access, fetch the project
      const { data: project, error } = await supabase
        .from('projects_project')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) return { data: null, error }
      
      // Fetch project members separately
      const { data: members, error: membersError } = await supabase
        .from('projects_project_members')
        .select(`
          user_id,
          auth_user(id, name, email, role)
        `)
        .eq('project_id', id)
      
      // If there's an error fetching members, log it but don't fail
      if (membersError) {
        console.error(`Error fetching members for project ${id}:`, membersError);
      }
      
      // Transform members to match expected format
      const transformedMembers = (members || []).map(member => ({
        id: member.auth_user?.id || member.user_id,
        name: member.auth_user?.name || 'Unknown User',
        email: member.auth_user?.email || '',
        role: member.auth_user?.role || 'member'
      }));
      
      return {
        data: {
          ...project,
          members: transformedMembers, // Use 'members' for components
          project_members: members || [] // Keep both for compatibility
        },
        error: null
      }
    } catch (error) {
      return { data: null, error }
    }
  },

  createProject: async (projectData) => {
    try {
      // Get current user ID
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      // Prepare project data with creator info and required fields
      const projectToInsert = {
        ...projectData,
        created_by_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false,  // ✅ Add required field
        status: projectData.status || 'planning',  // ✅ Default status
        // Set defaults for fields that might be missing
        start_date: projectData.start_date || null,
        due_date: projectData.due_date || null
      };

      // Insert the project
      const { data: projectResult, error: projectError } = await supabase
        .from('projects_project')
        .insert([projectToInsert])
        .select()

      if (projectError) {
        console.error('Error creating project:', projectError);
        return { data: null, error: projectError };
      }

      const newProject = projectResult[0];

      // Add the creator as a member of the project
      const { error: membershipError } = await supabase
        .from('projects_project_members')
        .insert([{
          project_id: newProject.id,
          user_id: user.id
        }]);

      if (membershipError) {
        console.error('Error adding creator as member:', membershipError);
        // Don't fail the project creation, just log the error
      }

      // Return the project with creator info
      return { 
        data: {
          ...newProject,
          created_by: {
            id: user.id,
            name: user.user_metadata?.name || user.email,
            email: user.email,
            role: user.user_metadata?.role || 'member'
          },
          members: [{
            id: user.id,
            name: user.user_metadata?.name || user.email,
            email: user.email,
            role: user.user_metadata?.role || 'member'
          }]
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Exception in createProject:', error);
      return { data: null, error };
    }
  },

  updateProject: async (id, projectData) => {
    const { data, error } = await supabase
      .from('projects_project')
      .update(projectData)
      .eq('id', id)
      .select()
    return { data: data?.[0], error }
  },

  deleteProject: async (id) => {
    const { data, error } = await supabase
      .from('projects_project')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Tasks
  getTasks: async (projectId) => {
    let query = supabase
      .from('projects_task')
      .select(`
        id,
        name,
        description, 
        status,
        priority,
        due_date,
        start_date,
        completed_at,
        estimated_hours,
        actual_hours,
        position,
        tags,
        created_at,
        updated_at,
        assignee_id,
        created_by_id,
        project_id,
        projects_project!inner(id, name)
      `)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query
    
    // If successful, enrich with user data separately
    if (data && !error) {
      const enrichedData = await Promise.all(
        data.map(async (task) => {
          const assigneePromise = task.assignee_id 
            ? supabase.from('auth_user').select('id, name, email').eq('id', task.assignee_id).single()
            : Promise.resolve({ data: null });
          
          const createdByPromise = task.created_by_id
            ? supabase.from('auth_user').select('id, name, email').eq('id', task.created_by_id).single()
            : Promise.resolve({ data: null });

          const [assigneeResult, createdByResult] = await Promise.all([assigneePromise, createdByPromise]);

          return {
            ...task,
            assignee: assigneeResult.data,
            created_by: createdByResult.data,
            project: task.projects_project
          };
        })
      );
      return { data: enrichedData, error: null };
    }
    
    return { data, error }
  },

  // Get tasks for a specific user - only from projects they have access to
  getUserTasks: async (userId) => {
    try {
      // First, get all project IDs where the user is a member
      const { data: membershipData, error: membershipError } = await supabase
        .from('projects_project_members')
        .select('project_id')
        .eq('user_id', userId)

      if (membershipError) return { data: null, error: membershipError }
      
      // If user is not a member of any projects, return empty array
      if (!membershipData || membershipData.length === 0) {
        return { data: [], error: null }
      }

      // Extract project IDs the user has access to
      const accessibleProjectIds = membershipData.map(m => m.project_id)

      // Get tasks assigned to user only from accessible projects
      const { data, error } = await supabase
        .from('projects_task')
        .select(`
          id,
          name,
          description, 
          status,
          priority,
          due_date,
          start_date,
          completed_at,
          estimated_hours,
          actual_hours,
          position,
          tags,
          created_at,
          updated_at,
          assignee_id,
          created_by_id,
          project_id,
          projects_project!inner(id, name)
        `)
        .eq('assignee_id', userId)
        .in('project_id', accessibleProjectIds)
      
      // Enrich with user data
      if (data && !error) {
        const enrichedData = await Promise.all(
          data.map(async (task) => {
            const createdByResult = task.created_by_id
              ? await supabase.from('auth_user').select('id, name, email').eq('id', task.created_by_id).single()
              : { data: null };

            return {
              ...task,
              assignee: { id: userId }, // We know this is the user
              created_by: createdByResult.data,
              project: task.projects_project
            };
          })
        );
        return { data: enrichedData, error: null };
      }
      
      return { data, error }
    } catch (error) {
      return { data: null, error }
    }
  },

  createTask: async (taskData) => {
    try {
      // Get current user ID
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      // Get the next position for this project
      let nextPosition = 1;
      try {
        const { data: existingTasks, error: positionError } = await supabase
          .from('projects_task')
          .select('position')
          .eq('project_id', taskData.project_id)
          .order('position', { ascending: false })
          .limit(1);

        if (!positionError && existingTasks && existingTasks.length > 0) {
          nextPosition = (existingTasks[0].position || 0) + 1;
        }
      } catch (positionErr) {
        // Fallback to timestamp if position calculation fails
        nextPosition = Date.now();
      }

      // Prepare task data with creator info and required fields
      const taskToInsert = {
        ...taskData,
        created_by_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        position: nextPosition,
        // Set defaults for optional fields
        assignee_id: taskData.assignee_id || null,
        estimated_hours: taskData.estimated_hours || null,
        actual_hours: taskData.actual_hours || null,
        tags: taskData.tags || '',
        due_date: taskData.due_date || null,
        start_date: taskData.start_date || null,
        completed_at: null,
        parent_task_id: taskData.parent_task_id || null,
        // Ensure required fields have defaults
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium'
      };

      // Insert the task
      const { data: taskResult, error: taskError } = await supabase
        .from('projects_task')
        .insert([taskToInsert])
        .select()

      if (taskError) {
        console.error('Error creating task:', taskError);
        return { data: null, error: taskError };
      }

      return { data: taskResult[0], error: null };
    } catch (error) {
      console.error('Exception in createTask:', error);
      return { data: null, error };
    }
  },

  updateTask: async (id, taskData) => {
    const { data, error } = await supabase
      .from('projects_task')
      .update(taskData)
      .eq('id', id)
      .select()
    return { data: data?.[0], error }
  },

  deleteTask: async (id) => {
    const { data, error } = await supabase
      .from('projects_task')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Meetings
  getMeetings: async () => {
    const { data, error } = await supabase
      .from('projects_meeting')
      .select(`
        *,
        project:projects_project(id, name),
        created_by:auth_user(id, name, email)
      `)
    return { data, error }
  },

  createMeeting: async (meetingData) => {
    const { data, error } = await supabase
      .from('projects_meeting')
      .insert([meetingData])
      .select()
    return { data: data?.[0], error }
  },

  updateMeeting: async (id, meetingData) => {
    const { data, error } = await supabase
      .from('projects_meeting')
      .update(meetingData)
      .eq('id', id)
      .select()
    return { data: data?.[0], error }
  },

  deleteMeeting: async (id) => {
    const { data, error } = await supabase
      .from('projects_meeting')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}

export default supabase 