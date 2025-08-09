'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Project {
  project_id: number;
  project_name: string;
  can_create_users: boolean;
  can_edit_users: boolean;
  can_delete_users: boolean;
  can_manage_project: boolean;
  can_view_reports: boolean;
  can_assign_tasks: boolean;
}

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: string;
  position: string;
  phone: string;
  projectId: number;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [adminProjects, setAdminProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'member',
    position: '',
    phone: '',
    projectId: 0
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user?.role || (user as any)?.user_metadata?.role;
    const isAdmin = role === 'admin' || role === 'hr' || (user as any)?.is_superuser || (user as any)?.is_staff;
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    fetchAdminProjects();
  }, [isAuthenticated, isLoading, router, user]);

  const fetchAdminProjects = async () => {
    try {
      setLoading(true);
      
      // Call the get_admin_projects function we created
      const { data, error } = await supabase
        .rpc('get_admin_projects', { admin_user_id: user?.id });
      
      if (error) {
        console.error('Error fetching admin projects:', error);
        // Fallback: If function doesn't exist, show all projects for superadmin
        if (user?.role === 'admin' || (user as any)?.is_superuser) {
          const { data: allProjects, error: projectsError } = await supabase
            .from('projects_project')
            .select('id, name')
            .order('name');
          
          if (projectsError) {
            console.error('Error fetching all projects:', projectsError);
            setAdminProjects([]);
          } else {
            const formattedProjects = allProjects?.map(p => ({
              project_id: p.id,
              project_name: p.name,
              can_create_users: true,
              can_edit_users: true,
              can_delete_users: true,
              can_manage_project: true,
              can_view_reports: true,
              can_assign_tasks: true
            })) || [];
            setAdminProjects(formattedProjects);
          }
        } else {
          setAdminProjects([]);
        }
      } else {
        setAdminProjects(data || []);
      }
    } catch (error) {
      console.error('Error in fetchAdminProjects:', error);
      setAdminProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.projectId || !newUser.email || !newUser.password || !newUser.name) {
      setCreateUserMessage('Please fill in all required fields');
      return;
    }

    setCreateUserLoading(true);
    setCreateUserMessage('');

    try {
      // Check if admin has permission to create users for this project
      const selectedProject = adminProjects.find(p => p.project_id === newUser.projectId);
      if (!selectedProject || !selectedProject.can_create_users) {
        setCreateUserMessage('You do not have permission to create users for this project');
        return;
      }

      // Create user in auth_user table
      const { data: insertedUser, error: userError } = await supabase
        .from('auth_user')
        .insert([{
          name: newUser.name,
          email: newUser.email,
          password: newUser.password, // In production, this should be hashed
          role: newUser.role,
          position: newUser.position,
          phone_number: newUser.phone,
          is_active: true,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        setCreateUserMessage('Error creating user: ' + userError.message);
        return;
      }

      // Add user to project members
      const { error: memberError } = await supabase
        .from('projects_project_members')
        .insert([{
          project_id: newUser.projectId,
          user_id: insertedUser.id,
          role: newUser.role,
          joined_at: new Date().toISOString()
        }]);

      if (memberError) {
        console.error('Error adding user to project:', memberError);
        setCreateUserMessage('User created but failed to add to project: ' + memberError.message);
        return;
      }

      // Log the user creation
      await supabase
        .from('project_user_creation_log')
        .insert([{
          created_user_id: insertedUser.id,
          created_by_admin_id: user?.id,
          project_id: newUser.projectId,
          user_role: newUser.role,
          notes: `User created by admin for project ${selectedProject.project_name}`
        }]);

      setCreateUserMessage('User created successfully!');
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'member',
        position: '',
        phone: '',
        projectId: 0
      });
    } catch (error) {
      console.error('Error in handleCreateUser:', error);
      setCreateUserMessage('An unexpected error occurred');
    } finally {
      setCreateUserLoading(false);
    }
  };

  if (isLoading || loading) return <div style={{ padding: '2rem' }}>Loading...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'overview' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'overview' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('create-user')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'create-user' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'create-user' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'create-user' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Create User
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'projects' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'projects' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'projects' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            My Projects
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Projects Under Management</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{adminProjects.length}</p>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0' 
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>Admin Role</h3>
              <p style={{ fontSize: '1.125rem', color: '#059669' }}>
                {user?.role === 'admin' ? 'Super Admin' : 
                 (user as any)?.is_superuser ? 'Superuser' : 
                 user?.role === 'hr' ? 'HR Admin' : 'Project Admin'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create-user' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Create New User</h2>
          
          {adminProjects.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              backgroundColor: '#fef3cd', 
              borderRadius: '8px', 
              border: '1px solid #f59e0b',
              textAlign: 'center'
            }}>
              <p style={{ color: '#92400e' }}>
                You are not assigned as an admin to any projects. Contact a super admin to assign you to projects.
              </p>
            </div>
          ) : (
            <form onSubmit={handleCreateUser} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Project *
                </label>
                <select
                  value={newUser.projectId}
                  onChange={(e) => setNewUser({ ...newUser, projectId: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                >
                  <option value={0}>Select a project</option>
                  {adminProjects
                    .filter(p => p.can_create_users)
                    .map(project => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="member">Member</option>
                    <option value="staff">Staff</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Position
                  </label>
                  <input
                    type="text"
                    value={newUser.position}
                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="e.g. Project Manager"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem'
                    }}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createUserLoading}
                style={{
                  backgroundColor: createUserLoading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: createUserLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {createUserLoading ? 'Creating User...' : 'Create User'}
              </button>

              {createUserMessage && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: createUserMessage.includes('successfully') ? '#d1fae5' : '#fee2e2',
                  color: createUserMessage.includes('successfully') ? '#065f46' : '#991b1b',
                  border: `1px solid ${createUserMessage.includes('successfully') ? '#10b981' : '#ef4444'}`
                }}>
                  {createUserMessage}
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {activeTab === 'projects' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>My Assigned Projects</h2>
          
          {adminProjects.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#6b7280' }}>No projects assigned to you as admin.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {adminProjects.map((project) => (
                <div
                  key={project.project_id}
                  style={{
                    padding: '1.5rem',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                    {project.project_name}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {project.can_create_users && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#d1fae5',
                        color: '#065f46',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        Create Users
                      </span>
                    )}
                    {project.can_edit_users && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        Edit Users
                      </span>
                    )}
                    {project.can_manage_project && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f3e8ff',
                        color: '#7c3aed',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        Manage Project
                      </span>
                    )}
                    {project.can_view_reports && (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#fef3cd',
                        color: '#92400e',
                        borderRadius: '4px',
                        fontSize: '0.875rem'
                      }}>
                        View Reports
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
