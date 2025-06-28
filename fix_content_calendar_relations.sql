-- Fix Content Calendar Database Relations and Permissions
-- Run this in Supabase SQL Editor

-- Add foreign key constraints if they don't exist
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
    END IF;

    -- Add foreign key for content_calendar_members.user_id -> auth_user.id  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'content_calendar_members_user_id_fkey'
    ) THEN
        ALTER TABLE content_calendar_members 
        ADD CONSTRAINT content_calendar_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth_user(id);
    END IF;
END $$;

-- Enable RLS on content calendar tables
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

-- Create RLS policies for content_calendar
-- Allow SELECT for members and superusers/staff
CREATE POLICY "content_calendar_select_policy" ON content_calendar
    FOR SELECT USING (
        -- Allow if user is a content calendar member
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int
        )
        OR
        -- Allow if user is superuser or staff
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Allow INSERT for members and superusers/staff
CREATE POLICY "content_calendar_insert_policy" ON content_calendar
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int
        )
        OR
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Allow UPDATE for members and superusers/staff
CREATE POLICY "content_calendar_update_policy" ON content_calendar
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int
        )
        OR
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Allow DELETE for admins and superusers/staff
CREATE POLICY "content_calendar_delete_policy" ON content_calendar
    FOR DELETE USING (
        -- Allow if user is admin member or created the item
        (
            EXISTS (
                SELECT 1 FROM content_calendar_members 
                WHERE user_id = auth.uid()::int AND role = 'admin'
            )
            OR created_by_id = auth.uid()::int
        )
        OR
        -- Allow superusers/staff
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Create RLS policies for content_calendar_members
-- Allow SELECT for all authenticated users (needed for access checks)
CREATE POLICY "content_calendar_members_select_policy" ON content_calendar_members
    FOR SELECT USING (true);

-- Allow INSERT for admin members and superusers/staff
CREATE POLICY "content_calendar_members_insert_policy" ON content_calendar_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Allow UPDATE for admin members and superusers/staff
CREATE POLICY "content_calendar_members_update_policy" ON content_calendar_members
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Allow DELETE for admin members and superusers/staff
CREATE POLICY "content_calendar_members_delete_policy" ON content_calendar_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM auth_user 
            WHERE id = auth.uid()::int 
            AND (is_superuser = true OR is_staff = true)
        )
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_calendar TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_calendar_members TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_calendar_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_calendar_members_id_seq TO authenticated;

-- Create a helper function to check if current user has content calendar access
CREATE OR REPLACE FUNCTION has_content_calendar_access()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is a content calendar member
    IF EXISTS (
        SELECT 1 FROM content_calendar_members 
        WHERE user_id = auth.uid()::int
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is superuser or staff
    IF EXISTS (
        SELECT 1 FROM auth_user 
        WHERE id = auth.uid()::int 
        AND (is_superuser = true OR is_staff = true)
    ) THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add superusers to content calendar access automatically
INSERT INTO content_calendar_members (user_id, role)
SELECT id, 'admin'
FROM auth_user 
WHERE is_superuser = true
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Add staff to content calendar access automatically  
INSERT INTO content_calendar_members (user_id, role)
SELECT id, 'member'
FROM auth_user 
WHERE is_staff = true AND is_superuser = false
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verify the setup
SELECT 'Content Calendar Setup Complete!' as status;
SELECT 'Superusers with access:', count(*) as count 
FROM content_calendar_members ccm
JOIN auth_user au ON ccm.user_id = au.id 
WHERE au.is_superuser = true; 