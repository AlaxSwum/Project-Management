-- =====================================================
-- CORRECTED FIX FOR PASSWORD VAULT FOLDERS CREATED_BY COLUMN
-- =====================================================
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- Step 1: First, let's check the current table structure
SELECT 
    'Current table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Step 2: Handle the created_by_id column type issue
DO $$
BEGIN
    -- Check if created_by_id exists and its type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
        AND data_type = 'integer'
    ) THEN
        -- If it's INTEGER, we need to handle this carefully
        RAISE NOTICE 'Found created_by_id as INTEGER, will work with existing structure';
        
        -- Make sure it's not null for existing records
        UPDATE password_vault_folders 
        SET created_by_id = 1 
        WHERE created_by_id IS NULL;
        
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        -- Add created_by_id as INTEGER to match existing pattern
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by_id INTEGER;
        
        -- Set default value for existing records
        UPDATE password_vault_folders 
        SET created_by_id = 1 
        WHERE created_by_id IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE password_vault_folders 
        ALTER COLUMN created_by_id SET NOT NULL;
        
        RAISE NOTICE 'Added created_by_id column as INTEGER';
    END IF;
    
    -- Also check for 'created_by' column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        -- Add created_by column as INTEGER
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by INTEGER NOT NULL DEFAULT 1;
        
        RAISE NOTICE 'Added created_by column as INTEGER';
    END IF;
END $$;

-- Step 3: Ensure basic table structure (without parent_folder_id for now)
CREATE TABLE IF NOT EXISTS password_vault_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5884FD',
    icon VARCHAR(50) DEFAULT 'folder',
    created_by_id INTEGER,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Add parent_folder_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'parent_folder_id'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN parent_folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added parent_folder_id column';
    END IF;
END $$;

-- Step 5: Add sort_order column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD COLUMN sort_order INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added sort_order column';
    END IF;
END $$;

-- Step 6: Add unique constraint (only if all required columns exist)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'parent_folder_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'password_vault_folders' 
        AND constraint_name = 'password_vault_folders_unique_name'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD CONSTRAINT password_vault_folders_unique_name 
        UNIQUE(name, created_by_id, parent_folder_id);
        
        RAISE NOTICE 'Added unique constraint';
    END IF;
END $$;

-- Step 7: Disable RLS temporarily
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT USAGE, SELECT ON password_vault_folders_id_seq TO anon, authenticated;

-- Step 9: Re-enable RLS with simple policies
ALTER TABLE password_vault_folders ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can manage their own folders" ON password_vault_folders;
DROP POLICY IF EXISTS "folders_all_operations" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_policy" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_full_access" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_access" ON password_vault_folders;

-- Create simple RLS policy that works with INTEGER user IDs
CREATE POLICY "password_vault_folders_simple_access" ON password_vault_folders
    FOR ALL USING (
        created_by_id::text = (current_setting('request.jwt.claims', true)::json->>'sub')::text OR
        created_by_id IS NULL OR
        created_by_id = 1  -- Allow access to default folders
    );

-- Step 10: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by_id ON password_vault_folders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_parent ON password_vault_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_name ON password_vault_folders(name);

-- Step 11: Create or replace the update trigger
CREATE OR REPLACE FUNCTION update_password_vault_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_password_vault_folders_updated_at ON password_vault_folders;
CREATE TRIGGER update_password_vault_folders_updated_at 
    BEFORE UPDATE ON password_vault_folders
    FOR EACH ROW 
    EXECUTE FUNCTION update_password_vault_folders_updated_at();

-- Step 12: Insert a default "Personal" folder if none exists
INSERT INTO password_vault_folders (name, description, color, icon, created_by_id)
VALUES ('Personal', 'Default personal folder', '#5884FD', 'folder', 1)
ON CONFLICT DO NOTHING;

-- Step 13: Final verification
SELECT 
    'FINAL TABLE STRUCTURE:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS STATUS:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'password_vault_folders';

-- Check policies
SELECT 
    'RLS POLICIES:' as info,
    policyname,
    permissive,
    cmd as command
FROM pg_policies 
WHERE tablename = 'password_vault_folders';

-- Check if we have any folders
SELECT 
    'EXISTING FOLDERS:' as info,
    id,
    name,
    created_by_id,
    created_at
FROM password_vault_folders
LIMIT 5;

-- Final success message
SELECT 
    '✅ PASSWORD VAULT FOLDERS FIX COMPLETED!' as status,
    'Table structure has been corrected and configured' as message,
    'You can now create folders in the password vault' as next_step;
