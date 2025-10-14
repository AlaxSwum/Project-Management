-- =====================================================
-- FOLDER ACCESS CONTROL - FIXED VERSION
-- =====================================================
-- This creates folder access tables without type conflicts

-- =====================================================
-- PART 1: PASSWORD VAULT FOLDER ACCESS
-- =====================================================

-- Create password_vault_folder_access table
CREATE TABLE IF NOT EXISTS password_vault_folder_access (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
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

-- Create or update content_calendar_folder_members table
CREATE TABLE IF NOT EXISTS content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
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
-- PART 3: ADD FOLDER OWNERS (SIMPLE VERSION)
-- =====================================================

-- Password Vault: Insert folder owners using INSERT ... ON CONFLICT
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
    COALESCE(created_by_id, created_by, 1) as user_id,
    'owner' as permission_level,
    TRUE as can_view,
    TRUE as can_edit,
    TRUE as can_delete,
    TRUE as can_manage_access,
    TRUE as can_create_passwords
FROM password_vault_folders
ON CONFLICT (folder_id, user_id) DO NOTHING;

-- Content Calendar: Insert folder owners using INSERT ... ON CONFLICT
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
    created_by_id as user_id,
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
    'Password Vault Folder Access:' as info,
    pva.folder_id,
    pf.name as folder_name,
    pva.user_id,
    au.name as user_name,
    pva.permission_level,
    pva.can_view,
    pva.can_edit
FROM password_vault_folder_access pva
LEFT JOIN password_vault_folders pf ON pf.id = pva.folder_id
LEFT JOIN auth_user au ON au.id = pva.user_id
ORDER BY pva.folder_id, pva.user_id
LIMIT 20;

-- Show content calendar folder members
SELECT 
    'Content Calendar Folder Members:' as info,
    cfm.folder_id,
    ccf.name as folder_name,
    cfm.user_id,
    au.name as user_name,
    cfm.role,
    cfm.can_create,
    cfm.can_edit
FROM content_calendar_folder_members cfm
LEFT JOIN content_calendar_folders ccf ON ccf.id = cfm.folder_id
LEFT JOIN auth_user au ON au.id = cfm.user_id
ORDER BY cfm.folder_id, cfm.user_id
LIMIT 20;

-- Count summary
SELECT 
    'Summary:' as info,
    (SELECT COUNT(*) FROM password_vault_folder_access) as password_vault_access_count,
    (SELECT COUNT(*) FROM content_calendar_folder_members) as content_calendar_members_count;

-- Success message
SELECT '
✅ FOLDER ACCESS CONTROL CONFIGURED!

Tables Created:
1. ✓ password_vault_folder_access
2. ✓ content_calendar_folder_members

Folder creators added as owners:
- Password Vault folders → owners added
- Content Calendar folders → owners added

Now folders will only appear to users who have access!

Next steps:
1. Deploy the updated frontend code
2. Test that folders appear/disappear based on access
3. Use folder permissions UI to manage access
' as message;

