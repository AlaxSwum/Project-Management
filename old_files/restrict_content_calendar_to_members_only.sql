-- Restrict Content Calendar Access to Assigned Members Only
-- This script removes admin/HR/superuser bypass and enforces strict member-only access

-- Drop existing policies
DROP POLICY IF EXISTS "content_calendar_select_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_insert_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_update_policy" ON content_calendar;
DROP POLICY IF EXISTS "content_calendar_delete_policy" ON content_calendar;

-- Create new SELECT policy - only members can view
CREATE POLICY "content_calendar_select_policy" ON content_calendar
    FOR SELECT USING (
        -- Must be a content calendar member
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int
        )
        OR
        -- OR must be a folder member
        EXISTS (
            SELECT 1 FROM content_calendar_folder_members 
            WHERE user_id = auth.uid()::int
        )
    );

-- Create new INSERT policy - only admin members can create
CREATE POLICY "content_calendar_insert_policy" ON content_calendar
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Create new UPDATE policy - only admin members can update
CREATE POLICY "content_calendar_update_policy" ON content_calendar
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Create new DELETE policy - only admin members can delete
CREATE POLICY "content_calendar_delete_policy" ON content_calendar
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Drop existing folder policies
DROP POLICY IF EXISTS "content_calendar_folders_select_policy" ON content_calendar_folders;
DROP POLICY IF EXISTS "content_calendar_folders_insert_policy" ON content_calendar_folders;
DROP POLICY IF EXISTS "content_calendar_folders_update_policy" ON content_calendar_folders;
DROP POLICY IF EXISTS "content_calendar_folders_delete_policy" ON content_calendar_folders;

-- Create new folder SELECT policy - only members can view folders
CREATE POLICY "content_calendar_folders_select_policy" ON content_calendar_folders
    FOR SELECT USING (
        -- Must be a content calendar member
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int
        )
        OR
        -- OR must be a member of this specific folder
        EXISTS (
            SELECT 1 FROM content_calendar_folder_members 
            WHERE user_id = auth.uid()::int 
            AND folder_id = content_calendar_folders.id
        )
    );

-- Create new folder INSERT policy - only admin members can create folders
CREATE POLICY "content_calendar_folders_insert_policy" ON content_calendar_folders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Create new folder UPDATE policy - only admin members can update folders
CREATE POLICY "content_calendar_folders_update_policy" ON content_calendar_folders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Create new folder DELETE policy - only admin members can delete folders
CREATE POLICY "content_calendar_folders_delete_policy" ON content_calendar_folders
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM content_calendar_members 
            WHERE user_id = auth.uid()::int AND role = 'admin'
        )
    );

-- Update the helper function to only check member status
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
    
    -- Check if user is a folder member
    IF EXISTS (
        SELECT 1 FROM content_calendar_folder_members 
        WHERE user_id = auth.uid()::int
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- No admin/HR bypass - only assigned members allowed
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Show current members
SELECT 
    u.name,
    u.email,
    cm.role,
    cm.created_at
FROM content_calendar_members cm
JOIN auth_user u ON u.id = cm.user_id
ORDER BY cm.created_at DESC;

-- Show folder members
SELECT 
    u.name,
    u.email,
    f.name as folder_name,
    cfm.role,
    cfm.created_at
FROM content_calendar_folder_members cfm
JOIN auth_user u ON u.id = cfm.user_id
JOIN content_calendar_folders f ON f.id = cfm.folder_id
ORDER BY cfm.created_at DESC;

SELECT '✅ Content Calendar now restricted to assigned members only!' as status;
SELECT 'ℹ️  Admin/HR/Superuser bypass has been removed' as note;
SELECT '🔒 Only users in content_calendar_members or content_calendar_folder_members can access' as enforcement;


