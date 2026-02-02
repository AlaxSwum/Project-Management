#!/bin/bash

# Deploy Multiple Assignees Database Changes
# This script applies the necessary database changes to support multiple assignees

echo "🗄️ Deploying Multiple Assignees Database Changes..."
echo "📅 Time: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANT: This script needs to be run manually in Supabase SQL Editor${NC}"
echo ""
echo "📋 STEPS TO DEPLOY DATABASE CHANGES:"
echo ""
echo "1. Open your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Navigate to your project (Project Management)"
echo "3. Go to SQL Editor (left sidebar)"
echo "4. Create a new query and paste the following SQL:"
echo ""
echo "------- COPY THE SQL BELOW -------"
cat create_task_assignees_table.sql
echo ""
echo "------- END OF SQL -------"
echo ""
echo "5. Click 'Run' to execute the SQL"
echo "6. Verify the changes were applied successfully"
echo ""
echo -e "${GREEN}✅ After running the SQL, your database will support:${NC}"
echo "   • Multiple assignees per task"
echo "   • Automatic synchronization between assignee_ids array and task_assignees table"
echo "   • Backwards compatibility with existing single assignee functionality"
echo "   • Proper many-to-many relationship structure"
echo ""
echo -e "${YELLOW}📝 Note: The frontend code is already updated to work with this structure${NC}"
echo ""

# Check if we have database connection info
if [ -f "frontend/.env.production" ]; then
    echo -e "${GREEN}🔗 Database connection info found in frontend/.env.production${NC}"
    echo "You can use the same database credentials from your environment file"
else
    echo -e "${YELLOW}⚠️  Make sure you're applying this to the correct Supabase project${NC}"
fi

echo ""
echo "After applying the database changes, test by:"
echo "1. Creating a new task with multiple assignees"
echo "2. Editing an existing task to add/remove assignees"
echo "3. Verifying the assignee display works correctly"
echo ""
echo -e "${GREEN}🚀 Ready to deploy database changes!${NC}" 