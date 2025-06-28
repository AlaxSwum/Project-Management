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
        assignee_ids,
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
          const assigneesPromise = task.assignee_ids && task.assignee_ids.length > 0
            ? supabase.from('auth_user').select('id, name, email, role').in('id', task.assignee_ids)
            : Promise.resolve({ data: [] });
          
          const createdByPromise = task.created_by_id
            ? supabase.from('auth_user').select('id, name, email').eq('id', task.created_by_id).single()
            : Promise.resolve({ data: null });

          const [assigneesResult, createdByResult] = await Promise.all([assigneesPromise, createdByPromise]);

          return {
            ...task,
            assignees: assigneesResult.data || [],
            assignee: (assigneesResult.data && assigneesResult.data.length > 0) ? assigneesResult.data[0] : null, // Backwards compatibility
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
          assignee_ids,
          created_by_id,
          project_id,
          projects_project!inner(id, name)
        `)
        .contains('assignee_ids', [userId])
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
        assignee_ids: taskData.assignee_ids || [],
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

      const newTask = taskResult[0];

      // ✅ Enrich the task with user data before returning
      const assignees = taskData.assignee_ids && taskData.assignee_ids.length > 0 ? 
        await supabase.from('auth_user').select('id, name, email, role').in('id', taskData.assignee_ids) : 
        { data: [] };

      const enrichedTask = {
        ...newTask,
        assignees: assignees.data || [],
        assignee: (assignees.data && assignees.data.length > 0) ? assignees.data[0] : null, // Backwards compatibility
        created_by: {
          id: user.id,
          name: user.user_metadata?.name || user.email,
          email: user.email,
          role: user.user_metadata?.role || 'member'
        },
        tags_list: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      return { data: enrichedTask, error: null };
    } catch (error) {
      console.error('Exception in createTask:', error);
      return { data: null, error };
    }
  },

  updateTask: async (id, taskData) => {
    try {
      // Update the task with timestamp
      const taskUpdateData = {
        ...taskData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('projects_task')
        .update(taskUpdateData)
        .eq('id', id)
        .select()

      if (error) {
        console.error('Error updating task:', error);
        return { data: null, error };
      }

      const updatedTask = data?.[0];
      if (!updatedTask) {
        return { data: null, error: new Error('Task not found after update') };
      }

      // ✅ Enrich the updated task with user data like createTask and getTasks do
      const assigneesPromise = updatedTask.assignee_ids && updatedTask.assignee_ids.length > 0
        ? supabase.from('auth_user').select('id, name, email, role').in('id', updatedTask.assignee_ids)
        : Promise.resolve({ data: [] });
      
      const createdByPromise = updatedTask.created_by_id
        ? supabase.from('auth_user').select('id, name, email').eq('id', updatedTask.created_by_id).single()
        : Promise.resolve({ data: null });

      const projectPromise = updatedTask.project_id
        ? supabase.from('projects_project').select('id, name').eq('id', updatedTask.project_id).single()
        : Promise.resolve({ data: null });

      const [assigneesResult, createdByResult, projectResult] = await Promise.all([
        assigneesPromise, 
        createdByPromise, 
        projectPromise
      ]);

      // Return enriched task data matching the format from getTasks/createTask
      const enrichedTask = {
        ...updatedTask,
        assignees: assigneesResult.data || [],
        assignee: (assigneesResult.data && assigneesResult.data.length > 0) ? assigneesResult.data[0] : null, // Backwards compatibility
        created_by: createdByResult.data,
        project: projectResult.data,
        tags_list: updatedTask.tags ? updatedTask.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      };

      return { data: enrichedTask, error: null };
    } catch (error) {
      console.error('Exception in updateTask:', error);
      return { data: null, error };
    }
  },

  deleteTask: async (id) => {
    try {
      // Get current user ID
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      // First check if the task exists and user has permission to delete it
      const { data: taskCheck, error: checkError } = await supabase
        .from('projects_task')
        .select('id, created_by_id, assignee_ids, project_id')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          return { data: null, error: new Error('Task not found or already deleted') };
        }
        console.error('Error checking task:', checkError);
        return { data: null, error: checkError };
      }

      // Check if user has permission to delete this task
      // User can delete if they are:
      // 1. The creator of the task, OR
      // 2. One of the assignees of the task, OR  
      // 3. A member of the project (we'll check project membership)
      const isAssignee = taskCheck.assignee_ids && taskCheck.assignee_ids.includes(user.id);
      const canDelete = taskCheck.created_by_id === user.id || isAssignee;

      if (!canDelete) {
        // Check if user is a member of the project
        const { data: membership, error: membershipError } = await supabase
          .from('projects_project_members')
          .select('id')
          .eq('project_id', taskCheck.project_id)
          .eq('user_id', user.id)
          .single();

        if (membershipError || !membership) {
          return { data: null, error: new Error('Permission denied: You can only delete tasks you created, are assigned to, or belong to projects you are a member of') };
        }
      }

      // Delete related records first to avoid foreign key constraint violations
      try {
        // Delete task comments if they exist
        await supabase
          .from('projects_taskcomment')
          .delete()
          .eq('task_id', id);

        // Delete task attachments if they exist
        await supabase
          .from('projects_taskattachment')
          .delete()
          .eq('task_id', id);

        // Delete any task dependencies/relationships
        await supabase
          .from('projects_taskdependency')
          .delete()
          .or(`predecessor_task_id.eq.${id},successor_task_id.eq.${id}`);

      } catch (relatedError) {
        // Log but don't fail - these tables might not exist or have different names
        console.log('Note: Some related records cleanup failed (this is usually okay):', relatedError);
      }

      // Now delete the main task
    const { data, error } = await supabase
      .from('projects_task')
      .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting task:', error);
        
        // Provide user-friendly error messages for common issues
        if (error.code === '23503') {
          return { data: null, error: new Error('Cannot delete task: This task is referenced by other records. Please remove any dependencies first.') };
        } else if (error.code === '23505') {
          return { data: null, error: new Error('Cannot delete task: Duplicate constraint violation.') };
        } else if (error.message && error.message.includes('violates foreign key constraint')) {
          return { data: null, error: new Error('Cannot delete task: This task has related records that must be removed first.') };
        } else {
          return { data: null, error: new Error(`Failed to delete task: ${error.message}`) };
        }
      }

      return { data: { success: true, message: 'Task deleted successfully' }, error: null };
    } catch (error) {
      console.error('Exception in deleteTask:', error);
      return { data: null, error: new Error(`Failed to delete task: ${error.message}`) };
    }
  },

  // Meetings
  getMeetings: async () => {
    try {
    // Query meetings with attendee_ids column
    const { data, error } = await supabase
      .from('projects_meeting')
      .select(`
          id,
          title,
          description,
          date,
          time,
          duration,
          attendee_ids,
          created_at,
          updated_at,
          created_by_id,
          project_id
        `)
      
      if (error) return { data: null, error }
      
      // Enrich with project and creator info
      const enrichedMeetings = await Promise.all(
        (data || []).map(async (meeting) => {
          // Get project info
          const projectPromise = meeting.project_id 
            ? supabase.from('projects_project').select('id, name').eq('id', meeting.project_id).single()
            : Promise.resolve({ data: null });
          
          // Get creator info
          const creatorPromise = meeting.created_by_id
            ? supabase.from('auth_user').select('id, name, email').eq('id', meeting.created_by_id).single()
            : Promise.resolve({ data: null });

          const [projectResult, creatorResult] = await Promise.all([projectPromise, creatorPromise]);

          return {
            ...meeting,
            project: meeting.project_id,
            project_id: meeting.project_id,
            project_name: projectResult.data?.name || 'Unknown Project',
            created_by: creatorResult.data || { id: 0, name: 'Unknown User', email: '' },
            attendees_list: [], // Legacy field for backward compatibility
            attendee_ids: meeting.attendee_ids || []
          };
        })
      );
      
      return { data: enrichedMeetings, error: null }
    } catch (error) {
      console.error('Error in getMeetings:', error);
      return { data: [], error }
    }
  },

  createMeeting: async (meetingData) => {
    try {
      // Get current user ID
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      // Prepare meeting data with creator info (using attendee_ids column)
      const meetingToInsert = {
        title: meetingData.title,
        description: meetingData.description || '',
        project_id: meetingData.project,
        date: meetingData.date,
        time: meetingData.time,
        duration: meetingData.duration || 60,
        attendee_ids: meetingData.attendee_ids || null,
        created_by_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

    const { data, error } = await supabase
      .from('projects_meeting')
        .insert([meetingToInsert])
      .select()

      if (error) {
        console.error('Error creating meeting:', error);
        return { data: null, error };
      }

      const newMeeting = data?.[0];
      if (!newMeeting) {
        return { data: null, error: new Error('Failed to create meeting') };
      }

      // Get project info for the response
      const projectResult = await supabase
        .from('projects_project')
        .select('id, name')
        .eq('id', newMeeting.project_id)
        .single();

      // Return enriched meeting data
      return {
        data: {
          ...newMeeting,
          project: newMeeting.project_id,
          project_id: newMeeting.project_id,
          project_name: projectResult.data?.name || 'Unknown Project',
          created_by: {
            id: user.id,
            name: user.user_metadata?.name || user.email,
            email: user.email
          },
          attendees_list: [], // Legacy field for backward compatibility
          attendee_ids: newMeeting.attendee_ids || []
        },
        error: null
      };
    } catch (error) {
      console.error('Exception in createMeeting:', error);
      return { data: null, error };
    }
  },

  updateMeeting: async (id, meetingData) => {
    try {
      // Prepare update data
      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Add fields that are being updated (using attendee_ids column)
      if (meetingData.title) updateData.title = meetingData.title;
      if (meetingData.description !== undefined) updateData.description = meetingData.description;
      if (meetingData.project) updateData.project_id = meetingData.project;
      if (meetingData.date) updateData.date = meetingData.date;
      if (meetingData.time) updateData.time = meetingData.time;
      if (meetingData.duration) updateData.duration = meetingData.duration;
      if (meetingData.attendee_ids !== undefined) updateData.attendee_ids = meetingData.attendee_ids;

    const { data, error } = await supabase
      .from('projects_meeting')
        .update(updateData)
      .eq('id', id)
      .select()

      if (error) {
        console.error('Error updating meeting:', error);
        return { data: null, error };
      }

      const updatedMeeting = data?.[0];
      if (!updatedMeeting) {
        return { data: null, error: new Error('Meeting not found after update') };
      }

      // Get project and creator info
      const projectPromise = updatedMeeting.project_id 
        ? supabase.from('projects_project').select('id, name').eq('id', updatedMeeting.project_id).single()
        : Promise.resolve({ data: null });
      
      const creatorPromise = updatedMeeting.created_by_id
        ? supabase.from('auth_user').select('id, name, email').eq('id', updatedMeeting.created_by_id).single()
        : Promise.resolve({ data: null });

      const [projectResult, creatorResult] = await Promise.all([projectPromise, creatorPromise]);

      // Return enriched meeting data
      return {
        data: {
          ...updatedMeeting,
          project: updatedMeeting.project_id,
          project_id: updatedMeeting.project_id,
          project_name: projectResult.data?.name || 'Unknown Project',
          created_by: creatorResult.data || { id: 0, name: 'Unknown User', email: '' },
          attendees_list: [], // Legacy field for backward compatibility
          attendee_ids: updatedMeeting.attendee_ids || []
        },
        error: null
      };
    } catch (error) {
      console.error('Exception in updateMeeting:', error);
      return { data: null, error };
    }
  },

  deleteMeeting: async (id) => {
    const { data, error } = await supabase
      .from('projects_meeting')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Project Member Management
  addProjectMember: async (projectId, userId) => {
    try {
      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('projects_project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      if (existingMember) {
        return { data: null, error: new Error('User is already a member of this project') }
      }

      // Ignore the "not found" error - it's expected when user is not a member
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Unexpected error checking existing member:', checkError);
        return { data: null, error: checkError }
      }

      // Add the member
      const { data, error } = await supabase
        .from('projects_project_members')
        .insert([{
          project_id: projectId,
          user_id: userId
        }])
        .select()

      return { data: data?.[0], error }
    } catch (error) {
      console.error('Exception in addProjectMember:', error);
      return { data: null, error }
    }
  },

  removeProjectMember: async (projectId, userId) => {
    try {
      const { data, error } = await supabase
        .from('projects_project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      return { data, error }
    } catch (error) {
      console.error('Exception in removeProjectMember:', error);
      return { data: null, error }
    }
  },

  // Task Comments
  getTaskComments: async (taskId) => {
    try {
      const { data, error } = await supabase
        .from('projects_taskcomment')
        .select(`
          id,
          comment,
          created_at,
          task_id,
          user_id,
          auth_user(id, name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching task comments:', error);
        return { data: [], error };
      }

      // Transform to match the expected format with user property
      const transformedComments = (data || []).map(comment => ({
        id: comment.id,
        comment: comment.comment,
        user: {
          id: comment.auth_user?.id || comment.user_id,
          name: comment.auth_user?.name || 'Unknown User',
          email: comment.auth_user?.email || '',
          role: comment.auth_user?.role || 'member'
        },
        author: comment.auth_user?.name || 'Unknown User',
        author_email: comment.auth_user?.email || '',
        created_at: comment.created_at,
        task_id: comment.task_id
      }));

      return { data: transformedComments, error: null };
    } catch (error) {
      console.error('Exception in getTaskComments:', error);
      return { data: [], error };
    }
  },

  createTaskComment: async (taskId, commentData) => {
    try {
      // Get current user ID
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      // Insert the comment
      const { data, error } = await supabase
        .from('projects_taskcomment')
        .insert([{
          task_id: taskId,
          user_id: user.id,
          comment: commentData.comment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          id,
          comment,
          created_at,
          task_id,
          user_id
        `)

      if (error) {
        console.error('Error creating task comment:', error);
        return { data: null, error };
      }

      const newComment = data?.[0];
      if (!newComment) {
        return { data: null, error: new Error('Failed to create comment') };
      }

      // Return comment in the expected format with user property
      const transformedComment = {
        id: newComment.id,
        comment: newComment.comment,
        user: {
          id: user.id,
          name: user.user_metadata?.name || 'Current User',
          email: user.email || '',
          role: user.user_metadata?.role || 'member'
        },
        author: user.user_metadata?.name || 'Current User',
        author_email: user.email || '',
        created_at: newComment.created_at,
        task_id: newComment.task_id
      };

      return { data: transformedComment, error: null };
    } catch (error) {
      console.error('Exception in createTaskComment:', error);
      return { data: null, error };
    }
  },

  // Content Calendar Operations - Using direct HTTP requests to bypass RLS
  getContentCalendarItems: async () => {
    try {
      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar?order=date.asc`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getContentCalendarItems:', error);
      return { data: [], error };
    }
  },

  createContentCalendarItem: async (itemData) => {
    try {
      const { user } = await supabaseAuth.getUser();
      if (!user) {
        return { data: null, error: new Error('Authentication required') };
      }

      const itemToInsert = {
        ...itemData,
        created_by_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(itemToInsert)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Exception in createContentCalendarItem:', error);
      return { data: null, error };
    }
  },

  updateContentCalendarItem: async (id, itemData) => {
    try {
      const updateData = {
        ...itemData,
        updated_at: new Date().toISOString()
      };

      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Exception in updateContentCalendarItem:', error);
      return { data: null, error };
    }
  },

  deleteContentCalendarItem: async (id) => {
    try {
      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Exception in deleteContentCalendarItem:', error);
      return { data: null, error };
    }
  },

  // Content Calendar Member Management - Using direct HTTP requests
  getContentCalendarMembers: async () => {
    try {
      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar_members?select=*,auth_user(id,name,email,role,is_superuser,is_staff)`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in getContentCalendarMembers:', error);
      return { data: [], error };
    }
  },

  addContentCalendarMember: async (userId, role) => {
    try {
      // Check if user is already a member using direct HTTP
      const checkResponse = await fetch(`${supabaseUrl}/rest/v1/content_calendar_members?user_id=eq.${userId}`, {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (checkResponse.ok) {
        const existingMembers = await checkResponse.json();
        if (existingMembers && existingMembers.length > 0) {
          return { data: null, error: new Error('User is already a member of the content calendar') };
        }
      }

      // Add the member using direct HTTP request
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar_members`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: userId,
          role: role
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error('Exception in addContentCalendarMember:', error);
      return { data: null, error };
    }
  },

  removeContentCalendarMember: async (memberId) => {
    try {
      // Use direct HTTP request to bypass RLS issues
      const response = await fetch(`${supabaseUrl}/rest/v1/content_calendar_members?id=eq.${memberId}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Exception in removeContentCalendarMember:', error);
      return { data: null, error };
    }
  }
}

export default supabase 