'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import {
  Company, CompanyMember, ContentPost, ContentPostTarget,
  Platform, PostStatus, ContentType, PlatformStatus,
  PLATFORMS, CONTENT_TYPES, POST_STATUSES, PLATFORM_STATUSES,
  STATUS_COLORS, PLATFORM_STATUS_COLORS, PLATFORM_COLORS
} from '@/types/content-calendar-v3'

export default function CompanyCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string

  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [company, setCompany] = useState<Company | null>(null)
  const [members, setMembers] = useState<CompanyMember[]>([])
  const [posts, setPosts] = useState<ContentPost[]>([])
  const [viewMode, setViewMode] = useState<'calendar' | 'sheet'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const [showPostDrawer, setShowPostDrawer] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    content_type: 'static' as ContentType,
    category: '',
    status: 'draft' as PostStatus,
    planned_date: new Date().toISOString().split('T')[0],
    planned_time: '',
    content_deadline: '',
    graphic_deadline: '',
    owner_id: '',
    owner_name: '',
    designer_id: '',
    designer_name: '',
    hashtags: '',
    visual_concept: '',
    key_points: '',
    media_buying_notes: '',
    media_budget: 0,
    platforms: ['facebook'] as Platform[]
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

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single()
      if (error) throw error
      setCompany(data)
    } catch (err) {
      console.error('Error:', err)
      router.push('/content-calendar')
    }
  }, [companyId, router])

  const fetchMembers = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase
        .from('company_members')
        .select('*')
        .eq('company_id', companyId)
      setMembers(data || [])
    } catch (err) {
      console.error('Error:', err)
    }
  }, [companyId])

  const fetchPosts = useCallback(async () => {
    if (!companyId) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: postsData, error } = await supabase
        .from('content_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('planned_date', { ascending: true })
      
      if (error) throw error
      
      // Fetch targets for each post
      const postsWithTargets = await Promise.all((postsData || []).map(async (post) => {
        const { data: targets } = await supabase
          .from('content_post_targets')
          .select('*')
          .eq('post_id', post.id)
        return { ...post, targets: targets || [] }
      }))
      
      setPosts(postsWithTargets)
    } catch (err) {
      console.error('Error:', err)
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (user?.id && companyId) {
      fetchCompany()
      fetchMembers()
      fetchPosts()
    }
  }, [user?.id, companyId, fetchCompany, fetchMembers, fetchPosts])

  const resetForm = () => {
    setPostForm({
      title: '',
      description: '',
      content_type: 'static',
      category: '',
      status: 'draft',
      planned_date: new Date().toISOString().split('T')[0],
      planned_time: '',
      content_deadline: '',
      graphic_deadline: '',
      owner_id: '',
      owner_name: '',
      designer_id: '',
      designer_name: '',
      hashtags: '',
      visual_concept: '',
      key_points: '',
      media_buying_notes: '',
      media_budget: 0,
      platforms: ['facebook']
    })
  }

  const openNewPost = (date?: string) => {
    resetForm()
    if (date) {
      setPostForm(prev => ({ ...prev, planned_date: date }))
    }
    setSelectedPost(null)
    setIsEditing(true)
    setShowPostDrawer(true)
  }

  const openPostDetails = (post: ContentPost) => {
    setSelectedPost(post)
    setPostForm({
      title: post.title,
      description: post.description || '',
      content_type: post.content_type,
      category: post.category || '',
      status: post.status,
      planned_date: post.planned_date,
      planned_time: post.planned_time || '',
      content_deadline: post.content_deadline || '',
      graphic_deadline: post.graphic_deadline || '',
      owner_id: post.owner_id || '',
      owner_name: post.owner_name || '',
      designer_id: post.designer_id || '',
      designer_name: post.designer_name || '',
      hashtags: post.hashtags || '',
      visual_concept: post.visual_concept || '',
      key_points: post.key_points || '',
      media_buying_notes: post.media_buying_notes || '',
      media_budget: post.media_budget || 0,
      platforms: post.targets?.map(t => t.platform) || ['facebook']
    })
    setIsEditing(false)
    setShowPostDrawer(true)
  }

  const handleSavePost = async () => {
    if (!postForm.title.trim()) {
      alert('Enter post title')
      return
    }
    if (postForm.platforms.length === 0) {
      alert('Select at least one platform')
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (selectedPost) {
        // Update existing post
        const { error } = await supabase
          .from('content_posts')
          .update({
            title: postForm.title,
            description: postForm.description,
            content_type: postForm.content_type,
            category: postForm.category,
            status: postForm.status,
            planned_date: postForm.planned_date,
            planned_time: postForm.planned_time || null,
            content_deadline: postForm.content_deadline || null,
            graphic_deadline: postForm.graphic_deadline || null,
            owner_id: postForm.owner_id || null,
            owner_name: postForm.owner_name || null,
            designer_id: postForm.designer_id || null,
            designer_name: postForm.designer_name || null,
            hashtags: postForm.hashtags,
            visual_concept: postForm.visual_concept,
            key_points: postForm.key_points,
            media_buying_notes: postForm.media_buying_notes,
            media_budget: postForm.media_budget
          })
          .eq('id', selectedPost.id)
        
        if (error) throw error
        
        // Update targets
        await supabase.from('content_post_targets').delete().eq('post_id', selectedPost.id)
        
        for (const platform of postForm.platforms) {
          const existing = selectedPost.targets?.find(t => t.platform === platform)
          await supabase.from('content_post_targets').insert({
            post_id: selectedPost.id,
            platform,
            platform_status: existing?.platform_status || 'planned',
            publish_at: existing?.publish_at || null,
            permalink: existing?.permalink || null,
            manual_posted_by: existing?.manual_posted_by || null,
            manual_posted_by_name: existing?.manual_posted_by_name || null,
            manual_posted_at: existing?.manual_posted_at || null,
            notes: existing?.notes || null
          })
        }
      } else {
        // Create new post
        const { data: newPost, error } = await supabase
          .from('content_posts')
          .insert({
            company_id: companyId,
            title: postForm.title,
            description: postForm.description,
            content_type: postForm.content_type,
            category: postForm.category,
            status: postForm.status,
            planned_date: postForm.planned_date,
            planned_time: postForm.planned_time || null,
            content_deadline: postForm.content_deadline || null,
            graphic_deadline: postForm.graphic_deadline || null,
            owner_id: postForm.owner_id || null,
            owner_name: postForm.owner_name || null,
            designer_id: postForm.designer_id || null,
            designer_name: postForm.designer_name || null,
            hashtags: postForm.hashtags,
            visual_concept: postForm.visual_concept,
            key_points: postForm.key_points,
            media_buying_notes: postForm.media_buying_notes,
            media_budget: postForm.media_budget,
            created_by: String(user?.id)
          })
          .select()
          .single()
        
        if (error) throw error
        
        // Create targets
        for (const platform of postForm.platforms) {
          await supabase.from('content_post_targets').insert({
            post_id: newPost.id,
            platform,
            platform_status: 'planned'
          })
        }
      }

      setShowPostDrawer(false)
      setSelectedPost(null)
      setIsEditing(false)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleDeletePost = async () => {
    if (!selectedPost) return
    if (!confirm('Delete this post?')) return
    
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_posts').delete().eq('id', selectedPost.id)
      setShowPostDrawer(false)
      setSelectedPost(null)
      fetchPosts()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleUpdateTarget = async (targetId: string, updates: Partial<ContentPostTarget>) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_post_targets').update(updates).eq('id', targetId)
      fetchPosts()
      
      // Refresh selected post
      if (selectedPost) {
        const { data } = await supabase
          .from('content_posts')
          .select('*')
          .eq('id', selectedPost.id)
          .single()
        
        if (data) {
          const { data: targets } = await supabase
            .from('content_post_targets')
            .select('*')
            .eq('post_id', data.id)
          setSelectedPost({ ...data, targets: targets || [] })
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  const handleMarkAsPublished = async (target: ContentPostTarget) => {
    await handleUpdateTarget(target.id, {
      platform_status: 'published',
      manual_posted_by: String(user?.id),
      manual_posted_by_name: user?.name || user?.email,
      manual_posted_at: new Date().toISOString()
    })
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
      const key = new Date(post.planned_date).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [posts])

  if (authLoading || !company) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F5ED', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title={company.name} isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={() => router.push('/content-calendar')} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Back</button>
              <div>
                <h1 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>{company.name}</h1>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Content Calendar</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
                {(['calendar', 'sheet'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', cursor: 'pointer', background: viewMode === mode ? '#fff' : 'transparent', color: viewMode === mode ? '#111827' : '#6b7280', textTransform: 'capitalize' }}>
                    {mode}
                  </button>
                ))}
              </div>
              
              <button onClick={() => router.push(`/content-calendar/${companyId}/reports`)} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }}>
                Reports
              </button>

              <button onClick={() => openNewPost()} style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 500, borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
                + New Post
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area with Split Layout */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Calendar/Sheet */}
          <div style={{ flex: showPostDrawer ? '0 0 60%' : 1, padding: '20px', overflow: 'auto', transition: 'flex 0.3s' }}>
            {viewMode === 'calendar' ? (
              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>{monthName}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Today</button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Prev</button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #d1d5db', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}>Next</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {calendarDays.map((day, idx) => {
                    const dayPosts = postsByDate[day.date.toDateString()] || []
                    const dateStr = day.date.toISOString().split('T')[0]
                    return (
                      <div
                        key={idx}
                        onClick={() => openNewPost(dateStr)}
                        style={{ minHeight: '90px', padding: '6px', borderBottom: '1px solid #f3f4f6', borderRight: '1px solid #f3f4f6', cursor: 'pointer', background: day.isCurrentMonth ? '#fff' : '#f9fafb' }}
                      >
                        <div style={{ display: day.isToday ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center', width: day.isToday ? '24px' : 'auto', height: day.isToday ? '24px' : 'auto', fontSize: '13px', fontWeight: 500, marginBottom: '4px', borderRadius: '50%', background: day.isToday ? '#4f46e5' : 'transparent', color: day.isToday ? '#fff' : day.isCurrentMonth ? '#111827' : '#9ca3af' }}>
                          {day.date.getDate()}
                        </div>
                        {dayPosts.slice(0, 3).map(post => (
                          <div
                            key={post.id}
                            onClick={(e) => { e.stopPropagation(); openPostDetails(post) }}
                            style={{ fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text, cursor: 'pointer' }}
                          >
                            {post.title}
                          </div>
                        ))}
                        {dayPosts.length > 3 && <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>+{dayPosts.length - 3}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'auto' }}>
                {posts.length === 0 ? (
                  <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>No posts yet</h3>
                    <p style={{ color: '#6b7280' }}>Click "+ New Post" to create content</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Title', 'Type', 'Date', 'Platforms', 'Status', 'Owner'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(post => (
                        <tr key={post.id} onClick={() => openPostDetails(post)} style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 500, color: '#111827' }}>{post.title}</td>
                          <td style={{ padding: '10px 12px', color: '#374151' }}>{post.content_type}</td>
                          <td style={{ padding: '10px 12px', color: '#374151' }}>{new Date(post.planned_date).toLocaleDateString()}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {post.targets?.map(t => (
                                <span key={t.platform} style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLATFORM_COLORS[t.platform] }} title={t.platform} />
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '20px', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.status}</span>
                          </td>
                          <td style={{ padding: '10px 12px', color: '#374151' }}>{post.owner_name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

          {/* Right: Post Drawer */}
          {showPostDrawer && (
            <div style={{ width: '40%', minWidth: '400px', background: '#fff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>
                  {isEditing ? (selectedPost ? 'Edit Post' : 'New Post') : 'Post Details'}
                </h3>
                <button onClick={() => { setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false) }} style={{ background: 'none', border: 'none', fontSize: '20px', color: '#9ca3af', cursor: 'pointer' }}>x</button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
                {isEditing ? (
                  /* Edit Form */
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Title *</label>
                      <input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Post title" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Platforms *</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {PLATFORMS.map(p => (
                          <button key={p} type="button" onClick={() => setPostForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }))} style={{ padding: '8px 14px', fontSize: '13px', border: postForm.platforms.includes(p) ? `2px solid ${PLATFORM_COLORS[p]}` : '1px solid #d1d5db', borderRadius: '8px', background: postForm.platforms.includes(p) ? '#f0f0ff' : '#fff', color: postForm.platforms.includes(p) ? PLATFORM_COLORS[p] : '#374151', cursor: 'pointer', fontWeight: postForm.platforms.includes(p) ? 600 : 400, textTransform: 'capitalize' }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Content Type</label>
                        <select value={postForm.content_type} onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value as ContentType })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                          {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Status</label>
                        <select value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value as PostStatus })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                          {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Planned Date</label>
                        <input type="date" value={postForm.planned_date} onChange={(e) => setPostForm({ ...postForm, planned_date: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Planned Time</label>
                        <input type="time" value={postForm.planned_time} onChange={(e) => setPostForm({ ...postForm, planned_time: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Content Deadline</label>
                        <input type="date" value={postForm.content_deadline} onChange={(e) => setPostForm({ ...postForm, content_deadline: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Graphic Deadline</label>
                        <input type="date" value={postForm.graphic_deadline} onChange={(e) => setPostForm({ ...postForm, graphic_deadline: e.target.value })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Content Owner</label>
                        <select value={postForm.owner_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, owner_id: e.target.value, owner_name: m?.user_name || '' }) }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                          <option value="">Select</option>
                          {members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Designer</label>
                        <select value={postForm.designer_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, designer_id: e.target.value, designer_name: m?.user_name || '' }) }} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                          <option value="">Select</option>
                          {members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Description</label>
                      <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Post description" rows={3} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Visual Concept</label>
                      <textarea value={postForm.visual_concept} onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })} placeholder="Visual concept notes" rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Key Points</label>
                      <textarea value={postForm.key_points} onChange={(e) => setPostForm({ ...postForm, key_points: e.target.value })} placeholder="Key points to cover" rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Hashtags</label>
                      <input type="text" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#hashtag1 #hashtag2" style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Media Buying Notes</label>
                      <textarea value={postForm.media_buying_notes} onChange={(e) => setPostForm({ ...postForm, media_buying_notes: e.target.value })} placeholder="Budget, targeting notes" rows={2} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none', boxSizing: 'border-box' }} />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Media Budget ($)</label>
                      <input type="number" value={postForm.media_budget} onChange={(e) => setPostForm({ ...postForm, media_budget: Number(e.target.value) })} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                    </div>
                  </>
                ) : selectedPost ? (
                  /* View Details */
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: '0 0 8px 0' }}>{selectedPost.title}</h4>
                      <span style={{ padding: '4px 10px', fontSize: '12px', fontWeight: 500, borderRadius: '20px', background: STATUS_COLORS[selectedPost.status]?.bg, color: STATUS_COLORS[selectedPost.status]?.text }}>{selectedPost.status}</span>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Planned Date</div>
                      <div style={{ fontSize: '14px', color: '#111827' }}>{new Date(selectedPost.planned_date).toLocaleDateString()} {selectedPost.planned_time || ''}</div>
                    </div>

                    {selectedPost.description && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Description</div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>{selectedPost.description}</div>
                      </div>
                    )}

                    {selectedPost.visual_concept && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Visual Concept</div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>{selectedPost.visual_concept}</div>
                      </div>
                    )}

                    {selectedPost.key_points && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>Key Points</div>
                        <div style={{ fontSize: '14px', color: '#111827' }}>{selectedPost.key_points}</div>
                      </div>
                    )}

                    {/* Platform Targets Section */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 12px 0' }}>Platform Targets</h4>
                      {selectedPost.targets?.map(target => (
                        <div key={target.id} style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLATFORM_COLORS[target.platform] }} />
                              <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{target.platform}</span>
                            </div>
                            <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 500, borderRadius: '20px', background: PLATFORM_STATUS_COLORS[target.platform_status]?.bg, color: PLATFORM_STATUS_COLORS[target.platform_status]?.text }}>{target.platform_status}</span>
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            <select
                              value={target.platform_status}
                              onChange={(e) => handleUpdateTarget(target.id, { platform_status: e.target.value as PlatformStatus })}
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                            >
                              {PLATFORM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div style={{ marginBottom: '8px' }}>
                            <input
                              type="text"
                              value={target.permalink || ''}
                              onChange={(e) => handleUpdateTarget(target.id, { permalink: e.target.value })}
                              placeholder="Enter permalink after posting"
                              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }}
                            />
                          </div>

                          {target.platform_status !== 'published' && (
                            <button
                              onClick={() => handleMarkAsPublished(target)}
                              style={{ width: '100%', padding: '8px', fontSize: '13px', fontWeight: 500, borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer' }}
                            >
                              Mark as Published
                            </button>
                          )}

                          {target.manual_posted_at && (
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                              Published by {target.manual_posted_by_name} on {new Date(target.manual_posted_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Drawer Footer */}
              <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => { if (selectedPost) { setIsEditing(false) } else { setShowPostDrawer(false) } }} style={{ flex: 1, padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSavePost} style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 500, borderRadius: '8px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '10px', fontSize: '14px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                    <button onClick={handleDeletePost} style={{ padding: '10px 20px', fontSize: '14px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
