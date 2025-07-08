#!/bin/bash

echo "🚀 Deploying Personal Calendar Database Schema to Supabase"
echo "📅 Time: $(date)"
echo "🔧 This will create all necessary tables and policies for the personal calendar"
echo

# Print the SQL content with instructions
echo "📋 Please run the following SQL in your Supabase SQL Editor:"
echo
echo "----------------------------------------"
cat create_personal_calendar_tables.sql
echo "----------------------------------------"
echo
echo "📝 Instructions:"
echo "1. Go to https://supabase.com/dashboard/project/[your-project]/sql"
echo "2. Copy and paste the SQL above"
echo "3. Click 'RUN' to execute the schema update"
echo
echo "🌐 After running the SQL, your personal calendar will be ready to use at:"
echo "    https://srv875725.hstgr.cloud/my-personal"
echo
echo "✅ Frontend is deployed - run the SQL to complete the setup!" 