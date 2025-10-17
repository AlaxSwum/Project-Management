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

interface ClassItem {
  id: number;
  class_title: string;
  class_type: string;
  target_audience: string;
  class_date: string;
  start_time: string;
  end_time: string;
  duration: string;
  location: string;
  instructor_name: string;
  instructor_id?: number;
  class_description: string;
  learning_objectives: string[];
  max_participants: number;
  current_participants: number;
  status: string;
  folder_name?: string;
  folder_id?: number;
}

interface InstructorUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface EmployeeLeaveAllocation {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_email: string;
  annual_leave_total: number;
  annual_leave_used: number;
  annual_leave_remaining: number;
  annual_leave_max_per_request: number;
  sick_leave_total: number;
  sick_leave_used: number;
  sick_leave_remaining: number;
  sick_leave_max_per_month: number;
  casual_leave_total: number;
  casual_leave_used: number;
  casual_leave_remaining: number;
  casual_leave_max_per_month: number;
  year: number;
}

interface ImportantDate {
  id: number;
  date: string;
  title: string;
  description: string;
  type: string;
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

  // Classes state
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [instructors, setInstructors] = useState<InstructorUser[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [assigningInstructor, setAssigningInstructor] = useState<number | null>(null);
  const [classInstructors, setClassInstructors] = useState<Record<number, InstructorUser[]>>({});
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillMessage, setBackfillMessage] = useState('');

  // Absence Management state
  const [employees, setEmployees] = useState<UserSearchResult[]>([]);
  const [leaveAllocations, setLeaveAllocations] = useState<EmployeeLeaveAllocation[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [absenceMessage, setAbsenceMessage] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<UserSearchResult | null>(null);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showImportantDateModal, setShowImportantDateModal] = useState(false);
  const [newAllocation, setNewAllocation] = useState({
    annual_leave_total: 10,
    annual_leave_max_per_request: 3,
    sick_leave_total: 24,
    sick_leave_max_per_month: 7,
    casual_leave_total: 6,
    casual_leave_max_per_month: 2,
  });
  const [newImportantDate, setNewImportantDate] = useState({
    date: '',
    title: '',
    description: '',
    type: 'company_event'
  });

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

