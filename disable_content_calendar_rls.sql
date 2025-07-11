-- Disable RLS for Content Calendar Tables
-- This fixes the "row violates row-level security policy" errors
-- Since we're using custom localStorage authentication instead of Supabase auth

-- 1. Disable RLS on existing content calendar tables
ALTER TABLE content_calendar DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing RLS policies
DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;
DROP POLICY IF EXISTS content_calendar_members_policy ON content_calendar_members;

-- 3. For new folder tables, also disable RLS initially
ALTER TABLE content_calendar_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_folder_members DISABLE ROW LEVEL SECURITY;

-- 4. Drop folder RLS policies
DROP POLICY IF EXISTS content_calendar_folders_policy ON content_calendar_folders;
DROP POLICY IF EXISTS content_calendar_folder_members_policy ON content_calendar_folder_members;

-- 5. Grant full access to anon role (since we use anon key for API calls)
GRANT ALL ON content_calendar TO anon;
GRANT ALL ON content_calendar_members TO anon;
GRANT ALL ON content_calendar_folders TO anon;
GRANT ALL ON content_calendar_folder_members TO anon;

-- 6. Grant usage on sequences
GRANT USAGE, SELECT ON content_calendar_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_members_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_folders_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_folder_members_id_seq TO anon;

-- 7. Create view for easy folder hierarchy access
CREATE OR REPLACE VIEW content_calendar_hierarchy AS
SELECT 
    c.id as content_id,
    c.date,
    c.content_type,
    c.category,
    c.social_media,
    c.content_title,
    c.assigned_to,
    c.content_deadline,
    c.graphic_deadline,
    c.status,
    c.description,
    c.created_at,
    c.updated_at,
    c.folder_id,
    f.name as folder_name,
    f.folder_type,
    pf.name as parent_folder_name,
    pf.id as parent_folder_id
FROM content_calendar c
LEFT JOIN content_calendar_folders f ON c.folder_id = f.id
LEFT JOIN content_calendar_folders pf ON f.parent_folder_id = pf.id
WHERE f.is_active = true OR f.is_active IS NULL;

-- 8. Grant access to the view
GRANT SELECT ON content_calendar_hierarchy TO anon;

-- 9. Create simplified folder tree view
CREATE OR REPLACE VIEW content_calendar_folder_tree AS
WITH RECURSIVE folder_tree AS (
    -- Root folders (no parent)
    SELECT 
        id,
        name,
        description,
        parent_folder_id,
        folder_type,
        color,
        sort_order,
        created_by_id,
        created_at,
        updated_at,
        is_active,
        0 as level,
        name as path
    FROM content_calendar_folders
    WHERE parent_folder_id IS NULL AND is_active = true
    
    UNION ALL
    
    -- Child folders
    SELECT 
        f.id,
        f.name,
        f.description,
        f.parent_folder_id,
        f.folder_type,
        f.color,
        f.sort_order,
        f.created_by_id,
        f.created_at,
        f.updated_at,
        f.is_active,
        ft.level + 1,
        ft.path || ' > ' || f.name
    FROM content_calendar_folders f
    JOIN folder_tree ft ON f.parent_folder_id = ft.id
    WHERE f.is_active = true
)
SELECT * FROM folder_tree
ORDER BY level, sort_order, name;

-- 10. Grant access to folder tree view
GRANT SELECT ON content_calendar_folder_tree TO anon;

-- 11. Update auth_user table to ensure we can query user details
GRANT SELECT ON auth_user TO anon;

COMMENT ON VIEW content_calendar_hierarchy IS 'Simplified view showing content with folder hierarchy';
COMMENT ON VIEW content_calendar_folder_tree IS 'Recursive view showing complete folder tree structure'; 