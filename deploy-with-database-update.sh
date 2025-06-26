#!/bin/bash

echo "🚀 Deployment with Database Schema Update to Hostinger"
echo "📅 Time: $(date)"
echo "🔧 This will deploy code changes AND update database schema"
echo ""

# Deploy code changes first
ssh root@srv875725.hstgr.cloud << 'EOF'
set -e

echo "📍 Navigating to project directory..."
cd /var/www/project_management

echo "⬇️ Pulling latest changes..."
git pull origin main

echo "📁 Entering frontend directory..."
cd frontend

echo "⏸️ Stopping Next.js service..."
systemctl stop nextjs-pm

echo "🔨 Building application..."
npm run build

echo "▶️ Starting Next.js service..."
systemctl start nextjs-pm

echo "✅ Code deployment completed!"

EOF

echo ""
echo "🗄️ Now updating database schema for attendee_ids column..."
echo "📋 Please run the following SQL in your Supabase SQL Editor:"
echo ""
echo "----------------------------------------"
cat << 'SQL'
-- Add attendee_ids column to projects_meeting table for proper attendee assignment
-- This enables users to be assigned to meetings via ID array instead of just string names

-- Check if column exists and add it if not
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'projects_meeting' 
        AND column_name = 'attendee_ids'
    ) THEN
        ALTER TABLE projects_meeting 
        ADD COLUMN attendee_ids integer[];
        
        COMMENT ON COLUMN projects_meeting.attendee_ids IS 'Array of user IDs assigned as attendees to this meeting';
        
        RAISE NOTICE 'Added attendee_ids column to projects_meeting table';
    ELSE
        RAISE NOTICE 'attendee_ids column already exists in projects_meeting table';
    END IF;
END $$;

-- Create index for efficient querying of attendee assignments
CREATE INDEX IF NOT EXISTS idx_projects_meeting_attendee_ids 
ON projects_meeting USING gin(attendee_ids);

COMMENT ON INDEX idx_projects_meeting_attendee_ids IS 'GIN index for efficient attendee_ids array queries';

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects_meeting' 
AND column_name IN ('attendees', 'attendee_ids')
ORDER BY column_name;
SQL
echo "----------------------------------------"
echo ""
echo "📝 Instructions:"
echo "1. Go to https://supabase.com/dashboard/project/[your-project]/sql"
echo "2. Copy and paste the SQL above"
echo "3. Click 'RUN' to execute the schema update"
echo ""
echo "🌐 Application deployed at: https://srv875725.hstgr.cloud"
echo "⚠️  Note: Meeting attendee assignment will work better after running the SQL update"
echo ""
echo "✅ Deployment completed - run the SQL to complete the update!" 