'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { 
  FolderIcon, 
  CalendarIcon, 
  ChevronDownIcon, 
  ChevronRightIcon, 
  UserGroupIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  PhoneIcon, 
  LinkIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Reusable form styles
const formStyles = {
  input: {
    width: '100%',
    padding: '0.9rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '0.9rem',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '0.95rem',
    backgroundColor: '#fafafa',
    transition: 'all 0.2s ease',
    outline: 'none',
    cursor: 'pointer',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none' as const,
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23666666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.75rem center',
    backgroundSize: '1rem',
    paddingRight: '2.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.75rem',
    fontWeight: '600',
    fontSize: '1rem',
    color: '#374151',
    letterSpacing: '-0.01em'
  },
  inputGroup: {
    marginBottom: '2rem'
  },
  focusStyles: {
    borderColor: '#5884FD',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(88, 132, 253, 0.25)'
  },
  blurStyles: {
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
    boxShadow: 'none'
  }
} as const;

interface CompanyOutreach {
  id: number
  company_name: string
  field_of_specialization_ids: number[]
  contact_person_id: number | null
  phone_number: string
  email_address: string
  note: string
  follow_up_person_id: number | null
  address: string
  meet_up_person_ids: number[]
  follow_up_done: boolean
  created_by_id: number
  created_at: string
  updated_at: string
  contact_person?: User
  follow_up_person?: User
  meet_up_persons?: User[]
  specializations?: FieldSpecialization[]
}

interface FieldSpecialization {
  id: number
  name: string
  description: string
  is_active: boolean
  created_by_id: number
  created_at: string
  updated_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface CompanyOutreachMember {
  id: number
  user_id: number
  role: string
  user: User
}

export default function CompanyOutreachPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  // Data states
  const [companies, setCompanies] = useState<CompanyOutreach[]>([])
  const [specializations, setSpecializations] = useState<FieldSpecialization[]>([])
  const [members, setMembers] = useState<CompanyOutreachMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyOutreach[]>([])
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showSpecializationForm, setShowSpecializationForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyOutreach | null>(null)
  
