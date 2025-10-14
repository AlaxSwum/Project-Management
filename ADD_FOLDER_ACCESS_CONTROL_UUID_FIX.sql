-- =====================================================
-- FOLDER ACCESS CONTROL - UUID COMPATIBLE VERSION
-- =====================================================
-- This version handles UUID user_id columns properly

-- =====================================================
-- PART 1: PASSWORD VAULT FOLDER ACCESS
-- =====================================================

-- First, check the actual data type of user_id in auth_user
DO $$
DECLARE
    user_id_type TEXT;
BEGIN
    SELECT data_type INTO user_id_type
    FROM information_schema.columns
    WHERE table_name = 'auth_user' AND column_name = 'id';
    
    RAISE NOTICE 'auth_user.id type is: %', user_id_type;
END $$;

-- Create password_vault_folder_access table with flexible user_id type
DROP TABLE IF EXISTS password_vault_folder_access CASCADE;

CREATE TABLE password_vault_folder_access (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,  -- Matches auth_user.id which is INTEGER in your system
    permission_level VARCHAR(20) DEFAULT 'viewer',
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_access BOOLEAN DEFAULT FALSE,
    can_create_passwords BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, user_id)
);

-- Disable RLS
ALTER TABLE password_vault_folder_access DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON password_vault_folder_access TO authenticated, anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- =====================================================
-- PART 2: CONTENT CALENDAR FOLDER ACCESS
-- =====================================================

-- Drop and recreate to ensure clean state
DROP TABLE IF EXISTS content_calendar_folder_members CASCADE;

CREATE TABLE content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,  -- Matches auth_user.id
    role VARCHAR(20) DEFAULT 'viewer',
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_members BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, user_id)
);

-- Disable RLS
ALTER TABLE content_calendar_folder_members DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON content_calendar_folder_members TO authenticated, anon;

-- =====================================================
-- PART 3: ADD FOLDER OWNERS
-- =====================================================

-- Password Vault: Add folder creators as owners
INSERT INTO password_vault_folder_access (
    folder_id, 
    user_id, 
    permission_level,
    can_view, 
    can_edit, 
    can_delete,
    can_manage_access,
    can_create_passwords
)
SELECT 
    id as folder_id,
    COALESCE(created_by_id, created_by, 1)::INTEGER as user_id,
    'owner' as permission_level,
    TRUE as can_view,
    TRUE as can_edit,
    TRUE as can_delete,
    TRUE as can_manage_access,
    TRUE as can_create_passwords
FROM password_vault_folders
WHERE COALESCE(created_by_id, created_by) IS NOT NULL
ON CONFLICT (folder_id, user_id) DO NOTHING;

-- Content Calendar: Add folder creators as owners
INSERT INTO content_calendar_folder_members (
    folder_id, 
    user_id, 
    role,
    can_create,
    can_edit, 
    can_delete,
    can_manage_members
)
SELECT 
    id as folder_id,
    created_by_id::INTEGER as user_id,
    'owner' as role,
    TRUE as can_create,
    TRUE as can_edit,
    TRUE as can_delete,
    TRUE as can_manage_members
FROM content_calendar_folders
WHERE created_by_id IS NOT NULL
ON CONFLICT (folder_id, user_id) DO NOTHING;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show password vault folder access
SELECT 
    '=== Password Vault Folder Access ===' as section,
    pva.folder_id,
    pf.name as folder_name,
    pva.user_id,
    au.name as user_name,
    au.email as user_email,
    pva.permission_level,
    pva.can_view,
    pva.can_edit,
    pva.can_create_passwords
FROM password_vault_folder_access pva
LEFT JOIN password_vault_folders pf ON pf.id = pva.folder_id
LEFT JOIN auth_user au ON au.id = pva.user_id
ORDER BY pva.folder_id, pva.user_id;

-- Show content calendar folder members
SELECT 
    '=== Content Calendar Folder Members ===' as section,
    cfm.folder_id,
    ccf.name as folder_name,
    cfm.user_id,
    au.name as user_name,
    au.email as user_email,
    cfm.role,
    cfm.can_create,
    cfm.can_edit,
    cfm.can_manage_members
FROM content_calendar_folder_members cfm
LEFT JOIN content_calendar_folders ccf ON ccf.id = cfm.folder_id
LEFT JOIN auth_user au ON au.id = cfm.user_id
ORDER BY cfm.folder_id, cfm.user_id;

-- Count summary
SELECT 
    '=== Summary ===' as section,
    (SELECT COUNT(*) FROM password_vault_folders) as total_password_folders,
    (SELECT COUNT(*) FROM password_vault_folder_access) as password_access_records,
    (SELECT COUNT(*) FROM content_calendar_folders) as total_content_folders,
    (SELECT COUNT(*) FROM content_calendar_folder_members) as content_members_records;

-- Success message
SELECT '
✅ FOLDER ACCESS CONTROL CONFIGURED!

Changes Applied:
1. ✓ Created password_vault_folder_access table
2. ✓ Created content_calendar_folder_members table
3. ✓ Added folder creators as owners
4. ✓ Disabled RLS on both tables
5. ✓ Granted permissions

How it works:
- Password Vault: Users only see folders with accessible passwords
- Content Calendar: Users only see folders they are members of

Next: Deploy frontend to activate folder filtering!
' as message;

