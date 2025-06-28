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
  const [showAddForm, setShowAddForm] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
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
    description: ''
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

      setContentItems(itemsData || [])
      setMembers(membersData || [])
      setAllUsers(usersData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load content calendar data')
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
      description: ''
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
      description: item.description || ''
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
              You don't have permission to access the Content Calendar.
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
                Content Calendar
              </h1>
              <p style={{ fontSize: '1rem', color: '#666666', margin: '0.5rem 0 0 0' }}>
                Manage your social media content planning and scheduling
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
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
                Add Content
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              background: '#f9f9f9', 
              border: '2px solid #000000', 
              borderRadius: '6px', 
              padding: '1rem', 
              marginBottom: '2rem',
              color: '#000000',
              fontWeight: '600'
            }}>
              {error}
            </div>
          )}

          {/* Content Table */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '120px 100px 120px 120px 1fr 120px 120px 120px 100px 100px',
              gap: '0',
              background: '#f9f9f9',
              borderBottom: '2px solid #e5e7eb',
              fontWeight: '700',
              fontSize: '0.85rem',
              color: '#000000'
            }}>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>DATE</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>TYPE</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>CATEGORY</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>PLATFORM</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>TITLE</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>ASSIGNED</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>CONTENT DUE</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>GRAPHIC DUE</div>
              <div style={{ padding: '1rem 0.75rem', borderRight: '1px solid #e5e7eb' }}>STATUS</div>
              <div style={{ padding: '1rem 0.75rem' }}>ACTIONS</div>
            </div>

            {contentItems.length === 0 ? (
              <div style={{ 
                padding: '3rem', 
                textAlign: 'center', 
                color: '#666666',
                fontSize: '1.1rem'
              }}>
                No content items found. Click "Add Content" to get started.
              </div>
            ) : (
              contentItems.map((item) => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 100px 120px 120px 1fr 120px 120px 120px 100px 100px',
                  gap: '0',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {formatDate(item.date)}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.content_type}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.category}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.social_media}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.content_title}
                  </div>
                                     <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                     {item.assigned_to && item.assigned_to.length > 0 ? `${item.assigned_to.length} assigned` : 'Unassigned'}
                   </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.content_deadline ? formatDate(item.content_deadline) : '-'}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    {item.graphic_deadline ? formatDate(item.graphic_deadline) : '-'}
                  </div>
                  <div style={{ padding: '0.75rem', borderRight: '1px solid #e5e7eb' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      background: '#f9f9f9',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => startEdit(item)}
                      style={{
                        padding: '0.25rem',
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <PencilIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        padding: '0.25rem',
                        background: 'transparent',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      <TrashIcon style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

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
                  {editingItem ? 'Edit Content Item' : 'Add New Content Item'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Content Type</label>
                      <select
                        value={formData.content_type}
                        onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Select type</option>
                        {CONTENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Select category</option>
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Social Media Platform</label>
                      <select
                        value={formData.social_media}
                        onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="">Select platform</option>
                        {SOCIAL_MEDIA.map(platform => (
                          <option key={platform} value={platform}>{platform}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Content Title</label>
                    <input
                      type="text"
                      value={formData.content_title}
                      onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Content Deadline</label>
                      <input
                        type="date"
                        value={formData.content_deadline}
                        onChange={(e) => setFormData({ ...formData, content_deadline: e.target.value })}
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
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Graphic Deadline</label>
                      <input
                        type="date"
                        value={formData.graphic_deadline}
                        onChange={(e) => setFormData({ ...formData, graphic_deadline: e.target.value })}
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
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Status</label>
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

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Assign To</label>
                    <div style={{ 
                      border: '2px solid #e5e7eb', 
                      borderRadius: '6px', 
                      padding: '0.75rem',
                      maxHeight: '120px',
                      overflow: 'auto'
                    }}>
                      {(members || []).map(member => (
                        <label key={member.user_id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          cursor: 'pointer'
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
                            style={{ width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '0.9rem' }}>
                            {member.user.name} ({member.user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      onClick={resetForm}
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
                      {editingItem ? 'Update' : 'Create'}
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
        </div>
      </div>
    </>
  )
} 