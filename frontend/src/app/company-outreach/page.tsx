'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Icons
const PlusIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const PencilIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ClockIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FilterIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
  </svg>
);

// Interfaces
interface User {
  id: number
  name: string
  email: string
  role: string
}

interface FieldSpecialization {
  id: number
  name: string
  description: string
  is_active: boolean
}

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
  contact_person?: User | null
  follow_up_person?: User | null
  meet_up_persons?: User[]
  specializations?: FieldSpecialization[]
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
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]) // Only assigned users
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyOutreach[]>([])
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
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

  // Check access control - STRICT ACCESS ONLY
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

      // Check user properties from auth context for admin access
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

      // Deny access if user is not in member list or admin
      console.log('❌ Access denied: User is not assigned to Company Outreach');
      setHasAccess(false)
      
    } catch (err) {
      console.error('Error checking company outreach access:', err)
      // Deny access on error
      console.log('❌ Access denied due to error');
      setHasAccess(false)
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
      
      // Fetch members (without embedding to avoid relationship conflicts)
      const { data: membersData, error: membersError } = await supabase
        .from('company_outreach_members')
        .select('*')
        .order('added_at', { ascending: false })

      if (membersError) throw membersError

      // Fetch user data for members separately
      const processedMembers = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: userData } = await supabase
            .from('auth_user')
            .select('id, name, email, role')
            .eq('id', member.user_id)
            .single()
          
          return {
            ...member,
            user: userData || null
          }
        })
      )

      // Get only assigned users (members) for dropdowns
      const assignedUserIds = (membersData || []).map(m => m.user_id)
      const { data: assignedUsersData, error: assignedUsersError } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .in('id', assignedUserIds)
        .order('name')

      if (assignedUsersError) throw assignedUsersError

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
      setAssignedUsers(assignedUsersData || []) // Only assigned users
      setMembers(processedMembers || [])
      
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
      filtered = filtered.filter(company => 
        company.field_of_specialization_ids.includes(parseInt(selectedSpecialization))
      )
    }

    // Filter by follow-up status
    if (selectedFollowUpStatus !== 'all') {
      filtered = filtered.filter(company => 
        company.follow_up_done === (selectedFollowUpStatus === 'done')
      )
    }

    setFilteredCompanies(filtered)
  }, [companies, searchTerm, selectedSpecialization, selectedFollowUpStatus])

  // Load data on component mount
  useEffect(() => {
    if (user && isAuthenticated) {
      checkAccess().then(() => {
        if (hasAccess) {
          fetchData()
        }
        setIsLoading(false)
      })
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, isAuthenticated, authLoading, hasAccess])

  // Handle form submission
  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .insert([formData])
      
      if (error) throw error
      
      setShowAddForm(false)
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
      
      fetchData()
    } catch (err: any) {
      setError('Failed to create company: ' + err.message)
    }
  }

  // Handle edit submission
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCompany) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .update(formData)
        .eq('id', editingCompany.id)
      
      if (error) throw error
      
      setShowEditForm(false)
      setEditingCompany(null)
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
      
      fetchData()
    } catch (err: any) {
      setError('Failed to update company: ' + err.message)
    }
  }

  // Toggle follow-up status
  const toggleFollowUpStatus = async (company: CompanyOutreach) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .update({ follow_up_done: !company.follow_up_done })
        .eq('id', company.id)
      
      if (error) throw error
      
      fetchData()
    } catch (err: any) {
      setError('Failed to update follow-up status: ' + err.message)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this company?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { error } = await supabase
        .from('company_outreach')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      fetchData()
    } catch (err: any) {
      setError('Failed to delete company: ' + err.message)
    }
  }

  // Start editing
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

  // Form styles
  const formStyles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    },
    modal: {
      background: '#ffffff',
      borderRadius: '16px',
      padding: '2rem',
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    header: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#111827',
      marginBottom: '1.5rem'
    },
    inputGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '0.5rem'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      color: '#111827',
      background: '#ffffff',
      boxSizing: 'border-box' as const
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '0.875rem',
      color: '#111827',
      background: '#ffffff',
      boxSizing: 'border-box' as const
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: 'none'
    }
  }

  // Table styles
  const tableStyles = {
    container: {
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const
    },
    th: {
      background: '#f9fafb',
      padding: '1rem',
      textAlign: 'left' as const,
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      color: '#111827',
      verticalAlign: 'top' as const
    },
    actionButton: {
      padding: '0.5rem',
      margin: '0 0.25rem',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    }
  }

  if (authLoading || isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        fontSize: '1rem',
        color: '#6b7280'
      }}>
        Loading Company Outreach...
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  if (!hasAccess) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        background: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '12px',
        color: '#dc2626',
        margin: '2rem'
      }}>
        <h2>Access Denied</h2>
        <p>You don't have permission to access Company Outreach. Please contact an administrator to get assigned to this feature.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '100%', margin: '0 auto', background: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', margin: 0 }}>
              Company Outreach
            </h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Manage company contacts and outreach activities
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              ...formStyles.button,
              background: '#111827',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PlusIcon style={{ width: '16px', height: '16px' }} />
            Add Company
          </button>
        </div>

        {/* Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          background: '#ffffff',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          <div>
            <label style={formStyles.label}>Search Companies</label>
            <input
              type="text"
              placeholder="Search by name, email, or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={formStyles.input}
            />
          </div>
          <div>
            <label style={formStyles.label}>Filter by Specialization</label>
            <select
              value={selectedSpecialization}
              onChange={(e) => setSelectedSpecialization(e.target.value)}
              style={formStyles.select}
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec.id} value={spec.id}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={formStyles.label}>Filter by Follow-up Status</label>
            <select
              value={selectedFollowUpStatus}
              onChange={(e) => setSelectedFollowUpStatus(e.target.value)}
              style={formStyles.select}
            >
              <option value="all">All Status</option>
              <option value="done">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
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

      {/* Companies Table */}
      <div style={tableStyles.container}>
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={tableStyles.th}>Company Name</th>
              <th style={tableStyles.th}>Specializations</th>
              <th style={tableStyles.th}>Contact Person</th>
              <th style={tableStyles.th}>Phone</th>
              <th style={tableStyles.th}>Email</th>
              <th style={tableStyles.th}>Follow-up Person</th>
              <th style={tableStyles.th}>Meet-up Persons</th>
              <th style={tableStyles.th}>Status</th>
              <th style={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies.map(company => (
              <tr key={company.id}>
                <td style={tableStyles.td}>
                  <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                    {company.company_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {company.address}
                  </div>
                </td>
                <td style={tableStyles.td}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {company.specializations?.map(spec => (
                      <span
                        key={spec.id}
                        style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        {spec.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={tableStyles.td}>
                  {company.contact_person ? (
                    <div>
                      <div style={{ fontWeight: '500' }}>{company.contact_person.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {company.contact_person.email}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Not assigned</span>
                  )}
                </td>
                <td style={tableStyles.td}>{company.phone_number || '-'}</td>
                <td style={tableStyles.td}>
                  {company.email_address ? (
                    <a 
                      href={`mailto:${company.email_address}`}
                      style={{ color: '#2563eb', textDecoration: 'none' }}
                    >
                      {company.email_address}
                    </a>
                  ) : '-'}
                </td>
                <td style={tableStyles.td}>
                  {company.follow_up_person ? (
                    <div>
                      <div style={{ fontWeight: '500' }}>{company.follow_up_person.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {company.follow_up_person.email}
                      </div>
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>Not assigned</span>
                  )}
                </td>
                <td style={tableStyles.td}>
                  {company.meet_up_persons && company.meet_up_persons.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {company.meet_up_persons.map(person => (
                        <div key={person.id} style={{ fontSize: '0.75rem' }}>
                          {person.name}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#9ca3af' }}>None assigned</span>
                  )}
                </td>
                <td style={tableStyles.td}>
                  <button
                    onClick={() => toggleFollowUpStatus(company)}
                    style={{
                      ...tableStyles.actionButton,
                      background: company.follow_up_done ? '#dcfce7' : '#fef3c7',
                      color: company.follow_up_done ? '#166534' : '#92400e',
                      border: company.follow_up_done ? '1px solid #bbf7d0' : '1px solid #fde68a',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      padding: '0.5rem 0.75rem'
                    }}
                  >
                    {company.follow_up_done ? 'Completed' : 'Pending'}
                  </button>
                </td>
                <td style={tableStyles.td}>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      onClick={() => startEdit(company)}
                      style={{
                        ...tableStyles.actionButton,
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db'
                      }}
                      title="Edit"
                    >
                      <PencilIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(company.id)}
                      style={{
                        ...tableStyles.actionButton,
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                      }}
                      title="Delete"
                    >
                      <TrashIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredCompanies.length === 0 && (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            {companies.length === 0 ? 'No companies added yet.' : 'No companies match your filters.'}
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div style={formStyles.overlay}>
          <div style={formStyles.modal}>
            <h2 style={formStyles.header}>Add New Company</h2>
            <form onSubmit={handleCreateCompany}>
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
                <select
                  multiple
                  value={formData.field_of_specialization_ids.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, field_of_specialization_ids: values })
                  }}
                  style={{
                    ...formStyles.select,
                    minHeight: '100px'
                  }}
                >
                  {specializations.map(spec => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
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
                  {assignedUsers.map(user => (
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
                  {assignedUsers.map(user => (
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
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, meet_up_person_ids: values })
                  }}
                  style={{
                    ...formStyles.select,
                    minHeight: '100px'
                  }}
                >
                  {assignedUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  style={{
                    ...formStyles.button,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...formStyles.button,
                    background: '#111827',
                    color: '#ffffff'
                  }}
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Form Modal */}
      {showEditForm && editingCompany && (
        <div style={formStyles.overlay}>
          <div style={formStyles.modal}>
            <h2 style={formStyles.header}>Edit Company</h2>
            <form onSubmit={handleUpdateCompany}>
              {/* Same form fields as Add Form but with update handler */}
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
                <select
                  multiple
                  value={formData.field_of_specialization_ids.map(String)}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, field_of_specialization_ids: values })
                  }}
                  style={{
                    ...formStyles.select,
                    minHeight: '100px'
                  }}
                >
                  {specializations.map(spec => (
                    <option key={spec.id} value={spec.id}>
                      {spec.name}
                    </option>
                  ))}
                </select>
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
                  {assignedUsers.map(user => (
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
                  {assignedUsers.map(user => (
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
                    const values = Array.from(e.target.selectedOptions, option => parseInt(option.value))
                    setFormData({ ...formData, meet_up_person_ids: values })
                  }}
                  style={{
                    ...formStyles.select,
                    minHeight: '100px'
                  }}
                >
                  {assignedUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Note</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false)
                    setEditingCompany(null)
                  }}
                  style={{
                    ...formStyles.button,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...formStyles.button,
                    background: '#111827',
                    color: '#ffffff'
                  }}
                >
                  Update Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 