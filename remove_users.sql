-- Remove specific users from the system
-- Users to remove:
-- Pyae Sone Thin
-- Hsu Shwe Yee Lwin
-- Nyein Chan Paing
-- Nyein Chan Kyaw

-- First, remove from project_members table
DELETE FROM project_members 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE name IN ('Pyae Sone Thin', 'Hsu Shwe Yee Lwin', 'Nyein Chan Paing', 'Nyein Chan Kyaw')
);

-- Remove from content_calendar_members table
DELETE FROM content_calendar_members 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE name IN ('Pyae Sone Thin', 'Hsu Shwe Yee Lwin', 'Nyein Chan Paing', 'Nyein Chan Kyaw')
);

-- Remove from content_calendar_folder_members table
DELETE FROM content_calendar_folder_members 
WHERE user_id IN (
    SELECT id FROM users 
    WHERE name IN ('Pyae Sone Thin', 'Hsu Shwe Yee Lwin', 'Nyein Chan Paing', 'Nyein Chan Kyaw')
);

-- Finally, delete the users
DELETE FROM users 
WHERE name IN ('Pyae Sone Thin', 'Hsu Shwe Yee Lwin', 'Nyein Chan Paing', 'Nyein Chan Kyaw');

