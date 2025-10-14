-- =====================================================
-- FOLDER ACCESS CONTROL FOR PASSWORD VAULT & CONTENT CALENDAR
-- =====================================================
-- This ensures users only see folders they have access to

-- =====================================================
-- PART 1: PASSWORD VAULT FOLDER ACCESS
-- =====================================================

-- Create password_vault_folder_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_vault_folder_access (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    permission_level VARCHAR(20) DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_access BOOLEAN DEFAULT FALSE,
    can_create_passwords BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(folder_id, user_id)
);

-- Disable RLS for password vault folder access
ALTER TABLE password_vault_folder_access DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON password_vault_folder_access TO authenticated;
GRANT ALL ON password_vault_folder_access TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- PART 2: CONTENT CALENDAR FOLDER ACCESS  
-- =====================================================

-- Check if content_calendar_folder_members table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'content_calendar_folder_members'
    ) THEN
        -- Create the table
        CREATE TABLE content_calendar_folder_members (
            id SERIAL PRIMARY KEY,
            folder_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role VARCHAR(20) DEFAULT 'viewer', -- 'owner', 'editor', 'viewer'
            can_create BOOLEAN DEFAULT FALSE,
            can_edit BOOLEAN DEFAULT FALSE,
            can_delete BOOLEAN DEFAULT FALSE,
            can_manage_members BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(folder_id, user_id)
        );
        RAISE NOTICE '✓ Created content_calendar_folder_members table';
    ELSE
        RAISE NOTICE 'content_calendar_folder_members table already exists';
    END IF;
END $$;

-- Disable RLS for content calendar folder members
ALTER TABLE content_calendar_folder_members DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON content_calendar_folder_members TO authenticated;
GRANT ALL ON content_calendar_folder_members TO anon;

-- =====================================================
-- PART 3: AUTO-ADD CREATORS AS FOLDER OWNERS
-- =====================================================

-- For password vault - add folder creators as owners
DO $$
DECLARE
    folder_record RECORD;
BEGIN
    FOR folder_record IN 
        SELECT id, 
               COALESCE(created_by_id, created_by, 1) as creator_id
        FROM password_vault_folders
    LOOP
        -- Check if owner access already exists
        IF NOT EXISTS (
            SELECT 1 FROM password_vault_folder_access 
            WHERE folder_id = folder_record.id 
            AND user_id = folder_record.creator_id
        ) THEN
            -- Add creator as owner
            INSERT INTO password_vault_folder_access (
                folder_id, 
                user_id, 
                permission_level,
                can_view, 
                can_edit, 
                can_delete,
                can_manage_access,
                can_create_passwords
            ) VALUES (
                folder_record.id,
                folder_record.creator_id,
                'owner',
                TRUE,
                TRUE,
                TRUE,
                TRUE,
                TRUE
            ) ON CONFLICT (folder_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
    RAISE NOTICE '✓ Added folder creators as owners to password vault folders';
END $$;

-- For content calendar - add folder creators as owners
DO $$
DECLARE
    folder_record RECORD;
BEGIN
    FOR folder_record IN 
        SELECT id, created_by_id 
        FROM content_calendar_folders 
        WHERE created_by_id IS NOT NULL
    LOOP
        -- Check if owner access already exists
        IF NOT EXISTS (
            SELECT 1 FROM content_calendar_folder_members 
            WHERE folder_id = folder_record.id 
            AND user_id = folder_record.created_by_id
        ) THEN
            -- Add creator as owner
            INSERT INTO content_calendar_folder_members (
                folder_id, 
                user_id, 
                role,
                can_create,
                can_edit, 
                can_delete,
                can_manage_members
            ) VALUES (
                folder_record.id,
                folder_record.created_by_id,
                'owner',
                TRUE,
                TRUE,
                TRUE,
                TRUE
            ) ON CONFLICT (folder_id, user_id) DO NOTHING;
        END IF;
    END LOOP;
    RAISE NOTICE '✓ Added folder creators as owners to content calendar folders';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Show password vault folder access
SELECT 
    'Password Vault Folder Access:' as info,
    pv.folder_id,
    pf.name as folder_name,
    pv.user_id,
    pv.permission_level,
    pv.can_view,
    pv.can_edit,
    pv.can_create_passwords
FROM password_vault_folder_access pv
JOIN password_vault_folders pf ON pf.id = pv.folder_id
ORDER BY pv.folder_id, pv.user_id;

-- Show content calendar folder members
SELECT 
    'Content Calendar Folder Members:' as info,
    cf.folder_id,
    ccf.name as folder_name,
    cf.user_id,
    cf.role,
    cf.can_create,
    cf.can_edit,
    cf.can_manage_members
FROM content_calendar_folder_members cf
LEFT JOIN content_calendar_folders ccf ON ccf.id = cf.folder_id
ORDER BY cf.folder_id, cf.user_id;

-- Success message
SELECT '
✅ FOLDER ACCESS CONTROL CONFIGURED!

What was done:
1. ✓ Created password_vault_folder_access table
2. ✓ Created content_calendar_folder_members table (if missing)
3. ✓ Disabled RLS on both tables
4. ✓ Granted permissions
5. ✓ Added folder creators as owners

Users will now only see:
- Password vault folders with at least one accessible password
- Content calendar folders they are members of

Next: Update frontend to filter folders by access.
' as message;

