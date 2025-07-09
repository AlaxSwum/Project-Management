-- Quick Fix for Password Vault - Create Missing Table
-- This creates the minimum table structure needed for the frontend to work

-- Create the missing password_vault_folder_access table
CREATE TABLE IF NOT EXISTS password_vault_folder_access (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER,
    user_id UUID,
    permission_level VARCHAR(20) DEFAULT 'viewer',
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_access BOOLEAN DEFAULT FALSE,
    can_create_passwords BOOLEAN DEFAULT FALSE,
    granted_by UUID,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(folder_id, user_id)
);

-- Basic RLS to prevent errors
ALTER TABLE password_vault_folder_access ENABLE ROW LEVEL SECURITY;

-- Simple policy to allow users to see their own records
CREATE POLICY "password_vault_folder_access_policy" ON password_vault_folder_access
    FOR ALL USING (user_id = auth.uid());

SELECT 'Password vault folder access table created!' as status; 