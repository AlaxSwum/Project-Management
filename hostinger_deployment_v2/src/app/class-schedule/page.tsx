'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ClassScheduleItem {
  id: number
  class_name: string
  class_info: string
  class_start_date: string
  duration: string
  days: string[]
  time_range: string
  platform: string
  instructor_name: string
  instructor_info: string
  post_date: string
  folder_id?: number | null
  created_by: User
  created_at: string
  updated_at: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface ClassScheduleMember {
  id: number
  user_id: number
  role: string
  user: User
}

const PLATFORMS = ['Zoom', 'Google Meet', 'Microsoft Teams', 'In-Person', 'Hybrid', 'Webex', 'Other']
const DURATIONS = ['30 minutes', '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours', '4 hours', 'Full Day']
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ClassSchedulePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [classItems, setClassItems] = useState<ClassScheduleItem[]>([])
  const [members, setMembers] = useState<ClassScheduleMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [currentFolder, setCurrentFolder] = useState<any | null>(null)
  const [folderPath, setFolderPath] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<ClassScheduleItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ClassScheduleItem | null>(null)
  const [formData, setFormData] = useState({
    class_name: '',
    class_info: '',
    class_start_date: '',
    duration: '',
    days: [] as string[],
    time_range: '',
    platform: '',
    instructor_name: '',
    instructor_info: '',
    post_date: '',
    folder_id: null as number | null
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
      
      // Check if user is a class schedule member
      const { data: memberData, error: memberError } = await supabase
        .from('class_schedule_members')
        .select('id, role')
        .eq('user_id', user.id)
        .single()

      if (memberData && !memberError) {
        setHasAccess(true)
        setUserRole(memberData.role)
      } else {
        // Check if user is admin/HR
        const { data: userData, error: userError } = await supabase
          .from('auth_user')
          .select('id, name, email, role, is_superuser, is_staff')
          .eq('id', user.id)
          .single()

        if (userError) {
          setHasAccess(false)
          return
        }

        const hasPermission = userData.is_superuser || userData.is_staff || userData.role === 'admin' || userData.role === 'hr'
        
        if (hasPermission) {
          setHasAccess(true)
          setUserRole('admin')
        } else {
          setHasAccess(false)
        }
      }
    } catch (err) {
      console.error('Error checking access:', err)
      setError('Failed to check access permissions')
    }
  }

  const fetchData = async () => {
    if (!hasAccess || !user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Fetch class schedule items
      const { data: itemsData, error: itemsError } = await supabase
        .from('class_schedule')
        .select(`
          *,
          auth_user:created_by (id, name, email, role)
        `)
        .order('class_start_date', { ascending: true })

      if (itemsError) throw itemsError

      // Fetch class schedule members
      const { data: membersData, error: membersError } = await supabase
        .from('class_schedule_members')
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
        .from('class_schedule_folders')
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
        index === self.findIndex((f: any) => f.name === folder.name)
      )
      setFolders(uniqueFolders)
      
      // Filter items based on current folder
      filterItemsByFolder(itemsData || [], selectedFolder)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load class schedule data')
    }
  }

  const filterItemsByFolder = (items: ClassScheduleItem[], folderId: number | null) => {
    if (folderId === null) {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(item => item.folder_id === folderId)
      setFilteredItems(filtered)
    }
  }

  const enterFolder = (folder: any) => {
    setCurrentFolder(folder)
    setSelectedFolder(folder.id)
    setFolderPath([...folderPath, folder])
    filterItemsByFolder(classItems, folder.id)
  }

  const goToFolder = (folder: any | null) => {
    if (folder === null) {
      // Go to root
      setCurrentFolder(null)
      setSelectedFolder(null)
      setFolderPath([])
      filterItemsByFolder(classItems, null)
    } else {
      // Go to specific folder in path
      const folderIndex = folderPath.findIndex(f => f.id === folder.id)
      const newPath = folderPath.slice(0, folderIndex + 1)
      setCurrentFolder(folder)
      setSelectedFolder(folder.id)
      setFolderPath(newPath)
      filterItemsByFolder(classItems, folder.id)
    }
  }

  const getCurrentFolderContents = () => {
    if (currentFolder === null) {
      // Show root level folders
      return folders.filter(folder => !folder.parent_id)
    } else {
      // Show subfolders of current folder
      return folders.filter(folder => folder.parent_id === currentFolder.id)
    }
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
  }, [hasAccess, user?.id])

  useEffect(() => {
    // Update filtered items when class items change
    filterItemsByFolder(classItems, selectedFolder)
  }, [classItems, selectedFolder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      if (editingItem) {
        const { error } = await supabase
          .from('class_schedule')
          .update(formData)
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('class_schedule')
          .insert({
            ...formData,
            created_by: user?.id
          })
        
        if (error) throw error
      }
      
      await fetchData()
      resetForm()
    } catch (err) {
      console.error('Error saving class:', err)
      setError('Failed to save class')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this class?')) return
    
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { error } = await supabase
        .from('class_schedule')
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
        .from('class_schedule_members')
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
        .from('class_schedule_members')
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
      const { error } = await supabase
        .from('class_schedule_folders')
        .insert({
          ...folderFormData,
          parent_id: currentFolder?.id || null,
          created_by: user?.id
        })
      
      if (error) throw error
      await fetchData()
      setFolderFormData({
        name: '',
        description: '',
        folder_type: currentFolder ? 'category' : 'category',
        color: '#ffffff'
      })
      setShowFolderForm(false)
    } catch (err) {
      console.error('Error creating folder:', err)
      setError('Failed to create folder')
    }
  }

  const resetForm = () => {
    setFormData({
      class_name: '',
      class_info: '',
      class_start_date: '',
      duration: '',
      days: [],
      time_range: '',
      platform: '',
      instructor_name: '',
      instructor_info: '',
      post_date: '',
      folder_id: currentFolder?.id || null
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const startEdit = (item: ClassScheduleItem) => {
    setFormData({
      class_name: item.class_name,
      class_info: item.class_info,
      class_start_date: item.class_start_date,
      duration: item.duration,
      days: item.days,
      time_range: item.time_range,
      platform: item.platform,
      instructor_name: item.instructor_name,
      instructor_info: item.instructor_info,
      post_date: item.post_date,
      folder_id: item.folder_id || null
    })
    setEditingItem(item)
    setShowAddForm(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (authLoading || isLoading) {
    return (
      <div style={{ 
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
    )
  }

  if (!hasAccess) {
    return (
      <div style={{ 
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
            You don't have permission to access the Class Schedule.
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
      
      <div id="main-content" className="main-content" style={{ 
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
                Class Schedule
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage and organize your class schedules and training sessions
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setFolderFormData({
                    name: '',
                    description: '',
                    folder_type: currentFolder ? 'category' : 'category',
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
                onClick={() => {
                  setFormData({
                    ...formData,
                    folder_id: currentFolder?.id || null
                  })
                  setShowAddForm(true)
                }}
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
                {currentFolder ? `Add to ${currentFolder.name}` : 'Add Class'}
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
                  color: currentFolder === null ? '#1a1a1a' : '#666666',
                  fontWeight: currentFolder === null ? '500' : '400',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                Class Schedule
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

          {/* Class Schedule Table - Only show when inside a folder */}
          {currentFolder && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch'
            }}>
              <div style={{
                display: 'grid',
                  gridTemplateColumns: '120px 200px 100px 100px 100px 100px 120px 200px 100px 80px',
                gap: '0',
                  background: '#fafafa',
                  borderBottom: '1px solid #e8e8e8',
                  fontWeight: '500',
                  fontSize: '0.8rem',
                  color: '#666666',
                  letterSpacing: '0.025em',
                  minWidth: '1120px'
              }}>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>START DATE</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>CLASS NAME</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>DURATION</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>DAYS</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>TIME</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>PLATFORM</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>INSTRUCTOR NAME</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>INSTRUCTOR INFO</div>
                  <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>POST DATE</div>
                  <div style={{ padding: '1.25rem 1rem' }}>ACTIONS</div>
              </div>

              {filteredItems.length === 0 ? (
                <div style={{ 
                  padding: '4rem', 
                  textAlign: 'center', 
                  color: '#999999',
                  fontSize: '1.1rem'
                }}>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: '#f0f0f0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem'
                  }}>
                    <CalendarIcon style={{ width: '24px', height: '24px', color: '#999999' }} />
                  </div>
                  <p style={{ margin: '0', fontWeight: '500' }}>No classes in {currentFolder.name}</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666666' }}>Click "Add Class" to create one.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 200px 100px 100px 100px 100px 120px 200px 100px 80px',
                    gap: '0',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease',
                    minWidth: '1120px'
                  }}>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {formatDate(item.class_start_date)}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem', color: '#1a1a1a' }}>{item.class_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#666666', lineHeight: '1.4' }}>
                        {item.class_info && item.class_info.length > 50 ? `${item.class_info.substring(0, 50)}...` : item.class_info}
                      </div>
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.duration}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.days.join(', ')}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.time_range}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.platform}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.instructor_name || '-'}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.instructor_info && item.instructor_info.length > 30 ? `${item.instructor_info.substring(0, 30)}...` : item.instructor_info || '-'}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {formatDate(item.post_date)}
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <button
                        onClick={() => startEdit(item)}
                        style={{
                          padding: '0.5rem',
                          background: '#ffffff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#5884FD',
                          transition: 'all 0.2s ease',
                          height: '36px',
                          width: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#5884FD'
                          e.currentTarget.style.color = '#ffffff'
                          e.currentTarget.style.borderColor = '#5884FD'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.color = '#5884FD'
                          e.currentTarget.style.borderColor = '#e8e8e8'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <PencilIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: '0.5rem',
                          background: '#ffffff',
                          border: '1px solid #e8e8e8',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: '#F87239',
                          transition: 'all 0.2s ease',
                          height: '36px',
                          width: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F87239'
                          e.currentTarget.style.color = '#ffffff'
                          e.currentTarget.style.borderColor = '#F87239'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(248, 114, 57, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.color = '#F87239'
                          e.currentTarget.style.borderColor = '#e8e8e8'
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <TrashIcon style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          )}

          {/* Root view message - only show folders, no class table */}
          {!currentFolder && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '16px',
              padding: '4rem',
              textAlign: 'center',
              color: '#666666',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: '#f0f0f0',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem'
              }}>
                <FolderIcon style={{ width: '32px', height: '32px', color: '#999999' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '400', margin: '0 0 1rem 0', color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                Choose a Folder to View Classes
              </h3>
              <p style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                Click on a folder above to see its class schedules and manage your training sessions.
              </p>
              <p style={{ fontSize: '0.9rem', margin: '0', color: '#999999' }}>
                Create new folders to organize classes by category, level, or subject.
              </p>
            </div>
          )}

          {/* Add/Edit Form Modal */}
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
              zIndex: 1000
            }}>
              <div style={{
                background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '20px',
              padding: '3rem',
                width: '95%',
                maxWidth: '700px',
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
                    {editingItem ? 'Edit Class Schedule' : 'Add New Class Schedule'}
                  </h2>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#666666',
                    margin: '0',
                    fontWeight: '400',
                    lineHeight: '1.5'
                  }}>
                    {editingItem ? 'Update your class details below' : 'Fill in the details to create a new class schedule'}
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Basic Information Section */}
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
                        Basic Information
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Class Name</label>
                        <input
                          type="text"
                          value={formData.class_name}
                          onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                          required
                          placeholder="Enter class name..."
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Class Start Date</label>
                        <input
                          type="date"
                          value={formData.class_start_date}
                          onChange={(e) => setFormData({ ...formData, class_start_date: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Class Information</label>
                      <textarea
                        value={formData.class_info}
                        onChange={(e) => setFormData({ ...formData, class_info: e.target.value })}
                        rows={3}
                        placeholder="Describe the class content, objectives, and requirements..."
                        style={{
                          width: '100%',
                          padding: '0.9rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  {/* Schedule Details Section */}
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
                        Schedule Details
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Duration</label>
                        <select
                          value={formData.duration}
                          onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Select duration</option>
                          {DURATIONS.map(duration => (
                            <option key={duration} value={duration}>{duration}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Time Range</label>
                        <input
                          type="text"
                          value={formData.time_range}
                          onChange={(e) => setFormData({ ...formData, time_range: e.target.value })}
                          placeholder="e.g., 7:00 PM - 9:00 PM"
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Days of Week</label>
                      <div style={{ 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                          {WEEKDAYS.map(day => (
                            <label key={day} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.5rem',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              borderRadius: '4px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e5e7eb'
                            }}>
                              <input
                                type="checkbox"
                                checked={formData.days.includes(day)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      days: [...formData.days, day]
                                    })
                                  } else {
                                    setFormData({
                                      ...formData,
                                      days: formData.days.filter(d => d !== day)
                                    })
                                  }
                                }}
                                style={{ width: '16px', height: '16px' }}
                              />
                              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                {day}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Platform</label>
                        <select
                          value={formData.platform}
                          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        >
                          <option value="">Select platform</option>
                          {PLATFORMS.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Post Date</label>
                        <input
                          type="date"
                          value={formData.post_date}
                          onChange={(e) => setFormData({ ...formData, post_date: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information Section */}
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
                        backgroundColor: '#F87239',
                        borderRadius: '2px'
                      }}></div>
                      <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '500', 
                        margin: '0',
                        color: '#1a1a1a',
                        letterSpacing: '-0.015em'
                      }}>
                        Additional Details
                      </h3>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Instructor Name</label>
                      <input
                        type="text"
                        value={formData.instructor_name}
                        onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                        placeholder="Enter instructor's full name"
                        style={{
                          width: '100%',
                          padding: '0.9rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Instructor Information</label>
                      <textarea
                        value={formData.instructor_info}
                        onChange={(e) => setFormData({ ...formData, instructor_info: e.target.value })}
                        rows={4}
                        placeholder="Provide instructor background, qualifications, experience, and contact information..."
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          backgroundColor: '#fafafa',
                          lineHeight: '1.5',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Folder</label>
                      <select
                        value={formData.folder_id || ''}
                        onChange={(e) => setFormData({ ...formData, folder_id: e.target.value ? parseInt(e.target.value) : null })}
                        style={{
                          width: '100%',
                          padding: '0.9rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fafafa',
                          boxSizing: 'border-box'
                        }}
                      >
                        <option value="">No folder</option>
                        {folders.map(folder => (
                          <option key={folder.id} value={folder.id}>{folder.name}</option>
                        ))}
                      </select>
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
                        e.currentTarget.style.backgroundColor = '#f8f8f8'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
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
                        e.currentTarget.style.backgroundColor = '#4A6CF7'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 132, 253, 0.4)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#5884FD'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)'
                      }}
                    >
                      {editingItem ? 'Update Class' : 'Create Class'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Member Management Modal */}
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
              zIndex: 1000
            }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '20px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '400', 
                  marginBottom: '2rem',
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em'
                }}>
                  Manage Class Schedule Members
                </h2>

                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Current Members</h3>
                  <div style={{ 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {(members || []).map(member => (
                      <div key={member.user_id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div>
                          <span style={{ fontWeight: '600' }}>{member.user.name}</span>
                          <span style={{ color: '#666666', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                            ({member.user.email})
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: '#ffffff',
                            color: '#F87239',
                            border: '1px solid #e8e8e8',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#F87239'
                            e.currentTarget.style.color = '#ffffff'
                            e.currentTarget.style.borderColor = '#F87239'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff'
                            e.currentTarget.style.color = '#F87239'
                            e.currentTarget.style.borderColor = '#e8e8e8'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Add New Members</h3>
                  <div style={{ 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflow: 'auto'
                  }}>
                    {(allUsers || [])
                      .filter(user => !(members || []).some(member => member.user_id === user.id))
                      .map(user => (
                        <div key={user.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          borderBottom: '1px solid #e5e7eb'
                        }}>
                          <div>
                            <span style={{ fontWeight: '600' }}>{user.name}</span>
                            <span style={{ color: '#666666', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                              ({user.email})
                            </span>
                          </div>
                          <button
                            onClick={() => handleAddMember(user.id)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              background: '#5884FD',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#4A6CF7'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#5884FD'
                            }}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowMemberModal(false)}
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4A6CF7';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(88, 132, 253, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#5884FD';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(88, 132, 253, 0.3)';
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Folder Creation Form Modal */}
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
              zIndex: 1000
            }}>
              <div style={{
                background: '#ffffff',
                border: '1px solid #e8e8e8',
                borderRadius: '20px',
                padding: '2.5rem',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
              }}>
                <h2 style={{ 
                  fontSize: '1.75rem', 
                  fontWeight: '400', 
                  marginBottom: '2rem',
                  color: '#1a1a1a',
                  letterSpacing: '-0.02em'
                }}>
                  {currentFolder ? `Create Subfolder in ${currentFolder.name}` : 'Create New Folder'}
                </h2>

                {currentFolder && (
                  <div style={{
                    background: '#f0f0f0',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.9rem',
                    color: '#666666'
                  }}>
                    <strong>Parent Folder:</strong> {currentFolder.name}
                    <br />
                    This folder will be created inside "{currentFolder.name}"
                  </div>
                )}

                <form onSubmit={handleCreateFolder}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Folder Name
                    </label>
                    <input
                      type="text"
                      value={folderFormData.name}
                      onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                      placeholder={currentFolder 
                        ? `e.g., Beginner Level, Advanced Topics, Practical Sessions` 
                        : `e.g., Programming Classes, Business Training, Design Workshops`
                      }
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Folder Type
                    </label>
                    <select
                      value={folderFormData.folder_type}
                      onChange={(e) => setFolderFormData({ ...folderFormData, folder_type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="category">Category</option>
                      <option value="level">Level</option>
                      <option value="subject">Subject</option>
                      <option value="semester">Semester</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Description (Optional)
                    </label>
                    <textarea
                      value={folderFormData.description}
                      onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                      placeholder="Brief description of this folder's purpose"
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

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowFolderForm(false)}
                      style={{
                        padding: '0.875rem 1.5rem',
                        background: '#ffffff',
                        color: '#666666',
                        border: '1px solid #e0e0e0',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f8f8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
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
                        padding: '0.875rem 1.5rem',
                        background: '#C483D9',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(196, 131, 217, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#B16EC4';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(196, 131, 217, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#C483D9';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(196, 131, 217, 0.3)';
                      }}
                    >
                      {currentFolder ? 'Create Subfolder' : 'Create Folder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
      </div>
    </>
  )
} 