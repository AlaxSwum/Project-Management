'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface ContentCalendarItem {
  id: number
  date: string
  content_type: string
  category: string
  social_media: string
  content_title: string
  assigned_to: number[]
  content_deadline: string | null
  graphic_deadline: string | null
  status: string
  description?: string
  folder_id?: number | null
  assignees?: User[]
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

interface ContentCalendarMember {
  id: number
  user_id: number
  role: string
  user: User
}

const CONTENT_TYPES = ['Article', 'Video', 'Image', 'Infographic', 'Story', 'Reel', 'Post']
const CATEGORIES = ['Marketing', 'Educational', 'Promotional', 'Entertainment', 'News', 'Tutorial']
const SOCIAL_MEDIA = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest']
const STATUSES = ['planning', 'in_progress', 'review', 'completed']

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [contentItems, setContentItems] = useState<ContentCalendarItem[]>([])
  const [members, setMembers] = useState<ContentCalendarMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [folders, setFolders] = useState<any[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [currentFolder, setCurrentFolder] = useState<any | null>(null)
  const [folderPath, setFolderPath] = useState<any[]>([])
  const [filteredItems, setFilteredItems] = useState<ContentCalendarItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showFolderForm, setShowFolderForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentCalendarItem | null>(null)
  const [formData, setFormData] = useState({
    date: '',
    content_type: '',
    category: '',
    social_media: '',
    content_title: '',
    assigned_to: [] as number[],
    content_deadline: '',
    graphic_deadline: '',
    status: 'planning',
    description: '',
    folder_id: null as number | null
  })
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: '',
    folder_type: 'month',
    color: '#ffffff'
  })

  const checkAccess = async () => {
    if (!user?.id) return

    try {
      const supabase = (await import('@/lib/supabase')).supabase
      
      // Check if user is a content calendar member
      const { data: memberData, error: memberError } = await supabase
        .from('content_calendar_members')
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
      const { supabaseDb } = await import('@/lib/supabase')
      
      const { data: itemsData } = await supabaseDb.getContentCalendarItems()
      const { data: membersData } = await supabaseDb.getContentCalendarMembers()
      const { data: usersData } = await supabaseDb.getUsers()
      const { data: foldersData } = await supabaseDb.getContentCalendarFolders()

      setContentItems(itemsData || [])
      
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
      
      // Remove duplicates from folders (in case of database issues)
      const uniqueFolders = (foldersData || []).filter((folder: any, index: number, self: any[]) => 
        index === self.findIndex((f: any) => f.name === folder.name && f.folder_type === folder.folder_type)
      )
      setFolders(uniqueFolders)
      
      // Filter items based on current folder
      filterItemsByFolder(itemsData || [], selectedFolder)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load content calendar data')
    }
  }

  const filterItemsByFolder = (items: ContentCalendarItem[], folderId: number | null) => {
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
    filterItemsByFolder(contentItems, folder.id)
  }

  const goToFolder = (folder: any | null) => {
    if (folder === null) {
      // Go to root
      setCurrentFolder(null)
      setSelectedFolder(null)
      setFolderPath([])
      filterItemsByFolder(contentItems, null)
    } else {
      // Go to specific folder in path
      const folderIndex = folderPath.findIndex(f => f.id === folder.id)
      const newPath = folderPath.slice(0, folderIndex + 1)
      setCurrentFolder(folder)
      setSelectedFolder(folder.id)
      setFolderPath(newPath)
      filterItemsByFolder(contentItems, folder.id)
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
    // Update filtered items when content items change
    filterItemsByFolder(contentItems, selectedFolder)
  }, [contentItems, selectedFolder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      
      if (editingItem) {
        await supabaseDb.updateContentCalendarItem(editingItem.id, formData)
      } else {
        await supabaseDb.createContentCalendarItem(formData)
      }
      
      await fetchData()
      resetForm()
    } catch (err) {
      console.error('Error saving item:', err)
      setError('Failed to save content item')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this content item?')) return
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.deleteContentCalendarItem(id)
      await fetchData()
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete content item')
    }
  }

  const handleAddMember = async (userId: number) => {
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.addContentCalendarMember(userId, 'member')
      await fetchData()
    } catch (err) {
      console.error('Error adding member:', err)
      setError('Failed to add member')
    }
  }

  const handleRemoveMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.removeContentCalendarMember(userId)
      await fetchData()
    } catch (err) {
      console.error('Error removing member:', err)
      setError('Failed to remove member')
    }
  }

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.createContentCalendarFolder({
        ...folderFormData,
        parent_folder_id: currentFolder?.id || null, // Create as subfolder if inside a folder
        sort_order: folders.length + 1
      })
      await fetchData()
      setFolderFormData({
        name: '',
        description: '',
        folder_type: currentFolder ? 'week' : 'month', // Reset with appropriate default
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
      date: '',
      content_type: '',
      category: '',
      social_media: '',
      content_title: '',
      assigned_to: [],
      content_deadline: '',
      graphic_deadline: '',
      status: 'planning',
      description: '',
      folder_id: currentFolder?.id || null
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const startEdit = (item: ContentCalendarItem) => {
    setFormData({
      date: item.date,
      content_type: item.content_type,
      category: item.category,
      social_media: item.social_media,
      content_title: item.content_title,
      assigned_to: item.assigned_to,
      content_deadline: item.content_deadline || '',
      graphic_deadline: item.graphic_deadline || '',
      status: item.status,
      description: item.description || '',
      folder_id: item.folder_id || null
    })
    setEditingItem(item)
    setShowAddForm(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning'
      case 'in_progress': return 'In Progress'
      case 'review': return 'Review'
      case 'completed': return 'Completed'
      default: return status
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
              You don't have permission to access the Content Calendar.
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
                Content Calendar
              </h1>
              <p style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage your social media content planning and scheduling
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setFolderFormData({
                    name: '',
                    description: '',
                    folder_type: currentFolder ? 'week' : 'month', // Default to 'week' for subfolders
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
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)'
                }}
              >
                {currentFolder ? `Add to ${currentFolder.name}` : 'Add Content'}
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
                Content Calendar
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
                    Create folders to organize your content by month, campaign, or category
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

                    {/* Content Table - Only show when inside a folder */}
          {currentFolder && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '120px 100px 120px 120px 1fr 120px 120px 120px 100px 100px',
                gap: '0',
                background: '#fafafa',
                borderBottom: '1px solid #e8e8e8',
                fontWeight: '500',
                fontSize: '0.8rem',
                color: '#666666',
                letterSpacing: '0.025em'
              }}>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>PUBLISHED DATE</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>TYPE</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>CATEGORY</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>PLATFORM</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>TITLE</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>ASSIGNED</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>CONTENT DUE</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>GRAPHIC DUE</div>
                <div style={{ padding: '1.25rem 1rem', borderRight: '1px solid #f0f0f0' }}>STATUS</div>
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
                  <p style={{ margin: '0', fontWeight: '500' }}>No content items in {currentFolder.name}</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#666666' }}>Click "Add Content" to create one.</p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 100px 120px 120px 1fr 120px 120px 120px 100px 100px',
                    gap: '0',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {formatDate(item.date)}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{item.content_type}</div>
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.category}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.social_media}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0' }}>
                      <div style={{ fontWeight: '500', marginBottom: '0.25rem', color: '#1a1a1a' }}>{item.content_title}</div>
                      {item.description && (
                        <div style={{ fontSize: '0.75rem', color: '#666666', lineHeight: '1.4' }}>
                          {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                        </div>
                      )}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                       {item.assigned_to && item.assigned_to.length > 0 ? `${item.assigned_to.length} assigned` : 'Unassigned'}
                     </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.content_deadline ? formatDate(item.content_deadline) : '-'}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0', color: '#666666' }}>
                      {item.graphic_deadline ? formatDate(item.graphic_deadline) : '-'}
                    </div>
                    <div style={{ padding: '1rem', borderRight: '1px solid #f0f0f0' }}>
                      <span style={{
                        padding: '0.375rem 0.75rem',
                        background: item.status === 'completed' ? '#10B981' : item.status === 'in_progress' ? '#5884FD' : item.status === 'review' ? '#FFB333' : '#C483D9',
                        color: '#ffffff',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => startEdit(item)}
                        style={{
                          padding: '0.375rem',
                          background: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#5884FD',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#5884FD'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.color = '#5884FD'
                        }}
                      >
                        <PencilIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: '0.375rem',
                          background: '#ffffff',
                          border: '1px solid #e0e0e0',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          color: '#F87239',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#F87239'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff'
                          e.currentTarget.style.color = '#F87239'
                        }}
                      >
                        <TrashIcon style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Root view message - only show folders, no content table */}
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
                Choose a Folder to View Content
              </h3>
              <p style={{ fontSize: '1.1rem', margin: '0 0 1rem 0', lineHeight: '1.5' }}>
                Click on a folder above to see its content items and manage your social media content.
              </p>
              <p style={{ fontSize: '0.9rem', margin: '0', color: '#999999' }}>
                Create new folders to organize content by month, campaign, or category.
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
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '2.5rem',
                width: '95%',
                maxWidth: '700px',
                maxHeight: '95vh',
                overflow: 'auto',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{
                  textAlign: 'center',
                  marginBottom: '2.5rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '2px solid #f0f0f0'
                }}>
                  <h2 style={{ 
                    fontSize: '1.8rem', 
                    fontWeight: '700', 
                    margin: '0 0 0.5rem 0',
                    color: '#000000',
                    letterSpacing: '-0.025em'
                  }}>
                    {editingItem ? 'Edit Content Item' : 'Add New Content Item'}
                  </h2>
                  <p style={{
                    fontSize: '1rem',
                    color: '#666666',
                    margin: '0',
                    fontWeight: '400'
                  }}>
                    {editingItem ? 'Update your content details below' : 'Fill in the details to create a new content item'}
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
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#000000',
                        borderRadius: '2px'
                      }}></div>
                      <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700', 
                        margin: '0',
                        color: '#000000',
                        letterSpacing: '-0.015em'
                      }}>
                        Basic Information
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Published Date</label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Content Type</label>
                        <select
                          value={formData.content_type}
                          onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <option value="">Select type</option>
                          {CONTENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <option value="">Select category</option>
                          {CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Social Media Platform</label>
                        <select
                          value={formData.social_media}
                          onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                          required
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <option value="">Select platform</option>
                          {SOCIAL_MEDIA.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Content Title</label>
                      <input
                        type="text"
                        value={formData.content_title}
                        onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                        required
                        placeholder="Enter the content title..."
                        style={{
                          width: '100%',
                          padding: '0.9rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          backgroundColor: '#fafafa'
                        }}
                      />
                    </div>
                  </div>

                  {/* Deadlines Section */}
                  <div style={{ marginBottom: '3rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '2rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#000000',
                        borderRadius: '2px'
                      }}></div>
                      <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700', 
                        margin: '0',
                        color: '#000000',
                        letterSpacing: '-0.015em'
                      }}>
                        Deadlines
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Content Deadline</label>
                        <input
                          type="date"
                          value={formData.content_deadline}
                          onChange={(e) => setFormData({ ...formData, content_deadline: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Graphic Deadline</label>
                        <input
                          type="date"
                          value={formData.graphic_deadline}
                          onChange={(e) => setFormData({ ...formData, graphic_deadline: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Organization Section */}
                  <div style={{ marginBottom: '3rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '2rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#000000',
                        borderRadius: '2px'
                      }}></div>
                      <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700', 
                        margin: '0',
                        color: '#000000',
                        letterSpacing: '-0.015em'
                      }}>
                        Organization
                      </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Status</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          {STATUSES.map(status => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                          ))}
                        </select>
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
                            backgroundColor: '#fafafa'
                          }}
                        >
                          <option value="">No folder</option>
                          {folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Assign To</label>
                      <div style={{ 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        maxHeight: '140px',
                        overflow: 'auto',
                        backgroundColor: '#fafafa'
                      }}>
                        {(members || []).map(member => (
                          <label key={member.user_id} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            marginBottom: '0.75rem',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb'
                          }}>
                            <input
                              type="checkbox"
                              checked={(formData.assigned_to || []).includes(member.user_id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    assigned_to: [...(formData.assigned_to || []), member.user_id]
                                  })
                                } else {
                                  setFormData({
                                    ...formData,
                                    assigned_to: (formData.assigned_to || []).filter(id => id !== member.user_id)
                                  })
                                }
                              }}
                              style={{ width: '18px', height: '18px' }}
                            />
                            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>
                              {member.user.name} ({member.user.email})
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div style={{ marginBottom: '3rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '2rem',
                      paddingBottom: '1rem',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#000000',
                        borderRadius: '2px'
                      }}></div>
                      <h3 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '700', 
                        margin: '0',
                        color: '#000000',
                        letterSpacing: '-0.015em'
                      }}>
                        Additional Details
                      </h3>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        placeholder="Add any additional notes or descriptions..."
                        style={{
                          width: '100%',
                          padding: '1rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          resize: 'vertical',
                          backgroundColor: '#fafafa',
                          lineHeight: '1.5'
                        }}
                      />
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
                        background: '#f8f9fa',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '140px',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#e5e7eb';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{
                        padding: '1rem 2.5rem',
                        background: '#000000',
                        color: '#ffffff',
                        border: '1px solid #000000',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minWidth: '140px',
                        fontFamily: 'inherit',
                        outline: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#1f2937';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {editingItem ? 'Update Content' : 'Create Content'}
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
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '2rem',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1.5rem',
                  color: '#000000'
                }}>
                  Manage Content Calendar Members
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
                            padding: '0.25rem 0.5rem',
                            background: '#ffffff',
                            color: '#000000',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer'
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
                              padding: '0.25rem 0.5rem',
                              background: '#000000',
                              color: '#ffffff',
                              border: '1px solid #000000',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
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
                      padding: '0.75rem 1.5rem',
                      background: '#000000',
                      color: '#ffffff',
                      border: '2px solid #000000',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer'
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
                border: '2px solid #000000',
                borderRadius: '8px',
                padding: '2rem',
                width: '90%',
                maxWidth: '500px'
              }}>
                <h2 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  marginBottom: '1.5rem',
                  color: '#000000'
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
                          ? `e.g., Week 1, Campaign A, Social Posts` 
                          : `e.g., January 2025, Summer Campaign, Product Launch`
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
                        {currentFolder ? (
                          <>
                            <option value="week">Weekly</option>
                            <option value="campaign">Campaign</option>
                            <option value="project">Project</option>
                            <option value="category">Category</option>
                            <option value="month">Monthly</option>
                          </>
                        ) : (
                          <>
                            <option value="month">Monthly</option>
                            <option value="campaign">Campaign</option>
                            <option value="project">Project</option>
                            <option value="category">Category</option>
                          </>
                        )}
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
                        padding: '0.75rem 1.5rem',
                        background: '#ffffff',
                        color: '#000000',
                        border: '2px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
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
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
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
      </div>
    </>
  )
} 