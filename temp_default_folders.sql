-- Insert 2025 year folder
INSERT INTO content_calendar_folders (name, description, folder_type, sort_order, created_by_id) 
VALUES ('2025', 'Content Calendar for Year 2025', 'year', 1, 1)
ON CONFLICT DO NOTHING;

-- Insert months for 2025
INSERT INTO content_calendar_folders (name, description, parent_folder_id, folder_type, sort_order, created_by_id)
SELECT 
    month_name,
    month_name || ' 2025 Content',
    year_folder.id,
    'month',
    month_order,
    1
FROM (VALUES 
    ('January', 1), ('February', 2), ('March', 3), ('April', 4),
    ('May', 5), ('June', 6), ('July', 7), ('August', 8),
    ('September', 9), ('October', 10), ('November', 11), ('December', 12)
) AS months(month_name, month_order)
CROSS JOIN (
    SELECT id FROM content_calendar_folders WHERE name = '2025' AND folder_type = 'year'
) AS year_folder
ON CONFLICT DO NOTHING;

-- Grant all superusers and staff admin access to all folders
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
