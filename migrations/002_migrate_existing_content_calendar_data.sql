-- =====================================================
-- CONTENT CALENDAR V2 - DATA MIGRATION
-- =====================================================
-- This script migrates existing content_calendar data to the new schema
-- Run AFTER 001_content_calendar_v2_schema.sql
-- =====================================================

-- =====================================================
-- STEP 1: CREATE DEFAULT BUSINESS FOR EXISTING DATA
-- =====================================================

-- Create a default business for existing content
INSERT INTO businesses (name, slug, description, created_by_id, timezone)
SELECT 
    'Default Business',
    'default-business',
    'Migrated from legacy content calendar',
    (SELECT id FROM auth_user ORDER BY id LIMIT 1),
    'UTC'
WHERE NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'default-business');

-- Get the default business ID
DO $$
DECLARE
    v_default_business_id INTEGER;
    v_user_id INTEGER;
BEGIN
    -- Get default business ID
    SELECT id INTO v_default_business_id FROM businesses WHERE slug = 'default-business';
    
    -- Add all existing content calendar members to the default business
    FOR v_user_id IN 
        SELECT DISTINCT user_id FROM content_calendar_members
    LOOP
        INSERT INTO business_members (business_id, user_id, role, permissions, accepted_at)
        SELECT 
            v_default_business_id,
            v_user_id,
            CASE 
                WHEN (SELECT role FROM content_calendar_members WHERE user_id = v_user_id LIMIT 1) = 'admin' THEN 'owner'
                ELSE 'editor'
            END,
            CASE 
                WHEN (SELECT role FROM content_calendar_members WHERE user_id = v_user_id LIMIT 1) = 'admin' THEN 
                    '{"can_create_posts": true, "can_edit_posts": true, "can_delete_posts": true, "can_publish": true, "can_approve": true, "can_manage_members": true, "can_view_metrics": true, "can_manage_campaigns": true}'::jsonb
                ELSE 
                    '{"can_create_posts": true, "can_edit_posts": true, "can_delete_posts": false, "can_publish": false, "can_approve": false, "can_manage_members": false, "can_view_metrics": true, "can_manage_campaigns": false}'::jsonb
            END,
            NOW()
        ON CONFLICT (business_id, user_id) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Default business created with ID: %', v_default_business_id;
END $$;

-- =====================================================
-- STEP 2: CREATE DEFAULT CAMPAIGN FOR MIGRATED CONTENT
-- =====================================================

INSERT INTO campaigns (business_id, name, description, status, color, created_by_id)
SELECT 
    b.id,
    'Migrated Content',
    'Content migrated from legacy content calendar',
    'active',
    '#6B7280',
    b.created_by_id
FROM businesses b
WHERE b.slug = 'default-business'
AND NOT EXISTS (
    SELECT 1 FROM campaigns c 
    WHERE c.business_id = b.id AND c.name = 'Migrated Content'
);

-- =====================================================
-- STEP 3: MIGRATE CONTENT CALENDAR ITEMS TO CONTENT POSTS
-- =====================================================

