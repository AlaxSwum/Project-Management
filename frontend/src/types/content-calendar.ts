// =====================================================
// CONTENT CALENDAR V2 - TYPE DEFINITIONS
// =====================================================

// =====================================================
// ENUMS
// =====================================================

export type BusinessRole = 'owner' | 'manager' | 'editor' | 'viewer';

export type PostStatus = 
  | 'idea' 
  | 'draft' 
  | 'design' 
  | 'review' 
  | 'approved' 
  | 'scheduled' 
  | 'published' 
  | 'reported';

export type ContentType = 
  | 'image' 
  | 'video' 
  | 'carousel' 
  | 'story' 
  | 'reel' 
  | 'article' 
  | 'poll';

export type Platform = 
  | 'facebook' 
  | 'instagram' 
  | 'twitter' 
  | 'linkedin' 
  | 'tiktok' 
  | 'youtube' 
  | 'pinterest';

export type PlatformStatus = 
  | 'pending' 
  | 'scheduled' 
  | 'publishing' 
  | 'published' 
  | 'failed';

export type ApprovalStep = 
  | 'design_review' 
  | 'content_review' 
  | 'final_approval';

export type ApprovalStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'revision_requested';

export type CampaignStatus = 
  | 'draft' 
  | 'active' 
  | 'paused' 
  | 'completed' 
  | 'archived';

export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type MetricRangeType = 'daily' | 'weekly' | 'monthly' | 'total';

// =====================================================
// BASE INTERFACES
// =====================================================

export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

// =====================================================
// BUSINESS & MEMBERS
// =====================================================

export interface BusinessSettings {
  default_timezone?: string;
  default_platforms?: Platform[];
  approval_workflow_enabled?: boolean;
  auto_schedule_enabled?: boolean;
  brand_colors?: string[];
  brand_fonts?: string[];
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  timezone: string;
  settings: BusinessSettings;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  
  // Joined data
  created_by?: User;
  members?: BusinessMember[];
  member_count?: number;
}

export interface BusinessMemberPermissions {
  can_create_posts: boolean;
  can_edit_posts: boolean;
  can_delete_posts: boolean;
  can_publish: boolean;
  can_approve: boolean;
  can_manage_members: boolean;
  can_view_metrics: boolean;
  can_manage_campaigns: boolean;
}

export interface BusinessMember {
  id: number;
  business_id: number;
  user_id: number;
  role: BusinessRole;
  permissions: BusinessMemberPermissions;
  invited_by_id?: number;
  invited_at: string;
  accepted_at?: string;
  is_active: boolean;
  
  // Joined data
  user?: User;
  invited_by?: User;
  business?: Business;
}

// =====================================================
// CAMPAIGNS
// =====================================================

export interface Campaign {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  objective?: 'awareness' | 'engagement' | 'conversion' | 'retention';
  start_date?: string;
  end_date?: string;
  budget?: number;
  status: CampaignStatus;
  color: string;
  tags?: string[];
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  created_by?: User;
  posts_count?: number;
}

// =====================================================
// CONTENT POSTS
// =====================================================

export interface ContentPost {
  id: number;
  business_id: number;
  campaign_id?: number;
  
  // Content
  title: string;
  caption?: string;
  content_type: ContentType;
  visual_concept?: string;
  key_points?: string[];
  hashtags?: string[];
  media_urls?: string[];
  
  // Workflow
  status: PostStatus;
  
  // Planning
  planned_publish_at?: string;
  
  // Team
  owner_id?: number;
  designer_id?: number;
  editor_id?: number;
  
  // Deadlines
  content_deadline?: string;
  design_deadline?: string;
  review_deadline?: string;
  
  // Media Buying
  is_boosted: boolean;
  boost_budget?: number;
  boost_notes?: string;
  
  // Notes
  notes?: string;
  internal_notes?: string;
  priority: Priority;
  
  // Metadata
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
  
  // Joined data
  business?: Business;
  campaign?: Campaign;
  owner?: User;
  designer?: User;
  editor?: User;
  created_by?: User;
  targets?: ContentPostTarget[];
  checklist?: ContentPostChecklist[];
  approvals?: ContentPostApproval[];
  
  // Computed
  platforms?: Platform[];
  completion_percentage?: number;
}

// =====================================================
// CONTENT POST TARGETS (PER-PLATFORM)
// =====================================================

export interface ContentPostTarget {
  id: number;
  post_id: number;
  
  // Platform
  platform: Platform;
  platform_account_id?: string;
  platform_account_name?: string;
  
  // Platform-Specific Content
  platform_caption?: string;
  platform_media_urls?: string[];
  platform_hashtags?: string[];
  
  // Scheduling
  scheduled_at?: string;
  published_at?: string;
  
  // Status
  platform_status: PlatformStatus;
  platform_post_id?: string;
  permalink?: string;
  
  // Error
  error_message?: string;
  retry_count: number;
  last_retry_at?: string;
  
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  post?: ContentPost;
  metrics?: ContentPostMetrics[];
  latest_metrics?: ContentPostMetrics;
}

