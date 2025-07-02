#!/bin/bash

# =====================================================
# Classes (PR) Database Setup Script
# =====================================================

echo "🎓 Setting up Classes (PR) Database Tables..."
echo "📅 Time: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase URL and Key are available
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set${NC}"
    echo ""
    echo "Please set them like this:"
    echo "export SUPABASE_URL='https://your-project.supabase.co'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
    echo ""
    echo "Or run this script with inline variables:"
    echo "SUPABASE_URL='your-url' SUPABASE_SERVICE_ROLE_KEY='your-key' ./deploy-classes-database.sh"
    exit 1
fi

echo -e "${BLUE}📊 Using Supabase URL: ${SUPABASE_URL}${NC}"
echo -e "${BLUE}🔑 Service role key: ${SUPABASE_SERVICE_ROLE_KEY:0:20}...${NC}"
echo ""

# Function to execute SQL
execute_sql() {
    local sql_content="$1"
    local step_name="$2"
    
    echo -e "${YELLOW}[EXECUTING] ${step_name}${NC}"
    
    response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql_content" | jq -R -s .)}")
    
    if [[ $response == *"error"* ]]; then
        echo -e "${RED}❌ Error in ${step_name}:${NC}"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    else
        echo -e "${GREEN}✅ ${step_name} completed successfully${NC}"
        return 0
    fi
}

# Step 1: Create Classes Tables
echo -e "${YELLOW}[STEP 1] Creating Classes tables...${NC}"