-- Map old status to new status
CREATE OR REPLACE FUNCTION map_old_status_to_new(old_status TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE old_status
        WHEN 'planning' THEN 'idea'
        WHEN 'in_progress' THEN 'draft'
        WHEN 'review' THEN 'review'
        WHEN 'completed' THEN 'published'
        ELSE 'idea'
    END;
END;
$$ LANGUAGE plpgsql;

-- Map old content type to new content type
CREATE OR REPLACE FUNCTION map_old_content_type(old_type TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE LOWER(old_type)
        WHEN 'video' THEN 'video'
        WHEN 'video content' THEN 'video'
        WHEN 'image' THEN 'image'
        WHEN 'graphic' THEN 'image'
        WHEN 'infographic' THEN 'image'
        WHEN 'post' THEN 'image'
        WHEN 'content' THEN 'image'
        WHEN 'article' THEN 'article'
        WHEN 'story' THEN 'story'
        WHEN 'reel' THEN 'reel'
        WHEN 'carousel' THEN 'carousel'
        ELSE 'image'
    END;
END;
$$ LANGUAGE plpgsql;

-- Migrate content calendar items
DO $$
DECLARE
    v_default_business_id INTEGER;
    v_campaign_id INTEGER;
    v_item RECORD;
    v_new_post_id INTEGER;
    v_platform TEXT;
BEGIN
    -- Get default business and campaign IDs
    SELECT id INTO v_default_business_id FROM businesses WHERE slug = 'default-business';
    SELECT id INTO v_campaign_id FROM campaigns WHERE business_id = v_default_business_id AND name = 'Migrated Content';
    
    -- Loop through existing content calendar items
    FOR v_item IN 
        SELECT * FROM content_calendar 
        WHERE NOT EXISTS (
            -- Skip if already migrated (check by title and date)
            SELECT 1 FROM content_posts cp 
            WHERE cp.title = content_calendar.content_title 
            AND cp.planned_publish_at::DATE = content_calendar.date
        )
    LOOP
        -- Insert into content_posts
        INSERT INTO content_posts (
            business_id,
            campaign_id,
            title,
            caption,
            content_type,
            status,
            planned_publish_at,
            owner_id,
            content_deadline,
            design_deadline,
            notes,
            priority,
            created_by_id,
            created_at,
            updated_at
        ) VALUES (
            v_default_business_id,
            v_campaign_id,
            v_item.content_title,
            v_item.description,
            map_old_content_type(v_item.content_type),
            map_old_status_to_new(v_item.status),
            v_item.date::TIMESTAMP WITH TIME ZONE,
            COALESCE(v_item.assigned_to[1], v_item.created_by_id), -- First assigned user as owner
            v_item.content_deadline::TIMESTAMP WITH TIME ZONE,
            v_item.graphic_deadline::TIMESTAMP WITH TIME ZONE,
            v_item.description,
            'normal',
            v_item.created_by_id,
            v_item.created_at,
            v_item.updated_at
        )
        RETURNING id INTO v_new_post_id;
        
        -- Create target for the platform
        v_platform := LOWER(v_item.social_media);
        IF v_platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest') THEN
            INSERT INTO content_post_targets (
                post_id,
                platform,
                scheduled_at,
                platform_status,
                created_at
            ) VALUES (
                v_new_post_id,
                v_platform,
                v_item.date::TIMESTAMP WITH TIME ZONE,
                CASE map_old_status_to_new(v_item.status)
                    WHEN 'published' THEN 'published'
                    WHEN 'scheduled' THEN 'scheduled'
                    ELSE 'pending'
                END,
                v_item.created_at
            );
        END IF;
        
        RAISE NOTICE 'Migrated: % -> Post ID %', v_item.content_title, v_new_post_id;
    END LOOP;
    
    RAISE NOTICE 'Migration complete!';
END $$;

-- =====================================================
-- STEP 4: VERIFY MIGRATION
-- =====================================================

-- Count comparison
SELECT 'Legacy content_calendar items' as source, COUNT(*) as count FROM content_calendar
UNION ALL
SELECT 'New content_posts' as source, COUNT(*) as count FROM content_posts
UNION ALL
SELECT 'New content_post_targets' as source, COUNT(*) as count FROM content_post_targets;

-- Show migrated businesses
SELECT id, name, slug, created_at FROM businesses ORDER BY id;

-- Show migrated campaigns
SELECT id, business_id, name, status FROM campaigns ORDER BY id;

-- Show sample of migrated posts
SELECT 
    cp.id,
    cp.title,
    cp.content_type,
    cp.status,
    cp.planned_publish_at,
    array_agg(DISTINCT cpt.platform) as platforms
FROM content_posts cp
LEFT JOIN content_post_targets cpt ON cpt.post_id = cp.id
GROUP BY cp.id, cp.title, cp.content_type, cp.status, cp.planned_publish_at
ORDER BY cp.id
LIMIT 10;

-- =====================================================
-- CLEANUP (Optional - Run separately after verification)
-- =====================================================

-- Drop helper functions
-- DROP FUNCTION IF EXISTS map_old_status_to_new(TEXT);
-- DROP FUNCTION IF EXISTS map_old_content_type(TEXT);

-- Note: Keep the old content_calendar tables as backup
-- Only drop after confirming migration success
-- DROP TABLE IF EXISTS content_calendar CASCADE;
-- DROP TABLE IF EXISTS content_calendar_members CASCADE;
-- DROP TABLE IF EXISTS content_calendar_folders CASCADE;
-- DROP TABLE IF EXISTS content_calendar_folder_members CASCADE;

SELECT '✅ Migration script completed!' as status;
SELECT 'Review the counts above and verify data before dropping old tables' as note;
