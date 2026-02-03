-- COMPLETE SETUP SCRIPT
-- Run this entire script in your Supabase SQL Editor
-- This will set up all the database updates needed

-- =====================================================
-- 1. UPDATE NOTIFICATIONS TABLE
-- =====================================================

-- Update the type constraint to include new notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'leave_request_submitted', 
  'leave_request_approved', 
  'leave_request_rejected', 
  'general',
  'task_assigned',
  'task_reminder', 
  'task_status_changed',
  'task_completed',
  'task_overdue',
  'project_updated',
  'meeting_scheduled',
  'meeting_reminder'
));

-- Add indexes for better performance on task-related notifications
CREATE INDEX IF NOT EXISTS idx_notifications_task_type ON notifications(type) WHERE type LIKE 'task_%';
CREATE INDEX IF NOT EXISTS idx_notifications_created_unread ON notifications(created_at DESC, is_read) WHERE is_read = false;

-- Create a function to clean up old read notifications (optional - keeps DB clean)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
  -- Delete unread notifications older than 90 days (very old)
  DELETE FROM notifications 
  WHERE is_read = false 
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Create a view for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  recipient_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE type LIKE 'task_%') as task_notifications,
  COUNT(*) FILTER (WHERE type = 'task_assigned') as task_assignments,
  COUNT(*) FILTER (WHERE type = 'task_reminder') as task_reminders,
  MAX(created_at) as last_notification_at
FROM notifications 
GROUP BY recipient_id;

-- Grant access to the view
GRANT SELECT ON notification_stats TO authenticated;
GRANT SELECT ON notification_stats TO anon;

-- =====================================================
-- 2. FIX PASSWORD VAULT SYSTEM
-- =====================================================

-- Step 1: Disable RLS temporarily to fix the issues
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_audit_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_sharing_links DISABLE ROW LEVEL SECURITY;

-- Handle folder access table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_vault_folder_access') THEN
        ALTER TABLE password_vault_folder_access DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Step 2: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view their own passwords and shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can insert their own passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can update their own passwords and editable shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can delete their own passwords and deletable shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can view password access for their own passwords" ON password_vault_access;
DROP POLICY IF EXISTS "Users can grant access to their own passwords" ON password_vault_access;
DROP POLICY IF EXISTS "Users can manage their own folders" ON password_vault_folders;
DROP POLICY IF EXISTS "Users can view folder access for their own folders" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can grant access to their own folders" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can update folder access for folders they own or manage" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can delete folder access for folders they own or manage" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can manage their own folder access" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Folder owners can manage folder access" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can view audit logs for their passwords" ON password_audit_log;
DROP POLICY IF EXISTS "Users can manage sharing links for their passwords" ON password_sharing_links;

-- Step 3: Drop problematic views
DROP VIEW IF EXISTS password_vault_full_access;
DROP VIEW IF EXISTS password_vault_with_access;
DROP VIEW IF EXISTS password_vault_with_folders;