// =====================================================
// CONTENT POST METRICS
// =====================================================

export interface ContentPostMetrics {
  id: number;
  post_target_id: number;
  
  // Time Range
  range_type: MetricRangeType;
  range_start: string;
  range_end: string;
  
  // Reach & Visibility
  reach: number;
  impressions: number;
  video_views: number;
  video_watch_time_seconds: number;
  
  // Engagement
  interactions: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  link_clicks: number;
  
  // Followers
  profile_visits: number;
  follows: number;
  unfollows: number;
  net_follows: number;
  
  // Calculated
  engagement_rate?: number;
  click_through_rate?: number;
  
  // Metadata
  pulled_at: string;
  source?: 'api' | 'manual' | 'import';
  raw_data?: Record<string, unknown>;
  
  created_at: string;
  updated_at: string;
  
  // Joined data
  post_target?: ContentPostTarget;
}

// =====================================================
// CHECKLIST & APPROVALS
// =====================================================

export interface ContentPostChecklist {
  id: number;
  post_id: number;
  item_text: string;
  item_order: number;
  is_completed: boolean;
  completed_at?: string;
  completed_by_id?: number;
  created_at: string;
  
  // Joined data
  completed_by?: User;
}

export interface ContentPostApproval {
  id: number;
  post_id: number;
  step: ApprovalStep;
  step_order: number;
  status: ApprovalStatus;
  approver_id?: number;
  approved_at?: string;
  notes?: string;
  revision_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  approver?: User;
  post?: ContentPost;
}

// =====================================================
// TEMPLATES
// =====================================================

export interface ContentTemplate {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  template_type: 'post' | 'campaign' | 'weekly_plan' | 'monthly_plan';
  
  // Template Content
  title_template?: string;
  caption_template?: string;
  content_type?: ContentType;
  visual_concept_template?: string;
  key_points_template?: string[];
  hashtags_template?: string[];
  platforms?: Platform[];
  
  // Scheduling
  day_of_week?: number;
  time_of_day?: string;
  
  // Media Buying
  boost_budget_suggestion?: number;
  boost_notes_template?: string;
  
  is_active: boolean;
  usage_count: number;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  created_by?: User;
}

export interface MonthlyPlanWeekPost {
  day: number; // 1-7
  content_type: ContentType;
  topic: string;
  visual_concept?: string;
  key_points?: string[];
  platforms: Platform[];
  media_buying_notes?: string;
}

export interface MonthlyPlanWeek {
  week_number: number; // 1-5
  posts: MonthlyPlanWeekPost[];
}

export interface MonthlyPlanStructure {
  weeks: MonthlyPlanWeek[];
}

export interface MonthlyPlanTemplate {
  id: number;
  business_id: number;
  name: string;
  description?: string;
  plan_structure: MonthlyPlanStructure;
  is_active: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  created_by?: User;
}

// =====================================================
// ACTIVITY LOG
// =====================================================

export interface ContentActivityLog {
  id: number;
  business_id: number;
  post_id?: number;
  user_id?: number;
  action: string;
  details?: Record<string, unknown>;
  created_at: string;
  
  // Joined data
  user?: User;
  post?: ContentPost;
}

// =====================================================
// KPI SUMMARY TYPES
// =====================================================

export interface WeeklyKPISummary {
  business_id: number;
  platform: Platform;
  week_start: string;
  week_end: string;
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  total_video_views: number;
  total_interactions: number;
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  total_clicks: number;
  total_net_follows: number;
  avg_engagement_rate: number;
  avg_ctr: number;
}

export interface MonthlyKPISummary {
  business_id: number;
  platform: Platform;
  month_start: string;
  month_end: string;
  total_posts: number;
  total_reach: number;
  total_impressions: number;
  total_video_views: number;
  total_interactions: number;
  total_reactions: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  total_clicks: number;
  total_net_follows: number;
  avg_engagement_rate: number;
  avg_ctr: number;
}

export interface TopPerformingPost {
  post_id: number;
  business_id: number;
  title: string;
  content_type: ContentType;
  published_at: string;
  platform: Platform;
  permalink?: string;
  reach: number;
  impressions: number;
  interactions: number;
  engagement_rate: number;
  shares: number;
  saves: number;
  rank_by_engagement: number;
  rank_by_reach: number;
}

// =====================================================
// CALENDAR VIEW TYPES
// =====================================================

export interface CalendarPost {
  post_id: number;
  title: string;
  content_type: ContentType;
  status: PostStatus;
  planned_publish_at: string;
  platforms: Platform[];
  owner_name?: string;
  campaign_name?: string;
  priority: Priority;
}

