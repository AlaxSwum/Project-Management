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
  const companyId = params?.companyId as string || ''

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
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
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
    content_text: '',
    drive_link: '',
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
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (error) throw error
      setCompany(data)
    } catch (err) {
      router.push('/content-calendar')
    }
  }, [companyId, router])

  const fetchMembers = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_members').select('*').eq('company_id', companyId)
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
      
      const postsWithTargets = await Promise.all((postsData || []).map(async (post) => {
        const { data: targets } = await supabase.from('content_post_targets').select('*').eq('post_id', post.id)
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
      content_text: '',
      drive_link: '',
      platforms: ['facebook']
    })
  }

  const openNewPost = (date?: string) => {
    resetForm()
    if (date) setPostForm(prev => ({ ...prev, planned_date: date }))
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
      content_text: (post as any).content_text || '',
      drive_link: (post as any).drive_link || '',
      platforms: post.targets?.map(t => t.platform) || ['facebook']
    })
    setIsEditing(false)
    setShowPostDrawer(true)
  }

  const handleSavePost = async () => {
    if (!postForm.title.trim()) { alert('Enter post title'); return }
    if (postForm.platforms.length === 0) { alert('Select at least one platform'); return }

    try {
      const { supabase } = await import('@/lib/supabase')
      
      const postData = {
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
      }
      
      if (selectedPost) {
        const { error } = await supabase.from('content_posts').update(postData).eq('id', selectedPost.id)
        if (error) throw error
        
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
        const { data: newPost, error } = await supabase
          .from('content_posts')
          .insert({ ...postData, company_id: companyId, created_by: String(user?.id) })
          .select()
          .single()
        if (error) throw error
        
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
      
      if (selectedPost) {
        const { data } = await supabase.from('content_posts').select('*').eq('id', selectedPost.id).single()
        if (data) {
          const { data: targets } = await supabase.from('content_post_targets').select('*').eq('post_id', data.id)
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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      alert('Failed to copy')
    }
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
      const key = new Date(post.planned_date).toDateString()
      if (!map[key]) map[key] = []
      map[key].push(post)
    })
    return map
  }, [posts])

  if (authLoading || !company) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title={company.name} isMobile={isMobile} />}

        {/* Header */}
        <header style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', padding: '16px 32px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => router.push('/content-calendar')} style={{ padding: '10px 16px', fontSize: '14px', fontWeight: 500, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                Back
              </button>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{company.name}</h1>
                <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>Content Calendar</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '4px' }}>
                {(['calendar', 'sheet'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === mode ? '#fff' : 'transparent', color: viewMode === mode ? '#4f46e5' : '#fff', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                    {mode}
                  </button>
                ))}
              </div>
              
              <button onClick={() => router.push(`/content-calendar/${companyId}/reports`)} style={{ padding: '10px 20px', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
                Reports
              </button>

              <button onClick={() => openNewPost()} style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', background: '#fff', color: '#4f46e5', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
                + New Post
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: Calendar/Sheet */}
          <div style={{ flex: showPostDrawer ? '0 0 60%' : 1, padding: '24px', overflow: 'auto', transition: 'flex 0.3s' }}>
            {viewMode === 'calendar' ? (
              <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{monthName}</h2>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setCurrentMonth(new Date())} style={{ padding: '8px 16px', fontSize: '13px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#475569' }}>Today</button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ padding: '8px 12px', fontSize: '13px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#475569' }}>Prev</button>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ padding: '8px 12px', fontSize: '13px', border: '2px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', color: '#475569' }}>Next</button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d}</div>
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
                        style={{ minHeight: '100px', padding: '8px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', cursor: 'pointer', background: day.isCurrentMonth ? '#fff' : '#f8fafc', transition: 'background 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                        onMouseOut={(e) => e.currentTarget.style.background = day.isCurrentMonth ? '#fff' : '#f8fafc'}
                      >
                        <div style={{ display: day.isToday ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center', width: day.isToday ? '28px' : 'auto', height: day.isToday ? '28px' : 'auto', fontSize: '13px', fontWeight: 600, marginBottom: '6px', borderRadius: '50%', background: day.isToday ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : 'transparent', color: day.isToday ? '#fff' : day.isCurrentMonth ? '#1e293b' : '#94a3b8' }}>
                          {day.date.getDate()}
                        </div>
                        {dayPosts.slice(0, 3).map(post => (
                          <div
                            key={post.id}
                            onClick={(e) => { e.stopPropagation(); openPostDetails(post) }}
                            style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text, cursor: 'pointer', fontWeight: 500, transition: 'transform 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {post.title}
                          </div>
                        ))}
                        {dayPosts.length > 3 && <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', fontWeight: 500 }}>+{dayPosts.length - 3} more</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'auto' }}>
                {posts.length === 0 ? (
                  <div style={{ padding: '80px 24px', textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>No posts yet</h3>
                    <p style={{ color: '#64748b' }}>Click "+ New Post" to create content</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                        {['Title', 'Type', 'Date', 'Platforms', 'Status', 'Owner'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map(post => (
                        <tr key={post.id} onClick={() => openPostDetails(post)} style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.background = '#fff'}>
                          <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1e293b' }}>{post.title}</td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{post.content_type}</td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{new Date(post.planned_date).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {post.targets?.map(t => (
                                <span key={t.platform} style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLATFORM_COLORS[t.platform], boxShadow: `0 0 0 2px ${PLATFORM_COLORS[t.platform]}33` }} title={t.platform} />
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '20px', background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.status}</span>
                          </td>
                          <td style={{ padding: '14px 16px', color: '#475569' }}>{post.owner_name || '-'}</td>
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
            <div style={{ width: '40%', minWidth: '420px', background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-4px 0 20px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {isEditing ? (selectedPost ? 'Edit Post' : 'New Post') : 'Post Details'}
                </h3>
                <button onClick={() => { setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false) }} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>x</button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
                {isEditing ? (
                  /* Edit Form */
                  <>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Title *</label>
                      <input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Post title" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = '#4f46e5'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Platforms *</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                        {PLATFORMS.map(p => (
                          <button key={p} type="button" onClick={() => setPostForm(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }))} style={{ padding: '10px 18px', fontSize: '13px', border: postForm.platforms.includes(p) ? `2px solid ${PLATFORM_COLORS[p]}` : '2px solid #e2e8f0', borderRadius: '10px', background: postForm.platforms.includes(p) ? `${PLATFORM_COLORS[p]}15` : '#fff', color: postForm.platforms.includes(p) ? PLATFORM_COLORS[p] : '#475569', cursor: 'pointer', fontWeight: postForm.platforms.includes(p) ? 600 : 500, textTransform: 'capitalize', transition: 'all 0.2s' }}>
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Content Type</label>
                        <select value={postForm.content_type} onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value as ContentType })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                          {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Status</label>
                        <select value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value as PostStatus })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                          {POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Planned Date</label>
                        <input type="date" value={postForm.planned_date} onChange={(e) => setPostForm({ ...postForm, planned_date: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Planned Time</label>
                        <input type="time" value={postForm.planned_time} onChange={(e) => setPostForm({ ...postForm, planned_time: e.target.value })} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Content Owner</label>
                        <select value={postForm.owner_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, owner_id: e.target.value, owner_name: m?.user_name || '' }) }} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                          <option value="">Select</option>
                          {members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Designer</label>
                        <select value={postForm.designer_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, designer_id: e.target.value, designer_name: m?.user_name || '' }) }} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none' }}>
                          <option value="">Select</option>
                          {members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Description / Caption</label>
                      <textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Post description or caption" rows={4} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Visual Concept</label>
                      <textarea value={postForm.visual_concept} onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })} placeholder="Visual concept notes" rows={2} style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', resize: 'none', boxSizing: 'border-box', outline: 'none' }} />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Hashtags</label>
                      <input type="text" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#hashtag1 #hashtag2" style={{ width: '100%', padding: '12px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                  </>
                ) : selectedPost ? (
                  /* View Details */
                  <>
                    <div style={{ marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', margin: '0 0 12px 0' }}>{selectedPost.title}</h4>
                      <span style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, borderRadius: '20px', background: STATUS_COLORS[selectedPost.status]?.bg, color: STATUS_COLORS[selectedPost.status]?.text }}>{selectedPost.status}</span>
                    </div>

                    {/* Copy-to-Post Section */}
                    <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '2px solid #bbf7d0' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#166534', margin: '0 0 16px 0' }}>Ready to Post</h5>
                      
                      {selectedPost.description && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>Caption / Content</span>
                            <button onClick={() => copyToClipboard(selectedPost.description || '', 'caption')} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, border: 'none', borderRadius: '6px', background: copiedField === 'caption' ? '#16a34a' : '#22c55e', color: '#fff', cursor: 'pointer' }}>
                              {copiedField === 'caption' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#1e293b', lineHeight: 1.6, border: '1px solid #d1fae5' }}>
                            {selectedPost.description}
                          </div>
                        </div>
                      )}

                      {selectedPost.hashtags && (
                        <div style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#15803d' }}>Hashtags</span>
                            <button onClick={() => copyToClipboard(selectedPost.hashtags || '', 'hashtags')} style={{ padding: '6px 12px', fontSize: '11px', fontWeight: 600, border: 'none', borderRadius: '6px', background: copiedField === 'hashtags' ? '#16a34a' : '#22c55e', color: '#fff', cursor: 'pointer' }}>
                              {copiedField === 'hashtags' ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                          <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#1e293b', border: '1px solid #d1fae5' }}>
                            {selectedPost.hashtags}
                          </div>
                        </div>
                      )}

                      {selectedPost.description && selectedPost.hashtags && (
                        <button onClick={() => copyToClipboard(`${selectedPost.description}\n\n${selectedPost.hashtags}`, 'all')} style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600, border: 'none', borderRadius: '8px', background: copiedField === 'all' ? '#16a34a' : '#22c55e', color: '#fff', cursor: 'pointer' }}>
                          {copiedField === 'all' ? 'Copied All!' : 'Copy Caption + Hashtags'}
                        </button>
                      )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Planned Date</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>{new Date(selectedPost.planned_date).toLocaleDateString()} {selectedPost.planned_time || ''}</div>
                    </div>

                    {selectedPost.visual_concept && (
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Visual Concept</div>
                        <div style={{ fontSize: '14px', color: '#1e293b', lineHeight: 1.6 }}>{selectedPost.visual_concept}</div>
                      </div>
                    )}

                    {/* Platform Targets */}
                    <div style={{ marginBottom: '24px' }}>
                      <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '0 0 16px 0' }}>Platform Targets</h5>
                      {selectedPost.targets?.map(target => (
                        <div key={target.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '12px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: PLATFORM_COLORS[target.platform], boxShadow: `0 0 0 3px ${PLATFORM_COLORS[target.platform]}33` }} />
                              <span style={{ fontWeight: 600, textTransform: 'capitalize', color: '#1e293b' }}>{target.platform}</span>
                            </div>
                            <span style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 600, borderRadius: '20px', background: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.bg || '#f1f5f9', color: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.text || '#475569' }}>{target.platform_status}</span>
                          </div>
                          
                          <div style={{ marginBottom: '12px' }}>
                            <select value={target.platform_status} onChange={(e) => handleUpdateTarget(target.id, { platform_status: e.target.value as PlatformStatus })} style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                              {PLATFORM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>

                          <div style={{ marginBottom: '12px' }}>
                            <input type="text" value={target.permalink || ''} onChange={(e) => handleUpdateTarget(target.id, { permalink: e.target.value })} placeholder="Enter permalink after posting" style={{ width: '100%', padding: '10px 14px', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                          </div>

                          {target.platform_status !== 'published' && (
                            <button onClick={() => handleMarkAsPublished(target)} style={{ width: '100%', padding: '12px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)' }}>
                              Mark as Published
                            </button>
                          )}

                          {target.manual_posted_at && (
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '12px', padding: '10px', background: '#fff', borderRadius: '6px' }}>
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
              <div style={{ padding: '20px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', background: '#f8fafc' }}>
                {isEditing ? (
                  <>
                    <button onClick={() => { if (selectedPost) { setIsEditing(false) } else { setShowPostDrawer(false) } }} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                    <button onClick={handleSavePost} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)' }}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '14px', fontSize: '14px', fontWeight: 500, border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer' }}>Edit</button>
                    <button onClick={handleDeletePost} style={{ padding: '14px 24px', fontSize: '14px', fontWeight: 500, border: '2px solid #fecaca', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
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
