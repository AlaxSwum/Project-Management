'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import { 
  PlusIcon, 
  FunnelIcon, 
  ChartBarIcon,
  ListBulletIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Components
import { Calendar, PostDrawer, KPIDashboard, BusinessSelector, CreateBusinessModal } from '@/components/content-calendar';

// Hooks
import {
  useBusinesses,
  useBusinessMembers,
  useContentPosts,
  usePost,
  usePostMutations,
  useCalendarPosts,
  useCampaigns,
  useWeeklyKPIs,
  useMonthlyKPIs,
  useTopPerformingPosts,
  useCalendarNavigation,
  usePostDrawer
} from '@/hooks/useContentCalendar';

// Types
import { 
  Business, 
  ContentPost, 
  PostFilters, 
  Platform, 
  PostStatus,
  STATUS_CONFIG,
  PLATFORM_CONFIG,
  CONTENT_TYPE_CONFIG
} from '@/types/content-calendar';

type ViewMode = 'calendar' | 'list' | 'kpi';

export default function ContentCalendarV2Page() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateBusinessModal, setShowCreateBusinessModal] = useState(false);
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<Platform | 'all'>('all');

  // Business selection
  const { businesses, isLoading: businessesLoading, refetch: refetchBusinesses } = useBusinesses(user?.id);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Auto-select first business
  useEffect(() => {
    if (businesses.length > 0 && !selectedBusiness) {
      setSelectedBusiness(businesses[0]);
    }
  }, [businesses, selectedBusiness]);

  // Filters
  const [filters, setFilters] = useState<PostFilters>({});

  // Calendar navigation
  const { currentMonth, goToPreviousMonth, goToNextMonth, goToToday } = useCalendarNavigation();

  // Drawer state
  const { isOpen: isDrawerOpen, selectedPostId, mode: drawerMode, openDrawer, closeDrawer, switchToEdit, switchToView } = usePostDrawer();

  // Data fetching
  const { members } = useBusinessMembers(selectedBusiness?.id);
  const { posts, isLoading: postsLoading, refetch: refetchPosts } = useContentPosts(selectedBusiness?.id, filters);
  const { calendarPosts, isLoading: calendarLoading } = useCalendarPosts(selectedBusiness?.id, currentMonth);
  const { post: selectedPost, isLoading: postLoading } = usePost(selectedPostId || undefined);
  const { campaigns } = useCampaigns(selectedBusiness?.id);
  
  // KPI data
  const { kpis: weeklyKPIs, isLoading: weeklyLoading } = useWeeklyKPIs(selectedBusiness?.id);
  const { kpis: monthlyKPIs, isLoading: monthlyLoading } = useMonthlyKPIs(selectedBusiness?.id);
  const { posts: topPosts, isLoading: topPostsLoading } = useTopPerformingPosts(selectedBusiness?.id);

  // Mutations
  const { createPost, updatePost, deletePost, updatePostStatus, isSubmitting } = usePostMutations(
    selectedBusiness?.id,
    () => {
      refetchPosts();
      if (drawerMode !== 'create') {
        closeDrawer();
      }
    }
  );

  // Handlers
  const handleCreateBusiness = async (data: { name: string; description?: string; industry?: string }) => {
    try {
      const supabase = (await import('@/lib/supabase')).supabase;
      
      // Create slug from name
      const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: business, error } = await supabase
        .from('businesses')
        .insert({
          name: data.name,
          slug,
          description: data.description,
          industry: data.industry,
          created_by_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          user_id: user?.id,
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
        });

      refetchBusinesses();
      setSelectedBusiness(business);
      setShowCreateBusinessModal(false);
    } catch (err) {
      console.error('Error creating business:', err);
    }
  };

  const handleSelectPost = useCallback((postId: number) => {
    openDrawer(postId, 'view');
  }, [openDrawer]);

  const handleSelectDate = useCallback((date: Date) => {
    // Pre-fill date when creating new post
    openDrawer(null, 'create');
  }, [openDrawer]);

  const handleSavePost = async (data: any) => {
    if (drawerMode === 'create') {
      await createPost({ ...data, business_id: selectedBusiness?.id });
    } else if (selectedPost) {
      await updatePost({ ...data, id: selectedPost.id });
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(postId);
      closeDrawer();
    }
  };

  const handleStatusChange = async (postId: number, status: PostStatus) => {
    await updatePostStatus(postId, status);
    refetchPosts();
  };

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || businessesLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && <MobileHeader title="Content Calendar" />}

        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Business Selector & Title */}
            <div className="flex items-center gap-4">
              <BusinessSelector
                businesses={businesses}
                selectedBusiness={selectedBusiness}
                onSelect={setSelectedBusiness}
                onCreateNew={() => setShowCreateBusinessModal(true)}
              />
              <div className="hidden md:block">
                <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
                <p className="text-sm text-gray-500">Plan and schedule your content across platforms</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                  title="Calendar View"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('kpi')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'kpi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                  title="KPI Dashboard"
                >
                  <ChartBarIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-300 text-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="w-5 h-5" />
              </button>

              {/* New Post Button */}
              <button
                onClick={() => openDrawer(null, 'create')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">New Post</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
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

                {/* Platform Filter */}
                <select
                  value={filters.platform as string || ''}
                  onChange={(e) => setFilters({ ...filters, platform: e.target.value as Platform || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Platforms</option>
                  {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.name}</option>
                  ))}
                </select>

                {/* Campaign Filter */}
                <select
                  value={filters.campaign_id || ''}
                  onChange={(e) => setFilters({ ...filters, campaign_id: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">All Campaigns</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                  ))}
                </select>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
                />

                {/* Clear Filters */}
                {Object.keys(filters).length > 0 && (
                  <button
                    onClick={() => setFilters({})}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area - Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Main View (Calendar/List/KPI) - Always visible */}
          <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ${isDrawerOpen ? 'lg:mr-[600px]' : ''}`}>
            {!selectedBusiness ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Business</h3>
                <p className="text-gray-500 mb-4">Choose a business to view its content calendar</p>
                <button
                  onClick={() => setShowCreateBusinessModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Business
                </button>
              </div>
            ) : viewMode === 'calendar' ? (
              <Calendar
                currentMonth={currentMonth}
                posts={calendarPosts}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onToday={goToToday}
                onSelectPost={handleSelectPost}
                onSelectDate={handleSelectDate}
                selectedPostId={selectedPostId}
              />
            ) : viewMode === 'list' ? (
              <PostListView
                posts={posts}
                isLoading={postsLoading}
                onSelectPost={handleSelectPost}
                selectedPostId={selectedPostId}
              />
            ) : (
              <KPIDashboard
                weeklyKPIs={weeklyKPIs}
                monthlyKPIs={monthlyKPIs}
                topPosts={topPosts}
                isLoading={weeklyLoading || monthlyLoading || topPostsLoading}
                selectedPlatform={selectedPlatformFilter}
                onPlatformChange={setSelectedPlatformFilter}
              />
            )}
          </div>

          {/* Right: Post Drawer - Overlays on mobile, side panel on desktop */}
          <PostDrawer
            isOpen={isDrawerOpen}
            mode={drawerMode}
            post={selectedPost}
            campaigns={campaigns}
            members={members.map(m => ({ user: m.user! }))}
            isLoading={postLoading}
            isSubmitting={isSubmitting}
            onClose={closeDrawer}
            onEdit={switchToEdit}
            onSave={handleSavePost}
            onDelete={handleDeletePost}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Create Business Modal */}
        <CreateBusinessModal
          isOpen={showCreateBusinessModal}
          onClose={() => setShowCreateBusinessModal(false)}
          onSubmit={handleCreateBusiness}
          isSubmitting={false}
        />
      </main>
    </div>
  );
}

// Post List View Component
function PostListView({
  posts,
  isLoading,
  onSelectPost,
  selectedPostId
}: {
  posts: ContentPost[];
  isLoading: boolean;
  onSelectPost: (postId: number) => void;
  selectedPostId: number | null;
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
        <p className="text-gray-500">Create your first post to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Post</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platforms</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {posts.map(post => (
            <tr
              key={post.id}
              onClick={() => onSelectPost(post.id)}
              className={`cursor-pointer transition-colors ${
                selectedPostId === post.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <p className="text-sm text-gray-500">{CONTENT_TYPE_CONFIG[post.content_type]?.label}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex -space-x-1">
                  {post.platforms?.slice(0, 3).map((platform, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white"
                      style={{ backgroundColor: PLATFORM_CONFIG[platform]?.color || '#6B7280' }}
                      title={PLATFORM_CONFIG[platform]?.name}
                    >
                      {platform.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {(post.platforms?.length || 0) > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs border-2 border-white">
                      +{(post.platforms?.length || 0) - 3}
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <span
                  className="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor: STATUS_CONFIG[post.status]?.bgColor,
                    color: STATUS_CONFIG[post.status]?.color
                  }}
                >
                  {STATUS_CONFIG[post.status]?.label}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {post.planned_publish_at 
                  ? new Date(post.planned_publish_at).toLocaleDateString()
                  : '-'
                }
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {post.owner?.name || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
