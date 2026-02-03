-- =====================================================
-- FIX PASSWORD VAULT FOLDERS CREATED_BY COLUMN ISSUE
-- =====================================================
-- This script fixes the missing 'created_by' column error in password_vault_folders table

-- Step 1: Check if the column exists and add it if missing
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
    ELSE
        RAISE NOTICE 'created_by_id column already exists in password_vault_folders';
    END IF;
    
    -- Check if created_by column exists (alternative naming)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'password_vault_folders' 
        AND column_name = 'created_by'
    ) THEN
        -- Add created_by column as UUID to match auth.users(id) if created_by_id doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'password_vault_folders' 
            AND column_name = 'created_by_id'
        ) THEN
            ALTER TABLE password_vault_folders 
            ADD COLUMN created_by UUID REFERENCES auth.users(id);
            
            RAISE NOTICE 'Added created_by column to password_vault_folders';
        END IF;
    ELSE
        RAISE NOTICE 'created_by column already exists in password_vault_folders';
    END IF;
END $$;

-- Step 2: Ensure the table has the correct structure
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, created_by_id, parent_folder_id)
);

-- Step 3: Update any existing rows that might have NULL created_by_id
-- (This is a safety measure - you might want to set a default user or handle this differently)
UPDATE password_vault_folders 
SET created_by_id = (
    SELECT id FROM auth.users LIMIT 1
)
WHERE created_by_id IS NULL 
AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- Step 4: Make created_by_id NOT NULL after setting default values
ALTER TABLE password_vault_folders 
ALTER COLUMN created_by_id SET NOT NULL;

-- Step 5: Ensure RLS is properly configured
ALTER TABLE password_vault_folders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own folders" ON password_vault_folders;
DROP POLICY IF EXISTS "folders_all_operations" ON password_vault_folders;
DROP POLICY IF EXISTS "password_vault_folders_policy" ON password_vault_folders;

-- Create comprehensive RLS policy
CREATE POLICY "password_vault_folders_full_access" ON password_vault_folders
    FOR ALL USING (created_by_id = auth.uid());

-- Step 6: Grant necessary permissions
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT USAGE, SELECT ON password_vault_folders_id_seq TO anon, authenticated;

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_created_by ON password_vault_folders(created_by_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_parent ON password_vault_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_password_vault_folders_name ON password_vault_folders(name);

-- Step 8: Create trigger for updating timestamps
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

-- Step 9: Insert default "Personal" folder if none exists
INSERT INTO password_vault_folders (name, description, color, icon, created_by_id)
SELECT 'Personal', 'Default personal folder', '#5884FD', 'folder', auth.uid()
WHERE NOT EXISTS (
    SELECT 1 FROM password_vault_folders 
    WHERE name = 'Personal' AND created_by_id = auth.uid()
)
AND auth.uid() IS NOT NULL;

-- Success message
SELECT 
    'Password vault folders table fixed successfully!' as message,
    'Column created_by_id added and configured properly' as status,
    'RLS policies updated for proper access control' as security;