  const backfillClassInstructors = async () => {
    try {
      setBackfillLoading(true);
      setBackfillMessage('');

      // Load all classes with possible instructor hints
      const { data: classesData, error: classesErr } = await supabase
        .from('classes')
        .select('id, instructor_id, instructor_name');

      if (classesErr) throw classesErr;

      const classesList = classesData || [];

      // Collect instructor names that need lookup
      const missingIdNames = Array.from(
        new Set(
          classesList
            .filter((c: any) => !c.instructor_id && c.instructor_name)
            .map((c: any) => c.instructor_name as string)
            .filter(Boolean)
        )
      );

      const nameToUserId = new Map<string, number>();
      if (missingIdNames.length > 0) {
        const { data: usersByName, error: usersErr } = await supabase
          .from('auth_user')
          .select('id, name')
          .eq('role', 'instructor')
          .in('name', missingIdNames);

        if (usersErr) throw usersErr;
        (usersByName || []).forEach((u: any) => {
          if (u?.name && u?.id) nameToUserId.set(u.name, u.id);
        });
      }

      const rows = classesList
        .map((c: any) => {
          const resolvedInstructorId = c.instructor_id || (c.instructor_name ? nameToUserId.get(c.instructor_name) : undefined);
          if (!resolvedInstructorId) return null;
          return {
            class_id: c.id,
            instructor_id: resolvedInstructorId,
            role: 'instructor',
            is_active: true,
            assigned_by: (user?.id as any) || null
          };
        })
        .filter(Boolean) as Array<{ class_id: number; instructor_id: number; role: string; is_active: boolean; assigned_by: number | null }>;

      if (rows.length === 0) {
        setBackfillMessage('No instructor assignments to backfill.');
        return;
      }

      const { error: upsertErr } = await supabase
        .from('classes_instructors')
        .upsert(rows, { onConflict: 'class_id,instructor_id' });

      if (upsertErr) throw upsertErr;

      setBackfillMessage(`Backfill complete: ${rows.length} instructor assignment(s) created/updated.`);

      // Refresh displayed instructors
      await fetchClassInstructors(classesList.map((c: any) => c.id));
    } catch (err: any) {
      console.error('Backfill error:', err);
      setBackfillMessage('Error backfilling instructors: ' + (err?.message || 'Unknown error'));
    } finally {
      setBackfillLoading(false);
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

  // Classes management functions
  const fetchClasses = async () => {
    try {
      setClassesLoading(true);
      
      const { data, error } = await supabase
        .from('classes')
        .select(`
          *,
          classes_folders(name)
        `)
        .order('class_date', { ascending: true });

      if (error) {
        console.error('Error fetching classes:', error);
        return;
      }

      const formattedClasses = data?.map(classItem => ({
        ...classItem,
        folder_name: classItem.classes_folders?.name || 'No Folder'
      })) || [];

      setClasses(formattedClasses);
      // After classes load, fetch assigned instructors for these classes
      const classIds = formattedClasses.map(c => c.id);
      await fetchClassInstructors(classIds);
    } catch (error) {
      console.error('Error in fetchClasses:', error);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchClassInstructors = async (classIds: number[]) => {
    if (!classIds || classIds.length === 0) {
      setClassInstructors({});
      return;
    }
    try {
      const { data, error } = await supabase
        .from('classes_instructors')
        .select('class_id, instructor_id, auth_user!classes_instructors_instructor_id_fkey(id, name, email)')
        .in('class_id', classIds)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching class instructors:', error);
        setClassInstructors({});
        return;
      }

      const map: Record<number, InstructorUser[]> = {};
      (data as any[] | null)?.forEach(row => {
        if (!row || !row.class_id || !row.auth_user) return;
        const list = map[row.class_id] || [];
        list.push({ id: row.auth_user.id, name: row.auth_user.name, email: row.auth_user.email, role: 'instructor' });
        map[row.class_id] = list;
      });
      setClassInstructors(map);
    } catch (err) {
      console.error('fetchClassInstructors error:', err);
      setClassInstructors({});
    }
  };

  const fetchInstructors = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .eq('role', 'instructor');

      if (error) {
        console.error('❌ Error fetching instructors:', error);
        return;
      }

      console.log('👨‍🏫 Found instructors:', data);
      setInstructors(data || []);
    } catch (error) {
      console.error('💥 Error in fetchInstructors:', error);
    }
  };

  const assignInstructor = async (classId: number, instructorId: number) => {
    try {
      console.log('🎯 Assigning instructor:', { classId, instructorId });
      setAssigningInstructor(classId);
      
      const instructor = instructors.find(i => i.id === instructorId);
      if (!instructor) {
        console.error('❌ Instructor not found:', instructorId);
        return;
      }

      console.log('👨‍🏫 Found instructor:', instructor);

      // Insert or activate instructor assignment in junction table
      const { data, error } = await supabase
        .from('classes_instructors')
        .upsert({
          class_id: classId,
          instructor_id: instructorId,
          role: 'instructor',
          is_active: true,
          assigned_by: user?.id as any
        }, { onConflict: 'class_id,instructor_id' });

      if (error) {
        console.error('❌ Error assigning instructor:', error);
        alert('Error assigning instructor: ' + error.message);
        return;
      }

      console.log('✅ Instructor assigned successfully:', data);

      // Refresh instructors for this class
      await fetchClassInstructors([classId]);
    } catch (error) {
      console.error('💥 Error in assignInstructor:', error);
      alert('Unexpected error: ' + (error as any).message);
    } finally {
      setAssigningInstructor(null);
    }
  };

  const removeInstructor = async (classId: number, instructorId: number) => {
    try {
      console.log('🗑️ Removing instructor:', { classId, instructorId });
      
      const { error } = await supabase
        .from('classes_instructors')
        .update({ is_active: false })
        .eq('class_id', classId)
        .eq('instructor_id', instructorId);

      if (error) {
        console.error('❌ Error removing instructor:', error);
        alert('Error removing instructor: ' + error.message);
        return;
      }

      console.log('✅ Instructor removed successfully');

      // Refresh instructors for this class
      await fetchClassInstructors([classId]);
    } catch (error) {
      console.error('💥 Error in removeInstructor:', error);
      alert('Unexpected error: ' + (error as any).message);
    }
  };

  // Absence Management Functions
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .order('name');
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchLeaveAllocations = async () => {
    try {
      setAbsenceLoading(true);
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('employee_leave_allocations')
        .select('*')
        .eq('year', currentYear)
        .order('employee_name');
      
      if (error) throw error;
      setLeaveAllocations(data || []);
    } catch (err: any) {
      console.error('Error fetching leave allocations:', err);
      setAbsenceMessage('Error loading leave allocations: ' + err.message);
    } finally {
      setAbsenceLoading(false);
    }
  };

  const fetchImportantDates = async () => {
    try {
      const { data, error } = await supabase
        .from('important_dates')
        .select('*')
        .order('date');
      
      if (error) throw error;
      setImportantDates(data || []);
    } catch (err: any) {
      console.error('Error fetching important dates:', err);
    }
  };

  const createOrUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setAbsenceMessage('Please select an employee');
      return;
    }