  // Filter states
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all')
  const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    company_name: '',
    field_of_specialization_ids: [] as number[],
    contact_person_id: null as number | null,
    phone_number: '',
    email_address: '',
    note: '',
    follow_up_person_id: null as number | null,
    address: '',
    meet_up_person_ids: [] as number[],
    follow_up_done: false
  })
  
  const [newSpecialization, setNewSpecialization] = useState({
    name: '',
    description: ''
  })

  // Check access control
  const checkAccess = async () => {
    if (!user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      console.log('🔍 Checking Company Outreach page access for user:', user.id, user.email, user);
      
      // First check if user is a company outreach member
      const { data: memberData, error: memberError } = await supabase
        .from('company_outreach_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      console.log('📋 Company Outreach member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('✅ Company Outreach access granted: User is a member');
        setHasAccess(true)
        setUserRole(memberData.role)
        return
      }

      // Check user properties from auth context first
      const contextRole = user.role || (user as any)?.user_metadata?.role;
      const isAdmin = contextRole === 'admin' || contextRole === 'hr' || contextRole === 'superuser';
      
      console.log('🔍 Auth context check (page):', {
        contextRole,
        isAdmin,
        userRole: user.role,
        userMetadata: (user as any)?.user_metadata
      });

      if (isAdmin) {
        console.log('✅ Company Outreach access granted: Admin from context');
        setHasAccess(true)
        setUserRole('admin')
        return
      }

      // Check auth_user table for admin privileges
      const { data: userData, error: userError } = await supabase
        .from('auth_user')
        .select('id, name, email, role, is_superuser, is_staff')
        .eq('id', user.id)
        .single()

      console.log('👤 Company Outreach database user check (page):', userData, userError);

      if (!userError && userData) {
        const hasAdminPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr'
        console.log('🔐 Company Outreach admin/HR check (page):', {
          is_superuser: userData.is_superuser,
          is_staff: userData.is_staff,
          role: userData.role,
          hasAdminPermission
        });
        
        if (hasAdminPermission) {
          console.log('✅ Company Outreach access granted: Admin from database');
          setHasAccess(true)
          setUserRole('admin')
          return
        }
      }

      // Grant access to all authenticated users (fallback for development)
      console.log('⚠️ Granting page access to authenticated user (fallback)');
      setHasAccess(true)
      setUserRole('member')
      
    } catch (err) {
      console.error('Error checking company outreach access:', err)
      // Grant access on error for testing
      console.log('⚠️ Granting page access due to error for testing');
      setHasAccess(true)
      setUserRole('member')
    }
  }

  // Fetch all data
  const fetchData = async () => {
    if (!user?.id) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Fetch companies data first
      const { data: companiesData, error: companiesError } = await supabase
        .from('company_outreach')
        .select('*')
        .order('created_at', { ascending: false })

      if (companiesError) throw companiesError
      
      // Fetch specializations
      const { data: specializationsData, error: specializationsError } = await supabase
        .from('company_outreach_specializations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (specializationsError) throw specializationsError
      
      // Fetch all users for dropdowns
      const { data: usersData, error: usersError } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .order('name')

      if (usersError) throw usersError
      
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('company_outreach_members')
        .select(`
          *,
          user:auth_user(id, name, email, role)
        `)
        .order('added_at', { ascending: false })

      if (membersError) throw membersError

      // Process company data to include related user data and specializations
      const processedCompanies = await Promise.all(
        (companiesData || []).map(async (company) => {
          // Fetch contact person
          let contactPerson: User | null = null
          if (company.contact_person_id) {
            const { data: contactData } = await supabase
              .from('auth_user')
              .select('id, name, email, role')
              .eq('id', company.contact_person_id)
              .single()
            contactPerson = contactData
          }
          
          // Fetch follow-up person
          let followUpPerson: User | null = null
          if (company.follow_up_person_id) {
            const { data: followUpData } = await supabase
              .from('auth_user')
              .select('id, name, email, role')
              .eq('id', company.follow_up_person_id)
              .single()
            followUpPerson = followUpData
          }
          
          // Fetch meet up persons
          let meetUpPersons: User[] = []
          if (company.meet_up_person_ids && company.meet_up_person_ids.length > 0) {
            const { data: meetUpData } = await supabase
              .from('auth_user')
              .select('id, name, email, role')
              .in('id', company.meet_up_person_ids)
            meetUpPersons = meetUpData || []
          }
          
          // Fetch specializations
          let companySpecializations: FieldSpecialization[] = []
          if (company.field_of_specialization_ids && company.field_of_specialization_ids.length > 0) {
            const { data: specData } = await supabase
              .from('company_outreach_specializations')
              .select('*')
              .in('id', company.field_of_specialization_ids)
            companySpecializations = specData || []
          }
          
          return {
            ...company,
            contact_person: contactPerson,
            follow_up_person: followUpPerson,
            meet_up_persons: meetUpPersons,
            specializations: companySpecializations
          }
        })
      )
      
      setCompanies(processedCompanies)
      setSpecializations(specializationsData || [])
      setAllUsers(usersData || [])
      setMembers(membersData || [])
      
    } catch (err: any) {
      console.error('Error fetching company outreach data:', err)
      setError('Failed to load data: ' + err.message)
    }
  }

  // Filter companies based on selected filters
  useEffect(() => {
    let filtered = companies

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(company => 
        company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.note.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by specialization
    if (selectedSpecialization !== 'all') {
      const specializationId = parseInt(selectedSpecialization)
      filtered = filtered.filter(company => 
        company.field_of_specialization_ids?.includes(specializationId)
      )
    }

    // Filter by follow up status
    if (selectedFollowUpStatus !== 'all') {
      const isDone = selectedFollowUpStatus === 'done'
      filtered = filtered.filter(company => company.follow_up_done === isDone)
    }

    setFilteredCompanies(filtered)
  }, [companies, searchTerm, selectedSpecialization, selectedFollowUpStatus])

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    checkAccess()
  }, [isAuthenticated, authLoading, user?.id, router])

  useEffect(() => {
    if (hasAccess) {
      fetchData().finally(() => setIsLoading(false))
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [hasAccess, user?.id])

  const resetForm = () => {
    setFormData({
      company_name: '',
      field_of_specialization_ids: [],
      contact_person_id: null,
      phone_number: '',
      email_address: '',
      note: '',
      follow_up_person_id: null,
      address: '',
      meet_up_person_ids: [],
      follow_up_done: false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .insert([{
          ...formData,
          created_by_id: user?.id
        }])

      if (error) throw error

      await fetchData()
      setShowAddForm(false)
      resetForm()
    } catch (err: any) {
      console.error('Error creating company:', err)
      setError('Failed to create company: ' + err.message)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCompany) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .update(formData)
        .eq('id', editingCompany.id)

      if (error) throw error

      await fetchData()
      setShowEditForm(false)
      setEditingCompany(null)
      resetForm()
    } catch (err: any) {
      console.error('Error updating company:', err)
      setError('Failed to update company: ' + err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchData()
    } catch (err: any) {
      console.error('Error deleting company:', err)
      setError('Failed to delete company: ' + err.message)
    }
  }

  const addSpecialization = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { data, error } = await supabase
        .from('company_outreach_specializations')
        .insert([{
          ...newSpecialization,
          created_by_id: user?.id
        }])
        .select()
        .single()

      if (error) throw error

      // Refresh specializations list immediately
      const { data: updatedSpecializations, error: fetchError } = await supabase
        .from('company_outreach_specializations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (!fetchError) {
        setSpecializations(updatedSpecializations || [])
      }

      setShowSpecializationForm(false)
      setNewSpecialization({ name: '', description: '' })
      
      // Show success message
      setError('')
    } catch (err: any) {
      console.error('Error adding specialization:', err)
      setError('Failed to add specialization: ' + err.message)
    }
  }

  const startEdit = (company: CompanyOutreach) => {
    setEditingCompany(company)
    setFormData({
      company_name: company.company_name,
      field_of_specialization_ids: company.field_of_specialization_ids || [],
      contact_person_id: company.contact_person_id,
      phone_number: company.phone_number,
      email_address: company.email_address,
      note: company.note,
      follow_up_person_id: company.follow_up_person_id,
      address: company.address,
      meet_up_person_ids: company.meet_up_person_ids || [],
      follow_up_done: company.follow_up_done
    })
    setShowEditForm(true)
  }

  const toggleFollowUpStatus = async (company: CompanyOutreach) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .update({ follow_up_done: !company.follow_up_done })
        .eq('id', company.id)

      if (error) throw error

      await fetchData()
    } catch (err: any) {
      console.error('Error updating follow up status:', err)
      setError('Failed to update follow up status: ' + err.message)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ textAlign: 'center', color: '#666666' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>Loading...</div>
            <div>Please wait while we load the company outreach data.</div>
          </div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '300', marginBottom: '1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>
              Access Denied
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666666', marginBottom: '2rem', lineHeight: '1.6' }}>
              You don't have permission to access the Company Outreach section.
              Please contact an administrator to request access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '0.875rem 2rem',
                background: '#5884FD',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
      <Sidebar projects={[]} onCreateProject={() => {}} />
      
      <main style={{ 
        marginLeft: '256px',
        padding: '2rem', 
        background: '#F5F5ED', 
        flex: 1,
        minHeight: '100vh'
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '2rem',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '700', 
                color: '#111827', 
                margin: '0 0 0.5rem 0',
                letterSpacing: '-0.02em'
              }}>
                Company Outreach
              </h1>
              <p style={{ 
                fontSize: '1.1rem', 
                color: '#6b7280', 
                margin: 0,
                fontWeight: '400'
              }}>
                Manage and track company partnerships and outreach efforts
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#374151',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <UserGroupIcon style={{ width: '18px', height: '18px' }} />
                  Manage Members
                </button>
              )}
              <button
                onClick={() => setShowSpecializationForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '2px solid #d1d5db',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PlusIcon style={{ width: '18px', height: '18px' }} />
                Add Field
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                <PlusIcon style={{ width: '18px', height: '18px' }} />
                Add Company
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '1rem',
            marginTop: '1.5rem'
          }}>
            <div>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  ...formStyles.input,
                  margin: 0
                }}
              />
            </div>
            
            <div>
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                style={{
                  ...formStyles.select,
                  margin: 0
                }}
              >
                <option value="all">All Specializations</option>
                {specializations.map(spec => (
                  <option key={spec.id} value={spec.id.toString()}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={selectedFollowUpStatus}
                onChange={(e) => setSelectedFollowUpStatus(e.target.value)}
                style={{
                  ...formStyles.select,
                  margin: 0
                }}
              >
                <option value="all">All Follow-up Status</option>
                <option value="done">Follow-up Done</option>
                <option value="pending">Follow-up Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            color: '#dc2626'
          }}>
            {error}
          </div>
        )}

        {/* Companies Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem'
        }}>
          {filteredCompanies.map(company => (
            <div
              key={company.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Company Header */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                  <h3 style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '700', 
                    color: '#111827', 
                    margin: 0,
                    flex: 1
                  }}>
                    {company.company_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => toggleFollowUpStatus(company)}
                      style={{
                        padding: '0.25rem',
                        background: company.follow_up_done ? '#dcfce7' : '#fef3c7',
                        color: company.follow_up_done ? '#166534' : '#92400e',
                        border: company.follow_up_done ? '1px solid #bbf7d0' : '1px solid #fde68a',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      title={company.follow_up_done ? 'Mark as pending' : 'Mark as done'}
                    >
                      {company.follow_up_done ? (
                        <CheckIcon style={{ width: '16px', height: '16px' }} />
                      ) : (
                        <ClockIcon style={{ width: '16px', height: '16px' }} />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(company)}
                      style={{
                        padding: '0.25rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <PencilIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      style={{
                        padding: '0.25rem',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <TrashIcon style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
                
                {/* Specializations */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {company.specializations?.map(spec => (
                    <span
                      key={spec.id}
                      style={{
                        background: '#f3f4f6',
                        color: '#374151',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}
                    >
                      {spec.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Company Details */}
              <div style={{ marginBottom: '1rem' }}>
                {company.contact_person && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <UserGroupIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                      Contact: {company.contact_person.name}
                    </span>
                  </div>
                )}
                
                {company.phone_number && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <PhoneIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{company.phone_number}</span>
                  </div>
                )}
                
                {company.email_address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <EnvelopeIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{company.email_address}</span>
                  </div>
                )}
                
                {company.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <MapPinIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                    <span style={{ fontSize: '0.9rem', color: '#374151' }}>{company.address}</span>
                  </div>
                )}
              </div>

              {/* Follow-up Information */}
              {(company.follow_up_person || company.meet_up_persons?.length) && (
                <div style={{ marginBottom: '1rem' }}>
                  {company.follow_up_person && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <ClockIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                        Follow-up: {company.follow_up_person.name}
                      </span>
                    </div>
                  )}
                  
                  {company.meet_up_persons && company.meet_up_persons.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <UsersIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                      <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                        Meet-up: {company.meet_up_persons.map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {company.note && (
                <div style={{ 
                  background: '#f9fafb', 
                  borderRadius: '8px', 
                  padding: '0.75rem',
                  marginTop: '1rem'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: '#374151', 
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    {company.note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCompanies.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb'
          }}>
            <BuildingOfficeIcon style={{ 
              width: '64px', 
              height: '64px', 
              color: '#d1d5db', 
              margin: '0 auto 1rem'
            }} />
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '0.5rem' 
            }}>
              No companies found
            </h3>
            <p style={{ 
              fontSize: '1rem', 
              color: '#6b7280', 
              marginBottom: '1.5rem' 
            }}>
              {companies.length === 0 
                ? "Get started by adding your first company."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {companies.length === 0 && (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                Add First Company
              </button>
            )}
          </div>
        )}
      </main>

      {/* Add Company Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Add New Company
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Field of Specialization</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  <select
                    multiple
                    value={formData.field_of_specialization_ids.map(String)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                      setFormData({ ...formData, field_of_specialization_ids: selectedIds })
                    }}
                    style={{
                      ...formStyles.select,
                      height: '120px',
                      backgroundImage: 'none',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {specializations.map(spec => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSpecializationForm(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add New Field
                  </button>
                </div>
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Hold Ctrl/Cmd to select multiple specializations. Click "Add New Field" to create custom specializations.
                </small>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Contact Person</label>
                <select
                  value={formData.contact_person_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    contact_person_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  style={formStyles.select}
                >
                  <option value="">Select contact person...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formStyles.inputGroup}>
                  <label style={formStyles.label}>Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    style={formStyles.input}
                  />
                </div>

                <div style={formStyles.inputGroup}>
                  <label style={formStyles.label}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    style={formStyles.input}
                  />
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Follow-up Person</label>
                <select
                  value={formData.follow_up_person_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    follow_up_person_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  style={formStyles.select}
                >
                  <option value="">Select follow-up person...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Meet-up Persons</label>
                <select
                  multiple
                  value={formData.meet_up_person_ids.map(String)}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, meet_up_person_ids: selectedIds })
                  }}
                  style={{
                    ...formStyles.select,
                    height: '120px',
                    backgroundImage: 'none'
                  }}
                >
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  Hold Ctrl/Cmd to select multiple persons
                </small>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Notes</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Add any notes about this company..."
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.follow_up_done}
                    onChange={(e) => setFormData({ ...formData, follow_up_done: e.target.checked })}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                    Follow-up completed
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                  }}
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditForm && editingCompany && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Edit Company
              </h2>
              <button
                onClick={() => {
                  setShowEditForm(false)
                  setEditingCompany(null)
                  resetForm()
                }}
                style={{
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleEdit}>
              {/* Same form fields as Add Company Modal */}
              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Company Name *</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  style={formStyles.input}
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Field of Specialization</label>
                <div style={{ marginBottom: '0.5rem' }}>
                  <select
                    multiple
                    value={formData.field_of_specialization_ids.map(String)}
                    onChange={(e) => {
                      const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                      setFormData({ ...formData, field_of_specialization_ids: selectedIds })
                    }}
                    style={{
                      ...formStyles.select,
                      height: '120px',
                      backgroundImage: 'none',
                      marginBottom: '0.5rem'
                    }}
                  >
                    {specializations.map(spec => (
                      <option key={spec.id} value={spec.id}>
                        {spec.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSpecializationForm(true)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add New Field
                  </button>
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Contact Person</label>
                <select
                  value={formData.contact_person_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    contact_person_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  style={formStyles.select}
                >
                  <option value="">Select contact person...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={formStyles.inputGroup}>
                  <label style={formStyles.label}>Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    style={formStyles.input}
                  />
                </div>

                <div style={formStyles.inputGroup}>
                  <label style={formStyles.label}>Email Address</label>
                  <input
                    type="email"
                    value={formData.email_address}
                    onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                    style={formStyles.input}
                  />
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Follow-up Person</label>
                <select
                  value={formData.follow_up_person_id || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    follow_up_person_id: e.target.value ? parseInt(e.target.value) : null 
                  })}
                  style={formStyles.select}
                >
                  <option value="">Select follow-up person...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Meet-up Persons</label>
                <select
                  multiple
                  value={formData.meet_up_person_ids.map(String)}
                  onChange={(e) => {
                    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, meet_up_person_ids: selectedIds })
                  }}
                  style={{
                    ...formStyles.select,
                    height: '120px',
                    backgroundImage: 'none'
                  }}
                >
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Notes</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                  placeholder="Add any notes about this company..."
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.follow_up_done}
                    onChange={(e) => setFormData({ ...formData, follow_up_done: e.target.checked })}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                    Follow-up completed
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingCompany(null)
                    resetForm()
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                  }}
                >
                  Update Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Specialization Modal */}
      {showSpecializationForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Add Field of Specialization
              </h2>
              <button
                onClick={() => setShowSpecializationForm(false)}
                style={{
                  padding: '0.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={addSpecialization}>
              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Specialization Name *</label>
                <input
                  type="text"
                  required
                  value={newSpecialization.name}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, name: e.target.value })}
                  style={formStyles.input}
                  placeholder="e.g. Technology, Healthcare, Finance..."
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Description</label>
                <textarea
                  value={newSpecialization.description}
                  onChange={(e) => setNewSpecialization({ ...newSpecialization, description: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Brief description of this specialization field..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowSpecializationForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                  }}
                >
                  Add Specialization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 