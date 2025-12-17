'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'

interface Business {
  id: number
  name: string
  description: string
  created_at: string
  created_by: string
}

interface ContentPost {
  id: number
  business_id: number
  title: string
  description: string
  platform: string
  content_type: string
  status: string
  scheduled_date: string
  published_date: string | null
  reach: number
  impressions: number
  engagement: number
  clicks: number
  created_at: string
}

const PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube']
const CONTENT_TYPES = ['Post', 'Story', 'Reel', 'Video', 'Article', 'Carousel']
const STATUSES = ['draft', 'scheduled', 'published', 'archived']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  scheduled: { bg: '#DBEAFE', text: '#3B82F6' },
  published: { bg: '#D1FAE5', text: '#10B981' },
  archived: { bg: '#FEE2E2', text: '#EF4444' }
}

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [activeTab, setActiveTab] = useState<'calendar' | 'list' | 'reports'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Modals
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null)
  
  // Form data
  const [businessForm, setBusinessForm] = useState({ name: '', description: '' })
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    platform: 'Facebook',
    content_type: 'Post',
    status: 'draft',
    scheduled_date: new Date().toISOString().split('T')[0],
    reach: 0,
    impressions: 0,
    engagement: 0,
    clicks: 0
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

  // Fetch businesses
  const fetchBusinesses = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('content_businesses')
        .select('*')
        .order('name')
      
      if (error) throw error
      setBusinesses(data || [])
      
      // Auto-select first business if available
      if (data && data.length > 0 && !selectedBusiness) {
        setSelectedBusiness(data[0])
      }
    } catch (err: any) {
      console.error('Error fetching businesses:', err)
      // Table might not exist yet, that's ok
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, selectedBusiness])

  // Fetch posts for selected business
  const fetchPosts = useCallback(async () => {
    if (!selectedBusiness) {
      setPosts([])
      return
    }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('content_posts')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('scheduled_date', { ascending: true })
      
      if (error) throw error
      setPosts(data || [])
    } catch (err: any) {
      console.error('Error fetching posts:', err)
      setPosts([])
    }
  }, [selectedBusiness])

  useEffect(() => {
    if (user?.id) fetchBusinesses()
  }, [user?.id, fetchBusinesses])

  useEffect(() => {
    if (selectedBusiness) fetchPosts()
  }, [selectedBusiness, fetchPosts])

  // Create business
  const handleCreateBusiness = async () => {
    if (!businessForm.name.trim()) {
      alert('Please enter a business name')
      return
    }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('content_businesses')
        .insert({
          name: businessForm.name,
          description: businessForm.description,
          created_by: user?.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      setBusinesses(prev => [...prev, data])
      setSelectedBusiness(data)
      setShowBusinessModal(false)
      setBusinessForm({ name: '', description: '' })
    } catch (err: any) {
      alert('Error creating business: ' + err.message)
    }
  }

  // Create/Update post
  const handleSavePost = async () => {
    if (!postForm.title.trim()) {
      alert('Please enter a title')
      return
    }
    if (!selectedBusiness) {
      alert('Please select a business first')
      return
    }
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingPost) {
        const { error } = await supabase
          .from('content_posts')
          .update({
            ...postForm,
            published_date: postForm.status === 'published' ? new Date().toISOString() : null
          })
          .eq('id', editingPost.id)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('content_posts')
          .insert({
            ...postForm,
            business_id: selectedBusiness.id,
            published_date: postForm.status === 'published' ? new Date().toISOString() : null
          })
        
        if (error) throw error
      }
      
      setShowPostModal(false)
      setEditingPost(null)
      resetPostForm()
      fetchPosts()
    } catch (err: any) {
      alert('Error saving post: ' + err.message)
    }
  }

  const handleDeletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_posts').delete().eq('id', id)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteBusiness = async (id: number) => {
    if (!confirm('Delete this business and all its posts?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_posts').delete().eq('business_id', id)
      await supabase.from('content_businesses').delete().eq('id', id)
      setBusinesses(prev => prev.filter(b => b.id !== id))
      if (selectedBusiness?.id === id) {
        setSelectedBusiness(businesses.find(b => b.id !== id) || null)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const resetPostForm = () => {
    setPostForm({
      title: '',
      description: '',
      platform: 'Facebook',
      content_type: 'Post',
      status: 'draft',
      scheduled_date: new Date().toISOString().split('T')[0],
      reach: 0,
      impressions: 0,
      engagement: 0,
      clicks: 0
    })
  }

  const openEditPost = (post: ContentPost) => {
    setEditingPost(post)
    setPostForm({
      title: post.title,
      description: post.description || '',
      platform: post.platform,
      content_type: post.content_type,
      status: post.status,
      scheduled_date: post.scheduled_date,
      reach: post.reach || 0,
      impressions: post.impressions || 0,
      engagement: post.engagement || 0,
      clicks: post.clicks || 0
    })
    setShowPostModal(true)
  }

  // Calendar logic
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

  const postsByDate = useMemo(() => {
    const map: Record<string, ContentPost[]> = {}
    posts.forEach(post => {
      const key = new Date(post.scheduled_date).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [posts])

  // Reports calculations
  const reportData = useMemo(() => {
    const published = posts.filter(p => p.status === 'published')
    const totalReach = published.reduce((sum, p) => sum + (p.reach || 0), 0)
    const totalImpressions = published.reduce((sum, p) => sum + (p.impressions || 0), 0)
    const totalEngagement = published.reduce((sum, p) => sum + (p.engagement || 0), 0)
    const totalClicks = published.reduce((sum, p) => sum + (p.clicks || 0), 0)
    
    const byPlatform: Record<string, { count: number; reach: number; engagement: number }> = {}
    published.forEach(p => {
      if (!byPlatform[p.platform]) {
        byPlatform[p.platform] = { count: 0, reach: 0, engagement: 0 }
      }
      byPlatform[p.platform].count++
      byPlatform[p.platform].reach += p.reach || 0
      byPlatform[p.platform].engagement += p.engagement || 0
    })

    return {
      totalPosts: posts.length,
      publishedPosts: published.length,
      scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
      draftPosts: posts.filter(p => p.status === 'draft').length,
      totalReach,
      totalImpressions,
      totalEngagement,
      totalClicks,
      avgEngagementRate: totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : '0',
      byPlatform
    }
  }, [posts])

  if (authLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0 }}>Content Calendar</h1>
              
              {/* Business Selector */}
              <select
                value={selectedBusiness?.id || ''}
                onChange={(e) => {
                  const biz = businesses.find(b => b.id === Number(e.target.value))
                  setSelectedBusiness(biz || null)
                }}
                style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minWidth: '180px' }}
              >
                <option value="">Select Business</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              <button
                onClick={() => setShowBusinessModal(true)}
                style={{ padding: '8px 16px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}
              >
                + New Business
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
              {(['calendar', 'list', 'reports'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeTab === tab ? '#fff' : 'transparent',
                    color: activeTab === tab ? '#111827' : '#6b7280',
                    boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    textTransform: 'capitalize'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {selectedBusiness && (
              <button
                onClick={() => { resetPostForm(); setEditingPost(null); setShowPostModal(true); }}
                style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#4f46e5', color: '#fff' }}
              >
                + Add Post
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : !selectedBusiness ? (
            /* No Business Selected */
            <div style={{ background: '#fff', borderRadius: '12px', padding: '60px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>--</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>
                {businesses.length === 0 ? 'Create Your First Business' : 'Select a Business'}
              </h3>
              <p style={{ color: '#6b7280', margin: '0 0 24px 0' }}>
                {businesses.length === 0 
                  ? 'Create a business folder to start managing your content calendar'
                  : 'Choose a business from the dropdown above or create a new one'
                }
              </p>
              <button
                onClick={() => setShowBusinessModal(true)}
                style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#4f46e5', color: '#fff' }}
              >
                + Create Business
              </button>

              {/* Business List */}
              {businesses.length > 0 && (
                <div style={{ marginTop: '32px', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Your Businesses</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {businesses.map(b => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBusiness(b)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', background: '#f9fafb' }}
                      >
                        <div>
                          <div style={{ fontWeight: 500, color: '#111827' }}>{b.name}</div>
                          {b.description && <div style={{ fontSize: '13px', color: '#6b7280' }}>{b.description}</div>}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteBusiness(b.id); }}
                          style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'calendar' ? (
            /* Calendar View */
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{monthName}</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '6px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Today</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ padding: '6px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Prev</button>
                  <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ padding: '6px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Next</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: 500, color: '#6b7280' }}>{d}</div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {calendarDays.map((day, idx) => {
                  const dayPosts = postsByDate[day.date.toDateString()] || []
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setPostForm(p => ({ ...p, scheduled_date: day.date.toISOString().split('T')[0] }))
                        setEditingPost(null)
                        setShowPostModal(true)
                      }}
                      style={{
                        minHeight: '100px',
                        padding: '8px',
                        borderBottom: '1px solid #f3f4f6',
                        borderRight: '1px solid #f3f4f6',
                        cursor: 'pointer',
                        background: day.isCurrentMonth ? '#fff' : '#f9fafb'
                      }}
                    >
                      <div style={{
                        display: day.isToday ? 'flex' : 'block',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: day.isToday ? '28px' : 'auto',
                        height: day.isToday ? '28px' : 'auto',
                        fontSize: '14px',
                        fontWeight: 500,
                        marginBottom: '4px',
                        borderRadius: '50%',
                        background: day.isToday ? '#4f46e5' : 'transparent',
                        color: day.isToday ? '#fff' : day.isCurrentMonth ? '#111827' : '#9ca3af'
                      }}>
                        {day.date.getDate()}
                      </div>
                      {dayPosts.slice(0, 3).map(post => (
                        <div
                          key={post.id}
                          onClick={(e) => { e.stopPropagation(); openEditPost(post); }}
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            marginBottom: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            background: STATUS_COLORS[post.status]?.bg || '#f3f4f6',
                            color: STATUS_COLORS[post.status]?.text || '#6b7280'
                          }}
                        >
                          {post.title}
                        </div>
                      ))}
                      {dayPosts.length > 3 && (
                        <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>+{dayPosts.length - 3} more</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : activeTab === 'list' ? (
            /* List View */
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {posts.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No posts yet</h3>
                  <p style={{ color: '#6b7280', margin: 0 }}>Click "Add Post" to create your first content</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Title</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Platform</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Type</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} style={{ cursor: 'pointer' }} onClick={() => openEditPost(post)}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6', fontWeight: 500 }}>{post.title}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{post.platform}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{post.content_type}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{new Date(post.scheduled_date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', borderBottom: '1px solid #f3f4f6' }}>
                          <button onClick={(e) => { e.stopPropagation(); openEditPost(post); }} style={{ marginRight: '8px', padding: '4px 8px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            /* Reports View */
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Posts</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: '#111827' }}>{reportData.totalPosts}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Published</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: '#10b981' }}>{reportData.publishedPosts}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Scheduled</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: '#3b82f6' }}>{reportData.scheduledPosts}</div>
                </div>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Drafts</div>
                  <div style={{ fontSize: '28px', fontWeight: 600, color: '#6b7280' }}>{reportData.draftPosts}</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Performance Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Total Reach</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{reportData.totalReach.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Impressions</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{reportData.totalImpressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Engagement</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{reportData.totalEngagement.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Clicks</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#111827' }}>{reportData.totalClicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Avg Engagement Rate</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: '#4f46e5' }}>{reportData.avgEngagementRate}%</div>
                  </div>
                </div>
              </div>

              {/* By Platform */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Performance by Platform</h3>
                {Object.keys(reportData.byPlatform).length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No published posts yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Platform</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Posts</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Reach</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>Engagement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.byPlatform).map(([platform, data]) => (
                        <tr key={platform}>
                          <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500, color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{platform}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{data.count}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{data.reach.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', fontSize: '14px', color: '#111827', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{data.engagement.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Business Modal */}
      {showBusinessModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowBusinessModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>Create Business</h3>
              <button onClick={() => setShowBusinessModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#9ca3af' }}>x</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Business Name *</label>
              <input
                type="text"
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                placeholder="Enter business name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
              <textarea
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                placeholder="Enter description (optional)"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowBusinessModal(false)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateBusiness} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Modal */}
      {showPostModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPostModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{editingPost ? 'Edit Post' : 'Add Post'}</h3>
              <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: '#9ca3af' }}>x</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Title *</label>
              <input
                type="text"
                value={postForm.title}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="Enter post title"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Platform</label>
                <select
                  value={postForm.platform}
                  onChange={(e) => setPostForm({ ...postForm, platform: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Content Type</label>
                <select
                  value={postForm.content_type}
                  onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Scheduled Date</label>
                <input
                  type="date"
                  value={postForm.scheduled_date}
                  onChange={(e) => setPostForm({ ...postForm, scheduled_date: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Status</label>
                <select
                  value={postForm.status}
                  onChange={(e) => setPostForm({ ...postForm, status: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
              <textarea
                value={postForm.description}
                onChange={(e) => setPostForm({ ...postForm, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Metrics (only show for published posts) */}
            {postForm.status === 'published' && (
              <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 12px 0' }}>Metrics</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Reach</label>
                    <input
                      type="number"
                      value={postForm.reach}
                      onChange={(e) => setPostForm({ ...postForm, reach: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Impressions</label>
                    <input
                      type="number"
                      value={postForm.impressions}
                      onChange={(e) => setPostForm({ ...postForm, impressions: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Engagement</label>
                    <input
                      type="number"
                      value={postForm.engagement}
                      onChange={(e) => setPostForm({ ...postForm, engagement: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Clicks</label>
                    <input
                      type="number"
                      value={postForm.clicks}
                      onChange={(e) => setPostForm({ ...postForm, clicks: Number(e.target.value) })}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setShowPostModal(false)} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSavePost} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>{editingPost ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
