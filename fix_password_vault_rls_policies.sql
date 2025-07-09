-- Fix Password Vault RLS Infinite Recursion
-- This script fixes the circular references in RLS policies that cause infinite recursion

-- Step 1: Temporarily disable RLS on problematic tables to break the cycle
ALTER TABLE password_vault_folder_access DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop the problematic policies that cause circular references
DROP POLICY IF EXISTS "Users can view folder access for their own folders" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can grant access to their own folders" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can update folder access for folders they own or manage" ON password_vault_folder_access;
DROP POLICY IF EXISTS "Users can delete folder access for folders they own or manage" ON password_vault_folder_access;

-- Step 3: Drop the view that causes circular references
DROP VIEW IF EXISTS password_vault_full_access;

-- Step 4: Create a simpler view without circular RLS references
CREATE OR REPLACE VIEW password_vault_with_folders AS
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
    pvf.name as folder_name,
    pvf.color as folder_color,
    pvf.icon as folder_icon,
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update
FROM password_vault pv
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
WHERE pv.is_active = true;

-- Step 5: Create simplified RLS policies for folder access without circular references
ALTER TABLE password_vault_folder_access ENABLE ROW LEVEL SECURITY;

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

-- Step 6: Update the existing password_vault_with_access view to be simpler
DROP VIEW IF EXISTS password_vault_with_access;

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
    CASE 
        WHEN pv.password_created_date IS NOT NULL AND pv.password_created_date < CURRENT_DATE - INTERVAL '90 days' THEN true
        ELSE false
    END as password_needs_update
FROM password_vault pv
LEFT JOIN password_vault_access pva ON pv.id = pva.vault_id
LEFT JOIN password_vault_folders pvf ON pv.folder_id = pvf.id
WHERE pv.is_active = true;

SELECT 'Password vault RLS policies fixed - infinite recursion eliminated!' as message; 