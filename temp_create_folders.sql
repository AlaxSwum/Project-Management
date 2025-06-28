-- Create content_calendar_folders table
CREATE TABLE IF NOT EXISTS content_calendar_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE CASCADE,
    folder_type VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(7) DEFAULT '#000000',
    sort_order INTEGER DEFAULT 0,
    created_by_id INTEGER REFERENCES auth_user(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create content_calendar_folder_members table
CREATE TABLE IF NOT EXISTS content_calendar_folder_members (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'viewer',
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_manage_members BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, user_id)
);

-- Add folder_id to content_calendar table
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES content_calendar_folders(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_parent ON content_calendar_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folders_type ON content_calendar_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_folder ON content_calendar_folder_members(folder_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder_members_user ON content_calendar_folder_members(user_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_folder ON content_calendar(folder_id);

-- Disable RLS for new tables
ALTER TABLE content_calendar_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_folder_members DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON content_calendar_folders TO anon;
GRANT ALL ON content_calendar_folder_members TO anon;
GRANT USAGE, SELECT ON content_calendar_folders_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_folder_members_id_seq TO anon;
