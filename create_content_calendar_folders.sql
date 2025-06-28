-- Content Calendar Folders/Projects System
-- Hierarchical structure: Year → Month → Content Items
-- User access control per folder

-- 1. Create content_calendar_folders table for hierarchical organization
CREATE TABLE IF NOT EXISTS content_calendar_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE CASCADE,
    folder_type VARCHAR(50) DEFAULT 'folder', -- 'year', 'month', 'folder', 'category'
    color VARCHAR(7) DEFAULT '#000000', -- Hex color for folder
    sort_order INTEGER DEFAULT 0,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 2. Create content_calendar_folder_members for access control
CREATE TABLE IF NOT EXISTS content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer', -- 'admin', 'editor', 'viewer'
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_manage_members BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, user_id)
);

-- 3. Update content_calendar table to include folder_id
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE SET NULL;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_parent ON content_calendar_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_type ON content_calendar_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_folder ON content_calendar_folder_members(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_user ON content_calendar_folder_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder ON content_calendar(folder_id);

-- 5. Insert default folder structure for 2025
INSERT INTO content_calendar_folders (name, description, folder_type, sort_order, created_by_id) VALUES
('2025', 'Content Calendar for Year 2025', 'year', 1, 1)
ON CONFLICT DO NOTHING;

-- Get the 2025 folder ID
DO $$
DECLARE
    year_2025_id INTEGER;
BEGIN
    SELECT id INTO year_2025_id FROM content_calendar_folders WHERE name = '2025' AND folder_type = 'year';
    
    IF year_2025_id IS NOT NULL THEN
        -- Insert months for 2025
        INSERT INTO content_calendar_folders (name, description, parent_folder_id, folder_type, sort_order, created_by_id) VALUES
        ('January', 'January 2025 Content', year_2025_id, 'month', 1, 1),
        ('February', 'February 2025 Content', year_2025_id, 'month', 2, 1),
        ('March', 'March 2025 Content', year_2025_id, 'month', 3, 1),
        ('April', 'April 2025 Content', year_2025_id, 'month', 4, 1),
        ('May', 'May 2025 Content', year_2025_id, 'month', 5, 1),
        ('June', 'June 2025 Content', year_2025_id, 'month', 6, 1),
        ('July', 'July 2025 Content', year_2025_id, 'month', 7, 1),
        ('August', 'August 2025 Content', year_2025_id, 'month', 8, 1),
        ('September', 'September 2025 Content', year_2025_id, 'month', 9, 1),
        ('October', 'October 2025 Content', year_2025_id, 'month', 10, 1),
        ('November', 'November 2025 Content', year_2025_id, 'month', 11, 1),
        ('December', 'December 2025 Content', year_2025_id, 'month', 12, 1)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 6. Create function to get user's accessible folders
CREATE OR REPLACE FUNCTION get_user_accessible_folders(user_id_param INTEGER)
RETURNS TABLE(
    folder_id INTEGER,
    folder_name VARCHAR(255),
    folder_type VARCHAR(50),
    parent_folder_id INTEGER,
    user_role VARCHAR(50),
    can_create BOOLEAN,
    can_edit BOOLEAN,
    can_delete BOOLEAN,
    can_manage_members BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.name,
        f.folder_type,
        f.parent_folder_id,
        COALESCE(fm.role, 'viewer') as user_role,
        COALESCE(fm.can_create, false) as can_create,
        COALESCE(fm.can_edit, false) as can_edit,
        COALESCE(fm.can_delete, false) as can_delete,
        COALESCE(fm.can_manage_members, false) as can_manage_members
    FROM content_calendar_folders f
    LEFT JOIN content_calendar_folder_members fm ON f.id = fm.folder_id AND fm.user_id = user_id_param
    LEFT JOIN auth_user u ON u.id = user_id_param
    WHERE f.is_active = true
    AND (
        fm.user_id = user_id_param  -- User has explicit access
        OR u.is_superuser = true    -- Superuser has access to all
        OR u.is_staff = true        -- Staff has access to all
        OR f.created_by_id = user_id_param  -- Creator has access
    )
    ORDER BY f.folder_type, f.sort_order, f.name;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to check if user can access folder
CREATE OR REPLACE FUNCTION can_user_access_folder(user_id_param INTEGER, folder_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := false;
    user_is_superuser BOOLEAN := false;
    user_is_staff BOOLEAN := false;
BEGIN
    -- Check if user is superuser or staff
    SELECT is_superuser, is_staff INTO user_is_superuser, user_is_staff
    FROM auth_user WHERE id = user_id_param;
    
    -- Superuser and staff have access to everything
    IF user_is_superuser = true OR user_is_staff = true THEN
        RETURN true;
    END IF;
    
    -- Check if user has explicit access to this folder
    SELECT EXISTS(
        SELECT 1 FROM content_calendar_folder_members 
        WHERE user_id = user_id_param AND folder_id = folder_id_param
    ) INTO has_access;
    
    -- Check if user created this folder
    IF has_access = false THEN
        SELECT EXISTS(
            SELECT 1 FROM content_calendar_folders 
            WHERE id = folder_id_param AND created_by_id = user_id_param
        ) INTO has_access;
    END IF;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant all superusers and staff access to all folders
INSERT INTO content_calendar_folder_members (folder_id, user_id, role, can_create, can_edit, can_delete, can_manage_members)
SELECT 
    f.id,
    u.id,
    'admin',
    true,
    true,
    true,
    true
FROM content_calendar_folders f
CROSS JOIN auth_user u
WHERE (u.is_superuser = true OR u.is_staff = true)
AND NOT EXISTS (
    SELECT 1 FROM content_calendar_folder_members fm 
    WHERE fm.folder_id = f.id AND fm.user_id = u.id
);

-- 9. Create RLS policies for folder access
ALTER TABLE content_calendar_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_folder_members ENABLE ROW LEVEL SECURITY;

-- Policy for folders: Allow access based on membership or admin status
CREATE POLICY content_calendar_folders_policy ON content_calendar_folders
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth_user u 
        WHERE u.id = current_setting('app.current_user_id')::INTEGER
        AND (u.is_superuser = true OR u.is_staff = true)
    )
    OR EXISTS (
        SELECT 1 FROM content_calendar_folder_members fm
        WHERE fm.folder_id = content_calendar_folders.id 
        AND fm.user_id = current_setting('app.current_user_id')::INTEGER
    )
    OR created_by_id = current_setting('app.current_user_id')::INTEGER
);

-- Policy for folder members: Allow access to admins and folder admins
CREATE POLICY content_calendar_folder_members_policy ON content_calendar_folder_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth_user u 
        WHERE u.id = current_setting('app.current_user_id')::INTEGER
        AND (u.is_superuser = true OR u.is_staff = true)
    )
    OR user_id = current_setting('app.current_user_id')::INTEGER
    OR EXISTS (
        SELECT 1 FROM content_calendar_folder_members fm
        WHERE fm.folder_id = content_calendar_folder_members.folder_id
        AND fm.user_id = current_setting('app.current_user_id')::INTEGER
        AND fm.can_manage_members = true
    )
);

-- 10. Update content_calendar RLS policy to include folder access
DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;
CREATE POLICY content_calendar_policy ON content_calendar
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth_user u 
        WHERE u.id = current_setting('app.current_user_id')::INTEGER
        AND (u.is_superuser = true OR u.is_staff = true)
    )
    OR (
        folder_id IS NULL  -- Legacy content without folder
        OR can_user_access_folder(current_setting('app.current_user_id')::INTEGER, folder_id)
    )
);

COMMENT ON TABLE content_calendar_folders IS 'Hierarchical folder structure for organizing content calendar items';
COMMENT ON TABLE content_calendar_folder_members IS 'User access control for content calendar folders';
COMMENT ON FUNCTION get_user_accessible_folders IS 'Returns all folders accessible to a specific user';
COMMENT ON FUNCTION can_user_access_folder IS 'Checks if a user can access a specific folder'; 