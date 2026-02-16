'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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

// Row fields for the spreadsheet view - matching the screenshot
const SHEET_FIELDS = [
  { key: 'date', label: 'Date', editable: false },
  { key: 'topic', label: 'Topic', editable: true, multiline: true },
  { key: 'post_type', label: 'Post Type', editable: true, type: 'select' },
  { key: 'posting_time', label: 'Posting Time', editable: true, type: 'time' },
  { key: 'post_link', label: 'Post link', editable: true },
  { key: 'post_photo', label: 'Post Photo / Screenshot', editable: true },
  { key: 'graphic_link', label: 'Graphic Link', editable: true, type: 'link' },
  { key: 'video_link', label: 'Video Link', editable: true, type: 'link' },
  { key: 'content_link', label: 'Content Link', editable: true, type: 'link' },
  { key: 'platform', label: 'Platform', editable: true, type: 'multiselect' },
  { key: 'published', label: 'Published', editable: false, type: 'status' },
  { key: 'visual_concept', label: 'Visual Concept', editable: true, multiline: true },
  { key: 'views', label: 'Views', editable: true, type: 'number' },
  { key: 'interactions', label: 'Interactions', editable: true, type: 'number' },
  { key: 'content_theme', label: 'Content Theme', editable: true },
] as const

type SheetFieldKey = typeof SHEET_FIELDS[number]['key']

