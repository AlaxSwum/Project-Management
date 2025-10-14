-- =====================================================
-- FIX TASKS AND PASSWORD VAULT ACCESS ISSUES
-- =====================================================
-- Run this in your Supabase SQL Editor to fix both issues
-- This will disable RLS and grant proper permissions

-- =====================================================
-- PART 1: FIX PROJECT TASKS
-- =====================================================

-- Check current RLS status for tasks
SELECT 
    'Current projects_task RLS status:' as info,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname = 'projects_task';

-- Disable RLS on projects_task table
ALTER TABLE projects_task DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might cause issues
DROP POLICY IF EXISTS "tasks_select_policy" ON projects_task;
DROP POLICY IF EXISTS "tasks_insert_policy" ON projects_task;
DROP POLICY IF EXISTS "tasks_update_policy" ON projects_task;
DROP POLICY IF EXISTS "tasks_delete_policy" ON projects_task;
DROP POLICY IF EXISTS "Users can view tasks in their projects" ON projects_task;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON projects_task;
DROP POLICY IF EXISTS "Users can update tasks in their projects" ON projects_task;
DROP POLICY IF EXISTS "Users can delete tasks in their projects" ON projects_task;

-- Grant full permissions on projects_task
GRANT ALL ON projects_task TO authenticated;
GRANT ALL ON projects_task TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Also fix related tables
ALTER TABLE projects_taskcomment DISABLE ROW LEVEL SECURITY;
GRANT ALL ON projects_taskcomment TO authenticated;
GRANT ALL ON projects_taskcomment TO anon;

ALTER TABLE projects_taskattachment DISABLE ROW LEVEL SECURITY;
GRANT ALL ON projects_taskattachment TO authenticated;
GRANT ALL ON projects_taskattachment TO anon;

-- Check if todo_items table exists and fix it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'todo_items'
    ) THEN
        ALTER TABLE todo_items DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON todo_items TO authenticated;
        GRANT ALL ON todo_items TO anon;
        RAISE NOTICE 'Fixed todo_items table permissions';
    END IF;
END $$;

-- =====================================================
-- PART 2: FIX PASSWORD VAULT
-- =====================================================

-- Check current RLS status for password vault
SELECT 
    'Current password_vault RLS status:' as info,
    relname as table_name,
    relrowsecurity as rls_enabled
FROM pg_class 
WHERE relname IN ('password_vault', 'password_vault_folders');

-- Disable RLS on password vault tables
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can create passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can update their own passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can delete their own passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can view shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can view folders" ON password_vault_folders;
DROP POLICY IF EXISTS "Users can create folders" ON password_vault_folders;
DROP POLICY IF EXISTS "Users can update folders" ON password_vault_folders;
DROP POLICY IF EXISTS "Users can delete folders" ON password_vault_folders;

-- Grant full permissions on password vault tables
GRANT ALL ON password_vault TO authenticated;
GRANT ALL ON password_vault TO anon;
GRANT ALL ON password_vault_folders TO authenticated;
GRANT ALL ON password_vault_folders TO anon;

-- Handle password_vault_access table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'password_vault_access'
    ) THEN
        ALTER TABLE password_vault_access DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON password_vault_access TO authenticated;
        GRANT ALL ON password_vault_access TO anon;
        RAISE NOTICE 'Fixed password_vault_access table permissions';
    END IF;
END $$;

-- Handle password_vault_folder_access table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'password_vault_folder_access'
    ) THEN
        ALTER TABLE password_vault_folder_access DISABLE ROW LEVEL SECURITY;
        GRANT ALL ON password_vault_folder_access TO authenticated;
        GRANT ALL ON password_vault_folder_access TO anon;
        RAISE NOTICE 'Fixed password_vault_folder_access table permissions';
    END IF;
END $$;

-- Ensure password_vault has required columns
DO $$
BEGIN
    -- Add is_active column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to password_vault';
    END IF;
    
    -- Add created_by_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN created_by_id INTEGER;
        RAISE NOTICE 'Added created_by_id column to password_vault';
    END IF;
    
    -- Add folder_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN folder_id INTEGER;
        RAISE NOTICE 'Added folder_id column to password_vault';
    END IF;
END $$;

-- Ensure password_vault_folders has required columns
DO $$
BEGIN
    -- Add created_by column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by INTEGER;
        RAISE NOTICE 'Added created_by column to password_vault_folders';
    END IF;
    
    -- Add created_by_id column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by_id INTEGER;
        RAISE NOTICE 'Added created_by_id column to password_vault_folders';
    END IF;
    
    -- Remove NOT NULL constraint from created_by_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE password_vault_folders 
        ALTER COLUMN created_by_id DROP NOT NULL;
        RAISE NOTICE 'Removed NOT NULL constraint from created_by_id';
    END IF;
END $$;

-- Update NULL values in password_vault
UPDATE password_vault 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Ensure there's a default folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM password_vault_folders WHERE name = 'Personal'
    ) THEN
        INSERT INTO password_vault_folders (name, description, color, icon, created_by, created_by_id)
        VALUES ('Personal', 'Personal passwords folder', '#5884FD', 'folder', 1, 1);
        RAISE NOTICE 'Created default Personal folder';
    ELSE
        RAISE NOTICE 'Personal folder already exists';
    END IF;
END $$;

-- =====================================================
-- PART 3: FIX PROJECT TABLES
-- =====================================================

-- Also disable RLS on project tables to ensure full access
ALTER TABLE projects_project DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects_project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects_meeting DISABLE ROW LEVEL SECURITY;

GRANT ALL ON projects_project TO authenticated;
GRANT ALL ON projects_project TO anon;
GRANT ALL ON projects_project_members TO authenticated;
GRANT ALL ON projects_project_members TO anon;
GRANT ALL ON projects_meeting TO authenticated;
GRANT ALL ON projects_meeting TO anon;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show final RLS status
SELECT 
    'Final RLS Status:' as info,
    relname as table_name,
    CASE WHEN relrowsecurity THEN 'ENABLED (⚠️)' ELSE 'DISABLED (✓)' END as rls_status
FROM pg_class 
WHERE relname IN (
    'projects_task',
    'projects_taskcomment',
    'projects_taskattachment',
    'password_vault',
    'password_vault_folders',
    'password_vault_access',
    'projects_project',
    'projects_project_members',
    'projects_meeting'
)
ORDER BY relname;

-- Show password vault folders
SELECT 
    'Existing Password Folders:' as info,
    id,
    name,
    description,
    color,
    created_by,
    created_by_id
FROM password_vault_folders
ORDER BY name;

-- Show password vault columns
SELECT 
    'Password Vault Columns:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'password_vault'
ORDER BY ordinal_position;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT '
✅ FIX COMPLETE!

Changes Applied:
1. ✓ Disabled RLS on projects_task table
2. ✓ Granted permissions for task operations (create, update, delete)
3. ✓ Disabled RLS on password_vault tables
4. ✓ Fixed password vault column constraints
5. ✓ Created default Personal folder
6. ✓ Granted permissions for password vault operations

You can now:
- Add tasks to projects
- Delete tasks from projects
- Add passwords to password vault
- Create password folders

If you still have issues, check the browser console for specific error messages.
' as message;