-- Step 4: Ensure password_vault_access table exists
CREATE TABLE IF NOT EXISTS password_vault_access (
    id SERIAL PRIMARY KEY,
    vault_id INTEGER REFERENCES password_vault(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Permission Levels
    permission_level VARCHAR(20) DEFAULT 'viewer', -- owner, editor, viewer
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,
    
    -- Audit Trail
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(vault_id, user_id)
);

-- Step 5: Create simple, efficient view for password management
CREATE OR REPLACE VIEW password_vault_shared AS
SELECT 
    pv.id,
    pv.account_name,
    pv.email,
    pv.username,
    pv.password_encrypted,
    pv.phone_number,
    pv.website_url,
    pv.notes,
    pv.category,
    pv.tags,
    pv.two_factor_auth,
    pv.security_questions,
    pv.created_by_id,
    pv.created_at,
    pv.updated_at,
    pv.last_accessed,
    pv.password_strength,
    pv.password_created_date,
    pv.password_last_changed,
    pv.is_compromised,
    pv.is_active,
    pv.is_favorite,
    pv.folder_id,
    pvf.name as folder_name,
    pvf.color as folder_color,
    pvf.icon as folder_icon,
    -- Access information (only if user has access)
    pva.permission_level,
    pva.can_view,
    pva.can_edit,
    pva.can_delete,
    pva.can_share,
    -- Determine if password needs update
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update,
    -- Determine user's relationship to this password
    CASE 
        WHEN pv.created_by_id = auth.uid() THEN 'owner'
        WHEN pva.user_id = auth.uid() THEN 'shared'
        ELSE 'none'
    END as user_access_type
FROM password_vault pv
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id AND pva.user_id = auth.uid()
WHERE pv.is_active = true
  AND (
    pv.created_by_id = auth.uid() OR  -- User owns the password
    (pva.user_id = auth.uid() AND pva.can_view = true)  -- User has shared access
  );

-- Step 6: Re-enable RLS with simple, non-recursive policies
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

-- Simple password vault policies (no circular references)
CREATE POLICY "password_vault_select" ON password_vault
    FOR SELECT USING (
        created_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault_access 
            WHERE vault_id = password_vault.id 
            AND user_id = auth.uid() 
            AND can_view = true
        )
    );

CREATE POLICY "password_vault_insert" ON password_vault
    FOR INSERT WITH CHECK (created_by_id = auth.uid());

CREATE POLICY "password_vault_update" ON password_vault
    FOR UPDATE USING (
        created_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault_access 
            WHERE vault_id = password_vault.id 
            AND user_id = auth.uid() 
            AND can_edit = true
        )
    );

CREATE POLICY "password_vault_delete" ON password_vault
    FOR DELETE USING (
        created_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault_access 
            WHERE vault_id = password_vault.id 
            AND user_id = auth.uid() 
            AND can_delete = true
        )
    );

-- Step 7: Enable RLS for access table with simple policies
ALTER TABLE password_vault_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "password_access_select" ON password_vault_access
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = password_vault_access.vault_id 
            AND created_by_id = auth.uid()
        )
    );

CREATE POLICY "password_access_insert" ON password_vault_access
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = vault_id 
            AND created_by_id = auth.uid()
        )
    );

CREATE POLICY "password_access_update" ON password_vault_access
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = password_vault_access.vault_id 
            AND created_by_id = auth.uid()
        )
    );

CREATE POLICY "password_access_delete" ON password_vault_access
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = password_vault_access.vault_id 
            AND created_by_id = auth.uid()
        )
    );

-- Step 8: Enable RLS for other tables
ALTER TABLE password_vault_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "folders_all_operations" ON password_vault_folders
    FOR ALL USING (created_by_id = auth.uid());

ALTER TABLE password_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_log_select" ON password_audit_log
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = password_audit_log.vault_id 
            AND created_by_id = auth.uid()
        )
    );

CREATE POLICY "audit_log_insert" ON password_audit_log
    FOR INSERT WITH CHECK (user_id = auth.uid());

ALTER TABLE password_sharing_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sharing_links_all" ON password_sharing_links
    FOR ALL USING (
        created_by_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM password_vault 
            WHERE id = password_sharing_links.vault_id 
            AND created_by_id = auth.uid()
        )
    );

