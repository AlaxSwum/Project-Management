-- Content Calendar V3 - Multi-Company Schema
-- Run this in Supabase SQL Editor

-- Drop existing tables (clean slate)
DROP TABLE IF EXISTS company_kpi_overview CASCADE;
DROP TABLE IF EXISTS content_post_metrics CASCADE;
DROP TABLE IF EXISTS content_post_targets CASCADE;
DROP TABLE IF EXISTS content_posts CASCADE;
DROP TABLE IF EXISTS company_members CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- A) Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- B) Company Members table
CREATE TABLE company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('OWNER', 'MANAGER', 'EDITOR', 'VIEWER', 'ANALYST')),
  team_function TEXT CHECK (team_function IN ('marketing_manager', 'content_writer', 'designer', 'video_editor', 'analyst', NULL)),
  can_manage_members BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

-- C) Content Posts table (one row = one planned content piece)
CREATE TABLE content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  campaign_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL DEFAULT 'static' CHECK (content_type IN ('static', 'photo', 'reel', 'video', 'story', 'carousel', 'article')),
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('idea', 'draft', 'design', 'review', 'approved', 'scheduled', 'published', 'reported')),
  planned_date DATE NOT NULL,
  planned_time TIME,
  content_deadline DATE,
  graphic_deadline DATE,
  owner_id TEXT,
  owner_name TEXT,
  designer_id TEXT,
  designer_name TEXT,
  editor_id TEXT,
  editor_name TEXT,
  hashtags TEXT,
  visual_concept TEXT,
  key_points TEXT,
  media_buying_notes TEXT,
  media_budget DECIMAL(10,2) DEFAULT 0,
  security_level TEXT DEFAULT 'public' CHECK (security_level IN ('public', 'restricted', 'confidential', 'secret')),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- D) Content Post Targets (one post can target multiple platforms)
CREATE TABLE content_post_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'linkedin')),
  platform_status TEXT NOT NULL DEFAULT 'planned' CHECK (platform_status IN ('planned', 'scheduled', 'published', 'not_posting')),
  publish_at TIMESTAMP WITH TIME ZONE,
  permalink TEXT,
  manual_posted_by TEXT,
  manual_posted_by_name TEXT,
  manual_posted_at TIMESTAMP WITH TIME ZONE,
  ad_budget DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, platform)
);

-- E) Content Post Metrics (metrics per platform target)
CREATE TABLE content_post_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_target_id UUID NOT NULL REFERENCES content_post_targets(id) ON DELETE CASCADE,
  metric_scope TEXT NOT NULL DEFAULT 'lifetime' CHECK (metric_scope IN ('lifetime', 'week', 'month', 'custom')),
  range_start DATE,
  range_end DATE,
  reach INTEGER DEFAULT 0,
  impressions_views INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  net_follows INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  pulled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- F) Company KPI Overview (monthly platform totals)
CREATE TABLE company_kpi_overview (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'linkedin')),
  start_followers INTEGER DEFAULT 0,
  end_followers INTEGER DEFAULT 0,
  net_growth INTEGER DEFAULT 0,
  total_posts INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions_views INTEGER DEFAULT 0,
  total_engagement_interactions INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, report_month, platform)
);

-- G) Weekly KPI Data (weekly metrics per platform)
CREATE TABLE company_weekly_kpi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'linkedin')),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 5),
  week_start DATE,
  week_end DATE,
  start_followers INTEGER DEFAULT 0,
  end_followers INTEGER DEFAULT 0,
  followers_gained INTEGER DEFAULT 0,
  followers_lost INTEGER DEFAULT 0,
  net_growth INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, platform, year, month, week_number)
);

-- Create indexes
CREATE INDEX idx_companies_is_active ON companies(is_active);
CREATE INDEX idx_company_members_company_id ON company_members(company_id);
CREATE INDEX idx_company_members_user_id ON company_members(user_id);
CREATE INDEX idx_content_posts_company_id ON content_posts(company_id);
CREATE INDEX idx_content_posts_planned_date ON content_posts(planned_date);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_post_targets_post_id ON content_post_targets(post_id);
CREATE INDEX idx_content_post_targets_platform ON content_post_targets(platform);
CREATE INDEX idx_content_post_targets_platform_status ON content_post_targets(platform_status);
CREATE INDEX idx_content_post_metrics_post_target_id ON content_post_metrics(post_target_id);
CREATE INDEX idx_content_post_metrics_range ON content_post_metrics(range_start, range_end);
CREATE INDEX idx_company_kpi_company_month ON company_kpi_overview(company_id, report_month);
CREATE INDEX idx_company_weekly_kpi_lookup ON company_weekly_kpi(company_id, platform, year, month);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_kpi_overview ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_weekly_kpi ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view companies they belong to" ON companies
  FOR SELECT USING (true);

CREATE POLICY "Users can create companies" ON companies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update companies" ON companies
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete companies" ON companies
  FOR DELETE USING (true);

-- RLS Policies for company_members
CREATE POLICY "Users can view company members" ON company_members
  FOR SELECT USING (true);

CREATE POLICY "Users can manage company members" ON company_members
  FOR ALL USING (true);

-- RLS Policies for content_posts
CREATE POLICY "Users can view posts" ON content_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON content_posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update posts" ON content_posts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete posts" ON content_posts
  FOR DELETE USING (true);

-- RLS Policies for content_post_targets
CREATE POLICY "Users can view targets" ON content_post_targets
  FOR SELECT USING (true);

CREATE POLICY "Users can manage targets" ON content_post_targets
  FOR ALL USING (true);

-- RLS Policies for content_post_metrics
CREATE POLICY "Users can view metrics" ON content_post_metrics
  FOR SELECT USING (true);

CREATE POLICY "Users can manage metrics" ON content_post_metrics
  FOR ALL USING (true);

-- RLS Policies for company_kpi_overview
CREATE POLICY "Users can view KPI" ON company_kpi_overview
  FOR SELECT USING (true);

CREATE POLICY "Users can manage KPI" ON company_kpi_overview
  FOR ALL USING (true);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_post_targets_updated_at BEFORE UPDATE ON content_post_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_content_post_metrics_updated_at BEFORE UPDATE ON content_post_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_kpi_overview_updated_at BEFORE UPDATE ON company_kpi_overview FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify
SELECT 'Content Calendar V3 Schema created successfully!' AS status;


