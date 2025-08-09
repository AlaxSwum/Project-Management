'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import Sidebar from '@/components/Sidebar';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AdminProject {
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
}

interface ProjectMember {
  user_id: number;
  role: string | null;
  auth_user?: {
    id: number;
    name: string | null;
    email: string;
    role: string | null;
  };
}

interface UserSearchResult {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('projects');
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState<NewUser>({
    name: '',
    email: '',
    password: '',
    role: 'member',
    position: '',
    phone: '',
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserMessage, setCreateUserMessage] = useState('');
  const sidebarProjects = adminProjects.map(p => ({ id: p.project_id, name: p.project_name }));

  // Members modal state
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [membersProject, setMembersProject] = useState<AdminProject | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [membersMessage, setMembersMessage] = useState('');

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

  const openMembersModal = async (project: AdminProject) => {
    // permission guard
    if (!(project.can_manage_project || project.can_create_users || project.can_edit_users)) return;
    setMembersProject(project);
    setIsMembersOpen(true);
    setMembersMessage('');
    await fetchProjectMembers(project.project_id);
  };

  const fetchProjectMembers = async (projectId: number) => {
    try {
      setMembersLoading(true);
      const { data, error } = await supabase
        .from('projects_project_members')
        .select(`
          user_id,
          auth_user:auth_user!inner(id, name, email, role)
        `)
        .eq('project_id', projectId)
        .order('user_id');

      if (error) throw error;
      setProjectMembers((data as any) || []);
    } catch (err: any) {
      console.error('Fetch members error:', err);
      setMembersMessage('Error loading members: ' + (err?.message || 'Unknown error'));
      setProjectMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleUserSearch = async (query: string) => {
    setUserQuery(query);
    setMembersMessage('');
    if (!membersProject) return;
    if (!query || query.trim().length < 2) {
      setUserResults([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      setUserResults((data as any) || []);
    } catch (err: any) {
      console.error('User search error:', err);
      setMembersMessage('Error searching users');
      setUserResults([]);
    }
  };

  const addProjectMember = async (userId: number) => {
    if (!membersProject) return;
    if (!(membersProject.can_manage_project || membersProject.can_create_users || membersProject.can_edit_users)) return;
    setAddMemberLoading(true);
    setMembersMessage('');
    try {
      // prevent duplicate
      const { data: existing, error: existErr } = await supabase
        .from('projects_project_members')
        .select('user_id')
        .eq('project_id', membersProject.project_id)
        .eq('user_id', userId)
        .maybeSingle();
      if (existErr) throw existErr;
      if (existing) {
        setMembersMessage('User is already a member of this project.');
        return;
      }

      const { error } = await supabase
        .from('projects_project_members')
        .insert([{ project_id: membersProject.project_id, user_id: userId, joined_at: new Date().toISOString() }]);
      if (error) throw error;
      await fetchProjectMembers(membersProject.project_id);
      setMembersMessage('Member added successfully');
      setUserResults([]);
      setUserQuery('');
    } catch (err: any) {
      console.error('Add member error:', err);
      setMembersMessage('Error adding member: ' + (err?.message || 'Unknown error'));
    } finally {
      setAddMemberLoading(false);
    }
  };

  const removeProjectMember = async (userId: number) => {
    if (!membersProject) return;
    if (!(membersProject.can_manage_project || membersProject.can_edit_users)) return;
    try {
      const { error } = await supabase
        .from('projects_project_members')
        .delete()
        .match({ project_id: membersProject.project_id, user_id: userId });
      if (error) throw error;
      await fetchProjectMembers(membersProject.project_id);
      setMembersMessage('Member removed');
    } catch (err: any) {
      console.error('Remove member error:', err);
      setMembersMessage('Error removing member: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.name) {
      setCreateUserMessage('Please fill in all required fields');
      return;
    }

    setCreateUserLoading(true);
    setCreateUserMessage('');

    try {
      // Debug: Check auth_user table schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('auth_user')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        console.log('Schema check error:', schemaError);
      } else {
        console.log('auth_user sample row structure:', schemaData?.[0] ? Object.keys(schemaData[0]) : 'No rows found');
      }

      // Creating user globally (not tied to a project)

      // Create user in auth_user table
      const { data: insertedUser, error: userError } = await supabase
        .from('auth_user')
        .insert([{
          name: newUser.name,
          email: newUser.email,
          password: newUser.password, // In production, this should be hashed
          role: newUser.role,
          is_superuser: false,
          is_staff: false,
          is_active: true,
          date_joined: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        setCreateUserMessage('Error creating user: ' + userError.message);
        return;
      }

      // Log the user creation (no project context)
      await supabase
        .from('project_user_creation_log')
        .insert([{
          created_user_id: insertedUser.id,
          created_by_admin_id: user?.id,
          user_role: newUser.role,
          notes: `User created by admin (no project assigned)`
        }]);

      setCreateUserMessage('User created successfully!');
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'member',
        position: '',
        phone: ''
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
    <>
      <style jsx>{`
        .admin-container {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #F5F5ED 0%, #FAFAF2 100%);
          position: relative;
          overflow: hidden;
        }
        .main-content {
          flex: 1;
          margin-left: 280px;
          background: transparent;
          position: relative;
          z-index: 1;
        }
        .header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
          padding: 2.25rem 2rem;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1400px;
          margin: 0 auto;
        }
        .title {
          font-size: 2.25rem;
          font-weight: 900;
          background: linear-gradient(135deg, #1F2937 0%, #4B5563 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .section-container {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
      `}</style>
      <div className="admin-container">
        <Sidebar projects={sidebarProjects} onCreateProject={() => router.push('/dashboard')} />
        <div className="main-content">
          <div className="header">
            <div className="header-content">
              <h1 className="title">Admin Dashboard</h1>
            </div>
          </div>
          <div className="section-container">
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
        <nav style={{ display: 'flex', gap: '2rem' }}>
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
          {/* Only Projects tab per requirements */}
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
      {activeTab === 'create-user' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Create New User</h2>
          <form onSubmit={handleCreateUser} style={{ maxWidth: '600px' }}>
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
                    <option value="instructor">Instructor</option>
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
        </div>
      )}

      {/* Removed create-user per requirements */}

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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      {project.project_name}
                    </h3>
                    {(project.can_manage_project || project.can_create_users || project.can_edit_users) && (
                      <button
                        onClick={() => openMembersModal(project)}
                        style={{
                          background: 'linear-gradient(135deg, #5884FD, #8BA4FE)',
                          color: 'white',
                          padding: '0.45rem 0.8rem',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Edit Members
                      </button>
                    )}
                  </div>
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

      {/* Members Modal */}
      {isMembersOpen && membersProject && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content" style={{ background: '#fff', width: '100%', maxWidth: 720, borderRadius: 16, border: '1px solid #E5E7EB', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div className="modal-header" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E5E7EB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>Edit Members — {membersProject.project_name}</h3>
              <button onClick={() => setIsMembersOpen(false)} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Add existing user</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Search by name or email"
                      value={userQuery}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      style={{ flex: 1, padding: '0.6rem 0.8rem', border: '1px solid #D1D5DB', borderRadius: 8 }}
                    />
                  </div>
                  {userResults.length > 0 && (
                    <div style={{ marginTop: 8, border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
                      {userResults.map(u => (
                        <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#fff' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{u.name || 'Unnamed'}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{u.email}</div>
                          </div>
                          <button
                            disabled={addMemberLoading}
                            onClick={() => addProjectMember(u.id)}
                            style={{ background: 'linear-gradient(135deg, #10B981, #34D399)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer' }}
                          >
                            {addMemberLoading ? 'Adding...' : 'Add to project'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontWeight: 700 }}>Current members</label>
                    <span style={{ color: '#6B7280', fontSize: 12 }}>{projectMembers.length} total</span>
                  </div>
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: 8 }}>
                    {membersLoading ? (
                      <div style={{ padding: 12 }}>Loading members...</div>
                    ) : projectMembers.length === 0 ? (
                      <div style={{ padding: 12, color: '#6B7280' }}>No members yet.</div>
                    ) : (
                      projectMembers.map(m => (
                        <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: '#fff', borderBottom: '1px solid #F3F4F6' }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{m.auth_user?.name || 'Unnamed'}</div>
                            <div style={{ fontSize: 12, color: '#6B7280' }}>{m.auth_user?.email}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: '#374151', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 999, padding: '0.2rem 0.6rem' }}>{m.role || 'member'}</span>
                            <button onClick={() => removeProjectMember(m.user_id)} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer' }}>Remove</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                {membersMessage && (
                  <div style={{
                    padding: '0.6rem 0.8rem',
                    borderRadius: 8,
                    background: membersMessage.toLowerCase().includes('error') ? '#fee2e2' : '#d1fae5',
                    color: membersMessage.toLowerCase().includes('error') ? '#991b1b' : '#065f46',
                    border: `1px solid ${membersMessage.toLowerCase().includes('error') ? '#ef4444' : '#10b981'}`
                  }}>
                    {membersMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </>
  );
}
