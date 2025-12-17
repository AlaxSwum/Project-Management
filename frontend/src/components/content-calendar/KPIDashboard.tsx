'use client';

import { useState, useMemo } from 'react';
import { 
  ChartBarIcon, 
  EyeIcon, 
  HandThumbUpIcon, 
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  UserPlusIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { 
  WeeklyKPISummary, 
  MonthlyKPISummary, 
  TopPerformingPost,
  Platform,
  PLATFORM_CONFIG 
} from '@/types/content-calendar';

interface KPIDashboardProps {
  weeklyKPIs: WeeklyKPISummary[];
  monthlyKPIs: MonthlyKPISummary[];
  topPosts: TopPerformingPost[];
  isLoading: boolean;
  selectedPlatform: Platform | 'all';
  onPlatformChange: (platform: Platform | 'all') => void;
}

export default function KPIDashboard({
  weeklyKPIs,
  monthlyKPIs,
  topPosts,
  isLoading,
  selectedPlatform,
  onPlatformChange
}: KPIDashboardProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  // Aggregate KPIs based on view mode and platform filter
  const aggregatedKPIs = useMemo(() => {
    const data = viewMode === 'weekly' ? weeklyKPIs : monthlyKPIs;
    
    const filtered = selectedPlatform === 'all' 
      ? data 
      : data.filter(k => k.platform === selectedPlatform);

    if (filtered.length === 0) {
      return {
        totalPosts: 0,
        totalReach: 0,
        totalImpressions: 0,
        totalInteractions: 0,
        totalReactions: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaves: 0,
        totalNetFollows: 0,
        avgEngagementRate: 0,
        avgCTR: 0
      };
    }

    return {
      totalPosts: filtered.reduce((sum, k) => sum + k.total_posts, 0),
      totalReach: filtered.reduce((sum, k) => sum + k.total_reach, 0),
      totalImpressions: filtered.reduce((sum, k) => sum + k.total_impressions, 0),
      totalInteractions: filtered.reduce((sum, k) => sum + k.total_interactions, 0),
      totalReactions: filtered.reduce((sum, k) => sum + k.total_reactions, 0),
      totalComments: filtered.reduce((sum, k) => sum + k.total_comments, 0),
      totalShares: filtered.reduce((sum, k) => sum + k.total_shares, 0),
      totalSaves: filtered.reduce((sum, k) => sum + k.total_saves, 0),
      totalNetFollows: filtered.reduce((sum, k) => sum + k.total_net_follows, 0),
      avgEngagementRate: filtered.reduce((sum, k) => sum + k.avg_engagement_rate, 0) / filtered.length,
      avgCTR: filtered.reduce((sum, k) => sum + k.avg_ctr, 0) / filtered.length
    };
  }, [weeklyKPIs, monthlyKPIs, viewMode, selectedPlatform]);

  // Platform breakdown for the current period
  const platformBreakdown = useMemo(() => {
    const data = viewMode === 'weekly' ? weeklyKPIs : monthlyKPIs;
    const platforms: Platform[] = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'];
    
    return platforms.map(platform => {
      const platformData = data.filter(k => k.platform === platform);
      if (platformData.length === 0) return null;
      
      return {
        platform,
        posts: platformData.reduce((sum, k) => sum + k.total_posts, 0),
        reach: platformData.reduce((sum, k) => sum + k.total_reach, 0),
        engagementRate: platformData.reduce((sum, k) => sum + k.avg_engagement_rate, 0) / platformData.length
      };
    }).filter(Boolean);
  }, [weeklyKPIs, monthlyKPIs, viewMode]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">KPI Dashboard</h2>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('weekly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Monthly
              </button>
            </div>

            {/* Platform Filter */}
            <select
              value={selectedPlatform}
              onChange={(e) => onPlatformChange(e.target.value as Platform | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Platforms</option>
              {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <KPICard
            title="Total Posts"
            value={aggregatedKPIs.totalPosts}
            icon={<ChartBarIcon className="w-5 h-5" />}
            color="blue"
          />
          <KPICard
            title="Total Reach"
            value={formatNumber(aggregatedKPIs.totalReach)}
            icon={<EyeIcon className="w-5 h-5" />}
            color="purple"
          />
          <KPICard
            title="Impressions"
            value={formatNumber(aggregatedKPIs.totalImpressions)}
            icon={<EyeIcon className="w-5 h-5" />}
            color="indigo"
          />
          <KPICard
            title="Engagement Rate"
            value={`${aggregatedKPIs.avgEngagementRate.toFixed(2)}%`}
            icon={<ArrowTrendingUpIcon className="w-5 h-5" />}
            color="green"
          />
          <KPICard
            title="Net Followers"
            value={formatNumber(aggregatedKPIs.totalNetFollows)}
            icon={<UserPlusIcon className="w-5 h-5" />}
            color={aggregatedKPIs.totalNetFollows >= 0 ? 'green' : 'red'}
            trend={aggregatedKPIs.totalNetFollows >= 0 ? 'up' : 'down'}
          />
        </div>

        {/* Engagement Breakdown */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Engagement Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <EngagementCard
              label="Reactions"
              value={formatNumber(aggregatedKPIs.totalReactions)}
              icon={<HandThumbUpIcon className="w-4 h-4" />}
            />
            <EngagementCard
              label="Comments"
              value={formatNumber(aggregatedKPIs.totalComments)}
              icon={<ChatBubbleLeftIcon className="w-4 h-4" />}
            />
            <EngagementCard
              label="Shares"
              value={formatNumber(aggregatedKPIs.totalShares)}
              icon={<ShareIcon className="w-4 h-4" />}
            />
            <EngagementCard
              label="Saves"
              value={formatNumber(aggregatedKPIs.totalSaves)}
              icon={<BookmarkIcon className="w-4 h-4" />}
            />
            <EngagementCard
              label="CTR"
              value={`${aggregatedKPIs.avgCTR.toFixed(2)}%`}
              icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
            />
          </div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {platformBreakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Performance</h3>
          <div className="space-y-3">
            {platformBreakdown.map((item: any) => (
              <PlatformRow
                key={item.platform}
                platform={item.platform}
                posts={item.posts}
                reach={item.reach}
                engagementRate={item.engagementRate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Posts */}
      {topPosts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h3>
          <div className="space-y-3">
            {topPosts.slice(0, 5).map((post) => (
              <TopPostRow key={`${post.post_id}-${post.platform}`} post={post} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ 
  title, 
  value, 
  icon, 
  color,
  trend 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'red';
  trend?: 'up' | 'down';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

// Engagement Card Component
function EngagementCard({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string | number; 
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-400">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// Platform Row Component
function PlatformRow({ 
  platform, 
  posts, 
  reach, 
  engagementRate 
}: { 
  platform: Platform; 
  posts: number; 
  reach: number;
  engagementRate: number;
}) {
  const config = PLATFORM_CONFIG[platform];
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: config.color }}
      >
        {platform.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{config.name}</p>
        <p className="text-sm text-gray-500">{posts} posts</p>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">{formatNumber(reach)} reach</p>
        <p className="text-sm text-green-600">{engagementRate.toFixed(2)}% ER</p>
      </div>
    </div>
  );
}

// Top Post Row Component
function TopPostRow({ post }: { post: TopPerformingPost }) {
  const config = PLATFORM_CONFIG[post.platform];
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
      <div className="flex items-center gap-2 min-w-[100px]">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: config.color }}
        >
          {post.platform.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-gray-500">#{post.rank_by_engagement}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{post.title}</p>
        <p className="text-sm text-gray-500">
          {new Date(post.published_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-medium text-gray-900">{formatNumber(post.reach)}</p>
          <p className="text-xs text-gray-500">Reach</p>
        </div>
        <div className="text-right">
          <p className="font-medium text-green-600">{post.engagement_rate?.toFixed(2) || 0}%</p>
          <p className="text-xs text-gray-500">ER</p>
        </div>
      </div>
    </div>
  );
}
