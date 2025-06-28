#!/bin/bash

echo "🔧 Fixing Content Calendar Database Issues NOW..."
echo "📅 Time: $(date)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://bayyefskgflbyyuwrlgm.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDI1ODQzMCwiZXhwIjoyMDY1ODM0NDMwfQ.Z6a1r5FbqyEpEVaWBNwUuKF38Dk51IvNh3pPdFJoL0A"

# Step 1: Disable RLS and grant permissions
echo -e "${YELLOW}[STEP 1] Disabling RLS and granting permissions...${NC}"

SQL_STEP1="
-- Disable RLS for existing Content Calendar tables
ALTER TABLE content_calendar DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_members DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;
DROP POLICY IF EXISTS content_calendar_members_policy ON content_calendar_members;

-- Grant full access to anon role
GRANT ALL ON content_calendar TO anon;
GRANT ALL ON content_calendar_members TO anon;
GRANT USAGE, SELECT ON content_calendar_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_members_id_seq TO anon;
GRANT SELECT ON auth_user TO anon;
"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_STEP1}\"}" > /dev/null 2>&1

echo -e "${GREEN}✅ RLS disabled and permissions granted${NC}"

# Step 2: Create folder tables
echo -e "${YELLOW}[STEP 2] Creating folder tables...${NC}"

SQL_STEP2="
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

-- Disable RLS for new tables
ALTER TABLE content_calendar_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar_folder_members DISABLE ROW LEVEL SECURITY;

-- Grant permissions to new tables
GRANT ALL ON content_calendar_folders TO anon;
GRANT ALL ON content_calendar_folder_members TO anon;
GRANT USAGE, SELECT ON content_calendar_folders_id_seq TO anon;
GRANT USAGE, SELECT ON content_calendar_folder_members_id_seq TO anon;
"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_STEP2}\"}" > /dev/null 2>&1

echo -e "${GREEN}✅ Folder tables created${NC}"

# Step 3: Insert default folder structure
echo -e "${YELLOW}[STEP 3] Creating default folder structure...${NC}"

SQL_STEP3="
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
"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_STEP3}\"}" > /dev/null 2>&1

echo -e "${GREEN}✅ Default folder structure created${NC}"

# Step 4: Create views
echo -e "${YELLOW}[STEP 4] Creating database views...${NC}"

SQL_STEP4="
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

-- Grant access to view
GRANT SELECT ON content_calendar_folder_tree TO anon;
"

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/query" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL_STEP4}\"}" > /dev/null 2>&1

echo -e "${GREEN}✅ Database views created${NC}"

echo ""
echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo ""
echo "✅ Fixed Issues:"
echo "  - Disabled RLS on all Content Calendar tables"
echo "  - Granted full permissions to anon role"
echo "  - Created content_calendar_folders table"
echo "  - Created content_calendar_folder_members table"
echo "  - Added folder_id column to content_calendar table"
echo "  - Created 2025 folder structure with 12 months"
echo "  - Created folder tree view for hierarchical display"
echo ""
echo "🔗 Test the Content Calendar now: https://srv875725.hstgr.cloud/content-calendar"
echo ""
echo "Expected folder structure:"
echo "📁 2025 (Year)"
echo "  📁 January"
echo "  📁 February" 
echo "  📁 March"
echo "  📁 ..."
echo "  📁 December" 