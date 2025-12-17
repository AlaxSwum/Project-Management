-- =====================================================
-- CONTENT CALENDAR V2 - MULTI-BUSINESS WORKSPACE SCHEMA
-- =====================================================
-- This migration upgrades the content calendar to support:
-- 1. Multi-business workspaces
-- 2. Single post -> Multiple platform targets (no duplication)
-- 3. Per-target metrics for KPI reporting
-- 4. Campaigns and templates
-- 5. Workflow and approvals
-- =====================================================

-- =====================================================
-- 1. BUSINESSES (WORKSPACES)
-- =====================================================
CREATE TABLE IF NOT EXISTS businesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    website VARCHAR(500),
    industry VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_created_by ON businesses(created_by_id);
CREATE INDEX idx_businesses_active ON businesses(is_active);

-- =====================================================
-- 2. BUSINESS MEMBERS (ROLES & PERMISSIONS)
-- =====================================================
CREATE TABLE IF NOT EXISTS business_members (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer', -- owner, manager, editor, viewer
    permissions JSONB DEFAULT '{
        "can_create_posts": false,
        "can_edit_posts": false,
        "can_delete_posts": false,
        "can_publish": false,
        "can_approve": false,
        "can_manage_members": false,
        "can_view_metrics": false,
        "can_manage_campaigns": false
    }',
    invited_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(business_id, user_id)
);

CREATE INDEX idx_business_members_business ON business_members(business_id);
CREATE INDEX idx_business_members_user ON business_members(user_id);
CREATE INDEX idx_business_members_role ON business_members(role);

-- =====================================================
-- 3. CAMPAIGNS
-- =====================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    objective VARCHAR(100), -- awareness, engagement, conversion, retention
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed, archived
    color VARCHAR(7) DEFAULT '#3B82F6',
    tags TEXT[],
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_business ON campaigns(business_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- =====================================================
-- 4. CONTENT POSTS (SINGLE SOURCE OF TRUTH)
-- =====================================================
CREATE TABLE IF NOT EXISTS content_posts (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Content Details
    title VARCHAR(500) NOT NULL,
    caption TEXT,
    content_type VARCHAR(50) NOT NULL, -- image, video, carousel, story, reel, article, poll
    visual_concept TEXT,
    key_points TEXT[],
    hashtags TEXT[],
    media_urls TEXT[], -- Array of media file URLs
    
    -- Workflow Status
    status VARCHAR(50) NOT NULL DEFAULT 'idea', 
    -- idea -> draft -> design -> review -> approved -> scheduled -> published -> reported
    
    -- Planning
    planned_publish_at TIMESTAMP WITH TIME ZONE,
    
    -- Team Assignment
    owner_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    designer_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    editor_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    
    -- Deadlines
    content_deadline TIMESTAMP WITH TIME ZONE,
    design_deadline TIMESTAMP WITH TIME ZONE,
    review_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Media Buying
    is_boosted BOOLEAN DEFAULT false,
    boost_budget DECIMAL(10, 2),
    boost_notes TEXT,
    
    -- Additional
    notes TEXT,
    internal_notes TEXT, -- Private notes not visible to clients
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Metadata
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_content_posts_business ON content_posts(business_id);
CREATE INDEX idx_content_posts_campaign ON content_posts(campaign_id);
CREATE INDEX idx_content_posts_status ON content_posts(status);
CREATE INDEX idx_content_posts_planned ON content_posts(planned_publish_at);
CREATE INDEX idx_content_posts_owner ON content_posts(owner_id);
CREATE INDEX idx_content_posts_designer ON content_posts(designer_id);
CREATE INDEX idx_content_posts_created ON content_posts(created_at);

-- =====================================================
-- 5. CONTENT POST TARGETS (PER-PLATFORM PUBLISHING)
-- =====================================================
CREATE TABLE IF NOT EXISTS content_post_targets (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    
    -- Platform Details
    platform VARCHAR(50) NOT NULL, -- facebook, instagram, twitter, linkedin, tiktok, youtube, pinterest
    platform_account_id VARCHAR(255), -- ID of the connected account
    platform_account_name VARCHAR(255), -- Name of the account
    
    -- Platform-Specific Content
    platform_caption TEXT, -- Override caption for this platform
    platform_media_urls TEXT[], -- Platform-specific media if different
    platform_hashtags TEXT[], -- Platform-specific hashtags
    
    -- Scheduling
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Platform Status
    platform_status VARCHAR(50) DEFAULT 'pending', -- pending, scheduled, publishing, published, failed
    platform_post_id VARCHAR(255), -- ID from the platform after publishing
    permalink VARCHAR(1000), -- Direct link to the published post
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_id, platform, platform_account_id)
);

CREATE INDEX idx_content_post_targets_post ON content_post_targets(post_id);
CREATE INDEX idx_content_post_targets_platform ON content_post_targets(platform);
CREATE INDEX idx_content_post_targets_scheduled ON content_post_targets(scheduled_at);
CREATE INDEX idx_content_post_targets_status ON content_post_targets(platform_status);

-- =====================================================
-- 6. CONTENT POST METRICS (KPI TRACKING)
-- =====================================================
CREATE TABLE IF NOT EXISTS content_post_metrics (
    id SERIAL PRIMARY KEY,
    post_target_id INTEGER NOT NULL REFERENCES content_post_targets(id) ON DELETE CASCADE,
    
    -- Time Range
    range_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, total
    range_start DATE NOT NULL,
    range_end DATE NOT NULL,
    
    -- Reach & Visibility
    reach INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    video_views INTEGER DEFAULT 0,
    video_watch_time_seconds INTEGER DEFAULT 0,
    
    -- Engagement
    interactions INTEGER DEFAULT 0, -- Total of all engagement
    reactions INTEGER DEFAULT 0, -- Likes, loves, etc.
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    
    -- Followers
    profile_visits INTEGER DEFAULT 0,
    follows INTEGER DEFAULT 0,
    unfollows INTEGER DEFAULT 0,
    net_follows INTEGER DEFAULT 0, -- follows - unfollows
    
    -- Calculated Metrics
    engagement_rate DECIMAL(5, 2), -- (interactions / reach) * 100
    click_through_rate DECIMAL(5, 2), -- (clicks / impressions) * 100
    
    -- Metadata
    pulled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50), -- api, manual, import
    raw_data JSONB, -- Store full API response for reference
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(post_target_id, range_type, range_start, range_end)
);

