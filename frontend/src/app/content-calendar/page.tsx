'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
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
  security_level?: 'public' | 'restricted' | 'confidential' | 'secret'
  allowed_users?: number[]
  can_view?: boolean
  can_edit?: boolean
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
const SECURITY_LEVELS = [
  { value: 'public', label: 'Public', description: 'Everyone can view', color: '#10b981' },
  { value: 'restricted', label: 'Restricted', description: 'Selected members only', color: '#f59e0b' },
  { value: 'confidential', label: 'Confidential', description: 'Manager+ only', color: '#ef4444' },
  { value: 'secret', label: 'Secret', description: 'Admin only', color: '#7c3aed' }
]

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'sheet' | 'calendar'>('sheet')

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
  const [showFolderPermissions, setShowFolderPermissions] = useState(false)
  const [showFilePermissions, setShowFilePermissions] = useState(false)
  const [selectedFolderForPermissions, setSelectedFolderForPermissions] = useState<any | null>(null)
  const [selectedFileForPermissions, setSelectedFileForPermissions] = useState<ContentCalendarItem | null>(null)
  const [folderMembers, setFolderMembers] = useState<any[]>([])
  const [assignableUsers, setAssignableUsers] = useState<any[]>([])
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
    folder_id: null as number | null,
    security_level: 'public' as 'public' | 'restricted' | 'confidential' | 'secret',
    allowed_users: [] as number[]
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
        // Check if user is a member of any folder
        const { data: folderMemberData, error: folderMemberError } = await supabase
          .from('content_calendar_folder_members')
          .select('id, role')
          .eq('user_id', user.id)
          .limit(1)

        if (folderMemberData && folderMemberData.length > 0 && !folderMemberError) {
          setHasAccess(true)
          setUserRole(folderMemberData[0].role || 'member')
        } else {
          // Only assigned members can access
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
      
      // Filter content items based on user access
      console.log('Total content items before filtering:', transformedContentItems.length)
      const accessibleContentItems = transformedContentItems.filter(item => canAccessFile(item))
      console.log('Accessible content items after filtering:', accessibleContentItems.length)
      console.log('Accessible items:', accessibleContentItems.map(item => ({ id: item.id, content_title: item.content_title, security_level: item.security_level })))
      setContentItems(accessibleContentItems)
      
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
      // Filter folders based on user access
      let accessibleFolders = []
      if (userRole === 'admin' || userRole === 'manager') {
        // Admins and managers can see all folders
        accessibleFolders = (foldersData || []).filter((folder: any, index: number, self: any[]) => 
          index === self.findIndex((f: any) => f.name === folder.name && f.folder_type === folder.folder_type)
        )
      } else {
        // Regular users can only see folders they're members of or created
        try {
          // Get all folder memberships for this user by directly querying the database
          const supabase = (await import('@/lib/supabase')).supabase
          const { data: userFolderMemberships, error: membershipError } = await supabase
            .from('content_calendar_folder_members')
            .select('folder_id')
            .eq('user_id', user.id)
          
          if (membershipError) {
            console.error('Error fetching folder memberships:', membershipError)
          }
          
          const userFolderIds = (userFolderMemberships || []).map((membership: any) => membership.folder_id)
          console.log('User folder IDs:', userFolderIds)
          
          accessibleFolders = (foldersData || []).filter((folder: any, index: number, self: any[]) => {
            const isUnique = index === self.findIndex((f: any) => f.name === folder.name && f.folder_type === folder.folder_type)
            const hasAccess = folder.created_by_id === user.id || userFolderIds.includes(folder.id)
            console.log(`Folder ${folder.name} (ID: ${folder.id}): created_by=${folder.created_by_id}, user_id=${user.id}, in_memberships=${userFolderIds.includes(folder.id)}, hasAccess=${hasAccess}`)
            return isUnique && hasAccess
          })
          
          console.log('Accessible folders for user:', accessibleFolders.map((f: any) => f.name))
        } catch (err) {
          console.error('Error in folder filtering:', err)
          // Fallback: show only folders created by user
          accessibleFolders = (foldersData || []).filter((folder: any, index: number, self: any[]) => {
            const isUnique = index === self.findIndex((f: any) => f.name === folder.name && f.folder_type === folder.folder_type)
            const hasAccess = folder.created_by_id === user.id
            return isUnique && hasAccess
          })
        }
      }
      
      setFolders(accessibleFolders)
      
      // Filter items based on current folder
      filterItemsByFolder(transformedContentItems, selectedFolder)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load content calendar data')
    }
  }

  const fetchMembers = async () => {
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      const { data: membersData } = await supabaseDb.getContentCalendarMembers()
      
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
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const filterItemsByFolder = (items: ContentCalendarItem[], folderId: number | null) => {
    console.log(`Filtering items by folder: ${folderId || 'root'}, total items: ${items.length}`)
    
    let folderFiltered = []
    if (folderId === null) {
      folderFiltered = items
      console.log('Showing all items (root folder)')
    } else {
      folderFiltered = items.filter(item => item.folder_id === folderId)
      console.log(`Items in folder ${folderId}:`, folderFiltered.length)
    }
    
    // Apply security filtering
    console.log('Applying security filtering...')
    const securityFiltered = folderFiltered.filter(item => canAccessFile(item))
    console.log(`Final filtered items: ${securityFiltered.length}`)
    console.log('Final items:', securityFiltered.map(item => ({ id: item.id, content_title: item.content_title, folder_id: item.folder_id })))
    
    setFilteredItems(securityFiltered)
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

  useEffect(() => {
    // Update assignable users when folder changes
    const updateAssignableUsers = async () => {
      const users = await getAssignableUsers()
      setAssignableUsers(users)
    }
    
    if (currentFolder) {
      updateAssignableUsers()
    } else {
      setAssignableUsers(members)
    }
  }, [currentFolder, members])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      
      // Prepare form data, excluding security fields if they cause errors
      const submitData = { ...formData }
      console.log('Submitting content:', submitData)
      
      try {
        let result
        if (editingItem) {
          console.log('Updating existing item:', editingItem.id)
          result = await supabaseDb.updateContentCalendarItem(editingItem.id, submitData)
        } else {
          console.log('Creating new item')
          result = await supabaseDb.createContentCalendarItem(submitData)
        }
        
        console.log('Submit result:', result)
        
        console.log('Refreshing data after successful submission...')
        await fetchData()
        resetForm()
        console.log('Content submitted and data refreshed successfully')
      } catch (columnError: any) {
        if (columnError.message?.includes('allowed_users') || columnError.message?.includes('security_level')) {
          // Remove security fields and try again
          const { security_level, allowed_users, ...basicData } = submitData
          console.log('Retrying without security fields due to missing database columns')
          console.log('Basic data:', basicData)
          
          let result
          if (editingItem) {
            result = await supabaseDb.updateContentCalendarItem(editingItem.id, basicData)
          } else {
            result = await supabaseDb.createContentCalendarItem(basicData)
          }
          
          console.log('Retry result:', result)
          
          console.log('Refreshing data after successful retry...')
          await fetchData()
          resetForm()
          setError('Content saved. Note: Security features require database migration.')
          console.log('Content submitted and data refreshed successfully (without security fields)')
        } else {
          throw columnError
        }
      }
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

  // Folder Permission Management
  const handleManageFolderPermissions = async (folder: any) => {
    setSelectedFolderForPermissions(folder)
    
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      const { data: members } = await supabaseDb.getContentCalendarFolderMembers(folder.id)
      setFolderMembers(members || [])
      setShowFolderPermissions(true)
    } catch (err) {
      console.error('Error fetching folder members:', err)
      setError('Failed to load folder permissions')
    }
  }

  const handleAddFolderMember = async (userId: number, permissions: any) => {
    if (!selectedFolderForPermissions) return
    
    try {
      console.log('Adding folder member:', {
        folderId: selectedFolderForPermissions.id,
        userId: userId,
        permissions: permissions
      })
      
      const { supabaseDb } = await import('@/lib/supabase')
      const result = await supabaseDb.addContentCalendarFolderMember(selectedFolderForPermissions.id, userId, permissions)
      
      console.log('Add folder member result:', result)
      
      if (result.error) {
        console.error('Database error adding folder member:', result.error)
        setError(`Failed to add folder member: ${String(result.error)}`)
        return
      }
      
      // Refresh folder members
      const { data: members } = await supabaseDb.getContentCalendarFolderMembers(selectedFolderForPermissions.id)
      setFolderMembers(members || [])
      
      // Refresh the main folder list to update visibility
      await fetchData()
      
      console.log('Folder member added successfully')
    } catch (err) {
      console.error('Error adding folder member:', err)
      setError('Failed to add folder member')
    }
  }

  const handleRemoveFolderMember = async (membershipId: number) => {
    console.log('Attempting to remove folder member with ID:', membershipId)
    
    if (!confirm('Remove this member from the folder?')) {
      console.log('User cancelled member removal')
      return
    }
    
    try {
      console.log('Removing folder member...')
      const { supabaseDb } = await import('@/lib/supabase')
      const result = await supabaseDb.removeContentCalendarFolderMember(membershipId)
      
      console.log('Remove folder member result:', result)
      
      if (result.error) {
        console.error('Database error removing folder member:', result.error)
        setError(`Failed to remove folder member: ${String(result.error)}`)
        return
      }
      
      console.log('Member removed successfully, refreshing folder members...')
      
      // Refresh folder members
      if (selectedFolderForPermissions) {
        const { data: members } = await supabaseDb.getContentCalendarFolderMembers(selectedFolderForPermissions.id)
        setFolderMembers(members || [])
        console.log('Folder members refreshed:', members?.length || 0, 'members')
        
        // Also refresh the main folder list to update visibility
        await fetchData()
      }
    } catch (err) {
      console.error('Error removing folder member:', err)
      setError('Failed to remove folder member')
    }
  }

  // File Permission Management
  const handleManageFilePermissions = (item: ContentCalendarItem) => {
    setSelectedFileForPermissions(item)
    setShowFilePermissions(true)
  }

  const updateFilePermissions = async (itemId: number, securityLevel: string, allowedUsers: number[]) => {
    try {
      const { supabaseDb } = await import('@/lib/supabase')
      
      // Try to update with security columns, but handle gracefully if they don't exist
      const updateData: any = {}
      
      // Only add security fields if we're not getting column errors
      try {
        updateData.security_level = securityLevel
        updateData.allowed_users = allowedUsers
        
        await supabaseDb.updateContentCalendarItem(itemId, updateData)
        await fetchData()
        setShowFilePermissions(false)
      } catch (columnError: any) {
        if (columnError.message?.includes('allowed_users') || columnError.message?.includes('security_level')) {
          setError('Security columns not yet added to database. Please run the database migration first.')
          console.error('Database schema needs updating. Run add_content_calendar_security_columns.sql')
        } else {
          throw columnError
        }
      }
    } catch (err) {
      console.error('Error updating file permissions:', err)
      setError('Failed to update file permissions')
    }
  }

  // Check if user can access folder
  const canAccessFolder = async (folder: any) => {
    if (!folder) return true
    if (userRole === 'admin' || userRole === 'manager') return true
    if (folder.created_by_id === user?.id) return true
    
    // Check if user is a member of this folder by querying the database
    try {
      const supabase = (await import('@/lib/supabase')).supabase
      const { data: membership, error } = await supabase
        .from('content_calendar_folder_members')
        .select('id')
        .eq('folder_id', folder.id)
        .eq('user_id', user?.id)
        .limit(1)
      
      return !error && membership && membership.length > 0
    } catch (err) {
      console.error('Error checking folder access:', err)
      return false
    }
  }

  // Check if user can access file
  const canAccessFile = (item: ContentCalendarItem) => {
    // Debug logging for file access
    const itemId = item.id || 'new'
    const itemTitle = item.content_title || 'untitled'
    
    console.log(`Checking access for item ${itemId} (${itemTitle}):`, {
      userRole,
      userId: user?.id,
      itemCreatedBy: item.created_by?.id,
      securityLevel: item.security_level,
      allowedUsers: item.allowed_users
    })
    
    // Admin can access everything
    if (userRole === 'admin') {
      console.log(`Access granted to ${itemId}: user is admin`)
      return true
    }
    
    // Creator can access their own content
    if (item.created_by?.id === user?.id) {
      console.log(`Access granted to ${itemId}: user is creator`)
      return true
    }
    
    // If no security level is set (new items or missing column), allow access
    if (!item.security_level || item.security_level === 'public') {
      console.log(`Access granted to ${itemId}: public or no security level`)
      return true
    }
    
    switch (item.security_level) {
      case 'restricted':
        const hasRestrictedAccess = item.allowed_users?.includes(user?.id || 0) || false
        console.log(`Access ${hasRestrictedAccess ? 'granted' : 'denied'} to ${itemId}: restricted level, user in allowed list: ${hasRestrictedAccess}`)
        return hasRestrictedAccess
      case 'confidential':
        const hasConfidentialAccess = ['admin', 'manager'].includes(userRole)
        console.log(`Access ${hasConfidentialAccess ? 'granted' : 'denied'} to ${itemId}: confidential level, user role sufficient: ${hasConfidentialAccess}`)
        return hasConfidentialAccess
      case 'secret':
        const hasSecretAccess = userRole === 'admin'
        console.log(`Access ${hasSecretAccess ? 'granted' : 'denied'} to ${itemId}: secret level, user is admin: ${hasSecretAccess}`)
        return hasSecretAccess
      default:
        console.log(`Access granted to ${itemId}: unknown security level, defaulting to allow`)
        return true
    }
  }

  // Get assignable users for current folder
  const getAssignableUsers = async () => {
    console.log('getAssignableUsers called, currentFolder:', currentFolder?.name || 'No folder')
    
    if (!currentFolder) {
      // If no folder selected, show all content calendar members
      console.log('No current folder, returning all members:', members.map(m => m.user?.name || 'Unknown'))
      return members
    }
    
    try {
      console.log('Getting folder members for folder ID:', currentFolder.id)
      const { supabaseDb } = await import('@/lib/supabase')
      const { data: folderMembersData, error } = await supabaseDb.getContentCalendarFolderMembers(currentFolder.id)
      
      console.log('Folder members data:', folderMembersData)
      console.log('Folder members error:', error)
      
      // Transform folder members to match the expected format
      const folderMembers = (folderMembersData || []).map((member: any) => ({
        user_id: member.user_id,
        role: member.role,
        user: member.auth_user || {
          id: member.user_id,
          name: 'Unknown User',
          email: '',
          role: 'member'
        }
      }))
      
      // Also include the folder creator if not already in members
      if (currentFolder.created_by_id && !folderMembers.some((m: any) => m.user_id === currentFolder.created_by_id)) {
        const creator = allUsers.find(u => u.id === currentFolder.created_by_id)
        if (creator) {
          console.log('Adding folder creator to assignable users:', creator.name)
          folderMembers.push({
            user_id: creator.id,
            role: 'creator',
            user: creator
          })
        }
      }
      
      console.log('Final assignable users for folder:', folderMembers.map((m: any) => m.user.name))
      return folderMembers
    } catch (err) {
      console.error('Error getting assignable users:', err)
      // Fallback to general members
      console.log('Fallback: returning all members due to error')
      return members
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
      folder_id: currentFolder?.id || null,
      security_level: 'public',
      allowed_users: []
    })
    setEditingItem(null)
    setShowAddForm(false)
  }

  const startEdit = async (item: ContentCalendarItem) => {
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
      folder_id: item.folder_id || null,
      security_level: item.security_level || 'public',
      allowed_users: item.allowed_users || []
    })
    setEditingItem(item)
    
    // Update assignable users for the item's folder
    if (item.folder_id) {
      const folder = folders.find(f => f.id === item.folder_id)
      if (folder) {
        setCurrentFolder(folder)
        const users = await getAssignableUsers()
        setAssignableUsers(users)
      }
    } else {
      setAssignableUsers(members)
    }
    
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


  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, item: ContentCalendarItem) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', (e.currentTarget as HTMLElement).outerHTML)
    
    // Add visual feedback
    ;(e.currentTarget as HTMLElement).style.opacity = '0.5'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
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
      {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Mobile Responsive Styles */
          @media (max-width: 768px) {
            .content-calendar-container {
              display: block !important;
              width: 100vw !important;
              max-width: 100vw !important;
              overflow-x: hidden;
              margin: 0;
              padding: 0;
            }
            
            .content-calendar-main {
              margin-left: 0 !important;
              width: 100vw !important;
              max-width: 100vw !important;
              padding: 1rem !important;
              padding-top: 80px !important;
              overflow-x: hidden;
              box-sizing: border-box;
            }
            
            .content-calendar-header {
              flex-direction: column !important;
              gap: 1rem !important;
              align-items: stretch !important;
              margin-bottom: 2rem !important;
              padding-bottom: 1rem !important;
            }
            
            .content-calendar-title {
              font-size: 1.75rem !important;
              text-align: center !important;
            }
            
            .content-calendar-subtitle {
              font-size: 0.9rem !important;
              text-align: center !important;
            }
            
            .content-calendar-actions {
              flex-direction: column !important;
              gap: 0.75rem !important;
              width: 100% !important;
            }
            
            .content-calendar-actions button {
              width: 100% !important;
              justify-content: center !important;
              padding: 0.875rem !important;
              font-size: 0.9rem !important;
            }
            
            .folder-grid {
              grid-template-columns: 1fr !important;
              gap: 1rem !important;
            }
            
            .content-table {
              overflow-x: auto !important;
              -webkit-overflow-scrolling: touch !important;
            }
            
            .content-table-header {
              display: none !important;
            }
            
            .content-item-row {
              display: block !important;
              background: #ffffff !important;
              border-radius: 12px !important;
              padding: 1.5rem !important;
              margin-bottom: 1rem !important;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
              border: 1px solid #e5e7eb !important;
            }
            
            .content-field {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              padding: 0.5rem 0 !important;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
            }
            
            .content-field:last-child {
              border-bottom: none !important;
            }
            
            .content-field-label {
              font-weight: 600 !important;
              color: #374151 !important;
              font-size: 0.8rem !important;
              min-width: 80px !important;
            }
            
            .content-field-value {
              font-size: 0.85rem !important;
              color: #6b7280 !important;
              text-align: right !important;
              flex: 1 !important;
            }
            
            .mobile-actions {
              display: flex !important;
              gap: 0.5rem !important;
              justify-content: center !important;
              margin-top: 1rem !important;
            }
            
            .mobile-actions button {
              flex: 1 !important;
              padding: 0.75rem !important;
              font-size: 0.8rem !important;
            }
          }
          
          @media (max-width: 480px) {
            .content-calendar-main {
              padding: 0.75rem !important;
            }
            
            .content-calendar-title {
              font-size: 1.5rem !important;
            }
            
            .content-calendar-subtitle {
              font-size: 0.8rem !important;
            }
            
            .content-item-row {
              padding: 1rem !important;
            }
            
            .content-calendar-actions button {
              padding: 0.75rem !important;
              font-size: 0.8rem !important;
            }
          }
        `
      }} />
      
      <div className="content-calendar-container" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        
        <div className="content-calendar-main" style={{ 
          marginLeft: isMobile ? '0' : '256px',
          padding: isMobile ? '12px' : '2rem', 
          paddingTop: isMobile ? '80px' : '2rem',
          background: 'transparent', 
          flex: 1,
          minHeight: '100vh'
        }}>
          {/* Header */}
          <div className="content-calendar-header" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '3rem',
            paddingBottom: '1.5rem'
          }}>
            <div>
              <h1 className="content-calendar-title" style={{ 
                fontSize: '2.5rem', 
                fontWeight: '300', 
                margin: '0', 
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Content Calendar v2.1
              </h1>
              <p className="content-calendar-subtitle" style={{ fontSize: '1.1rem', color: '#666666', margin: '0.5rem 0 0 0', lineHeight: '1.5' }}>
                Manage your social media content planning and scheduling
              </p>
            </div>
            
            <div className="content-calendar-actions" style={{ display: 'flex', gap: '0.75rem' }}>
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
                  onClick={async () => {
                    setFormData({
                      ...formData,
                      folder_id: currentFolder?.id || null
                    })
                    
                    // Update assignable users for current folder
                    const users = await getAssignableUsers()
                    setAssignableUsers(users)
                    
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
            {/* Breadcrumb Navigation with View Tabs */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
              color: '#666666'
            }}>
              {/* Left side - Breadcrumb */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem'
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
            </div>

            {/* Current Folder Contents with View Tabs */}
            <div style={{ 
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: '500',
                margin: 0,
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

              {/* View tabs removed from here - moved above content */}
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              
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
                      style={{
                        padding: '1.5rem',
                        background: '#ffffff',
                        border: '1px solid #e8e8e8',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        position: 'relative'
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
                      <div 
                        onClick={() => enterFolder(folder)}
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flex: 1,
                          cursor: 'pointer'
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
                      
                      {/* Folder Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManageFolderPermissions(folder);
                          }}
                          style={{
                            background: '#f3f4f6',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#e5e7eb';
                            e.currentTarget.style.borderColor = '#9ca3af';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }}
                          title="Manage Folder Permissions"
                        >
                          <UserGroupIcon style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>

          {/* View Toggle Buttons - Show when inside a folder */}
          {currentFolder && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>
                {currentFolder.name}
              </h3>
              
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                background: '#f9fafb',
                padding: '0.25rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <button
                  onClick={() => setCurrentView('sheet')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: currentView === 'sheet' ? '#1a1a1a' : 'transparent',
                    color: currentView === 'sheet' ? '#ffffff' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Sheet View
                </button>
                <button
                  onClick={() => setCurrentView('calendar')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    background: currentView === 'calendar' ? '#1a1a1a' : 'transparent',
                    color: currentView === 'calendar' ? '#ffffff' : '#6b7280',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Calendar View
                </button>
              </div>
            </div>
          )}

          {/* Content Table - Only show when inside a folder and in sheet view */}
          {currentFolder && currentView === 'sheet' && (
            <div className="content-table" style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '16px',
              overflow: 'auto',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)',
              maxHeight: '70vh'
            }}>
              {/* Sticky Header */}
              <div className="content-table-header" style={{
                display: 'grid',
                gridTemplateColumns: '140px 120px 130px 130px 1fr 140px 140px 140px 120px 100px 120px',
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
                <div 
                  onClick={() => handleSort('security_level')}
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
                  SECURITY
                  {renderSortIcon('security_level')}
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
                    className={isMobile ? "content-item-mobile" : "content-item-row"}
                    draggable={!isMobile}
                    onDragStart={!isMobile ? (e) => handleDragStart(e, item) : undefined}
                    onDragEnd={!isMobile ? handleDragEnd : undefined}
                    onDragOver={!isMobile ? (e) => handleDragOver(e, index) : undefined}
                    onDragLeave={!isMobile ? handleDragLeave : undefined}
                    onDrop={!isMobile ? (e) => handleDrop(e, index) : undefined}
                    style={{
                      display: isMobile ? 'block' : 'grid',
                      gridTemplateColumns: isMobile ? 'none' : '140px 120px 130px 130px 1fr 140px 140px 140px 120px 100px 120px',
                      gap: '0',
                      borderBottom: '1px solid #f0f0f0',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s ease',
                      cursor: isMobile ? 'default' : 'grab',
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
                    {isMobile ? (
                      /* Mobile Card Layout */
                      <div className="content-item-mobile">
                        <div className="content-field">
                          <span className="content-field-label">Date:</span>
                          <span className="content-field-value">{formatDate(item.date)}</span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Type:</span>
                          <span className="content-field-value">{item.content_type}</span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Category:</span>
                          <span className="content-field-value">{item.category}</span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Platform:</span>
                          <span className="content-field-value">{item.social_media}</span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Title:</span>
                          <span className="content-field-value">{item.content_title}</span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Assigned:</span>
                          <span className="content-field-value">
                            {item.assignees?.map(a => a.name).join(', ') || 'Unassigned'}
                          </span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Status:</span>
                          <span className="content-field-value">
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: item.status === 'completed' ? '#10B981' : item.status === 'in_progress' ? '#5884FD' : item.status === 'review' ? '#FFB333' : '#C483D9',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}>
                              {getStatusLabel(item.status)}
                            </span>
                          </span>
                        </div>
                        <div className="content-field">
                          <span className="content-field-label">Security:</span>
                          <span className="content-field-value">
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              background: SECURITY_LEVELS.find(l => l.value === (item.security_level || 'public'))?.color || '#10b981',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}>
                              {SECURITY_LEVELS.find(l => l.value === (item.security_level || 'public'))?.label || 'Public'}
                            </span>
                          </span>
                        </div>
                        
                        <div className="mobile-actions">
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              padding: '0.75rem',
                              background: '#5884FD',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            style={{
                              padding: '0.75rem',
                              background: '#F87239',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => handleManageFilePermissions(item)}
                            style={{
                              padding: '0.75rem',
                              background: '#6b7280',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '500'
                            }}
                          >
                            Security
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Desktop Grid Layout */
                      <>
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

                    {/* Security Level */}
                    <div 
                      onDoubleClick={() => handleCellDoubleClick(item.id, 'security_level', item.security_level)}
                      style={{ 
                        padding: '1rem', 
                        borderRight: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {editingCell?.itemId === item.id && editingCell?.field === 'security_level' ? (
                        <select
                          value={cellValues[`${item.id}-security_level`] || item.security_level || 'public'}
                          onChange={(e) => setCellValues({ ...cellValues, [`${item.id}-security_level`]: e.target.value })}
                          onKeyDown={(e) => handleCellKeyDown(e, item.id, 'security_level')}
                          onBlur={() => handleCellEdit(item.id, 'security_level', cellValues[`${item.id}-security_level`])}
                          autoFocus
                          style={{
                            width: '100%',
                            border: '1px solid #5884FD',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.85rem'
                          }}
                        >
                          {SECURITY_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>{level.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            background: SECURITY_LEVELS.find(l => l.value === (item.security_level || 'public'))?.color || '#10b981',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            {SECURITY_LEVELS.find(l => l.value === (item.security_level || 'public'))?.label || 'Public'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleManageFilePermissions(item);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Manage File Permissions"
                          >
                            <UserGroupIcon style={{ width: '14px', height: '14px', color: '#6b7280' }} />
                          </button>
                        </div>
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
                    </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Calendar View - Show when in calendar view mode */}
          {currentView === 'calendar' && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e8e8e8',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 2px 16px rgba(0, 0, 0, 0.04)'
            }}>
              {/* Calendar Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: '1px solid #e8e8e8',
                background: '#f8f9fa'
              }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1a1a1a' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} {currentFolder ? `- ${currentFolder.name}` : ''}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        folder_id: currentFolder?.id || null,
                        date: new Date().toISOString().split('T')[0]
                      });
                      setShowAddForm(true);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#5884FD',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <PlusIcon style={{ width: '16px', height: '16px' }} />
                    Add Content
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '1px',
                background: '#e8e8e8'
              }}>
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} style={{
                    padding: '1rem',
                    background: '#f8f9fa',
                    textAlign: 'center',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    color: '#666666'
                  }}>
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  const current = new Date(startDate);
                  
                  for (let i = 0; i < 42; i++) {
                    days.push(new Date(current));
                    current.setDate(current.getDate() + 1);
                  }
                  
                  return days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === month;
                    const isToday = day.toDateString() === new Date().toDateString();
                    // Filter items by date and current folder (if any)
                    const dayItems = filteredItems.filter(item => {
                      const matchesDate = new Date(item.date).toDateString() === day.toDateString();
                      const matchesFolder = currentFolder ? item.folder_id === currentFolder.id : true;
                      return matchesDate && matchesFolder;
                    });

                    return (
                      <div
                        key={index}
                        style={{
                          background: '#ffffff',
                          minHeight: '120px',
                          padding: '0.5rem',
                          opacity: isCurrentMonth ? 1 : 0.3,
                          border: isToday ? '2px solid #5884FD' : 'none',
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            folder_id: currentFolder?.id || null,
                            date: day.toISOString().split('T')[0]
                          });
                          setShowAddForm(true);
                        }}
                      >
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: isToday ? '600' : '400',
                          color: isToday ? '#5884FD' : isCurrentMonth ? '#1a1a1a' : '#999999',
                          marginBottom: '0.5rem'
                        }}>
                          {day.getDate()}
                        </div>

                        {/* Content Items for this day */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {dayItems.slice(0, 3).map(item => (
                            <div
                              key={item.id}
                              style={{
                                background: (() => {
                                  switch (item.status) {
                                    case 'planning': return '#6B7280';
                                    case 'in_progress': return '#F59E0B';
                                    case 'review': return '#8B5CF6';
                                    case 'completed': return '#10B981';
                                    default: return '#6B7280';
                                  }
                                })(),
                                color: '#ffffff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: '500',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                startEdit(item);
                              }}
                              title={`${item.content_title} - ${item.content_type} (${item.status})`}
                            >
                              {item.content_title}
                            </div>
                          ))}
                          {dayItems.length > 3 && (
                            <div style={{
                              fontSize: '0.6rem',
                              color: '#666666',
                              textAlign: 'center',
                              marginTop: '2px'
                            }}>
                              +{dayItems.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
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
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>Security Level</label>
                        <select
                          value={formData.security_level}
                          onChange={(e) => setFormData({ ...formData, security_level: e.target.value as any })}
                          style={{
                            width: '100%',
                            padding: '0.9rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            backgroundColor: '#fafafa'
                          }}
                        >
                          {SECURITY_LEVELS.map(level => (
                            <option key={level.value} value={level.value}>
                              {level.label} - {level.description}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '2rem' }}>
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
                      <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151', letterSpacing: '-0.01em' }}>
                        Assign To {currentFolder ? `(${currentFolder.name} members only)` : '(All members)'}
                      </label>
                      <div style={{ 
                        border: '2px solid #e5e7eb', 
                        borderRadius: '8px', 
                        padding: '1rem',
                        maxHeight: '140px',
                        overflow: 'auto',
                        backgroundColor: '#fafafa'
                      }}>
                        {(assignableUsers || []).map(member => (
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

      {/* Folder Permissions Modal */}
      {showFolderPermissions && selectedFolderForPermissions && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 0.5rem 0'
              }}>
                Manage Folder Permissions
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '1rem'
              }}>
                Control who can access "{selectedFolderForPermissions.name}" folder
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              {/* Add Member Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Add Member
                </h4>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500', color: '#374151' }}>
                      Select User
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                      }}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddFolderMember(parseInt(e.target.value), {
                            role: 'viewer',
                            can_create: false,
                            can_edit: false,
                            can_delete: false,
                            can_manage_members: false
                          });
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">Select a user...</option>
                      {allUsers.filter(u => !folderMembers.some(m => m.user_id === u.id)).map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Current Members */}
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#374151' }}>
                  Current Members ({folderMembers.length})
                </h4>
                {folderMembers.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No members assigned to this folder</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {folderMembers.map(member => (
                      <div key={member.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        background: '#f9fafb'
                      }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>
                            {member.auth_user?.name || 'Unknown User'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {member.auth_user?.email || ''}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#374151', marginTop: '0.25rem' }}>
                            Role: {member.role} | 
                            Create: {member.can_create ? '✓' : '✗'} | 
                            Edit: {member.can_edit ? '✓' : '✗'} | 
                            Delete: {member.can_delete ? '✓' : '✗'}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveFolderMember(member.id)}
                          style={{
                            padding: '0.5rem',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowFolderPermissions(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Permissions Modal */}
      {showFilePermissions && selectedFileForPermissions && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 0.5rem 0'
              }}>
                File Security Settings
              </h3>
              <p style={{
                color: '#6b7280',
                margin: 0,
                fontSize: '1rem'
              }}>
                "{selectedFileForPermissions.content_title}"
              </p>
            </div>

            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem', fontWeight: '600', fontSize: '1rem', color: '#374151' }}>
                  Security Level
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {SECURITY_LEVELS.map(level => (
                    <div key={level.value} style={{
                      padding: '1rem',
                      border: `2px solid ${selectedFileForPermissions.security_level === level.value ? level.color : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedFileForPermissions.security_level === level.value ? `${level.color}10` : '#ffffff'
                    }}
                    onClick={() => {
                      updateFilePermissions(selectedFileForPermissions.id, level.value, selectedFileForPermissions.allowed_users || []);
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: level.color, fontSize: '1rem' }}>
                            {level.label}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            {level.description}
                          </div>
                        </div>
                        {selectedFileForPermissions.security_level === level.value && (
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: level.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '0.8rem'
                          }}>
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: '2rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowFilePermissions(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6b7280',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
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