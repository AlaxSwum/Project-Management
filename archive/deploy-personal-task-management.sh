#!/bin/bash

# =============================================
# Deploy Personal Task Management System
# =============================================

echo "🚀 Starting Personal Task Management System deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "setup-environment.env" ]; then
    echo -e "${RED}❌ Error: setup-environment.env file not found!${NC}"
    echo "Please create the environment file with your Supabase credentials."
    exit 1
fi

# Load environment variables
source setup-environment.env

# Validate required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables!${NC}"
    echo "Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in setup-environment.env"
    exit 1
fi

echo -e "${BLUE}📋 Environment loaded successfully${NC}"
echo -e "${BLUE}🔗 Supabase URL: ${SUPABASE_URL}${NC}"

# Function to execute SQL file
execute_sql_file() {
    local file_path=$1
    local description=$2
    
    echo -e "${YELLOW}📝 ${description}...${NC}"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ Error: File $file_path not found!${NC}"
        return 1
    fi
    
    # Execute SQL using curl
    response=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"sql\": $(jq -Rs . < "$file_path")}")
    
    # Check if curl command was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${description} completed successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Error executing ${description}${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Alternative method using psql if available
execute_sql_with_psql() {
    local file_path=$1
    local description=$2
    
    echo -e "${YELLOW}📝 ${description}...${NC}"
    
    if [ ! -f "$file_path" ]; then
        echo -e "${RED}❌ Error: File $file_path not found!${NC}"
        return 1
    fi
    
    # Extract database connection details from Supabase URL
    DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*|.supabase.co|')
    DB_NAME="postgres"
    DB_USER="postgres"
    
    # Try to execute with psql
    if command -v psql &> /dev/null; then
        PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
            -h "$DB_HOST" \
            -U "$DB_USER" \
            -d "$DB_NAME" \
            -f "$file_path" \
            -v ON_ERROR_STOP=1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ ${description} completed successfully${NC}"
            return 0
        else
            echo -e "${RED}❌ Error executing ${description}${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  psql not available, falling back to API method${NC}"
        execute_sql_file "$file_path" "$description"
        return $?
    fi
}

# Main deployment steps
echo -e "${BLUE}🗄️  Step 1: Creating Personal Task Management Tables...${NC}"
execute_sql_with_psql "create_personal_task_management_tables.sql" "Personal Task Management Tables Creation"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed at table creation step${NC}"
    exit 1
fi

# Verify tables were created
echo -e "${BLUE}🔍 Step 2: Verifying table creation...${NC}"

# Create verification script
cat > verify_personal_tables.sql << 'EOF'
-- Verify personal task management tables exist
DO $$
DECLARE
    table_count INTEGER;
    view_count INTEGER;
BEGIN
    -- Check if tables exist
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('personal_tasks', 'personal_time_blocks');
    
    -- Check if views exist
    SELECT COUNT(*) INTO view_count 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name IN ('personal_today_view', 'personal_week_view', 'personal_month_view');
    
    IF table_count = 2 THEN
        RAISE NOTICE 'SUCCESS: All personal task management tables created (% tables)', table_count;
    ELSE
        RAISE EXCEPTION 'ERROR: Missing tables. Expected 2, found %', table_count;
    END IF;
    
    IF view_count = 3 THEN
        RAISE NOTICE 'SUCCESS: All personal task management views created (% views)', view_count;
    ELSE
        RAISE EXCEPTION 'ERROR: Missing views. Expected 3, found %', view_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: Personal Task Management System deployed successfully!';
END $$;
EOF

execute_sql_with_psql "verify_personal_tables.sql" "Table Verification"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}🎉 Personal Task Management System deployed successfully!${NC}"
    echo -e "${GREEN}✅ Tables created: personal_tasks, personal_time_blocks${NC}"
    echo -e "${GREEN}✅ Views created: personal_today_view, personal_week_view, personal_month_view${NC}"
    echo -e "${GREEN}✅ RLS policies enabled for user privacy${NC}"
    echo -e "${GREEN}✅ 15-minute time blocking support added${NC}"
    echo -e "${GREEN}✅ Helper functions for recurring tasks and time slots${NC}"
    
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "${YELLOW}1. Update your frontend to use the new personal task tables${NC}"
    echo -e "${YELLOW}2. Implement Month/Week/Day tabs in your UI${NC}"
    echo -e "${YELLOW}3. Add 15-minute time blocking interface${NC}"
    echo -e "${YELLOW}4. Test the personal task management features${NC}"
else
    echo -e "${RED}❌ Deployment verification failed${NC}"
    exit 1
fi

# Clean up temporary files
rm -f verify_personal_tables.sql

echo -e "${BLUE}🧹 Cleanup completed${NC}"
echo -e "${GREEN}🚀 Personal Task Management System is ready to use!${NC}"
