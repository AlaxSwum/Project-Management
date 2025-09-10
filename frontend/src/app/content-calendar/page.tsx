'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import { FolderIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, UserGroupIcon, PlusIcon, PencilIcon, TrashIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

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
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({ key: 'date', direction: 'asc' })
  const [draggedItem, setDraggedItem] = useState<ContentCalendarItem | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showMemberManagementModal, setShowMemberManagementModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('member')
  const [editingCell, setEditingCell] = useState<{ itemId: number; field: string } | null>(null)
  const [cellValues, setCellValues] = useState<{ [key: string]: any }>({})

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

      // Transform content items to include assignee user data
      const transformedContentItems = await Promise.all(
        (itemsData || []).map(async (item: any) => {
          let assignees: User[] = []
          if (item.assigned_to && item.assigned_to.length > 0) {
            // Fetch user data for each assigned user ID
            const assigneePromises = item.assigned_to.map(async (userId: number) => {
              const user = (usersData || []).find((u: any) => u.id === userId)
              return user || { 
                id: userId, 
                name: 'Unknown User', 
                email: '', 
                role: 'member' 
              }
            })
            assignees = await Promise.all(assigneePromises)
          }
          
          return {
            ...item,
            assignees
          }
        })
      )
      
      setContentItems(transformedContentItems)
      
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
      filterItemsByFolder(transformedContentItems, selectedFolder)
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
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const months = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ]
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    
    const sortedItems = [...filteredItems].sort((a, b) => {
      const aVal = getValueByKey(a, key)
      const bVal = getValueByKey(b, key)
      
      if (aVal === null || aVal === undefined) return direction === 'asc' ? 1 : -1
      if (bVal === null || bVal === undefined) return direction === 'asc' ? -1 : 1
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1
      if (aVal > bVal) return direction === 'asc' ? 1 : -1
      return 0
    })
    
    setFilteredItems(sortedItems)
  }

  const getValueByKey = (item: ContentCalendarItem, key: string) => {
    switch (key) {
      case 'date': return new Date(item.date)
      case 'content_type': return item.content_type
      case 'category': return item.category
      case 'social_media': return item.social_media
      case 'content_title': return item.content_title
      case 'assigned': return item.assignees?.map(a => a.name).join(', ') || ''
      case 'content_deadline': return item.content_deadline ? new Date(item.content_deadline) : null
      case 'graphic_deadline': return item.graphic_deadline ? new Date(item.graphic_deadline) : null
      case 'status': return item.status
      default: return ''
    }
  }

  const handleCellDoubleClick = (itemId: number, field: string, currentValue: any) => {
    setEditingCell({ itemId, field })
    setCellValues({ ...cellValues, [`${itemId}-${field}`]: currentValue })
  }

  const handleCellEdit = async (itemId: number, field: string, newValue: any) => {
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      
      const updateData = { [field]: newValue }
      await supabaseDb.updateContentCalendarItem(itemId, updateData)
      
      // Update local state
      const updatedItems = contentItems.map(item => 
        item.id === itemId ? { ...item, [field]: newValue } : item
      )
      setContentItems(updatedItems)
      filterItemsByFolder(updatedItems, selectedFolder)
      
      setEditingCell(null)
      setCellValues({})
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Failed to update content item')
    }
  }

  const handleCellKeyDown = (e: React.KeyboardEvent, itemId: number, field: string) => {
    if (e.key === 'Enter') {
      const newValue = cellValues[`${itemId}-${field}`]
      handleCellEdit(itemId, field, newValue)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setCellValues({})
    }
  }

  const renderSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUpIcon style={{ width: '12px', height: '12px', opacity: 0.3 }} />
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon style={{ width: '12px', height: '12px', color: '#5884FD' }} />
      : <ChevronDownIcon style={{ width: '12px', height: '12px', color: '#5884FD' }} />
  }

  // Enhanced sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
    
    const sortedItems = [...filteredItems].sort((a, b) => {
      let aValue = a[key as keyof ContentCalendarItem]
      let bValue = b[key as keyof ContentCalendarItem]
      
      // Handle array fields (assigned_to)
      if (key === 'assigned') {
        aValue = a.assignees?.map(u => u.name).join(', ') || ''
        bValue = b.assignees?.map(u => u.name).join(', ') || ''
      }
      
      // Handle date fields
      if (key.includes('date') || key.includes('deadline')) {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      // Handle numeric comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })
    
    setFilteredItems(sortedItems)
  }

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, item: ContentCalendarItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML)
    
    // Add visual feedback
    e.currentTarget.style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1'
    setDraggedItem(null)
    setDragOverIndex(null)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    
    if (!draggedItem) return
    
    const draggedIndex = filteredItems.findIndex(item => item.id === draggedItem.id)
    if (draggedIndex === targetIndex) return
    
    // Reorder items
    const newItems = [...filteredItems]
    const [movedItem] = newItems.splice(draggedIndex, 1)
    newItems.splice(targetIndex, 0, movedItem)
    
    setFilteredItems(newItems)
    setDragOverIndex(null)
    setDraggedItem(null)
    
    // Optionally, you can save the new order to the database here
    // updateItemOrder(newItems)
  }

  // Member management functions
  const addMember = async () => {
    if (!memberEmail.trim()) {
      setError('Please enter a valid email address')
      return
    }

    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.addContentCalendarMemberByEmail(memberEmail.trim(), memberRole)
      
      // Refresh members list
      await fetchMembers()
      
      // Reset form
      setMemberEmail('')
      setMemberRole('member')
      setError('')
      
      // Show success message
      alert('Member added successfully!')
      
    } catch (err: any) {
      console.error('Error adding member:', err)
      setError('Failed to add member: ' + err.message)
    }
  }

  const removeMember = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return
    }

    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.removeContentCalendarMember(userId)
      
      // Refresh members list
      await fetchMembers()
      
      setError('')
      alert('Member removed successfully!')
      
    } catch (err: any) {
      console.error('Error removing member:', err)
      setError('Failed to remove member: ' + err.message)
    }
  }

  const updateMemberRole = async (userId: number, newRole: string) => {
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      await supabaseDb.updateContentCalendarMemberRole(userId, newRole)
      
      // Refresh members list
      await fetchMembers()
      
      setError('')
      
    } catch (err: any) {
      console.error('Error updating member role:', err)
      setError('Failed to update member role: ' + err.message)
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
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => setShowMemberManagementModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#ffffff',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                  Manage Members
                </button>
                
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
                    boxShadow: '0 4px 12px rgba(88, 132, 253, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <PlusIcon style={{ width: '16px', height: '16px' }} />
                  {currentFolder ? `Add to ${currentFolder.name}` : 'Add Content'}
                </button>
              </div>
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
              overflow: 'auto',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
              maxHeight: '70vh'
            }}>
              {/* Sticky Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '140px 120px 130px 130px 1fr 140px 140px 140px 120px 120px',
                gap: '0',
                background: '#fafafa',
                borderBottom: '2px solid #e8e8e8',
                fontWeight: '600',
                fontSize: '0.8rem',
                color: '#444444',
                letterSpacing: '0.025em',
                position: 'sticky',
                top: '0',
                zIndex: 10
              }}>
                <div 
                  onClick={() => handleSort('date')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    position: 'sticky',
                    left: '0',
                    zIndex: 20,
                    borderBottom: '2px solid #e8e8e8',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                >
                  PUBLISHED DATE
                  {renderSortIcon('date')}
                </div>
                <div 
                  onClick={() => handleSort('content_type')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  TYPE
                  {renderSortIcon('content_type')}
                </div>
                <div 
                  onClick={() => handleSort('category')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  CATEGORY
                  {renderSortIcon('category')}
                </div>
                <div 
                  onClick={() => handleSort('social_media')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  PLATFORM
                  {renderSortIcon('social_media')}
                </div>
                <div 
                  onClick={() => handleSort('content_title')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    position: 'sticky',
                    left: '140px',
                    zIndex: 20,
                    borderBottom: '2px solid #e8e8e8',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff'
                  }}
                >
                  TITLE
                  {renderSortIcon('content_title')}
                </div>
                <div 
                  onClick={() => handleSort('assigned')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  ASSIGNED
                  {renderSortIcon('assigned')}
                </div>
                <div 
                  onClick={() => handleSort('content_deadline')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  CONTENT DUE
                  {renderSortIcon('content_deadline')}
                </div>
                <div 
                  onClick={() => handleSort('graphic_deadline')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  GRAPHIC DUE
                  {renderSortIcon('graphic_deadline')}
                </div>
                <div 
                  onClick={() => handleSort('status')}
                  style={{ 
                    padding: '1.25rem 1rem', 
                    borderRight: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  STATUS
                  {renderSortIcon('status')}
                </div>
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
                filteredItems.map((item, index) => (
                  <div 
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 120px 130px 130px 1fr 140px 140px 140px 120px 120px',
                      gap: '0',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      cursor: 'grab',
                      backgroundColor: dragOverIndex === index ? '#f0f9ff' : '#ffffff',
                      borderTop: dragOverIndex === index ? '2px solid #3b82f6' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!draggedItem) {
                        e.currentTarget.style.backgroundColor = '#f8f9fa'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!draggedItem) {
                        e.currentTarget.style.backgroundColor = '#ffffff'
                      }
                    }}
                  >
                    {/* Published Date - Frozen */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'date', item.date)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0', 
                        color: '#666666',
                        background: '#ffffff',
                        position: 'sticky',
                        left: '0',
                        zIndex: 5,
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'date' ? (
                        <input
                          type="date"
                          value={cellValues[`${item.id}-date`] || item.date}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-date`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'date')}
                          onBlur={() => handleCellEdit(item.id, 'date', cellValues[`${item.id}-date`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        />
                      ) : (
                        formatDate(item.date)
                      )}
                    </div>

                    {/* Content Type */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'content_type', item.content_type)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'content_type' ? (
                        <select
                          value={cellValues[`${item.id}-content_type`] || item.content_type}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-content_type`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'content_type')}
                          onBlur={() => handleCellEdit(item.id, 'content_type', cellValues[`${item.id}-content_type`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {CONTENT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      ) : (
                      <div style={{ fontWeight: '500', color: '#1a1a1a' }}>{item.content_type}</div>
                      )}
                    </div>

                    {/* Category */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'category', item.category)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0', 
                        color: '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'category' ? (
                        <select
                          value={cellValues[`${item.id}-category`] || item.category}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-category`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'category')}
                          onBlur={() => handleCellEdit(item.id, 'category', cellValues[`${item.id}-category`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      ) : (
                        item.category
                      )}
                    </div>

                    {/* Social Media Platform */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'social_media', item.social_media)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0', 
                        color: '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'social_media' ? (
                        <select
                          value={cellValues[`${item.id}-social_media`] || item.social_media}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-social_media`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'social_media')}
                          onBlur={() => handleCellEdit(item.id, 'social_media', cellValues[`${item.id}-social_media`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {SOCIAL_MEDIA.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      ) : (
                        item.social_media
                      )}
                    </div>

                    {/* Title - Frozen */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'content_title', item.content_title)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0',
                        background: '#ffffff',
                        position: 'sticky',
                        left: '140px',
                        zIndex: 5,
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'content_title' ? (
                        <input
                          type="text"
                          value={cellValues[`${item.id}-content_title`] || item.content_title}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-content_title`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'content_title')}
                          onBlur={() => handleCellEdit(item.id, 'content_title', cellValues[`${item.id}-content_title`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        />
                      ) : (
                        <div>
                          <div style={{ fontWeight: '500', marginBottom: '0.25rem', color: '#1a1a1a' }}>{item.content_title}</div>
                          {item.description && (
                            <div style={{ fontSize: '0.75rem', color: '#666666', lineHeight: '1.4' }}>
                              {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Assigned */}
                    <div style={{ 
                      padding: '1rem', 
                      borderRight: '1px solid #f0f0f0', 
                      color: '#666666'
                    }}>
                      {item.assignees && item.assignees.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {item.assignees.map((assignee, index) => (
                            <div key={assignee.id} style={{ 
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              color: '#374151',
                              padding: '0.25rem 0.5rem',
                              background: '#f9fafb',
                              borderRadius: '4px',
                              border: '1px solid #e5e7eb'
                            }}>
                              {assignee.name}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Unassigned</span>
                      )}
                     </div>

                    {/* Content Deadline */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'content_deadline', item.content_deadline)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0', 
                        color: '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'content_deadline' ? (
                        <input
                          type="date"
                          value={cellValues[`${item.id}-content_deadline`] || item.content_deadline || ''}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-content_deadline`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'content_deadline')}
                          onBlur={() => handleCellEdit(item.id, 'content_deadline', cellValues[`${item.id}-content_deadline`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        />
                      ) : (
                        item.content_deadline ? formatDate(item.content_deadline) : '-'
                      )}
                    </div>

                    {/* Graphic Deadline */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'graphic_deadline', item.graphic_deadline)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0', 
                        color: '#666666',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'graphic_deadline' ? (
                        <input
                          type="date"
                          value={cellValues[`${item.id}-graphic_deadline`] || item.graphic_deadline || ''}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-graphic_deadline`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'graphic_deadline')}
                          onBlur={() => handleCellEdit(item.id, 'graphic_deadline', cellValues[`${item.id}-graphic_deadline`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        />
                      ) : (
                        item.graphic_deadline ? formatDate(item.graphic_deadline) : '-'
                      )}
                    </div>

                    {/* Status */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'status', item.status)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0',
                        cursor: 'pointer'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'status' ? (
                        <select
                          value={cellValues[`${item.id}-status`] || item.status}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-status`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'status')}
                          onBlur={() => handleCellEdit(item.id, 'status', cellValues[`${item.id}-status`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '2px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {STATUSES.map(status => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                          ))}
                        </select>
                      ) : (
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
                      )}
                    </div>

                    {/* Actions */}
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
                    {editingItem ? 'Edit Content Item' : 'Add New Content Item'}
                  </h2>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#666666',
                    margin: '0',
                    fontWeight: '400',
                    lineHeight: '1.5'
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
                      borderBottom: '1px solid #f0f0f0'
                    }}>
                      <div style={{
                        width: '4px',
                        height: '24px',
                        backgroundColor: '#FFB333',
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
      </div>

      {/* Member Management Modal */}
      {showMemberManagementModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1a1a1a' }}>
                  Manage Calendar Members
                </h2>
                <p style={{ margin: '0.5rem 0 0 0', color: '#666666', fontSize: '0.9rem' }}>
                  Control who can view and edit the content calendar
                </p>
              </div>
              <button
                onClick={() => setShowMemberManagementModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#666666',
                  padding: '0.5rem',
                  borderRadius: '8px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              {error && (
                <div style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              {/* Add New Member Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
                  Add New Member
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                      onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                    />
                  </div>
                  
                  <div style={{ minWidth: '120px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      Role
                    </label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={addMember}
                  disabled={!memberEmail.trim()}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: memberEmail.trim() ? '#3b82f6' : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: memberEmail.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Add Member
                </button>
              </div>

              {/* Current Members List */}
              <div>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a' }}>
                  Current Members ({members.length})
                </h3>
                
                {members.length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    color: '#666666',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <UserGroupIcon style={{ width: '24px', height: '24px', margin: '0 auto 0.5rem', color: '#9ca3af' }} />
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>No members added yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {members.map((member) => (
                      <div
                        key={member.user_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '1rem',
                          backgroundColor: '#f9fafb',
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500', color: '#1a1a1a', fontSize: '0.9rem' }}>
                            {member.user.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#666666' }}>
                            {member.user.email}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.user_id, e.target.value)}
                            style={{
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                          
                          <button
                            onClick={() => removeMember(member.user_id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            title="Remove Member"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 