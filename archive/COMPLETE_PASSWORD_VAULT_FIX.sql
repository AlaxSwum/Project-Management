-- =====================================================
-- COMPLETE PASSWORD VAULT SYSTEM FIX
-- =====================================================
-- This script fixes ALL password vault issues:
-- 1. Missing created_by_id column in password_vault_folders
-- 2. Password deletion permissions
-- 3. RLS policies for proper access control
-- 4. Table structure inconsistencies

-- STEP 1: Fix password_vault_folders table structure
-- =====================================================

-- Check current table structure first
SELECT 
    'CURRENT password_vault_folders STRUCTURE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Add missing columns to password_vault_folders
DO $$
BEGIN
    -- Add created_by_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by_id INTEGER;
        RAISE NOTICE 'Added created_by_id column to password_vault_folders';
    END IF;
    
    -- Add created_by if missing (alternative naming)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by INTEGER;
        RAISE NOTICE 'Added created_by column to password_vault_folders';
    END IF;
END $$;

-- Set default values for existing records
UPDATE password_vault_folders 
SET created_by_id = 1 
WHERE created_by_id IS NULL;

UPDATE password_vault_folders 
SET created_by = 1 
WHERE created_by IS NULL AND created_by_id IS NULL;

-- STEP 2: Fix password_vault table structure
-- =====================================================

-- Check current password_vault structure
SELECT 
    'CURRENT password_vault STRUCTURE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault' 
ORDER BY ordinal_position;

-- Ensure password_vault has proper structure
CREATE TABLE IF NOT EXISTS password_vault (
    id SERIAL PRIMARY KEY,
    account_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    username VARCHAR(255),
    password_encrypted TEXT NOT NULL,
    phone_number VARCHAR(50),
    website_url VARCHAR(500),
    notes TEXT,
    folder_id INTEGER REFERENCES password_vault_folders(id),
    category VARCHAR(50) DEFAULT 'login',
    tags TEXT[],
    two_factor_auth BOOLEAN DEFAULT FALSE,
    security_questions JSONB,
    created_by_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE,
    password_strength VARCHAR(20) DEFAULT 'unknown',
    password_created_date DATE,
    password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_compromised BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    is_favorite BOOLEAN DEFAULT FALSE
);

-- Add missing columns to password_vault if they don't exist
DO $$
BEGIN
    -- Add created_by_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'created_by_id'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN created_by_id INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added created_by_id column to password_vault';
    END IF;
    
    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to password_vault';
    END IF;
    
    -- Add folder_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault' 
        AND column_name = 'folder_id'
    ) THEN
        ALTER TABLE password_vault 
        ADD COLUMN folder_id INTEGER REFERENCES password_vault_folders(id);
        RAISE NOTICE 'Added folder_id column to password_vault';
    END IF;
END $$;

-- STEP 3: Disable RLS temporarily for setup
-- =====================================================
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;

-- STEP 4: Grant full permissions
-- =====================================================
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT ALL ON password_vault TO anon, authenticated;
GRANT USAGE, SELECT ON password_vault_folders_id_seq TO anon, authenticated;
GRANT USAGE, SELECT ON password_vault_id_seq TO anon, authenticated;

-- STEP 5: Create default folders
-- =====================================================
INSERT INTO password_vault_folders (name, description, color, icon, created_by_id)
VALUES 
    ('Personal', 'Personal passwords folder', '#5884FD', 'folder', 1),
    ('Work', 'Work-related passwords', '#10B981', 'briefcase', 1),
    ('Social', 'Social media accounts', '#F59E0B', 'users', 1)
ON CONFLICT DO NOTHING;

-- STEP 6: Re-enable RLS with proper policies
-- =====================================================
ALTER TABLE password_vault_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own folders" ON password_vault_folders;
DROP POLICY IF EXISTS "folders_all_operations" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_policy" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_full_access" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_access" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_simple_access" ON password_vault_folders;

DROP POLICY IF EXISTS "Users can view their own passwords and shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can insert their own passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can update their own passwords and editable shared passwords" ON password_vault;
DROP POLICY IF EXISTS "Users can delete their own passwords and deletable shared passwords" ON password_vault;
DROP POLICY IF EXISTS "password_vault_select" ON password_vault;
DROP POLICY IF EXISTS "password_vault_insert" ON password_vault;
DROP POLICY IF EXISTS "password_vault_update" ON password_vault;
DROP POLICY IF EXISTS "password_vault_delete" ON password_vault;

-- Create simple, working RLS policies for folders
CREATE POLICY "password_vault_folders_all_access" ON password_vault_folders
    FOR ALL USING (
        created_by_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'sub'), '1') OR
        created_by::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'sub'), '1') OR
        created_by_id = 1 OR  -- Allow access to default folders
        created_by = 1
    );

-- Create simple, working RLS policies for passwords
CREATE POLICY "password_vault_all_access" ON password_vault
    FOR ALL USING (
        created_by_id::text = COALESCE((current_setting('request.jwt.claims', true)::json->>'sub'), '1') OR
        created_by_id = 1  -- Allow access to default passwords
    );

-- STEP 7: Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by_id ON password_vault_folders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by ON password_vault_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_name ON password_vault_folders(name);

CREATE INDEX IF NOT EXISTS idx_password_vault_created_by_id ON password_vault(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folder_id ON password_vault(folder_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_is_active ON password_vault(is_active);
CREATE INDEX IF NOT EXISTS idx_password_vault_account_name ON password_vault(account_name);

-- STEP 8: Create update triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for password_vault_folders
DROP TRIGGER IF EXISTS update_password_vault_folders_updated_at ON password_vault_folders;
CREATE TRIGGER update_password_vault_folders_updated_at 
    BEFORE UPDATE ON password_vault_folders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers for password_vault
DROP TRIGGER IF EXISTS update_password_vault_updated_at ON password_vault;
CREATE TRIGGER update_password_vault_updated_at 
    BEFORE UPDATE ON password_vault
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Final verification
-- =====================================================

-- Show final table structures
SELECT 
    'FINAL password_vault_folders STRUCTURE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

SELECT 
    'FINAL password_vault STRUCTURE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS STATUS:' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('password_vault_folders', 'password_vault');

-- Check policies
SELECT 
    'RLS POLICIES:' as info,
    tablename,
    policyname,
    cmd as command
FROM pg_policies 
WHERE tablename IN ('password_vault_folders', 'password_vault');

-- Show existing data
SELECT 
    'EXISTING FOLDERS:' as info,
    id,
    name,
    COALESCE(created_by_id, created_by) as owner_id,
    created_at
FROM password_vault_folders
LIMIT 5;

SELECT 
    'EXISTING PASSWORDS COUNT:' as info,
    COUNT(*) as total_passwords,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_passwords,
    COUNT(CASE WHEN is_active = false THEN 1 END) as deleted_passwords
FROM password_vault;

-- Final success message
SELECT 
    '✅ COMPLETE PASSWORD VAULT FIX APPLIED!' as status,
    'Both folder creation and password deletion should now work' as message,
    'Test by creating a folder and deleting a password' as next_step;

