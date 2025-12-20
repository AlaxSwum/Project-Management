// Content Calendar V3 Types

export type CompanyRole = 'OWNER' | 'MANAGER' | 'EDITOR' | 'VIEWER' | 'ANALYST';
export type TeamFunction = 'marketing_manager' | 'content_writer' | 'designer' | 'video_editor' | 'analyst' | null;
export type ContentType = 'static' | 'photo' | 'reel' | 'video' | 'story' | 'carousel' | 'article';
export type PostStatus = 'idea' | 'draft' | 'design' | 'review' | 'approved' | 'scheduled' | 'published' | 'reported';
export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
export type PlatformStatus = 'planned' | 'scheduled' | 'published' | 'not_posting';
export type MetricScope = 'lifetime' | 'week' | 'month' | 'custom';
export type SecurityLevel = 'public' | 'restricted' | 'confidential' | 'secret';

export interface Company {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  role: CompanyRole;
  team_function: TeamFunction;
  can_manage_members: boolean;
  created_at: string;
}

export interface ContentPost {
  id: string;
  company_id: string;
  campaign_id: string | null;
  title: string;
  description: string | null;
  content_type: ContentType;
  category: string | null;
  status: PostStatus;
  planned_date: string;
  planned_time: string | null;
  content_deadline: string | null;
  graphic_deadline: string | null;
  owner_id: string | null;
  owner_name: string | null;
  designer_id: string | null;
  designer_name: string | null;
  editor_id: string | null;
  editor_name: string | null;
  hashtags: string | null;
  visual_concept: string | null;
  key_points: string | null;
  media_buying_notes: string | null;
  media_budget: number;
  security_level: SecurityLevel;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  targets?: ContentPostTarget[];
}

export interface ContentPostTarget {
  id: string;
  post_id: string;
  platform: Platform;
  platform_status: PlatformStatus;
  publish_at: string | null;
  permalink: string | null;
  manual_posted_by: string | null;
  manual_posted_by_name: string | null;
  manual_posted_at: string | null;
  ad_budget: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  metrics?: ContentPostMetrics[];
}

export interface ContentPostMetrics {
  id: string;
  post_target_id: string;
  metric_scope: MetricScope;
  range_start: string | null;
  range_end: string | null;
  reach: number;
  impressions_views: number;
  interactions: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  net_follows: number;
  views: number;
  clicks: number;
  pulled_at: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyKPIOverview {
  id: string;
  company_id: string;
  report_month: string;
  platform: Platform;
  start_followers: number;
  end_followers: number;
  net_growth: number;
  total_posts: number;
  total_reach: number;
  total_impressions_views: number;
  total_engagement_interactions: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWeeklyKPI {
  id: string;
  company_id: string;
  platform: Platform;
  year: number;
  month: number;
  week_number: number;
  week_start: string | null;
  week_end: string | null;
  start_followers: number;
  end_followers: number;
  followers_gained: number;
  followers_lost: number;
  net_growth: number;
  total_reach: number;
  total_impressions: number;
  total_engagement: number;
  total_likes: number;
  total_comments: number;
  total_shares: number;
  total_saves: number;
  posts_published: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Form types
export interface PostFormData {
  title: string;
  description: string;
  content_type: ContentType;
  category: string;
  status: PostStatus;
  planned_date: string;
  planned_time: string;
  content_deadline: string;
  graphic_deadline: string;
  owner_id: string;
  owner_name: string;
  designer_id: string;
  designer_name: string;
  editor_id: string;
  editor_name: string;
  hashtags: string;
  visual_concept: string;
  key_points: string;
  media_buying_notes: string;
  media_budget: number;
  security_level: SecurityLevel;
  platforms: Platform[];
}

export interface TargetFormData {
  platform: Platform;
  platform_status: PlatformStatus;
  publish_at: string;
  permalink: string;
  notes: string;
}

export interface MetricsFormData {
  metric_scope: MetricScope;
  range_start: string;
  range_end: string;
  reach: number;
  impressions_views: number;
  interactions: number;
  reactions: number;
  comments: number;
  shares: number;
  saves: number;
  net_follows: number;
  views: number;
  clicks: number;
}

export interface KPIFormData {
  report_month: string;
  platform: Platform;
  start_followers: number;
  end_followers: number;
  net_growth: number;
  total_posts: number;
  total_reach: number;
  total_impressions_views: number;
  total_engagement_interactions: number;
  notes: string;
}

// Constants
export const PLATFORMS: Platform[] = ['facebook', 'instagram', 'tiktok', 'linkedin'];
export const CONTENT_TYPES: ContentType[] = ['static', 'photo', 'reel', 'video', 'story', 'carousel', 'article'];
export const POST_STATUSES: PostStatus[] = ['idea', 'draft', 'design', 'review', 'approved', 'scheduled', 'published', 'reported'];
export const PLATFORM_STATUSES: PlatformStatus[] = ['planned', 'scheduled', 'published', 'not_posting'];
export const COMPANY_ROLES: CompanyRole[] = ['OWNER', 'MANAGER', 'EDITOR', 'VIEWER', 'ANALYST'];
export const TEAM_FUNCTIONS: TeamFunction[] = ['marketing_manager', 'content_writer', 'designer', 'video_editor', 'analyst'];

export const STATUS_COLORS: Record<PostStatus, { bg: string; text: string }> = {
  idea: { bg: '#F3E8FF', text: '#9333EA' },
  draft: { bg: '#F3F4F6', text: '#6B7280' },
  design: { bg: '#FEF3C7', text: '#D97706' },
  review: { bg: '#DBEAFE', text: '#3B82F6' },
  approved: { bg: '#D1FAE5', text: '#10B981' },
  scheduled: { bg: '#E0E7FF', text: '#4F46E5' },
  published: { bg: '#DCFCE7', text: '#16A34A' },
  reported: { bg: '#F1F5F9', text: '#475569' }
};

export const PLATFORM_STATUS_COLORS: Record<PlatformStatus, { bg: string; text: string }> = {
  planned: { bg: '#F3F4F6', text: '#6B7280' },
  scheduled: { bg: '#DBEAFE', text: '#3B82F6' },
  published: { bg: '#DCFCE7', text: '#16A34A' },
  not_posting: { bg: '#FEE2E2', text: '#DC2626' }
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  tiktok: '#000000',
  linkedin: '#0A66C2'
};
