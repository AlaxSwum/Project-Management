// =====================================================
// CONTENT CALENDAR V2 - CUSTOM HOOKS
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Business, 
  BusinessMember,
  ContentPost, 
  Campaign, 
  ContentTemplate,
  PostFilters,
  CalendarPost,
  WeeklyKPISummary,
  MonthlyKPISummary,
  TopPerformingPost,
  CreatePostInput,
  UpdatePostInput,
  Platform,
  PostStatus
} from '@/types/content-calendar';

// =====================================================
// SUPABASE CLIENT IMPORT
// =====================================================
const getSupabase = async () => {
  const { supabase } = await import('@/lib/supabase');
  return supabase;
};

// =====================================================
// BUSINESS HOOKS
// =====================================================

export function useBusinesses(userId: number | undefined) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      
      // Get businesses where user is a member
      const { data: memberships, error: memberError } = await supabase
        .from('business_members')
        .select('business_id')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (memberError) throw memberError;

      const businessIds = memberships?.map(m => m.business_id) || [];
      
      if (businessIds.length === 0) {
        setBusinesses([]);
        return;
      }

      const { data, error: bizError } = await supabase
        .from('businesses')
        .select('*')
        .in('id', businessIds)
        .eq('is_active', true)
        .order('name');

      if (bizError) throw bizError;
      setBusinesses(data || []);
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Failed to load businesses');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  return { businesses, isLoading, error, refetch: fetchBusinesses };
}

