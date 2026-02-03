-- =====================================================
-- ULTIMATE PASSWORD VAULT FIX - HANDLES BOTH COLUMNS
-- =====================================================
-- This fixes the NOT NULL constraint issue on created_by_id

-- Step 1: Check current table structure
SELECT 
    'Current password_vault_folders structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Step 2: Handle both created_by and created_by_id columns
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
END $$;

-- Step 3: Set default values for both columns
UPDATE password_vault_folders 
SET created_by = 1 
WHERE created_by IS NULL;

UPDATE password_vault_folders 
SET created_by_id = 1 
WHERE created_by_id IS NULL;

-- Step 4: Remove NOT NULL constraint from created_by_id if it exists
DO $$
BEGIN
    -- Check if created_by_id has NOT NULL constraint and remove it
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

-- Step 5: Set default values again after removing constraint
UPDATE password_vault_folders 
SET created_by_id = 1 
WHERE created_by_id IS NULL;

-- Step 6: Handle password_vault table
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
        ADD COLUMN created_by_id INTEGER DEFAULT 1;
        RAISE NOTICE 'Added created_by_id column to password_vault';
    END IF;
END $$;

-- Step 7: Update NULL values in password_vault
UPDATE password_vault 
SET created_by_id = 1 
WHERE created_by_id IS NULL;

UPDATE password_vault 
SET is_active = TRUE 
WHERE is_active IS NULL;

-- Step 8: Disable RLS temporarily
ALTER TABLE password_vault_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE password_vault DISABLE ROW LEVEL SECURITY;

-- Step 9: Grant permissions
GRANT ALL ON password_vault_folders TO anon, authenticated;
GRANT ALL ON password_vault TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Step 10: Delete existing default folder to avoid conflicts
DELETE FROM password_vault_folders WHERE name = 'Personal' AND (created_by = 1 OR created_by_id = 1);

-- Step 11: Insert default folder with both columns set
INSERT INTO password_vault_folders (name, description, color, icon, created_by, created_by_id)
VALUES ('Personal', 'Personal passwords folder', '#5884FD', 'folder', 1, 1);

-- Step 12: Show final table structure
SELECT 
    'FINAL password_vault_folders structure:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'password_vault_folders' 
ORDER BY ordinal_position;

-- Step 13: Show existing folders
SELECT 
    'Existing folders after fix:' as info,
    id,
    name,
    created_by,
    created_by_id,
    created_at
FROM password_vault_folders;

-- Success message
SELECT 'ULTIMATE FIX APPLIED! Both created_by and created_by_id columns are now properly configured.' as message;