interface SheetCellData {
  date: string
  topic: string
  post_type: string
  posting_time: string
  post_link: string
  post_photo: string
  graphic_link: string
  video_link: string
  content_link: string
  platform: string
  platforms: Platform[]
  published: string
  isPublished: boolean
  visual_concept: string
  views: string
  interactions: string
  content_theme: string
  post_id?: string
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
  const [viewMode, setViewMode] = useState<'calendar' | 'monthsheet'>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Sheet editing state
  const [editingCell, setEditingCell] = useState<{ weekIdx: number; dayIdx: number; field: SheetFieldKey } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editPlatforms, setEditPlatforms] = useState<Platform[]>([])
  const [editingPlatformCell, setEditingPlatformCell] = useState<{ weekIdx: number; dayIdx: number; postId?: string } | null>(null)
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  
  const [showPostDrawer, setShowPostDrawer] = useState(false)
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const [postForm, setPostForm] = useState({
    title: '', description: '', content_type: 'static' as ContentType, category: '', status: 'draft' as PostStatus,
    planned_date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, planned_time: '', content_deadline: '', graphic_deadline: '',
    owner_id: '', owner_name: '', designer_id: '', designer_name: '', hashtags: '', visual_concept: '', key_points: '',
    media_buying_notes: '', media_budget: 0, platforms: ['facebook'] as Platform[]
  })
  
  const [platformBudgets, setPlatformBudgets] = useState<PlatformBudget[]>([])

  // Timezone-safe date helpers to prevent date shifting
  const parseDateLocal = (dateStr: string): Date => {
    const [y, m, d] = dateStr.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  const formatDateLocal = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

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
    setPostForm({ title: '', description: '', content_type: 'static', category: '', status: 'draft', planned_date: formatDateLocal(new Date()), planned_time: '', content_deadline: '', graphic_deadline: '', owner_id: '', owner_name: '', designer_id: '', designer_name: '', hashtags: '', visual_concept: '', key_points: '', media_buying_notes: '', media_budget: 0, platforms: ['facebook'] })
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

  const postsByDate = useMemo(() => { const map: Record<string, ContentPost[]> = {}; posts.forEach(post => { if (!post.planned_date) return; const key = parseDateLocal(post.planned_date).toDateString(); if (!map[key]) map[key] = []; map[key].push(post) }); return map }, [posts])

  const totalBudget = useMemo(() => posts.reduce((sum, p) => sum + (p.media_budget || 0), 0), [posts])

  // Calculate weeks for the month sheet view
  const monthWeeks = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Get Monday of the first week
    const startDate = new Date(firstDay)
    const dayOfWeek = startDate.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - daysFromMonday)
    
    const weeks: { weekNum: number; days: Date[] }[] = []
    let currentDate = new Date(startDate)
    let weekNum = 1
    
    while (currentDate <= lastDay || weeks.length < 5) {
      const week: Date[] = []
      for (let i = 0; i < 7; i++) {
        week.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
      weeks.push({ weekNum, days: week })
      weekNum++
      
      // Stop if we've covered all days of the month
      if (currentDate > lastDay && weeks.length >= 4) break
    }
    
    return weeks
  }, [currentMonth])

  // Get sheet data for a specific day
  const getSheetDataForDay = useCallback((date: Date): SheetCellData => {
    const dateStr = date.toDateString()
    const dayPosts = postsByDate[dateStr] || []
    const post = dayPosts[0] // Get first post for that day
    
    if (post) {
      const platforms = (post.targets?.map(t => t.platform) || []) as Platform[]
      const isPublished = post.status === 'published' || post.targets?.some(t => t.platform_status === 'published') || false
      return {
        date: `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`,
        topic: post.description || post.title || '',
        post_type: post.content_type || 'Static',
        posting_time: post.planned_time || '',
        post_link: post.targets?.[0]?.permalink || '',
        post_photo: '',
        graphic_link: (post as any).graphic_link || '',
        video_link: (post as any).video_link || '',
        content_link: (post as any).content_link || '',
        platform: platforms.join('/') || '',
        platforms: platforms,
        published: isPublished ? 'Yes' : 'No',
        isPublished: isPublished,
        visual_concept: post.visual_concept || '',
        views: '',
        interactions: '',
        content_theme: post.category || '',
        post_id: post.id
      }
    }
    
    return {
      date: `${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`,
      topic: '',
      post_type: '',
      posting_time: '',
      post_link: '',
      post_photo: '',
      graphic_link: '',
      video_link: '',
      content_link: '',
      platform: '',
      platforms: [],
      published: '',
      isPublished: false,
      visual_concept: '',
      views: '',
      interactions: '',
      content_theme: ''
    }
  }, [postsByDate])

  // Handle cell edit
  const handleCellClick = (weekIdx: number, dayIdx: number, field: SheetFieldKey, currentValue: string, cellData?: SheetCellData) => {
    const fieldDef = SHEET_FIELDS.find(f => f.key === field)
    if (!fieldDef?.editable) return
    
    // Handle platform multi-select differently
    if (field === 'platform' && cellData) {
      setEditingPlatformCell({ weekIdx, dayIdx, postId: cellData.post_id })
      setEditPlatforms(cellData.platforms || [])
      return
    }
    
    setEditingCell({ weekIdx, dayIdx, field })
    setEditValue(currentValue)
    setTimeout(() => editInputRef.current?.focus(), 0)
  }

  // Handle platform toggle
  const handlePlatformToggleInSheet = (platform: Platform) => {
    setEditPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  // Save platform changes
  const handleSavePlatforms = async () => {
    if (!editingPlatformCell) return
    
    const { weekIdx, dayIdx, postId } = editingPlatformCell
    const week = monthWeeks[weekIdx]
    if (!week) return
    
    const date = week.days[dayIdx]
    const dateStr = formatDateLocal(date)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (postId) {
        // Update existing post's platforms
        // First delete all existing targets
        await supabase.from('content_post_targets').delete().eq('post_id', postId)
        
        // Then add new targets for selected platforms
        for (const platform of editPlatforms) {
          await supabase.from('content_post_targets').insert({
            post_id: postId,
            platform,
            platform_status: 'planned'
          })
        }
      } else if (editPlatforms.length > 0) {
        // Create new post with selected platforms
        const { data: newPost } = await supabase.from('content_posts').insert({
          company_id: companyId,
          title: 'Untitled Post',
          planned_date: dateStr,
          status: 'draft',
          content_type: 'static',
          created_by: String(user?.id)
        }).select().single()
        
        if (newPost) {
          for (const platform of editPlatforms) {
            await supabase.from('content_post_targets').insert({
              post_id: newPost.id,
              platform,
              platform_status: 'planned'
            })
          }
        }
      }
      
      fetchPosts()
    } catch (err) {
      console.error('Error saving platforms:', err)
    }
    
    setEditingPlatformCell(null)
    setEditPlatforms([])
  }

  const handleCellBlur = async () => {
    if (!editingCell) return
    
    const { weekIdx, dayIdx, field } = editingCell
    const week = monthWeeks[weekIdx]
    if (!week) return
    
    const date = week.days[dayIdx]
    const dateStr = formatDateLocal(date)
    const dayPosts = postsByDate[date.toDateString()] || []
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (dayPosts.length > 0) {
        // Update existing post
        const post = dayPosts[0]
        const updateData: any = {}
        
        switch (field) {
          case 'topic': updateData.description = editValue; break
          case 'post_type': updateData.content_type = editValue.toLowerCase(); break
          case 'posting_time': updateData.planned_time = editValue; break
          case 'visual_concept': updateData.visual_concept = editValue; break
          case 'content_theme': updateData.category = editValue; break
          case 'graphic_link': updateData.graphic_link = editValue; break
          case 'video_link': updateData.video_link = editValue; break
          case 'content_link': updateData.content_link = editValue; break
          case 'post_link':
            // post_link is stored on the target, not the post itself
            if (post.targets?.[0]?.id) {
              await supabase.from('content_post_targets').update({ permalink: editValue }).eq('id', post.targets[0].id)
            }
            break
        }
        
        if (Object.keys(updateData).length > 0) {
          await supabase.from('content_posts').update(updateData).eq('id', post.id)
        }
      } else if (editValue.trim()) {
        // Create new post if field has value
        const newPostData: any = {
          company_id: companyId,
          title: field === 'topic' ? editValue.substring(0, 50) : 'Untitled Post',
          planned_date: dateStr,
          status: 'draft',
          content_type: 'static',
          created_by: String(user?.id)
        }
        
        let postLinkValue = ''
        switch (field) {
          case 'topic': newPostData.description = editValue; break
          case 'post_type': newPostData.content_type = editValue.toLowerCase(); break
          case 'posting_time': newPostData.planned_time = editValue; break
          case 'visual_concept': newPostData.visual_concept = editValue; break
          case 'content_theme': newPostData.category = editValue; break
          case 'graphic_link': newPostData.graphic_link = editValue; break
          case 'video_link': newPostData.video_link = editValue; break
          case 'content_link': newPostData.content_link = editValue; break
          case 'post_link': postLinkValue = editValue; break
        }
        
        const { data: newPost } = await supabase.from('content_posts').insert(newPostData).select().single()
        
        // Add default platform target
        if (newPost) {
          await supabase.from('content_post_targets').insert({
            post_id: newPost.id,
            platform: 'facebook',
            platform_status: 'planned',
            permalink: postLinkValue || null
          })
        }
      }
      
      fetchPosts()
    } catch (err) {
      console.error('Error saving cell:', err)
    }
    
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCellBlur()
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  if (authLoading || !company) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D0D0D' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #2D2D2D', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background: #0D0D0D; }
        .cal-container { min-height: 100vh; display: flex; background: #0D0D0D; overflow-x: hidden; }
        .cal-main { flex: 1; margin-left: ${isMobile ? '0' : '280px'}; display: flex; flex-direction: column; background: #0D0D0D; padding-top: ${isMobile ? '70px' : '0'}; max-width: ${isMobile ? '100vw' : 'calc(100vw - 280px)'}; overflow-x: hidden; }
        .cal-header { padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; background: #141414; border-bottom: 1px solid #1F1F1F; }
        .cal-nav { display: flex; align-items: center; gap: 1rem; }
        .cal-back { padding: 0.625rem 1rem; font-size: 0.9rem; font-weight: 500; border: 1px solid #2D2D2D; border-radius: 10px; background: #1F1F1F; cursor: pointer; color: #E4E4E7; }
        .cal-title { font-size: 1.5rem; font-weight: 600; color: #FFFFFF; margin: 0; }
        .cal-subtitle { font-size: 0.85rem; color: #71717A; margin: 0.25rem 0 0 0; }
        .cal-budget-badge { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
        .cal-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
        .cal-toggle { display: flex; background: #1F1F1F; border-radius: 10px; padding: 4px; }
        .cal-toggle-btn { padding: 0.5rem 1rem; font-size: 0.85rem; font-weight: 500; border-radius: 8px; border: none; cursor: pointer; background: transparent; color: #71717A; }
        .cal-toggle-btn.active { background: #3B82F6; color: #fff; }
        .cal-btn-secondary { padding: 0.625rem 1.25rem; font-size: 0.85rem; font-weight: 500; border: 1px solid #2D2D2D; border-radius: 10px; background: #1F1F1F; cursor: pointer; color: #E4E4E7; }
        .cal-btn-primary { padding: 0.625rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: 10px; border: none; background: #3B82F6; color: #fff; cursor: pointer; }
        .cal-content { flex: 1; display: flex; overflow: hidden; padding: 1rem; gap: 1rem; }
        .cal-left { flex: 1; overflow: auto; max-width: 100%; }
        .cal-calendar { background: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #1F1F1F; max-width: 100%; }
        .cal-cal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #1F1F1F; }
        .cal-month { font-size: 1.125rem; font-weight: 600; color: #FFFFFF; margin: 0; }
        .cal-cal-nav { display: flex; gap: 0.5rem; }
        .cal-cal-btn { padding: 0.5rem 1rem; font-size: 0.85rem; border: 1px solid #2D2D2D; border-radius: 8px; background: #1F1F1F; cursor: pointer; color: #E4E4E7; }
        .cal-days-header { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #1F1F1F; }
        .cal-day-header { padding: 0.75rem 0.5rem; text-align: center; font-size: 0.75rem; font-weight: 600; color: #71717A; text-transform: uppercase; }
        .cal-days-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .cal-day { min-height: 90px; padding: 0.5rem; border-bottom: 1px solid #1F1F1F; border-right: 1px solid #1F1F1F; cursor: pointer; background: #141414; }
        .cal-day:hover { background: #1F1F1F; }
        .cal-day.other { background: #0D0D0D; }
        .cal-day-num { font-size: 0.85rem; font-weight: 500; margin-bottom: 0.375rem; color: #FFFFFF; }
        .cal-day-num.other { color: #52525B; }
        .cal-day-num.today { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: #3B82F6; color: #fff; }
        .cal-post { font-size: 0.7rem; padding: 0.25rem 0.5rem; border-radius: 4px; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; font-weight: 500; }
        .cal-more { font-size: 0.65rem; color: #71717A; text-align: center; font-weight: 500; }
        .cal-drawer { width: 42%; min-width: 420px; background: #141414; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #1F1F1F; }
        .cal-drawer-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #1F1F1F; display: flex; align-items: center; justify-content: space-between; background: #0D0D0D; }
        .cal-drawer-title { font-size: 1.125rem; font-weight: 600; color: #FFFFFF; margin: 0; }
        .cal-drawer-close { background: none; border: none; font-size: 1.5rem; color: #71717A; cursor: pointer; }
        .cal-drawer-body { flex: 1; overflow: auto; padding: 1.5rem; }
        .cal-drawer-footer { padding: 1rem 1.5rem; border-top: 1px solid #1F1F1F; display: flex; gap: 0.75rem; background: #0D0D0D; }
        .cal-form-group { margin-bottom: 1.25rem; }
        .cal-label { display: block; font-size: 0.85rem; font-weight: 500; color: #E4E4E7; margin-bottom: 0.5rem; }
        .cal-input { width: 100%; padding: 0.75rem 1rem; border: 1px solid #2D2D2D; border-radius: 10px; font-size: 0.9rem; box-sizing: border-box; outline: none; background: #0D0D0D; color: #FFFFFF; }
        .cal-input:focus { border-color: #3B82F6; }
        .cal-textarea { width: 100%; padding: 0.75rem 1rem; border: 1px solid #2D2D2D; border-radius: 10px; font-size: 0.9rem; resize: none; box-sizing: border-box; outline: none; background: #0D0D0D; color: #FFFFFF; }
        .cal-platforms { display: flex; flex-direction: column; gap: 0.75rem; }
        .cal-platform-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #1F1F1F; border-radius: 10px; border: 1px solid #2D2D2D; }
        .cal-platform-row.active { border-color: #3B82F6; background: #1F1F1F; }
        .cal-platform-check { width: 20px; height: 20px; border-radius: 4px; border: 2px solid #2D2D2D; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .cal-platform-check.active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .cal-platform-name { flex: 1; font-weight: 500; text-transform: capitalize; color: #E4E4E7; }
        .cal-platform-budget { width: 120px; padding: 0.5rem; border: 1px solid #2D2D2D; border-radius: 8px; font-size: 0.85rem; text-align: right; background: #0D0D0D; color: #FFFFFF; }
        .cal-copy-section { background: #0F2818; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid #166534; }
        .cal-copy-title { font-size: 0.9rem; font-weight: 600; color: #4ADE80; margin: 0 0 1rem 0; }
        .cal-copy-item { margin-bottom: 1rem; }
        .cal-copy-item-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .cal-copy-item-label { font-size: 0.8rem; font-weight: 500; color: #4ADE80; }
        .cal-copy-btn { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border: none; border-radius: 6px; background: #22c55e; color: #fff; cursor: pointer; }
        .cal-copy-btn.copied { background: #16a34a; }
        .cal-copy-content { background: #141414; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; color: #E4E4E7; line-height: 1.5; border: 1px solid #166534; }
        .cal-target { background: #1F1F1F; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; border: 1px solid #2D2D2D; }
        .cal-target-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .cal-target-platform { display: flex; align-items: center; gap: 0.5rem; }
        .cal-target-dot { width: 12px; height: 12px; border-radius: 50%; }
        .cal-target-name { font-weight: 500; text-transform: capitalize; color: #FFFFFF; }
        .cal-target-budget { font-size: 0.85rem; font-weight: 600; color: #10b981; }
        .cal-target-status { padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 500; border-radius: 20px; }
        .cal-target-select { width: 100%; padding: 0.625rem; border: 1px solid #2D2D2D; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.5rem; background: #0D0D0D; color: #FFFFFF; }
        .cal-target-input { width: 100%; padding: 0.625rem; border: 1px solid #2D2D2D; border-radius: 8px; font-size: 0.85rem; margin-bottom: 0.5rem; box-sizing: border-box; background: #0D0D0D; color: #FFFFFF; }
        .cal-target-publish-btn { width: 100%; padding: 0.75rem; font-size: 0.85rem; font-weight: 500; border-radius: 8px; border: none; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #fff; cursor: pointer; }
        .cal-target-published { font-size: 0.8rem; color: #71717A; margin-top: 0.75rem; padding: 0.625rem; background: #0D0D0D; border-radius: 6px; }
        .cal-sheet { background: #141414; border-radius: 16px; overflow: auto; border: 1px solid #1F1F1F; }
        .cal-table { width: 100%; border-collapse: collapse; min-width: 1000px; font-size: 0.85rem; }
        .cal-table th { padding: 1rem; text-align: left; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: #71717A; border-bottom: 2px solid #1F1F1F; background: #0D0D0D; }
        .cal-table td { padding: 1rem; border-bottom: 1px solid #1F1F1F; color: #E4E4E7; }
        .cal-table tr:hover { background: #1F1F1F; cursor: pointer; }
        .cal-status-badge { padding: 0.375rem 0.75rem; font-size: 0.75rem; font-weight: 500; border-radius: 20px; }
        .cal-empty { padding: 4rem 1.5rem; text-align: center; }
        .cal-empty-icon { width: 64px; height: 64px; border-radius: 16px; background: #1F1F1F; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; }
        
        /* Month Sheet Styles - Dark Theme */
        .ms-container { background: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #1F1F1F; max-width: 100%; }
        .ms-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem; border-bottom: 1px solid #1F1F1F; background: #0D0D0D; flex-wrap: wrap; gap: 0.5rem; }
        .ms-month { font-size: 1.1rem; font-weight: 600; color: #FFFFFF; margin: 0; }
        .ms-nav { display: flex; gap: 0.5rem; }
        .ms-nav-btn { padding: 0.4rem 0.75rem; font-size: 0.8rem; border: 1px solid #2D2D2D; border-radius: 8px; background: #1F1F1F; cursor: pointer; color: #E4E4E7; }
        .ms-nav-btn:hover { background: #2D2D2D; }
        .ms-spreadsheet { overflow-x: auto; padding: 0.5rem; }
        .ms-week { margin-bottom: 1.5rem; border: 1px solid #2D2D2D; border-radius: 8px; overflow: hidden; }
        .ms-week-header { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); color: #fff; padding: 0.5rem 0.75rem; font-weight: 600; font-size: 0.85rem; }
        .ms-row { display: grid; grid-template-columns: 100px repeat(7, minmax(80px, 1fr)); }
        .ms-cell { padding: 0.35rem 0.5rem; border-bottom: 1px solid #1F1F1F; border-right: 1px solid #1F1F1F; font-size: 0.7rem; min-height: 28px; display: flex; align-items: flex-start; }
        .ms-label-cell { background: #1F1F1F; font-weight: 500; color: #E4E4E7; position: sticky; left: 0; z-index: 10; border-left: none; font-size: 0.65rem; }
        .ms-day-header { font-weight: 600; color: #FFFFFF; justify-content: center; background: #1F1F1F; text-transform: capitalize; font-size: 0.7rem; }
        .ms-day-headers .ms-label-cell { background: #2D2D2D; }
        .ms-weekend { background: #1A1A2E !important; }
        .ms-weekend.ms-day-header { background: #252548 !important; }
        .ms-other-month { opacity: 0.5; }
        .ms-data-cell { background: #141414; cursor: default; word-break: break-word; color: #E4E4E7; }
        .ms-editable { cursor: pointer; }
        .ms-editable:hover { background: #1F1F1F; }
        .ms-multiline { min-height: 45px; }
        .ms-value { line-height: 1.3; white-space: pre-wrap; font-size: 0.65rem; }
        .ms-input { width: 100%; border: 2px solid #3B82F6; border-radius: 4px; padding: 0.25rem; font-size: 0.7rem; outline: none; font-family: inherit; background: #0D0D0D; color: #FFFFFF; }
        textarea.ms-input { min-height: 40px; resize: vertical; }
        select.ms-input { cursor: pointer; font-size: 0.7rem; background: #0D0D0D; color: #FFFFFF; }
        
        /* Platform Multi-Select Styles - Dark Theme */
        .ms-platform-editor { background: #1F1F1F; border: 2px solid #3B82F6; border-radius: 8px; padding: 0.5rem; min-width: 140px; }
        .ms-platform-options { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 0.5rem; }
        .ms-platform-option { display: flex; align-items: center; gap: 0.375rem; cursor: pointer; padding: 0.25rem; border-radius: 4px; font-size: 0.75rem; }
        .ms-platform-option:hover { background: #2D2D2D; }
        .ms-platform-option input[type="checkbox"] { width: 14px; height: 14px; cursor: pointer; }
        .ms-platform-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .ms-platform-name { text-transform: capitalize; color: #E4E4E7; }
        .ms-platform-actions { display: flex; gap: 0.375rem; border-top: 1px solid #2D2D2D; padding-top: 0.5rem; }
        .ms-platform-save { flex: 1; padding: 0.375rem; font-size: 0.7rem; font-weight: 600; border: none; border-radius: 4px; background: #3B82F6; color: #fff; cursor: pointer; }
        .ms-platform-cancel { flex: 1; padding: 0.375rem; font-size: 0.7rem; font-weight: 500; border: 1px solid #2D2D2D; border-radius: 4px; background: #141414; color: #A1A1AA; cursor: pointer; }
        .ms-platform-display { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }
        .ms-platform-tag { padding: 1px 4px; border-radius: 3px; font-size: 0.55rem; font-weight: 600; color: #fff; text-transform: capitalize; white-space: nowrap; }
        .ms-placeholder { color: #52525B; font-style: italic; font-size: 0.6rem; }
        
        /* Published Status Styles - Dark Theme */
        .ms-published-status { display: flex; align-items: center; justify-content: center; width: 100%; }
        .ms-status-icon { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; }
        .ms-status-icon.ms-published { background: #0F2818; color: #4ADE80; }
        .ms-status-icon.ms-not-published { background: #2D1F1F; color: #EF4444; }
        .ms-status-empty { color: #52525B; font-size: 0.8rem; }
        
        /* Link Field Styles - Dark Theme */
        .ms-link-display { display: flex; align-items: center; gap: 4px; width: 100%; }
        .ms-link-icon { width: 14px; height: 14px; color: #3B82F6; flex-shrink: 0; }
        .ms-link-text { color: #3B82F6; font-size: 0.75rem; text-decoration: underline; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100px; }
        .ms-link-text:hover { color: #60A5FA; }
        .ms-link-empty { color: #52525B; font-size: 0.7rem; font-style: italic; }
        .ms-link-badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; background: #1E3A5F; border-radius: 4px; font-size: 0.65rem; color: #60A5FA; }
        .ms-link-badge.graphic { background: #3D1F3D; color: #F472B6; }
        .ms-link-badge.video { background: #3D1F1F; color: #EF4444; }
        .ms-link-badge.content { background: #1F3D1F; color: #4ADE80; }
        
        /* New Post Modal Styles - Dark Theme */
        .cal-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; animation: fadeIn 0.2s ease-out; backdrop-filter: blur(4px); }
        .cal-modal { background: #141414; border-radius: 16px; width: 520px; max-width: 90vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.3s ease-out; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #2D2D2D; }
        .cal-modal-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #1F1F1F; display: flex; align-items: center; justify-content: space-between; background: #0D0D0D; }
        .cal-modal-title { font-size: 1.25rem; font-weight: 600; color: #FFFFFF; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
        .cal-modal-close { background: #1F1F1F; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 1.25rem; color: #71717A; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .cal-modal-close:hover { background: #3D1F1F; color: #EF4444; }
        .cal-modal-body { flex: 1; overflow-y: auto; padding: 1.5rem; }
        .cal-modal-footer { padding: 1rem 1.5rem; border-top: 1px solid #1F1F1F; display: flex; gap: 0.75rem; background: #0D0D0D; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* TABLET (max-width: 1024px) */
        @media screen and (max-width: 1024px) {
          .cal-main { margin-left: 0 !important; padding-top: 56px !important; max-width: 100vw !important; }
          .cal-header { padding: 1rem !important; }
          .cal-title { font-size: 1.25rem !important; }
          .cal-content { flex-direction: column !important; padding: 0.75rem !important; }
          .cal-drawer { width: 100% !important; min-width: unset !important; max-height: 50vh; border-radius: 12px !important; }
          .cal-left { max-width: 100% !important; }
          .cal-day { min-height: 70px !important; padding: 0.375rem !important; }
          .cal-day-num { font-size: 0.75rem !important; }
          .cal-post { font-size: 0.6rem !important; }
          .ms-row { grid-template-columns: 80px repeat(7, minmax(60px, 1fr)) !important; }
          .ms-cell { padding: 0.25rem !important; font-size: 0.6rem !important; }
          .ms-label-cell { font-size: 0.55rem !important; }
          .ms-platform-editor { min-width: 120px !important; }
          .cal-modal { width: 90vw !important; max-width: 90vw !important; }
        }

        /* MOBILE (max-width: 768px) */
        @media screen and (max-width: 768px) {
          .cal-main { padding-top: 56px !important; }
          .cal-header { padding: 0.75rem !important; flex-direction: column !important; align-items: flex-start !important; }
          .cal-actions { width: 100% !important; justify-content: flex-start !important; }
          .cal-toggle { width: 100% !important; }
          .cal-toggle-btn { flex: 1 !important; text-align: center !important; font-size: 0.75rem !important; padding: 0.5rem 0.5rem !important; }
          .cal-content { flex-direction: column !important; padding: 0.5rem !important; gap: 0.5rem !important; }
          .cal-drawer { width: 100% !important; min-width: unset !important; max-height: 60vh !important; }
          .cal-drawer-body { padding: 1rem !important; }
          .cal-day { min-height: 50px !important; padding: 0.25rem !important; }
          .cal-day-num { font-size: 0.7rem !important; }
          .cal-post { font-size: 0.55rem !important; padding: 0.125rem 0.25rem !important; }
          .cal-day-header { padding: 0.5rem 0.25rem !important; font-size: 0.6rem !important; }
          .cal-cal-header { padding: 0.75rem 1rem !important; }
          .cal-cal-btn { padding: 0.375rem 0.625rem !important; font-size: 0.75rem !important; }
          .cal-sheet { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .cal-table { min-width: 700px !important; font-size: 0.75rem !important; }
          .cal-table th { padding: 0.625rem 0.5rem !important; font-size: 0.65rem !important; }
          .cal-table td { padding: 0.625rem 0.5rem !important; font-size: 0.75rem !important; }
          .ms-spreadsheet { padding: 0.25rem !important; }
          .ms-row { grid-template-columns: 70px repeat(7, minmax(50px, 1fr)) !important; }
          .ms-cell { padding: 0.2rem 0.3rem !important; font-size: 0.55rem !important; min-height: 24px !important; }
          .ms-label-cell { font-size: 0.5rem !important; }
          .ms-value { font-size: 0.55rem !important; }
          .ms-day-header { font-size: 0.55rem !important; }
          .ms-platform-tag { font-size: 0.45rem !important; padding: 1px 3px !important; }
          .ms-platform-editor { min-width: 100px !important; }
          .cal-modal { width: calc(100vw - 24px) !important; max-width: calc(100vw - 24px) !important; max-height: 90vh !important; }
          .cal-btn-primary, .cal-btn-secondary, .cal-back { font-size: 0.8rem !important; padding: 0.5rem 1rem !important; }
          .cal-budget-badge { font-size: 0.75rem !important; padding: 0.375rem 0.75rem !important; }
          .ms-header { padding: 0.75rem !important; }
          .ms-nav-btn { padding: 0.3rem 0.5rem !important; font-size: 0.7rem !important; }
        }

        /* SMALL MOBILE (max-width: 480px) */
        @media screen and (max-width: 480px) {
          .cal-title { font-size: 1rem !important; }
          .cal-subtitle { font-size: 0.75rem !important; }
          .cal-content { padding: 0.25rem !important; }
          .ms-row { grid-template-columns: 55px repeat(7, minmax(40px, 1fr)) !important; }
          .ms-cell { font-size: 0.5rem !important; padding: 0.15rem 0.2rem !important; }
          .ms-label-cell { font-size: 0.45rem !important; }
          .cal-platform-budget { width: 80px !important; }
        }
      `}} />

      <div className="cal-container">
        <Sidebar projects={[]} onCreateProject={() => {}} />
        <main className="page-main cal-main">
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
                {(['calendar', 'monthsheet'] as const).map(mode => (
                  <button key={mode} onClick={() => setViewMode(mode)} className={`cal-toggle-btn ${viewMode === mode ? 'active' : ''}`}>
                    {mode === 'monthsheet' ? 'Month Sheet' : 'Calendar'}
                  </button>
                ))}
              </div>
              <button onClick={() => router.push(`/content-calendar/${companyId}/reports`)} className="cal-btn-secondary">Reports</button>
              <button onClick={() => openNewPost()} className="cal-btn-primary">+ New Post</button>
            </div>
          </header>

          <div className="cal-content">
            <div className="cal-left" style={{ flex: viewMode === 'monthsheet' ? 1 : undefined }}>
              {viewMode === 'monthsheet' ? (
                // MONTH SHEET VIEW - Excel-like spreadsheet organized by weeks
                <div className="ms-container">
                  {/* Month Navigation */}
                  <div className="ms-header">
                    <h2 className="ms-month">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <div className="ms-nav">
                      <button onClick={() => setCurrentMonth(new Date())} className="ms-nav-btn">Today</button>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="ms-nav-btn">Prev</button>
                      <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="ms-nav-btn">Next</button>
                    </div>
                  </div>
                  
                  {/* Spreadsheet */}
                  <div className="ms-spreadsheet">
                    {monthWeeks.map((week, weekIdx) => (
                      <div key={weekIdx} className="ms-week">
                        <div className="ms-week-header">Week {week.weekNum} ({currentMonth.toLocaleString('default', { month: 'long' })})</div>
                        
                        {/* Day Headers Row */}
                        <div className="ms-row ms-day-headers">
                          <div className="ms-cell ms-label-cell"></div>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIdx) => {
                            const isWeekend = dayIdx >= 5
                            return (
                              <div 
                                key={day} 
                                className={`ms-cell ms-day-header ${isWeekend ? 'ms-weekend' : ''}`}
                              >
                                {day}
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Data Rows */}
                        {SHEET_FIELDS.map(field => (
                          <div key={field.key} className="ms-row">
                            <div className="ms-cell ms-label-cell">{field.label}</div>
                            {week.days.map((date, dayIdx) => {
                              const cellData = getSheetDataForDay(date)
                              const value = cellData[field.key]
                              const isEditing = editingCell?.weekIdx === weekIdx && 
                                               editingCell?.dayIdx === dayIdx && 
                                               editingCell?.field === field.key
                              const isWeekend = dayIdx >= 5
                              const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                              
                              const isPlatformEditing = field.key === 'platform' && 
                                editingPlatformCell?.weekIdx === weekIdx && 
                                editingPlatformCell?.dayIdx === dayIdx
                              
                              return (
                                <div 
                                  key={dayIdx} 
                                  className={`ms-cell ms-data-cell ${isWeekend ? 'ms-weekend' : ''} ${!isCurrentMonth ? 'ms-other-month' : ''} ${field.editable ? 'ms-editable' : ''} ${'multiline' in field && field.multiline ? 'ms-multiline' : ''}`}
                                  onClick={() => field.editable && handleCellClick(weekIdx, dayIdx, field.key, value, cellData)}
                                >
                                  {/* Platform Multi-Select */}
                                  {field.key === 'platform' ? (
                                    isPlatformEditing ? (
                                      <div className="ms-platform-editor" onClick={(e) => e.stopPropagation()}>
                                        <div className="ms-platform-options">
                                          {PLATFORMS.map(p => (
                                            <label key={p} className="ms-platform-option">
                                              <input
                                                type="checkbox"
                                                checked={editPlatforms.includes(p)}
                                                onChange={() => handlePlatformToggleInSheet(p)}
                                              />
                                              <span 
                                                className="ms-platform-dot" 
                                                style={{ background: PLATFORM_COLORS[p] }}
                                              />
                                              <span className="ms-platform-name">{p}</span>
                                            </label>
                                          ))}
                                        </div>
                                        <div className="ms-platform-actions">
                                          <button 
                                            className="ms-platform-save"
                                            onClick={handleSavePlatforms}
                                          >
                                            Save
                                          </button>
                                          <button 
                                            className="ms-platform-cancel"
                                            onClick={() => { setEditingPlatformCell(null); setEditPlatforms([]) }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="ms-platform-display">
                                        {cellData.platforms.length > 0 ? (
                                          cellData.platforms.map(p => (
                                            <span 
                                              key={p} 
                                              className="ms-platform-tag"
                                              style={{ background: PLATFORM_COLORS[p] }}
                                            >
                                              {p.charAt(0).toUpperCase() + p.slice(1)}
                                            </span>
                                          ))
                                        ) : (
                                          <span className="ms-value ms-placeholder">Click to add</span>
                                        )}
                                      </div>
                                    )
                                  ) : field.key === 'published' ? (
                                    /* Published Status with Check/X icons */
                                    <div className="ms-published-status">
                                      {cellData.post_id ? (
                                        cellData.isPublished ? (
                                          <span className="ms-status-icon ms-published">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                              <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                          </span>
                                        ) : (
                                          <span className="ms-status-icon ms-not-published">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                              <line x1="18" y1="6" x2="6" y2="18"></line>
                                              <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                          </span>
                                        )
                                      ) : (
                                        <span className="ms-status-empty">-</span>
                                      )}
                                    </div>
                                  ) : ('type' in field && field.type === 'link') ? (
                                    /* Link Fields with Icons */
                                    isEditing ? (
                                      <input
                                        ref={editInputRef as React.RefObject<HTMLInputElement>}
                                        type="url"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleCellBlur}
                                        onKeyDown={handleCellKeyDown}
                                        className="ms-input"
                                        placeholder="Paste Google Drive link..."
                                      />
                                    ) : value ? (
                                      <div className="ms-link-display">
                                        <a 
                                          href={value} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className={`ms-link-badge ${field.key === 'graphic_link' ? 'graphic' : field.key === 'video_link' ? 'video' : 'content'}`}
                                          title={value}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                          </svg>
                                          {field.key === 'graphic_link' ? 'Graphic' : field.key === 'video_link' ? 'Video' : 'Content'}
                                        </a>
                                      </div>
                                    ) : (
                                      <span className="ms-link-empty">Add link</span>
                                    )
                                  ) : isEditing ? (
                                    ('multiline' in field && field.multiline) ? (
                                      <textarea
                                        ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleCellBlur}
                                        onKeyDown={handleCellKeyDown}
                                        className="ms-input"
                                      />
                                    ) : ('type' in field && field.type === 'select') ? (
                                      <select
                                        ref={editInputRef as any}
                                        value={editValue}
                                        onChange={(e) => { setEditValue(e.target.value); setTimeout(handleCellBlur, 100) }}
                                        onBlur={handleCellBlur}
                                        className="ms-input"
                                      >
                                        <option value="">Select...</option>
                                        {CONTENT_TYPES.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        ref={editInputRef as React.RefObject<HTMLInputElement>}
                                        type={('type' in field && field.type) || 'text'}
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleCellBlur}
                                        onKeyDown={handleCellKeyDown}
                                        className="ms-input"
                                      />
                                    )
                                  ) : (
                                    <span className="ms-value">{value || ''}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : viewMode === 'calendar' ? (
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
                      const dateStr = formatDateLocal(day.date)
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
              ) : null}
            </div>

            {/* New Post Modal - Centered Popup */}
            {showPostDrawer && isEditing && !selectedPost && (
              <div className="cal-modal-overlay" onClick={() => setShowPostDrawer(false)}>
                <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="cal-modal-header">
                    <h3 className="cal-modal-title">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#C483D9' }}>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      New Post
                    </h3>
                    <button onClick={() => setShowPostDrawer(false)} className="cal-modal-close">×</button>
                  </div>
                  <div className="cal-modal-body">
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
                    <div className="cal-form-group"><label className="cal-label">Description / Caption</label><textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Post description or caption" rows={3} className="cal-textarea" /></div>
                    <div className="cal-form-group"><label className="cal-label">Visual Concept</label><textarea value={postForm.visual_concept} onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })} placeholder="Visual concept notes" rows={2} className="cal-textarea" /></div>
                    <div className="cal-form-group"><label className="cal-label">Hashtags</label><input type="text" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#hashtag1 #hashtag2" className="cal-input" /></div>
                  </div>
                  <div className="cal-modal-footer">
                    <button onClick={() => setShowPostDrawer(false)} className="cal-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                    <button onClick={handleSavePost} className="cal-btn-primary" style={{ flex: 1 }}>Create Post</button>
                  </div>
                </div>
              </div>
            )}

            {/* Post Details/Edit Modal - Centered Popup */}
            {showPostDrawer && selectedPost && (
              <div className="cal-modal-overlay" onClick={() => { setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false) }}>
                <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="cal-modal-header">
                    <h3 className="cal-modal-title">
                      {isEditing ? (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#5884FD' }}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit Post
                        </>
                      ) : (
                        <>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#C483D9' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                          Post Details
                        </>
                      )}
                    </h3>
                    <button onClick={() => { setShowPostDrawer(false); setSelectedPost(null); setIsEditing(false) }} className="cal-modal-close">×</button>
                  </div>
                  <div className="cal-modal-body">
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
                        <div className="cal-form-group"><label className="cal-label">Description / Caption</label><textarea value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} placeholder="Post description or caption" rows={3} className="cal-textarea" /></div>
                        <div className="cal-form-group"><label className="cal-label">Visual Concept</label><textarea value={postForm.visual_concept} onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })} placeholder="Visual concept notes" rows={2} className="cal-textarea" /></div>
                        <div className="cal-form-group"><label className="cal-label">Hashtags</label><input type="text" value={postForm.hashtags} onChange={(e) => setPostForm({ ...postForm, hashtags: e.target.value })} placeholder="#hashtag1 #hashtag2" className="cal-input" /></div>
                      </>
                    ) : (
                      <>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1a1a1a', margin: '0 0 0.75rem 0' }}>{selectedPost.title}</h4>
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span className="cal-status-badge" style={{ background: STATUS_COLORS[selectedPost.status]?.bg, color: STATUS_COLORS[selectedPost.status]?.text }}>{selectedPost.status}</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>Budget: ${(selectedPost.media_budget || 0).toLocaleString()}</span>
                            <span style={{ color: '#666', fontSize: '0.85rem' }}>
                              {new Date(selectedPost.planned_date).toLocaleDateString()} {selectedPost.planned_time || ''}
                            </span>
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
                    )}
                  </div>
                  <div className="cal-modal-footer">
                    {isEditing ? (
                      <>
                        <button onClick={() => setIsEditing(false)} className="cal-btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button onClick={handleSavePost} className="cal-btn-primary" style={{ flex: 1 }}>Save Changes</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setIsEditing(true)} className="cal-btn-secondary" style={{ flex: 1 }}>Edit</button>
                        <button onClick={handleDeletePost} style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: 500, border: '1px solid #fed7d7', borderRadius: '10px', background: '#fff5f5', color: '#c53030', cursor: 'pointer' }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
