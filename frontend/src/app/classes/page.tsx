'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UsersIcon, CurrencyDollarIcon, PhoneIcon, LinkIcon } from '@heroicons/react/24/outline'

interface ClassItem {
  id: number
  class_title: string
  class_type: string
  target_audience: string
  class_date: string
  start_time: string
  end_time: string
  duration: string
  location: string
  instructor_name: string
  instructor_bio: string
  class_description: string
  learning_objectives: string[]
  prerequisites: string
  max_participants: number
  current_participants: number
  status: string
  registration_deadline: string | null
  materials_needed: string
  folder_id?: number | null
  created_by: User
  created_at: string
  updated_at: string
}

interface Student {
  id: number
  class_id: number
  student_name: string
  email: string
  phone_number: string
  facebook_link: string
  payment_method: 'Kpay' | 'Aya Pay' | 'Wave Pay'
  payment_type: 'full' | 'split'
  course_fee: number
  discount_amount: number
  discount_percentage: number
  full_payment_amount: number | null
  full_payment_date: string | null
  number_of_splits: number
  split_1_amount: number | null
  split_1_date: string | null
  split_2_amount: number | null
  split_2_date: string | null
  split_3_amount: number | null
  split_3_date: string | null
  split_4_amount: number | null
  split_4_date: string | null
  total_amount: number
  paid_amount: number
  remaining_amount: number
  enrollment_status: string
  payment_status: string
  enrolled_at: string
  notes: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface ClassesMember {
  id: number
  user_id: number
  role: string
  user: User
}

const CLASS_TYPES = ['PR Workshop', 'Media Training', 'Communication Skills', 'Leadership Development', 'Crisis Management', 'Public Speaking', 'Writing Workshop', 'Strategic Planning']
const TARGET_AUDIENCES = ['Executives', 'Marketing Team', 'Sales Team', 'HR Team', 'All Staff', 'Management', 'Customer Service', 'External Clients']
const DURATIONS = ['1 hour', '2 hours', '3 hours', 'Half day', 'Full day', '2 days', '1 week']
const LOCATIONS = ['Conference Room A', 'Conference Room B', 'Training Center', 'Online - Zoom', 'Online - Teams', 'External Venue', 'Hybrid']
const STATUSES = ['planning', 'open_registration', 'full', 'in_progress', 'completed', 'cancelled']
const PAYMENT_METHODS = ['Kpay', 'Aya Pay', 'Wave Pay']

export default function ClassesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [classItems, setClassItems] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [members, setMembers] = useState<ClassesMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)
  const [currentFolder, setCurrentFolder] = useState<any | null>(null)
  const [folderPath, setFolderPath] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<ClassItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ClassItem | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  
  // Class Form Data
  const [formData, setFormData] = useState({
    class_title: '',
    class_type: '',
    target_audience: '',
    class_date: '',
    start_time: '',
    end_time: '',
    duration: '',
    location: '',
    instructor_name: '',
    instructor_bio: '',
    class_description: '',
    learning_objectives: [''],
    prerequisites: '',
    max_participants: 20,
    status: 'planning',
    registration_deadline: '',
    materials_needed: '',
    folder_id: null as number | null
  })

  // Student Form Data
  const [studentFormData, setStudentFormData] = useState({
    student_name: '',
    email: '',
    phone_number: '',
    facebook_link: '',
    payment_method: 'Kpay' as 'Kpay' | 'Aya Pay' | 'Wave Pay',
    payment_type: 'full' as 'full' | 'split',
    course_fee: 0,
    discount_amount: 0,
    discount_percentage: 0,
    full_payment_amount: 0,
    full_payment_date: '',
    number_of_splits: 2,
    split_1_amount: 0,
    split_1_date: '',
    split_2_amount: 0,
    split_2_date: '',
    split_3_amount: 0,
    split_3_date: '',
    split_4_amount: 0,
    split_4_date: '',
    notes: ''
  })

  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    folder_type: 'category',
    color: '#ffffff'
  })

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      console.log('🔍 Checking Classes access for user:', user.id, user.email);
      
      // Check if user is a classes member
      const { data: memberData, error: memberError } = await supabase
        .from('classes_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      console.log('📋 Classes member check:', { memberData, memberError });

      if (memberData && !memberError) {
        console.log('✅ Classes access granted: User is a member');
        setHasAccess(true)
        setUserRole(memberData.role)
      } else {
        // Check if user is admin/HR
        const { data: userData, error: userError } = await supabase
          .from('auth_user')
          .select('id, name, email, role, is_superuser, is_staff')
          .eq('id', user.id)
          .single()

        console.log('👤 Classes user data check:', userData);

        if (userError) {
          console.log('❌ Classes access denied: User data error');
          setHasAccess(false)
          return
        }

        const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr'
        console.log('🔐 Classes admin/HR check:', {
          is_superuser: userData.is_superuser,
          is_staff: userData.is_staff,
          role: userData.role,
          hasPermission
        });
        
        if (hasPermission) {
          setHasAccess(true)
          setUserRole('admin')
        } else {
          setHasAccess(false)
        }
      }
    } catch (err) {
      console.error('Error checking classes access:', err)
      setError('Failed to check access permissions')
    }
  }

  const fetchData = async () => {
    if (!hasAccess || !user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Fetch classes
      const { data: itemsData, error: itemsError } = await supabase
        .from('classes')
        .select(`
          *,
          auth_user:created_by_id (id, name, email, role)
        `)
        .order('class_date', { ascending: true })

      if (itemsError) throw itemsError

      // Fetch students for selected class
      if (selectedClass) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('classes_participants')
          .select('*')
          .eq('class_id', selectedClass.id)
          .order('enrolled_at', { ascending: false })

        if (!studentsError) {
          setStudents(studentsData || [])
        }
      }

      // Fetch classes members
      const { data: membersData, error: membersError } = await supabase
        .from('classes_members')
        .select(`
          *,
          auth_user:user_id (id, name, email, role)
        `)

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('auth_user')
        .select('id, name, email, role')
        .order('name')

      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('classes_folders')
        .select('*')
        .order('name')

      setClassItems(itemsData || [])
      
      // Transform members data to ensure user object exists
      const transformedMembers = (membersData || []).map((member: any) => ({
        ...member,
        user: member.auth_user || member.user || {
          id: member.user_id,
          name: 'Unknown User',
          email: '',
          role: 'member'
        }
      }))
      setMembers(transformedMembers)
      setAllUsers(usersData || [])
      
      // Remove duplicates from folders
      const uniqueFolders = (foldersData || []).filter((folder: any, index: number, self: any[]) => 
        index === self.findIndex((f: any) => f.name === folder.name && f.folder_type === folder.folder_type)
      )
      setFolders(uniqueFolders)
      
      // Filter items based on current folder
      filterItemsByFolder(itemsData || [], selectedFolder)
    } catch (err) {
      console.error('Error fetching classes data:', err)
      setError('Failed to load classes data')
    }
  }

  const filterItemsByFolder = (items: ClassItem[], folderId: number | null) => {
    if (folderId === null) {
      setFilteredItems([]) // Don't show classes at root level
    } else {
      const filtered = items.filter(item => item.folder_id === folderId)
      setFilteredItems(filtered)
    }
  }

  const enterFolder = (folder: any) => {
    setCurrentFolder(folder)
    setSelectedFolder(folder.id)
    setFolderPath([...folderPath, folder])
    setSelectedClass(null) // Reset selected class when entering folder
    filterItemsByFolder(classItems, folder.id)
  }

  const enterClass = (classItem: ClassItem) => {
    setSelectedClass(classItem)
    // Fetch students for this class
    fetchData()
  }

  const goToFolder = (folder: any | null) => {
    if (folder === null) {
      // Go to root
      setCurrentFolder(null)
      setSelectedFolder(null)
      setSelectedClass(null)
      setFolderPath([])
      filterItemsByFolder(classItems, null)
    } else {
      // Go to specific folder in path
      const folderIndex = folderPath.findIndex(f => f.id === folder.id)
      const newPath = folderPath.slice(0, folderIndex + 1)
      setCurrentFolder(folder)
      setSelectedFolder(folder.id)
      setSelectedClass(null)
      setFolderPath(newPath)
      filterItemsByFolder(classItems, folder.id)
    }
  }

  const getCurrentFolderContents = () => {
    if (currentFolder === null) {
      // Show root level folders
      return folders.filter(folder => !folder.parent_folder_id)
    } else {
      // Show subfolders of current folder
      return folders.filter(folder => folder.parent_folder_id === currentFolder.id)
    }
  }

  // Calculate total amount based on discount and course fee
  const calculateTotalAmount = () => {
    const { course_fee, discount_amount, discount_percentage } = studentFormData
    if (discount_percentage > 0) {
      return course_fee - (course_fee * discount_percentage / 100)
    }
    return course_fee - discount_amount
  }

  // Auto-split calculation
  const calculateSplitAmounts = () => {
    const totalAmount = calculateTotalAmount()
    const { number_of_splits } = studentFormData
    const splitAmount = Math.round((totalAmount / number_of_splits) * 100) / 100
    
    const updates: any = {}
    for (let i = 1; i <= 4; i++) {
      if (i <= number_of_splits) {
        updates[`split_${i}_amount`] = splitAmount
      } else {
        updates[`split_${i}_amount`] = 0
        updates[`split_${i}_date`] = ''
      }
    }
    
    setStudentFormData(prev => ({ ...prev, ...updates }))
  }

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
  }, [hasAccess, user?.id, selectedClass])

  useEffect(() => {
    // Update filtered items when class items change
    filterItemsByFolder(classItems, selectedFolder)
  }, [classItems, selectedFolder])

  // Auto-calculate splits when payment type, course fee, or discount changes
  useEffect(() => {
    if (studentFormData.payment_type === 'split') {
      calculateSplitAmounts()
    }
  }, [studentFormData.course_fee, studentFormData.discount_amount, studentFormData.discount_percentage, studentFormData.number_of_splits, studentFormData.payment_type])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const submitData = {
        ...formData,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim() !== ''),
        max_participants: Number(formData.max_participants),
        current_participants: 0,
        created_by_id: user?.id
      }
      
      if (editingItem) {
        const { error } = await supabase
          .from('classes')
          .update(submitData)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('classes')
          .insert(submitData)
        
        if (error) throw error
      }
      
      await fetchData()
      resetForm()
    } catch (err) {
      console.error('Error saving class:', err)
      setError('Failed to save class')
    }
  }

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      const submitData = {
        ...studentFormData,
        class_id: selectedClass?.id,
        enrolled_by: user?.id
      }
      
      if (editingStudent) {
        const { error } = await supabase
          .from('classes_participants')
          .update(submitData)
          .eq('id', editingStudent.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('classes_participants')
          .insert(submitData)
        
        if (error) throw error
      }
      
      await fetchData()
      resetStudentForm()
    } catch (err) {
      console.error('Error saving student:', err)
      setError('Failed to save student enrollment')
    }
  }

  const resetStudentForm = () => {
    setStudentFormData({
      student_name: '',
      email: '',
      phone_number: '',
      facebook_link: '',
      payment_method: 'Kpay',
      payment_type: 'full',
      course_fee: 0,
      discount_amount: 0,
      discount_percentage: 0,
      full_payment_amount: 0,
      full_payment_date: '',
      number_of_splits: 2,
      split_1_amount: 0,
      split_1_date: '',
      split_2_amount: 0,
      split_2_date: '',
      split_3_amount: 0,
      split_3_date: '',
      split_4_amount: 0,
      split_4_date: '',
      notes: ''
    })
    setEditingStudent(null)
    setShowStudentForm(false)
  }

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to remove this student?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { error } = await supabase
        .from('classes_participants')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error deleting student:', err)
      setError('Failed to delete student')
    }
  }

  const startEditStudent = (student: Student) => {
    setStudentFormData({
      student_name: student.student_name,
      email: student.email,
      phone_number: student.phone_number || '',
      facebook_link: student.facebook_link || '',
      payment_method: student.payment_method,
      payment_type: student.payment_type,
      course_fee: student.course_fee,
      discount_amount: student.discount_amount || 0,
      discount_percentage: student.discount_percentage || 0,
      full_payment_amount: student.full_payment_amount || 0,
      full_payment_date: student.full_payment_date || '',
      number_of_splits: student.number_of_splits,
      split_1_amount: student.split_1_amount || 0,
      split_1_date: student.split_1_date || '',
      split_2_amount: student.split_2_amount || 0,
      split_2_date: student.split_2_date || '',
      split_3_amount: student.split_3_amount || 0,
      split_3_date: student.split_3_date || '',
      split_4_amount: student.split_4_amount || 0,
      split_4_date: student.split_4_date || '',
      notes: student.notes || ''
    })
    setEditingStudent(student)
    setShowStudentForm(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount) + ' MMK'
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#065f46'
      case 'partial': return '#d97706'
      case 'unpaid': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error deleting class:', err)
      setError('Failed to delete class')
    }
  }

  const handleAddMember = async (userId: number) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { error } = await supabase
        .from('classes_members')
        .insert({ user_id: userId, role: 'member' })
      
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error adding member:', err)
      setError('Failed to add member')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { error } = await supabase
        .from('classes_members')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Failed to remove member')
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      console.log('🗂️ Creating folder with data:', {
        ...folderFormData,
        parent_folder_id: currentFolder?.id || null,
        created_by_id: user?.id
      })
      
      const { data, error } = await supabase
        .from('classes_folders')
        .insert({
          ...folderFormData,
          parent_folder_id: currentFolder?.id || null,
          created_by_id: user?.id
        })
        .select()
      
      if (error) {
        console.error('🚨 Supabase error details:', error)
        throw error
      }
      
      console.log('✅ Folder created successfully:', data)
      await fetchData()
      setFolderFormData({
        name: '',
        description: '',
        folder_type: currentFolder ? 'subcategory' : 'category',
        color: '#ffffff'
      })
      setShowFolderForm(false)
    } catch (err) {
      console.error('Error creating folder:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to create folder: ${errorMessage}`)
    }
  }

  const resetForm = () => {
    setFormData({
      class_title: '',
      class_type: '',
      target_audience: '',
      class_date: '',
      start_time: '',
      end_time: '',
      duration: '',
      location: '',
      instructor_name: '',
      instructor_bio: '',
      class_description: '',
      learning_objectives: [''],
      prerequisites: '',
      max_participants: 20,
      status: 'planning',
      registration_deadline: '',
      materials_needed: '',
      folder_id: currentFolder?.id || null
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const startEdit = (item: ClassItem) => {
    setFormData({
      class_title: item.class_title,
      class_type: item.class_type,
      target_audience: item.target_audience,
      class_date: item.class_date,
      start_time: item.start_time,
      end_time: item.end_time,
      duration: item.duration,
      location: item.location,
      instructor_name: item.instructor_name,
      instructor_bio: item.instructor_bio,
      class_description: item.class_description,
      learning_objectives: item.learning_objectives.length > 0 ? item.learning_objectives : [''],
      prerequisites: item.prerequisites,
      max_participants: item.max_participants,
      status: item.status,
      registration_deadline: item.registration_deadline || '',
      materials_needed: item.materials_needed,
      folder_id: item.folder_id || null
    })
    setEditingItem(item)
    setShowAddForm(true)
  }

  const addLearningObjective = () => {
    setFormData({
      ...formData,
      learning_objectives: [...formData.learning_objectives, '']
    })
  }

  const removeLearningObjective = (index: number) => {
    const newObjectives = formData.learning_objectives.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      learning_objectives: newObjectives.length > 0 ? newObjectives : ['']
    })
  }

  const updateLearningObjective = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives]
    newObjectives[index] = value
    setFormData({
      ...formData,
      learning_objectives: newObjectives
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning'
      case 'open_registration': return 'Open Registration'
      case 'full': return 'Full'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#6b7280'
      case 'open_registration': return '#059669'
      case 'full': return '#dc2626'
      case 'in_progress': return '#d97706'
      case 'completed': return '#065f46'
      case 'cancelled': return '#991b1b'
      default: return '#6b7280'
    }
  }

  if (authLoading || isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #cccccc', 
            borderTop: '3px solid #000000', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '500px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#000000' }}>
              Access Denied
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#666666', marginBottom: '2rem' }}>
              You don't have permission to access the Classes section.
              Please contact an administrator to request access.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '1rem 2rem',
                background: '#000000',
                color: '#ffffff',
                border: '2px solid #000000',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer'
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
      
      <div style={{ display: 'flex', minHeight: '100vh', background: '#ffffff' }}>
        <Sidebar projects={[]} onCreateProject={() => {}} />
        
        <div style={{ 
          marginLeft: '256px',
          padding: '2rem', 
          background: '#ffffff', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem',
            borderBottom: '2px solid #e5e7eb',
            paddingBottom: '1rem'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '2rem', 
                fontWeight: 'bold', 
                margin: '0', 
                color: '#000000'
              }}>
                Classes (PR)
              </h1>
              <p style={{ fontSize: '1rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
                Manage PR and communication training classes and workshops
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setFolderFormData({
                    name: '',
                    description: '',
                    folder_type: currentFolder ? 'subcategory' : 'category',
                    color: '#ffffff'
                  })
                  setShowFolderForm(true)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffffff',
                  color: '#000000',
                  border: '2px solid #666666',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FolderIcon style={{ width: '16px', height: '16px' }} />
                New Folder
              </button>
              
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#000000',
                  color: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <PlusIcon style={{ width: '16px', height: '16px' }} />
                New Class
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                  Manage Members
                </button>
              )}
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            color: '#666666'
          }}>
            <button
              onClick={() => goToFolder(null)}
              style={{
                background: 'none',
                border: 'none',
                color: folderPath.length === 0 ? '#000000' : '#0066cc',
                cursor: 'pointer',
                textDecoration: folderPath.length === 0 ? 'none' : 'underline'
              }}
            >
              Home
            </button>
            {folderPath.map((folder, index) => (
              <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ChevronRightIcon style={{ width: '12px', height: '12px' }} />
                <button
                  onClick={() => goToFolder(folder)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: index === folderPath.length - 1 ? '#000000' : '#0066cc',
                    cursor: 'pointer',
                    textDecoration: index === folderPath.length - 1 ? 'none' : 'underline'
                  }}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          {/* Folders Grid */}
          {getCurrentFolderContents().length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#000000' }}>
                Folders
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {getCurrentFolderContents().map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => enterFolder(folder)}
                    style={{
                      padding: '1.5rem',
                      background: '#ffffff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#000000'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <FolderIcon 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        color: folder.color || '#666666' 
                      }} 
                    />
                    <div>
                      <h4 style={{ margin: '0', fontSize: '1rem', fontWeight: '600', color: '#000000' }}>
                        {folder.name}
                      </h4>
                      {folder.description && (
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#666666' }}>
                          {folder.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Management - When Class is Selected */}
          {selectedClass && (
            <div>
              {/* Class Info Header */}
              <div style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0', color: '#1e293b' }}>
                      {selectedClass.class_title}
                    </h2>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                      {selectedClass.class_type} • {formatDate(selectedClass.class_date)} • {selectedClass.location}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedClass(null)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#e2e8f0',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back to Classes
                  </button>
                </div>
              </div>

              {/* Student Enrollment Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0', color: '#1e293b' }}>
                  Student Enrollment ({students.length})
                </h3>
                <button
                  onClick={() => setShowStudentForm(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  Enroll Student
                </button>
              </div>

              {/* Students Table */}
              <div style={{
                background: '#ffffff',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 180px 120px 100px 120px 120px 100px 80px',
                  gap: '0',
                  background: '#f8fafc',
                  borderBottom: '2px solid #e5e7eb',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  color: '#1e293b'
                }}>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>STUDENT NAME</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>CONTACT</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>PAYMENT METHOD</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>COURSE FEE</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>TOTAL AMOUNT</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>PAID AMOUNT</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>STATUS</div>
                  <div style={{ padding: '1rem 0.75rem' }}>ACTIONS</div>
                </div>

                {students.map(student => (
                  <div key={student.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 180px 120px 100px 120px 120px 100px 80px',
                    gap: '0',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{student.student_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                        {student.email}
                      </div>
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                        <PhoneIcon style={{ width: '12px', height: '12px' }} />
                        {student.phone_number}
                      </div>
                      {student.facebook_link && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <LinkIcon style={{ width: '12px', height: '12px' }} />
                          Facebook
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                      <div>{student.payment_method}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {student.payment_type === 'split' ? `${student.number_of_splits} splits` : 'Full payment'}
                      </div>
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                      {formatCurrency(student.course_fee)}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#1e293b', fontWeight: '600' }}>
                      {formatCurrency(student.total_amount)}
                      {(student.discount_amount > 0 || student.discount_percentage > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.25rem' }}>
                          {student.discount_percentage > 0 ? `${student.discount_percentage}% discount` : `${formatCurrency(student.discount_amount)} off`}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#1e293b', fontWeight: '600' }}>
                      {formatCurrency(student.paid_amount)}
                      {student.remaining_amount > 0 && (
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem' }}>
                          {formatCurrency(student.remaining_amount)} remaining
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: getPaymentStatusColor(student.payment_status) + '20',
                        color: getPaymentStatusColor(student.payment_status)
                      }}>
                        {student.payment_status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ padding: '1rem 0.75rem', display: 'flex', gap: '0.25rem' }}>
                      <button
                        onClick={() => startEditStudent(student)}
                        style={{
                          padding: '0.25rem',
                          background: 'none',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#666666'
                        }}
                        title="Edit student"
                      >
                        <PencilIcon style={{ width: '12px', height: '12px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        style={{
                          padding: '0.25rem',
                          background: 'none',
                          border: '1px solid #e5e7eb',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#dc2626'
                        }}
                        title="Remove student"
                      >
                        <TrashIcon style={{ width: '12px', height: '12px' }} />
                      </button>
                    </div>
                  </div>
                ))}

                {students.length === 0 && (
                  <div style={{
                    padding: '3rem',
                    textAlign: 'center',
                    color: '#64748b'
                  }}>
                    <UserGroupIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                    <p>No students enrolled in this class yet.</p>
                    <button
                      onClick={() => setShowStudentForm(true)}
                      style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Enroll First Student
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Classes List - When Folder Selected but No Class Selected */}
          {currentFolder && !selectedClass && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                Classes in {currentFolder.name}
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1rem'
              }}>
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => enterClass(item)}
                    style={{
                      padding: '1.5rem',
                      background: '#ffffff',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#059669'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600', color: '#1e293b' }}>
                        {item.class_title}
                      </h4>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: getStatusColor(item.status) + '20',
                        color: getStatusColor(item.status)
                      }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                      <div style={{ marginBottom: '0.5rem' }}>{item.class_type}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <CalendarIcon style={{ width: '14px', height: '14px' }} />
                        {formatDate(item.class_date)}
                        {item.start_time && ` at ${formatTime(item.start_time)}`}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <MapPinIcon style={{ width: '14px', height: '14px' }} />
                        {item.location}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UsersIcon style={{ width: '14px', height: '14px' }} />
                        {item.current_participants}/{item.max_participants} students
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: '600' }}>
                      Click to manage students →
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div style={{
                  background: '#f8fafc',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '3rem',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <CalendarIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>No classes found in this folder.</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      background: '#1e293b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Create First Class
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Root Level - Only Folders */}
          {!currentFolder && !selectedClass && (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '3rem',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <FolderIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', opacity: 0.5 }} />
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600' }}>Student Management System</h3>
              <p>Select a folder to view classes and manage student enrollments.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Folders organize your classes by category (e.g., PR Workshops, Media Training, etc.)</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Class Form Modal */}
      {showAddForm && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000000' }}>
              {editingItem ? 'Edit Class' : 'Create New Class'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Class Title *
                  </label>
                  <input
                    type="text"
                    value={formData.class_title}
                    onChange={(e) => setFormData({ ...formData, class_title: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Class Type *
                  </label>
                  <select
                    value={formData.class_type}
                    onChange={(e) => setFormData({ ...formData, class_type: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Select class type</option>
                    {CLASS_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Target Audience *
                  </label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Select target audience</option>
                    {TARGET_AUDIENCES.map(audience => (
                      <option key={audience} value={audience}>{audience}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{getStatusLabel(status)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Class Date *
                  </label>
                  <input
                    type="date"
                    value={formData.class_date}
                    onChange={(e) => setFormData({ ...formData, class_date: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Duration
                  </label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Select duration</option>
                    {DURATIONS.map(duration => (
                      <option key={duration} value={duration}>{duration}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Location
                  </label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 0 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={formData.instructor_name}
                  onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Instructor Bio
                </label>
                <textarea
                  value={formData.instructor_bio}
                  onChange={(e) => setFormData({ ...formData, instructor_bio: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Class Description
                </label>
                <textarea
                  value={formData.class_description}
                  onChange={(e) => setFormData({ ...formData, class_description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Learning Objectives
                </label>
                {formData.learning_objectives.map((objective, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => updateLearningObjective(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                    {formData.learning_objectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLearningObjective(index)}
                        style={{
                          padding: '0.75rem',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLearningObjective}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f3f4f6',
                    color: '#000000',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Add Learning Objective
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Prerequisites
                  </label>
                  <textarea
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                    Materials Needed
                  </label>
                  <textarea
                    value={formData.materials_needed}
                    onChange={(e) => setFormData({ ...formData, materials_needed: e.target.value })}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={formData.registration_deadline}
                  onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #666666',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#000000',
                    color: '#ffffff',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {editingItem ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderForm && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000000' }}>
              Create New Folder
            </h2>

            <form onSubmit={handleCreateFolder}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={folderFormData.name}
                  onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Description
                </label>
                <textarea
                  value={folderFormData.description}
                  onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Color
                </label>
                <input
                  type="color"
                  value={folderFormData.color}
                  onChange={(e) => setFolderFormData({ ...folderFormData, color: e.target.value })}
                  style={{
                    width: '100px',
                    height: '40px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowFolderForm(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#000000',
                    border: '2px solid #666666',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#000000',
                    color: '#ffffff',
                    border: '2px solid #000000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Enrollment Form Modal */}
      {showStudentForm && selectedClass && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1e293b' }}>
              {editingStudent ? 'Edit Student Enrollment' : 'Enroll New Student'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
              Class: {selectedClass.class_title}
            </p>

            <form onSubmit={handleStudentSubmit}>
              {/* Student Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Student Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Student Name *
                    </label>
                    <input
                      type="text"
                      value={studentFormData.student_name}
                      onChange={(e) => setStudentFormData({ ...studentFormData, student_name: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={studentFormData.phone_number}
                      onChange={(e) => setStudentFormData({ ...studentFormData, phone_number: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Facebook Link
                    </label>
                    <input
                      type="url"
                      value={studentFormData.facebook_link}
                      onChange={(e) => setStudentFormData({ ...studentFormData, facebook_link: e.target.value })}
                      placeholder="https://facebook.com/username"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                  Payment Information
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Payment Method *
                    </label>
                    <select
                      value={studentFormData.payment_method}
                      onChange={(e) => setStudentFormData({ ...studentFormData, payment_method: e.target.value as any })}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Course Fee (MMK) *
                    </label>
                    <input
                      type="number"
                      value={studentFormData.course_fee}
                      onChange={(e) => setStudentFormData({ ...studentFormData, course_fee: Number(e.target.value) })}
                      required
                      min="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Payment Type *
                    </label>
                    <select
                      value={studentFormData.payment_type}
                      onChange={(e) => setStudentFormData({ ...studentFormData, payment_type: e.target.value as 'full' | 'split' })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="full">Full Payment</option>
                      <option value="split">Split Payment</option>
                    </select>
                  </div>
                </div>

                {/* Discount Section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Discount Amount (MMK)
                    </label>
                    <input
                      type="number"
                      value={studentFormData.discount_amount}
                      onChange={(e) => setStudentFormData({ ...studentFormData, discount_amount: Number(e.target.value), discount_percentage: 0 })}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      value={studentFormData.discount_percentage}
                      onChange={(e) => setStudentFormData({ ...studentFormData, discount_percentage: Number(e.target.value), discount_amount: 0 })}
                      min="0"
                      max="100"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Payment Calculation Display */}
                <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Course Fee:</span>
                    <span style={{ fontWeight: '600' }}>{formatCurrency(studentFormData.course_fee)}</span>
                  </div>
                  {(studentFormData.discount_amount > 0 || studentFormData.discount_percentage > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#059669' }}>
                      <span>Discount:</span>
                      <span style={{ fontWeight: '600' }}>
                        -{formatCurrency(studentFormData.discount_percentage > 0 
                          ? studentFormData.course_fee * studentFormData.discount_percentage / 100 
                          : studentFormData.discount_amount
                        )}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #bbf7d0', paddingTop: '0.5rem', fontSize: '1.1rem', fontWeight: '700' }}>
                    <span>Total Amount:</span>
                    <span>{formatCurrency(calculateTotalAmount())}</span>
                  </div>
                </div>

                {/* Full Payment Section */}
                {studentFormData.payment_type === 'full' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                        Payment Amount (MMK)
                      </label>
                      <input
                        type="number"
                        value={studentFormData.full_payment_amount}
                        onChange={(e) => setStudentFormData({ ...studentFormData, full_payment_amount: Number(e.target.value) })}
                        min="0"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                        Payment Date
                      </label>
                      <input
                        type="date"
                        value={studentFormData.full_payment_date}
                        onChange={(e) => setStudentFormData({ ...studentFormData, full_payment_date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Split Payment Section */}
                {studentFormData.payment_type === 'split' && (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                        Number of Splits
                      </label>
                      <select
                        value={studentFormData.number_of_splits}
                        onChange={(e) => setStudentFormData({ ...studentFormData, number_of_splits: Number(e.target.value) })}
                        style={{
                          width: '200px',
                          padding: '0.75rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value={2}>2 Splits</option>
                        <option value={3}>3 Splits</option>
                        <option value={4}>4 Splits</option>
                      </select>
                    </div>

                    {/* Split Payment Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      {[1, 2, 3, 4].slice(0, studentFormData.number_of_splits).map(split => (
                        <div key={split} style={{ padding: '1rem', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                            Split {split}
                          </h4>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem', color: '#64748b' }}>
                              Amount (MMK)
                            </label>
                            <input
                              type="number"
                              value={studentFormData[`split_${split}_amount` as keyof typeof studentFormData] as number}
                              onChange={(e) => setStudentFormData({ 
                                ...studentFormData, 
                                [`split_${split}_amount`]: Number(e.target.value) 
                              })}
                              min="0"
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem', color: '#64748b' }}>
                              Date
                            </label>
                            <input
                              type="date"
                              value={studentFormData[`split_${split}_date` as keyof typeof studentFormData] as string}
                              onChange={(e) => setStudentFormData({ 
                                ...studentFormData, 
                                [`split_${split}_date`]: e.target.value 
                              })}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>
                  Notes
                </label>
                <textarea
                  value={studentFormData.notes}
                  onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetStudentForm}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#059669',
                    color: '#ffffff',
                    border: '2px solid #059669',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {editingStudent ? 'Update Enrollment' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMemberModal && userRole === 'admin' && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000000' }}>
              Manage Classes Members
            </h2>

            {/* Current Members */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#000000' }}>
                Current Members
              </h3>
              {members.length === 0 ? (
                <p style={{ color: '#666666', fontStyle: 'italic' }}>No members assigned yet.</p>
              ) : (
                <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {members.map(member => (
                    <div key={member.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      marginBottom: '0.5rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: '600', color: '#000000' }}>
                          {member.user?.name || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                          {member.user?.email || 'No email'} - {member.role}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#dc2626',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Members */}
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#000000' }}>
                Add New Members
              </h3>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                {allUsers
                  .filter(user => !members.some(member => member.user_id === user.id))
                  .map(user => (
                  <div key={user.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#000000' }}>{user.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666666' }}>
                        {user.email} - {user.role}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#059669',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button
                onClick={() => setShowMemberModal(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#000000',
                  color: '#ffffff',
                  border: '2px solid #000000',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 