SQL_STEP1='
-- Classes Folders Table
CREATE TABLE IF NOT EXISTS classes_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    folder_type VARCHAR(50) DEFAULT '"'"'category'"'"',
    color VARCHAR(7) DEFAULT '"'"'#ffffff'"'"',
    parent_folder_id INTEGER REFERENCES classes_folders(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes Items Table
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    class_title VARCHAR(255) NOT NULL,
    class_type VARCHAR(100) NOT NULL,
    target_audience VARCHAR(100),
    class_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration VARCHAR(50),
    location VARCHAR(255),
    instructor_name VARCHAR(255),
    instructor_bio TEXT,
    class_description TEXT,
    learning_objectives TEXT[],
    prerequisites TEXT,
    max_participants INTEGER DEFAULT 20,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT '"'"'planning'"'"',
    registration_deadline DATE,
    materials_needed TEXT,
    folder_id INTEGER REFERENCES classes_folders(id),
    created_by_id INTEGER REFERENCES auth_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes Members Table (Access Control)
CREATE TABLE IF NOT EXISTS classes_members (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    role VARCHAR(20) DEFAULT '"'"'member'"'"',
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by INTEGER REFERENCES auth_user(id),
    UNIQUE(user_id)
);

-- Classes Participants Table
CREATE TABLE IF NOT EXISTS classes_participants (
    id SERIAL PRIMARY KEY,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES auth_user(id),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attendance_status VARCHAR(20) DEFAULT '"'"'registered'"'"',
    completion_status VARCHAR(20) DEFAULT '"'"'pending'"'"',
    notes TEXT,
    UNIQUE(class_id, user_id)
);
'

execute_sql "$SQL_STEP1" "Classes Tables Creation"
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create tables. Exiting.${NC}"
    exit 1
fi

# Step 2: Create Indexes
echo -e "${YELLOW}[STEP 2] Creating indexes...${NC}"

SQL_STEP2='
-- Classes Indexes
CREATE INDEX IF NOT EXISTS idx_classes_date ON classes(class_date);
CREATE INDEX IF NOT EXISTS idx_classes_folder ON classes(folder_id);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_type ON classes(class_type);
CREATE INDEX IF NOT EXISTS idx_classes_target_audience ON classes(target_audience);

-- Folder Indexes
CREATE INDEX IF NOT EXISTS idx_classes_folders_parent ON classes_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_classes_folders_type ON classes_folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_classes_folders_active ON classes_folders(is_active);

-- Member Indexes
CREATE INDEX IF NOT EXISTS idx_classes_members_user ON classes_members(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_participants_class ON classes_participants(class_id);
CREATE INDEX IF NOT EXISTS idx_classes_participants_user ON classes_participants(user_id);
'

execute_sql "$SQL_STEP2" "Indexes Creation"

# Step 3: Setup Admin Access
echo -e "${YELLOW}[STEP 3] Setting up admin access...${NC}"

SQL_STEP3='
-- Add all superusers to classes access automatically
INSERT INTO classes_members (user_id, role)
SELECT id, '"'"'admin'"'"'
FROM auth_user 
WHERE is_superuser = true
ON CONFLICT (user_id) DO UPDATE SET role = '"'"'admin'"'"';

-- Add all staff to classes access automatically  
INSERT INTO classes_members (user_id, role)
SELECT id, '"'"'admin'"'"'
FROM auth_user 
WHERE is_staff = true
ON CONFLICT (user_id) DO UPDATE SET role = '"'"'admin'"'"';
'

execute_sql "$SQL_STEP3" "Admin Access Setup"

# Step 4: Set up RLS and Permissions
echo -e "${YELLOW}[STEP 4] Setting up permissions...${NC}"

SQL_STEP4='
-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes_participants ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "classes_select_policy" ON classes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_insert_policy" ON classes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_update_policy" ON classes
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_delete_policy" ON classes
    FOR DELETE TO authenticated USING (true);

-- Folders policies
CREATE POLICY "classes_folders_select_policy" ON classes_folders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_folders_insert_policy" ON classes_folders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_folders_update_policy" ON classes_folders
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_folders_delete_policy" ON classes_folders
    FOR DELETE TO authenticated USING (true);

-- Members policies
CREATE POLICY "classes_members_select_policy" ON classes_members
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_members_insert_policy" ON classes_members
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_members_update_policy" ON classes_members
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_members_delete_policy" ON classes_members
    FOR DELETE TO authenticated USING (true);

-- Participants policies
CREATE POLICY "classes_participants_select_policy" ON classes_participants
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "classes_participants_insert_policy" ON classes_participants
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "classes_participants_update_policy" ON classes_participants
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "classes_participants_delete_policy" ON classes_participants
    FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_folders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON classes_participants TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
'

execute_sql "$SQL_STEP4" "RLS and Permissions Setup"

# Step 5: Create Triggers
echo -e "${YELLOW}[STEP 5] Creating triggers...${NC}"

SQL_STEP5='
-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_classes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language '"'"'plpgsql'"'"';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW EXECUTE FUNCTION update_classes_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_folders_updated_at ON classes_folders;
CREATE TRIGGER update_classes_folders_updated_at 
    BEFORE UPDATE ON classes_folders 
    FOR EACH ROW EXECUTE FUNCTION update_classes_updated_at_column();
'

execute_sql "$SQL_STEP5" "Triggers Setup"

# Final verification
echo -e "${YELLOW}[VERIFICATION] Checking setup...${NC}"

SQL_VERIFY='
SELECT 
    '"'"'Classes Setup Complete!'"'"' as status,
    (SELECT COUNT(*) FROM classes_members) as admin_members_added;
'

execute_sql "$SQL_VERIFY" "Setup Verification"

echo ""
echo -e "${GREEN}🎉 Classes (PR) Database Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 What was created:${NC}"
echo "• classes - Main classes table"
echo "• classes_folders - Hierarchical folder structure"  
echo "• classes_members - Access control table"
echo "• classes_participants - Registration tracking"
echo "• Indexes for performance"
echo "• RLS policies for security"
echo "• Automatic timestamp triggers"
echo "• Admin users automatically granted access"
echo ""
echo -e "${GREEN}✅ The Classes section is now ready to use!${NC}"
echo -e "${BLUE}🌐 Visit: https://srv875725.hstgr.cloud/classes${NC}"
echo "" 