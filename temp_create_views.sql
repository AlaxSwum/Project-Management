-- Create folder tree view
CREATE OR REPLACE VIEW content_calendar_folder_tree AS
WITH RECURSIVE folder_tree AS (
    SELECT 
        id, name, description, parent_folder_id, folder_type, color, sort_order,
        created_by_id, created_at, updated_at, is_active,
        0 as level, name as path
    FROM content_calendar_folders
    WHERE parent_folder_id IS NULL AND is_active = true
    
    UNION ALL
    
    SELECT 
        f.id, f.name, f.description, f.parent_folder_id, f.folder_type, f.color, f.sort_order,
        f.created_by_id, f.created_at, f.updated_at, f.is_active,
        ft.level + 1, ft.path || ' > ' || f.name
    FROM content_calendar_folders f
    JOIN folder_tree ft ON f.parent_folder_id = ft.id
    WHERE f.is_active = true
)
SELECT * FROM folder_tree ORDER BY level, sort_order, name;

-- Create hierarchy view
CREATE OR REPLACE VIEW content_calendar_hierarchy AS
SELECT 
    c.id as content_id, c.date, c.content_type, c.category, c.social_media,
    c.content_title, c.assigned_to, c.content_deadline, c.graphic_deadline,
    c.status, c.description, c.created_at, c.updated_at, c.folder_id,
    f.name as folder_name, f.folder_type,
    pf.name as parent_folder_name, pf.id as parent_folder_id
FROM content_calendar c
LEFT JOIN content_calendar_folders f ON c.folder_id = f.id
LEFT JOIN content_calendar_folders pf ON f.parent_folder_id = pf.id
WHERE f.is_active = true OR f.is_active IS NULL;

-- Grant access to views
GRANT SELECT ON content_calendar_folder_tree TO anon;
GRANT SELECT ON content_calendar_hierarchy TO anon;
