'use client'

import { useState, useEffect, useMemo } from 'react'
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
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { 
  useBusinesses, 
  useContentPosts, 
  useCalendarPosts,
  useCampaigns,
  useCalendarNavigation,
  usePostDrawer,
  usePostMutations,
  useWeeklyKPIs,
  useMonthlyKPIs,
  useTopPerformingPosts,
  useBusinessMembers
} from '@/hooks/useContentCalendar'
import { 
  Platform, 
  PostStatus, 
  ContentType,
  PostFilters,
  PLATFORM_CONFIG,
  STATUS_CONFIG,
  CONTENT_TYPE_CONFIG,
  CalendarPost,
  ContentPost,
  Business,
  CreatePostInput
} from '@/types/content-calendar'
import KPIDashboard from '@/components/content-calendar/KPIDashboard'

// =====================================================
// MAIN CONTENT CALENDAR PAGE
// =====================================================

export default function ContentCalendarPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // View mode: calendar, list, kpi
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kpi'>('calendar')
  
  // Business selection
  const { businesses, isLoading: businessesLoading, refetch: refetchBusinesses } = useBusinesses(user?.id)
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null)
  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || null
  
  // Auto-select first business
  useEffect(() => {
    if (businesses.length > 0 && !selectedBusinessId) {
      setSelectedBusinessId(businesses[0].id)
    }
  }, [businesses, selectedBusinessId])

  // Calendar navigation
  const { currentMonth, goToPreviousMonth, goToNextMonth, goToToday } = useCalendarNavigation()
  
  // Post drawer
  const { isOpen: isDrawerOpen, selectedPostId, mode: drawerMode, openDrawer, closeDrawer, switchToEdit, switchToView } = usePostDrawer()
  
  // Filters
  const [filters, setFilters] = useState<PostFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Data fetching
  const { calendarPosts, isLoading: calendarLoading } = useCalendarPosts(selectedBusinessId || undefined, currentMonth)
  const { posts, isLoading: postsLoading, refetch: refetchPosts } = useContentPosts(selectedBusinessId || undefined, { ...filters, search: searchTerm })
  const { campaigns } = useCampaigns(selectedBusinessId || undefined)
  const { members } = useBusinessMembers(selectedBusinessId || undefined)
  
  // KPI Data
  const [kpiPlatformFilter, setKpiPlatformFilter] = useState<Platform | 'all'>('all')
  const { kpis: weeklyKPIs, isLoading: weeklyKPIsLoading } = useWeeklyKPIs(selectedBusinessId || undefined)
  const { kpis: monthlyKPIs, isLoading: monthlyKPIsLoading } = useMonthlyKPIs(selectedBusinessId || undefined)
  const { posts: topPosts, isLoading: topPostsLoading } = useTopPerformingPosts(selectedBusinessId || undefined)
  
  // Post mutations
  const { createPost, updatePost, deletePost, updatePostStatus, isSubmitting } = usePostMutations(
    selectedBusinessId || undefined,
    () => {
      refetchPosts()
      closeDrawer()
    }
  )

  // Create Business Modal
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false)
  const [newBusinessName, setNewBusinessName] = useState('')
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false)

  // Post Form State
  const [postForm, setPostForm] = useState<Partial<CreatePostInput>>({
    title: '',
    caption: '',
    content_type: 'image',
    platforms: [],
    priority: 'normal'
  })

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Create business handler
  const handleCreateBusiness = async () => {
    if (!newBusinessName.trim() || !user?.id) return
    
    setIsCreatingBusiness(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const slug = newBusinessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      
      const { data: business, error } = await supabase
        .from('businesses')
        .insert({
          name: newBusinessName.trim(),
          slug: slug + '-' + Date.now(),
          created_by_id: user.id
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Add creator as owner
      await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: user.id,
          role: 'owner',
          permissions: {
            can_create_posts: true,
            can_edit_posts: true,
            can_delete_posts: true,
            can_publish: true,
            can_approve: true,
            can_manage_members: true,
            can_view_metrics: true,
            can_manage_campaigns: true
          },
          accepted_at: new Date().toISOString()
        })
      
      setNewBusinessName('')
      setShowCreateBusinessModal(false)
      refetchBusinesses()
      setSelectedBusinessId(business.id)
    } catch (err) {
      console.error('Error creating business:', err)
      alert('Failed to create business')
    } finally {
      setIsCreatingBusiness(false)
    }
  }

  // Handle post creation
  const handleCreatePost = async () => {
    if (!selectedBusinessId || !postForm.title) return
    
    const input: CreatePostInput = {
      business_id: selectedBusinessId,
      title: postForm.title || '',
      caption: postForm.caption,
      content_type: postForm.content_type || 'image',
      platforms: postForm.platforms || [],
      priority: postForm.priority || 'normal',
      planned_publish_at: postForm.planned_publish_at,
      visual_concept: postForm.visual_concept,
      notes: postForm.notes,
      owner_id: user?.id
    }
    
    await createPost(input)
    setPostForm({
      title: '',
      caption: '',
      content_type: 'image',
      platforms: [],
      priority: 'normal'
    })
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!isMobile && <Sidebar projects={[]} onCreateProject={() => {}} />}
      
      <main className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: isMobile ? 0 : '256px' }}>
        {isMobile && <MobileHeader title="Content Calendar" isMobile={isMobile} />}
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Left: Business Selector */}
            <div className="flex items-center gap-4">
              <select
                value={selectedBusinessId || ''}
                onChange={(e) => setSelectedBusinessId(Number(e.target.value) || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white"
              >
                <option value="">Select Business</option>
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              
              <button
                onClick={() => setShowCreateBusinessModal(true)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg"
              >
                <PlusIcon className="w-4 h-4" />
                New Business
              </button>
            </div>

            {/* Center: View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <ListBulletIcon className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('kpi')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'kpi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                KPI Reports
              </button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-48"
                />
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${
                  showFilters ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'border-gray-300 text-gray-700'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
              </button>
              
              {/* New Post Button */}
              <button
                onClick={() => openDrawer(null, 'create')}
                disabled={!selectedBusinessId}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                New Post
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-4">
                {/* Status Filter */}
                <select
                  value={filters.status as string || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as PostStatus || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                {/* Content Type Filter */}
                <select
                  value={filters.content_type as string || ''}
                  onChange={(e) => setFilters({ ...filters, content_type: e.target.value as ContentType || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Types</option>
                  {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>

                {/* Campaign Filter */}
                <select
                  value={filters.campaign_id || ''}
                  onChange={(e) => setFilters({ ...filters, campaign_id: Number(e.target.value) || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({})}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {/* Main View */}
          <div className={`flex-1 overflow-auto p-6 ${isDrawerOpen && !isMobile ? 'pr-[420px]' : ''}`}>
            {!selectedBusiness ? (
              /* No Business Selected */
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BuildingOfficeIcon className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {businesses.length === 0 ? 'Create Your First Business' : 'Select a Business'}
                </h3>
                <p className="text-gray-500 mb-4 max-w-md">
                  {businesses.length === 0 
                    ? 'Create a business workspace to start managing your content calendar'
                    : 'Select a business from the dropdown above to view its content calendar'
                  }
                </p>
                {businesses.length === 0 && (
                  <button
                    onClick={() => setShowCreateBusinessModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                  >
                    Create Business
                  </button>
                )}
              </div>
            ) : viewMode === 'calendar' ? (
              /* Calendar View */
              <CalendarView
                currentMonth={currentMonth}
                posts={calendarPosts}
                isLoading={calendarLoading}
                onPrevMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
                onSelectPost={(postId) => openDrawer(postId, 'view')}
                onSelectDate={(date) => {
                  setPostForm(prev => ({ ...prev, planned_publish_at: date.toISOString() }))
                  openDrawer(null, 'create')
                }}
              />
            ) : viewMode === 'list' ? (
              /* List View */
              <ListView
                posts={posts}
                isLoading={postsLoading}
                onSelectPost={(postId) => openDrawer(postId, 'view')}
                onStatusChange={(postId, status) => updatePostStatus(postId, status)}
              />
            ) : (
              /* KPI Dashboard */
              <KPIDashboard
                weeklyKPIs={weeklyKPIs}
                monthlyKPIs={monthlyKPIs}
                topPosts={topPosts}
                isLoading={weeklyKPIsLoading || monthlyKPIsLoading || topPostsLoading}
                selectedPlatform={kpiPlatformFilter}
                onPlatformChange={setKpiPlatformFilter}
              />
            )}
          </div>

          {/* Post Drawer */}
          {isDrawerOpen && (
            <PostDrawerPanel
              postId={selectedPostId}
              mode={drawerMode}
              businessId={selectedBusinessId}
              campaigns={campaigns}
              members={members}
              onClose={closeDrawer}
              onSwitchToEdit={switchToEdit}
              onSave={handleCreatePost}
              isSubmitting={isSubmitting}
              postForm={postForm}
              setPostForm={setPostForm}
              user={user}
            />
          )}
        </div>
      </main>

      {/* Create Business Modal */}
      {showCreateBusinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Business</h3>
              <button onClick={() => setShowCreateBusinessModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Enter business name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateBusinessModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBusiness}
                  disabled={!newBusinessName.trim() || isCreatingBusiness}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCreatingBusiness ? 'Creating...' : 'Create Business'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =====================================================
// CALENDAR VIEW COMPONENT
// =====================================================

function CalendarView({
  currentMonth,
  posts,
  isLoading,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectPost,
  onSelectDate
}: {
  currentMonth: Date
  posts: CalendarPost[]
  isLoading: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onSelectPost: (postId: number) => void
  onSelectDate: (date: Date) => void
}) {
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = firstDay.getDay()
    
    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = []
    
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false, isToday: false })
    }
    
    // Current month days
    const today = new Date()
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      const isToday = date.toDateString() === today.toDateString()
      days.push({ date, isCurrentMonth: true, isToday })
    }
    
    // Next month days to fill grid
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false, isToday: false })
    }
    
    return days
  }, [currentMonth])

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {}
    posts.forEach(post => {
      if (post.planned_publish_at) {
        const dateKey = new Date(post.planned_publish_at).toDateString()
        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(post)
      }
    })
    return map
  }, [posts])

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="grid grid-cols-7 gap-2">
          {Array(42).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onToday}
            className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Today
          </button>
          <button
            onClick={onPrevMonth}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onNextMonth}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayPosts = postsByDate[day.date.toDateString()] || []
          
          return (
            <div
              key={idx}
              onClick={() => onSelectDate(day.date)}
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                !day.isCurrentMonth ? 'bg-gray-50/50' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                day.isToday 
                  ? 'w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center' 
                  : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {day.date.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayPosts.slice(0, 3).map(post => (
                  <div
                    key={post.post_id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectPost(post.post_id)
                    }}
                    className={`text-xs p-1 rounded truncate cursor-pointer ${
                      STATUS_CONFIG[post.status]?.bgColor || 'bg-gray-100'
                    }`}
                    style={{ color: STATUS_CONFIG[post.status]?.color }}
                  >
                    {post.title}
                  </div>
                ))}
                {dayPosts.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayPosts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =====================================================
// LIST VIEW COMPONENT
// =====================================================

function ListView({
  posts,
  isLoading,
  onSelectPost,
  onStatusChange
}: {
  posts: ContentPost[]
  isLoading: boolean
  onSelectPost: (postId: number) => void
  onStatusChange: (postId: number, status: PostStatus) => void
}) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
        <p className="text-gray-500">Create your first post to get started</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platforms</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {posts.map(post => (
            <tr
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{post.title}</div>
                <div className="text-sm text-gray-500">{CONTENT_TYPE_CONFIG[post.content_type]?.label}</div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-1">
                  {post.platforms?.slice(0, 3).map(platform => (
                    <span
                      key={platform}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: PLATFORM_CONFIG[platform]?.color }}
                      title={PLATFORM_CONFIG[platform]?.name}
                    >
                      {platform.charAt(0).toUpperCase()}
                    </span>
                  ))}
                  {post.platforms && post.platforms.length > 3 && (
                    <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                      +{post.platforms.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <select
                  value={post.status}
                  onChange={(e) => {
                    e.stopPropagation()
                    onStatusChange(post.id, e.target.value as PostStatus)
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className={`text-xs px-2 py-1 rounded-full border-0`}
                  style={{ 
                    backgroundColor: STATUS_CONFIG[post.status]?.bgColor,
                    color: STATUS_CONFIG[post.status]?.color
                  }}
                >
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {post.planned_publish_at 
                  ? new Date(post.planned_publish_at).toLocaleDateString()
                  : '-'
                }
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${post.completion_percentage || 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{post.completion_percentage || 0}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =====================================================
// POST DRAWER PANEL
// =====================================================

function PostDrawerPanel({
  postId,
  mode,
  businessId,
  campaigns,
  members,
  onClose,
  onSwitchToEdit,
  onSave,
  isSubmitting,
  postForm,
  setPostForm,
  user
}: {
  postId: number | null
  mode: 'view' | 'edit' | 'create'
  businessId: number | null
  campaigns: any[]
  members: any[]
  onClose: () => void
  onSwitchToEdit: () => void
  onSave: () => void
  isSubmitting: boolean
  postForm: Partial<CreatePostInput>
  setPostForm: (form: any) => void
  user: any
}) {
  const platforms: Platform[] = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest']

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-xl border-l border-gray-200 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">
          {mode === 'create' ? 'New Post' : mode === 'edit' ? 'Edit Post' : 'Post Details'}
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {mode === 'create' ? (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={postForm.title || ''}
                onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                placeholder="Enter post title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <select
                value={postForm.content_type || 'image'}
                onChange={(e) => setPostForm({ ...postForm, content_type: e.target.value as ContentType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {platforms.map(platform => (
                  <button
                    key={platform}
                    onClick={() => {
                      const current = postForm.platforms || []
                      const updated = current.includes(platform)
                        ? current.filter(p => p !== platform)
                        : [...current, platform]
                      setPostForm({ ...postForm, platforms: updated })
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      postForm.platforms?.includes(platform)
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: PLATFORM_CONFIG[platform].color }}
                    />
                    {PLATFORM_CONFIG[platform].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea
                value={postForm.caption || ''}
                onChange={(e) => setPostForm({ ...postForm, caption: e.target.value })}
                placeholder="Enter caption"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>

            {/* Visual Concept */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visual Concept</label>
              <textarea
                value={postForm.visual_concept || ''}
                onChange={(e) => setPostForm({ ...postForm, visual_concept: e.target.value })}
                placeholder="Describe the visual concept"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
              <input
                type="datetime-local"
                value={postForm.planned_publish_at ? new Date(postForm.planned_publish_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setPostForm({ ...postForm, planned_publish_at: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={postForm.priority || 'normal'}
                onChange={(e) => setPostForm({ ...postForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={postForm.notes || ''}
                onChange={(e) => setPostForm({ ...postForm, notes: e.target.value })}
                placeholder="Additional notes"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>Post details view coming soon</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {mode === 'create' && (
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!postForm.title || isSubmitting}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      )}
    </div>
  )
}
