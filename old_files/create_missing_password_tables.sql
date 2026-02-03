-- Create Missing Password Vault Tables
-- Run this in Supabase SQL Editor to create the missing table that frontend expects

-- Create password_vault_folder_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS password_vault_folder_access (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Permission Levels for Folders
    permission_level VARCHAR(20) DEFAULT 'viewer', -- owner, editor, viewer
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_access BOOLEAN DEFAULT FALSE, -- Can grant/revoke access to this folder
    can_create_passwords BOOLEAN DEFAULT FALSE, -- Can create passwords in this folder
    
    -- Audit Trail
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    
    -- Unique constraint to prevent duplicate permissions
    UNIQUE(folder_id, user_id)
);

-- Create indexes for folder access
CREATE INDEX IF NOT EXISTS idx_password_folder_access_folder ON password_vault_folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_password_folder_access_user ON password_vault_folder_access(user_id);
CREATE INDEX IF NOT EXISTS idx_password_folder_access_permission ON password_vault_folder_access(permission_level);

-- Enable RLS for folder access
ALTER TABLE password_vault_folder_access ENABLE ROW LEVEL SECURITY;

-- Create simplified RLS policies for folder access
DROP POLICY IF EXISTS "Users can manage their own folder access" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Folder owners can manage folder access" ON password_vault_folder_access;

-- Simple policy: users can only see their own folder access records
CREATE POLICY "Users can manage their own folder access" ON password_vault_folder_access
    FOR ALL USING (user_id = auth.uid());

-- Policy for folder owners to manage access to their folders
CREATE POLICY "Folder owners can manage folder access" ON password_vault_folder_access
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM password_vault_folders 
            WHERE id = password_vault_folder_access.folder_id 
            AND created_by_id = auth.uid()
        )
    );

-- Add folder_id column to password_vault if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'password_vault' AND column_name = 'folder_id') THEN
        ALTER TABLE password_vault ADD COLUMN folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_password_vault_folder_id ON password_vault(folder_id);
    END IF;
END
$$;

-- Create function to automatically grant owner permissions to folder creator
CREATE OR REPLACE FUNCTION grant_folder_owner_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant owner permissions to the folder creator
    INSERT INTO password_vault_folder_access (folder_id, user_id, permission_level, can_view, can_edit, can_delete, can_manage_access, can_create_passwords, granted_by)
    VALUES (NEW.id, NEW.created_by_id, 'owner', true, true, true, true, true, NEW.created_by_id)
    ON CONFLICT (folder_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS grant_folder_owner_permissions_trigger ON password_vault_folders;
CREATE TRIGGER grant_folder_owner_permissions_trigger
    AFTER INSERT ON password_vault_folders
    FOR EACH ROW
    EXECUTE FUNCTION grant_folder_owner_permissions();

-- Grant owner permissions to existing folder creators
INSERT INTO password_vault_folder_access (folder_id, user_id, permission_level, can_view, can_edit, can_delete, can_manage_access, can_create_passwords, granted_by)
SELECT 
    id as folder_id,
    created_by_id as user_id,
    'owner' as permission_level,
    true as can_view,
    true as can_edit,
    true as can_delete,
    true as can_manage_access,
    true as can_create_passwords,
    created_by_id as granted_by
FROM password_vault_folders
WHERE created_by_id IS NOT NULL
ON CONFLICT (folder_id, user_id) DO NOTHING;

SELECT 'Missing password vault tables created successfully!' as message,
       'password_vault_folder_access table is now available' as status; 