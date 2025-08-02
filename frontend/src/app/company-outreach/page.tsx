'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckIcon, 
  ClockIcon, 
  FunnelIcon as FilterIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

// Reusable form styles to match theme
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
    WebkitAppearance: 'none' as any,
    MozAppearance: 'none' as any,
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
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none'
  }
};

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
  phone_call_status: string
  phone_call_notes: string
  facebook_url: string
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
  const [showViewForm, setShowViewForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [editingCompany, setEditingCompany] = useState<CompanyOutreach | null>(null)
  const [viewingCompany, setViewingCompany] = useState<CompanyOutreach | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<{ [key: number]: string }>({}) // userId -> role
  const [showSpecializationForm, setShowSpecializationForm] = useState(false)
  const [newSpecialization, setNewSpecialization] = useState({ name: '', description: '' })
  
  // Inline editing states
  const [editingCell, setEditingCell] = useState<{companyId: number, field: string} | null>(null)
  const [editingValue, setEditingValue] = useState<any>('')
  
  // Filter states
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('all')
  const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState<string>('all')
  const [selectedPhoneCallStatus, setSelectedPhoneCallStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form data
  const [formData, setFormData] = useState({
    company_name: '',
    field_of_specialization_ids: [] as number[], // Keep as array for backend compatibility
    selected_specialization_id: null as number | null, // Single selection for UI
    contact_person_id: null as number | null,
    phone_number: '',
    email_address: '',
    note: '',
    follow_up_person_id: null as number | null,
    address: '',
    meet_up_person_ids: [] as number[],
    follow_up_done: false,
    phone_call_status: 'pending',
    phone_call_notes: '',
    facebook_url: ''
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
      setUserRole('')
      
    } catch (err) {
      console.error('Error checking company outreach access:', err)
      // Deny access on error
      console.log('❌ Access denied due to error');
      setHasAccess(false)
      setUserRole('')
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
      
      // Fetch all users for member management (admin only)
      if (userRole === 'admin') {
        const { data: allUsersData, error: allUsersError } = await supabase
          .from('auth_user')
          .select('id, name, email, role')
          .order('name')

        if (!allUsersError) {
          setAllUsers(allUsersData || [])
        }

        // Set current member selections
        const memberMap: { [key: number]: string } = {}
        processedMembers.forEach(member => {
          memberMap[member.user_id] = member.role
        })
        setSelectedMembers(memberMap)
      }
      
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

    // Filter by phone call status
    if (selectedPhoneCallStatus !== 'all') {
      filtered = filtered.filter(company => 
        company.phone_call_status === selectedPhoneCallStatus
      )
    }

    setFilteredCompanies(filtered)
  }, [companies, searchTerm, selectedSpecialization, selectedFollowUpStatus, selectedPhoneCallStatus])

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
      
      // Prepare data for insertion
      const insertData = {
        ...formData,
        field_of_specialization_ids: formData.selected_specialization_id ? [formData.selected_specialization_id] : []
      }
      delete (insertData as any).selected_specialization_id
      
      const { error } = await supabase
        .from('company_outreach')
        .insert([insertData])
      
      if (error) throw error
      
      setShowAddForm(false)
      resetForm()
      fetchData()
    } catch (err: any) {
      setError('Failed to create company: ' + err.message)
    }
  }

  // Reset form function
  const resetForm = () => {
    setFormData({
      company_name: '',
      field_of_specialization_ids: [],
      selected_specialization_id: null,
      contact_person_id: null,
      phone_number: '',
      email_address: '',
      note: '',
      follow_up_person_id: null,
      address: '',
      meet_up_person_ids: [],
      follow_up_done: false,
      phone_call_status: 'pending',
      phone_call_notes: '',
      facebook_url: ''
    })
  }

  // Handle edit submission
  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingCompany) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Prepare data for update
      const updateData = {
        ...formData,
        field_of_specialization_ids: formData.selected_specialization_id ? [formData.selected_specialization_id] : []
      }
      delete (updateData as any).selected_specialization_id
      
      const { error } = await supabase
        .from('company_outreach')
        .update(updateData)
        .eq('id', editingCompany.id)
      
      if (error) throw error
      
      setShowEditForm(false)
      setEditingCompany(null)
      resetForm()
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

  // Member management functions
  const handleMemberToggle = (userId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMembers(prev => ({ ...prev, [userId]: 'member' }))
    } else {
      setSelectedMembers(prev => {
        const updated = { ...prev }
        delete updated[userId]
        return updated
      })
    }
  }

  const handleRoleChange = (userId: number, role: string) => {
    setSelectedMembers(prev => ({ ...prev, [userId]: role }))
  }

  const saveMemberAssignments = async () => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // First, remove all existing members
      await supabase
        .from('company_outreach_members')
        .delete()
        .neq('id', 0) // Delete all
      
      // Then add selected members
      const memberInserts = Object.entries(selectedMembers).map(([userId, role]) => ({
        user_id: parseInt(userId),
        role: role
      }))
      
      if (memberInserts.length > 0) {
        const { error } = await supabase
          .from('company_outreach_members')
          .insert(memberInserts)
        
        if (error) throw error
      }
      
      setShowMemberModal(false)
      fetchData() // Refresh data
    } catch (err: any) {
      setError('Failed to save member assignments: ' + err.message)
    }
  }

  // Add new specialization
  const addSpecialization = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const { data, error } = await supabase
        .from('company_outreach_specializations')
        .insert([{
          name: newSpecialization.name,
          description: newSpecialization.description,
          is_active: true
        }])
        .select()
        .single()
      
      if (error) throw error
      
      // Refresh specializations list
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
      setError('')
    } catch (err: any) {
      setError('Failed to add specialization: ' + err.message)
    }
  }

  // Start editing
  const startEdit = (company: CompanyOutreach) => {
    setEditingCompany(company)
    setFormData({
      company_name: company.company_name,
      field_of_specialization_ids: company.field_of_specialization_ids || [],
      selected_specialization_id: company.field_of_specialization_ids && company.field_of_specialization_ids.length > 0 ? company.field_of_specialization_ids[0] : null,
      contact_person_id: company.contact_person_id,
      phone_number: company.phone_number,
      email_address: company.email_address,
      note: company.note,
      follow_up_person_id: company.follow_up_person_id,
      address: company.address,
      meet_up_person_ids: company.meet_up_person_ids || [],
      follow_up_done: company.follow_up_done,
      phone_call_status: company.phone_call_status || 'pending',
      phone_call_notes: company.phone_call_notes || '',
      facebook_url: company.facebook_url || ''
    })
    setShowEditForm(true)
  }

  // Start viewing
  const startView = (company: CompanyOutreach) => {
    setViewingCompany(company)
    setShowViewForm(true)
  }

  // Inline editing functions
  const startInlineEdit = (companyId: number, field: string, currentValue: any) => {
    setEditingCell({ companyId, field })
    setEditingValue(currentValue)
  }

  const cancelInlineEdit = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const saveInlineEdit = async () => {
    if (!editingCell) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { companyId, field } = editingCell

      let updateData: any = {}
      
      // Handle different field types
      switch (field) {
        case 'field_of_specialization_ids':
          updateData[field] = editingValue ? [editingValue] : []
          break
        case 'meet_up_person_ids':
          updateData[field] = Array.isArray(editingValue) ? editingValue : (editingValue ? [editingValue] : [])
          break
        default:
          updateData[field] = editingValue
      }

      const { error } = await supabase
        .from('company_outreach')
        .update(updateData)
        .eq('id', companyId)

      if (error) throw error

      // Update local state
      setCompanies(prev => prev.map(company => 
        company.id === companyId 
          ? { ...company, ...updateData }
          : company
      ))

      cancelInlineEdit()
    } catch (error) {
      console.error('Error updating company:', error)
      alert('Failed to update company')
    }
  }

  const startEditingInline = (companyId: number, field: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setEditingCell({ companyId, field })
      setEditingValue(company[field as keyof CompanyOutreach] || '')
    }
  }

  const toggleFollowUpStatusInline = async (company: CompanyOutreach) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const newStatus = !company.follow_up_done

      const { error } = await supabase
        .from('company_outreach')
        .update({ follow_up_done: newStatus })
        .eq('id', company.id)

      if (error) throw error

      // Update local state
      setCompanies(prev => prev.map(c => 
        c.id === company.id 
          ? { ...c, follow_up_done: newStatus }
          : c
      ))
    } catch (error) {
      console.error('Error updating follow-up status:', error)
      alert('Failed to update follow-up status')
    }
  }

  const togglePhoneCallStatusInline = async (company: CompanyOutreach) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const newStatus = company.phone_call_status === 'completed' ? 'pending' : 'completed'

      const { error } = await supabase
        .from('company_outreach')
        .update({ phone_call_status: newStatus })
        .eq('id', company.id)

      if (error) throw error

      // Update local state
      setCompanies(prev => prev.map(c => 
        c.id === company.id 
          ? { ...c, phone_call_status: newStatus }
          : c
      ))
    } catch (error) {
      console.error('Error updating phone call status:', error)
      alert('Failed to update phone call status')
    }
  }

  // Render editable cell
  const renderEditableCell = (company: CompanyOutreach, field: string, displayValue: any, cellType: 'text' | 'select' | 'multiselect' = 'text', options?: any[]) => {
    const isEditing = editingCell?.companyId === company.id && editingCell?.field === field
    
    const cellStyle = {
      padding: '1rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      color: '#111827',
      verticalAlign: 'top' as const,
      cursor: isEditing ? 'default' : 'pointer',
      position: 'relative' as const,
      transition: 'background-color 0.2s ease'
    }

    if (isEditing) {
      return (
        <td style={cellStyle}>
          {cellType === 'text' && (
            <input
              type={field === 'email_address' ? 'email' : field === 'phone_number' ? 'tel' : 'text'}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={saveInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveInlineEdit()
                if (e.key === 'Escape') cancelInlineEdit()
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          )}
          {cellType === 'select' && options && (
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(parseInt(e.target.value))}
              onBlur={saveInlineEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveInlineEdit()
                if (e.key === 'Escape') cancelInlineEdit()
              }}
              autoFocus
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="">Select...</option>
              {options.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name || option.email}
                </option>
              ))}
            </select>
          )}
          {cellType === 'multiselect' && options && (
            <div style={{
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              padding: '0.5rem',
              background: '#fff',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {options.map(option => (
                <label 
                  key={option.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '0.25rem 0',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={Array.isArray(editingValue) ? editingValue.includes(option.id) : false}
                    onChange={(e) => {
                      const currentIds = Array.isArray(editingValue) ? editingValue : []
                      if (e.target.checked) {
                        setEditingValue([...currentIds, option.id])
                      } else {
                        setEditingValue(currentIds.filter((id: number) => id !== option.id))
                      }
                    }}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontSize: '0.75rem' }}>{option.name}</span>
                </label>
              ))}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginTop: '0.5rem', 
                paddingTop: '0.5rem', 
                borderTop: '1px solid #e5e7eb' 
              }}>
                <button
                  onClick={saveInlineEdit}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={cancelInlineEdit}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </td>
      )
    }

    return (
      <td 
        style={cellStyle}
        onDoubleClick={() => {
          let currentValue: any = ''
          switch (field) {
            case 'field_of_specialization_ids':
              currentValue = company.field_of_specialization_ids?.[0] || ''
              break
            case 'meet_up_person_ids':
              currentValue = company.meet_up_person_ids || []
              break
            case 'contact_person_id':
            case 'follow_up_person_id':
              currentValue = (company as any)[field] || ''
              break
            default:
              currentValue = (company as any)[field] || ''
          }
          startInlineEdit(company.id, field, currentValue)
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
        title="Double-click to edit"
      >
        {displayValue}
      </td>
    )
  }

  // Modal overlay styles
  const modalOverlayStyles = {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '1rem'
  }

  const modalStyles = {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto'
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
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #C483D9', 
            borderTop: '3px solid #5884FD', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return null
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
              You don't have permission to access Company Outreach. Please contact an administrator to get assigned to this feature.
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
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#F5F5ED', 
          flex: 1,
          minHeight: '100vh',
          overflow: 'hidden',
          maxWidth: 'calc(100vw - 256px)'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '3rem',
            paddingBottom: '1.5rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Company Outreach
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage company contacts and outreach partnerships
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  style={{
                    ...formStyles.button,
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
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
                onClick={() => setShowAddForm(true)}
                style={{
                  ...formStyles.button,
                  background: '#5884FD',
                  color: '#ffffff',
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
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1.5rem'
            }}>
              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Search Companies</label>
                <input
                  type="text"
                  placeholder="Search by name, email, or note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={formStyles.input}
                />
              </div>
              <div style={formStyles.inputGroup}>
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
              <div style={formStyles.inputGroup}>
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
              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Filter by Phone Call Status</label>
                <select
                  value={selectedPhoneCallStatus}
                  onChange={(e) => setSelectedPhoneCallStatus(e.target.value)}
                  style={formStyles.select}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Yes Completed</option>
                  <option value="pending">No Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: '#dc2626'
            }}>
              {error}
            </div>
          )}

          {/* Companies Table */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            width: '100%',
            overflow: 'hidden'
          }}>
            <div style={{
              overflowX: 'auto' as const,
              overflowY: 'auto' as const,
              width: '100%',
              maxHeight: '70vh'
            }}>
            <table style={{
              borderCollapse: 'collapse' as const,
              minWidth: '1200px',
              width: 'max-content'
            }}>
              <thead>
                <tr>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Company Name</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Specializations</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Contact Person</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Phone</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Email</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Follow-up Person</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Meet-up Persons</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Status</th>
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Phone Call Status</th>
                  {/* <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Phone Call Notes</th> */}
                  <th style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    textAlign: 'left' as const,
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #e5e7eb'
                  }}>Actions</th>
                </tr>
              </thead>
                        <tbody>
                {filteredCompanies.map(company => (
                  <tr key={company.id}>
                    <td style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#111827',
                      verticalAlign: 'top' as const
                    }}>
                      <div 
                        style={{ 
                          fontWeight: '600', 
                          marginBottom: '0.25rem',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onDoubleClick={() => startInlineEdit(company.id, 'company_name', company.company_name)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Double-click to edit company name"
                      >
                        {editingCell?.companyId === company.id && editingCell?.field === 'company_name' ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit()
                              if (e.key === 'Escape') cancelInlineEdit()
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '2px solid #3b82f6',
                              borderRadius: '4px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              fontWeight: '600'
                            }}
                          />
                        ) : (
                          company.company_name
                        )}
                      </div>
                      <div 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: '#6b7280',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onDoubleClick={() => startInlineEdit(company.id, 'address', company.address)}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Double-click to edit address"
                      >
                        {editingCell?.companyId === company.id && editingCell?.field === 'address' ? (
                          <input
                            type="text"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={saveInlineEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveInlineEdit()
                              if (e.key === 'Escape') cancelInlineEdit()
                            }}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '0.25rem',
                              border: '2px solid #3b82f6',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              outline: 'none'
                            }}
                          />
                        ) : (
                          company.address || 'No address'
                        )}
                      </div>
                    </td>
                    {renderEditableCell(
                      company,
                      'field_of_specialization_ids',
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
                      </div>,
                      'select',
                      specializations
                    )}
                    {renderEditableCell(
                      company,
                      'contact_person_id',
                      company.contact_person ? (
                        <div>
                          <div style={{ fontWeight: '500' }}>{company.contact_person.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {company.contact_person.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Not assigned</span>
                      ),
                      'select',
                      assignedUsers
                    )}
                    {renderEditableCell(
                      company,
                      'phone_number',
                      company.phone_number || '-'
                    )}
                    {renderEditableCell(
                      company,
                      'email_address',
                      company.email_address ? (
                        <a 
                          href={`mailto:${company.email_address}`}
                          style={{ color: '#5884FD', textDecoration: 'none' }}
                        >
                          {company.email_address}
                        </a>
                      ) : '-'
                    )}
                    {renderEditableCell(
                      company,
                      'follow_up_person_id',
                      company.follow_up_person ? (
                        <div>
                          <div style={{ fontWeight: '500' }}>{company.follow_up_person.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {company.follow_up_person.email}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>Not assigned</span>
                      ),
                      'select',
                      assignedUsers
                    )}
                    {renderEditableCell(
                      company,
                      'meet_up_person_ids',
                      company.meet_up_persons && company.meet_up_persons.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {company.meet_up_persons.map(person => (
                            <div key={person.id} style={{ fontSize: '0.75rem' }}>
                              {person.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>None assigned</span>
                      ),
                      'multiselect',
                      assignedUsers
                    )}
                    <td style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#111827',
                      verticalAlign: 'top' as const,
                      cursor: 'pointer'
                    }}>
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          gap: '1rem',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={() => toggleFollowUpStatusInline(company)}
                        title="Click to toggle status"
                      >
                        <span style={{ 
                          color: company.follow_up_done ? '#10b981' : '#f59e0b', 
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {company.follow_up_done ? '✓ Yes - Completed' : '○ No - Pending'}
                        </span>
                      </div>
                    </td>
                    <td style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#111827',
                      verticalAlign: 'top' as const
                    }}>
                      <div 
                        style={{
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onClick={() => togglePhoneCallStatusInline(company)}
                        title="Click to toggle phone call status"
                      >
                        <span style={{ 
                          color: company.phone_call_status === 'completed' ? '#10b981' : '#f59e0b', 
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {company.phone_call_status === 'completed' ? '✓ Yes - Completed' : '○ No - Pending'}
                        </span>
                      </div>
                    </td>
                    {/* <td style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#111827',
                      verticalAlign: 'top' as const,
                      maxWidth: '200px',
                      height: '60px'
                    }}>
                      <div 
                        style={{
                          cursor: 'pointer',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s ease',
                          minHeight: '1.5rem',
                          maxHeight: '40px',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        onDoubleClick={() => startEditingInline(company.id, 'phone_call_notes')}
                        title="Double-click to edit phone call notes"
                      >
                        {editingCell?.companyId === company.id && editingCell?.field === 'phone_call_notes' ? (
                          <textarea
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                                                      onBlur={() => saveInlineEdit()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              saveInlineEdit()
                            } else if (e.key === 'Escape') {
                              cancelInlineEdit()
                            }
                          }}
                            autoFocus
                            rows={3}
                            style={{
                              width: '100%',
                              border: '2px solid #3b82f6',
                              borderRadius: '4px',
                              padding: '0.5rem',
                              fontSize: '0.875rem',
                              resize: 'vertical'
                            }}
                          />
                        ) : (
                          <span style={{ 
                            color: company.phone_call_notes ? '#111827' : '#9ca3af',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'block',
                            maxWidth: '100%'
                          }}>
                            {company.phone_call_notes 
                              ? company.phone_call_notes.length > 50 
                                ? company.phone_call_notes.substring(0, 50) + '...'
                                : company.phone_call_notes
                              : 'Click to add notes...'
                            }
                          </span>
                        )}
                      </div>
                    </td> */}
                    <td style={{
                      padding: '1rem',
                      borderBottom: '1px solid #f3f4f6',
                      fontSize: '0.875rem',
                      color: '#111827',
                      verticalAlign: 'top' as const
                    }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => startView(company)}
                          style={{
                            padding: '0.5rem',
                            background: '#f0f9ff',
                            color: '#0369a1',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="View Details"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e0f2fe'
                            e.currentTarget.style.borderColor = '#7dd3fc'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f0f9ff'
                            e.currentTarget.style.borderColor = '#bae6fd'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {company.facebook_url && (
                          <button
                            onClick={() => window.open(company.facebook_url, '_blank')}
                            style={{
                              padding: '0.5rem',
                              background: '#1877f2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="View Facebook Page"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#166fe5'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#1877f2'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => startEdit(company)}
                          style={{
                            padding: '0.5rem',
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          title="Edit in Form"
                        >
                          <PencilIcon style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#fef2f2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
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
            </div>
            
            {filteredCompanies.length === 0 && (
              <div style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                color: '#6b7280'
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
          </div>
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div style={modalOverlayStyles}>
          <div style={modalStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Add New Company
              </h2>
            </div>

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={formStyles.label}>Field of Specialization</label>
                  {userRole === 'admin' && (
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
                  )}
                </div>
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {specializations.map(spec => (
                    <label 
                      key={spec.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="specialization"
                        value={spec.id}
                        checked={formData.selected_specialization_id === spec.id}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          selected_specialization_id: parseInt(e.target.value)
                        })}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {spec.name}
                      </span>
                    </label>
                  ))}
                  {specializations.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      No specializations available
                    </div>
                  )}
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
                    minHeight: '100px',
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
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {assignedUsers.map(user => (
                    <label 
                      key={user.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        value={user.id}
                        checked={formData.meet_up_person_ids.includes(user.id)}
                        onChange={(e) => {
                          const userId = parseInt(e.target.value)
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              meet_up_person_ids: [...formData.meet_up_person_ids, userId]
                            })
                          } else {
                            setFormData({ 
                              ...formData, 
                              meet_up_person_ids: formData.meet_up_person_ids.filter(id => id !== userId)
                            })
                          }
                        }}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {user.name} ({user.email})
                      </span>
                    </label>
                  ))}
                  {assignedUsers.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      No assigned users available
                    </div>
                  )}
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Follow-up Status</label>
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  background: '#fafafa',
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="follow_up_done_add"
                      checked={formData.follow_up_done === true}
                      onChange={() => setFormData({ ...formData, follow_up_done: true })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Yes - Completed</span>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="follow_up_done_add"
                      checked={formData.follow_up_done === false}
                      onChange={() => setFormData({ ...formData, follow_up_done: false })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>No - Pending</span>
                  </label>
                </div>
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
                <label style={formStyles.label}>Phone Call Status</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="phone_call_status_add"
                      checked={formData.phone_call_status === 'completed'}
                      onChange={() => setFormData({ ...formData, phone_call_status: 'completed' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Yes - Completed</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="phone_call_status_add"
                      checked={formData.phone_call_status === 'pending'}
                      onChange={() => setFormData({ ...formData, phone_call_status: 'pending' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>No - Pending</span>
                  </label>
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Phone Call Notes</label>
                <textarea
                  value={formData.phone_call_notes}
                  onChange={(e) => setFormData({ ...formData, phone_call_notes: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Add notes from phone conversations..."
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Facebook URL</label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  style={formStyles.input}
                  placeholder="https://facebook.com/company-page"
                />
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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

      {/* Edit Form Modal */}
      {showEditForm && editingCompany && (
        <div style={modalOverlayStyles}>
          <div style={modalStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Edit Company
              </h2>
            </div>

            <form onSubmit={handleUpdateCompany}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <label style={formStyles.label}>Field of Specialization</label>
                  {userRole === 'admin' && (
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
                  )}
                </div>
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {specializations.map(spec => (
                    <label 
                      key={spec.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="specialization-edit"
                        value={spec.id}
                        checked={formData.selected_specialization_id === spec.id}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          selected_specialization_id: parseInt(e.target.value)
                        })}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {spec.name}
                      </span>
                    </label>
                  ))}
                  {specializations.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      No specializations available
                    </div>
                  )}
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
                    minHeight: '100px',
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
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  background: '#fafafa'
                }}>
                  {assignedUsers.map(user => (
                    <label 
                      key={user.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0.5rem 0',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        value={user.id}
                        checked={formData.meet_up_person_ids.includes(user.id)}
                        onChange={(e) => {
                          const userId = parseInt(e.target.value)
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              meet_up_person_ids: [...formData.meet_up_person_ids, userId]
                            })
                          } else {
                            setFormData({ 
                              ...formData, 
                              meet_up_person_ids: formData.meet_up_person_ids.filter(id => id !== userId)
                            })
                          }
                        }}
                        style={{ marginRight: '0.75rem' }}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                        {user.name} ({user.email})
                      </span>
                    </label>
                  ))}
                  {assignedUsers.length === 0 && (
                    <div style={{ color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                      No assigned users available
                    </div>
                  )}
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Follow-up Status</label>
                <div style={{ 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  background: '#fafafa',
                  display: 'flex',
                  gap: '2rem',
                  alignItems: 'center'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="follow_up_done_edit"
                      checked={formData.follow_up_done === true}
                      onChange={() => setFormData({ ...formData, follow_up_done: true })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Yes - Completed</span>
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    <input
                      type="radio"
                      name="follow_up_done_edit"
                      checked={formData.follow_up_done === false}
                      onChange={() => setFormData({ ...formData, follow_up_done: false })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>No - Pending</span>
                  </label>
                </div>
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
                <label style={formStyles.label}>Phone Call Status</label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="phone_call_status_edit"
                      checked={formData.phone_call_status === 'completed'}
                      onChange={() => setFormData({ ...formData, phone_call_status: 'completed' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#10b981', fontWeight: '500' }}>Yes - Completed</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="phone_call_status_edit"
                      checked={formData.phone_call_status === 'pending'}
                      onChange={() => setFormData({ ...formData, phone_call_status: 'pending' })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ color: '#f59e0b', fontWeight: '500' }}>No - Pending</span>
                  </label>
                </div>
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Phone Call Notes</label>
                <textarea
                  value={formData.phone_call_notes}
                  onChange={(e) => setFormData({ ...formData, phone_call_notes: e.target.value })}
                  style={{
                    ...formStyles.input,
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Add notes from phone conversations..."
                />
              </div>

              <div style={formStyles.inputGroup}>
                <label style={formStyles.label}>Facebook URL</label>
                <input
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                  style={formStyles.input}
                  placeholder="https://facebook.com/company-page"
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
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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

      {/* Member Management Modal */}
      {showMemberModal && userRole === 'admin' && (
        <div style={modalOverlayStyles}>
          <div style={{ ...modalStyles, maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Manage Company Outreach Members
              </h2>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <p style={{ color: '#666666', marginBottom: '1.5rem' }}>
                Select users who can access the Company Outreach feature and assign their roles.
              </p>

              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                {allUsers.map(user => (
                  <div 
                    key={user.id} 
                    style={{ 
                      padding: '1rem', 
                      borderBottom: '1px solid #f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers[user.id] !== undefined}
                        onChange={(e) => handleMemberToggle(user.id, e.target.checked)}
                        style={{
                          width: '18px',
                          height: '18px',
                          marginRight: '12px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>
                          {user.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>

                    {selectedMembers[user.id] && (
                      <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`role-${user.id}`}
                            value="member"
                            checked={selectedMembers[user.id] === 'member'}
                            onChange={() => handleRoleChange(user.id, 'member')}
                            style={{ marginRight: '6px' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>Member</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={`role-${user.id}`}
                            value="admin"
                            checked={selectedMembers[user.id] === 'admin'}
                            onChange={() => handleRoleChange(user.id, 'admin')}
                            style={{ marginRight: '6px' }}
                          />
                          <span style={{ fontSize: '0.875rem', color: '#374151' }}>Admin</span>
                        </label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {Object.keys(selectedMembers).length === 0 && (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: '#6b7280',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  marginTop: '1rem'
                }}>
                  <UserGroupIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#d1d5db' }} />
                  <p>No members selected. Select users above to grant access to Company Outreach.</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowMemberModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveMemberAssignments}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                Save Member Assignments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Specialization Modal */}
      {showSpecializationForm && userRole === 'admin' && (
        <div style={modalOverlayStyles}>
          <div style={modalStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Add Field of Specialization
              </h2>
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
                    borderRadius: '12px',
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
                    borderRadius: '12px',
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

      {/* View Company Form */}
      {showViewForm && viewingCompany && (
        <div style={modalOverlayStyles}>
          <div style={modalStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', margin: 0 }}>
                Company Details - {viewingCompany.company_name}
              </h2>
              <button
                onClick={() => {
                  setShowViewForm(false)
                  setViewingCompany(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Company Name
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.company_name}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Specialization
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.specializations?.map(spec => spec.name).join(', ') || 'Not specified'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Phone Number
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.phone_number || 'Not provided'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Email Address
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.email_address || 'Not provided'}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Address
                </label>
                <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                  {viewingCompany.address || 'Not provided'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Contact Person
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.contact_person?.name || 'Not assigned'}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Follow-up Person
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                    {viewingCompany.follow_up_person?.name || 'Not assigned'}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Meet-up Persons
                </label>
                <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827' }}>
                  {viewingCompany.meet_up_persons?.map(person => person.name).join(', ') || 'None assigned'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Follow-up Status
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                    <span style={{ 
                      color: viewingCompany.follow_up_done ? '#10b981' : '#f59e0b',
                      fontWeight: '500'
                    }}>
                      {viewingCompany.follow_up_done ? '✓ Yes - Completed' : '○ No - Pending'}
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Phone Call Status
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                    <span style={{ 
                      color: viewingCompany.phone_call_status === 'completed' ? '#10b981' : '#f59e0b',
                      fontWeight: '500'
                    }}>
                      {viewingCompany.phone_call_status === 'completed' ? '✓ Yes - Completed' : '○ No - Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {viewingCompany.phone_call_notes && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Phone Call Notes
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827', whiteSpace: 'pre-wrap' }}>
                    {viewingCompany.phone_call_notes}
                  </div>
                </div>
              )}

              {viewingCompany.facebook_url && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Facebook URL
                  </label>
                  <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb' }}>
                    <a 
                      href={viewingCompany.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1877f2', textDecoration: 'underline' }}
                    >
                      {viewingCompany.facebook_url}
                    </a>
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Notes
                </label>
                <div style={{ padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#111827', whiteSpace: 'pre-wrap', minHeight: '80px' }}>
                  {viewingCompany.note || 'No notes'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  onClick={() => {
                    setShowViewForm(false)
                    setViewingCompany(null)
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 