CREATE INDEX idx_content_post_metrics_target ON content_post_metrics(post_target_id);
CREATE INDEX idx_content_post_metrics_range ON content_post_metrics(range_type, range_start, range_end);
CREATE INDEX idx_content_post_metrics_pulled ON content_post_metrics(pulled_at);

-- =====================================================
-- 7. CONTENT POST CHECKLIST
-- =====================================================
CREATE TABLE IF NOT EXISTS content_post_checklist (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    item_text VARCHAR(500) NOT NULL,
    item_order INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_post_checklist_post ON content_post_checklist(post_id);

-- =====================================================
-- 8. APPROVALS (WORKFLOW)
-- =====================================================
CREATE TABLE IF NOT EXISTS content_post_approvals (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
    step VARCHAR(50) NOT NULL, -- design_review, content_review, final_approval
    step_order INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, revision_requested
    approver_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    revision_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_post_approvals_post ON content_post_approvals(post_id);
CREATE INDEX idx_content_post_approvals_step ON content_post_approvals(step);
CREATE INDEX idx_content_post_approvals_approver ON content_post_approvals(approver_id);

-- =====================================================
-- 9. CONTENT TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS content_templates (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) DEFAULT 'post', -- post, campaign, weekly_plan, monthly_plan
    
    -- Template Content
    title_template VARCHAR(500),
    caption_template TEXT,
    content_type VARCHAR(50),
    visual_concept_template TEXT,
    key_points_template TEXT[],
    hashtags_template TEXT[],
    platforms TEXT[], -- Which platforms this template is for
    
    -- Scheduling Template
    day_of_week INTEGER, -- 0-6 for weekly templates
    time_of_day TIME,
    
    -- Media Buying Template
    boost_budget_suggestion DECIMAL(10, 2),
    boost_notes_template TEXT,
    
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_templates_business ON content_templates(business_id);
CREATE INDEX idx_content_templates_type ON content_templates(template_type);

-- =====================================================
-- 10. MONTHLY PLAN TEMPLATES
-- =====================================================
CREATE TABLE IF NOT EXISTS monthly_plan_templates (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Plan Structure (JSONB for flexibility)
    -- Structure: { weeks: [{ week_number, posts: [{ day, content_type, topic, visual_concept, key_points, platforms }] }] }
    plan_structure JSONB NOT NULL DEFAULT '{"weeks": []}',
    
    is_active BOOLEAN DEFAULT true,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_monthly_plan_templates_business ON monthly_plan_templates(business_id);

-- =====================================================
-- 11. ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS content_activity_log (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES content_posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- created, updated, status_changed, approved, published, etc.
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_content_activity_log_business ON content_activity_log(business_id);
CREATE INDEX idx_content_activity_log_post ON content_activity_log(post_id);
CREATE INDEX idx_content_activity_log_user ON content_activity_log(user_id);
CREATE INDEX idx_content_activity_log_created ON content_activity_log(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_businesses_updated_at ON businesses;
CREATE TRIGGER trigger_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_campaigns_updated_at ON campaigns;
CREATE TRIGGER trigger_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_content_posts_updated_at ON content_posts;
CREATE TRIGGER trigger_content_posts_updated_at
    BEFORE UPDATE ON content_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_content_post_targets_updated_at ON content_post_targets;
CREATE TRIGGER trigger_content_post_targets_updated_at
    BEFORE UPDATE ON content_post_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_content_post_metrics_updated_at ON content_post_metrics;
CREATE TRIGGER trigger_content_post_metrics_updated_at
    BEFORE UPDATE ON content_post_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_content_templates_updated_at ON content_templates;
CREATE TRIGGER trigger_content_templates_updated_at
    BEFORE UPDATE ON content_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_post_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_activity_log ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is member of business
CREATE OR REPLACE FUNCTION is_business_member(p_business_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM business_members 
        WHERE business_id = p_business_id 
        AND user_id = p_user_id 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get user's role in business
CREATE OR REPLACE FUNCTION get_business_role(p_business_id INTEGER, p_user_id BIGINT)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_role VARCHAR(50);
BEGIN
    SELECT role INTO v_role 
    FROM business_members 
    WHERE business_id = p_business_id 
    AND user_id = p_user_id 
    AND is_active = true;
    
    RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user can edit in business
CREATE OR REPLACE FUNCTION can_edit_in_business(p_business_id INTEGER, p_user_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(50);
    v_permissions JSONB;
BEGIN
    SELECT role, permissions INTO v_role, v_permissions
    FROM business_members 
    WHERE business_id = p_business_id 
    AND user_id = p_user_id 
    AND is_active = true;
    
    IF v_role IN ('owner', 'manager') THEN
        RETURN true;
    END IF;
    
    RETURN COALESCE((v_permissions->>'can_edit_posts')::BOOLEAN, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Businesses policies
CREATE POLICY businesses_select_policy ON businesses
    FOR SELECT USING (
        is_active = true AND (
            created_by_id = (SELECT id FROM auth_user WHERE id = current_setting('app.current_user_id', true)::INTEGER)
            OR is_business_member(id, current_setting('app.current_user_id', true)::BIGINT)
        )
    );

CREATE POLICY businesses_insert_policy ON businesses
    FOR INSERT WITH CHECK (true);

CREATE POLICY businesses_update_policy ON businesses
    FOR UPDATE USING (
        get_business_role(id, current_setting('app.current_user_id', true)::BIGINT) IN ('owner', 'manager')
    );

-- Business members policies
CREATE POLICY business_members_select_policy ON business_members
    FOR SELECT USING (
        user_id = current_setting('app.current_user_id', true)::INTEGER
        OR is_business_member(business_id, current_setting('app.current_user_id', true)::BIGINT)
    );

-- Content posts policies
CREATE POLICY content_posts_select_policy ON content_posts
    FOR SELECT USING (
        is_business_member(business_id, current_setting('app.current_user_id', true)::BIGINT)
    );

CREATE POLICY content_posts_insert_policy ON content_posts
    FOR INSERT WITH CHECK (
        can_edit_in_business(business_id, current_setting('app.current_user_id', true)::BIGINT)
    );

CREATE POLICY content_posts_update_policy ON content_posts
    FOR UPDATE USING (
        can_edit_in_business(business_id, current_setting('app.current_user_id', true)::BIGINT)
    );

CREATE POLICY content_posts_delete_policy ON content_posts
    FOR DELETE USING (
        get_business_role(business_id, current_setting('app.current_user_id', true)::BIGINT) IN ('owner', 'manager')
    );

-- =====================================================
-- KPI AGGREGATION VIEWS
-- =====================================================

-- Weekly KPI Summary View
CREATE OR REPLACE VIEW weekly_kpi_summary AS
SELECT 
    cp.business_id,
    cpt.platform,
    DATE_TRUNC('week', cpm.range_start)::DATE as week_start,
    DATE_TRUNC('week', cpm.range_start)::DATE + INTERVAL '6 days' as week_end,
    COUNT(DISTINCT cp.id) as total_posts,
    SUM(cpm.reach) as total_reach,
    SUM(cpm.impressions) as total_impressions,
    SUM(cpm.video_views) as total_video_views,
    SUM(cpm.interactions) as total_interactions,
    SUM(cpm.reactions) as total_reactions,
    SUM(cpm.comments) as total_comments,
    SUM(cpm.shares) as total_shares,
    SUM(cpm.saves) as total_saves,
    SUM(cpm.clicks) as total_clicks,
    SUM(cpm.net_follows) as total_net_follows,
    ROUND(AVG(cpm.engagement_rate), 2) as avg_engagement_rate,
    ROUND(AVG(cpm.click_through_rate), 2) as avg_ctr
FROM content_posts cp
JOIN content_post_targets cpt ON cpt.post_id = cp.id
LEFT JOIN content_post_metrics cpm ON cpm.post_target_id = cpt.id AND cpm.range_type = 'weekly'
WHERE cp.status IN ('published', 'reported')
GROUP BY cp.business_id, cpt.platform, DATE_TRUNC('week', cpm.range_start);

-- Monthly KPI Summary View
CREATE OR REPLACE VIEW monthly_kpi_summary AS
SELECT 
    cp.business_id,
    cpt.platform,
    DATE_TRUNC('month', cpm.range_start)::DATE as month_start,
    (DATE_TRUNC('month', cpm.range_start) + INTERVAL '1 month - 1 day')::DATE as month_end,
    COUNT(DISTINCT cp.id) as total_posts,
    SUM(cpm.reach) as total_reach,
    SUM(cpm.impressions) as total_impressions,
    SUM(cpm.video_views) as total_video_views,
    SUM(cpm.interactions) as total_interactions,
    SUM(cpm.reactions) as total_reactions,
    SUM(cpm.comments) as total_comments,
    SUM(cpm.shares) as total_shares,
    SUM(cpm.saves) as total_saves,
    SUM(cpm.clicks) as total_clicks,
    SUM(cpm.net_follows) as total_net_follows,
    ROUND(AVG(cpm.engagement_rate), 2) as avg_engagement_rate,
    ROUND(AVG(cpm.click_through_rate), 2) as avg_ctr
FROM content_posts cp
JOIN content_post_targets cpt ON cpt.post_id = cp.id
LEFT JOIN content_post_metrics cpm ON cpm.post_target_id = cpt.id AND cpm.range_type = 'monthly'
WHERE cp.status IN ('published', 'reported')
GROUP BY cp.business_id, cpt.platform, DATE_TRUNC('month', cpm.range_start);

-- Top Performing Posts View
CREATE OR REPLACE VIEW top_performing_posts AS
SELECT 
    cp.id as post_id,
    cp.business_id,
    cp.title,
    cp.content_type,
    cp.published_at,
    cpt.platform,
    cpt.permalink,
    cpm.reach,
    cpm.impressions,
    cpm.interactions,
    cpm.engagement_rate,
    cpm.shares,
    cpm.saves,
    ROW_NUMBER() OVER (
        PARTITION BY cp.business_id, cpt.platform 
        ORDER BY cpm.engagement_rate DESC NULLS LAST
    ) as rank_by_engagement,
    ROW_NUMBER() OVER (
        PARTITION BY cp.business_id, cpt.platform 
        ORDER BY cpm.reach DESC NULLS LAST
    ) as rank_by_reach
FROM content_posts cp
JOIN content_post_targets cpt ON cpt.post_id = cp.id
LEFT JOIN content_post_metrics cpm ON cpm.post_target_id = cpt.id AND cpm.range_type = 'total'
WHERE cp.status IN ('published', 'reported');

-- =====================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

-- Create post with multiple targets
CREATE OR REPLACE FUNCTION create_post_with_targets(
    p_business_id INTEGER,
    p_title VARCHAR(500),
    p_caption TEXT,
    p_content_type VARCHAR(50),
    p_planned_publish_at TIMESTAMP WITH TIME ZONE,
    p_platforms TEXT[],
    p_created_by_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_post_id INTEGER;
    v_platform TEXT;
BEGIN
    -- Insert the main post
    INSERT INTO content_posts (
        business_id, title, caption, content_type, 
        planned_publish_at, created_by_id, owner_id
    ) VALUES (
        p_business_id, p_title, p_caption, p_content_type,
        p_planned_publish_at, p_created_by_id, p_created_by_id
    ) RETURNING id INTO v_post_id;
    
    -- Insert targets for each platform
    FOREACH v_platform IN ARRAY p_platforms
    LOOP
        INSERT INTO content_post_targets (
            post_id, platform, scheduled_at
        ) VALUES (
            v_post_id, v_platform, p_planned_publish_at
        );
    END LOOP;
    
    RETURN v_post_id;
END;
$$ LANGUAGE plpgsql;

-- Get posts for calendar (with targets aggregated)
CREATE OR REPLACE FUNCTION get_calendar_posts(
    p_business_id INTEGER,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    post_id INTEGER,
    title VARCHAR(500),
    content_type VARCHAR(50),
    status VARCHAR(50),
    planned_publish_at TIMESTAMP WITH TIME ZONE,
    platforms TEXT[],
    owner_name VARCHAR(255),
    campaign_name VARCHAR(255),
    priority VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id as post_id,
        cp.title,
        cp.content_type,
        cp.status,
        cp.planned_publish_at,
        ARRAY_AGG(DISTINCT cpt.platform) as platforms,
        au.name as owner_name,
        c.name as campaign_name,
        cp.priority
    FROM content_posts cp
    LEFT JOIN content_post_targets cpt ON cpt.post_id = cp.id
    LEFT JOIN auth_user au ON au.id = cp.owner_id
    LEFT JOIN campaigns c ON c.id = cp.campaign_id
    WHERE cp.business_id = p_business_id
    AND cp.planned_publish_at::DATE BETWEEN p_start_date AND p_end_date
    AND cp.archived_at IS NULL
    GROUP BY cp.id, cp.title, cp.content_type, cp.status, 
             cp.planned_publish_at, au.name, c.name, cp.priority
    ORDER BY cp.planned_publish_at;
END;
$$ LANGUAGE plpgsql;

-- Calculate and store engagement rate
CREATE OR REPLACE FUNCTION calculate_engagement_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reach > 0 THEN
        NEW.engagement_rate := ROUND((NEW.interactions::DECIMAL / NEW.reach) * 100, 2);
    ELSE
        NEW.engagement_rate := 0;
    END IF;
    
    IF NEW.impressions > 0 THEN
        NEW.click_through_rate := ROUND((NEW.clicks::DECIMAL / NEW.impressions) * 100, 2);
    ELSE
        NEW.click_through_rate := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_engagement ON content_post_metrics;
CREATE TRIGGER trigger_calculate_engagement
    BEFORE INSERT OR UPDATE ON content_post_metrics
    FOR EACH ROW EXECUTE FUNCTION calculate_engagement_rate();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE businesses IS 'Multi-tenant business workspaces';
COMMENT ON TABLE business_members IS 'Users belonging to businesses with role-based access';
COMMENT ON TABLE campaigns IS 'Marketing campaigns to group related content';
COMMENT ON TABLE content_posts IS 'Single source of truth for content - no duplication';
COMMENT ON TABLE content_post_targets IS 'Per-platform publishing info for each post';
COMMENT ON TABLE content_post_metrics IS 'KPI metrics per platform target';
COMMENT ON TABLE content_post_approvals IS 'Workflow approval steps';
COMMENT ON TABLE content_templates IS 'Reusable content templates';
COMMENT ON TABLE monthly_plan_templates IS 'Monthly content planning templates';

SELECT 'Content Calendar V2 Schema Created Successfully!' as status;
