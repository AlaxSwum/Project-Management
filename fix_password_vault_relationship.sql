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

-- Step 6: Update the view to include folder information
CREATE OR REPLACE VIEW password_vault_with_access AS
SELECT 
    pv.*,
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

SELECT 'Password vault relationship fixed successfully!' as message; 