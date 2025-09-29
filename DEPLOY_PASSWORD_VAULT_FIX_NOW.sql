-- =====================================================
-- IMMEDIATE FIX FOR PASSWORD VAULT FOLDERS CREATED_BY COLUMN
-- =====================================================
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- Step 1: Add the missing created_by_id column if it doesn't exist
DO $$
BEGIN
    -- Check if created_by_id column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        -- Add created_by_id column as UUID to match auth.users(id)
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by_id UUID REFERENCES auth.users(id);
        
        RAISE NOTICE 'Added created_by_id column to password_vault_folders';
    END IF;
    
    -- Also check for 'created_by' column (alternative naming)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by_id'
    ) THEN
        -- Add created_by column if neither exists
        ALTER TABLE password_vault_folders 
        ADD COLUMN created_by UUID REFERENCES auth.users(id);
        
        RAISE NOTICE 'Added created_by column to password_vault_folders';
    END IF;
END $$;

-- Step 2: Ensure the table structure is correct
-- This will create the table if it doesn't exist, or do nothing if it does
CREATE TABLE IF NOT EXISTS password_vault_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#5884FD',
    icon VARCHAR(50) DEFAULT 'folder',
    parent_folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_by_id UUID REFERENCES auth.users(id),
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'password_vault_folders' 
        AND constraint_name = 'password_vault_folders_name_created_by_id_parent_folder_id_key'
    ) THEN
        ALTER TABLE password_vault_folders 
        ADD CONSTRAINT password_vault_folders_name_created_by_id_parent_folder_id_key 
        UNIQUE(name, created_by_id, parent_folder_id);
        
        RAISE NOTICE 'Added unique constraint to password_vault_folders';
    END IF;
END $$;

-- Step 4: Disable RLS temporarily to fix any issues
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant permissions
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT USAGE, SELECT ON password_vault_folders_id_seq TO anon, authenticated;

-- Step 6: Re-enable RLS with proper policies
ALTER TABLE password_vault_folders ENABLE ROW LEVEL SECURITY;

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can manage their own folders" ON password_vault_folders;
DROP POLICY IF EXISTS "folders_all_operations" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_policy" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_full_access" ON password_vault_folders;

-- Create a comprehensive RLS policy
CREATE POLICY "password_vault_folders_access" ON password_vault_folders
    FOR ALL USING (
        created_by_id = auth.uid() OR 
        created_by = auth.uid() OR
        created_by_id IS NULL  -- Allow access to folders without owner during migration
    );

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by_id ON password_vault_folders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by ON password_vault_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_parent ON password_vault_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_name ON password_vault_folders(name);

-- Step 8: Create or replace the update trigger
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

-- Step 9: Verification queries
SELECT 
    'Password vault folders table structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
    'RLS Status:' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'password_vault_folders';

-- Check policies
SELECT 
    'RLS Policies:' as info,
    policyname,
    permissive,
    cmd as command
FROM pg_policies 
WHERE tablename = 'password_vault_folders';

-- Final success message
SELECT 
    '✅ PASSWORD VAULT FOLDERS FIX COMPLETED!' as status,
    'The created_by_id column has been added and configured' as message,
    'You can now create folders in the password vault' as next_step;
