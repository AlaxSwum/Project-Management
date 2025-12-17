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
}

interface PostPlatform {
  id?: number
  post_id?: number
  platform: string
  reach: number
  impressions: number
  engagement: number
  clicks: number
  likes: number
  comments: number
  shares: number
  saves: number
  video_views: number
  media_spend: number
  permalink: string
  platform_status: string
  published_at: string | null
}

interface ContentPost {
  id: number
  business_id: number
  title: string
  description: string
  content_type: string
  status: string
  scheduled_date: string
  published_date: string | null
  assigned_to: string
  media_buying_budget: number
  notes: string
  created_at: string
  platforms?: PostPlatform[]
}

const PLATFORMS = ['Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'TikTok', 'YouTube', 'Pinterest']
const CONTENT_TYPES = ['Post', 'Story', 'Reel', 'Video', 'Article', 'Carousel', 'Infographic', 'Live']
const STATUSES = ['idea', 'draft', 'design', 'review', 'approved', 'scheduled', 'published', 'reported']
const ASSIGNEES = ['Swum', 'Team A', 'Team B', 'Designer', 'Editor', 'Manager']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  idea: { bg: '#F3E8FF', text: '#9333EA' },
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  design: { bg: '#FEF3C7', text: '#D97706' },
  review: { bg: '#DBEAFE', text: '#3B82F6' },
  approved: { bg: '#D1FAE5', text: '#10B981' },
  scheduled: { bg: '#E0E7FF', text: '#4F46E5' },
  published: { bg: '#DCFCE7', text: '#16A34A' },
  reported: { bg: '#F1F5F9', text: '#475569' }
}

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [activeTab, setActiveTab] = useState<'sheet' | 'calendar' | 'reports'>('sheet')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const [showBusinessModal, setShowBusinessModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showMetricsModal, setShowMetricsModal] = useState(false)
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null)
  const [editingPlatformMetrics, setEditingPlatformMetrics] = useState<{post: ContentPost, platform: PostPlatform} | null>(null)
  
  const [businessForm, setBusinessForm] = useState({ name: '', description: '' })
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook'])
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    content_type: 'Post',
    status: 'draft',
    scheduled_date: new Date().toISOString().split('T')[0],
    assigned_to: '',
    media_buying_budget: 0,
    notes: ''
  })
  const [metricsForm, setMetricsForm] = useState<PostPlatform>({
    platform: '',
    reach: 0,
    impressions: 0,
    engagement: 0,
    clicks: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    video_views: 0,
    media_spend: 0,
    permalink: '',
    platform_status: 'pending',
    published_at: null
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

  const fetchBusinesses = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('content_businesses').select('*').order('name')
      if (error) throw error
      setBusinesses(data || [])
    } catch (err) {
      console.error('Error:', err)
      setBusinesses([])
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const fetchPosts = useCallback(async () => {
    if (!selectedBusiness) { setPosts([]); return }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: postsData, error: postsError } = await supabase
        .from('content_posts')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('scheduled_date', { ascending: true })
      
      if (postsError) throw postsError
      
      // Fetch platforms for each post
      const postsWithPlatforms = await Promise.all((postsData || []).map(async (post) => {
        const { data: platforms } = await supabase
          .from('content_post_platforms')
          .select('*')
          .eq('post_id', post.id)
        return { ...post, platforms: platforms || [] }
      }))
      
      setPosts(postsWithPlatforms)
    } catch (err) {
      console.error('Error:', err)
      setPosts([])
    }
  }, [selectedBusiness])

  useEffect(() => { if (user?.id) fetchBusinesses() }, [user?.id, fetchBusinesses])
  useEffect(() => { if (selectedBusiness) fetchPosts() }, [selectedBusiness, fetchPosts])

  const handleCreateBusiness = async () => {
    if (!businessForm.name.trim()) { alert('Enter business name'); return }
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('content_businesses')
        .insert({ name: businessForm.name, description: businessForm.description, created_by: String(user?.id) })
        .select()
        .single()
      if (error) throw error
      setBusinesses(prev => [...prev, data])
      setSelectedBusiness(data)
      setShowBusinessModal(false)
      setBusinessForm({ name: '', description: '' })
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleSavePost = async () => {
    if (!postForm.title.trim()) { alert('Enter title'); return }
    if (!selectedBusiness) { alert('Select business first'); return }
    if (selectedPlatforms.length === 0) { alert('Select at least one platform'); return }
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (editingPost) {
        // Update post
        const { error } = await supabase
          .from('content_posts')
          .update({ ...postForm })
          .eq('id', editingPost.id)
        if (error) throw error
        
        // Delete old platforms and insert new ones
        await supabase.from('content_post_platforms').delete().eq('post_id', editingPost.id)
        
        for (const platform of selectedPlatforms) {
          const existingPlatform = editingPost.platforms?.find(p => p.platform === platform)
          await supabase.from('content_post_platforms').insert({
            post_id: editingPost.id,
            platform,
            reach: existingPlatform?.reach || 0,
            impressions: existingPlatform?.impressions || 0,
            engagement: existingPlatform?.engagement || 0,
            clicks: existingPlatform?.clicks || 0,
            likes: existingPlatform?.likes || 0,
            comments: existingPlatform?.comments || 0,
            shares: existingPlatform?.shares || 0,
            saves: existingPlatform?.saves || 0,
            video_views: existingPlatform?.video_views || 0,
            media_spend: existingPlatform?.media_spend || 0,
            permalink: existingPlatform?.permalink || '',
            platform_status: existingPlatform?.platform_status || 'pending'
          })
        }
      } else {
        // Create post
        const { data: newPost, error } = await supabase
          .from('content_posts')
          .insert({ ...postForm, business_id: selectedBusiness.id })
          .select()
          .single()
        if (error) throw error
        
        // Insert platforms
        for (const platform of selectedPlatforms) {
          await supabase.from('content_post_platforms').insert({
            post_id: newPost.id,
            platform,
            platform_status: 'pending'
          })
        }
      }
      
      setShowPostModal(false)
      setEditingPost(null)
      resetPostForm()
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleSaveMetrics = async () => {
    if (!editingPlatformMetrics) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase
        .from('content_post_platforms')
        .update(metricsForm)
        .eq('id', editingPlatformMetrics.platform.id)
      if (error) throw error
      setShowMetricsModal(false)
      setEditingPlatformMetrics(null)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeletePost = async (id: number) => {
    if (!confirm('Delete this post?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_post_platforms').delete().eq('post_id', id)
      await supabase.from('content_posts').delete().eq('id', id)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeleteBusiness = async (id: number) => {
    if (!confirm('Delete this business and all posts?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_businesses').delete().eq('id', id)
      setBusinesses(prev => prev.filter(b => b.id !== id))
      if (selectedBusiness?.id === id) setSelectedBusiness(null)
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const resetPostForm = () => {
    setPostForm({
      title: '',
      description: '',
      content_type: 'Post',
      status: 'draft',
      scheduled_date: new Date().toISOString().split('T')[0],
      assigned_to: '',
      media_buying_budget: 0,
      notes: ''
    })
    setSelectedPlatforms(['Facebook'])
  }

  const openEditPost = (post: ContentPost) => {
    setEditingPost(post)
    setPostForm({
      title: post.title,
      description: post.description || '',
      content_type: post.content_type,
      status: post.status,
      scheduled_date: post.scheduled_date,
      assigned_to: post.assigned_to || '',
      media_buying_budget: post.media_buying_budget || 0,
      notes: post.notes || ''
    })
    setSelectedPlatforms(post.platforms?.map(p => p.platform) || ['Facebook'])
    setShowPostModal(true)
  }

  const openMetricsModal = (post: ContentPost, platform: PostPlatform) => {
    setEditingPlatformMetrics({ post, platform })
    setMetricsForm({ ...platform })
    setShowMetricsModal(true)
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

  const postsByDate = useMemo(() => {
    const map: Record<string, ContentPost[]> = {}
    posts.forEach(post => {
      const key = new Date(post.scheduled_date).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [posts])

  const reportData = useMemo(() => {
    const allPlatforms: PostPlatform[] = posts.flatMap(p => p.platforms || [])
    const totalReach = allPlatforms.reduce((sum, p) => sum + (p.reach || 0), 0)
    const totalImpressions = allPlatforms.reduce((sum, p) => sum + (p.impressions || 0), 0)
    const totalEngagement = allPlatforms.reduce((sum, p) => sum + (p.engagement || 0), 0)
    const totalClicks = allPlatforms.reduce((sum, p) => sum + (p.clicks || 0), 0)
    const totalLikes = allPlatforms.reduce((sum, p) => sum + (p.likes || 0), 0)
    const totalComments = allPlatforms.reduce((sum, p) => sum + (p.comments || 0), 0)
    const totalShares = allPlatforms.reduce((sum, p) => sum + (p.shares || 0), 0)
    const totalSaves = allPlatforms.reduce((sum, p) => sum + (p.saves || 0), 0)
    const totalVideoViews = allPlatforms.reduce((sum, p) => sum + (p.video_views || 0), 0)
    const totalMediaSpend = allPlatforms.reduce((sum, p) => sum + (p.media_spend || 0), 0)
    const totalBudget = posts.reduce((sum, p) => sum + (p.media_buying_budget || 0), 0)
    
    const byPlatform: Record<string, { count: number; reach: number; engagement: number; spend: number; impressions: number }> = {}
    allPlatforms.forEach(p => {
      if (!byPlatform[p.platform]) byPlatform[p.platform] = { count: 0, reach: 0, engagement: 0, spend: 0, impressions: 0 }
      byPlatform[p.platform].count++
      byPlatform[p.platform].reach += p.reach || 0
      byPlatform[p.platform].engagement += p.engagement || 0
      byPlatform[p.platform].spend += p.media_spend || 0
      byPlatform[p.platform].impressions += p.impressions || 0
    })

    const byStatus: Record<string, number> = {}
    posts.forEach(p => { byStatus[p.status] = (byStatus[p.status] || 0) + 1 })

    const byAssignee: Record<string, number> = {}
    posts.forEach(p => { if (p.assigned_to) byAssignee[p.assigned_to] = (byAssignee[p.assigned_to] || 0) + 1 })

    return {
      totalPosts: posts.length,
      totalReach, totalImpressions, totalEngagement, totalClicks,
      totalLikes, totalComments, totalShares, totalSaves, totalVideoViews,
      totalMediaSpend, totalBudget,
      avgEngagementRate: totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : '0',
      costPerEngagement: totalEngagement > 0 ? (totalMediaSpend / totalEngagement).toFixed(2) : '0',
      byPlatform, byStatus, byAssignee
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

  // Business Selection Screen
  if (!selectedBusiness) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', fontFamily: 'Inter, sans-serif' }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
          {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}
          <div style={{ flex: 1, padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '40px', maxWidth: '600px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: '0 0 8px 0', textAlign: 'center' }}>Content Calendar</h1>
              <p style={{ color: '#6b7280', margin: '0 0 32px 0', textAlign: 'center' }}>Select a business or create a new one to manage content</p>
              
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <>
                  {businesses.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>Your Businesses</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {businesses.map(b => (
                          <div
                            key={b.id}
                            onClick={() => setSelectedBusiness(b)}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', cursor: 'pointer', background: '#fff', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = '#4f46e5'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: '16px' }}>{b.name}</div>
                              {b.description && <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{b.description}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedBusiness(b); }}
                                style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: 'none', borderRadius: '6px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
                              >
                                Open
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteBusiness(b.id); }}
                                style={{ padding: '8px 12px', fontSize: '13px', border: '1px solid #fecaca', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={() => setShowBusinessModal(true)}
                    style={{ width: '100%', padding: '16px', fontSize: '15px', fontWeight: 600, border: '2px dashed #d1d5db', borderRadius: '12px', background: '#f9fafb', color: '#4f46e5', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.background = '#f0f0ff' }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#f9fafb' }}
                  >
                    + Create New Business
                  </button>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Business Modal */}
        {showBusinessModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowBusinessModal(false)}>
            <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '450px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 20px 0' }}>Create Business</h3>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Business Name *</label>
                <input type="text" value={businessForm.name} onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })} placeholder="Enter business name" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
                <textarea value={businessForm.description} onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })} placeholder="Optional description" rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setShowBusinessModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleCreateBusiness} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Create</button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => setSelectedBusiness(null)} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                &larr; Back
              </button>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedBusiness.name}</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Content Calendar</p>
              </div>
            </div>

            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
              {(['sheet', 'calendar', 'reports'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', fontSize: '14px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === tab ? '#fff' : 'transparent', color: activeTab === tab ? '#111827' : '#6b7280', textTransform: 'capitalize' }}>
                  {tab}
                </button>
              ))}
            </div>

            <button onClick={() => { resetPostForm(); setEditingPost(null); setShowPostModal(true); }} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#4f46e5', color: '#fff' }}>
              + Add Post
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
          {activeTab === 'sheet' ? (
            /* Sheet View */
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
              {posts.length === 0 ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No posts yet</h3>
                  <p style={{ color: '#6b7280', margin: 0 }}>Click "+ Add Post" to create your first content</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                  <thead>
                    <tr style={{ background: '#f9fafb' }}>
                      {['Title', 'Platforms', 'Type', 'Date', 'Assigned', 'Budget', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827', maxWidth: '200px' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                          {post.description && <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.description}</div>}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {post.platforms?.map(p => (
                              <button key={p.platform} onClick={() => openMetricsModal(post, p)} style={{ padding: '4px 8px', fontSize: '11px', border: '1px solid #e5e7eb', borderRadius: '4px', background: p.reach > 0 ? '#d1fae5' : '#f9fafb', cursor: 'pointer', color: '#374151' }}>
                                {p.platform}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{post.content_type}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151', whiteSpace: 'nowrap' }}>{new Date(post.scheduled_date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{post.assigned_to || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>${post.media_buying_budget || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ display: 'inline-block', padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.status}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => openEditPost(post)} style={{ marginRight: '8px', padding: '6px 12px', fontSize: '12px', border: '1px solid #d1d5db', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDeletePost(post.id)} style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid #fecaca', borderRadius: '4px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <div key={idx} onClick={() => { setPostForm(p => ({ ...p, scheduled_date: day.date.toISOString().split('T')[0] })); setEditingPost(null); setShowPostModal(true) }} style={{ minHeight: '100px', padding: '8px', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', cursor: 'pointer', background: day.isCurrentMonth ? '#fff' : '#f9fafb' }}>
                      <div style={{ display: day.isToday ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center', width: day.isToday ? '28px' : 'auto', height: day.isToday ? '28px' : 'auto', fontSize: '14px', fontWeight: 500, marginBottom: '4px', borderRadius: '50%', background: day.isToday ? '#4f46e5' : 'transparent', color: day.isToday ? '#fff' : day.isCurrentMonth ? '#111827' : '#9ca3af' }}>
                        {day.date.getDate()}
                      </div>
                      {dayPosts.slice(0, 3).map(post => (
                        <div key={post.id} onClick={(e) => { e.stopPropagation(); openEditPost(post) }} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>
                          {post.title}
                        </div>
                      ))}
                      {dayPosts.length > 3 && <div style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>+{dayPosts.length - 3} more</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Reports View */
            <div>
              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[
                  { label: 'Total Posts', value: reportData.totalPosts, color: '#111827' },
                  { label: 'Total Reach', value: reportData.totalReach.toLocaleString(), color: '#059669' },
                  { label: 'Impressions', value: reportData.totalImpressions.toLocaleString(), color: '#3b82f6' },
                  { label: 'Engagement', value: reportData.totalEngagement.toLocaleString(), color: '#8b5cf6' },
                  { label: 'Clicks', value: reportData.totalClicks.toLocaleString(), color: '#f59e0b' },
                  { label: 'Media Spend', value: `$${reportData.totalMediaSpend.toLocaleString()}`, color: '#dc2626' },
                  { label: 'Budget', value: `$${reportData.totalBudget.toLocaleString()}`, color: '#0891b2' },
                  { label: 'Eng. Rate', value: `${reportData.avgEngagementRate}%`, color: '#4f46e5' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 600, color: item.color }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Detailed Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Engagement Breakdown</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { label: 'Likes', value: reportData.totalLikes },
                      { label: 'Comments', value: reportData.totalComments },
                      { label: 'Shares', value: reportData.totalShares },
                      { label: 'Saves', value: reportData.totalSaves },
                      { label: 'Video Views', value: reportData.totalVideoViews },
                      { label: 'Cost/Engagement', value: `$${reportData.costPerEngagement}` },
                    ].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>{item.label}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#111827' }}>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>By Status</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(reportData.byStatus).map(([status, count]) => (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', background: STATUS_COLORS[status]?.bg, color: STATUS_COLORS[status]?.text }}>{status}</span>
                        <span style={{ fontWeight: 600, color: '#111827' }}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Platform */}
              <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>Performance by Platform</h3>
                {Object.keys(reportData.byPlatform).length === 0 ? (
                  <p style={{ color: '#6b7280' }}>No data yet</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Platform', 'Posts', 'Reach', 'Impressions', 'Engagement', 'Spend', 'Eng. Rate'].map(h => (
                          <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(reportData.byPlatform).map(([platform, data]) => (
                        <tr key={platform}>
                          <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{platform}</td>
                          <td style={{ padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{data.count}</td>
                          <td style={{ padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{data.reach.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{data.impressions.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{data.engagement.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>${data.spend.toLocaleString()}</td>
                          <td style={{ padding: '12px 16px', color: '#4f46e5', fontWeight: 500, borderBottom: '1px solid #f3f4f6' }}>{data.impressions > 0 ? ((data.engagement / data.impressions) * 100).toFixed(2) : '0'}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* By Assignee */}
              {Object.keys(reportData.byAssignee).length > 0 && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: '0 0 16px 0' }}>By Assignee</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {Object.entries(reportData.byAssignee).map(([assignee, count]) => (
                      <div key={assignee} style={{ padding: '12px 20px', background: '#f3f4f6', borderRadius: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{assignee}</div>
                        <div style={{ fontSize: '20px', fontWeight: 600, color: '#4f46e5' }}>{count} posts</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Post Modal */}
      {showPostModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowPostModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 20px 0' }}>{editingPost ? 'Edit Post' : 'Add Post'}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Title *</label>
              <input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Enter post title" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Platforms * (click to select multiple)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PLATFORMS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                    style={{ padding: '8px 16px', fontSize: '13px', border: selectedPlatforms.includes(p) ? '2px solid #4f46e5' : '1px solid #d1d5db', borderRadius: '8px', background: selectedPlatforms.includes(p) ? '#eef2ff' : '#fff', color: selectedPlatforms.includes(p) ? '#4f46e5' : '#374151', cursor: 'pointer', fontWeight: selectedPlatforms.includes(p) ? 600 : 400 }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Content Type</label>
                <select value={postForm.content_type} onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Status</label>
                <select value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Scheduled Date</label>
                <input type="date" value={postForm.scheduled_date} onChange={(e) => setPostForm({ ...postForm, scheduled_date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Assigned To</label>
                <select value={postForm.assigned_to} onChange={(e) => setPostForm({ ...postForm, assigned_to: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select assignee</option>
                  {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Media Buying Budget ($)</label>
              <input type="number" value={postForm.media_buying_budget} onChange={(e) => setPostForm({ ...postForm, media_buying_budget: Number(e.target.value) })} placeholder="0" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
              <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Enter description" rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Notes</label>
              <textarea value={postForm.notes} onChange={(e) => setPostForm({ ...postForm, notes: e.target.value })} placeholder="Additional notes" rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setShowPostModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSavePost} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>{editingPost ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Modal */}
      {showMetricsModal && editingPlatformMetrics && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowMetricsModal(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 4px 0' }}>{editingPlatformMetrics.platform.platform} Metrics</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>{editingPlatformMetrics.post.title}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { key: 'reach', label: 'Reach' },
                { key: 'impressions', label: 'Impressions' },
                { key: 'engagement', label: 'Engagement' },
                { key: 'clicks', label: 'Clicks' },
                { key: 'likes', label: 'Likes' },
                { key: 'comments', label: 'Comments' },
                { key: 'shares', label: 'Shares' },
                { key: 'saves', label: 'Saves' },
                { key: 'video_views', label: 'Video Views' },
                { key: 'media_spend', label: 'Media Spend ($)' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>{label}</label>
                  <input
                    type="number"
                    value={(metricsForm as any)[key] || 0}
                    onChange={(e) => setMetricsForm({ ...metricsForm, [key]: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Permalink</label>
              <input type="text" value={metricsForm.permalink || ''} onChange={(e) => setMetricsForm({ ...metricsForm, permalink: e.target.value })} placeholder="https://..." style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Platform Status</label>
              <select value={metricsForm.platform_status} onChange={(e) => setMetricsForm({ ...metricsForm, platform_status: e.target.value })} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                {['pending', 'published', 'failed'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button onClick={() => setShowMetricsModal(false)} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveMetrics} style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none', borderRadius: '8px', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Save Metrics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
