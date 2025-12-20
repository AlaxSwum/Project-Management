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

interface PlatformBudget {
  platform: Platform
  budget: number
}

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
    title: '', description: '', content_type: 'static' as ContentType, category: '', status: 'draft' as PostStatus,
    planned_date: new Date().toISOString().split('T')[0], planned_time: '', content_deadline: '', graphic_deadline: '',
    owner_id: '', owner_name: '', designer_id: '', designer_name: '', hashtags: '', visual_concept: '', key_points: '',
    media_buying_notes: '', media_budget: 0, platforms: ['facebook'] as Platform[]
  })
  
  const [platformBudgets, setPlatformBudgets] = useState<PlatformBudget[]>([])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (!authLoading && !isAuthenticated) router.push('/login') }, [authLoading, isAuthenticated, router])

  const fetchCompany = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).single()
      if (error) throw error
      setCompany(data)
    } catch (err) { router.push('/content-calendar') }
  }, [companyId, router])

  const fetchMembers = useCallback(async () => {
    if (!companyId) return
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('company_members').select('*').eq('company_id', companyId)
      setMembers(data || [])
    } catch (err) { console.error('Error:', err) }
  }, [companyId])

  const fetchPosts = useCallback(async () => {
    if (!companyId) return
    setIsLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: postsData, error } = await supabase.from('content_posts').select('*').eq('company_id', companyId).order('planned_date', { ascending: true })
      if (error) throw error
      const postsWithTargets = await Promise.all((postsData || []).map(async (post) => {
        const { data: targets } = await supabase.from('content_post_targets').select('*').eq('post_id', post.id)
        return { ...post, targets: targets || [] }
      }))
      setPosts(postsWithTargets)
    } catch (err) { console.error('Error:', err); setPosts([]) } finally { setIsLoading(false) }
  }, [companyId])

  useEffect(() => { if (user?.id && companyId) { fetchCompany(); fetchMembers(); fetchPosts() } }, [user?.id, companyId, fetchCompany, fetchMembers, fetchPosts])

  const resetForm = () => {
    setPostForm({ title: '', description: '', content_type: 'static', category: '', status: 'draft', planned_date: new Date().toISOString().split('T')[0], planned_time: '', content_deadline: '', graphic_deadline: '', owner_id: '', owner_name: '', designer_id: '', designer_name: '', hashtags: '', visual_concept: '', key_points: '', media_buying_notes: '', media_budget: 0, platforms: ['facebook'] })
    setPlatformBudgets([{ platform: 'facebook', budget: 0 }])
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
      title: post.title, description: post.description || '', content_type: post.content_type, category: post.category || '',
      status: post.status, planned_date: post.planned_date, planned_time: post.planned_time || '',
      content_deadline: post.content_deadline || '', graphic_deadline: post.graphic_deadline || '',
      owner_id: post.owner_id || '', owner_name: post.owner_name || '', designer_id: post.designer_id || '',
      designer_name: post.designer_name || '', hashtags: post.hashtags || '', visual_concept: post.visual_concept || '',
      key_points: post.key_points || '', media_buying_notes: post.media_buying_notes || '', media_budget: post.media_budget || 0,
      platforms: post.targets?.map(t => t.platform) || ['facebook']
    })
    setPlatformBudgets(post.targets?.map(t => ({ platform: t.platform, budget: t.ad_budget || 0 })) || [])
    setIsEditing(false)
    setShowPostDrawer(true)
  }

  const handlePlatformToggle = (platform: Platform) => {
    const isSelected = postForm.platforms.includes(platform)
    if (isSelected) {
      setPostForm(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }))
      setPlatformBudgets(prev => prev.filter(pb => pb.platform !== platform))
    } else {
      setPostForm(prev => ({ ...prev, platforms: [...prev.platforms, platform] }))
      setPlatformBudgets(prev => [...prev, { platform, budget: 0 }])
    }
  }

  const handleBudgetChange = (platform: Platform, budget: number) => {
    setPlatformBudgets(prev => prev.map(pb => pb.platform === platform ? { ...pb, budget } : pb))
  }

  const handleSavePost = async () => {
    if (!postForm.title.trim()) { alert('Enter post title'); return }
    if (postForm.platforms.length === 0) { alert('Select at least one platform'); return }
    try {
      const { supabase } = await import('@/lib/supabase')
      const totalBudget = platformBudgets.reduce((sum, pb) => sum + pb.budget, 0)
      const postData = {
        title: postForm.title, description: postForm.description, content_type: postForm.content_type,
        category: postForm.category, status: postForm.status, planned_date: postForm.planned_date,
        planned_time: postForm.planned_time || null, content_deadline: postForm.content_deadline || null,
        graphic_deadline: postForm.graphic_deadline || null, owner_id: postForm.owner_id || null,
        owner_name: postForm.owner_name || null, designer_id: postForm.designer_id || null,
        designer_name: postForm.designer_name || null, hashtags: postForm.hashtags, visual_concept: postForm.visual_concept,
        key_points: postForm.key_points, media_buying_notes: postForm.media_buying_notes, media_budget: totalBudget
      }
      
      if (selectedPost) {
        const { error } = await supabase.from('content_posts').update(postData).eq('id', selectedPost.id)
        if (error) throw error
        await supabase.from('content_post_targets').delete().eq('post_id', selectedPost.id)
        for (const platform of postForm.platforms) {
          const existing = selectedPost.targets?.find(t => t.platform === platform)
          const budget = platformBudgets.find(pb => pb.platform === platform)?.budget || 0
          await supabase.from('content_post_targets').insert({
            post_id: selectedPost.id, platform, platform_status: existing?.platform_status || 'planned',
            publish_at: existing?.publish_at || null, permalink: existing?.permalink || null,
            manual_posted_by: existing?.manual_posted_by || null, manual_posted_by_name: existing?.manual_posted_by_name || null,
            manual_posted_at: existing?.manual_posted_at || null, ad_budget: budget, notes: existing?.notes || null
          })
        }
      } else {
        const { data: newPost, error } = await supabase.from('content_posts').insert({ ...postData, company_id: companyId, created_by: String(user?.id) }).select().single()
        if (error) throw error
        for (const platform of postForm.platforms) {
          const budget = platformBudgets.find(pb => pb.platform === platform)?.budget || 0
          await supabase.from('content_post_targets').insert({ post_id: newPost.id, platform, platform_status: 'planned', ad_budget: budget })
        }
      }
      setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false); fetchPosts()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleDeletePost = async () => {
    if (!selectedPost || !confirm('Delete this post?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('content_posts').delete().eq('id', selectedPost.id)
      setShowPostDrawer(false); setSelectedPost(null); fetchPosts()
    } catch (err: any) { alert('Error: ' + err.message) }
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
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  const handleMarkAsPublished = async (target: ContentPostTarget) => {
    await handleUpdateTarget(target.id, { platform_status: 'published', manual_posted_by: String(user?.id), manual_posted_by_name: user?.name || user?.email, manual_posted_at: new Date().toISOString() })
  }

  const copyToClipboard = async (text: string, field: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedField(field); setTimeout(() => setCopiedField(null), 2000) } catch { alert('Failed to copy') }
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay(), days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
    const today = new Date()
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), isCurrentMonth: false, isToday: false })
    for (let i = 1; i <= lastDay.getDate(); i++) { const date = new Date(year, month, i); days.push({ date, isCurrentMonth: true, isToday: date.toDateString() === today.toDateString() }) }
    while (days.length < 42) days.push({ date: new Date(year, month + 1, days.length - lastDay.getDate() - startOffset + 1), isCurrentMonth: false, isToday: false })
    return days
  }, [currentMonth])

  const postsByDate = useMemo(() => { const map: Record<string, ContentPost[]> = {}; posts.forEach(post => { const key = new Date(post.planned_date).toDateString(); if (!map[key]) map[key] = []; map[key].push(post) }); return map }, [posts])

  const totalBudget = useMemo(() => posts.reduce((sum, p) => sum + (p.media_budget || 0), 0), [posts])

  if (authLoading || !company) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5ED' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #C483D9', borderTop: '3px solid #5884FD', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div>
      <MobileHeader title={company.name} isMobile={isMobile} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #F5F5ED; }
        .cal-container { min-height: 100vh; display: flex; background: #F5F5ED; }
        .cal-main { flex: 1; margin-left: ${isMobile ? '0' : '256px'}; display: flex; flex-direction: column; background: #F5F5ED; padding-top: ${isMobile ? '70px' : '0'}; }
        .cal-header { padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: #fff; border-bottom: 1px solid #e8e8e8; }
        .cal-nav { display: flex; align-items: center; gap: 1rem; }
        .cal-back { padding: 0.625rem 1rem; font-size: 0.9rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 10px; background: #fff; cursor: pointer; color: #333; }
        .cal-title { font-size: 1.5rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .cal-subtitle { font-size: 0.85rem; color: #666; margin: 0.25rem 0 0 0; }
        .cal-budget-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .cal-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .cal-toggle { display: flex; background: #f5f5f5; border-radius: 10px; padding: 4px; }
        .cal-toggle-btn { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; background: transparent; color: #666; }
        .cal-toggle-btn.active { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .cal-btn-secondary { padding: 0.625rem 1.25rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #e8e8e8; border-radius: 10px; background: #fff; cursor: pointer; color: #333; }
        .cal-btn-primary { padding: 0.625rem 1.5rem; font-size: 0.9rem; font-weight: 500; border-radius: 10px; border: none; background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; cursor: pointer; box-shadow: 0 4px 14px rgba(196, 131, 217, 0.3); }
        .cal-content { flex: 1; display: flex; overflow: hidden; padding: 1.5rem 2rem; gap: 1.5rem; }
        .cal-left { flex: ${showPostDrawer ? '0 0 58%' : '1'}; overflow: auto; }
        .cal-calendar { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e8e8; }
        .cal-cal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; }
        .cal-month { font-size: 1.125rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .cal-cal-nav { display: flex; gap: 0.5rem; }
        .cal-cal-btn { padding: 0.5rem 1rem; font-size: 0.85rem; border: 1px solid #e8e8e8; border-radius: 8px; background: #fff; cursor: pointer; color: #333; }
        .cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #f0f0f0; }
        .cal-day-header { padding: 0.75rem 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: #666; text-transform: uppercase; }
        .cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .cal-day { min-height: 90px; padding: 0.5rem; border-bottom: 1px solid #f5f5f5; border-right: 1px solid #f5f5f5; cursor: pointer; background: #fff; }
        .cal-day:hover { background: #fafafa; }
        .cal-day.other { background: #fafafa; }
        .cal-day-num { font-size: 0.85rem; font-weight: 500; margin-bottom: 0.375rem; color: #1a1a1a; }
        .cal-day-num.other { color: #bbb; }
        .cal-day-num.today { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); color: #fff; }
        .cal-post { font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; font-weight: 500; }
        .cal-more { font-size: 0.65rem; color: #666; text-align: center; font-weight: 500; }
        .cal-drawer { width: 42%; min-width: 420px; background: #fff; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #e8e8e8; }
        .cal-drawer-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; display: flex; align-items: center; justify-content: space-between; background: #fafafa; }
        .cal-drawer-title { font-size: 1.125rem; font-weight: 500; color: #1a1a1a; margin: 0; }
        .cal-drawer-close { background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; }
        .cal-drawer-body { flex: 1; overflow: auto; padding: 1.5rem; }
        .cal-drawer-footer { padding: 1rem 1.5rem; border-top: 1px solid #f0f0f0; display: flex; gap: 0.75rem; background: #fafafa; }
        .cal-form-group { margin-bottom: 1.25rem; }
        .cal-label { display: block; font-size: 0.85rem; font-weight: 500; color: #333; margin-bottom: 0.5rem; }
        .cal-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; font-size: 0.9rem; box-sizing: border-box; outline: none; }
        .cal-input:focus { border-color: #C483D9; }
        .cal-textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid #e8e8e8; border-radius: 10px; font-size: 0.9rem; resize: none; box-sizing: border-box; outline: none; }
        .cal-platforms { display: flex; flex-direction: column; gap: 0.75rem; }
        .cal-platform-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #fafafa; border-radius: 10px; border: 1px solid #e8e8e8; }
        .cal-platform-row.active { border-color: #C483D9; background: #fdf4ff; }
        .cal-platform-check { width: 20px; height: 20px; border-radius: 4px; border: 2px solid #e8e8e8; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cal-platform-check.active { background: linear-gradient(135deg, #C483D9 0%, #5884FD 100%); border-color: #C483D9; color: #fff; }
        .cal-platform-name { flex: 1; font-weight: 500; text-transform: capitalize; }
        .cal-platform-budget { width: 120px; padding: 0.5rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.85rem; text-align: right; }
        .cal-copy-section { background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #bbf7d0; }
        .cal-copy-title { font-size: 0.9rem; font-weight: 600; color: #166534; margin: 0 0 1rem 0; }
        .cal-copy-item { margin-bottom: 1rem; }
        .cal-copy-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .cal-copy-item-label { font-size: 0.8rem; font-weight: 500; color: #15803d; }
        .cal-copy-btn { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border: none; border-radius: 6px; background: #22c55e; color: #fff; cursor: pointer; }
        .cal-copy-btn.copied { background: #16a34a; }
        .cal-copy-content { background: #fff; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; color: #1a1a1a; line-height: 1.5; border: 1px solid #bbf7d0; }
        .cal-target { background: #fafafa; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid #e8e8e8; }
        .cal-target-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .cal-target-platform { display: flex; align-items: center; gap: 0.5rem; }
        .cal-target-dot { width: 12px; height: 12px; border-radius: 50%; }
        .cal-target-name { font-weight: 500; text-transform: capitalize; color: #1a1a1a; }
        .cal-target-budget { font-size: 0.85rem; font-weight: 600; color: #10b981; }
        .cal-target-status { padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 500; border-radius: 20px; }
        .cal-target-select { width: 100%; padding: 0.625rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.5rem; }
        .cal-target-input { width: 100%; padding: 0.625rem; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.5rem; box-sizing: border-box; }
        .cal-target-publish-btn { width: 100%; padding: 0.75rem; font-size: 0.85rem; font-weight: 500; border-radius: 8px; border: none; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; cursor: pointer; }
        .cal-target-published { font-size: 0.8rem; color: #666; margin-top: 0.75rem; padding: 0.625rem; background: #fff; border-radius: 6px; }
        .cal-sheet { background: #fff; border-radius: 16px; overflow: auto; border: 1px solid #e8e8e8; }
        .cal-table { width: 100%; border-collapse: collapse; min-width: 1000px; font-size: 0.85rem; }
        .cal-table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #666; border-bottom: 2px solid #f0f0f0; background: #fafafa; }
        .cal-table td { padding: 1rem; border-bottom: 1px solid #f5f5f5; }
        .cal-table tr:hover { background: #fafafa; cursor: pointer; }
        .cal-status-badge { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border-radius: 20px; }
        .cal-empty { padding: 4rem 1.5rem; text-align: center; }
        .cal-empty-icon { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #f0e6f5 0%, #e6f0ff 100%); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
      `}} />

      <div className="cal-container">
        {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
        <main className="cal-main">
          <header className="cal-header">
            <div className="cal-nav">
              <button onClick={() => router.push('/content-calendar')} className="cal-back">Back</button>
              <div>
                <h1 className="cal-title">{company.name}</h1>
                <p className="cal-subtitle">Content Calendar</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="cal-budget-badge">Total Budget: ${totalBudget.toLocaleString()}</div>
            </div>
            <div className="cal-actions">
              <div className="cal-toggle">
                {(['calendar', 'sheet'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`cal-toggle-btn ${viewMode === mode ? 'active' : ''}`}>{mode}</button>
                ))}
              </div>
              <button onClick={() => router.push(`/content-calendar/${companyId}/reports`)} className="cal-btn-secondary">Reports</button>
              <button onClick={() => openNewPost()} className="cal-btn-primary">+ New Post</button>
            </div>
          </header>

          <div className="cal-content">
            <div className="cal-left">
              {viewMode === 'calendar' ? (
                <div className="cal-calendar">
                  <div className="cal-cal-header">
                    <h2 className="cal-month">{monthName}</h2>
                    <div className="cal-cal-nav">
                      <button onClick={() => setCurrentMonth(new Date())} className="cal-cal-btn">Today</button>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="cal-cal-btn">Prev</button>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="cal-cal-btn">Next</button>
                    </div>
                  </div>
                  <div className="cal-days-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="cal-day-header">{d}</div>)}
                  </div>
                  <div className="cal-days-grid">
                    {calendarDays.map((day, idx) => {
                      const dayPosts = postsByDate[day.date.toDateString()] || []
                      const dateStr = day.date.toISOString().split('T')[0]
                      return (
                        <div key={idx} onClick={() => openNewPost(dateStr)} className={`cal-day ${!day.isCurrentMonth ? 'other' : ''}`}>
                          <div className={`cal-day-num ${!day.isCurrentMonth ? 'other' : ''} ${day.isToday ? 'today' : ''}`}>{day.date.getDate()}</div>
                          {dayPosts.slice(0, 3).map(post => (
                            <div key={post.id} onClick={(e) => { e.stopPropagation(); openPostDetails(post) }} className="cal-post" style={{ background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.title}</div>
                          ))}
                          {dayPosts.length > 3 && <div className="cal-more">+{dayPosts.length - 3} more</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="cal-sheet">
                  {posts.length === 0 ? (
                    <div className="cal-empty">
                      <div className="cal-empty-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C483D9" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg></div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.5rem 0' }}>No posts yet</h3>
                      <p style={{ color: '#666' }}>Click "+ New Post" to create content</p>
                    </div>
                  ) : (
                    <table className="cal-table">
                      <thead><tr>{['Title', 'Type', 'Date', 'Platforms', 'Budget', 'Status', 'Owner'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                      <tbody>
                        {posts.map(post => (
                          <tr key={post.id} onClick={() => openPostDetails(post)}>
                            <td style={{ fontWeight: 500, color: '#1a1a1a' }}>{post.title}</td>
                            <td style={{ color: '#666' }}>{post.content_type}</td>
                            <td style={{ color: '#666' }}>{new Date(post.planned_date).toLocaleDateString()}</td>
                            <td><div style={{ display: 'flex', gap: '4px' }}>{post.targets?.map(t => <span key={t.platform} style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLATFORM_COLORS[t.platform] }} title={t.platform} />)}</div></td>
                            <td style={{ fontWeight: 600, color: '#10b981' }}>${(post.media_budget || 0).toLocaleString()}</td>
                            <td><span className="cal-status-badge" style={{ background: STATUS_COLORS[post.status]?.bg, color: STATUS_COLORS[post.status]?.text }}>{post.status}</span></td>
                            <td style={{ color: '#666' }}>{post.owner_name || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {showPostDrawer && (
              <div className="cal-drawer">
                <div className="cal-drawer-header">
                  <h3 className="cal-drawer-title">{isEditing ? (selectedPost ? 'Edit Post' : 'New Post') : 'Post Details'}</h3>
                  <button onClick={() => { setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false) }} className="cal-drawer-close">x</button>
                </div>
                <div className="cal-drawer-body">
                  {isEditing ? (
                    <>
                      <div className="cal-form-group"><label className="cal-label">Title *</label><input type="text" value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} placeholder="Post title" className="cal-input" /></div>
                      
                      <div className="cal-form-group">
                        <label className="cal-label">Platforms & Budget *</label>
                        <div className="cal-platforms">
                          {PLATFORMS.map(p => {
                            const isActive = postForm.platforms.includes(p)
                            const budget = platformBudgets.find(pb => pb.platform === p)?.budget || 0
                            return (
                              <div key={p} className={`cal-platform-row ${isActive ? 'active' : ''}`}>
                                <div className={`cal-platform-check ${isActive ? 'active' : ''}`} onClick={() => handlePlatformToggle(p)}>
                                  {isActive && <span style={{ fontSize: '12px' }}>✓</span>}
                                </div>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: PLATFORM_COLORS[p] }} />
                                <span className="cal-platform-name">{p}</span>
                                {isActive && (
                                  <input type="number" value={budget} onChange={(e) => handleBudgetChange(p, Number(e.target.value))} placeholder="Budget" className="cal-platform-budget" />
                                )}
                              </div>
                            )
                          })}
                        </div>
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#f0fff4', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#166534', fontWeight: 500 }}>Total Ad Budget:</span>
                          <span style={{ color: '#166534', fontWeight: 700 }}>${platformBudgets.reduce((sum, pb) => sum + pb.budget, 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="cal-form-group"><label className="cal-label">Content Type</label><select value={postForm.content_type} onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value as ContentType })} className="cal-input">{CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div className="cal-form-group"><label className="cal-label">Status</label><select value={postForm.status} onChange={(e) => setPostForm({ ...postForm, status: e.target.value as PostStatus })} className="cal-input">{POST_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="cal-form-group"><label className="cal-label">Planned Date</label><input type="date" value={postForm.planned_date} onChange={(e) => setPostForm({ ...postForm, planned_date: e.target.value })} className="cal-input" /></div>
                        <div className="cal-form-group"><label className="cal-label">Planned Time</label><input type="time" value={postForm.planned_time} onChange={(e) => setPostForm({ ...postForm, planned_time: e.target.value })} className="cal-input" /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="cal-form-group"><label className="cal-label">Content Owner</label><select value={postForm.owner_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, owner_id: e.target.value, owner_name: m?.user_name || '' }) }} className="cal-input"><option value="">Select</option>{members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}</select></div>
                        <div className="cal-form-group"><label className="cal-label">Designer</label><select value={postForm.designer_id} onChange={(e) => { const m = members.find(x => x.user_id === e.target.value); setPostForm({ ...postForm, designer_id: e.target.value, designer_name: m?.user_name || '' }) }} className="cal-input"><option value="">Select</option>{members.map(m => <option key={m.id} value={m.user_id}>{m.user_name}</option>)}</select></div>
                      </div>
                      <div className="cal-form-group"><label className="cal-label">Description / Caption</label><textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Post description or caption" rows={4} className="cal-textarea" /></div>
                      <div className="cal-form-group"><label className="cal-label">Visual Concept</label><textarea value={postForm.visual_concept} onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })} placeholder="Visual concept notes" rows={2} className="cal-textarea" /></div>
                      <div className="cal-form-group"><label className="cal-label">Hashtags</label><input type="text" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#hashtag1 #hashtag2" className="cal-input" /></div>
                    </>
                  ) : selectedPost ? (
                    <>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 500, color: '#1a1a1a', margin: '0 0 0.75rem 0' }}>{selectedPost.title}</h4>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span className="cal-status-badge" style={{ background: STATUS_COLORS[selectedPost.status]?.bg, color: STATUS_COLORS[selectedPost.status]?.text }}>{selectedPost.status}</span>
                          <span style={{ color: '#10b981', fontWeight: 600 }}>Total: ${(selectedPost.media_budget || 0).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {(selectedPost.description || selectedPost.hashtags) && (
                        <div className="cal-copy-section">
                          <h5 className="cal-copy-title">Ready to Post</h5>
                          {selectedPost.description && (
                            <div className="cal-copy-item">
                              <div className="cal-copy-item-header">
                                <span className="cal-copy-item-label">Caption / Content</span>
                                <button onClick={() => copyToClipboard(selectedPost.description || '', 'caption')} className={`cal-copy-btn ${copiedField === 'caption' ? 'copied' : ''}`}>{copiedField === 'caption' ? 'Copied!' : 'Copy'}</button>
                              </div>
                              <div className="cal-copy-content">{selectedPost.description}</div>
                            </div>
                          )}
                          {selectedPost.hashtags && (
                            <div className="cal-copy-item">
                              <div className="cal-copy-item-header">
                                <span className="cal-copy-item-label">Hashtags</span>
                                <button onClick={() => copyToClipboard(selectedPost.hashtags || '', 'hashtags')} className={`cal-copy-btn ${copiedField === 'hashtags' ? 'copied' : ''}`}>{copiedField === 'hashtags' ? 'Copied!' : 'Copy'}</button>
                              </div>
                              <div className="cal-copy-content">{selectedPost.hashtags}</div>
                            </div>
                          )}
                          {selectedPost.description && selectedPost.hashtags && (
                            <button onClick={() => copyToClipboard(`${selectedPost.description}\n\n${selectedPost.hashtags}`, 'all')} className="cal-copy-btn" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>{copiedField === 'all' ? 'Copied All!' : 'Copy Caption + Hashtags'}</button>
                          )}
                        </div>
                      )}
                      
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Planned Date</div>
                        <div style={{ fontSize: '1rem', fontWeight: 500, color: '#1a1a1a' }}>{new Date(selectedPost.planned_date).toLocaleDateString()} {selectedPost.planned_time || ''}</div>
                      </div>
                      
                      <div style={{ marginBottom: '1.5rem' }}>
                        <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 1rem 0' }}>Platform Targets</h5>
                        {selectedPost.targets?.map(target => (
                          <div key={target.id} className="cal-target">
                            <div className="cal-target-header">
                              <div className="cal-target-platform">
                                <span className="cal-target-dot" style={{ background: PLATFORM_COLORS[target.platform] }} />
                                <span className="cal-target-name">{target.platform}</span>
                                <span className="cal-target-budget">${(target.ad_budget || 0).toLocaleString()}</span>
                              </div>
                              <span className="cal-target-status" style={{ background: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.bg || '#f0f0f0', color: (PLATFORM_STATUS_COLORS as any)[target.platform_status]?.text || '#666' }}>{target.platform_status}</span>
                            </div>
                            <select value={target.platform_status} onChange={(e) => handleUpdateTarget(target.id, { platform_status: e.target.value as PlatformStatus })} className="cal-target-select">{PLATFORM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select>
                            <input type="text" value={target.permalink || ''} onChange={(e) => handleUpdateTarget(target.id, { permalink: e.target.value })} placeholder="Enter permalink after posting" className="cal-target-input" />
                            {target.platform_status !== 'published' && <button onClick={() => handleMarkAsPublished(target)} className="cal-target-publish-btn">Mark as Published</button>}
                            {target.manual_posted_at && <div className="cal-target-published">Published by {target.manual_posted_by_name} on {new Date(target.manual_posted_at).toLocaleString()}</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="cal-drawer-footer">
                  {isEditing ? (
                    <>
                      <button onClick={() => { if (selectedPost) setIsEditing(false); else setShowPostDrawer(false) }} className="cal-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                      <button onClick={handleSavePost} className="cal-btn-primary" style={{ flex: 1 }}>Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(true)} className="cal-btn-secondary" style={{ flex: 1 }}>Edit</button>
                      <button onClick={handleDeletePost} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 500, border: '1px solid #fed7d7', borderRadius: '10px', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