export interface CalendarDay {
  date: string;
  posts: CalendarPost[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

// =====================================================
// FORM TYPES
// =====================================================

export interface CreatePostInput {
  business_id: number;
  campaign_id?: number;
  title: string;
  caption?: string;
  content_type: ContentType;
  visual_concept?: string;
  key_points?: string[];
  hashtags?: string[];
  media_urls?: string[];
  planned_publish_at?: string;
  owner_id?: number;
  designer_id?: number;
  editor_id?: number;
  content_deadline?: string;
  design_deadline?: string;
  review_deadline?: string;
  is_boosted?: boolean;
  boost_budget?: number;
  boost_notes?: string;
  notes?: string;
  priority?: Priority;
  platforms: Platform[]; // Will create targets for each
  checklist_items?: string[];
}

export interface UpdatePostInput extends Partial<Omit<CreatePostInput, 'business_id'>> {
  id: number;
}

export interface CreateTargetInput {
  post_id: number;
  platform: Platform;
  platform_account_id?: string;
  platform_account_name?: string;
  platform_caption?: string;
  scheduled_at?: string;
}

export interface CreateMetricsInput {
  post_target_id: number;
  range_type: MetricRangeType;
  range_start: string;
  range_end: string;
  reach?: number;
  impressions?: number;
  video_views?: number;
  interactions?: number;
  reactions?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  clicks?: number;
  net_follows?: number;
  source?: 'api' | 'manual' | 'import';
}

// =====================================================
// FILTER TYPES
// =====================================================

export interface PostFilters {
  business_id?: number;
  campaign_id?: number;
  status?: PostStatus | PostStatus[];
  content_type?: ContentType | ContentType[];
  platform?: Platform | Platform[];
  owner_id?: number;
  designer_id?: number;
  priority?: Priority | Priority[];
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface KPIFilters {
  business_id: number;
  platform?: Platform | 'all';
  campaign_id?: number;
  owner_id?: number;
  date_from?: string;
  date_to?: string;
  range_type?: MetricRangeType;
}

// =====================================================
// UI STATE TYPES
// =====================================================

export interface ContentCalendarState {
  // Data
  businesses: Business[];
  currentBusiness: Business | null;
  posts: ContentPost[];
  campaigns: Campaign[];
  templates: ContentTemplate[];
  
  // UI State
  selectedPost: ContentPost | null;
  isDrawerOpen: boolean;
  drawerMode: 'view' | 'edit' | 'create';
  
  // Calendar
  currentMonth: Date;
  calendarView: 'month' | 'week';
  
  // Filters
  filters: PostFilters;
  
  // Loading
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

// =====================================================
// PLATFORM CONFIG
// =====================================================

export const PLATFORM_CONFIG: Record<Platform, {
  name: string;
  color: string;
  icon: string;
  maxCaptionLength?: number;
  maxHashtags?: number;
  supportsVideo: boolean;
  supportsCarousel: boolean;
  supportsStory: boolean;
}> = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: 'facebook',
    maxCaptionLength: 63206,
    supportsVideo: true,
    supportsCarousel: true,
    supportsStory: true,
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    icon: 'instagram',
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportsVideo: true,
    supportsCarousel: true,
    supportsStory: true,
  },
  twitter: {
    name: 'Twitter/X',
    color: '#1DA1F2',
    icon: 'twitter',
    maxCaptionLength: 280,
    supportsVideo: true,
    supportsCarousel: false,
    supportsStory: false,
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    maxCaptionLength: 3000,
    supportsVideo: true,
    supportsCarousel: true,
    supportsStory: false,
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    icon: 'tiktok',
    maxCaptionLength: 2200,
    supportsVideo: true,
    supportsCarousel: false,
    supportsStory: false,
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: 'youtube',
    maxCaptionLength: 5000,
    supportsVideo: true,
    supportsCarousel: false,
    supportsStory: false,
  },
  pinterest: {
    name: 'Pinterest',
    color: '#BD081C',
    icon: 'pinterest',
    maxCaptionLength: 500,
    supportsVideo: true,
    supportsCarousel: true,
    supportsStory: false,
  },
};

export const STATUS_CONFIG: Record<PostStatus, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  idea: { label: 'Idea', color: '#6B7280', bgColor: '#F3F4F6' },
  draft: { label: 'Draft', color: '#F59E0B', bgColor: '#FEF3C7' },
  design: { label: 'Design', color: '#8B5CF6', bgColor: '#EDE9FE' },
  review: { label: 'Review', color: '#3B82F6', bgColor: '#DBEAFE' },
  approved: { label: 'Approved', color: '#10B981', bgColor: '#D1FAE5' },
  scheduled: { label: 'Scheduled', color: '#6366F1', bgColor: '#E0E7FF' },
  published: { label: 'Published', color: '#059669', bgColor: '#A7F3D0' },
  reported: { label: 'Reported', color: '#0891B2', bgColor: '#CFFAFE' },
};

export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string;
  icon: string;
}> = {
  image: { label: 'Image', icon: 'photo' },
  video: { label: 'Video', icon: 'video' },
  carousel: { label: 'Carousel', icon: 'squares' },
  story: { label: 'Story', icon: 'story' },
  reel: { label: 'Reel', icon: 'reel' },
  article: { label: 'Article', icon: 'document' },
  poll: { label: 'Poll', icon: 'chart' },
};
