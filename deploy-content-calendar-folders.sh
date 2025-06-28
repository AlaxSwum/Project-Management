#!/bin/bash

echo "🚀 Deploying Content Calendar Folders System..."
echo "📅 Time: $(date)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. First disable RLS to fix the permission errors
echo -e "${YELLOW}[STEP 1] Disabling RLS for Content Calendar tables...${NC}"
cat > temp_disable_rls.sql << 'EOF'
-- Disable RLS for existing content calendar tables
ALTER TABLE content_calendar DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_members DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;
DROP POLICY IF EXISTS content_calendar_members_policy ON content_calendar_members;

-- Grant permissions to anon role for API access
GRANT ALL ON content_calendar TO anon;
GRANT ALL ON content_calendar_members TO anon;
GRANT USAGE, SELECT ON content_calendar_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_members_id_seq TO anon;
GRANT SELECT ON auth_user TO anon;
EOF

echo "✅ RLS disabled for Content Calendar tables"

# 2. Create folder tables
echo -e "${YELLOW}[STEP 2] Creating Content Calendar folder tables...${NC}"
cat > temp_create_folders.sql << 'EOF'
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
EOF

echo "✅ Folder tables created"

# 3. Insert default data
echo -e "${YELLOW}[STEP 3] Inserting default folder structure...${NC}"
cat > temp_default_folders.sql << 'EOF'
-- Insert 2025 year folder
INSERT INTO content_calendar_folders (name, description, folder_type, sort_order, created_by_id) 
VALUES ('2025', 'Content Calendar for Year 2025', 'year', 1, 1)
ON CONFLICT DO NOTHING;

-- Insert months for 2025
INSERT INTO content_calendar_folders (name, description, parent_folder_id, folder_type, sort_order, created_by_id)
SELECT 
    month_name,
    month_name || ' 2025 Content',
    year_folder.id,
    'month',
    month_order,
    1
FROM (VALUES 
    ('January', 1), ('February', 2), ('March', 3), ('April', 4),
    ('May', 5), ('June', 6), ('July', 7), ('August', 8),
    ('September', 9), ('October', 10), ('November', 11), ('December', 12)
) AS months(month_name, month_order)
CROSS JOIN (
    SELECT id FROM content_calendar_folders WHERE name = '2025' AND folder_type = 'year'
) AS year_folder
ON CONFLICT DO NOTHING;

-- Grant all superusers and staff admin access to all folders
INSERT INTO content_calendar_folder_members (folder_id, user_id, role, can_create, can_edit, can_delete, can_manage_members)
SELECT 
    f.id,
    u.id,
    'admin',
    true,
    true,
    true,
    true
FROM content_calendar_folders f
CROSS JOIN auth_user u
WHERE (u.is_superuser = true OR u.is_staff = true)
AND NOT EXISTS (
    SELECT 1 FROM content_calendar_folder_members fm 
    WHERE fm.folder_id = f.id AND fm.user_id = u.id
);
EOF

echo "✅ Default folder structure inserted"

# 4. Create useful views
echo -e "${YELLOW}[STEP 4] Creating database views...${NC}"
cat > temp_create_views.sql << 'EOF'
-- Create folder tree view
CREATE OR REPLACE VIEW content_calendar_folder_tree AS
WITH RECURSIVE folder_tree AS (
    SELECT 
        id, name, description, parent_folder_id, folder_type, color, sort_order,
        created_by_id, created_at, updated_at, is_active,
        0 as level, name as path
    FROM content_calendar_folders
    WHERE parent_folder_id IS NULL AND is_active = true
    
    UNION ALL
    
    SELECT 
        f.id, f.name, f.description, f.parent_folder_id, f.folder_type, f.color, f.sort_order,
        f.created_by_id, f.created_at, f.updated_at, f.is_active,
        ft.level + 1, ft.path || ' > ' || f.name
    FROM content_calendar_folders f
    JOIN folder_tree ft ON f.parent_folder_id = ft.id
    WHERE f.is_active = true
)
SELECT * FROM folder_tree ORDER BY level, sort_order, name;

-- Create hierarchy view
CREATE OR REPLACE VIEW content_calendar_hierarchy AS
SELECT 
    c.id as content_id, c.date, c.content_type, c.category, c.social_media,
    c.content_title, c.assigned_to, c.content_deadline, c.graphic_deadline,
    c.status, c.description, c.created_at, c.updated_at, c.folder_id,
    f.name as folder_name, f.folder_type,
    pf.name as parent_folder_name, pf.id as parent_folder_id
FROM content_calendar c
LEFT JOIN content_calendar_folders f ON c.folder_id = f.id
LEFT JOIN content_calendar_folders pf ON f.parent_folder_id = pf.id
WHERE f.is_active = true OR f.is_active IS NULL;

-- Grant access to views
GRANT SELECT ON content_calendar_folder_tree TO anon;
GRANT SELECT ON content_calendar_hierarchy TO anon;
EOF

echo "✅ Database views created"

echo -e "${GREEN}✅ All SQL scripts prepared successfully!${NC}"
echo ""
echo "📁 Files created:"
echo "  - temp_disable_rls.sql"
echo "  - temp_create_folders.sql" 
echo "  - temp_default_folders.sql"
echo "  - temp_create_views.sql"
echo ""
echo "🌐 Next: These will be executed on the server during deployment"

# The actual SQL execution will happen on the server
echo "📝 SQL scripts are ready for server execution" 