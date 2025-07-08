'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, MapPinIcon, UsersIcon, CurrencyDollarIcon, PhoneIcon, LinkIcon } from '@heroicons/react/24/outline'

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
        class_title: formData.class_title,
        class_description: formData.class_description,
        // Provide default values for fields not in the simplified form
        class_type: 'General Training',
        target_audience: 'All Staff',
        class_date: new Date().toISOString().split('T')[0], // Today's date
        start_time: '09:00',
        end_time: '17:00',
        duration: 'Full day',
        location: 'TBD',
        instructor_name: 'TBD',
        instructor_bio: '',
        learning_objectives: [formData.class_description.substring(0, 100) + '...'],
        prerequisites: '',
        max_participants: 50,
        current_participants: 0,
        status: 'planning',
        registration_deadline: null,
        materials_needed: '',
        folder_id: currentFolder?.id || null,
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
      
      // Convert empty date strings to null to avoid PostgreSQL date errors
      const cleanData = {
        ...studentFormData,
        class_id: selectedClass?.id,
        enrolled_by: user?.id,
        // Convert empty strings to null for date fields
        full_payment_date: studentFormData.full_payment_date === '' ? null : studentFormData.full_payment_date,
        split_1_date: studentFormData.split_1_date === '' ? null : studentFormData.split_1_date,
        split_2_date: studentFormData.split_2_date === '' ? null : studentFormData.split_2_date,
        split_3_date: studentFormData.split_3_date === '' ? null : studentFormData.split_3_date,
        split_4_date: studentFormData.split_4_date === '' ? null : studentFormData.split_4_date,
        // Ensure numeric fields are properly converted
        course_fee: Number(studentFormData.course_fee) || 0,
        discount_amount: Number(studentFormData.discount_amount) || 0,
        discount_percentage: Number(studentFormData.discount_percentage) || 0,
        full_payment_amount: studentFormData.payment_type === 'full' ? Number(studentFormData.full_payment_amount) || 0 : null,
        split_1_amount: studentFormData.payment_type === 'split' && studentFormData.number_of_splits >= 1 ? Number(studentFormData.split_1_amount) || 0 : null,
        split_2_amount: studentFormData.payment_type === 'split' && studentFormData.number_of_splits >= 2 ? Number(studentFormData.split_2_amount) || 0 : null,
        split_3_amount: studentFormData.payment_type === 'split' && studentFormData.number_of_splits >= 3 ? Number(studentFormData.split_3_amount) || 0 : null,
        split_4_amount: studentFormData.payment_type === 'split' && studentFormData.number_of_splits >= 4 ? Number(studentFormData.split_4_amount) || 0 : null
      }

      console.log('💾 Saving student data:', cleanData)
      
      if (editingStudent) {
        console.log('✏️ Updating existing student:', editingStudent.id)
        const { error } = await supabase
          .from('classes_participants')
          .update(cleanData)
          .eq('id', editingStudent.id)
        
        if (error) {
          console.error('❌ Update error:', error)
          throw error
        }
        console.log('✅ Student updated successfully')
      } else {
        console.log('➕ Creating new student enrollment')
        const { error } = await supabase
          .from('classes_participants')
          .insert(cleanData)
        
        if (error) {
          console.error('❌ Insert error:', error)
          throw error
        }
        console.log('✅ Student enrolled successfully')
      }
      
      await fetchData()
      resetStudentForm()
      setError(null) // Clear any previous errors
    } catch (err) {
      console.error('Error saving student:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(`Failed to save student: ${errorMessage}`)
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
    console.log('✏️ Editing student:', student)
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

  const quickUpdatePayment = (student: Student) => {
    // Pre-fill form for quick payment updates
    startEditStudent(student)
    // Scroll to payment section when form opens
    setTimeout(() => {
      const paymentSection = document.querySelector('[data-payment-section]')
      if (paymentSection) {
        paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
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
              You don't have permission to access the Classes section.
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
          minHeight: '100vh'
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
                Classes (PR)
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage PR and communication training classes and workshops
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
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
                  color: '#666666',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}
              >
                Create Folder
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setShowMemberModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#FFB333',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(255, 179, 51, 0.3)'
                  }}
                >
                  Manage Members
                </button>
              )}
              
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#5884FD',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                Add Class
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#ffffff', 
              border: '1px solid #F87239', 
              borderRadius: '12px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#F87239',
              fontWeight: '500',
              boxShadow: '0 2px 8px rgba(248, 114, 57, 0.1)'
            }}>
              {error}
            </div>
          )}

          {/* Hierarchical Folder Navigation */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e8e8e8',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
          }}>
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
                  background: 'transparent',
                  border: 'none',
                  color: folderPath.length === 0 ? '#1a1a1a' : '#666666',
                  fontWeight: folderPath.length === 0 ? '500' : '400',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                Classes
              </button>
              
              {folderPath.map((folder, index) => (
                <span key={folder.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: '#C483D9' }}>•</span>
                  <button
                    onClick={() => goToFolder(folder)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: index === folderPath.length - 1 ? '#1a1a1a' : '#666666',
                      fontWeight: index === folderPath.length - 1 ? '500' : '400',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Current Folder Contents */}
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: '500', 
                marginBottom: '1.5rem',
                color: '#1a1a1a',
                letterSpacing: '-0.01em'
              }}>
                {currentFolder ? `${currentFolder.name}` : 'All Folders'} 
                {currentFolder === null && folders.length > 0 && (
                  <span style={{ color: '#666666', fontSize: '0.9rem', fontWeight: '400' }}>
                    ({folders.length} total)
                  </span>
                )}
              </h3>
              
              {getCurrentFolderContents().length === 0 && folders.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem 2rem',
                  color: '#999999',
                  border: '1px dashed #e0e0e0',
                  borderRadius: '12px',
                  background: '#fafafa'
                }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#f0f0f0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                  }}>
                    <FolderIcon style={{ width: '24px', height: '24px', color: '#999999' }} />
                  </div>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '500' }}>No folders created yet</p>
                  <p style={{ margin: '0', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Create folders to organize your classes by category, level, or subject
                  </p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {getCurrentFolderContents().map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => enterFolder(folder)}
                      style={{
                        padding: '1.5rem',
                        background: '#ffffff',
                        border: '1px solid #e8e8e8',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#C483D9'
                        e.currentTarget.style.background = '#fafafa'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(196, 131, 217, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e8e8e8'
                        e.currentTarget.style.background = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: '#f0f0f0',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FolderIcon style={{ width: '20px', height: '20px', color: '#999999' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: '#1a1a1a', fontSize: '1rem' }}>
                          {folder.name}
                        </div>
                        {folder.description && (
                          <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.25rem', lineHeight: '1.4' }}>
                            {folder.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
                overflow: 'auto'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 120px 120px 120px 100px 120px 120px 100px 120px',
                  gap: '0',
                  background: '#f8fafc',
                  borderBottom: '2px solid #e5e7eb',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  color: '#1e293b',
                  minWidth: '1000px'
                }}>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>STUDENT NAME</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>PHONE</div>
                  <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>FACEBOOK</div>
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
                     gridTemplateColumns: '180px 120px 120px 120px 100px 120px 120px 100px 120px',
                     gap: '0',
                     borderBottom: '1px solid #f1f5f9',
                     fontSize: '0.85rem',
                     minWidth: '1000px'
                   }}>
                     <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9' }}>
                       <div style={{ fontWeight: '600', color: '#1e293b' }}>{student.student_name}</div>
                       <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                         {student.email}
                       </div>
                     </div>
                     <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                         <PhoneIcon style={{ width: '12px', height: '12px' }} />
                         <span style={{ fontSize: '0.8rem' }}>{student.phone_number || 'N/A'}</span>
                       </div>
                     </div>
                     <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #f1f5f9', color: '#64748b' }}>
                       {student.facebook_link ? (
                         <a
                           href={student.facebook_link}
                           target="_blank"
                           rel="noopener noreferrer"
                           style={{
                             display: 'flex',
                             alignItems: 'center',
                             gap: '0.25rem',
                             color: '#3b82f6',
                             textDecoration: 'none',
                             fontSize: '0.8rem'
                           }}
                           onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                           onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                         >
                           <LinkIcon style={{ width: '12px', height: '12px' }} />
                           Facebook
                         </a>
                       ) : (
                         <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>N/A</span>
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
                        onClick={() => quickUpdatePayment(student)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#059669',
                          border: '1px solid #059669',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                        title="Update payment"
                      >
                        <CurrencyDollarIcon style={{ width: '12px', height: '12px' }} />
                      </button>
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
                        title="Edit student details"
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

                {/* Total Summary */}
                {students.length > 0 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '180px 120px 120px 120px 100px 120px 120px 100px 120px',
                    gap: '0',
                    background: '#f0f9ff',
                    borderTop: '2px solid #0284c7',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    color: '#0c4a6e',
                    minWidth: '1000px'
                  }}>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}>
                      TOTAL ({students.length} students)
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}></div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}></div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}></div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}>
                      {/* Empty - no course fee total */}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}>
                      {formatCurrency(students.reduce((sum, student) => sum + student.total_amount, 0))}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}>
                      {formatCurrency(students.reduce((sum, student) => sum + student.paid_amount, 0))}
                    </div>
                    <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #bae6fd' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: '#dcfce7',
                        color: '#16a34a'
                      }}>
                        REVENUE
                      </span>
                    </div>
                    <div style={{ padding: '1rem 0.75rem' }}></div>
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
                      <div style={{ marginBottom: '1rem' }}>{item.class_type}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: '600', color: '#059669' }}>
                        <UsersIcon style={{ width: '16px', height: '16px' }} />
                        {item.current_participants} students enrolled
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
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '3rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '400', 
                margin: '0 0 0.5rem 0',
                color: '#1a1a1a',
                letterSpacing: '-0.025em'
              }}>
                {editingItem ? 'Edit Class' : 'Add New Class'}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#666666',
                margin: '0',
                fontWeight: '400',
                lineHeight: '1.5'
              }}>
                {editingItem ? 'Update your class details below' : 'Fill in the details to create a new class'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Class Name *
                </label>
                <input
                  type="text"
                  value={formData.class_title}
                  onChange={(e) => setFormData({ ...formData, class_title: e.target.value })}
                  required
                  placeholder="Enter class name (e.g., PR Writing Workshop, Media Interview Training)"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5884FD';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 2px 8px rgba(88, 132, 253, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem', color: '#000000' }}>
                  Class Description *
                </label>
                <textarea
                  value={formData.class_description}
                  onChange={(e) => setFormData({ ...formData, class_description: e.target.value })}
                  required
                  rows={4}
                  placeholder="Describe what this class covers, learning objectives, and what students will gain..."
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    backgroundColor: '#fafafa',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    lineHeight: '1.5'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#5884FD';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.boxShadow = '0 2px 8px rgba(88, 132, 253, 0.25)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.backgroundColor = '#fafafa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    padding: '1rem 2.5rem',
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f8f8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '1rem 2.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4A6CF7';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 132, 253, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#5884FD';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)';
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

      {/* Student Form Modal */}
      {showStudentForm && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '700px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '3rem',
              paddingBottom: '2rem',
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h2 style={{ 
                fontSize: '2rem', 
                fontWeight: '400', 
                margin: '0 0 0.5rem 0',
                color: '#1a1a1a',
                letterSpacing: '-0.025em'
              }}>
                {editingStudent ? 'Edit Student' : 'Enroll New Student'}
              </h2>
              <p style={{
                fontSize: '1.1rem',
                color: '#666666',
                margin: '0',
                fontWeight: '400',
                lineHeight: '1.5'
              }}>
                {editingStudent ? 'Update student enrollment details below' : 'Fill in the details to enroll a new student'}
              </p>
            </div>

            <form onSubmit={handleStudentSubmit}>
              {/* Student Information Section */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#5884FD',
                    borderRadius: '2px'
                  }}></div>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '500', 
                    margin: '0',
                    color: '#1a1a1a',
                    letterSpacing: '-0.015em'
                  }}>
                    Student Information
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={formStyles.label}>Student Name *</label>
                    <input
                      type="text"
                      value={studentFormData.student_name}
                      onChange={(e) => setStudentFormData({ ...studentFormData, student_name: e.target.value })}
                      required
                      placeholder="Enter student's full name"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>

                  <div>
                    <label style={formStyles.label}>Email *</label>
                    <input
                      type="email"
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                      required
                      placeholder="Enter student's email address"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                  <div>
                    <label style={formStyles.label}>Phone Number</label>
                    <input
                      type="tel"
                      value={studentFormData.phone_number}
                      onChange={(e) => setStudentFormData({ ...studentFormData, phone_number: e.target.value })}
                      placeholder="Enter phone number"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>

                  <div>
                    <label style={formStyles.label}>Facebook Link</label>
                    <input
                      type="url"
                      value={studentFormData.facebook_link}
                      onChange={(e) => setStudentFormData({ ...studentFormData, facebook_link: e.target.value })}
                      placeholder="https://facebook.com/username"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information Section */}
              <div style={{ marginBottom: '3rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #f0f0f0'
                }}>
                  <div style={{
                    width: '4px',
                    height: '24px',
                    backgroundColor: '#C483D9',
                    borderRadius: '2px'
                  }}></div>
                  <h3 style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '500', 
                    margin: '0',
                    color: '#1a1a1a',
                    letterSpacing: '-0.015em'
                  }}>
                    Payment Information
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={formStyles.label}>Payment Method *</label>
                    <select
                      value={studentFormData.payment_method}
                      onChange={(e) => setStudentFormData({ ...studentFormData, payment_method: e.target.value as 'Kpay' | 'Aya Pay' | 'Wave Pay' })}
                      required
                      style={formStyles.select}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    >
                      <option value="">Select payment method</option>
                      {PAYMENT_METHODS.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={formStyles.label}>Course Fee (MMK) *</label>
                    <input
                      type="number"
                      value={studentFormData.course_fee}
                      onChange={(e) => setStudentFormData({ ...studentFormData, course_fee: Number(e.target.value) })}
                      required
                      min="0"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>

                  <div>
                    <label style={formStyles.label}>Payment Type *</label>
                    <select
                      value={studentFormData.payment_type}
                      onChange={(e) => setStudentFormData({ ...studentFormData, payment_type: e.target.value as 'full' | 'split' })}
                      required
                      style={formStyles.select}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    >
                      <option value="full">Full Payment</option>
                      <option value="split">Split Payment</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                  <div>
                    <label style={formStyles.label}>Discount Amount (MMK)</label>
                    <input
                      type="number"
                      value={studentFormData.discount_amount}
                      onChange={(e) => setStudentFormData({ ...studentFormData, discount_amount: Number(e.target.value) })}
                      min="0"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>

                  <div>
                    <label style={formStyles.label}>Discount Percentage (%)</label>
                    <input
                      type="number"
                      value={studentFormData.discount_percentage}
                      onChange={(e) => setStudentFormData({ ...studentFormData, discount_percentage: Number(e.target.value) })}
                      min="0"
                      max="100"
                      style={formStyles.input}
                      onFocus={(e) => Object.assign(e.target.style, formStyles.focusStyles)}
                      onBlur={(e) => Object.assign(e.target.style, formStyles.blurStyles)}
                    />
                  </div>
                </div>

                <div style={{
                  background: '#F5F5ED',
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#666666' }}>Course Fee:</span>
                    <span style={{ fontWeight: '500', color: '#1a1a1a' }}>{formatCurrency(studentFormData.course_fee)} MMK</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: '500', color: '#1a1a1a' }}>Total Amount:</span>
                    <span style={{ fontWeight: '600', color: '#5884FD', fontSize: '1.1rem' }}>{formatCurrency(calculateTotalAmount())} MMK</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                justifyContent: 'center',
                paddingTop: '2.5rem',
                borderTop: '1px solid #f0f0f0',
                marginTop: '2rem'
              }}>
                <button
                  type="button"
                  onClick={resetStudentForm}
                  style={{
                    padding: '1rem 2.5rem',
                    background: '#ffffff',
                    color: '#666666',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f8f8';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '1rem 2.5rem',
                    background: '#5884FD',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minWidth: '140px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#4A6CF7';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 132, 253, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#5884FD';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)';
                  }}
                >
                  {editingStudent ? 'Update Student' : 'Enroll Student'}
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