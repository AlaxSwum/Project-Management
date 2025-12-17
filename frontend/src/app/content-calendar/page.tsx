'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import {
  CalendarIcon,
  ListBulletIcon,
  ChartBarIcon,
  PlusIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BuildingOfficeIcon,
  FolderIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

// Types
interface ContentItem {
  id: number
  date: string
  content_type: string
  category: string
  social_media: string
  content_title: string
  status: string
  description?: string
  folder_id?: number | null
  created_at: string
}

interface Folder {
  id: number
  name: string
  parent_id: number | null
  created_at: string
}

const CONTENT_TYPES = ['Article', 'Video', 'Image', 'Infographic', 'Story', 'Reel', 'Post']
const CATEGORIES = ['Marketing', 'Educational', 'Promotional', 'Entertainment', 'News', 'Tutorial']
const SOCIAL_MEDIA = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest']
const STATUSES = ['planning', 'in_progress', 'review', 'completed']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planning: { bg: '#F3F4F6', text: '#6B7280' },
  in_progress: { bg: '#DBEAFE', text: '#3B82F6' },
  review: { bg: '#FEF3C7', text: '#F59E0B' },
  completed: { bg: '#D1FAE5', text: '#10B981' }
}

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // View mode
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Data
  const [items, setItems] = useState<ContentItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  
  // Form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    content_type: 'Post',
    category: 'Marketing',
    social_media: 'Facebook',
    content_title: '',
    status: 'planning',
    description: ''
  })

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // Fetch content items
      const { data: itemsData, error: itemsError } = await supabase
        .from('content_calendar')
        .select('*')
        .order('date', { ascending: true })
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])
      
      // Fetch folders
      const { data: foldersData, error: foldersError } = await supabase
        .from('content_calendar_folders')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (!foldersError) {
        setFolders(foldersData || [])
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load content')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) {
      fetchData()
    }
  }, [user?.id, fetchData])

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.content_title.trim()) {
      alert('Please enter a title')
      return
    }
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('content_calendar')
          .update({
            ...formData,
            folder_id: selectedFolder
          })
          .eq('id', editingItem.id)
        
        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('content_calendar')
          .insert({
            ...formData,
            folder_id: selectedFolder,
            created_by: user?.id
          })
        
        if (error) throw error
      }
      
      setShowAddForm(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } catch (err: any) {
      console.error('Error saving:', err)
      alert('Failed to save: ' + err.message)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('content_calendar')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      fetchData()
    } catch (err: any) {
      console.error('Error deleting:', err)
      alert('Failed to delete: ' + err.message)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      content_type: 'Post',
      category: 'Marketing',
      social_media: 'Facebook',
      content_title: '',
      status: 'planning',
      description: ''
    })
  }

  // Edit item
  const handleEdit = (item: ContentItem) => {
    setEditingItem(item)
    setFormData({
      date: item.date,
      content_type: item.content_type,
      category: item.category,
      social_media: item.social_media,
      content_title: item.content_title,
      status: item.status,
      description: item.description || ''
    })
    setShowAddForm(true)
  }

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  // Calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []

    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false, isToday: false })
    }

    const today = new Date()
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const isToday = date.toDateString() === today.toDateString()
      days.push({ date, isCurrentMonth: true, isToday })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, isToday: false })
    }

    return days
  }, [currentMonth])

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {}
    items.forEach(item => {
      const dateKey = new Date(item.date).toDateString()
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(item)
    })
    return map
  }, [items])

  // Filter items by folder
  const filteredItems = useMemo(() => {
    if (selectedFolder === null) return items
    return items.filter(item => item.folder_id === selectedFolder)
  }, [items, selectedFolder])

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="flex min-h-screen" style={{ background: '#F5F5ED' }}>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main className="flex-1 flex flex-col" style={{ marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Content Calendar</h1>
              
              {/* Folder selector */}
              <select
                value={selectedFolder || ''}
                onChange={(e) => setSelectedFolder(e.target.value ? Number(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Folders</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'}`}
              >
                <ListBulletIcon className="w-4 h-4" />
                List
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                resetForm()
                setEditingItem(null)
                setShowAddForm(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Content
            </button>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          ) : viewMode === 'calendar' ? (
            /* Calendar View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Calendar header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={goToToday} className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Today</button>
                  <button onClick={goToPreviousMonth} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button onClick={goToNextMonth} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dayItems = itemsByDate[day.date.toDateString()] || []
                  const filteredDayItems = selectedFolder === null 
                    ? dayItems 
                    : dayItems.filter(i => i.folder_id === selectedFolder)

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, date: day.date.toISOString().split('T')[0] }))
                        setEditingItem(null)
                        setShowAddForm(true)
                      }}
                      className={`min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${!day.isCurrentMonth ? 'bg-gray-50/50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${day.isToday ? 'w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                        {day.date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {filteredDayItems.slice(0, 3).map(item => (
                          <div
                            key={item.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(item)
                            }}
                            className="text-xs p-1 rounded truncate cursor-pointer"
                            style={{ 
                              backgroundColor: STATUS_COLORS[item.status]?.bg || '#F3F4F6',
                              color: STATUS_COLORS[item.status]?.text || '#6B7280'
                            }}
                          >
                            {item.content_title}
                          </div>
                        ))}
                        {filteredDayItems.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{filteredDayItems.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center">
                  <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
                  <p className="text-gray-500">Create your first content item to get started</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.content_title}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.content_type}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{item.social_media}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: STATUS_COLORS[item.status]?.bg,
                              color: STATUS_COLORS[item.status]?.text
                            }}
                          >
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEdit(item)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? 'Edit Content' : 'Add Content'}
              </h3>
              <button 
                onClick={() => {
                  setShowAddForm(false)
                  setEditingItem(null)
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.content_title}
                  onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                  placeholder="Enter content title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                  <select
                    value={formData.content_type}
                    onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {CONTENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={formData.social_media}
                    onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {SOCIAL_MEDIA.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingItem(null)
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
