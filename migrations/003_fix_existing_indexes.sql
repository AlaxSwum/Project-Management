-- =====================================================
-- FIX: Run this if you got "relation already exists" error
-- This drops existing indexes and recreates them safely
-- =====================================================

-- Drop existing indexes if they exist (safe to run multiple times)
DROP INDEX IF EXISTS idx_businesses_slug;
DROP INDEX IF EXISTS idx_businesses_created_by;
DROP INDEX IF EXISTS idx_businesses_active;
DROP INDEX IF EXISTS idx_business_members_business;
DROP INDEX IF EXISTS idx_business_members_user;
DROP INDEX IF EXISTS idx_business_members_role;
DROP INDEX IF EXISTS idx_campaigns_business;
DROP INDEX IF EXISTS idx_campaigns_status;
DROP INDEX IF EXISTS idx_campaigns_dates;
DROP INDEX IF EXISTS idx_content_posts_business;
DROP INDEX IF EXISTS idx_content_posts_campaign;
DROP INDEX IF EXISTS idx_content_posts_status;
DROP INDEX IF EXISTS idx_content_posts_planned;
DROP INDEX IF EXISTS idx_content_posts_owner;
DROP INDEX IF EXISTS idx_content_posts_designer;
DROP INDEX IF EXISTS idx_content_posts_created;
DROP INDEX IF EXISTS idx_content_post_targets_post;
DROP INDEX IF EXISTS idx_content_post_targets_platform;
DROP INDEX IF EXISTS idx_content_post_targets_scheduled;
DROP INDEX IF EXISTS idx_content_post_metrics_target;
DROP INDEX IF EXISTS idx_content_post_metrics_range;
DROP INDEX IF EXISTS idx_content_post_checklist_post;
DROP INDEX IF EXISTS idx_content_post_approvals_post;
DROP INDEX IF EXISTS idx_content_post_approvals_status;
DROP INDEX IF EXISTS idx_content_templates_business;
DROP INDEX IF EXISTS idx_monthly_plan_templates_business;
DROP INDEX IF EXISTS idx_content_activity_log_business;
DROP INDEX IF EXISTS idx_content_activity_log_post;

-- Now recreate all indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_created_by ON businesses(created_by_id);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active);

CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);
CREATE INDEX IF NOT EXISTS idx_business_members_role ON business_members(role);

CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_content_posts_business ON content_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_campaign ON content_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON content_posts(status);
CREATE INDEX IF NOT EXISTS idx_content_posts_planned ON content_posts(planned_publish_at);
CREATE INDEX IF NOT EXISTS idx_content_posts_owner ON content_posts(owner_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_designer ON content_posts(designer_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_created ON content_posts(created_at);

CREATE INDEX IF NOT EXISTS idx_content_post_targets_post ON content_post_targets(post_id);
CREATE INDEX IF NOT EXISTS idx_content_post_targets_platform ON content_post_targets(platform);
CREATE INDEX IF NOT EXISTS idx_content_post_targets_scheduled ON content_post_targets(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_content_post_metrics_target ON content_post_metrics(post_target_id);
CREATE INDEX IF NOT EXISTS idx_content_post_metrics_range ON content_post_metrics(range_start, range_end);

CREATE INDEX IF NOT EXISTS idx_content_post_checklist_post ON content_post_checklist(post_id);

CREATE INDEX IF NOT EXISTS idx_content_post_approvals_post ON content_post_approvals(post_id);
CREATE INDEX IF NOT EXISTS idx_content_post_approvals_status ON content_post_approvals(status);

CREATE INDEX IF NOT EXISTS idx_content_templates_business ON content_templates(business_id);

CREATE INDEX IF NOT EXISTS idx_monthly_plan_templates_business ON monthly_plan_templates(business_id);

CREATE INDEX IF NOT EXISTS idx_content_activity_log_business ON content_activity_log(business_id);
CREATE INDEX IF NOT EXISTS idx_content_activity_log_post ON content_activity_log(post_id);

-- Verify tables exist
SELECT 'Tables created:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('businesses', 'business_members', 'campaigns', 'content_posts', 'content_post_targets', 'content_post_metrics');