-- Step 9: Handle folder access table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'password_vault_folder_access') THEN
        ALTER TABLE password_vault_folder_access ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "folder_access_all" ON password_vault_folder_access
            FOR ALL USING (
                user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM password_vault_folders 
                    WHERE id = password_vault_folder_access.folder_id 
                    AND created_by_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Step 10: Grant necessary permissions to anon role
GRANT ALL ON password_vault TO anon;
GRANT ALL ON password_vault_access TO anon;
GRANT ALL ON password_vault_folders TO anon;
GRANT ALL ON password_audit_log TO anon;
GRANT ALL ON password_sharing_links TO anon;
GRANT SELECT ON password_vault_shared TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON password_vault_id_seq TO anon;
GRANT USAGE, SELECT ON password_vault_access_id_seq TO anon;
GRANT USAGE, SELECT ON password_vault_folders_id_seq TO anon;
GRANT USAGE, SELECT ON password_audit_log_id_seq TO anon;
GRANT USAGE, SELECT ON password_sharing_links_id_seq TO anon;

-- Step 11: Create helper functions for password sharing
CREATE OR REPLACE FUNCTION share_password_with_user(
    password_id INTEGER,
    target_user_email TEXT,
    permission_level TEXT DEFAULT 'viewer',
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
    target_user_id UUID;
    result JSON;
BEGIN
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Check if current user owns the password
    IF NOT EXISTS (
        SELECT 1 FROM password_vault 
        WHERE id = password_id AND created_by_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'message', 'You do not own this password');
    END IF;
    
    -- Insert or update access record
    INSERT INTO password_vault_access (
        vault_id, user_id, permission_level, can_view, can_edit, can_delete, can_share, granted_by
    ) VALUES (
        password_id, target_user_id, permission_level, true, can_edit, can_delete, can_share, auth.uid()
    )
    ON CONFLICT (vault_id, user_id) 
    DO UPDATE SET
        permission_level = EXCLUDED.permission_level,
        can_edit = EXCLUDED.can_edit,
        can_delete = EXCLUDED.can_delete,
        can_share = EXCLUDED.can_share,
        granted_by = auth.uid(),
        granted_at = NOW();
    
    -- Log the action
    INSERT INTO password_audit_log (vault_id, user_id, action, details)
    VALUES (password_id, auth.uid(), 'share', 
            json_build_object('shared_with', target_user_email, 'permission_level', permission_level));
    
    RETURN json_build_object('success', true, 'message', 'Password shared successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Create function to revoke password access
CREATE OR REPLACE FUNCTION revoke_password_access(
    password_id INTEGER,
    target_user_email TEXT
) RETURNS JSON AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get target user ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_user_email;
    
    IF target_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found');
    END IF;
    
    -- Check if current user owns the password
    IF NOT EXISTS (
        SELECT 1 FROM password_vault 
        WHERE id = password_id AND created_by_id = auth.uid()
    ) THEN
        RETURN json_build_object('success', false, 'message', 'You do not own this password');
    END IF;
    
    -- Delete access record
    DELETE FROM password_vault_access 
    WHERE vault_id = password_id AND user_id = target_user_id;
    
    -- Log the action
    INSERT INTO password_audit_log (vault_id, user_id, action, details)
    VALUES (password_id, auth.uid(), 'revoke_access', 
            json_build_object('revoked_from', target_user_email));
    
    RETURN json_build_object('success', true, 'message', 'Access revoked successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 13: Create function to get password sharing status
CREATE OR REPLACE FUNCTION get_password_sharing_status(password_id INTEGER)
RETURNS TABLE (
    user_email TEXT,
    user_name TEXT,
    permission_level TEXT,
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    can_share BOOLEAN,
    granted_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.email,
        COALESCE(au.raw_user_meta_data->>'name', au.email) as user_name,
        pva.permission_level,
        pva.can_edit,
        pva.can_delete,
        pva.can_share,
        pva.granted_at
    FROM password_vault_access pva
    JOIN auth.users au ON pva.user_id = au.id
    WHERE pva.vault_id = password_id
    AND EXISTS (
        SELECT 1 FROM password_vault 
        WHERE id = password_id AND created_by_id = auth.uid()
    )
    ORDER BY pva.granted_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. ENSURE CONTENT CALENDAR TABLES EXIST
-- =====================================================

-- Ensure content calendar members table exists with proper structure
CREATE TABLE IF NOT EXISTS content_calendar_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- member, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_content_calendar_members_user_id ON content_calendar_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_members_role ON content_calendar_members(role);

-- =====================================================
-- SUCCESS MESSAGES
-- =====================================================

SELECT 'Database setup completed successfully!' as message,
       'All systems are now ready for use!' as status,
       'Features: Notifications, Password Vault, Content Calendar' as features_enabled;
