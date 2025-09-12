#!/bin/bash

echo "🗄️ Setting up Content Calendar Database..."
echo "📅 Time: $(date)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SUPABASE_URL="https://bayyefskgflbyyuwrlgm.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJheXllZnNrZ2ZsYnl5dXdybGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyNTg0MzAsImV4cCI6MjA2NTgzNDQzMH0.eTr2bOWOO7N7hzRR45qapeQ6V-u2bgV5BbQygZZgGGM"

# Step 1: Disable RLS
echo -e "${YELLOW}[STEP 1] Disabling RLS for Content Calendar tables...${NC}"
echo "Manually executing SQL commands via Supabase dashboard:"
echo ""
echo "1. Go to https://bayyefskgflbyyuwrlgm.supabase.co/project/bayyefskgflbyyuwrlgm/sql/new"
echo "2. Copy and paste the following SQL:"
echo ""
echo "-- Disable RLS and grant permissions"
echo "ALTER TABLE content_calendar DISABLE ROW LEVEL SECURITY;"
echo "ALTER TABLE content_calendar_members DISABLE ROW LEVEL SECURITY;"
echo "DROP POLICY IF EXISTS content_calendar_policy ON content_calendar;"
echo "DROP POLICY IF EXISTS content_calendar_members_policy ON content_calendar_members;"
echo "GRANT ALL ON content_calendar TO anon;"
echo "GRANT ALL ON content_calendar_members TO anon;"
echo "GRANT USAGE, SELECT ON content_calendar_id_seq TO anon;"
echo "GRANT USAGE, SELECT ON content_calendar_members_id_seq TO anon;"
echo "GRANT SELECT ON auth_user TO anon;"
echo ""
echo -e "${GREEN}✅ Step 1 commands listed above${NC}"
echo ""

# Step 2: Create folder tables
echo -e "${YELLOW}[STEP 2] Creating Content Calendar folder tables...${NC}"
echo "Copy and paste the following SQL:"
echo ""
cat temp_create_folders.sql
echo ""
echo -e "${GREEN}✅ Step 2 commands listed above${NC}"
echo ""

# Step 3: Insert default data
echo -e "${YELLOW}[STEP 3] Inserting default folder structure...${NC}"
echo "Copy and paste the following SQL:"
echo ""
cat temp_default_folders.sql
echo ""
echo -e "${GREEN}✅ Step 3 commands listed above${NC}"
echo ""

# Step 4: Create views
echo -e "${YELLOW}[STEP 4] Creating database views...${NC}"
echo "Copy and paste the following SQL:"
echo ""
cat temp_create_views.sql
echo ""
echo -e "${GREEN}✅ Step 4 commands listed above${NC}"
echo ""

echo -e "${GREEN}🎉 Database setup instructions complete!${NC}"
echo ""
echo "📋 MANUAL STEPS REQUIRED:"
echo "1. Open Supabase SQL Editor: https://bayyefskgflbyyuwrlgm.supabase.co/project/bayyefskgflbyyuwrlgm/sql/new"
echo "2. Execute each step's SQL commands in order"
echo "3. Verify tables are created successfully"
echo ""
echo "🔗 After setup, test the Content Calendar at: https://srv875725.hstgr.cloud/content-calendar"
echo ""
echo "Expected folder structure:"
echo "📁 2025 (Year)"
echo "  📁 January"
echo "  📁 February" 
echo "  📁 March"
echo "  📁 ..."
echo "  📁 December" 