-- Fix Password Vault Folder Relationship
-- This script adds proper foreign key relationship between password_vault and password_vault_folders

-- Step 1: Add folder_id column to password_vault table
ALTER TABLE password_vault 
ADD COLUMN folder_id INTEGER REFERENCES password_vault_folders(id) ON DELETE SET NULL;

-- Step 2: Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_password_vault_folder_id ON password_vault(folder_id);

-- Step 3: Migrate existing folder_name data to folder_id (optional)
-- This will try to match existing folder names with folder records
UPDATE password_vault 
SET folder_id = (
    SELECT id 
    FROM password_vault_folders 
    WHERE password_vault_folders.name = password_vault.folder_name 
    AND password_vault_folders.created_by_id = password_vault.created_by_id
    LIMIT 1
)
WHERE folder_name IS NOT NULL;

-- Step 4: Create default "Personal" folder for users who don't have one
INSERT INTO password_vault_folders (name, description, created_by_id)
SELECT DISTINCT 
    'Personal',
    'Default personal folder',
    created_by_id
FROM password_vault 
WHERE created_by_id NOT IN (
    SELECT created_by_id 
    FROM password_vault_folders 
    WHERE name = 'Personal'
)
ON CONFLICT (name, created_by_id, parent_folder_id) DO NOTHING;

-- Step 5: Set folder_id for records that still don't have one
UPDATE password_vault 
SET folder_id = (
    SELECT id 
    FROM password_vault_folders 
    WHERE name = 'Personal' 
    AND created_by_id = password_vault.created_by_id
    LIMIT 1
)
WHERE folder_id IS NULL;

-- Step 5b: Drop existing views that depend on folder_name column
DROP VIEW IF EXISTS password_vault_with_access;
DROP VIEW IF EXISTS password_vault_full_access;

-- Step 5c: Remove the old folder_name column since we now use folder_id
ALTER TABLE password_vault DROP COLUMN IF EXISTS folder_name;

-- Step 6: Create the new view with folder information

CREATE VIEW password_vault_with_access AS
SELECT 
    pv.id,
    pv.account_name,
    pv.email,
    pv.username,
    pv.password_encrypted,
    pv.phone_number,
    pv.website_url,
    pv.notes,
    pv.category,
    pv.tags,
    pv.two_factor_auth,
    pv.security_questions,
    pv.created_by_id,
    pv.created_at,
    pv.updated_at,
    pv.last_accessed,
    pv.password_strength,
    pv.password_created_date,
    pv.password_last_changed,
    pv.is_compromised,
    pv.is_active,
    pv.is_favorite,
    pv.folder_id,
    pva.user_id,
    pva.permission_level,
    pva.can_view,
    pva.can_edit,
    pva.can_delete,
    pva.can_share,
    pvf.name as folder_name,
    pvf.color as folder_color,
    pvf.icon as folder_icon,
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update
FROM password_vault pv
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
WHERE pv.is_active = true;

-- Step 7: Create folder access management table
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

-- Step 8: Create indexes for folder access
CREATE INDEX IF NOT EXISTS idx_password_folder_access_folder ON password_vault_folder_access(folder_id);
CREATE INDEX IF NOT EXISTS idx_password_folder_access_user ON password_vault_folder_access(user_id);
CREATE INDEX IF NOT EXISTS idx_password_folder_access_permission ON password_vault_folder_access(permission_level);

-- Step 9: Enable RLS for folder access
ALTER TABLE password_vault_folder_access ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies for folder access
CREATE POLICY "Users can view folder access for their own folders" ON password_vault_folder_access
    FOR SELECT USING (
        user_id = auth.uid() OR
        folder_id IN (SELECT id FROM password_vault_folders WHERE created_by_id = auth.uid())
    );

CREATE POLICY "Users can grant access to their own folders" ON password_vault_folder_access
    FOR INSERT WITH CHECK (
        folder_id IN (SELECT id FROM password_vault_folders WHERE created_by_id = auth.uid()) OR
        folder_id IN (
            SELECT folder_id FROM password_vault_folder_access 
            WHERE user_id = auth.uid() AND can_manage_access = true
        )
    );

CREATE POLICY "Users can update folder access for folders they own or manage" ON password_vault_folder_access
    FOR UPDATE USING (
        folder_id IN (SELECT id FROM password_vault_folders WHERE created_by_id = auth.uid()) OR
        folder_id IN (
            SELECT folder_id FROM password_vault_folder_access 
            WHERE user_id = auth.uid() AND can_manage_access = true
        )
    );

CREATE POLICY "Users can delete folder access for folders they own or manage" ON password_vault_folder_access
    FOR DELETE USING (
        folder_id IN (SELECT id FROM password_vault_folders WHERE created_by_id = auth.uid()) OR
        folder_id IN (
            SELECT folder_id FROM password_vault_folder_access 
            WHERE user_id = auth.uid() AND can_manage_access = true
        )
    );

-- Step 11: Create function to automatically grant owner permissions to folder creator
CREATE OR REPLACE FUNCTION grant_folder_owner_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- Grant owner permissions to the folder creator
    INSERT INTO password_vault_folder_access (folder_id, user_id, permission_level, can_view, can_edit, can_delete, can_manage_access, can_create_passwords, granted_by)
    VALUES (NEW.id, NEW.created_by_id, 'owner', true, true, true, true, true, NEW.created_by_id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER grant_folder_owner_permissions_trigger
    AFTER INSERT ON password_vault_folders
    FOR EACH ROW
    EXECUTE FUNCTION grant_folder_owner_permissions();

-- Step 12: Grant owner permissions to existing folder creators
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

-- Step 13: Create comprehensive view for password vault with folder access
CREATE VIEW password_vault_full_access AS
SELECT 
    pv.id,
    pv.account_name,
    pv.email,
    pv.username,
    pv.password_encrypted,
    pv.phone_number,
    pv.website_url,
    pv.notes,
    pv.category,
    pv.tags,
    pv.two_factor_auth,
    pv.security_questions,
    pv.created_by_id,
    pv.created_at,
    pv.updated_at,
    pv.last_accessed,
    pv.password_strength,
    pv.password_created_date,
    pv.password_last_changed,
    pv.is_compromised,
    pv.is_active,
    pv.is_favorite,
    pv.folder_id,
    pva.user_id,
    pva.permission_level as vault_permission_level,
    pva.can_view as vault_can_view,
    pva.can_edit as vault_can_edit,
    pva.can_delete as vault_can_delete,
    pva.can_share as vault_can_share,
    pvf.name as folder_name,
    pvf.color as folder_color,
    pvf.icon as folder_icon,
    pvfa.permission_level as folder_permission_level,
    pvfa.can_view as folder_can_view,
    pvfa.can_edit as folder_can_edit,
    pvfa.can_delete as folder_can_delete,
    pvfa.can_manage_access as folder_can_manage_access,
    pvfa.can_create_passwords as folder_can_create_passwords,
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update,
    -- Overall access: user has access if they have vault access OR folder access
    CASE 
        WHEN pva.can_view = true OR pvfa.can_view = true OR pv.created_by_id = auth.uid() THEN true
        ELSE false
    END as has_access
FROM password_vault pv
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id AND pva.user_id = auth.uid()
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
LEFT JOIN password_vault_folder_access pvfa ON pvf.id = pvfa.folder_id AND pvfa.user_id = auth.uid()
WHERE pv.is_active = true;

SELECT 'Password vault relationship and folder access management created successfully!' as message,
       'New features: Folder-level access control, Owner permissions auto-grant, Comprehensive access view' as features; 