    try {
      setAbsenceLoading(true);
      setAbsenceMessage('');
      const currentYear = new Date().getFullYear();

      const allocationData = {
        employee_id: selectedEmployee.id,
        employee_name: selectedEmployee.name || '',
        employee_email: selectedEmployee.email,
        year: currentYear,
        ...newAllocation,
        created_by: user?.id
      };

      const { error } = await supabase
        .from('employee_leave_allocations')
        .upsert(allocationData, {
          onConflict: 'employee_id,year'
        });

      if (error) throw error;

      setAbsenceMessage('Leave allocation saved successfully!');
      setShowAllocationModal(false);
      setSelectedEmployee(null);
      setNewAllocation({
        annual_leave_total: 10,
        annual_leave_max_per_request: 3,
        sick_leave_total: 24,
        sick_leave_max_per_month: 7,
        casual_leave_total: 6,
        casual_leave_max_per_month: 2,
      });
      await fetchLeaveAllocations();
    } catch (err: any) {
      console.error('Error saving allocation:', err);
      setAbsenceMessage('Error: ' + err.message);
    } finally {
      setAbsenceLoading(false);
    }
  };

  const createImportantDate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newImportantDate.date || !newImportantDate.title) {
      setAbsenceMessage('Please fill in date and title');
      return;
    }

    try {
      setAbsenceLoading(true);
      setAbsenceMessage('');

      const { error } = await supabase
        .from('important_dates')
        .insert({
          ...newImportantDate,
          created_by: user?.id
        });

      if (error) throw error;

      setAbsenceMessage('Important date added successfully!');
      setShowImportantDateModal(false);
      setNewImportantDate({
        date: '',
        title: '',
        description: '',
        type: 'company_event'
      });
      await fetchImportantDates();
    } catch (err: any) {
      console.error('Error adding important date:', err);
      setAbsenceMessage('Error: ' + err.message);
    } finally {
      setAbsenceLoading(false);
    }
  };

  const deleteImportantDate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this important date?')) return;

    try {
      const { error } = await supabase
        .from('important_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAbsenceMessage('Important date deleted successfully!');
      await fetchImportantDates();
    } catch (err: any) {
      console.error('Error deleting important date:', err);
      setAbsenceMessage('Error: ' + err.message);
    }
  };

  // Load classes and instructors when tab becomes active
  useEffect(() => {
    if (activeTab === 'classes') {
      fetchClasses();
      fetchInstructors();
    } else if (activeTab === 'absence') {
      fetchEmployees();
      fetchLeaveAllocations();
      fetchImportantDates();
    }
  }, [activeTab]);

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
          <button
            onClick={() => setActiveTab('classes')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'classes' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'classes' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'classes' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Classes
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
          <button
            onClick={() => setActiveTab('absence')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'absence' ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === 'absence' ? '#3b82f6' : '#6b7280',
              fontWeight: activeTab === 'absence' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Absence Management
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

      {activeTab === 'classes' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Classes Management</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={backfillClassInstructors}
                disabled={backfillLoading}
                style={{
                  backgroundColor: backfillLoading ? '#9ca3af' : '#0ea5e9',
                  color: 'white',
                  padding: '0.5rem 0.9rem',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: backfillLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {backfillLoading ? 'Syncing…' : 'Auto-assign Instructors'}
              </button>
            </div>
          </div>

          {backfillMessage && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: 8,
              background: backfillMessage.toLowerCase().includes('error') ? '#fee2e2' : '#d1fae5',
              color: backfillMessage.toLowerCase().includes('error') ? '#991b1b' : '#065f46',
              border: `1px solid ${backfillMessage.toLowerCase().includes('error') ? '#ef4444' : '#10b981'}`
            }}>
              {backfillMessage}
            </div>
          )}
          
          {classesLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading classes...</div>
          ) : classes.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>No classes found</p>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Classes will appear here when they are created.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: '1rem' 
            }}>
              {classes.map((classItem) => (
                <div 
                  key={classItem.id}
                  style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
                        {classItem.class_title}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        {classItem.class_type} • {classItem.target_audience}
                      </p>
                       <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                         <span>Date: {new Date(classItem.class_date).toLocaleDateString()}</span>
                         <span>Time: {classItem.start_time} - {classItem.end_time}</span>
                         <span>Location: {classItem.location}</span>
                       </div>
                       <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                         Folder: {classItem.folder_name}
                       </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.6rem',
                        border: '1px solid #d1d5db',
                        color: '#374151',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: '#ffffff'
                      }}>{classItem.status}</span>
                    </div>
                  </div>
                  
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                        Assigned Instructors:
                      </p>
                      {classInstructors[classItem.id]?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {classInstructors[classItem.id].map((instructor) => (
                            <div 
                              key={instructor.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.375rem 0.75rem',
                                backgroundColor: '#f3f4f6',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}
                            >
                              <span style={{ fontWeight: 500 }}>{instructor.name}</span>
                              <button
                                onClick={() => removeInstructor(classItem.id, instructor.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  padding: '0.125rem',
                                  lineHeight: 1
                                }}
                                title="Remove instructor"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                          No instructors assigned
                        </p>
                      )}
                      <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Participants: {classItem.current_participants}/{classItem.max_participants}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <select
                        onChange={(e) => e.target.value && assignInstructor(classItem.id, parseInt(e.target.value))}
                        disabled={assigningInstructor === classItem.id}
                        style={{
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: 'white',
                          cursor: assigningInstructor === classItem.id ? 'not-allowed' : 'pointer',
                          opacity: assigningInstructor === classItem.id ? 0.5 : 1
                        }}
                      >
                        <option value="">
                          {assigningInstructor === classItem.id ? 'Assigning...' : 'Add Instructor'}
                        </option>
                        {instructors.map((instructor) => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.name} ({instructor.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

      {/* Absence Management Tab */}
      {activeTab === 'absence' && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1F2937' }}>
              Employee Leave Management
            </h2>

            {absenceMessage && (
              <div style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: absenceMessage.includes('Error') || absenceMessage.includes('error') ? '#FEE2E2' : '#D1FAE5',
                color: absenceMessage.includes('Error') || absenceMessage.includes('error') ? '#991B1B' : '#065F46',
                border: `1px solid ${absenceMessage.includes('Error') || absenceMessage.includes('error') ? '#EF4444' : '#10B981'}`
              }}>
                {absenceMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <button
                onClick={() => setShowAllocationModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #FFB333, #FFD480)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(255, 179, 51, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                + Set Employee Leave Allocation
              </button>
              
              <button
                onClick={() => setShowImportantDateModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #5884FD, #8BA4FE)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(88, 132, 253, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                + Add Important Date
              </button>
            </div>

            {/* Employee Leave Allocations Table */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1F2937' }}>
                Employee Leave Balances ({new Date().getFullYear()})
              </h3>
              
              {absenceLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>Loading...</div>
              ) : leaveAllocations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No leave allocations set. Click "Set Employee Leave Allocation" to add one.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Employee</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Annual Leave</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Sick Leave</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>Casual Leave</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveAllocations.map((allocation) => (
                        <tr key={allocation.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ fontWeight: '500', color: '#1F2937' }}>{allocation.employee_name}</div>
                            <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>{allocation.employee_email}</div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '600', color: '#10B981', fontSize: '1.125rem' }}>
                                {allocation.annual_leave_remaining}
                              </span>
                              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}> / {allocation.annual_leave_total} days</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              Max {allocation.annual_leave_max_per_request} days/request
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '600', color: '#3B82F6', fontSize: '1.125rem' }}>
                                {allocation.sick_leave_remaining}
                              </span>
                              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}> / {allocation.sick_leave_total} days</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              Max {allocation.sick_leave_max_per_month} days/month
                            </div>
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <div style={{ marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '600', color: '#F59E0B', fontSize: '1.125rem' }}>
                                {allocation.casual_leave_remaining}
                              </span>
                              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}> / {allocation.casual_leave_total} days</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              Max {allocation.casual_leave_max_per_month} days/month
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Important Dates */}
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1F2937' }}>
                Important Dates (No Leave Allowed)
              </h3>
              
              {importantDates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  No important dates set. Click "Add Important Date" to add one.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                  {importantDates.map((date) => (
                    <div
                      key={date.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        background: '#F9FAFB',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1F2937', marginBottom: '0.25rem' }}>
                            {date.title}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                            {new Date(date.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          {date.description && (
                            <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
                              {date.description}
                            </div>
                          )}
                          <div style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: date.type === 'holiday' ? '#DBEAFE' : '#FEF3C7',
                            color: date.type === 'holiday' ? '#1E40AF' : '#92400E'
                          }}>
                            {date.type.replace('_', ' ').toUpperCase()}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteImportantDate(date.id)}
                          style={{
                            background: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.4rem 0.6rem',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            marginLeft: '0.5rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Set Leave Allocation Modal */}
      {showAllocationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1F2937' }}>
              Set Employee Leave Allocation
            </h3>
            
            <form onSubmit={createOrUpdateAllocation}>
              {/* Employee Selection */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Select Employee *
                </label>
                <select
                  required
                  value={selectedEmployee?.id || ''}
                  onChange={(e) => {
                    const emp = employees.find(emp => emp.id === parseInt(e.target.value));
                    setSelectedEmployee(emp || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">-- Select Employee --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name || emp.email} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Annual Leave */}
              <div style={{
                background: '#F9FAFB',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#10B981', marginBottom: '1rem' }}>
                  Annual Leave
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Total Days
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newAllocation.annual_leave_total}
                      onChange={(e) => setNewAllocation({ ...newAllocation, annual_leave_total: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Max Days Per Request
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newAllocation.annual_leave_max_per_request}
                      onChange={(e) => setNewAllocation({ ...newAllocation, annual_leave_max_per_request: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Sick Leave */}
              <div style={{
                background: '#F9FAFB',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#3B82F6', marginBottom: '1rem' }}>
                  Sick Leave
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Total Days
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newAllocation.sick_leave_total}
                      onChange={(e) => setNewAllocation({ ...newAllocation, sick_leave_total: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Max Days Per Month
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newAllocation.sick_leave_max_per_month}
                      onChange={(e) => setNewAllocation({ ...newAllocation, sick_leave_max_per_month: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Casual Leave */}
              <div style={{
                background: '#F9FAFB',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #E5E7EB'
              }}>
                <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#F59E0B', marginBottom: '1rem' }}>
                  Casual Leave
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Total Days
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newAllocation.casual_leave_total}
                      onChange={(e) => setNewAllocation({ ...newAllocation, casual_leave_total: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                      Max Days Per Month
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newAllocation.casual_leave_max_per_month}
                      onChange={(e) => setNewAllocation({ ...newAllocation, casual_leave_max_per_month: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAllocationModal(false);
                    setSelectedEmployee(null);
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={absenceLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: absenceLoading ? '#9CA3AF' : 'linear-gradient(135deg, #FFB333, #FFD480)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: absenceLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {absenceLoading ? 'Saving...' : 'Save Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Important Date Modal */}
      {showImportantDateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#1F2937' }}>
              Add Important Date
            </h3>
            
            <form onSubmit={createImportantDate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={newImportantDate.date}
                  onChange={(e) => setNewImportantDate({ ...newImportantDate, date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={newImportantDate.title}
                  onChange={(e) => setNewImportantDate({ ...newImportantDate, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                  placeholder="e.g., Company Meeting"
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Description
                </label>
                <textarea
                  value={newImportantDate.description}
                  onChange={(e) => setNewImportantDate({ ...newImportantDate, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Optional description"
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                  Type
                </label>
                <select
                  value={newImportantDate.type}
                  onChange={(e) => setNewImportantDate({ ...newImportantDate, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="company_event">Company Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                </select>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportantDateModal(false);
                    setNewImportantDate({
                      date: '',
                      title: '',
                      description: '',
                      type: 'company_event'
                    });
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#F3F4F6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={absenceLoading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: absenceLoading ? '#9CA3AF' : 'linear-gradient(135deg, #5884FD, #8BA4FE)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: absenceLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {absenceLoading ? 'Adding...' : 'Add Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
    </>
  );
}