export function useBusinessMembers(businessId: number | undefined) {
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('business_members')
          .select(`
            *,
            user:auth_user(id, name, email)
          `)
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('role');

        if (error) throw error;
        setMembers(data || []);
      } catch (err) {
        console.error('Error fetching members:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [businessId]);

  return { members, isLoading };
}

// =====================================================
// CONTENT POSTS HOOKS
// =====================================================

export function useContentPosts(businessId: number | undefined, filters?: PostFilters) {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    if (!businessId) return;

    setIsLoading(true);
    try {
      const supabase = await getSupabase();
      
      let query = supabase
        .from('content_posts')
        .select(`
          *,
          campaign:campaigns(id, name, color),
          owner:auth_user!owner_id(id, name, email),
          designer:auth_user!designer_id(id, name, email),
          editor:auth_user!editor_id(id, name, email),
          targets:content_post_targets(*),
          checklist:content_post_checklist(*)
        `)
        .eq('business_id', businessId)
        .is('archived_at', null)
        .order('planned_publish_at', { ascending: true, nullsFirst: false });

      // Apply filters
      if (filters?.campaign_id) {
        query = query.eq('campaign_id', filters.campaign_id);
      }
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status);
        } else {
          query = query.eq('status', filters.status);
        }
      }
      if (filters?.content_type) {
        if (Array.isArray(filters.content_type)) {
          query = query.in('content_type', filters.content_type);
        } else {
          query = query.eq('content_type', filters.content_type);
        }
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters?.priority) {
        if (Array.isArray(filters.priority)) {
          query = query.in('priority', filters.priority);
        } else {
          query = query.eq('priority', filters.priority);
        }
      }
      if (filters?.date_from) {
        query = query.gte('planned_publish_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('planned_publish_at', filters.date_to);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,caption.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Process posts to add computed fields
      const processedPosts = (data || []).map(post => ({
        ...post,
        platforms: post.targets?.map((t: any) => t.platform) || [],
        completion_percentage: post.checklist?.length 
          ? Math.round((post.checklist.filter((c: any) => c.is_completed).length / post.checklist.length) * 100)
          : 0
      }));

      setPosts(processedPosts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, filters]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
}

export function usePost(postId: number | undefined) {
  const [post, setPost] = useState<ContentPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!postId) {
      setPost(null);
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('content_posts')
          .select(`
            *,
            campaign:campaigns(id, name, color),
            owner:auth_user!owner_id(id, name, email),
            designer:auth_user!designer_id(id, name, email),
            editor:auth_user!editor_id(id, name, email),
            targets:content_post_targets(*),
            checklist:content_post_checklist(*),
            approvals:content_post_approvals(*)
          `)
          .eq('id', postId)
          .single();

        if (error) throw error;
        setPost({
          ...data,
          platforms: data.targets?.map((t: any) => t.platform) || []
        });
      } catch (err) {
        console.error('Error fetching post:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  return { post, isLoading };
}

// =====================================================
// POST MUTATIONS
// =====================================================

export function usePostMutations(businessId: number | undefined, onSuccess?: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = useCallback(async (input: CreatePostInput) => {
    if (!businessId) return null;

    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabase = await getSupabase();

      // Create the main post
      const { data: post, error: postError } = await supabase
        .from('content_posts')
        .insert({
          business_id: input.business_id,
          campaign_id: input.campaign_id,
          title: input.title,
          caption: input.caption,
          content_type: input.content_type,
          visual_concept: input.visual_concept,
          key_points: input.key_points,
          hashtags: input.hashtags,
          media_urls: input.media_urls,
          planned_publish_at: input.planned_publish_at,
          owner_id: input.owner_id,
          designer_id: input.designer_id,
          editor_id: input.editor_id,
          content_deadline: input.content_deadline,
          design_deadline: input.design_deadline,
          review_deadline: input.review_deadline,
          is_boosted: input.is_boosted || false,
          boost_budget: input.boost_budget,
          boost_notes: input.boost_notes,
          notes: input.notes,
          priority: input.priority || 'normal',
          status: 'idea'
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create targets for each platform
      if (input.platforms?.length > 0) {
        const targets = input.platforms.map(platform => ({
          post_id: post.id,
          platform,
          scheduled_at: input.planned_publish_at
        }));

        const { error: targetError } = await supabase
          .from('content_post_targets')
          .insert(targets);

        if (targetError) throw targetError;
      }

      // Create checklist items if provided
      if (input.checklist_items && input.checklist_items.length > 0) {
        const checklistItems = input.checklist_items.map((item, index) => ({
          post_id: post.id,
          item_text: item,
          item_order: index
        }));

        const { error: checklistError } = await supabase
          .from('content_post_checklist')
          .insert(checklistItems);

        if (checklistError) throw checklistError;
      }

      onSuccess?.();
      return post;
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [businessId, onSuccess]);

  const updatePost = useCallback(async (input: UpdatePostInput) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const supabase = await getSupabase();
      const { id, platforms, checklist_items, ...updateData } = input;

      // Update main post
      const { data: post, error: postError } = await supabase
        .from('content_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (postError) throw postError;

      // Update platforms if provided
      if (platforms) {
        // Remove existing targets
        await supabase
          .from('content_post_targets')
          .delete()
          .eq('post_id', id);

        // Add new targets
        if (platforms.length > 0) {
          const targets = platforms.map(platform => ({
            post_id: id,
            platform,
            scheduled_at: updateData.planned_publish_at
          }));

          await supabase
            .from('content_post_targets')
            .insert(targets);
        }
      }

      onSuccess?.();
      return post;
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  const deletePost = useCallback(async (postId: number) => {
    setIsSubmitting(true);
    try {
      const supabase = await getSupabase();
      
      // Soft delete by setting archived_at
      const { error } = await supabase
        .from('content_posts')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', postId);

      if (error) throw error;
      onSuccess?.();
      return true;
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  const updatePostStatus = useCallback(async (postId: number, status: PostStatus) => {
    setIsSubmitting(true);
    try {
      const supabase = await getSupabase();
      
      const updateData: any = { status };
      if (status === 'published') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_posts')
        .update(updateData)
        .eq('id', postId);

      if (error) throw error;
      onSuccess?.();
      return true;
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSuccess]);

  return { createPost, updatePost, deletePost, updatePostStatus, isSubmitting, error };
}

// =====================================================
// CALENDAR HOOKS
// =====================================================

export function useCalendarPosts(businessId: number | undefined, month: Date) {
  const [calendarPosts, setCalendarPosts] = useState<CalendarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchCalendarPosts = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        
        // Get start and end of month
        const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
        const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

        const { data, error } = await supabase
          .from('content_posts')
          .select(`
            id,
            title,
            content_type,
            status,
            planned_publish_at,
            priority,
            campaign:campaigns(name),
            owner:auth_user!owner_id(name),
            targets:content_post_targets(platform)
          `)
          .eq('business_id', businessId)
          .is('archived_at', null)
          .gte('planned_publish_at', startDate.toISOString())
          .lte('planned_publish_at', endDate.toISOString())
          .order('planned_publish_at');

        if (error) throw error;

        const posts: CalendarPost[] = (data || []).map(post => ({
          post_id: post.id,
          title: post.title,
          content_type: post.content_type,
          status: post.status,
          planned_publish_at: post.planned_publish_at,
          platforms: post.targets?.map((t: any) => t.platform) || [],
          owner_name: post.owner?.name,
          campaign_name: post.campaign?.name,
          priority: post.priority
        }));

        setCalendarPosts(posts);
      } catch (err) {
        console.error('Error fetching calendar posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendarPosts();
  }, [businessId, month]);

  return { calendarPosts, isLoading };
}

// =====================================================
// CAMPAIGNS HOOKS
// =====================================================

export function useCampaigns(businessId: number | undefined) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCampaigns(data || []);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [businessId]);

  return { campaigns, isLoading };
}

// =====================================================
// KPI HOOKS
// =====================================================

export function useWeeklyKPIs(businessId: number | undefined, weekStart?: string) {
  const [kpis, setKpis] = useState<WeeklyKPISummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchKPIs = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        
        let query = supabase
          .from('weekly_kpi_summary')
          .select('*')
          .eq('business_id', businessId);

        if (weekStart) {
          query = query.eq('week_start', weekStart);
        }

        const { data, error } = await query.order('week_start', { ascending: false });

        if (error) throw error;
        setKpis(data || []);
      } catch (err) {
        console.error('Error fetching weekly KPIs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIs();
  }, [businessId, weekStart]);

  return { kpis, isLoading };
}

export function useMonthlyKPIs(businessId: number | undefined, monthStart?: string) {
  const [kpis, setKpis] = useState<MonthlyKPISummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchKPIs = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        
        let query = supabase
          .from('monthly_kpi_summary')
          .select('*')
          .eq('business_id', businessId);

        if (monthStart) {
          query = query.eq('month_start', monthStart);
        }

        const { data, error } = await query.order('month_start', { ascending: false });

        if (error) throw error;
        setKpis(data || []);
      } catch (err) {
        console.error('Error fetching monthly KPIs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKPIs();
  }, [businessId, monthStart]);

  return { kpis, isLoading };
}

export function useTopPerformingPosts(businessId: number | undefined, limit: number = 10) {
  const [posts, setPosts] = useState<TopPerformingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('top_performing_posts')
          .select('*')
          .eq('business_id', businessId)
          .lte('rank_by_engagement', limit)
          .order('rank_by_engagement');

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Error fetching top posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [businessId, limit]);

  return { posts, isLoading };
}

// =====================================================
// TEMPLATES HOOKS
// =====================================================

export function useTemplates(businessId: number | undefined) {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;

    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const supabase = await getSupabase();
        const { data, error } = await supabase
          .from('content_templates')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('usage_count', { ascending: false });

        if (error) throw error;
        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [businessId]);

  return { templates, isLoading };
}

// =====================================================
// UI STATE HOOKS
// =====================================================

export function useCalendarNavigation(initialDate: Date = new Date()) {
  const [currentMonth, setCurrentMonth] = useState(initialDate);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
  }, []);

  const goToMonth = useCallback((date: Date) => {
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  }, []);

  return {
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToMonth
  };
}

export function usePostDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>('view');

  const openDrawer = useCallback((postId: number | null = null, drawerMode: 'view' | 'edit' | 'create' = 'view') => {
    setSelectedPostId(postId);
    setMode(drawerMode);
    setIsOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    // Delay clearing post ID to allow animation
    setTimeout(() => {
      setSelectedPostId(null);
      setMode('view');
    }, 300);
  }, []);

  const switchToEdit = useCallback(() => {
    setMode('edit');
  }, []);

  const switchToView = useCallback(() => {
    setMode('view');
  }, []);

  return {
    isOpen,
    selectedPostId,
    mode,
    openDrawer,
    closeDrawer,
    switchToEdit,
    switchToView
  };
}
