-- Fix Content Calendar Data Integrity Issues
-- Run this in Supabase SQL Editor

-- First, let's see what data we have and what needs fixing
SELECT 'Current content_calendar data:' as info;
SELECT id, created_by_id, content_title FROM content_calendar;

SELECT 'Valid user IDs in auth_user:' as info;
SELECT id, email, name FROM auth_user ORDER BY id LIMIT 10;

-- Find the first valid superuser or create a fallback
DO $$
DECLARE
    fallback_user_id INTEGER;
BEGIN
    -- Find the first superuser
    SELECT id INTO fallback_user_id 
    FROM auth_user 
    WHERE is_superuser = true 
    ORDER BY id 
    LIMIT 1;
    
    -- If no superuser found, use the first available user
    IF fallback_user_id IS NULL THEN
        SELECT id INTO fallback_user_id 
        FROM auth_user 
        ORDER BY id 
        LIMIT 1;
    END IF;
    
    -- If still no user found, create a system user
    IF fallback_user_id IS NULL THEN
        INSERT INTO auth_user (
            email, name, password, role, is_superuser, is_staff, is_active,
            date_joined, updated_at
        ) VALUES (
            'system@contentcalendar.app', 
            'Content Calendar System', 
            'system123', 
            'admin', 
            true, 
            true, 
            true,
            NOW(), 
            NOW()
        ) RETURNING id INTO fallback_user_id;
        
        RAISE NOTICE 'Created system user with ID: %', fallback_user_id;
    END IF;
    
    -- Update invalid created_by_id references to use the fallback user
    UPDATE content_calendar 
    SET created_by_id = fallback_user_id 
    WHERE created_by_id NOT IN (SELECT id FROM auth_user);
    
    -- Update any NULL assigned_to arrays to empty arrays
    UPDATE content_calendar 
    SET assigned_to = ARRAY[]::INTEGER[] 
    WHERE assigned_to IS NULL;
    
    -- Clean up any invalid user IDs from assigned_to arrays
    UPDATE content_calendar 
    SET assigned_to = (
        SELECT ARRAY_AGG(user_id) 
        FROM UNNEST(assigned_to) AS user_id 
        WHERE user_id IN (SELECT id FROM auth_user)
    )
    WHERE assigned_to IS NOT NULL;
    
    RAISE NOTICE 'Fixed content_calendar data integrity using fallback user ID: %', fallback_user_id;
END $$;

-- Clean up content_calendar_members table
DELETE FROM content_calendar_members 
WHERE user_id NOT IN (SELECT id FROM auth_user);

-- Now add the foreign key constraints safely
DO $$ 
BEGIN
    -- Add foreign key for content_calendar.created_by_id -> auth_user.id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_calendar_created_by_id_fkey'
    ) THEN
        ALTER TABLE content_calendar 
        ADD CONSTRAINT content_calendar_created_by_id_fkey 
        FOREIGN KEY (created_by_id) REFERENCES auth_user(id);
        RAISE NOTICE 'Added foreign key constraint for content_calendar.created_by_id';
    END IF;

    -- Add foreign key for content_calendar_members.user_id -> auth_user.id  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_calendar_members_user_id_fkey'
    ) THEN
        ALTER TABLE content_calendar_members 
        ADD CONSTRAINT content_calendar_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth_user(id);
        RAISE NOTICE 'Added foreign key constraint for content_calendar_members.user_id';
    END IF;
END $$;

-- Enable RLS on content calendar tables (but make them permissive for now)
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "content_calendar_select_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_insert_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_update_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_delete_policy" ON content_calendar;

DROP POLICY IF EXISTS "content_calendar_members_select_policy" ON content_calendar_members;
DROP POLICY IF EXISTS "content_calendar_members_insert_policy" ON content_calendar_members;
DROP POLICY IF EXISTS "content_calendar_members_update_policy" ON content_calendar_members;
DROP POLICY IF EXISTS "content_calendar_members_delete_policy" ON content_calendar_members;

-- Create permissive RLS policies (allow all authenticated users for now)
CREATE POLICY "content_calendar_select_policy" ON content_calendar
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "content_calendar_insert_policy" ON content_calendar
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_calendar_update_policy" ON content_calendar
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "content_calendar_delete_policy" ON content_calendar
    FOR DELETE TO authenticated USING (true);

CREATE POLICY "content_calendar_members_select_policy" ON content_calendar_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "content_calendar_members_insert_policy" ON content_calendar_members
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "content_calendar_members_update_policy" ON content_calendar_members
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "content_calendar_members_delete_policy" ON content_calendar_members
    FOR DELETE TO authenticated USING (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_calendar TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_calendar_members TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_calendar_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_calendar_members_id_seq TO authenticated;

-- Add all superusers to content calendar access automatically
INSERT INTO content_calendar_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_superuser = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Add all staff to content calendar access automatically  
INSERT INTO content_calendar_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_staff = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify the setup
SELECT 'Data integrity fixed!' as status;
SELECT 'Users with content calendar access:' as info;
SELECT ccm.user_id, au.email, au.name, ccm.role, au.is_superuser, au.is_staff
FROM content_calendar_members ccm
JOIN auth_user au ON ccm.user_id = au.id 
ORDER BY au.is_superuser DESC, au.is_staff DESC, ccm.role DESC; 