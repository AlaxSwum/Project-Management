'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'

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

// Inline styles
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#F5F5ED',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  } as React.CSSProperties,
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden'
  } as React.CSSProperties,
  header: {
    background: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px'
  } as React.CSSProperties,
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '16px'
  } as React.CSSProperties,
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    margin: 0
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: '#ffffff',
    cursor: 'pointer',
    minWidth: '150px'
  } as React.CSSProperties,
  buttonGroup: {
    display: 'flex',
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px'
  } as React.CSSProperties,
  toggleBtn: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#ffffff' : 'transparent',
    color: active ? '#111827' : '#6b7280',
    boxShadow: active ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
  }) as React.CSSProperties,
  primaryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    background: '#4f46e5',
    color: '#ffffff',
    transition: 'background 0.2s'
  } as React.CSSProperties,
  content: {
    flex: 1,
    padding: '24px',
    overflow: 'auto'
  } as React.CSSProperties,
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  } as React.CSSProperties,
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    borderBottom: '1px solid #e5e7eb'
  } as React.CSSProperties,
  monthTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0
  } as React.CSSProperties,
  navBtn: {
    padding: '6px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#ffffff',
    cursor: 'pointer',
    color: '#374151'
  } as React.CSSProperties,
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid #e5e7eb'
  } as React.CSSProperties,
  weekday: {
    padding: '8px',
    textAlign: 'center' as const,
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7280'
  } as React.CSSProperties,
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)'
  } as React.CSSProperties,
  dayCell: (isCurrentMonth: boolean) => ({
    minHeight: '100px',
    padding: '8px',
    borderBottom: '1px solid #f3f4f6',
    borderRight: '1px solid #f3f4f6',
    cursor: 'pointer',
    background: isCurrentMonth ? '#ffffff' : '#f9fafb',
    transition: 'background 0.15s'
  }) as React.CSSProperties,
  dayNumber: (isToday: boolean, isCurrentMonth: boolean) => ({
    display: isToday ? 'flex' : 'block',
    alignItems: 'center',
    justifyContent: 'center',
    width: isToday ? '28px' : 'auto',
    height: isToday ? '28px' : 'auto',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '4px',
    borderRadius: '50%',
    background: isToday ? '#4f46e5' : 'transparent',
    color: isToday ? '#ffffff' : isCurrentMonth ? '#111827' : '#9ca3af'
  }) as React.CSSProperties,
  eventItem: (status: string) => ({
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    background: STATUS_COLORS[status]?.bg || '#f3f4f6',
    color: STATUS_COLORS[status]?.text || '#6b7280'
  }) as React.CSSProperties,
  modal: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)'
  } as React.CSSProperties,
  modalContent: {
    background: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    padding: '24px'
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  } as React.CSSProperties,
  modalTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#111827',
    margin: 0
  } as React.CSSProperties,
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#9ca3af',
    fontSize: '24px',
    lineHeight: 1
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '16px'
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px'
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const
  } as React.CSSProperties,
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none' as const,
    boxSizing: 'border-box' as const
  } as React.CSSProperties,
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px'
  } as React.CSSProperties,
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  } as React.CSSProperties,
  cancelBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    background: '#ffffff',
    color: '#374151',
    cursor: 'pointer'
  } as React.CSSProperties,
  submitBtn: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '8px',
    background: '#4f46e5',
    color: '#ffffff',
    cursor: 'pointer'
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  } as React.CSSProperties,
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  } as React.CSSProperties,
  th: {
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    color: '#6b7280',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  } as React.CSSProperties,
  td: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#111827',
    borderBottom: '1px solid #f3f4f6'
  } as React.CSSProperties,
  statusBadge: (status: string) => ({
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    borderRadius: '20px',
    background: STATUS_COLORS[status]?.bg || '#f3f4f6',
    color: STATUS_COLORS[status]?.text || '#6b7280'
  }) as React.CSSProperties,
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: '#9ca3af',
    marginRight: '8px'
  } as React.CSSProperties,
  emptyState: {
    padding: '60px 24px',
    textAlign: 'center' as const
  } as React.CSSProperties
}

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [items, setItems] = useState<ContentItem[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  const fetchData = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('content_calendar')
        .select('*')
        .order('date', { ascending: true })
      
      if (itemsError) throw itemsError
      setItems(itemsData || [])
      
      const { data: foldersData } = await supabase
        .from('content_calendar_folders')
        .select('id, name, parent_id')
        .eq('is_active', true)
        .order('name')
      
      setFolders(foldersData || [])
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user?.id) fetchData()
  }, [user?.id, fetchData])

  const handleSubmit = async () => {
    if (!formData.content_title.trim()) {
      alert('Please enter a title')
      return
    }
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingItem) {
        await supabase
          .from('content_calendar')
          .update({ ...formData, folder_id: selectedFolder })
          .eq('id', editingItem.id)
      } else {
        await supabase
          .from('content_calendar')
          .insert({ ...formData, folder_id: selectedFolder, created_by: user?.id })
      }
      
      setShowModal(false)
      setEditingItem(null)
      resetForm()
      fetchData()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_calendar').delete().eq('id', id)
      fetchData()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

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
    setShowModal(true)
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
    const today = new Date()

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month, -i), isCurrentMonth: false, isToday: false })
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true, isToday: date.toDateString() === today.toDateString() })
    }

    while (days.length < 42) {
      days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1), isCurrentMonth: false, isToday: false })
    }

    return days
  }, [currentMonth])

  const itemsByDate = useMemo(() => {
    const map: Record<string, ContentItem[]> = {}
    items.forEach(item => {
      const key = new Date(item.date).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(item)
    })
    return map
  }, [items])

  const filteredItems = useMemo(() => {
    return selectedFolder === null ? items : items.filter(i => i.folder_id === selectedFolder)
  }, [items, selectedFolder])

  if (authLoading) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.spinner} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={styles.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ ...styles.main, marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        <header style={styles.header}>
          <div style={styles.headerContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 style={styles.title}>Content Calendar</h1>
              <select
                value={selectedFolder || ''}
                onChange={(e) => setSelectedFolder(e.target.value ? Number(e.target.value) : null)}
                style={styles.select}
              >
                <option value="">All Folders</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div style={styles.buttonGroup}>
              <button
                onClick={() => setViewMode('calendar')}
                style={styles.toggleBtn(viewMode === 'calendar')}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={styles.toggleBtn(viewMode === 'list')}
              >
                List
              </button>
            </div>

            <button
              onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
              style={styles.primaryBtn}
              onMouseOver={(e) => e.currentTarget.style.background = '#4338ca'}
              onMouseOut={(e) => e.currentTarget.style.background = '#4f46e5'}
            >
              + Add Content
            </button>
          </div>
        </header>

        <div style={styles.content}>
          {isLoading ? (
            <div style={styles.loading}>
              <div style={styles.spinner} />
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626' }}>
              {error}
            </div>
          ) : viewMode === 'calendar' ? (
            <div style={styles.card}>
              <div style={styles.calendarHeader}>
                <h2 style={styles.monthTitle}>{monthName}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setCurrentMonth(new Date())} style={styles.navBtn}>Today</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={styles.navBtn}>◀</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={styles.navBtn}>▶</button>
                </div>
              </div>

              <div style={styles.weekdayRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={styles.weekday}>{d}</div>
                ))}
              </div>

              <div style={styles.calendarGrid}>
                {calendarDays.map((day, idx) => {
                  const dayItems = itemsByDate[day.date.toDateString()] || []
                  const filtered = selectedFolder === null ? dayItems : dayItems.filter(i => i.folder_id === selectedFolder)

                  return (
                    <div
                      key={idx}
                      style={styles.dayCell(day.isCurrentMonth)}
                      onClick={() => {
                        setFormData(p => ({ ...p, date: day.date.toISOString().split('T')[0] }))
                        setEditingItem(null)
                        setShowModal(true)
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseOut={(e) => e.currentTarget.style.background = day.isCurrentMonth ? '#ffffff' : '#f9fafb'}
                    >
                      <div style={styles.dayNumber(day.isToday, day.isCurrentMonth)}>
                        {day.date.getDate()}
                      </div>
                      {filtered.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          style={styles.eventItem(item.status)}
                          onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                        >
                          {item.content_title}
                        </div>
                      ))}
                      {filtered.length > 3 && (
                        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
                          +{filtered.length - 3} more
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              {filteredItems.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', color: '#9ca3af' }}>--</div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No content yet</h3>
                  <p style={{ color: '#6b7280', margin: 0 }}>Click "Add Content" to create your first item</p>
                </div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Title</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Platform</th>
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map(item => (
                      <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => handleEdit(item)}>
                        <td style={{ ...styles.td, fontWeight: 500 }}>{item.content_title}</td>
                        <td style={styles.td}>{item.content_type}</td>
                        <td style={styles.td}>{item.social_media}</td>
                        <td style={styles.td}>{new Date(item.date).toLocaleDateString()}</td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge(item.status)}>{item.status.replace('_', ' ')}</span>
                        </td>
                        <td style={styles.td}>
                          <button style={{ ...styles.actionBtn, color: '#4f46e5' }} onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>Edit</button>
                          <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}>Delete</button>
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

      {showModal && (
        <div style={styles.modal} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingItem ? 'Edit Content' : 'Add Content'}</h3>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Title *</label>
              <input
                type="text"
                value={formData.content_title}
                onChange={(e) => setFormData({ ...formData, content_title: e.target.value })}
                placeholder="Enter title"
                style={styles.input}
              />
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  style={styles.select}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Content Type</label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                  style={styles.select}
                >
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Platform</label>
                <select
                  value={formData.social_media}
                  onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                  style={styles.select}
                >
                  {SOCIAL_MEDIA.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                style={styles.select}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
                style={styles.textarea}
              />
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleSubmit}>{editingItem ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
