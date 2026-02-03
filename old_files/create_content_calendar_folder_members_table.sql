-- Create content calendar folder members table for folder-based permissions
-- This enables sharing folders with specific users and managing their permissions

-- Create the folder members table if it doesn't exist
CREATE TABLE IF NOT EXISTS content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES content_calendar_folders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor', 'manager', 'admin')),
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_manage_members BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure a user can only be added once per folder
    UNIQUE(folder_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_folder_id ON content_calendar_folder_members(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_user_id ON content_calendar_folder_members(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_content_calendar_folder_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_calendar_folder_members_updated_at
    BEFORE UPDATE ON content_calendar_folder_members
    FOR EACH ROW
    EXECUTE FUNCTION update_content_calendar_folder_members_updated_at();

-- Enable Row Level Security
ALTER TABLE content_calendar_folder_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can see memberships for folders they have access to
CREATE POLICY "Users can view folder memberships for accessible folders" 
    ON content_calendar_folder_members FOR SELECT 
    USING (
        -- User is the member themselves
        user_id = (SELECT id FROM auth_user WHERE email = current_user) OR
        -- User is a member of the folder
        folder_id IN (
            SELECT folder_id FROM content_calendar_folder_members 
            WHERE user_id = (SELECT id FROM auth_user WHERE email = current_user)
        ) OR
        -- User created the folder
        folder_id IN (
            SELECT id FROM content_calendar_folders 
            WHERE created_by_id = (SELECT id FROM auth_user WHERE email = current_user)
        ) OR
        -- User is admin/manager
        (SELECT role FROM auth_user WHERE email = current_user) IN ('admin', 'manager') OR
        (SELECT is_superuser FROM auth_user WHERE email = current_user) = true
    );

CREATE POLICY "Users can insert folder memberships for folders they manage" 
    ON content_calendar_folder_members FOR INSERT 
    WITH CHECK (
        -- User created the folder
        folder_id IN (
            SELECT id FROM content_calendar_folders 
            WHERE created_by_id = (SELECT id FROM auth_user WHERE email = current_user)
        ) OR
        -- User has manage_members permission for the folder
        folder_id IN (
            SELECT folder_id FROM content_calendar_folder_members 
            WHERE user_id = (SELECT id FROM auth_user WHERE email = current_user)
            AND can_manage_members = true
        ) OR
        -- User is admin/manager
        (SELECT role FROM auth_user WHERE email = current_user) IN ('admin', 'manager') OR
        (SELECT is_superuser FROM auth_user WHERE email = current_user) = true
    );

CREATE POLICY "Users can delete folder memberships for folders they manage" 
    ON content_calendar_folder_members FOR DELETE 
    USING (
        -- User created the folder
        folder_id IN (
            SELECT id FROM content_calendar_folders 
            WHERE created_by_id = (SELECT id FROM auth_user WHERE email = current_user)
        ) OR
        -- User has manage_members permission for the folder
        folder_id IN (
            SELECT folder_id FROM content_calendar_folder_members 
            WHERE user_id = (SELECT id FROM auth_user WHERE email = current_user)
            AND can_manage_members = true
        ) OR
        -- User is admin/manager
        (SELECT role FROM auth_user WHERE email = current_user) IN ('admin', 'manager') OR
        (SELECT is_superuser FROM auth_user WHERE email = current_user) = true
    );

-- Grant permissions
GRANT ALL ON content_calendar_folder_members TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE content_calendar_folder_members_id_seq TO authenticated;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'content_calendar_folder_members'
ORDER BY ordinal_position;

-- Success message
SELECT 'Content Calendar Folder Members table created successfully!' as message,
       'Table: content_calendar_folder_members with RLS policies' as details;
